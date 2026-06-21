import { buildManageUrl, sendManagedBookingMail, supabaseAdmin, type SupportedLanguage } from "./booking.ts";
import { ensureOrderInvoiceDocument } from "./invoice_document.ts";

type OrderRow = {
  id: string;
  created_at?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  grand_total_cents?: number | null;
  paytrail_status?: string | null;
  paytrail_transaction_id?: string | null;
  paytrail_provider?: string | null;
  cart_snapshot?: any;
};

type InlineImage = {
  cid: string;
  filename: string;
  contentType: string;
  base64: string;
};

const SITE_URL = (Deno.env.get("BOOKING_SITE_URL") ?? Deno.env.get("SITE_URL") ?? "https://mitra-auto.fi").replace(/\/+$/, "");
const TOKEN_TTL_DAYS = Number(Deno.env.get("ORDER_INSTALL_TOKEN_TTL_DAYS") ?? "180");

function env(name: string, fallback?: string) {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function emailButtonBlock(href: string, label: string, variant: "primary" | "secondary") {
  const isPrimary = variant === "primary";
  const background = isPrimary ? "#FF6B35" : "#ffffff";
  const color = isPrimary ? "#ffffff" : "#111827";
  const border = isPrimary ? "1px solid #FF6B35" : "1px solid #d6dccf";

  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 0 10px;">`,
    `<tr>`,
    `<td bgcolor="${background}" style="background-color:${background};border:${border};border-radius:10px;mso-padding-alt:12px 16px;">`,
    `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 16px;border-radius:10px;color:${color};font-size:14px;font-weight:700;line-height:1.2;text-decoration:none;background-color:${background};">${escapeHtml(label)}</a>`,
    `</td>`,
    `</tr>`,
    `</table>`,
  ].join("");
}

function emailButtonCell(href: string, label: string, variant: "primary" | "secondary") {
  const isPrimary = variant === "primary";
  const background = isPrimary ? "#FF6B35" : "#ffffff";
  const color = isPrimary ? "#ffffff" : "#111827";
  const border = isPrimary ? "1px solid #FF6B35" : "1px solid #d6dccf";

  return [
    `<td style="padding:0 10px 10px 0;">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">`,
    `<tr>`,
    `<td bgcolor="${background}" style="background-color:${background};border:${border};border-radius:10px;mso-padding-alt:12px 16px;">`,
    `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 16px;border-radius:10px;color:${color};font-size:14px;font-weight:700;line-height:1.2;text-decoration:none;background-color:${background};white-space:nowrap;">${escapeHtml(label)}</a>`,
    `</td>`,
    `</tr>`,
    `</table>`,
    `</td>`,
  ].join("");
}

function randomToken(bytes = 24) {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buffer).map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(/=+$/g, "");
}

function toBase64Utf8(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toBase64Bytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/(.{76})/g, "$1\r\n");
}

function encodeMimeHeader(value: string) {
  return /[^\u0000-\u007f]/.test(value) ? `=?UTF-8?B?${toBase64Utf8(value)}?=` : value;
}

function mailboxEmail() {
  return env("GMAIL_MAILBOX_EMAIL", "contact@mitra-auto.fi").trim().toLowerCase();
}

function senderAddress() {
  return Deno.env.get("EMAIL_FROM")?.trim() || `Mitra Auto <${mailboxEmail()}>`;
}

async function getValidGmailAccessToken(mailbox = mailboxEmail()) {
  const { data, error } = await supabaseAdmin
    .from("gmail_sync_state")
    .select("*")
    .eq("mailbox_email", mailbox)
    .maybeSingle<any>();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No Gmail connection found for ${mailbox}`);

  const expiry = data.token_expiry ? new Date(data.token_expiry).getTime() : 0;
  if (data.access_token && expiry > Date.now() + 60_000) {
    return data.access_token as string;
  }
  if (!data.refresh_token) throw new Error(`No Gmail refresh token stored for ${mailbox}`);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GMAIL_CLIENT_ID"),
      client_secret: env("GMAIL_CLIENT_SECRET"),
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) throw new Error(`Gmail token refresh failed: ${response.status} ${await response.text()}`);
  const refreshed = await response.json();
  await supabaseAdmin
    .from("gmail_sync_state")
    .update({
      access_token: refreshed.access_token,
      token_expiry: new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString(),
      token_scope: refreshed.scope ?? data.token_scope ?? null,
      token_type: refreshed.token_type ?? data.token_type ?? null,
      last_error: null,
    })
    .eq("mailbox_email", mailbox);
  return refreshed.access_token as string;
}

async function gmailApi<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const mailbox = mailboxEmail();
  const accessToken = await getValidGmailAccessToken(mailbox);
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Gmail API ${method} ${path} failed: ${response.status} ${await response.text()}`);
  return await response.json() as T;
}

