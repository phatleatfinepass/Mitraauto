import { corsHeaders, sendManagedBookingMail, supabaseAdmin, type SupportedLanguage } from "./booking.ts";

type OrderRow = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  grand_total_cents?: number | null;
  subtotal_cents?: number | null;
  shipping_cents?: number | null;
  tax_cents?: number | null;
  vat_cents?: number | null;
  paytrail_status?: string | null;
  paytrail_transaction_id?: string | null;
  paytrail_provider?: string | null;
  currency?: string | null;
  cart_snapshot?: any;
};

type EReceiptRow = {
  id: string;
  receipt_number: string;
  source_type: string;
  order_id?: string | null;
  booking_id?: string | null;
  status: string;
  language: SupportedLanguage;
  recipient_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  transaction_id?: string | null;
  payment_provider?: string | null;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  vat_cents: number;
  total_cents: number;
  vat_rate: number;
  issued_at: string;
  payload: any;
};

type BookingRow = {
  id: string;
  created_at?: string | null;
  booking_language?: string | null;
  booking_date: string;
  booking_time: string;
  license_plate?: string | null;
  service_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
};

const FUNCTIONS_URL = `${(Deno.env.get("SUPABASE_URL") ?? "https://rcmmbwdebnmicrweoiyz.supabase.co").replace(/\/+$/, "")}/functions/v1`;
const COMPANY_NAME = Deno.env.get("ERECEIPT_COMPANY_NAME") ?? "Mitra Auto Oy";
const COMPANY_BUSINESS_ID = Deno.env.get("ERECEIPT_COMPANY_BUSINESS_ID") ?? "3408833-8";
const COMPANY_VAT_ID = Deno.env.get("ERECEIPT_COMPANY_VAT_ID") ?? "FI34088338";
const COMPANY_ADDRESS = Deno.env.get("ERECEIPT_COMPANY_ADDRESS") ?? "Hankasuontie 5, 00390 HELSINKI";
const COMPANY_PHONE = Deno.env.get("ERECEIPT_COMPANY_PHONE") ?? "0407777163";
const COMPANY_EMAIL = Deno.env.get("ERECEIPT_COMPANY_EMAIL") ?? "contact@mitra-auto.fi";
const DEFAULT_VAT_RATE = 25.5;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeLanguage(value: unknown): SupportedLanguage {
  return String(value ?? "").toLowerCase() === "en" ? "en" : "fi";
}

function randomToken(bytes = 24) {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buffer).map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function formatMoney(cents: unknown) {
  const value = Number(cents ?? 0);
  return `€${((Number.isFinite(value) ? value : 0) / 100).toFixed(2)}`;
}

