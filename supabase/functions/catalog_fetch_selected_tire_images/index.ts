import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RD_BASE_URL = Deno.env.get("RD_BASE_URL") ?? "";
const DEFAULT_LIMIT = Number(Deno.env.get("CATALOG_IMAGE_FETCH_BATCH_SIZE") ?? 100);
const MAX_LIMIT = Number(Deno.env.get("CATALOG_IMAGE_FETCH_MAX_BATCH_SIZE") ?? 300);
const MAX_IMAGE_BYTES = Number(Deno.env.get("CATALOG_IMAGE_FETCH_MAX_BYTES") ?? 8 * 1024 * 1024);
const PRODUCT_IMAGE_BUCKET = Deno.env.get("CATALOG_IMAGE_STORAGE_BUCKET") ?? "product-images";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type ImageQueueRow = {
  id: string;
  selected_item_id: string;
  source_supplier: "RD" | "VT";
  source_external_id: string | null;
  source_image_id: string | null;
  source_url: string | null;
  source_key: string;
  storage_bucket: string | null;
  storage_path: string | null;
  checksum: string | null;
  status: string;
  fetch_attempts: number | null;
};

function asErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === "object" && error !== null) return error;
  return { message: String(error) };
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeSupplier(value: string | null): "RD" | "VT" | "all" {
  const normalized = (value ?? "all").trim().toUpperCase();
  if (normalized === "RD" || normalized === "VT") return normalized;
  return "all";
}

function extensionForContentType(contentType: string | null, fallbackUrl: string): string {
  const cleanType = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (cleanType === "image/jpeg" || cleanType === "image/jpg") return "jpg";
  if (cleanType === "image/png") return "png";
  if (cleanType === "image/webp") return "webp";
  if (cleanType === "image/gif") return "gif";
  if (cleanType === "image/svg+xml") return "svg";

  try {
    const pathname = new URL(fallbackUrl).pathname;
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
    if (match) return match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  } catch {
    // Keep jpg fallback below.
  }

  return "jpg";
}

function buildVersionedStoragePath(row: ImageQueueRow, checksum: string, contentType: string | null, sourceUrl: string): string {
  const ext = extensionForContentType(contentType, sourceUrl);
  const supplier = row.source_supplier.toLowerCase();
  const sourceId = (row.source_external_id ?? row.source_image_id ?? row.id)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 80);
  return `supplier/tires/${row.selected_item_id}/${supplier}-${sourceId}-${checksum.slice(0, 16)}.${ext}`;
}

