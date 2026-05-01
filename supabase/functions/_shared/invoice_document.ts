import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { corsHeaders, jsonResponse, supabaseAdmin } from "./booking.ts";

type SupportedLanguage = "fi" | "en";

type InvoiceDocument = {
  id: string;
  document_number: string;
  document_type: string;
  source_type: string;
  order_id?: string | null;
  booking_id?: string | null;
  status: string;
  language: SupportedLanguage;
  currency: string;
  issue_date?: string | null;
  due_date?: string | null;
  supply_date?: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  vat_cents: number;
  total_cents: number;
  paid_cents: number;
  validation_tier?: string | null;
  validation_errors?: unknown;
  payload?: any;
  internal_notes?: string | null;
  issued_at?: string | null;
};

type InvoiceParty = {
  role: string;
  name: string;
  business_id?: string | null;
  vat_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country_code?: string | null;
};

type InvoiceLine = {
  line_number: number;
  item_type: string;
  title: string;
  description?: string | null;
  quantity: number;
  unit_label: string;
  unit_price_excl_vat_cents: number;
  unit_price_incl_vat_cents: number;
  vat_rate: number;
  line_vat_excl_cents: number;
  line_vat_cents: number;
  line_total_cents: number;
  source_payload?: any;
};

type InvoiceVat = {
  vat_rate: number;
  vat_code: string;
  base_cents: number;
  vat_cents: number;
  total_cents: number;
};

type LoadedInvoice = {
  document: InvoiceDocument;
  parties: InvoiceParty[];
  lines: InvoiceLine[];
  vatBreakdowns: InvoiceVat[];
  payment: any | null;
};

const FUNCTIONS_URL = `${(Deno.env.get("SUPABASE_URL") ?? "https://rcmmbwdebnmicrweoiyz.supabase.co").replace(/\/+$/, "")}/functions/v1`;
const SITE_URL = (Deno.env.get("SITE_URL") ?? Deno.env.get("BOOKING_SITE_URL") ?? "http://localhost:5173").replace(/\/+$/, "");
const EMBEDDED_LOGO_BASE64 = "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";

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

function money(cents: unknown) {
  const value = Number(cents ?? 0);
  return `EUR ${((Number.isFinite(value) ? value : 0) / 100).toFixed(2)}`;
}

function dateText(value: string | null | undefined, language: SupportedLanguage) {
  if (!value) return "-";
  return new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString(language === "fi" ? "fi-FI" : "en-GB");
}

function randomToken(bytes = 24) {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buffer).map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function checksumHex(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join("");
}

let cachedLogoBytes: Uint8Array | null | undefined;

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function mitraLogoBytes() {
  if (cachedLogoBytes !== undefined) return cachedLogoBytes;
  try {
    if (EMBEDDED_LOGO_BASE64 && !EMBEDDED_LOGO_BASE64.startsWith("__")) {
      cachedLogoBytes = base64ToBytes(EMBEDDED_LOGO_BASE64);
      return cachedLogoBytes;
    }
    const response = await fetch(`${SITE_URL}/icons/mitra-app-icon-1024.png`);
    if (!response.ok) throw new Error(`Logo request failed: ${response.status}`);
    cachedLogoBytes = new Uint8Array(await response.arrayBuffer());
  } catch (_) {
    cachedLogoBytes = null;
  }
  return cachedLogoBytes;
}

function documentLabel(document: InvoiceDocument, language: SupportedLanguage) {
  if (document.document_type === "invoice") return language === "fi" ? "LASKU / INVOICE" : "INVOICE / LASKU";
  return language === "fi" ? "KUITTI / RECEIPT" : "RECEIPT / KUITTI";
}

function importedReceipt(document: InvoiceDocument) {
  return document.payload?.imported_receipt ?? null;
}

function unitLabelForLanguage(line: InvoiceLine, language: SupportedLanguage) {
  if (language === "en") {
    return String(line.source_payload?.unit_label_en ?? translateUnitLabel(line.unit_label)).trim() || "pcs";
  }
  return String(line.source_payload?.unit_label_fi ?? line.unit_label ?? "kpl").trim() || "kpl";
}

function translateUnitLabel(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "kpl") return "pcs";
  if (normalized === "l") return "l";
  if (normalized === "pari") return "pair";
  if (normalized === "sarja") return "set";
  return normalized || "pcs";
}

function lineTitleForLanguage(line: InvoiceLine, language: SupportedLanguage) {
  if (language === "en") {
    return String(line.source_payload?.description_en ?? line.title ?? "").trim() || line.title;
  }
  return String(line.source_payload?.description_fi ?? line.title ?? "").trim() || line.title;
}

function partyByRole(parties: InvoiceParty[], role: string) {
  return parties.find((party) => party.role === role) ?? null;
}

function validationFor(invoice: LoadedInvoice) {
  const document = invoice.document;
  const buyer = partyByRole(invoice.parties, "buyer");
  const fullRequired = document.document_type === "invoice" || Boolean(buyer?.business_id || buyer?.vat_id);
  const errors: string[] = [];
  if (fullRequired) {
    if (!buyer?.name?.trim()) errors.push("Missing buyer name");
    if (!buyer?.address_line1?.trim()) errors.push("Missing buyer address");
    if (!buyer?.postal_code?.trim()) errors.push("Missing buyer postal code");
    if (!buyer?.city?.trim()) errors.push("Missing buyer city");
    if (!document.supply_date) errors.push("Missing supply/service date");
  }
  if (invoice.lines.length === 0) errors.push("Missing line items");
  for (const line of invoice.lines) {
    if (!line.title?.trim()) errors.push(`Missing title on line ${line.line_number}`);
  }
  return {
    fullRequired,
    tier: errors.length ? "blocked" : fullRequired ? "full_ok" : "simplified_ok",
    errors,
  };
}

export async function loadInvoiceDocument(documentId: string): Promise<LoadedInvoice> {
  const [documentResult, partiesResult, linesResult, vatResult, paymentResult] = await Promise.all([
    supabaseAdmin.from("invoice_documents").select("*").eq("id", documentId).single<InvoiceDocument>(),
    supabaseAdmin.from("invoice_parties").select("*").eq("document_id", documentId),
    supabaseAdmin.from("invoice_lines").select("*").eq("document_id", documentId).order("line_number", { ascending: true }),
    supabaseAdmin.from("invoice_vat_breakdowns").select("*").eq("document_id", documentId).order("vat_rate", { ascending: true }),
    supabaseAdmin.from("invoice_payment_details").select("*").eq("document_id", documentId).maybeSingle(),
  ]);

  if (documentResult.error || !documentResult.data) throw new Error(documentResult.error?.message ?? "Invoice document not found");
  if (partiesResult.error) throw new Error(partiesResult.error.message);
  if (linesResult.error) throw new Error(linesResult.error.message);
  if (vatResult.error) throw new Error(vatResult.error.message);
  if (paymentResult.error) throw new Error(paymentResult.error.message);

  return {
    document: documentResult.data,
    parties: (partiesResult.data ?? []) as InvoiceParty[],
    lines: (linesResult.data ?? []) as InvoiceLine[],
    vatBreakdowns: (vatResult.data ?? []) as InvoiceVat[],
    payment: paymentResult.data ?? null,
  };
}