function formatDate(value: string | null | undefined, language: SupportedLanguage) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString(language === "fi" ? "fi-FI" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value: string | null | undefined, language: SupportedLanguage) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString(language === "fi" ? "fi-FI" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderLanguage(order: OrderRow): SupportedLanguage {
  return normalizeLanguage(
    order.cart_snapshot?.language ??
      order.cart_snapshot?.locale ??
      order.cart_snapshot?.ui_language ??
      order.cart_snapshot?.customer?.language,
  );
}

function orderCustomer(order: OrderRow) {
  const snapshot = order.cart_snapshot ?? {};
  const customer = snapshot.customer ?? {};
  const billing = snapshot.billing ?? {};
  const shipping = snapshot.shipping ?? {};
  return {
    email: String(order.email ?? customer.email ?? billing.email ?? shipping.email ?? "").trim(),
    phone: String(order.phone ?? customer.phone ?? billing.phone ?? shipping.phone ?? "").trim(),
    name: [
      customer.firstName ?? customer.first_name ?? billing.firstName ?? billing.first_name ?? shipping.firstName ?? shipping.first_name,
      customer.lastName ?? customer.last_name ?? billing.lastName ?? billing.last_name ?? shipping.lastName ?? shipping.last_name,
    ].map((part) => String(part ?? "").trim()).filter(Boolean).join(" "),
  };
}

function orderItems(order: OrderRow) {
  return Array.isArray(order.cart_snapshot?.items) ? order.cart_snapshot.items : [];
}

function itemTitle(item: any) {
  return String(
    item?.name ||
      item?.description ||
      [item?.brand, item?.model].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ") ||
      "Product"
  ).trim();
}

function itemSize(item: any) {
  return String(item?.size_text ?? item?.size ?? "").trim();
}

function itemQuantity(item: any) {
  return Math.max(1, Number(item?.qty ?? item?.units ?? 1) || 1);
}

function itemUnitCents(item: any) {
  return Number(item?.client_unit_price_cents ?? item?.unitPrice ?? 0) || 0;
}

function itemVatRate(item: any) {
  const rate = Number(item?.vatPercentage ?? item?.vat_rate ?? DEFAULT_VAT_RATE);
  return Number.isFinite(rate) ? rate : DEFAULT_VAT_RATE;
}

function buildReceiptNumber(order: OrderRow) {
  const date = new Date(order.created_at ?? Date.now());
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `MA-${y}${m}${d}-${order.id.slice(0, 8).toUpperCase()}`;
}

function buildBookingReceiptNumber(booking: BookingRow) {
  const date = new Date(booking.created_at ?? Date.now());
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `MA-S-${y}${m}${d}-${booking.id.slice(0, 8).toUpperCase()}-${randomToken(2).toUpperCase()}`;
}

function buildOrderReceiptPayload(order: OrderRow) {
  const items = orderItems(order).filter((item: any) => String(item?.sku ?? item?.productCode ?? "").toLowerCase() !== "shipping");
  const lineItems = items.map((item: any) => {
    const quantity = itemQuantity(item);
    const unitCents = itemUnitCents(item);
    const lineTotalCents = Number(item?.line_total_cents ?? unitCents * quantity) || 0;
    const vatRate = itemVatRate(item);
    const vatCents = Math.round(lineTotalCents - lineTotalCents / (1 + vatRate / 100));
    return {
      title: itemTitle(item),
      brand: String(item?.brand ?? "").trim(),
      size: itemSize(item),
      description: String(item?.description ?? item?.model ?? "").trim(),
      quantity,
      unit_label: "kpl",
      unit_cents: unitCents,
      line_total_cents: lineTotalCents,
      vat_rate: vatRate,
      vat_cents: vatCents,
      sku: item?.sku ?? item?.productCode ?? null,
      ean: item?.ean ?? null,
    };
  });
  return {
    source: "order",
    order_id: order.id,
    order_created_at: order.created_at ?? null,
    payment_status: order.paytrail_status ?? order.status ?? null,
    items: lineItems,
    customer: orderCustomer(order),
    raw_order_snapshot: order.cart_snapshot ?? {},
  };
}

async function issueAccessToken(ereceiptId: string) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const { error } = await supabaseAdmin.from("ereceipt_access_tokens").insert({
    ereceipt_id: ereceiptId,
    token_hash: tokenHash,
    purpose: "download",
  });
  if (error) throw new Error(error.message);
  return token;
}

export function receiptDownloadUrl(token: string, download = true) {
  return `${FUNCTIONS_URL}/ereceipt_download?token=${encodeURIComponent(token)}${download ? "&download=1" : ""}`;
}

