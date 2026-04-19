import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const limit = Math.min(Number(body?.limit ?? 20) || 20, 100);
    const envOnly = body?.envOnly === true;

    if (envOnly) {
      return new Response(JSON.stringify({
        env: {
          RD_AUTH_URL: Deno.env.get("RD_AUTH_URL") ?? null,
          RD_BASE_URL: Deno.env.get("RD_BASE_URL") ?? null,
          RENGASDUO_API_BASE: Deno.env.get("RENGASDUO_API_BASE") ?? null,
        },
      }, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }

    const [
      tokenResult,
      syncRunsResult,
      tireRawResult,
      rimRawResult,
      tireOfferResult,
      rimOfferResult,
    ] = await Promise.all([
      supabase
        .from("supplier_tokens")
        .select("supplier_code, issued_at, expires_at")
        .eq("supplier_code", "RD")
        .maybeSingle(),
      supabase
        .from("supplier_sync_runs")
        .select("supplier_code, sync_type, status, started_at, finished_at, stats")
        .eq("supplier_code", "RD")
        .order("started_at", { ascending: false })
        .limit(limit),
      supabase
        .from("supplier_products_raw")
        .select("external_id, fetched_at", { count: "exact" })
        .eq("supplier_code", "RD")
        .eq("product_type", "tire")
        .order("fetched_at", { ascending: false })
        .limit(5),
      supabase
        .from("supplier_products_raw")
        .select("external_id, fetched_at", { count: "exact" })
        .eq("supplier_code", "RD")
        .eq("product_type", "rim")
        .order("fetched_at", { ascending: false })
        .limit(5),
      supabase
        .from("catalog_supplier_offers")
        .select("id, supplier_external_id, last_seen_at", { count: "exact" })
        .eq("supplier_code", "RD")
        .order("last_seen_at", { ascending: false })
        .limit(5),
      supabase
        .from("products_search")
        .select("variant_id, product_type, supplier_code_best, supplier_external_id_best, updated_at", { count: "exact" })
        .eq("supplier_code_best", "RD")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const errors = [
      tokenResult.error,
      syncRunsResult.error,
      tireRawResult.error,
      rimRawResult.error,
      tireOfferResult.error,
      rimOfferResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      throw errors[0];
    }

    return new Response(JSON.stringify({
      env: {
        RD_AUTH_URL: Deno.env.get("RD_AUTH_URL") ?? null,
        RD_BASE_URL: Deno.env.get("RD_BASE_URL") ?? null,
        RENGASDUO_API_BASE: Deno.env.get("RENGASDUO_API_BASE") ?? null,
      },
      token: tokenResult.data,
      sync_runs: syncRunsResult.data ?? [],
      supplier_products_raw: {
        tires_count: tireRawResult.count ?? null,
        tires_latest: tireRawResult.data ?? [],
        rims_count: rimRawResult.count ?? null,
        rims_latest: rimRawResult.data ?? [],
      },
      catalog_supplier_offers: {
        count: tireOfferResult.count ?? null,
        latest: tireOfferResult.data ?? [],
      },
      products_search_rd: {
        count: rimOfferResult.count ?? null,
        latest: rimOfferResult.data ?? [],
      },
    }, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    const payload =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : typeof error === "object" && error !== null
          ? error
          : { message: String(error) };

    return new Response(JSON.stringify({
      error: payload,
    }, null, 2), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }
});