function renderInvoiceHtml(invoice: LoadedInvoice) {
  const { document, lines, vatBreakdowns } = invoice;
  const language = normalizeLanguage(document.language);
  const seller = partyByRole(invoice.parties, "seller");
  const buyer = partyByRole(invoice.parties, "buyer");
  const imported = importedReceipt(document);
  const title = documentLabel(document, language);
  const issued = document.issued_at ?? new Date().toISOString();
  const l = {
    seller: language === "fi" ? "Myyjä / Seller" : "Seller / Myyjä",
    buyer: language === "fi" ? "Asiakas / Customer" : "Customer / Asiakas",
    number: language === "fi" ? "Numero / Number" : "Number / Numero",
    issueDate: language === "fi" ? "Päiväys / Issue date" : "Issue date / Päiväys",
    supplyDate: language === "fi" ? "Toimitus- tai suorituspäivä / Supply date" : "Supply date / Toimitus- tai suorituspäivä",
    y: "Y-tunnus / Business ID",
    vatId: "ALV-tunnus / VAT ID",
    item: language === "fi" ? "Tuote tai palvelu" : "Goods or services",
    qty: language === "fi" ? "Määrä" : "Qty",
    unitNet: language === "fi" ? "Yksikkö veroton" : "Unit excl. VAT",
    vat: "ALV / VAT",
    total: language === "fi" ? "Yhteensä" : "Total",
    net: language === "fi" ? "Veroton" : "Net",
    gross: language === "fi" ? "Verollinen" : "Gross",
    paid: language === "fi" ? "Maksettu" : "Paid",
    printed: language === "fi" ? "Lähetetty / tulostettu" : "Sent / printed",
  };

  const partyHtml = (party: InvoiceParty | null, sellerParty = false) => [
    `<strong>${escapeHtml(party?.name ?? "-")}</strong>`,
    party?.address_line1 ? escapeHtml(party.address_line1) : "",
    party?.address_line2 ? escapeHtml(party.address_line2) : "",
    party?.postal_code || party?.city ? escapeHtml([party?.postal_code, party?.city].filter(Boolean).join(" ")) : "",
    sellerParty && party?.business_id ? `${escapeHtml(l.y)}: ${escapeHtml(party.business_id)}` : party?.business_id ? `${escapeHtml(l.y)}: ${escapeHtml(party.business_id)}` : "",
    party?.vat_id ? `${escapeHtml(l.vatId)}: ${escapeHtml(party.vat_id)}` : "",
    party?.email ? escapeHtml(party.email) : "",
    party?.phone ? escapeHtml(party.phone) : "",
  ].filter(Boolean).map((item) => `<p>${item}</p>`).join("");

  const sourceBlock = imported ? `<section><h2>${escapeHtml(language === "fi" ? "Ajoneuvo / Vehicle" : "Vehicle / Ajoneuvo")}</h2><div class="box">
<p><strong>${escapeHtml(language === "fi" ? "Rekisterinumero" : "License plate")}:</strong> ${escapeHtml(imported.vehicle?.license_plate ?? "-")}</p>
<p><strong>${escapeHtml(language === "fi" ? "Ajoneuvo" : "Vehicle")}:</strong> ${escapeHtml(imported.vehicle?.vehicle ?? "-")}</p>
<p><strong>${escapeHtml(language === "fi" ? "Ajettu" : "Mileage")}:</strong> ${escapeHtml(imported.vehicle?.mileage_km ? `${imported.vehicle.mileage_km} km` : "-")}</p>
<p><strong>VIN:</strong> ${escapeHtml(imported.vehicle?.vin ?? "-")}</p>
</div></section>` : "";

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)} ${escapeHtml(document.document_number)}</title>
<style>
body{margin:0;background:#f4f5f7;color:#111827;font-family:Arial,sans-serif;font-size:13px}.page{max-width:900px;margin:0 auto;padding:28px 16px}.doc{background:#fff;border:1px solid #d9dde5;border-radius:10px;padding:30px}.top{display:grid;grid-template-columns:1fr 270px;gap:28px}.doc h1{font-size:28px;letter-spacing:.08em;margin:0 0 18px}.muted{color:#64748b}.box{border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fafafa}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}p{margin:3px 0}.meta-row{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e5e7eb;padding:5px 0}.lines,.vat{width:100%;border-collapse:collapse;margin-top:18px}.lines th,.vat th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #111827;padding:8px;text-align:left}.lines td,.vat td{border-bottom:1px solid #e5e7eb;padding:8px;vertical-align:top}.right{text-align:right;white-space:nowrap}.total{font-size:20px;font-weight:800}.summary{margin-left:auto;width:min(360px,100%);margin-top:14px}.summary td{padding:5px 0}.footer{font-size:12px;color:#64748b;margin-top:20px}@media(max-width:640px){.doc{border-radius:0;border-left:0;border-right:0;padding:18px}.page{padding:0}.top,.grid{display:block}.box{margin-top:10px}.lines{font-size:11px}}@media print{body{background:#fff}.page{padding:0;max-width:none}.doc{border:0;border-radius:0}}
</style></head><body><div class="page"><main class="doc">
<div class="top"><section><h1>${escapeHtml(title)}</h1><div class="box">${partyHtml(seller, true)}</div></section><section>
<div class="meta-row"><span>${escapeHtml(l.number)}</span><strong>${escapeHtml(document.document_number)}</strong></div>
<div class="meta-row"><span>${escapeHtml(l.issueDate)}</span><strong>${escapeHtml(dateText(document.issue_date ?? issued, language))}</strong></div>
<div class="meta-row"><span>${escapeHtml(l.supplyDate)}</span><strong>${escapeHtml(dateText(document.supply_date ?? document.issue_date, language))}</strong></div>
${document.order_id ? `<div class="meta-row"><span>Order</span><strong>${escapeHtml(document.order_id)}</strong></div>` : ""}
${document.booking_id ? `<div class="meta-row"><span>Booking</span><strong>${escapeHtml(document.booking_id)}</strong></div>` : ""}
</section></div>
<div class="grid"><section><h2>${escapeHtml(l.buyer)}</h2><div class="box">${partyHtml(buyer)}</div></section><section><h2>${escapeHtml(l.paid)}</h2><div class="box"><p>${escapeHtml(invoice.payment?.payment_provider ?? "-")}</p>${invoice.payment?.transaction_id ? `<p>${escapeHtml(invoice.payment.transaction_id)}</p>` : ""}</div></section></div>
${sourceBlock}
<table class="lines"><thead><tr><th>${escapeHtml(l.item)}</th><th class="right">${escapeHtml(l.qty)}</th><th class="right">${escapeHtml(l.unitNet)}</th><th class="right">${escapeHtml(l.vat)}</th><th class="right">${escapeHtml(l.total)}</th></tr></thead><tbody>
${lines.map((line) => `<tr><td><strong>${escapeHtml(lineTitleForLanguage(line, language))}</strong>${line.description ? `<br><span class="muted">${escapeHtml(line.description)}</span>` : ""}</td><td class="right">${escapeHtml(String(line.quantity))} ${escapeHtml(unitLabelForLanguage(line, language))}</td><td class="right">${escapeHtml(money(line.unit_price_excl_vat_cents))}</td><td class="right">${escapeHtml(String(line.vat_rate))}%</td><td class="right"><strong>${escapeHtml(money(line.line_total_cents))}</strong></td></tr>`).join("")}
</tbody></table>
<table class="summary"><tr><td>${escapeHtml(l.net)}</td><td class="right">${escapeHtml(money(document.subtotal_cents))}</td></tr><tr><td>${escapeHtml(l.vat)}</td><td class="right">${escapeHtml(money(document.vat_cents))}</td></tr><tr><td class="total">${escapeHtml(l.total)}</td><td class="right total">${escapeHtml(money(document.total_cents))}</td></tr></table>
<table class="vat"><thead><tr><th>${escapeHtml(l.vat)}</th><th class="right">${escapeHtml(l.net)}</th><th class="right">${escapeHtml(l.vat)}</th><th class="right">${escapeHtml(l.gross)}</th></tr></thead><tbody>
${vatBreakdowns.map((row) => `<tr><td>${escapeHtml(String(row.vat_rate))}%</td><td class="right">${escapeHtml(money(row.base_cents))}</td><td class="right">${escapeHtml(money(row.vat_cents))}</td><td class="right">${escapeHtml(money(row.total_cents))}</td></tr>`).join("")}
</tbody></table>
<p class="footer">${escapeHtml(l.printed)} ${escapeHtml(new Date().toLocaleString(language === "fi" ? "fi-FI" : "en-GB", { timeZone: "Europe/Helsinki" }))}</p>
</main></div></body></html>`;
}

function sanitizePdfText(value: string) {
  return value.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u20AC]/g, "");
}

function wrapText(value: string, max = 54) {
  const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (`${line} ${word}`.trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function renderInvoicePdf(invoice: LoadedInvoice) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await mitraLogoBytes();
  const logoImage = logoBytes ? await pdf.embedPng(logoBytes).catch(() => null) : null;
  const { document, lines, vatBreakdowns } = invoice;
  const language = normalizeLanguage(document.language);
  const seller = partyByRole(invoice.parties, "seller");
  const buyer = partyByRole(invoice.parties, "buyer");
  const imported = importedReceipt(document);

  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 45.35;
  const contentWidth = pageSize[0] - margin * 2;
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.38, 0.45, 0.55);
  const border = rgb(0.84, 0.86, 0.89);
  const softBorder = rgb(0.9, 0.91, 0.92);
  const warm = rgb(0.97, 0.95, 0.92);
  const orange = rgb(0.98, 0.45, 0.05);
  const green = rgb(0.02, 0.47, 0.34);
  let page = pdf.addPage(pageSize);
  let pageNumber = 1;
  let y = 768;

  const drawText = (text: string, x: number, atY: number, size = 10, fontRef = font, color = ink) => {
    page.drawText(sanitizePdfText(text), { x, y: atY, size, font: fontRef, color });
  };
  const textWidth = (text: string, size = 10, fontRef = font) => fontRef.widthOfTextAtSize(sanitizePdfText(text), size);
  const drawRight = (text: string, rightX: number, atY: number, size = 10, fontRef = font, color = ink) => {
    drawText(text, rightX - textWidth(text, size, fontRef), atY, size, fontRef, color);
  };
  const drawWrapped = (text: string, x: number, atY: number, maxWidth: number, size = 10, fontRef = font, color = ink, lineGap = 12) => {
    const words = sanitizePdfText(text).split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = `${line} ${word}`.trim();
      if (line && textWidth(candidate, size, fontRef) > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
    const rows = out.length ? out : [""];
    rows.forEach((row, index) => drawText(row, x, atY - index * lineGap, size, fontRef, color));
    return atY - rows.length * lineGap;
  };
  const drawFitText = (text: string, x: number, atY: number, maxWidth: number, size = 10, fontRef = font, color = ink, minSize = 7.5) => {
    let nextSize = size;
    while (nextSize > minSize && textWidth(text, nextSize, fontRef) > maxWidth) nextSize -= 0.4;
    if (textWidth(text, nextSize, fontRef) <= maxWidth) {
      drawText(text, x, atY, nextSize, fontRef, color);
      return atY - nextSize - 2;
    }
    const chunks = text.includes("-")
      ? text.split("-").reduce<string[]>((parts, part, index) => {
          const value = index === 0 ? part : `-${part}`;
          const current = parts[parts.length - 1] ?? "";
          if (current && textWidth(`${current}${value}`, nextSize, fontRef) <= maxWidth) {
            parts[parts.length - 1] = `${current}${value}`;
          } else {
            parts.push(value.replace(/^-/, ""));
          }
          return parts;
        }, [])
      : Array.from(text).reduce<string[]>((parts, char) => {
          const current = parts[parts.length - 1] ?? "";
          if (current && textWidth(`${current}${char}`, nextSize, fontRef) <= maxWidth) {
            parts[parts.length - 1] = `${current}${char}`;
          } else {
            parts.push(char);
          }
          return parts;
        }, []);
    chunks.slice(0, 2).forEach((row, index) => drawText(row, x, atY - index * (nextSize + 2), nextSize, fontRef, color));
    return atY - Math.min(chunks.length, 2) * (nextSize + 2);
  };
  const moneyText = (cents: unknown) => {
    const value = Number(cents ?? 0);
    const amount = ((Number.isFinite(value) ? value : 0) / 100).toLocaleString(language === "fi" ? "fi-FI" : "en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return language === "fi" ? `${amount} €` : `€${amount}`;
  };
  const formatQuantity = (value: number) => Number.isInteger(value)
    ? String(value)
    : value.toLocaleString(language === "fi" ? "fi-FI" : "en-GB", { maximumFractionDigits: 2 });
  const bilingual = (fi: string, en: string) => language === "fi" ? { primary: fi, secondary: en } : { primary: en, secondary: fi };
  const drawBilingual = (fi: string, en: string, x: number, atY: number, primarySize = 8, secondarySize = 6.8, primaryFont = bold, primaryColor = ink) => {
    const label = bilingual(fi, en);
    drawText(label.primary, x, atY, primarySize, primaryFont, primaryColor);
    if (secondarySize > 0) drawText(label.secondary, x, atY - primarySize - 2, secondarySize, bold, muted);
  };
  const businessName = (party: InvoiceParty | null) => {
    const name = String(party?.name ?? "Mitra Auto Oy").trim();
    const businessId = String(party?.business_id ?? "").trim();
    return businessId && !name.includes(businessId) ? `${name} (${businessId})` : name;
  };
  const unitLabels = (line: InvoiceLine) => ({
    fi: String(line.source_payload?.unit_label_fi ?? line.unit_label ?? "kpl").trim() || "kpl",
    en: String(line.source_payload?.unit_label_en ?? translateUnitLabel(line.unit_label)).trim() || "pcs",
  });
  const titleLabels = (line: InvoiceLine) => {
    const fi = String(line.source_payload?.description_fi ?? line.title ?? "").trim() || line.title;
    const en = String(line.source_payload?.description_en ?? "").trim();
    return {
      fi,
      en: en || (language === "en" ? line.title : ""),
    };
  };
  const drawInfoRows = (rows: Array<{ fi: string; en: string; value: string }>, x: number, startY: number, maxWidth: number) => {
    let rowY = startY;
    for (const row of rows) {
      if (!String(row.value ?? "").trim()) continue;
      const label = bilingual(row.fi, row.en);
      const labelText = `${label.primary} / ${label.secondary}: `;
      const labelSize = 8.1;
      const labelWidth = Math.min(textWidth(labelText, labelSize, font), maxWidth * 0.56);
      drawText(labelText, x, rowY, labelSize, font, muted);
      const nextY = drawWrapped(row.value, x + labelWidth, rowY, maxWidth - labelWidth, labelSize, bold, ink, 9.6);
      rowY = nextY - 5;
    }
    return rowY;
  };
  const drawHorizontalRule = (atY: number, color = border, thickness = 0.8) => {
    page.drawLine({ start: { x: margin, y: atY }, end: { x: pageSize[0] - margin, y: atY }, thickness, color });
  };
  const printed = new Date().toLocaleString(language === "fi" ? "fi-FI" : "en-GB", { timeZone: "Europe/Helsinki" });
  const drawFooter = () => {
    drawHorizontalRule(52, border, 0.5);
    drawText(`Mitra Auto Oy · ${seller?.address_line1 ?? "Hankasuontie 5, 00390 Helsinki"}`, margin, 35, 7.5, font, muted);
    drawText(`Y-tunnus ${seller?.business_id ?? "3408833-8"} · ALV ${seller?.vat_id ?? "FI34088338"}`, margin + 196, 35, 7.5, font, muted);
    drawRight(`${language === "fi" ? "Sivu" : "Page"} ${pageNumber} · ${language === "fi" ? "Lähetetty / tulostettu" : "Sent / printed"} ${printed}`, pageSize[0] - margin, 35, 7.5, font, muted);
  };
  const newPage = () => {
    drawFooter();
    page = pdf.addPage(pageSize);
    pageNumber += 1;
    y = 768;
  };
  const ensureSpace = (height: number) => {
    if (y - height > 64) return false;
    newPage();
    return true;
  };

  const isInvoice = document.document_type === "invoice";
  const documentTitle = isInvoice ? bilingual("Lasku", "Invoice") : bilingual("Kuitti", "Receipt");
  const buyerName = String(buyer?.name ?? "").trim();
  const hasRealBuyerName = Boolean(buyerName && !["customer", "-"].includes(buyerName.toLowerCase()));
  const vehicleRows = imported ? [
    { fi: "Rekisterinumero", en: "License plate", value: String(imported.vehicle?.license_plate ?? "") },
    { fi: "Ajoneuvo", en: "Vehicle", value: String(imported.vehicle?.vehicle ?? "") },
    { fi: "Ajettu", en: "Mileage", value: imported.vehicle?.mileage_km ? `${imported.vehicle.mileage_km} km` : "" },
    { fi: "Valmistenumero", en: "VIN", value: String(imported.vehicle?.vin ?? "") },
  ] : document.payload?.license_plate ? [
    { fi: "Rekisterinumero", en: "License plate", value: String(document.payload.license_plate) },
  ] : [];

  // Header
  if (logoImage) {
    page.drawImage(logoImage, { x: margin, y: y - 30, width: 50, height: 50 });
  } else {
    page.drawRectangle({ x: margin, y: y - 18, width: 34, height: 34, borderColor: border, borderWidth: 0.8 });
    drawText("MA", margin + 8, y - 6, 11, bold, orange);
  }
  const brandTextX = logoImage ? margin + 58 : margin + 48;
  drawText("Mitra Auto Oy", brandTextX, y + 2, 15.2, bold, ink);
  drawText(seller?.address_line1 ?? "Hankasuontie 5, 00390 Helsinki", brandTextX, y - 14, 7.8, font, muted);
  drawText(seller?.phone ?? "040 777 7163", brandTextX, y - 27, 7.8, font, muted);
  drawText(seller?.email ?? "contact@mitra-auto.fi", brandTextX, y - 40, 7.8, font, muted);
  drawRight(`${documentTitle.primary} / ${documentTitle.secondary}`, pageSize[0] - margin, y - 8, 24, bold, orange);
  drawRight(isInvoice
    ? `${bilingual("Erääntyy", "Due").primary} / ${bilingual("Erääntyy", "Due").secondary} ${dateText(document.due_date ?? document.issue_date, language)}`
    : `${bilingual("Maksettu", "Paid").primary} / ${bilingual("Maksettu", "Paid").secondary}`,
    pageSize[0] - margin,
    y - 28,
    9,
    font,
    muted,
  );
  y -= 74;
  page.drawRectangle({ x: margin, y, width: contentWidth, height: 4, color: orange });
  y -= 28;

  // Metadata strip.
  const metaH = 74;
  const metaW = contentWidth / 4;
  const meta = [
    { fi: isInvoice ? "Laskunumero" : "Kuittinumero", en: isInvoice ? "Invoice number" : "Receipt number", value: document.document_number },
    { fi: "Päiväys", en: "Issue date", value: dateText(document.issue_date ?? document.issued_at, language) },
    { fi: isInvoice ? "Eräpäivä" : "Suorituspäivä", en: isInvoice ? "Due date" : "Service date", value: dateText(isInvoice ? (document.due_date ?? document.issue_date) : (document.supply_date ?? document.issue_date), language) },
    { fi: isInvoice ? "Viite" : "Tila", en: isInvoice ? "Reference" : "Status", value: isInvoice ? String(invoice.payment?.payment_reference ?? document.payload?.reference ?? document.payload?.paytrail_reference ?? "-") : bilingual("Maksettu", "Paid").primary },
  ];
  page.drawRectangle({ x: margin, y: y - metaH, width: contentWidth, height: metaH, borderColor: border, borderWidth: 0.8 });
  meta.forEach((item, index) => {
    const x = margin + index * metaW;
    if (index > 0) page.drawLine({ start: { x, y }, end: { x, y: y - metaH }, thickness: 0.8, color: border });
    drawBilingual(item.fi, item.en, x + 13, y - 18, 7.4, 6.9);
    drawFitText(item.value, x + 13, y - 45, metaW - 26, 11, bold, item.fi === "Tila" ? green : ink, 7.4);
  });
  y -= metaH + 26;

  // Parties.
  const colGap = 26;
  const colW = (contentWidth - colGap) / 2;
  drawHorizontalRule(y, border, 0.7);
  drawBilingual("Myyjä", "Seller", margin, y - 18, 9, 7.2);
  drawText(businessName(seller), margin, y - 49, 9, bold);
  let sellerY = y - 68;
  sellerY = drawInfoRows([
    { fi: "Osoite", en: "Address", value: [seller?.address_line1, seller?.address_line2].filter(Boolean).join(", ") || "Hankasuontie 5, 00390 Helsinki" },
    { fi: "ALV", en: "VAT ID", value: seller?.vat_id ?? "FI34088338" },
    { fi: "Puhelin", en: "Phone", value: seller?.phone ?? "040 777 7163" },
    { fi: "Sähköposti", en: "Email", value: seller?.email ?? "contact@mitra-auto.fi" },
  ], margin, sellerY, colW);
  if (isInvoice) {
    sellerY -= 1;
    sellerY = drawInfoRows([
      { fi: "IBAN", en: "IBAN", value: String(invoice.payment?.iban ?? document.payload?.iban ?? "") },
      { fi: "BIC", en: "BIC", value: String(invoice.payment?.bic ?? document.payload?.bic ?? "") },
      { fi: "Maksuehto", en: "Terms", value: String(document.payload?.payment_terms ?? "14 pv netto / 14 days net") },
    ], margin, sellerY, colW);
  }

  const rightX = margin + colW + colGap;
  drawHorizontalRule(y, border, 0.7);
  drawBilingual(isInvoice ? "Laskutetaan" : "Asiakas ja ajoneuvo", isInvoice ? "Bill to" : "Customer and vehicle", rightX, y - 18, 9, 7.2);
  drawText(hasRealBuyerName ? businessName(buyer) : (buyer?.phone ?? "-"), rightX, y - 49, 9, bold);
  let buyerY = y - 68;
  buyerY = drawInfoRows([
    { fi: "Osoite", en: "Address", value: [buyer?.address_line1, buyer?.address_line2, [buyer?.postal_code, buyer?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") },
    { fi: "ALV", en: "VAT ID", value: buyer?.vat_id ?? "" },
    { fi: "Sähköposti", en: "Email", value: buyer?.email ?? "" },
    { fi: "Puhelin", en: "Phone", value: buyer?.phone ?? "" },
    { fi: "Toimituspäivä", en: "Supply date", value: isInvoice ? dateText(document.supply_date ?? document.issue_date, language) : "" },
    ...vehicleRows,
  ], rightX, buyerY, colW);
  y = Math.min(sellerY, buyerY) - 24;

  // Items table.
  ensureSpace(160);
  const itemHeading = bilingual("Rivit", "Items");
  drawText(`${itemHeading.primary} / ${itemHeading.secondary}`, margin, y, 14, bold);
  drawRight(isInvoice
    ? "Veroton yksikköhinta ja ALV eritelty / Net unit price and VAT itemised"
    : "Kaikki hinnat sisältävät ALV:n / All prices include VAT",
    pageSize[0] - margin,
    y,
    8.4,
    font,
    muted,
  );
  y -= 14;
  const headerH = 36;
  page.drawRectangle({ x: margin, y: y - headerH, width: contentWidth, height: headerH, color: warm, borderColor: border, borderWidth: 0.7 });
  const descX = margin + 7;
  const qtyRight = margin + 255;
  const unitX = margin + 268;
  const unitNetRight = margin + 350;
  const vatRight = margin + 402;
  const vatAmountRight = margin + 442;
  const totalRight = pageSize[0] - margin - 7;
  let itemsTableTop = y;
  const closeItemsTableBorder = () => {
    page.drawLine({ start: { x: margin, y: itemsTableTop }, end: { x: margin, y }, thickness: 0.6, color: border });
    page.drawLine({ start: { x: pageSize[0] - margin, y: itemsTableTop }, end: { x: pageSize[0] - margin, y }, thickness: 0.6, color: border });
    page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: 0.6, color: border });
  };
  const drawItemsHeader = () => {
    page.drawRectangle({ x: margin, y: y - headerH, width: contentWidth, height: headerH, color: warm, borderColor: border, borderWidth: 0.7 });
    drawBilingual("Kuvaus", "Description", descX, y - 15, 7.8, 6.8);
    drawRight("Määrä", qtyRight, y - 15, 7.8, bold);
    drawRight("Qty", qtyRight, y - 26, 6.8, bold, muted);
    drawBilingual("Yks.", "Unit", unitX, y - 15, 7.8, 6.8);
    drawRight("Veroton yks.", unitNetRight, y - 15, 7.4, bold);
    drawRight("Unit excl. VAT", unitNetRight, y - 26, 6.5, bold, muted);
    drawRight("ALV", vatRight, y - 15, 7.8, bold);
    drawRight("VAT", vatRight, y - 26, 6.8, bold, muted);
    drawRight("ALV €", vatAmountRight, y - 21, 7.3, bold);
    drawRight("Yhteensä", totalRight, y - 15, 7.8, bold);
    drawRight("Total", totalRight, y - 26, 6.8, bold, muted);
    y -= headerH;
  };
  drawItemsHeader();

  for (const line of lines) {
    const titles = titleLabels(line);
    const primaryTitle = language === "fi" ? titles.fi : (titles.en || titles.fi);
    const secondaryTitle = language === "fi" ? titles.en : titles.fi;
    const titleRows = wrapText(primaryTitle, 48).slice(0, 3);
    const secondaryRows = secondaryTitle ? wrapText(secondaryTitle, 48).slice(0, 2) : [];
    const metaRows = line.description ? wrapText(line.description, 56).slice(0, 2) : [];
    const rowHeight = Math.max(46, 16 + titleRows.length * 11 + secondaryRows.length * 10 + metaRows.length * 9);
    if (y - rowHeight < 76) {
      closeItemsTableBorder();
      newPage();
      const continued = bilingual("Rivit jatkuu", "Items continued");
      drawText(`${continued.primary} / ${continued.secondary}`, margin, y, 12, bold);
      y -= 16;
      itemsTableTop = y;
      drawItemsHeader();
    }
    page.drawLine({ start: { x: margin, y }, end: { x: pageSize[0] - margin, y }, thickness: 0.6, color: softBorder });
    let textY = y - 17;
    titleRows.forEach((row, index) => drawText(row, descX, textY - index * 11, 8.8, index === 0 ? bold : font));
    textY -= titleRows.length * 11;
    secondaryRows.forEach((row, index) => drawText(row, descX, textY - index * 10, 7.8, bold, muted));
    textY -= secondaryRows.length * 10;
    metaRows.forEach((row, index) => drawText(row, descX, textY - index * 9, 7.2, font, muted));
    const unit = unitLabels(line);
    drawRight(formatQuantity(line.quantity), qtyRight, y - 17, 8.6, font);
    drawText(language === "fi" ? unit.fi : unit.en, unitX, y - 17, 8.2, bold);
    drawText(language === "fi" ? unit.en : unit.fi, unitX, y - 28, 7.1, bold, muted);
    drawRight(moneyText(line.unit_price_excl_vat_cents), unitNetRight, y - 17, 8.4, font);
    drawRight(`${line.vat_rate.toLocaleString(language === "fi" ? "fi-FI" : "en-GB")} %`, vatRight, y - 17, 8.4, font);
    drawRight(moneyText(line.line_vat_cents), vatAmountRight, y - 17, 8.4, font);
    drawRight(moneyText(line.line_total_cents), totalRight, y - 17, 8.8, bold);
    y -= rowHeight;
  }
  closeItemsTableBorder();
  y -= 26;

  // Totals and VAT breakdown.
  ensureSpace(120);
  const summaryHeading = bilingual("Yhteenveto", "Summary");
  drawText(`${summaryHeading.primary} / ${summaryHeading.secondary}`, margin, y, 12, bold);
  y -= 20;
  const vatTableW = 242;
  const vatHeaderH = 34;
  page.drawRectangle({ x: margin, y: y - vatHeaderH, width: vatTableW, height: vatHeaderH, color: warm, borderColor: border, borderWidth: 0.7 });
  drawBilingual("Verokanta", "VAT rate", margin + 7, y - 15, 7.5, 6.5);
  drawRight("Veroton", margin + 116, y - 15, 7.5, bold);
  drawRight("Net", margin + 116, y - 26, 6.5, bold, muted);
  drawRight("ALV / VAT", margin + 180, y - 21, 7.5, bold);
  drawRight("Verollinen", margin + vatTableW - 7, y - 15, 7.5, bold);
  drawRight("Gross", margin + vatTableW - 7, y - 26, 6.5, bold, muted);
  let vatY = y - vatHeaderH - 18;
  const rows = vatBreakdowns.length ? vatBreakdowns : [{
    vat_rate: 25.5,
    base_cents: document.subtotal_cents,
    vat_cents: document.vat_cents,
    total_cents: document.total_cents,
  } as InvoiceVat];
  for (const row of rows) {
    drawText(`${row.vat_rate.toLocaleString(language === "fi" ? "fi-FI" : "en-GB")} %`, margin + 7, vatY, 8, font);
    drawRight(moneyText(row.base_cents), margin + 116, vatY, 8, font);
    drawRight(moneyText(row.vat_cents), margin + 180, vatY, 8, font);
    drawRight(moneyText(row.total_cents), margin + vatTableW - 7, vatY, 8, font);
    vatY -= 18;
  }
  const vatBottomY = vatY + 8;
  page.drawLine({ start: { x: margin, y: vatBottomY }, end: { x: margin + vatTableW, y: vatBottomY }, thickness: 0.6, color: border });
  page.drawLine({ start: { x: margin, y }, end: { x: margin, y: vatBottomY }, thickness: 0.6, color: border });
  page.drawLine({ start: { x: margin + vatTableW, y }, end: { x: margin + vatTableW, y: vatBottomY }, thickness: 0.6, color: border });
  if (isInvoice) {
    const reference = String(invoice.payment?.payment_reference ?? document.payload?.reference ?? document.payload?.paytrail_reference ?? "");
    if (reference) {
      drawWrapped(`Käytä maksaessa viitenumeroa ${reference}. / Please use reference number ${reference} when paying.`, margin, vatY - 12, vatTableW, 8.2, font, muted, 10);
    }
  }

  const summaryX = margin + 288;
  const summaryW = contentWidth - 288;
  page.drawLine({ start: { x: summaryX, y }, end: { x: summaryX + summaryW, y }, thickness: 1.2, color: ink });
  let summaryY = y - 22;
  const summaryRow = (fi: string, en: string, value: string, final = false) => {
    const label = bilingual(fi, en);
    drawText(label.primary, summaryX, summaryY, final ? 15 : 8.8, final ? bold : font, final ? ink : muted);
    drawText(label.secondary, summaryX, summaryY - (final ? 16 : 10), final ? 10 : 7.6, final ? bold : font, muted);
    drawRight(value, summaryX + summaryW, summaryY, final ? 15 : 8.8, bold, final ? orange : ink);
    summaryY -= final ? 34 : 28;
  };
  summaryRow("Välisumma", "Subtotal", moneyText(document.subtotal_cents));
  summaryRow("ALV 25,5 %", "VAT", moneyText(document.vat_cents));
  if (isInvoice) summaryRow("Maksettu", "Paid", moneyText(document.paid_cents ?? 0));
  page.drawLine({ start: { x: summaryX, y: summaryY + 13 }, end: { x: summaryX + summaryW, y: summaryY + 13 }, thickness: 0.6, color: border });
  summaryRow(isInvoice ? "Maksettava" : "Yhteensä", isInvoice ? "Total due" : "Total", moneyText(Math.max(0, document.total_cents - (isInvoice ? (document.paid_cents ?? 0) : 0))), true);

  drawFooter();

  return await pdf.save();
}

async function uploadExport(document: InvoiceDocument, bytes: Uint8Array, type: "pdf" | "html", contentType: string) {
  const extension = type === "pdf" ? "pdf" : "html";
  const storagePath = `${document.id}/${document.document_number}.${extension}`;
  const upload = await supabaseAdmin.storage
    .from("invoice-documents")
    .upload(storagePath, bytes, { contentType, upsert: true });
  if (upload.error) throw new Error(upload.error.message);

  const checksum = await checksumHex(bytes);
  const { data, error } = await supabaseAdmin
    .from("invoice_exports")
    .insert({
      document_id: document.id,
      export_type: type,
      status: "generated",
      storage_bucket: "invoice-documents",
      storage_path: storagePath,
      checksum_sha256: checksum,
      content_type: contentType,
      file_size_bytes: bytes.byteLength,
      export_version: "2026-04-v1",
    })
    .select("*")
    .single<any>();
  if (error) throw new Error(error.message);
  return data;
}

export async function issueAccessToken(documentId: string, exportId: string | null, purpose = "download") {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const { error } = await supabaseAdmin.from("invoice_document_access_tokens").insert({
    document_id: documentId,
    export_id: exportId,
    token_hash: tokenHash,
    purpose,
  });
  if (error) throw new Error(error.message);
  return token;
}

function downloadUrl(token: string, download = true) {
  return `${FUNCTIONS_URL}/invoice_document_download?token=${encodeURIComponent(token)}${download ? "&download=1" : ""}`;
}

export async function prepareInvoiceDocument(documentId: string, action: "preview" | "issue" | "send") {
  const invoice = await loadInvoiceDocument(documentId);
  const validation = validationFor(invoice);
  await supabaseAdmin
    .from("invoice_documents")
    .update({ validation_tier: validation.tier, validation_errors: validation.errors })
    .eq("id", documentId);

  if (validation.errors.length && action !== "preview") {
    throw new Error(`Document is not ready: ${validation.errors.join(", ")}`);
  }

  let document = invoice.document;
  if (action !== "preview" && document.status === "draft") {
    const prefix = document.document_type === "invoice" ? "MA-L" : "MA-K";
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc("next_invoice_document_number", { prefix });
    if (numberError) throw new Error(numberError.message);
    const issuedAt = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("invoice_documents")
      .update({
        document_number: nextNumber,
        status: document.total_cents > 0 && document.paid_cents >= document.total_cents ? "paid" : "issued",
        issue_date: issuedAt.slice(0, 10),
        issued_at: issuedAt,
        validation_tier: validation.tier,
        validation_errors: validation.errors,
      })
      .eq("id", documentId)
      .select("*")
      .single<InvoiceDocument>();
    if (error || !data) throw new Error(error?.message ?? "Failed to issue document");
    document = data;
    invoice.document = data;
    await supabaseAdmin.from("invoice_events").insert({
      document_id: documentId,
      event_type: "issued",
      actor: "edge_function",
      payload: { document_number: nextNumber },
    });
  }

  const pdfBytes = await renderInvoicePdf(invoice);
  const pdfExport = await uploadExport(document, pdfBytes, "pdf", "application/pdf");
  const html = renderInvoiceHtml(invoice);
  const htmlExport = await uploadExport(document, new TextEncoder().encode(html), "html", "text/html");

  if (action !== "preview") {
    await supabaseAdmin
      .from("invoice_documents")
      .update({ issued_export_id: pdfExport.id })
      .eq("id", documentId);
  }

  const token = await issueAccessToken(documentId, pdfExport.id, action === "preview" ? "preview" : "download");
  return {
    invoice,
    pdfExport,
    htmlExport,
    token,
    url: downloadUrl(token, true),
  };
}

async function findToken(token: string) {
  const tokenHash = await sha256Hex(token);
  const { data, error } = await supabaseAdmin
    .from("invoice_document_access_tokens")
    .select("*, invoice_exports(*)")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .is("revoked_at", null)
    .single<any>();
  if (error || !data) throw new Error("Document link is invalid or expired");
  await supabaseAdmin.from("invoice_document_access_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return data;
}

export async function handleInvoiceDocumentDownload(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token.trim()) return new Response("Missing token", { status: 400, headers: corsHeaders });

  try {
    const row = await findToken(token);
    const exportRow = row.invoice_exports;
    if (!exportRow?.storage_bucket || !exportRow?.storage_path) throw new Error("Document export is missing");
    const { data, error } = await supabaseAdmin.storage.from(exportRow.storage_bucket).download(exportRow.storage_path);
    if (error || !data) throw new Error(error?.message ?? "Failed to download document");
    const bytes = await data.arrayBuffer();
    const filename = exportRow.storage_path.split("/").pop() ?? "document.pdf";
    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": exportRow.content_type ?? "application/pdf",
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

export async function sendInvoiceDocumentEmail(documentId: string) {
  const prepared = await prepareInvoiceDocument(documentId, "issue");
  const invoice = prepared.invoice;
  const document = invoice.document;
  const buyer = partyByRole(invoice.parties, "buyer");
  const language = normalizeLanguage(document.language);
  if (!buyer?.email) throw new Error("Missing buyer email");

  const subject = document.document_type === "invoice"
    ? (language === "fi" ? `Lasku: ${document.document_number}` : `Invoice: ${document.document_number}`)
    : (language === "fi" ? `Kuitti: ${document.document_number}` : `Receipt: ${document.document_number}`);
  const text = [
    language === "fi" ? "Hei," : "Hello,",
    "",
    language === "fi" ? "Liitteenä ja alla olevasta linkistä löydät Mitra Auton kuitin tai laskun." : "Your Mitra Auto receipt or invoice is available from the link below.",
    `${language === "fi" ? "Numero" : "Number"}: ${document.document_number}`,
    `${language === "fi" ? "Yhteensä" : "Total"}: ${money(document.total_cents)}`,
    prepared.url,
    "",
    "Mitra Auto",
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;max-width:640px;margin:0 auto;padding:24px;">
<h1 style="font-size:22px;margin:0 0 12px;">Mitra Auto</h1>
<p>${escapeHtml(language === "fi" ? "Kiitos asioinnista. Dokumentti on valmis." : "Thank you. Your document is ready.")}</p>
<div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;background:#f8fafc;margin:18px 0;">
<p><strong>${escapeHtml(language === "fi" ? "Numero" : "Number")}:</strong> ${escapeHtml(document.document_number)}</p>
<p><strong>${escapeHtml(language === "fi" ? "Yhteensä" : "Total")}:</strong> ${escapeHtml(money(document.total_cents))}</p>
</div>
<a href="${escapeHtml(prepared.url)}" style="background:#111827;color:#ffffff;padding:12px 16px;border-radius:8px;text-decoration:none;display:inline-block;">${escapeHtml(language === "fi" ? "Lataa dokumentti" : "Download document")}</a>
</div>`;

  await sendBasicGmail({
    to: buyer.email,
    subject,
    text,
    html,
  });

  await supabaseAdmin.from("invoice_documents").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", documentId);
  await supabaseAdmin.from("invoice_exports").update({ status: "sent" }).eq("id", prepared.pdfExport.id);
  await supabaseAdmin.from("invoice_events").insert({
    document_id: documentId,
    event_type: "sent",
    actor: "edge_function",
    payload: { recipient_email: buyer.email, export_id: prepared.pdfExport.id },
  });

  return { ok: true, url: prepared.url };
}

