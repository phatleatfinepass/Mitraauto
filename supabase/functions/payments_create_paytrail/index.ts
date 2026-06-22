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
  product_type?: unknown;
  gtin?: unknown;
  mpn?: unknown;
  stock_qty?: unknown;
  delivery_days_min?: unknown;
  delivery_days_max?: unknown;
};

type CatalogProductRow = {
  variant_id?: string;
  product_type?: string;
  brand?: string | null;
  brand_display_name?: string | null;
  model?: string | null;
  card_title?: string | null;
  title?: string | null;
  price?: number | string | null;
  final_price_eur?: number | string | null;
  in_stock?: boolean | null;
  stock_qty?: number | string | null;
  ean?: string | null;
  derived_ean?: string | null;
  pricing_rules?: unknown;
  best_image_url?: string | null;
  hero_image_url?: string | null;
  delivery_days_min?: number | string | null;
  delivery_days_max?: number | string | null;
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

function toNumberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizePricingTier(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const tier = value as Record<string, unknown>;
  const mode = tier.mode === "percent_off" || tier.mode === "fixed_total" ? tier.mode : "none";
  const percentOff = toNumberOrNull(tier.percent_off);
  const fixedTotal = toNumberOrNull(tier.fixed_total_eur);

  if (mode === "percent_off" && percentOff !== null && percentOff > 0) {
    return { mode, percent_off: percentOff, fixed_total_eur: null };
  }
  if (mode === "fixed_total" && fixedTotal !== null && fixedTotal >= 0) {
    return { mode, percent_off: null, fixed_total_eur: roundCurrency(fixedTotal) };
  }
  return null;
}

function normalizePricingRules(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const rules = value as Record<string, unknown>;
  const qty2 = normalizePricingTier(rules.qty2);
  const qty4 = normalizePricingTier(rules.qty4);
  return qty2 || qty4 ? { qty2, qty4 } : null;
}

function calculateLinePricing(baseUnitPriceEur: number, quantity: number, rules: unknown) {
  const safeQuantity = Math.max(1, Math.trunc(quantity || 1));
  const safeBaseUnit = roundCurrency(Number.isFinite(baseUnitPriceEur) ? Math.max(0, baseUnitPriceEur) : 0);
  const baseLineTotal = roundCurrency(safeBaseUnit * safeQuantity);
  const normalizedRules = normalizePricingRules(rules);
  const tier = safeQuantity === 2 ? normalizedRules?.qty2 : safeQuantity === 4 ? normalizedRules?.qty4 : null;

  let lineTotal = baseLineTotal;
  let effectiveUnit = safeBaseUnit;

  if (tier?.mode === "percent_off" && tier.percent_off !== null) {
    const discountFactor = Math.max(0, Math.min(100, tier.percent_off)) / 100;
    lineTotal = roundCurrency(baseLineTotal * (1 - discountFactor));
    effectiveUnit = roundCurrency(lineTotal / safeQuantity);
  } else if (tier?.mode === "fixed_total" && tier.fixed_total_eur !== null) {
    lineTotal = roundCurrency(Math.max(0, tier.fixed_total_eur));
    effectiveUnit = roundCurrency(lineTotal / safeQuantity);
  }

  return { effectiveUnitPriceEur: effectiveUnit, lineTotalEur: lineTotal };
}

function normalizeGtin(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits : null;
}

function firstProductImage(row: CatalogProductRow) {
  return cleanString(row.hero_image_url || row.best_image_url, 1000) || null;
}

async function getAuthoritativeCatalogProduct(item: CheckoutItem, index: number) {
  const sku = cleanString(item.sku, 100);
  const productType = cleanString(item.product_type, 20);
  if (!sku || (productType !== "tire" && productType !== "rim")) {
    throw new Error(`Missing product identity for cart item at index ${index}`);
  }

  const rpcName = productType === "rim"
    ? "catalog_get_rim_by_identifier_v1"
    : "catalog_get_tire_by_identifier_v1";
  const { data, error } = await supabase.rpc(rpcName, { p_identifier: sku });
  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  const row = rows[0] as CatalogProductRow | undefined;
  if (!row) {
    throw new Error(`Product is no longer available: ${sku}`);
  }

  return {
    ...row,
    product_type: productType,
  };
}

async function buildValidatedPaytrailItem(item: CheckoutItem, index: number) {
  const units = asPositiveInteger(item.qty);
  const clientUnitPrice = asPositiveInteger(item.client_unit_price_cents);
  if (clientUnitPrice <= 0 || units <= 0) {
    throw new Error(`Invalid cart item at index ${index}`);
  }

  const catalogProduct = await getAuthoritativeCatalogProduct(item, index);
  if (catalogProduct.in_stock !== true) {
    throw new Error(`Product is out of stock: ${cleanString(item.name || catalogProduct.card_title || catalogProduct.model || item.sku, 120)}`);
  }

  const stockQty = asPositiveInteger(catalogProduct.stock_qty, 0);
  if (stockQty > 0 && units > stockQty) {
    throw new Error(`Requested quantity exceeds available stock for ${cleanString(item.name || catalogProduct.card_title || catalogProduct.model || item.sku, 120)}. Available stock: ${stockQty}`);
  }

  const basePrice = toNumberOrNull(catalogProduct.final_price_eur) ?? toNumberOrNull(catalogProduct.price) ?? 0;
  if (basePrice <= 0) {
    throw new Error(`Product price is no longer available: ${cleanString(item.name || item.sku, 120)}`);
  }

  const linePricing = calculateLinePricing(basePrice, units, catalogProduct.pricing_rules);
  const authoritativeUnitPrice = Math.round(linePricing.effectiveUnitPriceEur * 1.255 * 100);
  const authoritativeLineTotal = Math.round(linePricing.lineTotalEur * 1.255 * 100);
  if (clientUnitPrice !== authoritativeUnitPrice) {
    throw new Error(`Cart price changed for ${cleanString(item.name || item.sku, 120)}. Refresh the cart before payment.`);
  }

  const brand = cleanString(catalogProduct.brand_display_name || catalogProduct.brand || (item as any).brand, 120) || null;
  const model = cleanString(catalogProduct.model || (item as any).model, 160) || null;
  const productType = cleanString(catalogProduct.product_type, 40);
  const gtin = normalizeGtin(catalogProduct.ean || catalogProduct.derived_ean || item.gtin);
  const description = cleanString(
    item.name ||
      catalogProduct.card_title ||
      [brand, model].filter(Boolean).join(" ") ||
      `Item ${index + 1}`,
    1000,
  );

  return {
    unitPrice: authoritativeUnitPrice,
    units,
    vatPercentage: Number(item.vatPercentage ?? 25.5),
    productCode: cleanString(catalogProduct.variant_id || item.sku || `item-${index + 1}`, 100),
    description,
    imageUrl: firstProductImage(catalogProduct) || cleanString((item as any).image_url, 1000) || null,
    brand,
    model,
    sizeText: cleanString((item as any).size_text, 120) || null,
    productType: productType || null,
    gtin,
    mpn: model || cleanString(item.mpn, 120) || null,
    stockQty: stockQty || null,
    deliveryDaysMin: asPositiveInteger(catalogProduct.delivery_days_min ?? (item as any).delivery_days_min, 0) || null,
    deliveryDaysMax: asPositiveInteger(catalogProduct.delivery_days_max ?? (item as any).delivery_days_max, 0) || null,
    lineTotalCents: authoritativeLineTotal,
  };
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
      gtin: item.gtin ?? null,
      mpn: item.mpn ?? null,
      authoritative_stock_qty: item.stockQty ?? null,
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

    const paytrailItems = await Promise.all(
      input.items.map((item: CheckoutItem, index: number) => buildValidatedPaytrailItem(item, index)),
    );

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
