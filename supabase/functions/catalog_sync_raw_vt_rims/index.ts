import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4.5.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";
const VT_FEED_WHEELS_URL = Deno.env.get("VANNETUKKU_FEED_WHEELS_URL") ??
  Deno.env.get("VANNETUKKU_FEED_RIMS_URL") ?? "";
const VT_TOKEN = Deno.env.get("VANNETUKKU_TOKEN") ?? Deno.env.get("VT_TOKEN") ??
  "";
const UPSERT_BATCH_SIZE = Number(
  Deno.env.get("RAW_RIM_UPSERT_BATCH_SIZE") ?? 500,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  return Array.isArray(value)
    ? value as Record<string, unknown>[]
    : [value as Record<string, unknown>];
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
  const normalized = String(value).replace(",", ".");
  const numericText = normalized.match(/-?\d+(?:\.\d+)?/)?.[0];
  if (!numericText) return null;
  const number = Number(numericText);
  return Number.isFinite(number) ? number : null;
}

function toInteger(value: unknown): number | null {
  const number = toNumber(value);
  return number === null ? null : Math.trunc(number);
}

function nestedText(
  object: Record<string, unknown>,
  key: string,
): string | null {
  const value = object[key];
  if (value && typeof value === "object") {
    const nested = value as Record<string, unknown>;
    return toText(nested["#text"] ?? nested.text ?? nested.value);
  }
  return toText(value);
}

function toBoolean(value: unknown): boolean | null {
  const text = toText(value);
  if (!text) return null;
  const normalized = text.toLowerCase();
  if (
    ["1", "true", "yes", "y", "kylla", "kyllä", "included"].includes(normalized)
  ) return true;
  if (["0", "false", "no", "n", "ei", "not included"].includes(normalized)) {
    return false;
  }
  return null;
}

function formatDecimal(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(value).replace(".", ",");
}

function parseBoltPattern(value: unknown): {
  bolt_count: number | null;
  bolt_circle: number | null;
  bolt_pattern: string | null;
} {
  const text = toText(value);
  if (!text) return { bolt_count: null, bolt_circle: null, bolt_pattern: null };
  const normalized = text.toLowerCase().replace(/\s+/g, "").replace("*", "x");
  const match = normalized.match(/^(\d+)x(\d+(?:[,.]\d+)?)$/);
  if (!match) {
    return { bolt_count: null, bolt_circle: null, bolt_pattern: normalized };
  }
  const boltCount = Number(match[1]);
  const boltCircle = toNumber(match[2]);
  return {
    bolt_count: Number.isFinite(boltCount) ? boltCount : null,
    bolt_circle: boltCircle,
    bolt_pattern: boltCircle === null
      ? normalized
      : `${boltCount}x${formatDecimal(boltCircle)}`,
  };
}

function materialFromText(...values: unknown[]): string | null {
  const text = values.map((value) => String(value ?? "")).join(" ")
    .toLowerCase();
  if (
    text.includes("steel") || text.includes("pelti") || text.includes("teräs")
  ) return "steel";
  if (
    text.includes("alloy") || text.includes("alu") ||
    text.includes("kevytmetalli")
  ) return "alloy";
  return null;
}

function buildFeedUrl(): string {
  if (VT_FEED_WHEELS_URL) return VT_FEED_WHEELS_URL;
  if (VT_TOKEN) {
    return `https://www.vannetukku.fi/wholesale_wheels.php?id=${
      encodeURIComponent(VT_TOKEN)
    }`;
  }
  throw {
    where: "env",
    message: "VANNETUKKU_FEED_WHEELS_URL or VANNETUKKU_TOKEN/VT_TOKEN missing",
  };
}

function imageUrlFromName(value: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://images.vannetukku.fi/images/${encodeURIComponent(value)}`;
}

function galleryFromExtraImages(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => imageUrlFromName(toText(item))).filter(
      Boolean,
    ) as string[];
  }
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const candidates = object.ExtraImage ?? object.Image ?? object.image ??
      object["#text"];
    if (Array.isArray(candidates)) {
      return candidates.map((item) => imageUrlFromName(toText(item))).filter(
        Boolean,
      ) as string[];
    }
    const image = imageUrlFromName(toText(candidates));
    return image ? [image] : [];
  }
  const image = imageUrlFromName(toText(value));
  return image ? [image] : [];
}