function orderCustomer(order: any) {
  const snapshot = order.cart_snapshot ?? {};
  const customer = snapshot.customer ?? {};
  const billing = snapshot.billing ?? {};
  const shipping = snapshot.shipping ?? {};
  const first = customer.firstName ?? customer.first_name ?? billing.firstName ?? billing.first_name ?? shipping.firstName ?? shipping.first_name;
  const last = customer.lastName ?? customer.last_name ?? billing.lastName ?? billing.last_name ?? shipping.lastName ?? shipping.last_name;
  return {
    name: [first, last].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ") || "Customer",
    email: String(order.customer_email ?? order.email ?? customer.email ?? billing.email ?? shipping.email ?? "").trim(),
    phone: String(order.customer_phone ?? order.phone ?? customer.phone ?? billing.phone ?? shipping.phone ?? "").trim(),
    addressLine1: String(billing.address ?? billing.addressLine1 ?? billing.address_line1 ?? shipping.address ?? shipping.addressLine1 ?? shipping.address_line1 ?? "").trim(),
    addressLine2: String(billing.addressLine2 ?? billing.address_line2 ?? shipping.addressLine2 ?? shipping.address_line2 ?? "").trim(),
    postalCode: String(billing.postalCode ?? billing.postal_code ?? shipping.postalCode ?? shipping.postal_code ?? "").trim(),
    city: String(billing.city ?? shipping.city ?? "").trim(),
  };
}

