import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const VT_FEED_TYRES_URL = Deno.env.get("VANNETUKKU_FEED_TYRES_URL") ?? "";
const VT_TOKEN = Deno.env.get("VANNETUKKU_TOKEN") ?? Deno.env.get("VT_TOKEN") ?? "";
const UPSERT_BATCH_SIZE = Number(Deno.env.get("RAW_TIRE_UPSERT_BATCH_SIZE") ?? 500);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function asErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "object" && error !== null) return error;
  return { message: String(error) };
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!value) return [];
  return Array.isArray(value) ? value as Record<string, unknown>[] : [value as Record<string, unknown>];
}

function findProducts(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of ["Product", "product", "Item", "item"]) {
    if (object[key]) return asArray(object[key]);
  }
  let best: Record<string, unknown>[] = [];
  for (const nested of Object.values(object)) {
    const products = findProducts(nested);
    if (products.length > best.length) best = products;
  }
  return best;
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function toInteger(value: unknown): number | null {
  const number = toNumber(value);
  return number === null ? null : Math.trunc(number);
}

function nestedText(object: Record<string, unknown>, key: string): string | null {
  const value = object[key];
  if (value && typeof value === "object") {
    const nested = value as Record<string, unknown>;
    return toText(nested["#text"] ?? nested.text ?? nested.value);
  }
  return toText(value);
}

function normalizeSeason(value: unknown): string | null {
  const season = String(value ?? "").toLowerCase();
  if (season.includes("summer") || season.includes("kes")) return "summer";
  if (season.includes("winter") || season.includes("talv")) return "winter";
  if (season.includes("all")) return "all_season";
  return toText(value);
}

function buildFeedUrl(): string {
  if (VT_FEED_TYRES_URL) return VT_FEED_TYRES_URL;
  if (VT_TOKEN) return `https://www.vannetukku.fi/wholesale_tyres.php?id=${encodeURIComponent(VT_TOKEN)}`;
  throw { where: "env", message: "VANNETUKKU_FEED_TYRES_URL or VANNETUKKU_TOKEN/VT_TOKEN missing" };
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchVTTires(): Promise<Record<string, unknown>[]> {
  const response = await fetch(buildFeedUrl(), {
    headers: { Accept: "application/xml,text/xml,*/*" },
  });
  if (!response.ok) {
    throw {
      where: "fetch",
      message: "VT tire feed fetch failed",
      status: response.status,
      text: await response.text().catch(() => ""),
    };
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
    textNodeName: "#text",
  });
  const parsed = parser.parse(xml);
  const products = findProducts(parsed);
  if (products.length === 0) {
    throw { where: "parse", message: "No VT tire products found in feed" };
  }
  return products;
}

async function upsertInChunks(sb: any, rows: Record<string, unknown>[]) {
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await sb
      .from("supplier_raw_vt_tires")
      .upsert(chunk, { onConflict: "external_id" });
    if (error) {
      throw {
        where: "upsert:supplier_raw_vt_tires",
        message: error.message,
        details: error.details,
        code: error.code,
        chunk_start: index,
        chunk_size: chunk.length,
      };
    }
  }
}

async function markUnavailable(sb: any, runId: string, nowIso: string): Promise<number> {
  const basePayload = {
    is_available: false,
    unavailable_since: nowIso,
    updated_at: nowIso,
  };

  const nullRun = await sb
    .from("supplier_raw_vt_tires")
    .update(basePayload, { count: "exact" })
    .eq("is_available", true)
    .is("last_run_id", null);
  if (nullRun.error) throw nullRun.error;

  const differentRun = await sb
    .from("supplier_raw_vt_tires")
    .update(basePayload, { count: "exact" })
    .eq("is_available", true)
    .neq("last_run_id", runId);
  if (differentRun.error) throw differentRun.error;

  return (nullRun.count ?? 0) + (differentRun.count ?? 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const startedAt = new Date();
  const { data: run, error: runError } = await sb
    .from("supplier_raw_tire_sync_runs")
    .insert({
      supplier_code: "VT",
      product_type: "tire",
      run_kind: "full",
      status: "running",
      started_at: startedAt.toISOString(),
    })
    .select("id")
    .single();

  if (runError || !run?.id) {
    return new Response(JSON.stringify({
      ok: false,
      step: "create_run",
      error: runError?.message ?? "Missing run id",
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const runId = String(run.id);

  try {
    const products = await fetchVTTires();
    const nowIso = new Date().toISOString();
    const rows = [];

    for (const product of products) {
      const externalId = nestedText(product, "Product_id");
      if (!externalId) continue;
      const euLabel = product.EU_Label && typeof product.EU_Label === "object"
        ? product.EU_Label as Record<string, unknown>
        : {};
      const rawChecksum = await sha256(JSON.stringify(product));

      rows.push({
        external_id: externalId,
        source_sku: nestedText(product, "Code"),
        ean: nestedText(product, "EAN"),
        brand: nestedText(product, "Brand"),
        model: nestedText(product, "Model"),
        size_text: nestedText(product, "Size") ?? nestedText(product, "Measurements"),
        season: normalizeSeason(product.Season),
        width_mm: toNumber(product.Tyre_width),
        aspect_ratio: toNumber(product.Tyre_profile),
        diameter_in: toNumber(product.Tyre_rimsize ?? product.Tyre_diameter),
        load_index: nestedText(product, "LI"),
        speed_index: nestedText(product, "SI"),
        stock_qty: toInteger(product.Available_pcs ?? product.Availability),
        wholesale_price_eur: toNumber(product.Wholesale_price_eur ?? product.Wholesale_price),
        consumer_price_eur: toNumber(product.Consumer_price_eur ?? product.Consumer_price),
        eprel_code: toText(euLabel.EprelCode ?? euLabel.RegisterCode),
        label_json: euLabel,
        image_url: nestedText(product, "Image_Url") ?? nestedText(product, "Image"),
        raw_payload: product,
        raw_checksum: rawChecksum,
        last_seen_at: nowIso,
        fetched_at: nowIso,
        last_run_id: runId,
        is_available: true,
        unavailable_since: null,
        updated_at: nowIso,
      });
    }

    await upsertInChunks(sb, rows);
    const markedUnavailable = await markUnavailable(sb, runId, nowIso);
    const finishedAt = new Date().toISOString();

    const stats = {
      supplier: "VT",
      product_type: "tire",
      fetched_from_feed: products.length,
      rows_prepared: rows.length,
      marked_unavailable: markedUnavailable,
    };

    const { error: finishError } = await sb
      .from("supplier_raw_tire_sync_runs")
      .update({
        status: "success",
        finished_at: finishedAt,
        requested_pages: 1,
        completed_pages: 1,
        expected_total: products.length,
        fetched_total: rows.length,
        upserted_total: rows.length,
        marked_unavailable_total: markedUnavailable,
        stats,
      })
      .eq("id", runId);

    if (finishError) throw finishError;

    return new Response(JSON.stringify({
      ok: true,
      run_id: runId,
      ...stats,
      finished_at: finishedAt,
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (error) {
    const payload = asErrorPayload(error);
    await sb
      .from("supplier_raw_tire_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_count: 1,
        error: payload,
      })
      .eq("id", runId);

    return new Response(JSON.stringify({
      ok: false,
      run_id: runId,
      error: payload,
    }, null, 2), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