export async function ensureOrderEReceipt(order: OrderRow) {
  const language = orderLanguage(order);
  const customer = orderCustomer(order);
  const subtotalCents = Number(order.subtotal_cents ?? order.cart_snapshot?.subtotal_cents ?? Math.max(0, Number(order.grand_total_cents ?? 0) - Number(order.shipping_cents ?? order.cart_snapshot?.shipping_cents ?? 0))) || 0;
  const shippingCents = Number(order.shipping_cents ?? order.cart_snapshot?.shipping_cents ?? 0) || 0;
  const totalCents = Number(order.grand_total_cents ?? order.cart_snapshot?.total_cents ?? subtotalCents + shippingCents) || 0;
  const vatCents = Number(order.tax_cents ?? order.vat_cents ?? order.cart_snapshot?.tax_cents ?? order.cart_snapshot?.vat_cents ?? Math.round(totalCents - totalCents / 1.255)) || 0;
  const payload = buildOrderReceiptPayload(order);

  const existing = await supabaseAdmin
    .from("ereceipts")
    .select("*")
    .eq("source_type", "order")
    .eq("order_id", order.id)
    .neq("status", "void")
    .maybeSingle<EReceiptRow>();
  if (existing.error) throw new Error(existing.error.message);

  let receipt = existing.data;
  if (!receipt) {
    const insert = await supabaseAdmin
      .from("ereceipts")
      .insert({
        receipt_number: buildReceiptNumber(order),
        source_type: "order",
        order_id: order.id,
        status: "issued",
        language,
        recipient_email: customer.email || null,
        customer_name: customer.name || null,
        customer_phone: customer.phone || null,
        transaction_id: order.paytrail_transaction_id ?? null,
        payment_provider: order.paytrail_provider ?? null,
        currency: order.currency ?? "EUR",
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        vat_cents: vatCents,
        total_cents: totalCents,
        vat_rate: DEFAULT_VAT_RATE,
        payload,
      })
      .select("*")
      .single<EReceiptRow>();
    if (insert.error) throw new Error(insert.error.message);
    receipt = insert.data;
    await supabaseAdmin.from("ereceipt_events").insert({
      ereceipt_id: receipt.id,
      event_type: "issued",
      actor: "system",
      payload: { source_type: "order", order_id: order.id },
    });
  }

  const token = await issueAccessToken(receipt.id);
  return {
    receipt,
    token,
    url: receiptDownloadUrl(token, true),
  };
}