function orderItems(order: any) {
  const snapshot = order.cart_snapshot ?? {};
  const candidates = [snapshot.items, snapshot.cart_items, snapshot.cart?.items, snapshot.order?.items, snapshot.line_items];
  return candidates.find((value) => Array.isArray(value)) ?? [];
}

function orderLanguage(order: any): SupportedLanguage {
  return normalizeLanguage(order.cart_snapshot?.language ?? order.cart_snapshot?.locale ?? order.cart_snapshot?.customer?.language);
}

function orderLineTitle(item: any) {
  const product = item.product ?? item;
  return String(
    product.name ||
    product.title ||
    [product.brand, product.model, product.size_text ?? product.size].map((part) => String(part ?? "").trim()).filter(Boolean).join(" ") ||
    "Product"
  ).trim();
}

function lineFromGross(quantity: number, unitGrossCents: number, vatRate: number) {
  const lineTotalCents = Math.round(quantity * unitGrossCents);
  const lineNetCents = Math.round(lineTotalCents / (1 + vatRate / 100));
  const unitNetCents = Math.round(unitGrossCents / (1 + vatRate / 100));
  return {
    lineTotalCents,
    lineNetCents,
    lineVatCents: lineTotalCents - lineNetCents,
    unitNetCents,
  };
}

