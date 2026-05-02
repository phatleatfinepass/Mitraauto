import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYTRAIL_API_BASE = (Deno.env.get("PAYTRAIL_API_BASE") ?? "https://services.paytrail.com").replace(/\/+$/, "");
const PAYTRAIL_MERCHANT_ID =
  Deno.env.get("PAYTRAIL_MERCHANT_ID") ??
  Deno.env.get("PAYTRAIL_ACCOUNT") ??
  "";
const PAYTRAIL_SECRET_KEY =
  Deno.env.get("PAYTRAIL_SECRET_KEY") ??
  Deno.env.get("PAYTRAIL_MERCHANT_SECRET") ??
  Deno.env.get("PAYTRAIL_SECRET") ??
  "";
const SITE_URL = (Deno.env.get("SITE_URL") ?? Deno.env.get("BOOKING_SITE_URL") ?? "https://www.mitra-auto.fi").replace(/\/+$/, "");
const FUNCTIONS_URL = `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1`;
const PAYTRAIL_WEBHOOK_URL =
  Deno.env.get("PAYTRAIL_WEBHOOK_URL") ??
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/payments_paytrail_webhook` : "");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function htmlResponse(title: string, body: string, status = 200) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("x-content-type-options", "nosniff");
  return new Response(new TextEncoder().encode(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="content-type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#111827;margin:0;padding:32px}.card{max-width:560px;margin:10vh auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px;box-shadow:0 12px 36px rgba(15,23,42,.08)}h1{font-size:24px;margin:0 0 12px}.muted{color:#64748b}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.button{background:#f97316;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;display:inline-block}.button.secondary{background:#111827}a{color:#f97316}</style></head><body><div class="card">${body}</div></body></html>`), {
    status,
    headers,
  });
}

function redirect(location: string) {
  return new Response(null, {
    status: 303,
    headers: { ...corsHeaders, Location: location },
  });
}

function invoiceStatusUrl(status: string, documentNumber: unknown) {
  const url = new URL(`${SITE_URL}/catalog`);
  url.searchParams.set("invoice_payment", status);
  if (documentNumber) url.searchParams.set("invoice", String(documentNumber));
  return url.toString();
}

function money(cents: number) {
  return `EUR ${((Number(cents) || 0) / 100).toFixed(2)}`;
}

async function hmacHex(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeStatus(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "ok" || normalized === "paid" || normalized === "purchased" || normalized === "success") return "paid";
  if (normalized === "fail" || normalized === "failed" || normalized === "cancelled" || normalized === "canceled") return "failed";
  if (normalized === "pending" || normalized === "delayed") return "pending";
  return normalized;
}

