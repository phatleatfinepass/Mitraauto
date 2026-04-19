import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// RengasDuo / Latakko API env
const RD_BASE_URL = Deno.env.get("RD_BASE_URL") ?? "";
// Limits for safety
const MAX_ROWS = Number(Deno.env.get("IMPORT_MAX_ROWS") ?? 5000);
const UPSERT_BATCH_SIZE = Number(Deno.env.get("IMPORT_UPSERT_BATCH_SIZE") ?? 500);
const SUPPLIER_CODE = "RD";
function toErr(e) {
  if (e instanceof Error) return {
    message: e.message,
    stack: e.stack
  };
  try {
    return typeof e === "string" ? JSON.parse(e) : e;
  } catch  {
  /* ignore */ }
  if (typeof e === "object" && e) return e;
  return {
    message: String(e)
  };
}
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b)=>b.toString(16).padStart(2, "0")).join("");
}
async function upsertInChunks(sb, rows) {
  for(let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE){
    const chunk = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { error } = await sb.from("supplier_products_raw").upsert(chunk, {
      onConflict: "supplier_code,external_id"
    });
    if (error) {
      throw {
        where: "upsert:supplier_products_raw",
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        chunk_start: i,
        chunk_size: chunk.length
      };
    }
  }
}
async function getAutoPage(sb, totalAvailable) {
  const totalPages = Math.max(1, Math.ceil(totalAvailable / MAX_ROWS));
  const { data, error } = await sb.from("supplier_sync_runs").select("stats").eq("supplier_code", SUPPLIER_CODE).eq("sync_type", "full").order("started_at", {
    ascending: false
  }).limit(20);
  if (error || !data) {
    return 1;
  }
  for (const row of data) {
    const stats = row?.stats;
    if (!stats || stats.product_type !== "tire") continue;
    const prevPage = Number(stats.page);
    if (!Number.isFinite(prevPage) || prevPage < 1) break;
    return prevPage >= totalPages ? 1 : prevPage + 1;
  }
  return 1;
}
// Helper: read current RD token from supplier_tokens (managed by refresh_rd_token_db)
async function getCurrentRDToken(sb) {
  const { data, error } = await sb.from("supplier_tokens").select("access_token, expires_at").eq("supplier_code", SUPPLIER_CODE).maybeSingle();
  if (error) {
    throw {
      where: "auth",
      message: "Failed to load RD token from DB",
      details: error.message,
      code: error.code
    };
  }
  if (!data?.access_token) {
    throw {
      where: "auth",
      message: "No RD token stored in supplier_tokens for supplier_code = RD"
    };
  }
  // Optional warning if token appears expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.warn("[catalog_sync_rd_tires] RD token appears expired at", data.expires_at);
  }
  return data.access_token;
}
async function fetchRDTires(token) {
  if (!RD_BASE_URL) {
    throw {
      where: "fetch",
      message: "RD_BASE_URL missing"
    };
  }
  const base = RD_BASE_URL.endsWith("/") ? RD_BASE_URL.slice(0, -1) : RD_BASE_URL;
  const url = base + "/api/Articles" + "?OnlyStockItems=false" + "&OnlyLocalStockItems=false" + "&IncludeCarTyres=true" + "&IncludeMotorcycleTyres=true" + "&IncludeTruckTyres=true" + "&IncludeEarthmoverTyres=true" + "&IncludeAlloyRims=false" + "&IncludeSteelRims=false" + "&IncludeAccessories=false" + "&IncludeOils=false" + "&IncludeBatteries=false";
  console.log("[RD_TIRES] Fetch URL", url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    throw {
      where: "fetch",
      message: "RD fetch tires failed",
      status: res.status,
      text: await res.text()
    };
  }
  return await res.json();
}
serve(async (req)=>{
  const startedAt = new Date();
  const url = new URL(req.url);
  const pageParam = url.searchParams.get("page");
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const stats = {
    product_type: "tire",
    total_articles: 0,
    total_available: 0,
    page: 1,
    page_size: MAX_ROWS,
    updated: 0,
    skipped: 0,
    errors: 0,
    error_samples: []
  };
  try {
    // 1) Load current RD token from DB + fetch tires
    const token = await getCurrentRDToken(sb);
    const rawJson = await fetchRDTires(token);
    // Normalize shape to array of articles
    let articles = [];
    if (Array.isArray(rawJson)) {
      articles = rawJson;
    } else if (Array.isArray(rawJson.items)) {
      articles = rawJson.items;
    } else if (Array.isArray(rawJson.Articles)) {
      articles = rawJson.Articles;
    } else {
      throw {
        where: "parse",
        message: "Unexpected RD Articles response shape; expected array"
      };
    }
    const totalAvailable = articles.length;
    const page = pageParam ? Math.max(1, Number(pageParam) || 1) : await getAutoPage(sb, totalAvailable);
    const sliceStart = (page - 1) * MAX_ROWS;
    const sliceEnd = sliceStart + MAX_ROWS;
    const pageArticles = articles.slice(sliceStart, sliceEnd);

    stats.page = page;
    stats.total_available = totalAvailable;
    stats.total_articles = pageArticles.length;

    console.log("[RD_TIRES] Page slice", {
      page,
      page_size: MAX_ROWS,
      total_available: totalAvailable,
      slice_start: sliceStart,
      slice_end: sliceEnd,
      page_articles: pageArticles.length
    });

    if (pageArticles.length === 0) {
      const finishedAt = new Date();
      await sb.from("supplier_sync_runs").insert({
        supplier_code: SUPPLIER_CODE,
        sync_type: "full",
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        status: "success",
        stats
      });
      return new Response(JSON.stringify({
        ok: true,
        supplier: SUPPLIER_CODE,
        status: "success",
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        stats
      }, null, 2), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }

    // Load existing checksums for these external_ids to avoid unnecessary writes
    const externalIds: string[] = [];
    for (const article of pageArticles) {
      const extId =
        article.ArticleId !== undefined && article.ArticleId !== null
          ? String(article.ArticleId)
          : null;
      if (extId) {
        externalIds.push(extId);
      }
    }

    const existingMap = new Map<string, string>();
    if (externalIds.length > 0) {
      const { data: existingRows, error: existingErr } = await sb
        .from("supplier_products_raw")
        .select("external_id, checksum")
        .eq("supplier_code", SUPPLIER_CODE)
        .eq("product_type", "tire")
        .in("external_id", externalIds);

      if (existingErr) {
        console.warn("[RD_TIRES] Failed to load existing checksums", existingErr);
      } else if (existingRows) {
        for (const row of existingRows as any[]) {
          if (row.external_id && row.checksum) {
            existingMap.set(String(row.external_id), String(row.checksum));
          }
        }
      }
    }
    // 2) Normalize into rows for supplier_products_raw using checksum + external_id
    const nowIso = new Date().toISOString();
    const rows: any[] = [];
    for (const article of pageArticles) {
      try {
        const extId =
          article.ArticleId !== undefined && article.ArticleId !== null
            ? String(article.ArticleId)
            : null;
        if (!extId) {
          stats.errors++;
          if (stats.error_samples.length < 5) {
            stats.error_samples.push("Missing ArticleId on one article");
          }
          continue;
        }
        const payload = {
          raw: article,
          fetched_at_iso: nowIso
        };
        const checksum = await sha256(JSON.stringify(payload.raw));
        const prevChecksum = existingMap.get(extId);

        // Skip unchanged rows to reduce Disk I/O
        if (prevChecksum && prevChecksum === checksum) {
          stats.skipped++;
          continue;
        }

        rows.push({
          supplier_code: SUPPLIER_CODE,
          product_type: "tire",
          external_id: extId,
          checksum,
          payload,
          fetched_at: nowIso
        });
      } catch (e: any) {
        stats.errors++;
        if (stats.error_samples.length < 5) {
          stats.error_samples.push(e?.message ?? String(e));
        }
      }
    }
    // 3) Upsert into supplier_products_raw using (supplier_code, external_id)
    if (rows.length > 0) {
      await upsertInChunks(sb, rows);
      stats.updated += rows.length;
    }
    const finishedAt = new Date();
    const status = stats.errors > 0 ? stats.updated > 0 ? "partial" : "failed" : "success";
    const { error: syncErr } = await sb.from("supplier_sync_runs").insert({
      supplier_code: SUPPLIER_CODE,
      sync_type: "full",
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      status,
      stats
    });
    if (syncErr) {
      console.error("Failed to insert supplier_sync_runs row (RD):", syncErr);
    }
    return new Response(JSON.stringify({
      ok: status !== "failed",
      supplier: SUPPLIER_CODE,
      status,
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      stats
    }, null, 2), {
      status: status === "failed" ? 500 : status === "partial" ? 207 : 200,
      headers: {
        "content-type": "application/json"
      }
    });
  } catch (e) {
    const err = toErr(e);
    console.error("catalog_sync_rd_tires_fatal", err);
    const finishedAt = new Date();
    try {
      await sb.from("supplier_sync_runs").insert({
        supplier_code: SUPPLIER_CODE,
        sync_type: "full",
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        status: "failed",
        stats: {
          fatal: err
        }
      });
    } catch (logErr) {
      console.error("failed_to_log_sync_run_rd", logErr);
    }
    return new Response(JSON.stringify(err), {
      status: 500,
      headers: {
        "content-type": "application/json"
      }
    });
  }
});