export async function ensureOrderInvoiceDocument(order: any) {
  const existing = await supabaseAdmin
    .from("invoice_documents")
    .select("id")
    .eq("source_type", "order")
    .eq("order_id", order.id)
    .not("status", "eq", "void")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<any>();
  if (existing.error) throw new Error(existing.error.message);

  let documentId = existing.data?.id as string | undefined;
  if (!documentId) {
    const customer = orderCustomer(order);
    const language = orderLanguage(order);
    const items = orderItems(order).filter((item: any) => String(item?.sku ?? item?.productCode ?? "").toLowerCase() !== "shipping");
    const normalizedLines = items.length ? items.map((item: any, index: number) => {
      const quantity = Math.max(1, Number(item.quantity ?? item.qty ?? item.units ?? 1) || 1);
      const unitGrossCents = Number(item.client_unit_price_cents ?? item.unit_price_cents ?? item.price_cents ?? item.unitPrice ?? 0) || 0;
      const lineTotalCandidate = Number(item.line_total_cents ?? item.total_cents ?? 0) || 0;
      const finalUnitGross = unitGrossCents || (lineTotalCandidate ? Math.round(lineTotalCandidate / quantity) : 0);
      const vatRate = Number(item.vatPercentage ?? item.vat_rate ?? 25.5) || 25.5;
      const calculated = lineFromGross(quantity, finalUnitGross, vatRate);
      return {
        lineNumber: index + 1,
        title: orderLineTitle(item),
        quantity,
        unitGrossCents: finalUnitGross,
        vatRate,
        ...calculated,
      };
    }) : [];
    const subtotalCents = normalizedLines.reduce((sum: number, line: any) => sum + line.lineNetCents, 0);
    const vatCents = normalizedLines.reduce((sum: number, line: any) => sum + line.lineVatCents, 0);
    const totalCents = Number(order.grand_total_cents ?? order.cart_snapshot?.total_cents ?? normalizedLines.reduce((sum: number, line: any) => sum + line.lineTotalCents, 0)) || 0;

    const templateResult = await supabaseAdmin
      .from("invoice_templates")
      .select("*")
      .eq("is_default", true)
      .maybeSingle<any>();
    if (templateResult.error) throw new Error(templateResult.error.message);

    const draftNumber = `DRAFT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(order.id).slice(0, 8).toUpperCase()}`;
    const insertDocument = await supabaseAdmin
      .from("invoice_documents")
      .insert({
        document_number: draftNumber,
        document_type: "receipt",
        source_type: "order",
        order_id: order.id,
        status: "draft",
        language,
        currency: order.currency ?? "EUR",
        template_id: templateResult.data?.id ?? null,
        supply_date: new Date(order.created_at ?? Date.now()).toISOString().slice(0, 10),
        subtotal_cents: subtotalCents,
        vat_cents: vatCents || Math.round(totalCents - totalCents / 1.255),
        total_cents: totalCents,
        paid_cents: totalCents,
        payload: { source: "order", cart_snapshot: order.cart_snapshot ?? {} },
      })
      .select("id")
      .single<any>();
    if (insertDocument.error || !insertDocument.data) throw new Error(insertDocument.error?.message ?? "Failed to create invoice document");
    documentId = insertDocument.data.id;

    const template = templateResult.data;
    const parties = await supabaseAdmin.from("invoice_parties").insert([
      {
        document_id: documentId,
        role: "seller",
        name: template?.company_name ?? "Mitra Auto Oy",
        business_id: template?.business_id ?? "3408833-8",
        vat_id: template?.vat_id ?? "FI34088338",
        email: template?.email ?? "contact@mitra-auto.fi",
        phone: template?.phone ?? "0407777163",
        address_line1: template?.address_line1 ?? "Hankasuontie 5",
        address_line2: template?.address_line2 ?? "00390 HELSINKI",
        country_code: template?.country_code ?? "FI",
      },
      {
        document_id: documentId,
        role: "buyer",
        name: customer.name,
        email: customer.email || null,
        phone: customer.phone || null,
        address_line1: customer.addressLine1 || null,
        address_line2: customer.addressLine2 || null,
        postal_code: customer.postalCode || null,
        city: customer.city || null,
        country_code: "FI",
      },
    ]);
    if (parties.error) throw new Error(parties.error.message);

    if (normalizedLines.length) {
      const lines = await supabaseAdmin.from("invoice_lines").insert(normalizedLines.map((line: any) => ({
        document_id: documentId,
        line_number: line.lineNumber,
        item_type: "product",
        title: line.title,
        quantity: line.quantity,
        unit_label: "kpl",
        unit_price_excl_vat_cents: line.unitNetCents,
        unit_price_incl_vat_cents: line.unitGrossCents,
        vat_rate: line.vatRate,
        vat_code: "S",
        line_vat_excl_cents: line.lineNetCents,
        line_vat_cents: line.lineVatCents,
        line_total_cents: line.lineTotalCents,
      })));
      if (lines.error) throw new Error(lines.error.message);
    }

    if (!documentId) throw new Error("Failed to create invoice document");
    const finalDocumentId = documentId;
    const created = await loadInvoiceDocument(finalDocumentId);
    const groups = new Map<string, { vatRate: number; baseCents: number; vatCents: number; totalCents: number }>();
    created.lines.forEach((line) => {
      const key = String(line.vat_rate);
      const current = groups.get(key) ?? { vatRate: line.vat_rate, baseCents: 0, vatCents: 0, totalCents: 0 };
      current.baseCents += line.line_vat_excl_cents;
      current.vatCents += line.line_vat_cents;
      current.totalCents += line.line_total_cents;
      groups.set(key, current);
    });
    if (groups.size) {
      const vat = await supabaseAdmin.from("invoice_vat_breakdowns").insert(Array.from(groups.values()).map((row) => ({
        document_id: finalDocumentId,
        vat_rate: row.vatRate,
        vat_code: "S",
        base_cents: row.baseCents,
        vat_cents: row.vatCents,
        total_cents: row.totalCents,
      })));
      if (vat.error) throw new Error(vat.error.message);
    }

    const payment = await supabaseAdmin.from("invoice_payment_details").insert({
      document_id: finalDocumentId,
      payment_status: "paid",
      payment_provider: order.paytrail_provider ?? order.cart_snapshot?.payment_provider ?? null,
      transaction_id: order.paytrail_transaction_id ?? null,
      paid_at: new Date().toISOString(),
    });
    if (payment.error) throw new Error(payment.error.message);
  }

  const prepared = await prepareInvoiceDocument(documentId, "issue");
  return { document: prepared.invoice.document, url: prepared.url };
}