function buildRawMessage(args: {
  to: string;
  subject: string;
  text: string;
  html: string;
  inReplyTo?: string | null;
  referencesHeader?: string | null;
  threadMessageId?: string;
  inlineImages?: InlineImage[];
}) {
  const mixedBoundary = `mitra-auto-mixed-${randomToken(8)}`;
  const relatedBoundary = `mitra-auto-related-${randomToken(8)}`;
  const alternativeBoundary = `mitra-auto-alt-${randomToken(8)}`;
  const messageId = args.threadMessageId ?? `<order-${randomToken(12)}@mitra-auto.fi>`;
  const lines = [
    `From: ${senderAddress()}`,
    `To: ${args.to}`,
    `Subject: ${encodeMimeHeader(args.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
  ];
  if (args.inReplyTo) lines.push(`In-Reply-To: ${args.inReplyTo}`);
  if (args.referencesHeader) lines.push(`References: ${args.referencesHeader}`);

  const inlineImages = args.inlineImages ?? [];
  lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`, "");
  lines.push(`--${mixedBoundary}`);

  if (inlineImages.length > 0) {
    lines.push(`Content-Type: multipart/related; boundary="${relatedBoundary}"`, "");
    lines.push(`--${relatedBoundary}`);
  }

  lines.push(`Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`, "");
  lines.push(
    `--${alternativeBoundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    args.text,
    `--${alternativeBoundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    args.html,
    `--${alternativeBoundary}--`,
  );

  if (inlineImages.length > 0) {
    for (const image of inlineImages) {
      lines.push(
        `--${relatedBoundary}`,
        `Content-Type: ${image.contentType}; name="${image.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-ID: <${image.cid}>`,
        `Content-Disposition: inline; filename="${image.filename}"`,
        "",
        image.base64,
      );
    }
    lines.push(`--${relatedBoundary}--`);
  }

  lines.push(`--${mixedBoundary}--`);
  return { raw: lines.join("\r\n"), messageId };
}

function normalizeLanguage(value: unknown): SupportedLanguage {
  return String(value ?? "").toLowerCase() === "en" ? "en" : "fi";
}

function orderLanguage(order: OrderRow): SupportedLanguage {
  return normalizeLanguage(
    order.cart_snapshot?.language ??
      order.cart_snapshot?.locale ??
      order.cart_snapshot?.ui_language ??
      order.cart_snapshot?.customer?.language,
  );
}

function normalizeStatus(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isOrderPaid(order: OrderRow) {
  return [
    order.paytrail_status,
    order.status,
    order.cart_snapshot?.payment_status,
    order.cart_snapshot?.paytrail?.status,
    order.cart_snapshot?.paytrail?.incoming_status,
  ].some((value) => ["paid", "ok", "purchased", "success"].includes(normalizeStatus(value)));
}

function formatProvider(value: unknown) {
  const provider = String(value ?? "").trim();
  return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "";
}

function formatMoney(cents: unknown) {
  const value = Number(cents ?? 0);
  return `€${((Number.isFinite(value) ? value : 0) / 100).toFixed(2)}`;
}

function orderItems(order: OrderRow) {
  return Array.isArray(order.cart_snapshot?.items) ? order.cart_snapshot.items : [];
}

function itemTitle(item: any) {
  return String(
    item?.name ||
      [item?.brand, item?.model].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ") ||
      "Product"
  ).trim();
}

function itemSize(item: any) {
  return String(item?.size_text ?? item?.size ?? "").trim();
}

function primaryOrderItemTitle(order: OrderRow, language: SupportedLanguage = "en") {
  const items = orderItems(order).filter((item: any) => String(item?.sku ?? "").toLowerCase() !== "shipping");
  if (items.length === 0) return "";

  const firstTitle = itemTitle(items[0]);
  if (items.length === 1) return firstTitle;
  return `${firstTitle} + ${items.length - 1} ${language === "fi" ? "muuta" : "more"}`;
}

function maxOrderDeliveryDays(order: OrderRow) {
  const values = orderItems(order)
    .map((item: any) => Number(item?.delivery_days_max ?? item?.delivery_days_min ?? 0))
    .filter((value: number) => Number.isFinite(value) && value > 0);
  return values.length > 0 ? Math.max(...values) : 0;
}

function installBufferBusinessDays(order: OrderRow) {
  return maxOrderDeliveryDays(order) + 2;
}

function installAvailabilityLabel(order: OrderRow, language: SupportedLanguage) {
  const deliveryDays = maxOrderDeliveryDays(order);
  if (deliveryDays <= 0) {
    return language === "fi"
      ? "Voit varata asennuksen aikaisintaan 2 arkipäivän päähän."
      : "You can book installation from 2 business days after the order.";
  }

  return language === "fi"
    ? `Voit varata asennuksen aikaisintaan toimitusarvion (${deliveryDays} päivää) + 2 arkipäivän päähän.`
    : `You can book installation from the delivery estimate (${deliveryDays} Days) + 2 business days after the order.`;
}

function parseRimDiameter(size: string) {
  const normalized = String(size ?? "").replace(",", ".").toUpperCase();
  const patterns = [
    /\b\d+(?:\.\d+)?\s*x\s*\d+(?:\.\d+)?\s*(?:R|-)\s*(\d{1,2}(?:\.\d+)?)\b/i,
    /(?:^|[\s/])(?:R|ZR)\s*(\d{2}(?:\.\d+)?)(?:\D|$)/i,
    /\b\d{2,3}\s*\/\s*\d{2}\s*(?:R|ZR)?\s*(\d{2}(?:\.\d+)?)(?:\D|$)/i,
    /(?:^|[^\d])(\d{2}(?:\.\d+)?)\s*(?:"|INCH|TUUMA)(?:\D|$)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const value = match ? Number(match[1]) : NaN;
    if (Number.isFinite(value) && value > 0) return value;
  }

  return null;
}

function tireWorkServiceForOrder(order: OrderRow) {
  const diameters = orderItems(order)
    .map((item: any) => parseRimDiameter(`${itemSize(item)} ${itemTitle(item)}`))
    .filter((value: number | null): value is number => value !== null);
  const maxDiameter = diameters.length > 0 ? Math.max(...diameters) : null;

  if (maxDiameter === null) return "tire-work-up-to-17";
  if (maxDiameter <= 17) return "tire-work-up-to-17";
  if (maxDiameter <= 19) return "tire-work-18-19";
  return "tire-work-20-21";
}

function tireWorkServiceName(serviceId: string, language: SupportedLanguage) {
  const names: Record<string, Record<SupportedLanguage, string>> = {
    "tire-work-up-to-17": {
      fi: 'Rengastyö – Henkilöauto max. 17"',
      en: 'Tire work – Passenger car up to 17"',
    },
    "tire-work-18-19": {
      fi: 'Rengastyö – Henkilöauto 18"–19"',
      en: 'Tire work – Passenger car 18"–19"',
    },
    "tire-work-20-21": {
      fi: 'Rengastyö – Henkilöauto 20"–21"',
      en: 'Tire work – Passenger car 20"–21"',
    },
  };
  return names[serviceId]?.[language] ?? names["tire-work-up-to-17"][language];
}

function buildItemsText(order: OrderRow, language: SupportedLanguage) {
  const items = orderItems(order);
  if (items.length === 0) return "";

  const heading = language === "fi" ? "Tuotteet" : "Items";
  return [
    heading,
    ...items.map((item: any) => {
      const qty = Number(item?.qty ?? 1) || 1;
      const unit = formatMoney(item?.client_unit_price_cents);
      const line = formatMoney(item?.line_total_cents ?? Number(item?.client_unit_price_cents ?? 0) * qty);
      const size = itemSize(item);
      return `- ${itemTitle(item)}${size ? ` (${size})` : ""}, ${qty} × ${unit} = ${line}`;
    }),
  ].join("\n");
}

async function buildInlineImages(order: OrderRow) {
  const items = orderItems(order).slice(0, 6);
  const inlineImages: InlineImage[] = [];
  const cidByIndex = new Map<number, string>();

  await Promise.all(items.map(async (item: any, index: number) => {
    const imageUrl = String(item?.image_url ?? "").trim();
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return;

      const contentType = response.headers.get("content-type") ?? "image/jpeg";
      if (!contentType.startsWith("image/")) return;

      const buffer = new Uint8Array(await response.arrayBuffer());
      if (buffer.byteLength > 750_000) return;

      const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const cid = `order-item-${index}-${randomToken(4)}@mitra-auto.fi`;
      inlineImages.push({
        cid,
        filename: `item-${index + 1}.${extension}`,
        contentType,
        base64: toBase64Bytes(buffer),
      });
      cidByIndex.set(index, cid);
    } catch (error) {
      console.warn("Failed to inline order item image", error);
    }
  }));

  return { inlineImages, cidByIndex };
}

function buildItemsHtml(order: OrderRow, language: SupportedLanguage, cidByIndex: Map<number, string>) {
  const items = orderItems(order);
  if (items.length === 0) return "";

  return [
    `<h2 style="font-size:18px;margin:28px 0 12px;">${escapeHtml(language === "fi" ? "Tilatut tuotteet" : "Items ordered")}</h2>`,
    ...items.map((item: any, index: number) => {
      const qty = Number(item?.qty ?? 1) || 1;
      const unit = formatMoney(item?.client_unit_price_cents);
      const line = formatMoney(item?.line_total_cents ?? Number(item?.client_unit_price_cents ?? 0) * qty);
      const imageCid = cidByIndex.get(index);
      const title = itemTitle(item);
      const size = itemSize(item);

      return [
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fffdf8" style="border:1px solid #e5e7eb;border-radius:14px;margin:12px 0;background-color:#fffdf8;border-collapse:separate;table-layout:fixed;">`,
        `<tr>`,
        `<td width="88" valign="top" bgcolor="#fffdf8" style="background-color:#fffdf8;padding:12px;border-radius:14px 0 0 14px;">`,
        imageCid
          ? `<img src="cid:${escapeHtml(imageCid)}" alt="${escapeHtml(title)}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:contain;border-radius:10px;background:#ffffff;border:1px solid #edf2f7;" />`
          : `<div style="width:72px;height:72px;border-radius:10px;background:#ffffff;border:1px solid #edf2f7;"></div>`,
        `</td>`,
        `<td valign="top" bgcolor="#fffdf8" style="background-color:#fffdf8;padding:12px 12px 12px 0;word-break:break-word;border-radius:0 14px 14px 0;">`,
        `<div style="font-size:16px;font-weight:700;line-height:1.25;color:#111827;margin:0 0 5px;">${escapeHtml(title)}</div>`,
        size ? `<div style="font-size:13px;color:#64748b;line-height:1.35;margin:0 0 10px;">${escapeHtml(size)}</div>` : "",
        `<div style="font-size:13px;color:#475569;line-height:1.35;margin:0;">${qty} × ${unit} / ${escapeHtml(language === "fi" ? "kpl" : "pcs")} <span style="font-size:13px;font-weight:700;color:#ff6b00;text-transform:uppercase;white-space:nowrap;">${line}</span></div>`,
        `</td>`,
        `</tr>`,
        `</table>`,
      ].join("");
    }),
  ].join("");
}

function orderCustomer(order: OrderRow) {
  const snapshot = order.cart_snapshot ?? {};
  const customer = snapshot.customer ?? {};
  return {
    email: String(order.email ?? customer.email ?? "").trim(),
    phone: String(order.phone ?? customer.phone ?? "").trim(),
    name: [customer.firstName, customer.lastName].map((part) => String(part ?? "").trim()).filter(Boolean).join(" "),
  };
}

export function addBusinessDaysIso(from: Date, days: number) {
  const date = new Date(from);
  date.setHours(12, 0, 0, 0);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return date.toISOString().slice(0, 10);
}

async function issueInstallToken(order: OrderRow) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const customer = orderCustomer(order);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin.from("order_install_tokens").insert({
    order_id: order.id,
    token_hash: tokenHash,
    customer_email: customer.email || null,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);
  return token;
}

export async function getOrderInstallContext(token: string) {
  const tokenHash = await sha256Hex(token.trim());
  const { data, error } = await supabaseAdmin
    .from("order_install_tokens")
    .select("*, orders(*)")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<any>();
  if (error) throw new Error(error.message);
  if (!data?.orders) throw new Error("Invalid or expired install token");

  const order = data.orders as OrderRow;
  const customer = orderCustomer(order);
  const language = orderLanguage(order);
  return {
    token,
    orderId: order.id,
    language,
    customer,
    recommendedDate: addBusinessDaysIso(new Date(order.created_at ?? Date.now()), installBufferBusinessDays(order)),
    deliveryDaysMax: maxOrderDeliveryDays(order),
    installBufferBusinessDays: installBufferBusinessDays(order),
    serviceId: tireWorkServiceForOrder(order),
    usedBookingId: data.used_booking_id ?? null,
  };
}

export async function sendOrderConfirmationEmail(orderId: string) {
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle<OrderRow>();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found");

  const customer = orderCustomer(order);
  if (!customer.email) return { ok: true, skipped: true };

  const existing = await supabaseAdmin
    .from("order_email_threads")
    .select("id, status")
    .eq("order_id", order.id)
    .in("status", ["active", "sending"])
    .limit(1)
    .maybeSingle();
  if (existing.data?.id) return { ok: true, skipped: true };

  const paid = isOrderPaid(order);
  const language = orderLanguage(order);
  const installToken = paid ? await issueInstallToken(order) : null;
  const invoiceReceipt = paid ? await ensureOrderInvoiceDocument(order) : null;
  const installUrl = installToken
    ? `${SITE_URL}${language === "en" ? "/en" : ""}/?book_install=1&install_token=${encodeURIComponent(installToken)}`
    : "";
  const retryUrl = `${SITE_URL}/catalog`;
  const total = `€${((Number(order.grand_total_cents ?? 0) || 0) / 100).toFixed(2)}`;
  const subtotal = formatMoney(order.cart_snapshot?.subtotal_cents);
  const shipping = formatMoney(order.cart_snapshot?.shipping_cents);
  const vat = formatMoney(order.cart_snapshot?.tax_cents);
  const provider = formatProvider(order.paytrail_provider);
  const installAvailability = installAvailabilityLabel(order, language);
  const { inlineImages, cidByIndex } = await buildInlineImages(order);
  const subjectItem = primaryOrderItemTitle(order, language);
  const subject = paid
    ? (language === "fi"
      ? `Tilausvahvistus: ${subjectItem || order.id}`
      : `Order confirmation: ${subjectItem || order.id}`)
    : (language === "fi"
      ? `Maksua ei vahvistettu: ${subjectItem || order.id}`
      : `Payment not confirmed: ${subjectItem || order.id}`);
  const statusLine = paid
    ? (language === "fi" ? "Maksu on vastaanotettu onnistuneesti." : "Your payment has been received.")
    : (language === "fi" ? "Maksua ei ole vielä vahvistettu." : "Your payment is not confirmed yet.");
  const buttonLabel = paid
    ? (language === "fi" ? "Varaa asennus" : "Book install")
    : (language === "fi" ? "Palaa verkkokauppaan" : "Return to webshop");
  const receiptButtonLabel = language === "fi" ? "Lataa kuitti" : "Download receipt";
  const statusColor = paid ? "#047857" : "#b45309";
  const statusBg = paid ? "#dcfce7" : "#fef3c7";
  const statusLabel = paid
    ? (language === "fi" ? "Maksettu" : "Paid")
    : (language === "fi" ? "Maksu odottaa" : "Payment pending");
  const text = [
    language === "fi" ? "Kiitos tilauksestasi Mitra Autolta." : "Thank you for your order from Mitra Auto.",
    statusLine,
    `${language === "fi" ? "Tilaus" : "Order"}: ${order.id}`,
    provider ? `${language === "fi" ? "Maksutapa" : "Payment provider"}: ${provider}` : "",
    "",
    buildItemsText(order, language),
    "",
    `${language === "fi" ? "Välisumma" : "Subtotal"}: ${subtotal}`,
    `${language === "fi" ? "Toimitus" : "Shipping"}: ${shipping}`,
    `${language === "fi" ? "ALV" : "VAT"}: ${vat}`,
    `${language === "fi" ? "Yhteensä" : "Total"}: ${total}`,
    paid && invoiceReceipt ? `${receiptButtonLabel}: ${invoiceReceipt.url}` : "",
    paid ? installAvailability : "",
    "",
    paid ? `${buttonLabel}: ${installUrl}` : `${buttonLabel}: ${retryUrl}`,
  ].filter(Boolean).join("\n");
  const html = [
    `<div style="margin:0;padding:28px;font-family:Arial,sans-serif;color:#111827;line-height:1.55;">`,
    `<div style="max-width:680px;margin:0 auto;padding:0;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 22px;"><tr><td style="font-size:22px;font-weight:800;color:#111827;">Mitra Auto</td><td align="right"><span style="display:inline-block;border-radius:999px;background:${statusBg};color:${statusColor};font-size:12px;font-weight:800;padding:6px 10px;text-transform:uppercase;letter-spacing:.02em;">${escapeHtml(statusLabel)}</span></td></tr></table>`,
    `<p style="font-size:18px;font-weight:700;margin:0 0 8px;color:#111827;">${escapeHtml(language === "fi" ? "Kiitos tilauksestasi Mitra Autolta." : "Thank you for your order from Mitra Auto.")}</p>`,
    `<p style="font-size:15px;color:#475569;margin:0 0 20px;">${escapeHtml(statusLine)}</p>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fffdf8" style="border:1px solid #dce2d4;border-radius:14px;background-color:#fffdf8;border-collapse:separate;margin:20px 0;">`,
    `<tr><td bgcolor="#fffdf8" style="background-color:#fffdf8;padding:6px 18px;border-radius:14px;">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background-color:#fffdf8;">`,
    `<tr><td bgcolor="#fffdf8" style="background-color:#fffdf8;padding:10px 0;color:#6b7280;font-size:13px;width:34%;vertical-align:top;">${escapeHtml(language === "fi" ? "Tilausnumero" : "Order number")}</td><td bgcolor="#fffdf8" style="background-color:#fffdf8;padding:10px 0;color:#111827;font-size:14px;font-weight:700;vertical-align:top;">${escapeHtml(order.id)}</td></tr>`,
    provider ? `<tr><td bgcolor="#fffdf8" style="background-color:#fffdf8;padding:10px 0;color:#6b7280;font-size:13px;width:34%;vertical-align:top;border-top:1px solid #eef1ea;">${escapeHtml(language === "fi" ? "Maksutapa" : "Payment provider")}</td><td bgcolor="#fffdf8" style="background-color:#fffdf8;padding:10px 0;color:#111827;font-size:14px;font-weight:700;vertical-align:top;border-top:1px solid #eef1ea;">${escapeHtml(provider)}</td></tr>` : "",
    order.paytrail_transaction_id ? `<tr><td bgcolor="#fffdf8" style="background-color:#fffdf8;padding:10px 0;color:#6b7280;font-size:13px;width:34%;vertical-align:top;border-top:1px solid #eef1ea;">${escapeHtml(language === "fi" ? "Maksutapahtuma" : "Transaction")}</td><td bgcolor="#fffdf8" style="background-color:#fffdf8;padding:10px 0;color:#111827;font-size:14px;font-weight:700;vertical-align:top;border-top:1px solid #eef1ea;">${escapeHtml(order.paytrail_transaction_id)}</td></tr>` : "",
    `</table>`,
    `</td></tr>`,
    `</table>`,
    buildItemsHtml(order, language, cidByIndex),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #dce2d4;margin-top:22px;padding-top:16px;border-collapse:collapse;">`,
    `<tr><td style="padding:4px 0;color:#475569;">${escapeHtml(language === "fi" ? "Välisumma" : "Subtotal")}</td><td align="right" style="padding:4px 0;color:#475569;font-weight:700;">${escapeHtml(subtotal)}</td></tr>`,
    `<tr><td style="padding:4px 0;color:#475569;">${escapeHtml(language === "fi" ? "Toimitus" : "Shipping")}</td><td align="right" style="padding:4px 0;color:#475569;font-weight:700;">${escapeHtml(shipping)}</td></tr>`,
    `<tr><td style="padding:4px 0 10px;color:#475569;">${escapeHtml(language === "fi" ? "ALV 25,5%" : "VAT 25.5%")}</td><td align="right" style="padding:4px 0 10px;color:#475569;font-weight:700;">${escapeHtml(vat)}</td></tr>`,
    `<tr><td style="padding:8px 0 0;font-size:20px;color:#111827;font-weight:800;">${escapeHtml(language === "fi" ? "Yhteensä" : "Total")}</td><td align="right" style="padding:8px 0 0;font-size:20px;color:#c94f1e;font-weight:800;">${escapeHtml(total)}</td></tr>`,
    `</table>`,
    paid ? `<p style="margin:18px 0 0;color:#475569;font-size:14px;">${escapeHtml(installAvailability)}</p>` : "",
    paid && invoiceReceipt
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:22px 0 0;"><tr>${emailButtonCell(installUrl, buttonLabel, "primary")}${emailButtonCell(invoiceReceipt.url, receiptButtonLabel, "secondary")}</tr></table>`
      : `<div style="margin-top:22px;">${emailButtonBlock(paid ? installUrl : retryUrl, buttonLabel, "primary")}</div>`,
    `<p style="margin-top:20px;color:#6b7280;font-size:14px;">${escapeHtml(
      paid
        ? (language === "fi" ? "Linkki avaa varauksen ja täyttää jo tiedossa olevat yhteystiedot. Valitse normaaliin tapaan päivä ja aika." : "The link opens booking with known contact details prefilled. Choose date and time as usual.")
        : (language === "fi" ? "Asennusvaraus avautuu vasta, kun maksu on vahvistettu." : "Installation booking is available only after payment is confirmed.")
    )}</p>`,
    `</div>`,
    `</div>`,
  ].join("");

  const { data: reservedThread, error: reserveError } = await supabaseAdmin
    .from("order_email_threads")
    .insert({
      order_id: order.id,
      provider: "gmail",
      mailbox_email: mailboxEmail(),
      subject,
      status: "sending",
      last_synced_at: new Date().toISOString(),
    })
    .select("*")
    .single<any>();
  if (reserveError) {
    if (String(reserveError.code ?? "") === "23505") return { ok: true, skipped: true };
    throw new Error(reserveError.message);
  }

  const raw = buildRawMessage({ to: customer.email, subject, text, html, inlineImages });
  let result: { id: string; threadId: string; historyId?: string; internalDate?: string };
  try {
    result = await gmailApi<{ id: string; threadId: string; historyId?: string; internalDate?: string }>("/messages/send", "POST", {
      raw: toBase64Url(raw.raw),
    });
  } catch (error) {
    await supabaseAdmin.from("order_email_threads").delete().eq("id", reservedThread.id);
    throw error;
  }

  const sentAt = result.internalDate ? new Date(Number(result.internalDate)).toISOString() : new Date().toISOString();
  const { data: thread, error: threadError } = await supabaseAdmin
    .from("order_email_threads")
    .update({
      provider_thread_id: result.threadId,
      status: "active",
      history_id: result.historyId ?? null,
      last_message_at: sentAt,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", reservedThread.id)
    .select("*")
    .single<any>();
  if (threadError) throw new Error(threadError.message);
  await supabaseAdmin.from("order_email_messages").insert({
    thread_id: thread.id,
    order_id: order.id,
    provider: "gmail",
    direction: "outbound",
    mailbox_email: mailboxEmail(),
    provider_message_id: result.id,
    provider_thread_id: result.threadId,
    message_id_header: raw.messageId,
    from_email: senderAddress(),
    to_email: customer.email,
    subject,
    snippet: text.slice(0, 255),
    body_text: text,
    body_html: html,
    sent_at: sentAt,
    payload: { order_mail_type: paid ? "payment_paid" : "payment_not_confirmed" },
  });
  if (paid && invoiceReceipt?.document?.id) {
    await supabaseAdmin.from("invoice_events").insert({
      document_id: invoiceReceipt.document.id,
      event_type: "order_confirmation_linked",
      actor: "edge_function",
      payload: {
        order_id: order.id,
        order_email_message_id: result.id,
        provider_thread_id: result.threadId,
      },
    });
  }

  return { ok: true, orderId: order.id, installUrl: paid ? installUrl : null, receiptUrl: invoiceReceipt?.url ?? null };
}

export async function createInstallBookingFromOrder(token: string, body: Record<string, unknown>) {
  const context = await getOrderInstallContext(token);
  if (context.usedBookingId) throw new Error("Install booking has already been created for this order");

  const bookingDate = String(body.bookingDate ?? body.booking_date ?? "").trim();
  const bookingTime = String(body.bookingTime ?? body.booking_time ?? "").trim().slice(0, 5);
  const licensePlate = String(body.licensePlate ?? body.license_plate ?? "").trim().toUpperCase();
  const customerName = String(body.customerName ?? body.customer_name ?? context.customer.name ?? "").trim();
  const customerPhone = String(body.customerPhone ?? body.customer_phone ?? context.customer.phone ?? "").trim();
  const customerEmail = String(body.customerEmail ?? body.customer_email ?? context.customer.email ?? "").trim();
  const notes = String(body.notes ?? "").trim();
  const language = normalizeLanguage(body.language ?? context.language);
  const serviceName = String(body.serviceName ?? body.service_name ?? tireWorkServiceName(context.serviceId, language)).trim();
  if (!bookingDate || !bookingTime || !licensePlate || !customerPhone) throw new Error("Missing booking details");

  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .insert({
      license_plate: licensePlate,
      booking_date: bookingDate,
      booking_time: bookingTime,
      booking_language: language,
      service_name: serviceName,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || context.customer.email || null,
      notes: [notes, `Order: ${context.orderId}`].filter(Boolean).join("\n"),
      status: "confirmed",
    })
    .select("*")
    .single<any>();
  if (error) throw new Error(error.message);

  const { data: orderThread } = await supabaseAdmin
    .from("order_email_threads")
    .select("*")
    .eq("order_id", context.orderId)
    .limit(1)
    .maybeSingle<any>();
  const { data: orderMessage } = await supabaseAdmin
    .from("order_email_messages")
    .select("*")
    .eq("order_id", context.orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<any>();

  if (orderThread?.provider_thread_id || orderMessage?.message_id_header) {
    const { data: bookingThread } = await supabaseAdmin
      .from("booking_email_threads")
      .insert({
        booking_id: booking.id,
        provider: "gmail",
        mailbox_email: orderThread?.mailbox_email ?? mailboxEmail(),
        provider_thread_id: orderThread?.provider_thread_id ?? null,
        subject: orderThread?.subject ?? orderMessage?.subject ?? null,
        status: "active",
        history_id: orderThread?.history_id ?? null,
        last_message_at: orderThread?.last_message_at ?? orderMessage?.sent_at ?? null,
        last_synced_at: new Date().toISOString(),
      })
      .select("*")
      .single<any>();

    if (bookingThread) {
      await supabaseAdmin.from("booking_email_messages").insert({
        thread_id: bookingThread.id,
        booking_id: booking.id,
        provider: "gmail",
        direction: "outbound",
        mailbox_email: orderMessage?.mailbox_email ?? mailboxEmail(),
        provider_message_id: orderMessage?.provider_message_id ?? null,
        provider_thread_id: orderMessage?.provider_thread_id ?? orderThread?.provider_thread_id ?? null,
        message_id_header: orderMessage?.message_id_header ?? null,
        references_header: orderMessage?.references_header ?? orderMessage?.message_id_header ?? null,
        from_email: orderMessage?.from_email ?? senderAddress(),
        to_email: orderMessage?.to_email ?? customerEmail,
        subject: orderMessage?.subject ?? orderThread?.subject ?? null,
        snippet: orderMessage?.snippet ?? null,
        body_text: orderMessage?.body_text ?? null,
        body_html: orderMessage?.body_html ?? null,
        sent_at: orderMessage?.sent_at ?? null,
        payload: { seeded_from_order_id: context.orderId },
      });
    }
  }

  await supabaseAdmin
    .from("order_install_tokens")
    .update({ used_booking_id: booking.id, used_at: new Date().toISOString() })
    .eq("order_id", context.orderId)
    .eq("token_hash", await sha256Hex(token.trim()));

  const mailResult = await sendManagedBookingMail({
    bookingId: booking.id,
    type: "confirmation",
    incrementSequence: true,
  });

  return { ok: true, booking: mailResult.booking, manageUrl: mailResult.manageUrl ?? buildManageUrl("", language) };
}