function serviceItemsFromBooking(booking: BookingRow) {
  return String(booking.service_name ?? "")
    .split(/\s*,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeReceiptLines(lines: unknown, booking: BookingRow) {
  const sourceLines = Array.isArray(lines) && lines.length > 0
    ? lines
    : serviceItemsFromBooking(booking).map((service) => ({
      title: service,
      quantity: 1,
      unit_cents: 0,
      vat_rate: DEFAULT_VAT_RATE,
    }));

  return sourceLines.map((line: any) => {
    const quantity = Math.max(1, Number(line?.quantity ?? 1) || 1);
    const unitCents = Math.max(0, Math.round(Number(line?.unit_cents ?? 0) || 0));
    const lineTotalCents = Math.max(0, Math.round(Number(line?.line_total_cents ?? unitCents * quantity) || 0));
    const vatRate = Number(line?.vat_rate ?? DEFAULT_VAT_RATE);
    const normalizedVatRate = Number.isFinite(vatRate) ? vatRate : DEFAULT_VAT_RATE;
    return {
      title: String(line?.title ?? "Service").trim() || "Service",
      size: String(line?.description ?? line?.size ?? "").trim(),
      quantity,
      unit_cents: unitCents,
      line_total_cents: lineTotalCents,
      vat_rate: normalizedVatRate,
      vat_cents: Math.round(lineTotalCents - lineTotalCents / (1 + normalizedVatRate / 100)),
      sku: null,
      ean: null,
    };
  });
}

export async function issueBookingEReceipt(args: {
  bookingId: string;
  lines?: unknown;
  notes?: string | null;
  recipientEmail?: string | null;
}) {
  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", args.bookingId)
    .maybeSingle<BookingRow>();
  if (error) throw new Error(error.message);
  if (!booking) throw new Error("Booking not found");

  const language = normalizeLanguage(booking.booking_language);
  const receiptLines = normalizeReceiptLines(args.lines, booking);
  const subtotalCents = receiptLines.reduce((sum, line) => sum + Number(line.line_total_cents ?? 0), 0);
  const vatCents = receiptLines.reduce((sum, line) => sum + Number(line.vat_cents ?? 0), 0);
  const customerEmail = String(args.recipientEmail ?? booking.customer_email ?? "").trim();
  if (!customerEmail) throw new Error("Booking has no customer email");

  const payload = {
    source: "booking",
    booking_id: booking.id,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    license_plate: booking.license_plate ?? null,
    service_name: booking.service_name ?? null,
    notes: args.notes ?? null,
    items: receiptLines,
    customer: {
      name: booking.customer_name ?? "",
      email: customerEmail,
      phone: booking.customer_phone ?? "",
    },
  };

  const insert = await supabaseAdmin
    .from("ereceipts")
    .insert({
      receipt_number: buildBookingReceiptNumber(booking),
      source_type: "booking",
      booking_id: booking.id,
      status: "issued",
      language,
      recipient_email: customerEmail,
      customer_name: booking.customer_name || null,
      customer_phone: booking.customer_phone || null,
      currency: "EUR",
      subtotal_cents: subtotalCents,
      shipping_cents: 0,
      vat_cents: vatCents,
      total_cents: subtotalCents,
      vat_rate: DEFAULT_VAT_RATE,
      payload,
    })
    .select("*")
    .single<EReceiptRow>();
  if (insert.error) throw new Error(insert.error.message);

  await supabaseAdmin.from("ereceipt_events").insert({
    ereceipt_id: insert.data.id,
    event_type: "issued",
    actor: "admin",
    payload: { source_type: "booking", booking_id: booking.id },
  });

  const token = await issueAccessToken(insert.data.id);
  return {
    booking,
    receipt: insert.data,
    token,
    url: receiptDownloadUrl(token, true),
  };
}

export async function sendBookingEReceipt(args: {
  bookingId: string;
  lines?: unknown;
  notes?: string | null;
  recipientEmail?: string | null;
}) {
  const result = await issueBookingEReceipt(args);
  const language = normalizeLanguage(result.booking.booking_language);
  const subject = language === "fi"
    ? `Kuitti: ${result.receipt.receipt_number}`
    : `Receipt: ${result.receipt.receipt_number}`;
  const message = language === "fi"
    ? [
      "Kiitos käynnistäsi Mitra Autolla.",
      args.notes ? "" : null,
      args.notes ? String(args.notes).trim() : null,
      "",
      `Kuitti: ${result.receipt.receipt_number}`,
      `Lataa kuitti: ${result.url}`,
    ].filter((line) => line !== null).join("\n")
    : [
      "Thank you for visiting Mitra Auto.",
      args.notes ? "" : null,
      args.notes ? String(args.notes).trim() : null,
      "",
      `Receipt: ${result.receipt.receipt_number}`,
      `Download receipt: ${result.url}`,
    ].filter((line) => line !== null).join("\n");

  const mailResult = await sendManagedBookingMail({
    bookingId: result.booking.id,
    type: "message",
    customSubject: subject,
    customMessage: message,
    recipientEmail: result.receipt.recipient_email,
  });

  await markEReceiptSent(result.receipt.id, {
    booking_id: result.booking.id,
    provider: "gmail",
    manage_url: mailResult.manageUrl ?? null,
  });

  return {
    ok: true,
    receipt: result.receipt,
    receiptUrl: result.url,
    mail: mailResult,
  };
}

export async function markEReceiptSent(ereceiptId: string, payload: Record<string, unknown> = {}) {
  await supabaseAdmin
    .from("ereceipts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", ereceiptId);
  await supabaseAdmin.from("ereceipt_events").insert({
    ereceipt_id: ereceiptId,
    event_type: "sent",
    actor: "system",
    payload,
  });
}

async function findReceiptByToken(token: string) {
  const tokenHash = await sha256Hex(token.trim());
  const { data, error } = await supabaseAdmin
    .from("ereceipt_access_tokens")
    .select("id, ereceipt_id, expires_at, revoked_at, ereceipts(*)")
    .eq("token_hash", tokenHash)
    .maybeSingle<any>();
  if (error) throw new Error(error.message);
  if (!data?.ereceipts || data.revoked_at) throw new Error("Receipt link is invalid");
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) throw new Error("Receipt link has expired");
  await supabaseAdmin.from("ereceipt_access_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  await supabaseAdmin.from("ereceipt_events").insert({
    ereceipt_id: data.ereceipt_id,
    event_type: "downloaded",
    actor: "customer",
    payload: {},
  });
  return data.ereceipts as EReceiptRow;
}