export async function createAndSendBookingInvoiceReceipt(args: {
  bookingId: string;
  lines?: any[];
  notes?: string | null;
  recipientEmail?: string | null;
}) {
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", args.bookingId)
    .single<any>();
  if (bookingError || !booking) throw new Error(bookingError?.message ?? "Booking not found");

  const language = normalizeLanguage(booking.booking_language);
  const templateResult = await supabaseAdmin
    .from("invoice_templates")
    .select("*")
    .eq("is_default", true)
    .maybeSingle<any>();
  if (templateResult.error) throw new Error(templateResult.error.message);

  const normalizedLines = (Array.isArray(args.lines) && args.lines.length ? args.lines : [{
    title: booking.service_name || "Service",
    quantity: 1,
    unit_cents: 0,
    vat_rate: 25.5,
  }]).map((line: any, index: number) => {
    const quantity = Math.max(1, Number(line.quantity ?? 1) || 1);
    const unitGrossCents = Number(line.unit_cents ?? line.unitGrossCents ?? 0) || 0;
    const vatRate = Number(line.vat_rate ?? line.vatRate ?? 25.5) || 25.5;
    return {
      lineNumber: index + 1,
      title: String(line.title ?? line.description ?? "Service").trim() || "Service",
      quantity,
      unitGrossCents,
      vatRate,
      ...lineFromGross(quantity, unitGrossCents, vatRate),
    };
  });
  const subtotalCents = normalizedLines.reduce((sum, line) => sum + line.lineNetCents, 0);
  const vatCents = normalizedLines.reduce((sum, line) => sum + line.lineVatCents, 0);
  const totalCents = normalizedLines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  const { data: doc, error: docError } = await supabaseAdmin
    .from("invoice_documents")
    .insert({
      document_number: `DRAFT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(booking.id).slice(0, 8).toUpperCase()}`,
      document_type: "receipt",
      source_type: "booking",
      booking_id: booking.id,
      status: "draft",
      language,
      currency: "EUR",
      template_id: templateResult.data?.id ?? null,
      supply_date: booking.booking_date ?? new Date().toISOString().slice(0, 10),
      subtotal_cents: subtotalCents,
      vat_cents: vatCents,
      total_cents: totalCents,
      paid_cents: totalCents,
      internal_notes: args.notes ?? null,
      payload: {
        source: "booking",
        booking_id: booking.id,
        license_plate: booking.license_plate ?? null,
        service_name: booking.service_name ?? null,
      },
    })
    .select("id")
    .single<any>();
  if (docError || !doc) throw new Error(docError?.message ?? "Failed to create booking receipt");

  const documentId = doc.id;
  const template = templateResult.data;
  const parties = await supabaseAdmin.from("invoice_parties").insert([
    {
      document_id: documentId,
      role: "seller",
      name: template?.company_name ?? "Mitra Auto Oy",
      business_id: template?.business_id ?? "3408833-8",
      vat_id: template?.vat_id ?? "FI34088338",
      email: template?.email ?? "contact@mitra-auto.fi",
      phone: template?.phone ?? "0407777163",
      address_line1: template?.address_line1 ?? "Hankasuontie 5",
      address_line2: template?.address_line2 ?? "00390 HELSINKI",
      country_code: template?.country_code ?? "FI",
    },
    {
      document_id: documentId,
      role: "buyer",
      name: booking.customer_name || "Customer",
      email: args.recipientEmail || booking.customer_email || null,
      phone: booking.customer_phone || null,
      country_code: "FI",
    },
  ]);
  if (parties.error) throw new Error(parties.error.message);

  const lines = await supabaseAdmin.from("invoice_lines").insert(normalizedLines.map((line) => ({
    document_id: documentId,
    line_number: line.lineNumber,
    item_type: "service",
    title: line.title,
    quantity: line.quantity,
    unit_label: "kpl",
    unit_price_excl_vat_cents: line.unitNetCents,
    unit_price_incl_vat_cents: line.unitGrossCents,
    vat_rate: line.vatRate,
    vat_code: "S",
    line_vat_excl_cents: line.lineNetCents,
    line_vat_cents: line.lineVatCents,
    line_total_cents: line.lineTotalCents,
  })));
  if (lines.error) throw new Error(lines.error.message);

  const groups = new Map<string, { vatRate: number; baseCents: number; vatCents: number; totalCents: number }>();
  normalizedLines.forEach((line) => {
    const key = String(line.vatRate);
    const current = groups.get(key) ?? { vatRate: line.vatRate, baseCents: 0, vatCents: 0, totalCents: 0 };
    current.baseCents += line.lineNetCents;
    current.vatCents += line.lineVatCents;
    current.totalCents += line.lineTotalCents;
    groups.set(key, current);
  });
  const vat = await supabaseAdmin.from("invoice_vat_breakdowns").insert(Array.from(groups.values()).map((row) => ({
    document_id: documentId,
    vat_rate: row.vatRate,
    vat_code: "S",
    base_cents: row.baseCents,
    vat_cents: row.vatCents,
    total_cents: row.totalCents,
  })));
  if (vat.error) throw new Error(vat.error.message);

  const payment = await supabaseAdmin.from("invoice_payment_details").insert({
    document_id: documentId,
    payment_status: "paid",
    paid_at: new Date().toISOString(),
  });
  if (payment.error) throw new Error(payment.error.message);

  return await sendInvoiceDocumentEmail(documentId);
}