function publicUrlFor(bucket: string, path: string): string {
  const base = SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
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

function rdImageUrl(imageId: string): string {
  if (!RD_BASE_URL) throw { where: "env", message: "RD_BASE_URL missing" };
  const base = RD_BASE_URL.endsWith("/") ? RD_BASE_URL.slice(0, -1) : RD_BASE_URL;
  return `${base}/api/ArticleImages/${encodeURIComponent(imageId)}`;
}

async function fetchImage(row: ImageQueueRow, rdToken: string | null): Promise<{
  sourceUrl: string;
  buffer: ArrayBuffer;
  contentType: string | null;
}> {
  const sourceUrl = row.source_supplier === "RD"
    ? rdImageUrl(String(row.source_image_id ?? ""))
    : String(row.source_url ?? "");

  if (!sourceUrl || sourceUrl === "null") {
    throw { where: "source", message: "Missing image source URL/id" };
  }

  const headers: Record<string, string> = { Accept: "image/*,*/*;q=0.8" };
  if (row.source_supplier === "RD") {
    if (!rdToken) throw { where: "auth", message: "Missing RD token" };
    headers.Authorization = `Bearer ${rdToken}`;
  }

  const response = await fetch(sourceUrl, { headers });
  if (!response.ok) {
    throw {
      where: "fetch",
      message: "Image fetch failed",
      supplier: row.source_supplier,
      status: response.status,
      source_url: sourceUrl,
      text: await response.text().catch(() => ""),
    };
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    throw {
      where: "content_type",
      message: "Fetched response is not an image",
      supplier: row.source_supplier,
      content_type: contentType,
      source_url: sourceUrl,
    };
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw {
      where: "content_length",
      message: "Image is too large",
      max_bytes: MAX_IMAGE_BYTES,
      content_length: contentLength,
      source_url: sourceUrl,
    };
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw {
      where: "byte_size",
      message: "Image is too large",
      max_bytes: MAX_IMAGE_BYTES,
      byte_size: buffer.byteLength,
      source_url: sourceUrl,
    };
  }

  return { sourceUrl, buffer, contentType };
}

async function loadQueue(sb: any, supplier: "RD" | "VT" | "all", limit: number): Promise<ImageQueueRow[]> {
  let query = sb
    .from("catalog_selected_item_images")
    .select("id,selected_item_id,source_supplier,source_external_id,source_image_id,source_url,source_key,storage_bucket,storage_path,checksum,status,fetch_attempts")
    .eq("product_type", "tire")
    .eq("is_active", true)
    .in("status", ["pending_source_fetch", "external_ready", "failed"])
    .lt("fetch_attempts", 5)
    .order("is_primary_candidate", { ascending: false })
    .order("last_seen_at", { ascending: false })
    .limit(limit);

  if (supplier !== "all") query = query.eq("source_supplier", supplier);

  const { data, error } = await query;
  if (error) throw { where: "load_queue", message: error.message, code: error.code };
  return (data ?? []) as ImageQueueRow[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const requestUrl = new URL(req.url);
  const supplier = normalizeSupplier(requestUrl.searchParams.get("supplier"));
  const dryRun = requestUrl.searchParams.get("dry_run") === "true";
  const limit = Math.max(1, Math.min(
    Number(requestUrl.searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT,
    MAX_LIMIT,
  ));

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await sb
    .from("catalog_selected_item_image_runs")
    .insert({
      product_type: "tire",
      run_kind: "fetch_batch",
      status: "running",
      started_at: startedAt,
      stats: { supplier, limit, dry_run: dryRun },
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
  let queue: ImageQueueRow[] = [];
  const samples: unknown[] = [];
  let fetchedTotal = 0;
  let failedTotal = 0;
  let skippedTotal = 0;
  let changedTotal = 0;
  let unchangedTotal = 0;
  let rdToken: string | null = null;

  try {
    queue = await loadQueue(sb, supplier, limit);
    if (queue.some((row) => row.source_supplier === "RD")) {
      rdToken = await getCurrentRDToken(sb);
    }

    for (const row of queue) {
      const attemptCount = Number(row.fetch_attempts ?? 0) + 1;
      const nowIso = new Date().toISOString();

      if (dryRun) {
        skippedTotal++;
        if (samples.length < 10) {
          samples.push({
            id: row.id,
            supplier: row.source_supplier,
            source_image_id: row.source_image_id,
            source_url: row.source_url,
            status: row.status,
          });
        }
        continue;
      }

      await sb
        .from("catalog_selected_item_images")
        .update({
          status: "fetching",
          fetch_attempts: attemptCount,
          last_fetch_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", row.id);

      try {
        const fetched = await fetchImage(row, rdToken);
        const checksum = await sha256(fetched.buffer);
        const bucket = row.storage_bucket || PRODUCT_IMAGE_BUCKET;
        const storagePath = buildVersionedStoragePath(row, checksum, fetched.contentType, fetched.sourceUrl);
        const sourceChanged = row.checksum !== null && row.checksum !== checksum;
        const sourceUnchanged = row.checksum === checksum;

        if (!sourceUnchanged || row.status !== "stored") {
          const { error: uploadError } = await sb.storage
            .from(bucket)
            .upload(storagePath, fetched.buffer, {
              cacheControl: "31536000",
              contentType: fetched.contentType ?? "image/jpeg",
              upsert: true,
            });

          if (uploadError) {
            throw {
              where: "storage_upload",
              message: uploadError.message,
              bucket,
              storage_path: storagePath,
            };
          }
        }

        const publicUrl = publicUrlFor(bucket, storagePath);
        const { error: updateError } = await sb
          .from("catalog_selected_item_images")
          .update({
            status: "stored",
            storage_bucket: bucket,
            storage_path: storagePath,
            public_url: publicUrl,
            source_url: row.source_supplier === "RD" ? fetched.sourceUrl : row.source_url,
            fetched_at: nowIso,
            last_fetch_at: nowIso,
            content_type: fetched.contentType,
            byte_size: fetched.buffer.byteLength,
            checksum,
            error: null,
            metadata_json: {
              fetch_run_id: runId,
              source_changed: sourceChanged,
              source_unchanged: sourceUnchanged,
              fetched_source_url: fetched.sourceUrl,
            },
            updated_at: nowIso,
          })
          .eq("id", row.id);

        if (updateError) throw { where: "update_row", message: updateError.message, code: updateError.code };

        fetchedTotal++;
        if (sourceChanged) changedTotal++;
        if (sourceUnchanged) unchangedTotal++;
        if (samples.length < 10) {
          samples.push({
            id: row.id,
            supplier: row.source_supplier,
            source_image_id: row.source_image_id,
            storage_path: storagePath,
            changed: sourceChanged,
            unchanged: sourceUnchanged,
          });
        }
      } catch (error) {
        failedTotal++;
        const payload = asErrorPayload(error);
        await sb
          .from("catalog_selected_item_images")
          .update({
            status: attemptCount >= 5 ? "skipped" : "failed",
            error: payload,
            last_fetch_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", row.id);

        if (samples.length < 10) {
          samples.push({ id: row.id, supplier: row.source_supplier, error: payload });
        }
      }
    }

    const finishedAt = new Date().toISOString();
    const status = failedTotal > 0 && fetchedTotal > 0 ? "partial" : failedTotal > 0 ? "failed" : "success";
    const stats = {
      supplier,
      limit,
      dry_run: dryRun,
      queued_total: queue.length,
      skipped_total: skippedTotal,
      changed_total: changedTotal,
      unchanged_total: unchangedTotal,
      sample: samples,
    };

    await sb
      .from("catalog_selected_item_image_runs")
      .update({
        status,
        finished_at: finishedAt,
        fetched_total: fetchedTotal,
        failed_total: failedTotal,
        stats,
      })
      .eq("id", runId);

    return new Response(JSON.stringify({
      ok: status !== "failed",
      run_id: runId,
      status,
      queued_total: queue.length,
      fetched_total: fetchedTotal,
      failed_total: failedTotal,
      skipped_total: skippedTotal,
      changed_total: changedTotal,
      unchanged_total: unchangedTotal,
      sample: samples,
      finished_at: finishedAt,
    }, null, 2), {
      status: status === "failed" ? 500 : 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (error) {
    const payload = asErrorPayload(error);
    await sb
      .from("catalog_selected_item_image_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        failed_total: queue.length,
        error: payload,
        stats: { supplier, limit, dry_run: dryRun, queued_total: queue.length, sample: samples },
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