function receiptLineRows(receipt: EReceiptRow) {
  const items = Array.isArray(receipt.payload?.items) ? receipt.payload.items : [];
  if (items.length === 0) {
    return `<tr><td colspan="7" class="empty-line">No receipt lines</td></tr>`;
  }

  return items.map((item: any) => {
    const title = String(item.title ?? "").trim();
    const brand = String(item.brand ?? "").trim();
    const description = [item.size, item.description].map((part) => String(part ?? "").trim()).filter(Boolean).join(" - ");
    const productCode = String(item.sku ?? item.ean ?? "").trim();
    const quantity = Number(item.quantity ?? 1) || 1;
    const unitLabel = `${quantity.toFixed(2).replace(".", ",")} ${item.unit_label ?? "kpl"}`;
    return [
      `<tr>`,
      `<td>${escapeHtml(title || "-")}</td>`,
      `<td>${escapeHtml(brand || "-")}</td>`,
      `<td>${escapeHtml(description || "-")}</td>`,
      `<td>${escapeHtml(productCode || "-")}</td>`,
      `<td class="right muted">${escapeHtml(unitLabel)}</td>`,
      `<td class="right">${escapeHtml(formatMoney(item.unit_cents))}</td>`,
      `<td class="right strong">${escapeHtml(formatMoney(item.line_total_cents))}</td>`,
      `</tr>`,
    ].join("");
  }).join("");
}

function receiptServiceTotal(receipt: EReceiptRow) {
  const items = Array.isArray(receipt.payload?.items) ? receipt.payload.items : [];
  return items
    .filter((item: any) => !String(item?.sku ?? "").trim() && !String(item?.ean ?? "").trim())
    .reduce((sum: number, item: any) => sum + (Number(item?.line_total_cents ?? 0) || 0), 0);
}

function receiptPartsTotal(receipt: EReceiptRow) {
  const items = Array.isArray(receipt.payload?.items) ? receipt.payload.items : [];
  return items
    .filter((item: any) => String(item?.sku ?? "").trim() || String(item?.ean ?? "").trim())
    .reduce((sum: number, item: any) => sum + (Number(item?.line_total_cents ?? 0) || 0), 0);
}

function netFromGross(grossCents: number, vatRate: number) {
  return Math.round(grossCents / (1 + vatRate / 100));
}