function mailboxEmail() {
  return Deno.env.get("GMAIL_MAILBOX_EMAIL")?.trim() || "box.ryanle@gmail.com";
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
  if (error || !data) throw new Error(error?.message ?? `No Gmail connection found for ${mailbox}`);
  if (data.access_token && data.token_expiry && new Date(data.token_expiry).getTime() > Date.now() + 60_000) {
    return data.access_token as string;
  }
  if (!data.refresh_token) throw new Error(`No Gmail refresh token stored for ${mailbox}`);
  const clientId = Deno.env.get("GMAIL_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET") ?? "";
  if (!clientId || !clientSecret) throw new Error("Missing Gmail OAuth credentials");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: data.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error_description ?? json.error ?? "Failed to refresh Gmail token");
  const tokenExpiry = new Date(Date.now() + Math.max(60, Number(json.expires_in ?? 3600) - 60) * 1000).toISOString();
  await supabaseAdmin.from("gmail_sync_state").update({
    access_token: json.access_token,
    token_expiry: tokenExpiry,
    token_type: json.token_type ?? "Bearer",
  }).eq("mailbox_email", mailbox);
  return json.access_token as string;
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(/=+$/g, "");
}

function encodeMimeHeader(value: string) {
  if (!/[^\u0000-\u007f]/.test(value)) return value;
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

async function sendBasicGmail(args: { to: string; subject: string; text: string; html: string }) {
  const boundary = `invoice_${crypto.randomUUID().replaceAll("-", "")}`;
  const messageId = `<invoice-${crypto.randomUUID()}@mitra-auto.fi>`;
  const raw = [
    `From: ${senderAddress()}`,
    `To: ${args.to}`,
    `Subject: ${encodeMimeHeader(args.subject)}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    args.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    args.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");
  const accessToken = await getValidGmailAccessToken();
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toBase64Url(raw) }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error?.message ?? "Failed to send Gmail message");
  return json;
}

export async function handleInvoiceDocumentIssue(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await request.json();
    const documentId = String(body?.documentId ?? body?.document_id ?? "").trim();
    const action = String(body?.action ?? "preview").trim() as "preview" | "issue" | "send";
    if (!documentId) throw new Error("Missing documentId");
    if (!["preview", "issue", "send"].includes(action)) throw new Error("Invalid action");
    if (action === "send") return jsonResponse(await sendInvoiceDocumentEmail(documentId));
    const prepared = await prepareInvoiceDocument(documentId, action);
    return jsonResponse({ ok: true, url: prepared.url, exportId: prepared.pdfExport.id });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
