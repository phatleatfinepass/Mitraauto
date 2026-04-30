import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendOrderConfirmationEmail } from "../_shared/order_email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYTRAIL_SECRET_KEY =
  Deno.env.get("PAYTRAIL_SECRET_KEY") ??
  Deno.env.get("PAYTRAIL_MERCHANT_SECRET") ??
  Deno.env.get("PAYTRAIL_SECRET") ??
  "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function hmacHex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyQuerySignature(params: URLSearchParams) {
  const signature = params.get("signature") ?? "";
  if (!signature || !PAYTRAIL_SECRET_KEY) return false;

  const signingPayload = Array.from(params.entries())
    .filter(([key]) => key.startsWith("checkout-"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("\n") + "\n";

  const expected = await hmacHex(PAYTRAIL_SECRET_KEY, signingPayload);
  return expected.toLowerCase() === signature.toLowerCase();
}

function parseOrderId(reference: string | null, stamp: string | null) {
  const ref = reference?.trim() ?? "";
  if (ref.startsWith("ORDER-")) return ref.slice("ORDER-".length);
  return stamp?.trim() || null;
}

async function readCallbackParams(req: Request, url: URL) {
  const params = new URLSearchParams(url.search);
  if (req.method !== "POST") return params;

  const contentType = req.headers.get("content-type") ?? "";
  const bodyText = await req.text().catch(() => "");
  if (!bodyText) return params;

  if (contentType.includes("application/json")) {
    const body = JSON.parse(bodyText);
    if (body && typeof body === "object") {
      for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
        if (!params.has(key) && value !== null && value !== undefined) {
          params.set(key, String(value));
        }
      }
    }
    return params;
  }

  const bodyParams = new URLSearchParams(bodyText);
  for (const [key, value] of bodyParams.entries()) {
    if (!params.has(key)) params.set(key, value);
  }
  return params;
}

function normalizeStatus(status: string | null) {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "ok") return "ok";
  if (normalized === "fail" || normalized === "failed" || normalized === "cancelled" || normalized === "canceled") {
    return "failed";
  }
  if (normalized === "pending" || normalized === "delayed") return normalized;
  return normalized || "unknown";
}

async function updateOrder(orderId: string | null, params: Record<string, string>, signatureValid: boolean) {
  if (!orderId) return null;

  const incomingStatus = normalizeStatus(params["checkout-status"] ?? null);
  let paytrailStatus = incomingStatus;
  const patch: Record<string, unknown> = {
    status: paytrailStatus === "ok" ? "paid" : paytrailStatus === "failed" ? "cancelled" : "pending_payment",
    paytrail_status: paytrailStatus,
    paytrail_transaction_id: params["checkout-transaction-id"] ?? null,
    paytrail_reference: params["checkout-reference"] ?? null,
    paytrail_stamp: params["checkout-stamp"] ?? null,
    paytrail_provider: params["checkout-provider"] ?? null,
  };

  const { data: existing } = await supabase
    .from("orders")
    .select("cart_snapshot, paytrail_status")
    .eq("id", orderId)
    .maybeSingle();

  const snapshot = typeof existing?.cart_snapshot === "object" && existing.cart_snapshot
    ? existing.cart_snapshot
    : {};
  const existingPaytrailStatus = normalizeStatus(existing?.paytrail_status ?? null);
  const existingSnapshotStatus = normalizeStatus((snapshot as any)?.payment_status ?? null);
  const existingSnapshotPaytrailStatus = normalizeStatus((snapshot as any)?.paytrail?.status ?? null);
  const wasAlreadyPaid = [existingPaytrailStatus, existingSnapshotStatus, existingSnapshotPaytrailStatus]
    .some((status) => status === "ok" || status === "paid" || status === "purchased" || status === "success");

  if (wasAlreadyPaid && paytrailStatus === "failed") {
    paytrailStatus = existingPaytrailStatus === "unknown" ? "ok" : existingPaytrailStatus;
  }

  patch.status = paytrailStatus === "ok" ? "paid" : paytrailStatus === "failed" ? "cancelled" : "pending_payment";
  patch.paytrail_status = paytrailStatus;

  patch.cart_snapshot = {
    ...snapshot,
    payment_method: "paytrail",
    payment_status: paytrailStatus === "ok" ? "purchased" : paytrailStatus === "failed" ? "fail" : paytrailStatus,
    paytrail: {
      ...(snapshot as any)?.paytrail,
      signature_valid: signatureValid,
      status: paytrailStatus,
      incoming_status: incomingStatus,
      transaction_id: params["checkout-transaction-id"] ?? null,
      provider: params["checkout-provider"] ?? null,
      amount_cents: params["checkout-amount"] ? Number(params["checkout-amount"]) : null,
      updated_at: new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from("orders")
    .update(patch)
    .eq("id", orderId);

  if (error) throw error;
  return patch;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const callbackParams = await readCallbackParams(req, url);
    const params = Object.fromEntries(callbackParams.entries());
    const signatureValid = await verifyQuerySignature(callbackParams);
    const status = normalizeStatus(params["checkout-status"] ?? null);
    const orderId = parseOrderId(params["checkout-reference"] ?? null, params["checkout-stamp"] ?? null);

    if (!signatureValid) {
      await supabase.from("payment_events").insert({
        order_id: orderId,
        source: "paytrail",
        event_type: "invalid_signature",
        ext_transaction_id: params["checkout-transaction-id"] ?? null,
        ext_stamp: params["checkout-stamp"] ?? null,
        ext_status: status,
        payload: params,
        signature_valid: false,
      });

      return jsonResponse({ error: "invalid_signature" }, 401);
    }

    const update = await updateOrder(orderId, params, signatureValid);

    await supabase.from("payment_events").insert({
      order_id: orderId,
      source: "paytrail",
      event_type: status === "ok" ? "payment_ok" : status === "failed" ? "payment_failed" : `payment_${status}`,
      ext_transaction_id: params["checkout-transaction-id"] ?? null,
      ext_stamp: params["checkout-stamp"] ?? null,
      ext_status: status,
      payload: params,
      signature_valid: true,
    });

    if (orderId && (status === "ok" || status === "failed")) {
      try {
        await sendOrderConfirmationEmail(orderId);
      } catch (emailError) {
        console.error("Order confirmation email failed", emailError);
      }
    }

    return jsonResponse({
      ok: true,
      order_id: orderId,
      status,
      updated: Boolean(update),
    });
  } catch (error) {
    console.error("payments_paytrail_webhook failed", error);
    return jsonResponse({
      error: "webhook_failed",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