export function renderEReceiptHtml(receipt: EReceiptRow) {
  const language = normalizeLanguage(receipt.language);
  const customer = receipt.payload?.customer ?? {};
  const sourceDate = receipt.payload?.order_created_at ?? receipt.payload?.booking_date ?? receipt.issued_at;
  const vehiclePlate = receipt.payload?.license_plate ?? null;
  const serviceSummary = String(receipt.payload?.service_name ?? "").trim();
  const serviceTotal = receiptServiceTotal(receipt);
  const partsTotal = receiptPartsTotal(receipt);
  const netCents = netFromGross(receipt.total_cents, Number(receipt.vat_rate ?? DEFAULT_VAT_RATE));
  const label = {
    title: language === "fi" ? "KUITTI" : "RECEIPT",
    receiptNumber: language === "fi" ? "Kuittinumero" : "Receipt number",
    orderNumber: language === "fi" ? "Tilausnumero" : "Order number",
    workOrder: language === "fi" ? "Työmääräys" : "Work order",
    date: language === "fi" ? "Myyntipäivä" : "Sales date",
    seller: language === "fi" ? "Myyjä" : "Seller",
    buyer: language === "fi" ? "Asiakas" : "Customer",
    businessId: language === "fi" ? "Y-tunnus" : "Business ID",
    vatId: language === "fi" ? "ALV-tunnus" : "VAT ID",
    phone: language === "fi" ? "Puh" : "Tel",
    payment: language === "fi" ? "Maksu" : "Payment",
    transaction: language === "fi" ? "Maksutapahtuma" : "Transaction",
    item: language === "fi" ? "Toimenpide / varaosa" : "Operation / part",
    brand: language === "fi" ? "Tuotemerkki" : "Brand",
    description: language === "fi" ? "Kuvaus" : "Description",
    productCode: language === "fi" ? "Tuotenumero" : "Product no.",
    unit: language === "fi" ? "Yksikkö" : "Unit",
    priceInclVat: language === "fi" ? "Hinta (sis. alv)" : "Price (incl. VAT)",
    vat: language === "fi" ? "ALV" : "VAT",
    vatBase: language === "fi" ? "Veroton" : "Net",
    vatGross: language === "fi" ? "Verollinen" : "Gross",
    vatClass: language === "fi" ? "Verokanta" : "VAT rate",
    total: language === "fi" ? "Yhteensä" : "Total",
    serviceTotal: language === "fi" ? "Huoltotyön summa" : "Service work total",
    partsTotal: language === "fi" ? "Varaosien summa" : "Parts total",
    paid: language === "fi" ? "Maksettu" : "Paid",
    cardPayment: language === "fi" ? "Korttimaksu" : "Card payment",
    vehicle: language === "fi" ? "Ajoneuvo" : "Vehicle",
    licensePlate: language === "fi" ? "Rekisterinumero" : "License plate",
    noticed: language === "fi" ? "Huollossa huomioitu" : "Workshop notes",
    print: language === "fi" ? "Tulosta / tallenna PDF" : "Print / save PDF",
  };

  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(label.title)} ${escapeHtml(receipt.receipt_number)}</title>
  <style>
    body { margin: 0; background: #f4f5f7; color: #111827; font-family: Arial, sans-serif; font-size: 13px; }
    .page { max-width: 920px; margin: 0 auto; padding: 28px 18px; }
    .receipt { background: #fff; border: 1px solid #d9dde5; border-radius: 8px; padding: 28px; }
    .top { display: grid; grid-template-columns: minmax(0,1fr) 270px; gap: 28px; align-items: start; }
    h1 { margin: 0 0 14px; font-size: 30px; letter-spacing: .08em; }
    h2 { margin: 22px 0 8px; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #64748b; }
    p { margin: 3px 0; }
    .muted { color: #64748b; }
    .company { line-height: 1.45; }
    .meta { display: grid; grid-template-columns: 1fr; gap: 8px; }
    .meta-row { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .meta-row span:first-child { color: #64748b; }
    .box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #fafafa; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .lines { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    .lines th { padding: 8px 7px; border-bottom: 2px solid #111827; color: #111827; font-size: 11px; text-align: left; font-weight: 700; }
    .lines td { padding: 8px 7px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .right { text-align: right; white-space: nowrap; }
    .strong { font-weight: 700; }
    .empty-line { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #64748b; }
    .summary { margin-left: auto; width: min(360px, 100%); margin-top: 14px; }
    .summary td { padding: 5px 0; }
    .vat-table { width: 100%; border-collapse: collapse; margin-top: 18px; }
    .vat-table th { padding: 7px; border-bottom: 1px solid #111827; text-align: right; font-size: 11px; }
    .vat-table th:first-child, .vat-table td:first-child { text-align: left; }
    .vat-table td { padding: 7px; border-bottom: 1px solid #e5e7eb; text-align: right; }
    .total { font-size: 18px; font-weight: 800; }
    .actions { margin: 0 0 16px; text-align: right; }
    button { border: 0; border-radius: 8px; background: #111827; color: #fff; padding: 10px 14px; font-weight: 700; cursor: pointer; }
    .footer { margin-top: 22px; color: #64748b; font-size: 12px; }
    @media (max-width: 640px) {
      .receipt { padding: 18px; border-radius: 0; border-left: 0; border-right: 0; }
      .page { padding: 0; }
      .top, .grid { display: block; }
      .box { margin-top: 12px; }
      .lines { font-size: 11px; }
      th, td { padding-left: 6px !important; padding-right: 6px !important; }
    }
    @media print {
      body { background: #fff; }
      .page { padding: 0; max-width: none; }
      .receipt { border: 0; border-radius: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="actions"><button onclick="window.print()">${escapeHtml(label.print)}</button></div>
    <main class="receipt">
      <div class="top">
        <div class="company">
          <p><strong>${escapeHtml(COMPANY_NAME)}</strong></p>
          <p>${escapeHtml(COMPANY_ADDRESS)}</p>
          <p>${escapeHtml(label.businessId)}: ${escapeHtml(COMPANY_BUSINESS_ID)}</p>
          <p>${escapeHtml(label.vatId)}: ${escapeHtml(COMPANY_VAT_ID)}</p>
          <p>${escapeHtml(label.phone)}: ${escapeHtml(COMPANY_PHONE)}</p>
          <p>${escapeHtml(COMPANY_EMAIL)}</p>
        </div>
        <div>
          <h1>${escapeHtml(label.title)}</h1>
          <div class="meta">
            <div class="meta-row"><span>${escapeHtml(label.receiptNumber)}</span><strong>${escapeHtml(receipt.receipt_number)}</strong></div>
            ${receipt.order_id ? `<div class="meta-row"><span>${escapeHtml(label.orderNumber)}</span><strong>${escapeHtml(receipt.order_id)}</strong></div>` : ""}
            ${receipt.booking_id ? `<div class="meta-row"><span>${escapeHtml(label.workOrder)}</span><strong>${escapeHtml(receipt.booking_id)}</strong></div>` : ""}
            <div class="meta-row"><span>${escapeHtml(label.date)}</span><strong>${escapeHtml(formatDate(sourceDate, language))}</strong></div>
          </div>
        </div>
      </div>

      <div class="grid">
        <section>
          <h2>${escapeHtml(label.buyer)}</h2>
          <div class="box">
            <p>${escapeHtml(receipt.customer_name || customer.name || "-")}</p>
            <p>${escapeHtml(receipt.recipient_email || customer.email || "")}</p>
            <p>${escapeHtml(receipt.customer_phone || customer.phone || "")}</p>
          </div>
        </section>
        <section>
          <h2>${vehiclePlate ? escapeHtml(label.vehicle) : escapeHtml(label.payment)}</h2>
          <div class="box">
            ${vehiclePlate ? `<p><strong>${escapeHtml(label.licensePlate)}:</strong> ${escapeHtml(String(vehiclePlate))}</p>` : ""}
            ${serviceSummary ? `<p>${escapeHtml(serviceSummary)}</p>` : ""}
            ${!vehiclePlate && !serviceSummary ? `<p>${escapeHtml(receipt.payment_provider || "-")}</p>` : ""}
            ${receipt.transaction_id ? `<p>${escapeHtml(label.transaction)}: ${escapeHtml(receipt.transaction_id)}</p>` : ""}
          </div>
        </section>
      </div>

      <table class="lines">
        <thead>
          <tr>
            <th>${escapeHtml(label.item)}</th>
            <th>${escapeHtml(label.brand)}</th>
            <th>${escapeHtml(label.description)}</th>
            <th>${escapeHtml(label.productCode)}</th>
            <th style="text-align:right;">${escapeHtml(label.unit)}</th>
            <th style="text-align:right;">${escapeHtml(label.priceInclVat)}</th>
            <th style="text-align:right;">${escapeHtml(label.total)}</th>
          </tr>
        </thead>
        <tbody>${receiptLineRows(receipt)}</tbody>
      </table>

      <table class="summary">
        ${serviceTotal > 0 ? `<tr><td>${escapeHtml(label.serviceTotal)}</td><td class="right strong">${escapeHtml(formatMoney(serviceTotal))}</td></tr>` : ""}
        ${partsTotal > 0 ? `<tr><td>${escapeHtml(label.partsTotal)}</td><td class="right strong">${escapeHtml(formatMoney(partsTotal))}</td></tr>` : ""}
        ${receipt.shipping_cents > 0 ? `<tr><td>${escapeHtml(language === "fi" ? "Toimitus" : "Shipping")}</td><td class="right strong">${escapeHtml(formatMoney(receipt.shipping_cents))}</td></tr>` : ""}
        <tr><td class="total">${escapeHtml(label.total)}</td><td class="right total">${escapeHtml(formatMoney(receipt.total_cents))}</td></tr>
      </table>

      <h2>${escapeHtml(label.paid)}</h2>
      <div class="grid">
        <div class="box">
          <p><strong>${escapeHtml(label.paid)} ${escapeHtml(formatDate(receipt.issued_at, language))}</strong></p>
          <p>${escapeHtml(receipt.payment_provider || label.cardPayment)} ${escapeHtml(formatMoney(receipt.total_cents))}</p>
        </div>
        <div class="box">
          <p><strong>${escapeHtml(label.noticed)}</strong></p>
          <p>${escapeHtml(String(receipt.payload?.notes ?? ""))}</p>
        </div>
      </div>

      <table class="vat-table">
        <thead>
          <tr>
            <th>${escapeHtml(label.vatClass)}</th>
            <th>${escapeHtml(label.vatBase)}</th>
            <th>${escapeHtml(label.vat)}</th>
            <th>${escapeHtml(label.vatGross)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(language === "fi" ? `Myynti Alv ${receipt.vat_rate} %` : `Sales VAT ${receipt.vat_rate}%`)}</td>
            <td>${escapeHtml(formatMoney(netCents))}</td>
            <td>${escapeHtml(formatMoney(receipt.vat_cents))}</td>
            <td>${escapeHtml(formatMoney(receipt.total_cents))}</td>
          </tr>
          <tr class="strong">
            <td>${escapeHtml(label.total)}</td>
            <td>${escapeHtml(formatMoney(netCents))}</td>
            <td>${escapeHtml(formatMoney(receipt.vat_cents))}</td>
            <td>${escapeHtml(formatMoney(receipt.total_cents))}</td>
          </tr>
        </tbody>
      </table>
      <p class="footer">${escapeHtml(language === "fi" ? "Muokattu" : "Updated")} ${escapeHtml(formatDateTime(receipt.issued_at, language))}, ${escapeHtml(language === "fi" ? "Tulostettu" : "Printed")} ${escapeHtml(formatDateTime(new Date().toISOString(), language))}</p>
    </main>
  </div>
</body>
</html>`;
}

export async function handleEReceiptDownload(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token.trim()) {
    return new Response("Missing receipt token", { status: 400, headers: corsHeaders });
  }

  try {
    const receipt = await findReceiptByToken(token);
    if (receipt.status === "void") throw new Error("Receipt has been voided");
    const html = renderEReceiptHtml(receipt);
    const filename = `${receipt.receipt_number}.html`;
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `${url.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : String(error), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
