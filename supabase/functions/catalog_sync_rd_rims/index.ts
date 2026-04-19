import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// RengasDuo / Latakko API envs
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
    if (!stats || stats.product_type !== "rim") continue;
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
    console.warn("[catalog_sync_rd_rims] RD token appears expired at", data.expires_at);
  }
  return data.access_token;
}
async function fetchRDRims(token) {
  if (!RD_BASE_URL) {
    throw {
      where: "fetch",
      message: "RD_BASE_URL missing"
    };
  }
  const base = RD_BASE_URL.endsWith("/") ? RD_BASE_URL.slice(0, -1) : RD_BASE_URL;
  const url = base + "/api/Articles" + "?OnlyStockItems=false" + "&OnlyLocalStockItems=false" + "&IncludeCarTyres=false" + "&IncludeMotorcycleTyres=false" + "&IncludeTruckTyres=false" + "&IncludeEarthmoverTyres=false" + "&IncludeAlloyRims=true" + "&IncludeSteelRims=true" + "&IncludeAccessories=false" + "&IncludeOils=false" + "&IncludeBatteries=false";
  console.log("[RD_RIMS] Fetch URL", url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });
  if (!res.ok) {
    throw {
      where: "fetch",
      message: "RD fetch rims failed",
      status: res.status,
      text: await res.text()
    };
  }
  return await res.json();
}
serve(async (req)=>{
  const startedAt = new Date();
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  // Parse page param and paging indices
  const urlObj = new URL(req.url);
  const pageParam = urlObj.searchParams.get("page");
  const PAGE_SIZE = MAX_ROWS;
  const stats = {
    product_type: "rim",
    total_articles: 0,
    total_available: 0,
    page: 1,
    page_size: PAGE_SIZE,
    updated: 0,
    skipped: 0,
    errors: 0,
    error_samples: []
  };
  try {
    // 1) Load current RD token from DB + fetch
    const token = await getCurrentRDToken(sb);
    console.log("[TEST] RD_TOKEN_FROM_DB:", {
      preview: token.length > 20 ? token.slice(0, 10) + "..." + token.slice(-10) : token,
      fetched_at: new Date().toISOString()
    });
    console.log("[TEST] RD_FETCH_START:", {
      product_type: "rim",
      time: new Date().toISOString()
    });
    const rawJson = await fetchRDRims(token);
    console.log("[TEST] RD_FETCH_SUCCESS:", {
      product_type: "rim",
      time: new Date().toISOString()
    });
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
    const page = Number.isFinite(Number(pageParam)) && Number(pageParam) > 0 ? Number(pageParam) : await getAutoPage(sb, totalAvailable);
    const sliceStart = (page - 1) * PAGE_SIZE;
    const sliceEnd = sliceStart + PAGE_SIZE;
    const pageArticles = articles.slice(sliceStart, sliceEnd);
    // Filter for rim-like candidates based on fields and group/name
    const rimCandidates = pageArticles.filter((raw)=>{
      const a = raw ?? {};
      const hasRimFields = a.BoltCircle != null || a.NumberOfBolts != null || a.Offset != null || a.CenterBore != null;
      const group = String(a.MainGroupName ?? "").toLowerCase();
      const name = (String(a.ArticleText ?? "") + " " + String(a.ArticleName ?? "")).toLowerCase();
      const looksLikeRim = group.includes("vanne") || // Finnish "rim"
      group.includes("wheel") || group.includes("felg") || // Scandinavian / German variants
      name.includes("vanne") || name.includes("wheel") || name.includes("felg");
      return hasRimFields || looksLikeRim;
    });
    console.log("[RD_RIMS] Page stats:", {
      page,
      page_size: PAGE_SIZE,
      total_available: totalAvailable,
      page_articles: pageArticles.length,
      rim_candidates: rimCandidates.length
    });
    stats.total_available = totalAvailable;
    stats.total_articles = rimCandidates.length;
    if (rimCandidates.length === 0) {
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
    const nowIso = new Date().toISOString();
    // Preload existing checksums for this batch of external_ids to avoid unnecessary writes
    const externalIds: string[] = [];
    for (const article of rimCandidates) {
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
        .eq("product_type", "rim")
        .in("external_id", externalIds);

      if (existingErr) {
        console.warn("[RD_RIMS] Failed to load existing checksums", existingErr);
      } else if (existingRows) {
        for (const row of existingRows as any[]) {
          if (row.external_id && row.checksum) {
            existingMap.set(String(row.external_id), String(row.checksum));
          }
        }
      }
    }

    const rows: any[] = [];
    for (const article of rimCandidates) {
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
          product_type: "rim",
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
    console.error("catalog_sync_rd_rims_fatal", err);
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
