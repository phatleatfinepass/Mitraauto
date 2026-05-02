import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RD_BASE_URL = Deno.env.get("RD_BASE_URL") ?? "";
const DEFAULT_PAGE_SIZE = Number(Deno.env.get("RAW_RD_TIRE_PAGE_SIZE") ?? 10000);
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

function seasonFromGroup(raw: Record<string, unknown>): string | null {
  const group = String(raw.MainGroupName ?? "").toLowerCase();
  if (group.includes("all season") || group.includes("ympärivuot")) return "all_season";
  if (group.includes("kitka") || group.includes("talv") || group.includes("nast")) return "winter";
  if (group.includes("kes")) return "summer";
  return null;
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getCurrentRDToken(sb: any): Promise<string> {
  const { data, error } = await sb
    .from("supplier_tokens")
    .select("access_token, expires_at")
    .eq("supplier_code", "RD")
    .maybeSingle();

  if (error) throw { where: "auth", message: error.message, code: error.code };
  if (!data?.access_token) {
    throw { where: "auth", message: "No RD token stored in supplier_tokens for supplier_code=RD" };
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw { where: "auth", message: `RD token expired at ${data.expires_at}` };
  }
  return String(data.access_token);
}

async function fetchRDTires(token: string): Promise<Record<string, unknown>[]> {
  if (!RD_BASE_URL) throw { where: "env", message: "RD_BASE_URL missing" };
  const base = RD_BASE_URL.endsWith("/") ? RD_BASE_URL.slice(0, -1) : RD_BASE_URL;
  const url = base + "/api/Articles" +
    "?OnlyStockItems=false" +
    "&OnlyLocalStockItems=false" +
    "&IncludeCarTyres=true" +
    "&IncludeMotorcycleTyres=true" +
    "&IncludeTruckTyres=true" +
    "&IncludeEarthmoverTyres=true" +
    "&IncludeAlloyRims=false" +
    "&IncludeSteelRims=false" +
    "&IncludeAccessories=false" +
    "&IncludeOils=false" +
    "&IncludeBatteries=false";

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw {
      where: "fetch",
      message: "RD tire fetch failed",
      status: response.status,
      text: await response.text().catch(() => ""),
    };
  }

  const payload = await response.json();
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.Articles)) return payload.Articles;
  throw { where: "parse", message: "Unexpected RD Articles response shape" };
}

async function upsertInChunks(sb: any, rows: Record<string, unknown>[]) {
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await sb
      .from("supplier_raw_rd_tires")
      .upsert(chunk, { onConflict: "external_id" });
    if (error) {
      throw {
        where: "upsert:supplier_raw_rd_tires",
        message: error.message,
        details: error.details,
        code: error.code,
        chunk_start: index,
        chunk_size: chunk.length,
      };
    }
  }
}

async function markUnavailableBefore(sb: any, batchStartIso: string, nowIso: string): Promise<number> {
  const basePayload = {
    is_available: false,
    unavailable_since: nowIso,
    updated_at: nowIso,
  };

  const stale = await sb
    .from("supplier_raw_rd_tires")
    .update(basePayload, { count: "exact" })
    .eq("is_available", true)
    .lt("last_seen_at", batchStartIso);
  if (stale.error) throw stale.error;

  return stale.count ?? 0;
}