function stockFromAvailability(
  product: Record<string, unknown>,
): number | null {
  const direct = toInteger(product.Available_pcs ?? product.Availability);
  if (direct !== null) return direct;
  const availability = product.Availability;
  if (!availability || typeof availability !== "object") return null;
  const availabilityObject = availability as Record<string, unknown>;
  const warehouse = availabilityObject.Warehouse;
  if (Array.isArray(warehouse)) {
    return warehouse.reduce(
      (sum, item) =>
        sum + (toInteger((item as Record<string, unknown>).Quantity) ?? 0),
      0,
    );
  }
  if (warehouse && typeof warehouse === "object") {
    return toInteger((warehouse as Record<string, unknown>).Quantity);
  }
  return null;
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchVTRims(): Promise<Record<string, unknown>[]> {
  const response = await fetch(buildFeedUrl(), {
    headers: { Accept: "application/xml,text/xml,*/*" },
  });
  if (!response.ok) {
    throw {
      where: "fetch",
      message: "VT rim feed fetch failed",
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
    throw { where: "parse", message: "No VT rim products found in feed" };
  }
  return products;
}

async function upsertInChunks(sb: any, rows: Record<string, unknown>[]) {
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await sb
      .from("supplier_raw_vt_rims")
      .upsert(chunk, { onConflict: "external_id" });
    if (error) {
      throw {
        where: "upsert:supplier_raw_vt_rims",
        message: error.message,
        details: error.details,
        code: error.code,
        chunk_start: index,
        chunk_size: chunk.length,
      };
    }
  }
}

async function markUnavailable(
  sb: any,
  runId: string,
  nowIso: string,
): Promise<number> {
  const basePayload = {
    is_available: false,
    unavailable_since: nowIso,
    updated_at: nowIso,
  };

  const nullRun = await sb
    .from("supplier_raw_vt_rims")
    .update(basePayload, { count: "exact" })
    .eq("is_available", true)
    .is("last_run_id", null);
  if (nullRun.error) throw nullRun.error;

  const differentRun = await sb
    .from("supplier_raw_vt_rims")
    .update(basePayload, { count: "exact" })
    .eq("is_available", true)
    .neq("last_run_id", runId);
  if (differentRun.error) throw differentRun.error;

  return (nullRun.count ?? 0) + (differentRun.count ?? 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const startedAt = new Date();
  const { data: run, error: runError } = await sb
    .from("supplier_raw_rim_sync_runs")
    .insert({
      supplier_code: "VT",
      product_type: "rim",
      run_kind: "full",
      status: "running",
      started_at: startedAt.toISOString(),
    })
    .select("id")
    .single();

  if (runError || !run?.id) {
    return new Response(
      JSON.stringify(
        {
          ok: false,
          step: "create_run",
          error: runError?.message ?? "Missing run id",
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }

  const runId = String(run.id);

  try {
    const products = await fetchVTRims();
    const nowIso = new Date().toISOString();
    const rows = [];

    for (const product of products) {
      const externalId = nestedText(product, "Product_id");
      if (!externalId) continue;
      const pcd = parseBoltPattern(product.PCD);
      const imageName = nestedText(product, "Image") ??
        nestedText(product, "Image_name");
      const imageUrl = nestedText(product, "Image_Url") ??
        imageUrlFromName(imageName);
      const gallery = galleryFromExtraImages(product.ExtraImages);
      const rawChecksum = await sha256(JSON.stringify(product));

      rows.push({
        external_id: externalId,
        source_sku: nestedText(product, "Code"),
        ean: nestedText(product, "EAN"),
        brand: nestedText(product, "Brand"),
        model: nestedText(product, "Model"),
        description: nestedText(product, "Description"),
        size_text: nestedText(product, "Size") ??
          nestedText(product, "Measurements"),
        width_in: toNumber(
          nestedText(product, "Rim_width") ?? nestedText(product, "Width"),
        ),
        rim_diameter_in: toNumber(
          nestedText(product, "Rim_diameter") ??
            nestedText(product, "Diameter"),
        ),
        bolt_count: pcd.bolt_count,
        bolt_circle: pcd.bolt_circle,
        bolt_pattern: pcd.bolt_pattern,
        et_offset_mm: toNumber(product.ET),
        center_bore_mm: toNumber(product.CB),
        color: nestedText(product, "Color"),
        finish: nestedText(product, "Finish"),
        material: materialFromText(
          product.Material,
          product.Description,
          product.Category,
        ),
        bolts_included: toBoolean(product.Bolts_included),
        winter_approved: toBoolean(product.Winter),
        wheel_load_kg: toNumber(product.Wheel_load),
        stock_qty: stockFromAvailability(product),
        wholesale_price_eur: toNumber(
          product.Wholesale_price_eur ?? product.Wholesale_price,
        ),
        consumer_price_eur: toNumber(
          product.Consumer_price_eur ?? product.Consumer_price,
        ),
        freight_class: nestedText(product, "FreightClass") ??
          nestedText(product, "Freight_class"),
        image_name: imageName,
        image_url: imageUrl,
        gallery,
        supplier_metadata_json: {
          category: nestedText(product, "Category"),
          availability: product.Availability ?? null,
          raw_extra_images: product.ExtraImages ?? null,
        },
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
      product_type: "rim",
      fetched_from_feed: products.length,
      rows_prepared: rows.length,
      marked_unavailable: markedUnavailable,
    };

    const { error: finishError } = await sb
      .from("supplier_raw_rim_sync_runs")
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

    return new Response(
      JSON.stringify(
        {
          ok: true,
          run_id: runId,
          ...stats,
          finished_at: finishedAt,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  } catch (error) {
    const payload = asErrorPayload(error);
    await sb
      .from("supplier_raw_rim_sync_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_count: 1,
        error: payload,
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify(
        {
          ok: false,
          run_id: runId,
          error: payload,
        },
        null,
        2,
      ),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      },
    );
  }
});