async function signPaytrailRequest(headers: Record<string, string>, body: string) {
  const signingPayload = Object.entries(headers)
    .filter(([key]) => key.startsWith("checkout-"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("\n") + `\n${body}`;

  return hmacHex(PAYTRAIL_SECRET_KEY, signingPayload);
}

function cleanString(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

async function loadInvoiceByToken(token: string) {
  const tokenHash = await sha256Hex(token);
  const { data: accessToken, error: tokenError } = await supabase
    .from("invoice_payment_access_tokens")
    .select("id, document_id, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle<any>();
  if (tokenError) throw tokenError;
  if (!accessToken || accessToken.status !== "active") throw new Error("Invalid or revoked payment link");
  if (accessToken.expires_at && new Date(accessToken.expires_at).getTime() < Date.now()) throw new Error("Payment link expired");

  await supabase
    .from("invoice_payment_access_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", accessToken.id);

  const [{ data: document, error: docError }, { data: parties, error: partiesError }, { data: lines, error: linesError }, { data: payment, error: paymentError }] = await Promise.all([
    supabase.from("invoice_documents").select("*").eq("id", accessToken.document_id).maybeSingle<any>(),
    supabase.from("invoice_parties").select("*").eq("document_id", accessToken.document_id),
    supabase.from("invoice_lines").select("*").eq("document_id", accessToken.document_id).order("line_number", { ascending: true }),
    supabase.from("invoice_payment_details").select("*").eq("document_id", accessToken.document_id).maybeSingle<any>(),
  ]);
  if (docError) throw docError;
  if (partiesError) throw partiesError;
  if (linesError) throw linesError;
  if (paymentError) throw paymentError;
  if (!document) throw new Error("Invoice not found");

  return {
    accessToken,
    document,
    parties: parties ?? [],
    lines: lines ?? [],
    payment,
  };
}

async function findActivePaymentLink(documentId: string) {
  const { data, error } = await supabase
    .from("invoice_payment_links")
    .select("*")
    .eq("document_id", documentId)
    .in("payment_status", ["created", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<any>();
  if (error) throw error;
  if (!data?.payment_link_url) return null;
  if (data.payment_link_expires_at && new Date(data.payment_link_expires_at).getTime() <= Date.now()) {
    await supabase.from("invoice_payment_links").update({ payment_status: "expired" }).eq("id", data.id);
    return null;
  }
  return data;
}

async function reloadInvoicePayment(documentId: string) {
  const [{ data: document, error: docError }, { data: payment, error: paymentError }] = await Promise.all([
    supabase.from("invoice_documents").select("id, document_number, status, total_cents, paid_cents").eq("id", documentId).maybeSingle<any>(),
    supabase.from("invoice_payment_details").select("payment_status").eq("document_id", documentId).maybeSingle<any>(),
  ]);
  if (docError) throw docError;
  if (paymentError) throw paymentError;
  return { document, payment };
}

async function createPaytrailPayment(invoice: Awaited<ReturnType<typeof loadInvoiceByToken>>, token: string) {
  if (!PAYTRAIL_MERCHANT_ID || !PAYTRAIL_SECRET_KEY) throw new Error("Paytrail is not configured");

  const buyer = invoice.parties.find((party: any) => party.role === "buyer") ?? {};
  const document = invoice.document;
  const amount = Math.max(0, Number(document.total_cents ?? 0) - Number(document.paid_cents ?? 0));
  if (amount <= 0) throw new Error("Invoice has no payable balance");

  const { data: linkRow, error: linkError } = await supabase
    .from("invoice_payment_links")
    .insert({
      document_id: document.id,
      payment_status: "created",
      amount_cents: amount,
      currency: document.currency ?? "EUR",
      payment_link_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("*")
    .single<any>();
  if (linkError) throw linkError;

  const items = invoice.lines.length > 0
    ? invoice.lines.map((line: any) => ({
      unitPrice: Number(line.unit_price_incl_vat_cents ?? 0),
      units: Math.max(1, Number(line.quantity ?? 1)),
      vatPercentage: Number(line.vat_rate ?? 25.5),
      productCode: cleanString(line.sku || line.ean || `line-${line.line_number}`, 100),
      description: cleanString(line.title || `Invoice line ${line.line_number}`, 1000),
    }))
    : [{
      unitPrice: amount,
      units: 1,
      vatPercentage: 25.5,
      productCode: cleanString(document.document_number, 100),
      description: cleanString(`Invoice ${document.document_number}`, 1000),
    }];

  const lineTotal = items.reduce((sum: number, item: any) => sum + Math.round(Number(item.unitPrice) * Number(item.units)), 0);
  const hasDecimalQuantity = items.some((item: any) => !Number.isInteger(Number(item.units)));
  if (hasDecimalQuantity || lineTotal !== amount) {
    items.splice(0, items.length, {
      unitPrice: amount,
      units: 1,
      vatPercentage: 25.5,
      productCode: cleanString(document.document_number, 100),
      description: cleanString(`Invoice ${document.document_number}`, 1000),
    });
  }

  const returnUrl = `${FUNCTIONS_URL}/invoice_start_payment?token=${encodeURIComponent(token)}&return=1`;
  const body = JSON.stringify({
    stamp: linkRow.id,
    reference: `INVOICE-${document.id}`,
    amount,
    currency: document.currency ?? "EUR",
    language: String(document.language ?? "fi").toUpperCase(),
    items,
    customer: {
      email: cleanString(buyer.email, 200) || undefined,
      firstName: cleanString(buyer.name, 50) || undefined,
    },
    redirectUrls: {
      success: returnUrl,
      cancel: returnUrl,
    },
    callbackUrls: PAYTRAIL_WEBHOOK_URL ? {
      success: PAYTRAIL_WEBHOOK_URL,
      cancel: PAYTRAIL_WEBHOOK_URL,
    } : undefined,
  });

  const headers: Record<string, string> = {
    "checkout-account": PAYTRAIL_MERCHANT_ID,
    "checkout-algorithm": "sha256",
    "checkout-method": "POST",
    "checkout-nonce": crypto.randomUUID(),
    "checkout-timestamp": new Date().toISOString(),
    "content-type": "application/json; charset=utf-8",
    "platform-name": "mitraauto-invoice",
  };
  headers.signature = await signPaytrailRequest(headers, body);

  const response = await fetch(`${PAYTRAIL_API_BASE}/payments`, { method: "POST", headers, body });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    await supabase.from("invoice_payment_links").update({
      payment_status: "failed",
      payload: { create_error: data, status: response.status },
    }).eq("id", linkRow.id);
    throw new Error(data?.meta?.message ?? data?.message ?? "Paytrail rejected the invoice payment");
  }

  const { error: updateError } = await supabase.from("invoice_payment_links").update({
    payment_status: "pending",
    payment_link_url: data.href ?? null,
    paytrail_transaction_id: data.transactionId ?? null,
    paytrail_reference: data.reference ?? `INVOICE-${document.id}`,
    paytrail_stamp: linkRow.id,
    payload: { paytrail: data },
  }).eq("id", linkRow.id);
  if (updateError) throw updateError;

  await supabase.from("invoice_payment_details").upsert({
    document_id: document.id,
    payment_status: "pending",
    payment_provider: "paytrail",
    payment_method: "online",
    transaction_id: data.transactionId ?? null,
    reference_number: data.reference ?? `INVOICE-${document.id}`,
    due_date: document.due_date ?? null,
    payload: { latest_payment_link_id: linkRow.id },
  }, { onConflict: "document_id" });

  await supabase.from("invoice_events").insert({
    document_id: document.id,
    event_type: "payment_link_created",
    actor: "edge_function",
    payload: { payment_link_id: linkRow.id, transaction_id: data.transactionId ?? null },
  });

  return data.href as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return htmlResponse("Method not allowed", "<h1>Method not allowed</h1>", 405);

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const token = url.searchParams.get("token") ?? (pathParts.length > 1 ? pathParts.at(-1) ?? "" : "");
    if (!token) throw new Error("Missing payment token");
    const invoice = await loadInvoiceByToken(token);
    const document = invoice.document;

    if (url.searchParams.has("return")) {
      const latest = await reloadInvoicePayment(document.id);
      const latestStatus = normalizeStatus(latest.payment?.payment_status ?? latest.document?.status ?? document.status);
      const returnStatus = normalizeStatus(url.searchParams.get("checkout-status"));
      const paid = latestStatus === "paid" || returnStatus === "paid";
      const failed = latestStatus === "failed" || returnStatus === "failed";
      return redirect(invoiceStatusUrl(paid ? "paid" : failed ? "failed" : "pending", document.document_number));
    }

    const balanceCents = Math.max(0, Number(document.total_cents ?? 0) - Number(document.paid_cents ?? 0));
    if (document.status === "paid" || balanceCents <= 0 || invoice.payment?.payment_status === "paid") {
      return redirect(invoiceStatusUrl("already_paid", document.document_number));
    }
    if (["void", "cancelled", "credited"].includes(String(document.status))) {
      return htmlResponse("Invoice not payable", `<h1>Invoice not payable</h1><p class="muted">Invoice ${escapeHtml(document.document_number)} is ${escapeHtml(document.status)}.</p>`, 409);
    }

    const activeLink = await findActivePaymentLink(document.id);
    if (activeLink?.payment_link_url) return redirect(activeLink.payment_link_url);

    const href = await createPaytrailPayment(invoice, token);
    return redirect(href);
  } catch (error) {
    return htmlResponse("Payment link unavailable", `<h1>Payment link unavailable</h1><p>${cleanString(error instanceof Error ? error.message : String(error), 500)}</p>`, 400);
  }
});