async function successfulPagesForBatch(sb: any, batchKey: string): Promise<Set<number>> {
  const { data, error } = await sb
    .from("supplier_raw_tire_sync_runs")
    .select("stats")
    .eq("supplier_code", "RD")
    .eq("product_type", "tire")
    .eq("status", "success");
  if (error) throw error;

  const pages = new Set<number>();
  for (const row of data ?? []) {
    const stats = row?.stats ?? {};
    if (stats.batch_key !== batchKey) continue;
    const page = Number(stats.page);
    if (Number.isFinite(page) && page > 0) pages.add(page);
  }
  return pages;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const requestUrl = new URL(req.url);
  const pageParam = requestUrl.searchParams.get("page");
  const page = pageParam ? Math.max(1, Number(pageParam) || 1) : 1;
  const pageSize = Math.max(1, Number(requestUrl.searchParams.get("page_size") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE);
  const finalize = requestUrl.searchParams.get("finalize") === "true" || !pageParam;
  const batchKey = requestUrl.searchParams.get("batch_key") ?? new Date().toISOString().slice(0, 10);
  const batchDate = batchKey.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? new Date().toISOString().slice(0, 10);
  const batchStartIso = `${batchDate}T00:00:00.000Z`;
  const startedAt = new Date();
  const { data: run, error: runError } = await sb
    .from("supplier_raw_tire_sync_runs")
    .insert({
      supplier_code: "RD",
      product_type: "tire",
      run_kind: pageParam ? "page" : "full",
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
    const token = await getCurrentRDToken(sb);
    const articles = await fetchRDTires(token);
    const totalPages = Math.max(1, Math.ceil(articles.length / pageSize));
    const sliceStart = (page - 1) * pageSize;
    const sliceEnd = sliceStart + pageSize;
    const pageArticles = articles.slice(sliceStart, sliceEnd);
    const nowIso = new Date().toISOString();
    const rows = [];

    for (const article of pageArticles) {
      const externalId = toText(article.ArticleId);
      if (!externalId) continue;
      const rawChecksum = await sha256(JSON.stringify(article));
      rows.push({
        external_id: externalId,
        source_sku: toText(article.ManufacturerArticleId),
        ean: toText(article.EAN),
        brand: toText(article.BrandName),
        model: toText(article.PatternModelText),
        size_text: toText(article.ArticleText),
        season: seasonFromGroup(article),
        width_mm: toNumber(article.Width),
        aspect_ratio: toNumber(article.AspectRatio),
        diameter_in: toNumber(article.Diameter),
        load_index: toText(article.LoadIndex),
        speed_index: toText(article.SpeedIndex),
        stock_qty: toInteger(article.QuantityAvailable),
        wholesale_price_eur: toNumber(article.NetPrice ?? article.Price),
        consumer_price_eur: toNumber(article.RetailPrice),
        label_json: {
          eprel_id: toText(article.EPRELId),
          fuel_efficiency: toText(article.FuelEffiency),
          wet_grip: toText(article.WetGrip),
          noise_class: toText(article.NoiceClass),
          noise_value: toNumber(article.NoiceValue),
          snow_grip: article.SnowGrip ?? null,
          ice_grip: article.IceGrip ?? null,
        },
        image_url: null,
        raw_payload: article,
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
    const finishedAt = new Date().toISOString();

    const stats = {
      supplier: "RD",
      product_type: "tire",
      batch_key: batchKey,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      fetched_from_api: articles.length,
      page_articles: pageArticles.length,
      rows_prepared: rows.length,
      finalize_requested: finalize,
    };

    const { error: finishError } = await sb
      .from("supplier_raw_tire_sync_runs")
      .update({
        status: "success",
        finished_at: finishedAt,
        requested_pages: totalPages,
        completed_pages: 1,
        expected_total: articles.length,
        fetched_total: rows.length,
        upserted_total: rows.length,
        stats,
      })
      .eq("id", runId);

    if (finishError) throw finishError;

    let markedUnavailable = 0;
    let finalizeStatus = "not_requested";
    if (finalize) {
      const successfulPages = await successfulPagesForBatch(sb, batchKey);
      const missingPages = [];
      for (let expectedPage = 1; expectedPage <= totalPages; expectedPage++) {
        if (!successfulPages.has(expectedPage)) missingPages.push(expectedPage);
      }

      if (missingPages.length === 0) {
        markedUnavailable = await markUnavailableBefore(sb, batchStartIso, new Date().toISOString());
        finalizeStatus = "completed";
      } else {
        finalizeStatus = "skipped_missing_pages";
      }

      await sb
        .from("supplier_raw_tire_sync_runs")
        .update({
          marked_unavailable_total: markedUnavailable,
          stats: {
            ...stats,
            finalize_status: finalizeStatus,
            missing_pages: missingPages,
            marked_unavailable: markedUnavailable,
          },
        })
        .eq("id", runId);
    }

    return new Response(JSON.stringify({
      ok: true,
      run_id: runId,
      ...stats,
      finalize_status: finalizeStatus,
      marked_unavailable: markedUnavailable,
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
