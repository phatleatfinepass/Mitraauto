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
const FRONTEND_SUCCESS_URL = Deno.env.get("FRONTEND_SUCCESS_URL") ?? "https://mitra-auto.fi/checkout/success";
const FRONTEND_CANCEL_URL = Deno.env.get("FRONTEND_CANCEL_URL") ?? "https://mitra-auto.fi/checkout/cancel";
const PAYTRAIL_WEBHOOK_URL =
  Deno.env.get("PAYTRAIL_WEBHOOK_URL") ??
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/payments_paytrail_webhook` : "");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CheckoutItem = {
  qty?: unknown;
  client_unit_price_cents?: unknown;
  sku?: unknown;
  name?: unknown;
  vatPercentage?: unknown;
  stock_qty?: unknown;
  delivery_days_min?: unknown;
  delivery_days_max?: unknown;
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

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return JSON.stringify({
      message: record.message,
      details: record.details,
      hint: record.hint,
      code: record.code,
    });
  }
  return String(error);
}

function asPositiveInteger(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function cleanString(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function toCountryCode(value: unknown) {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "FINLAND" || raw === "SUOMI" || raw === "FI") return "FI";
  return /^[A-Z]{2}$/.test(raw) ? raw : "FI";
}

function normalizeLanguage(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "en" ? "en" : "fi";
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

async function signPaytrailRequest(headers: Record<string, string>, body: string) {
  const signingPayload = Object.entries(headers)
    .filter(([key]) => key.startsWith("checkout-"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("\n") + `\n${body}`;

  return hmacHex(PAYTRAIL_SECRET_KEY, signingPayload);
}

function buildOrderSnapshot(
  input: any,
  orderId: string,
  amount: number,
  shippingCents: number,
  taxCents: number,
  paytrailItems: any[],
) {
  const nowIso = new Date().toISOString();
  return {
    created_by: "webshop",
    created_at: nowIso,
    language: normalizeLanguage(input?.language),
    fulfillment_status: "receive",
    fulfillment_status_updated_at: nowIso,
    subtotal_cents: Math.max(0, amount - shippingCents),
    tax_cents: taxCents,
    shipping_cents: shippingCents,
    total_cents: amount,
    grand_total_cents: amount,
    payment_method: "paytrail",
    payment_status: "pending",
    customer: {
      firstName: cleanString(input?.customer?.firstName, 50) || null,
      lastName: cleanString(input?.customer?.lastName, 50) || null,
      email: cleanString(input?.customer?.email, 200) || null,
      phone: cleanString(input?.customer?.phone, 30) || null,
    },
    order_id: orderId,
    items: paytrailItems.map((item) => ({
      name: item.description,
      qty: item.units,
      sku: item.productCode,
      client_unit_price_cents: item.unitPrice,
      line_total_cents: item.unitPrice * item.units,
      vatPercentage: item.vatPercentage,
      image_url: item.imageUrl ?? null,
      brand: item.brand ?? null,
      model: item.model ?? null,
      size_text: item.sizeText ?? null,
      product_type: item.productType ?? null,
      delivery_days_min: item.deliveryDaysMin ?? null,
      delivery_days_max: item.deliveryDaysMax ?? null,
    })),
  };
}

function toPaytrailPaymentItem(item: any) {
  return {
    unitPrice: item.unitPrice,
    units: item.units,
    vatPercentage: item.vatPercentage,
    productCode: item.productCode,
    description: item.description,
  };
}

async function insertOrder(row: Record<string, unknown>) {
  const attempts = [
    row,
    Object.fromEntries(
      Object.entries(row).filter(([key]) => !key.startsWith("customer_")),
    ),
    Object.fromEntries(
      Object.entries(row).filter(([key]) =>
        !key.startsWith("customer_") &&
        !["subtotal_cents", "vat_cents", "total_cents"].includes(key)
      ),
    ),
  ];

  let lastError: unknown = null;
  for (const payload of attempts) {
    const { error } = await supabase.from("orders").insert(payload);
    if (!error) return;

    const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
    if (!message.includes("column") && !message.includes("schema cache")) {
      throw error;
    }
    lastError = error;
  }

  throw lastError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "server_not_configured", message: "Supabase service credentials are missing." }, 500);
    }
    if (!PAYTRAIL_MERCHANT_ID || !PAYTRAIL_SECRET_KEY) {
      return jsonResponse({ error: "paytrail_not_configured", message: "Paytrail merchant credentials are missing." }, 500);
    }

    const input = await req.json().catch(() => null);
    if (!input || !Array.isArray(input.items) || input.items.length === 0) {
      return jsonResponse({ error: "invalid_cart", message: "Cart is empty." }, 400);
    }

    const email = cleanString(input.customer?.email, 200);
    if (!email || !email.includes("@")) {
      return jsonResponse({ error: "invalid_customer", message: "Valid customer email is required." }, 400);
    }

    const paytrailItems = input.items.map((item: CheckoutItem, index: number) => {
      const unitPrice = asPositiveInteger(item.client_unit_price_cents);
      const units = asPositiveInteger(item.qty);
      const stockQty = asPositiveInteger((item as any).stock_qty, 0);
      if (unitPrice <= 0 || units <= 0) {
        throw new Error(`Invalid cart item at index ${index}`);
      }
      if (stockQty > 0 && units > stockQty) {
        throw new Error(`Requested quantity exceeds available stock for ${cleanString(item.name || item.sku || `item-${index + 1}`, 120)}. Available stock: ${stockQty}`);
      }

      return {
        unitPrice,
        units,
        vatPercentage: Number(item.vatPercentage ?? 25.5),
        productCode: cleanString(item.sku || `item-${index + 1}`, 100),
        description: cleanString(item.name || `Item ${index + 1}`, 1000),
        imageUrl: cleanString((item as any).image_url, 1000) || null,
        brand: cleanString((item as any).brand, 120) || null,
        model: cleanString((item as any).model, 160) || null,
        sizeText: cleanString((item as any).size_text, 120) || null,
        productType: cleanString((item as any).product_type, 40) || null,
        deliveryDaysMin: asPositiveInteger((item as any).delivery_days_min, 0) || null,
        deliveryDaysMax: asPositiveInteger((item as any).delivery_days_max, 0) || null,
      };
    });

    const shippingCents = asPositiveInteger(input.shipping_cents, 0);
    if (shippingCents > 0) {
      paytrailItems.push({
        unitPrice: shippingCents,
        units: 1,
        vatPercentage: 25.5,
        productCode: "shipping",
        description: "Shipping",
      });
    }

    const amount = paytrailItems.reduce((sum: number, item: any) => sum + item.unitPrice * item.units, 0);
    if (amount <= 0) {
      return jsonResponse({ error: "invalid_amount", message: "Payment amount must be more than zero." }, 400);
    }

    const orderId = crypto.randomUUID();
    const stamp = orderId;
    const reference = `ORDER-${orderId}`;
    const legacyReturnUrl = cleanString(input.return_url, 300);
    const successUrl =
      cleanString(input.success_url, 300) ||
      (legacyReturnUrl.includes("/checkout/result") ? FRONTEND_SUCCESS_URL : legacyReturnUrl) ||
      FRONTEND_SUCCESS_URL;
    const cancelUrl = cleanString(input.cancel_url, 300) || FRONTEND_CANCEL_URL;

    const deliveryAddress = input.shipping_address
      ? {
        streetAddress: cleanString(input.shipping_address.streetAddress, 50),
        postalCode: cleanString(input.shipping_address.postalCode, 15),
        city: cleanString(input.shipping_address.city, 30),
        country: toCountryCode(input.shipping_address.country),
      }
      : undefined;
    const invoicingAddress = input.billing_address
      ? {
        streetAddress: cleanString(input.billing_address.streetAddress, 50),
        postalCode: cleanString(input.billing_address.postalCode, 15),
        city: cleanString(input.billing_address.city, 30),
        country: toCountryCode(input.billing_address.country),
      }
      : deliveryAddress;

    const paymentPayload: Record<string, unknown> = {
      stamp,
      reference,
      amount,
      currency: "EUR",
      language: normalizeLanguage(input?.language).toUpperCase(),
      items: paytrailItems.map(toPaytrailPaymentItem),
      customer: {
        email,
        firstName: cleanString(input.customer?.firstName, 50) || undefined,
        lastName: cleanString(input.customer?.lastName, 50) || undefined,
        phone: cleanString(input.customer?.phone, 30) || undefined,
      },
      redirectUrls: {
        success: successUrl,
        cancel: cancelUrl,
      },
    };

    if (PAYTRAIL_WEBHOOK_URL) {
      paymentPayload.callbackUrls = {
        success: PAYTRAIL_WEBHOOK_URL,
        cancel: PAYTRAIL_WEBHOOK_URL,
      };
    }
    if (deliveryAddress?.streetAddress && deliveryAddress.postalCode && deliveryAddress.city) {
      paymentPayload.deliveryAddress = deliveryAddress;
    }
    if (invoicingAddress?.streetAddress && invoicingAddress.postalCode && invoicingAddress.city) {
      paymentPayload.invoicingAddress = invoicingAddress;
    }

    const taxCents = Math.round(amount - amount / 1.255);
    const orderSnapshot = buildOrderSnapshot(input, orderId, amount, shippingCents, taxCents, paytrailItems);
    await insertOrder({
      id: orderId,
      status: "pending_payment",
      email,
      phone: cleanString(input.customer?.phone, 30) || null,
      currency: "EUR",
      paytrail_status: "pending",
      paytrail_stamp: stamp,
      paytrail_reference: reference,
      return_url: successUrl,
      grand_total_cents: amount,
      subtotal_cents: Math.max(0, amount - shippingCents),
      total_cents: amount,
      tax_cents: taxCents,
      shipping_cents: shippingCents,
      discount_cents: 0,
      cart_snapshot: orderSnapshot,
    });

    const paytrailBody = JSON.stringify(paymentPayload);
    const paytrailHeaders: Record<string, string> = {
      "checkout-account": PAYTRAIL_MERCHANT_ID,
      "checkout-algorithm": "sha256",
      "checkout-method": "POST",
      "checkout-nonce": crypto.randomUUID(),
      "checkout-timestamp": new Date().toISOString(),
      "content-type": "application/json; charset=utf-8",
      "platform-name": "mitraauto-webshop",
    };
    paytrailHeaders.signature = await signPaytrailRequest(paytrailHeaders, paytrailBody);

    const paytrailResponse = await fetch(`${PAYTRAIL_API_BASE}/payments`, {
      method: "POST",
      headers: paytrailHeaders,
      body: paytrailBody,
    });
    const paytrailText = await paytrailResponse.text();
    const paytrailData = paytrailText ? JSON.parse(paytrailText) : {};

    if (!paytrailResponse.ok) {
      await supabase
        .from("orders")
        .update({ paytrail_status: "create_failed" })
        .eq("id", orderId);
      return jsonResponse({
        error: "paytrail_create_failed",
        message: paytrailData?.meta?.message ?? paytrailData?.message ?? "Paytrail rejected the payment request.",
        status: paytrailResponse.status,
        request_id: paytrailResponse.headers.get("request-id"),
      }, 502);
    }

    const { error: orderPaymentUpdateError } = await supabase
      .from("orders")
      .update({
        paytrail_transaction_id: paytrailData.transactionId ?? null,
        paytrail_reference: paytrailData.reference ?? reference,
        paytrail_status: "new",
        paytrail_redirect_url: paytrailData.href ?? null,
        cart_snapshot: {
          ...orderSnapshot,
          payment_method: "paytrail",
          payment_status: "pending",
          paytrail: {
            status: "new",
            transaction_id: paytrailData.transactionId ?? null,
            reference: paytrailData.reference ?? reference,
            redirect_url: paytrailData.href ?? null,
            updated_at: new Date().toISOString(),
          },
        },
      })
      .eq("id", orderId);
    if (orderPaymentUpdateError) throw orderPaymentUpdateError;

    return jsonResponse({
      order_id: orderId,
      transaction_id: paytrailData.transactionId ?? null,
      reference: paytrailData.reference ?? reference,
      redirect_url: paytrailData.href,
      paytrail: paytrailData,
    });
  } catch (error) {
    console.error("payments_create_paytrail failed", error);
    return jsonResponse({
      error: "payment_create_failed",
      message: errorMessage(error),
    }, 500);
  }
});
