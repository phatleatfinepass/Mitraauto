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

function documentLabel(document: InvoiceDocument, language: SupportedLanguage) {
  if (document.document_type === "invoice") return language === "fi" ? "LASKU / INVOICE" : "INVOICE / LASKU";
  return language === "fi" ? "KUITTI / RECEIPT" : "RECEIPT / KUITTI";
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
  const title = documentLabel(document, language);
  const issued = document.issued_at ?? new Date().toISOString();
  const l = {
    seller: language === "fi" ? "Myyja / Seller" : "Seller / Myyja",
    buyer: language === "fi" ? "Asiakas / Customer" : "Customer / Asiakas",
    number: language === "fi" ? "Numero / Number" : "Number / Numero",
    issueDate: language === "fi" ? "Paivays / Issue date" : "Issue date / Paivays",
    supplyDate: language === "fi" ? "Toimitus- tai suorituspaiva / Supply date" : "Supply date / Toimitus- tai suorituspaiva",
    y: "Y-tunnus / Business ID",
    vatId: "ALV-tunnus / VAT ID",
    item: language === "fi" ? "Tuote tai palvelu" : "Goods or services",
    qty: language === "fi" ? "Maara" : "Qty",
    unitNet: language === "fi" ? "Yksikko veroton" : "Unit excl. VAT",
    vat: "ALV / VAT",
    total: language === "fi" ? "Yhteensa" : "Total",
    net: language === "fi" ? "Veroton" : "Net",
    gross: language === "fi" ? "Verollinen" : "Gross",
    paid: language === "fi" ? "Maksettu" : "Paid",
    printed: language === "fi" ? "Lahetetty / tulostettu" : "Sent / printed",
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
<table class="lines"><thead><tr><th>${escapeHtml(l.item)}</th><th class="right">${escapeHtml(l.qty)}</th><th class="right">${escapeHtml(l.unitNet)}</th><th class="right">${escapeHtml(l.vat)}</th><th class="right">${escapeHtml(l.total)}</th></tr></thead><tbody>
${lines.map((line) => `<tr><td><strong>${escapeHtml(line.title)}</strong>${line.description ? `<br><span class="muted">${escapeHtml(line.description)}</span>` : ""}</td><td class="right">${escapeHtml(String(line.quantity))} ${escapeHtml(line.unit_label ?? "kpl")}</td><td class="right">${escapeHtml(money(line.unit_price_excl_vat_cents))}</td><td class="right">${escapeHtml(String(line.vat_rate))}%</td><td class="right"><strong>${escapeHtml(money(line.line_total_cents))}</strong></td></tr>`).join("")}
</tbody></table>
<table class="summary"><tr><td>${escapeHtml(l.net)}</td><td class="right">${escapeHtml(money(document.subtotal_cents))}</td></tr><tr><td>${escapeHtml(l.vat)}</td><td class="right">${escapeHtml(money(document.vat_cents))}</td></tr><tr><td class="total">${escapeHtml(l.total)}</td><td class="right total">${escapeHtml(money(document.total_cents))}</td></tr></table>
<table class="vat"><thead><tr><th>${escapeHtml(l.vat)}</th><th class="right">${escapeHtml(l.net)}</th><th class="right">${escapeHtml(l.vat)}</th><th class="right">${escapeHtml(l.gross)}</th></tr></thead><tbody>
${vatBreakdowns.map((row) => `<tr><td>${escapeHtml(String(row.vat_rate))}%</td><td class="right">${escapeHtml(money(row.base_cents))}</td><td class="right">${escapeHtml(money(row.vat_cents))}</td><td class="right">${escapeHtml(money(row.total_cents))}</td></tr>`).join("")}
</tbody></table>
<p class="footer">${escapeHtml(l.printed)} ${escapeHtml(new Date().toLocaleString(language === "fi" ? "fi-FI" : "en-GB", { timeZone: "Europe/Helsinki" }))}</p>
</main></div></body></html>`;
}

function sanitizePdfText(value: string) {
  return value.replaceAll("€", "EUR").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF]/g, "");
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
  const { document, lines, vatBreakdowns } = invoice;
  const language = normalizeLanguage(document.language);
  const seller = partyByRole(invoice.parties, "seller");
  const buyer = partyByRole(invoice.parties, "buyer");

  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 42;
  const contentWidth = pageSize[0] - margin * 2;
  const ink = rgb(0.07, 0.09, 0.14);
  const muted = rgb(0.38, 0.45, 0.55);
  const border = rgb(0.87, 0.89, 0.92);
  const soft = rgb(0.97, 0.98, 0.99);
  const orange = rgb(0.98, 0.45, 0.05);
  let page = pdf.addPage(pageSize);
  let y = 790;

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
  const newPage = () => {
    page = pdf.addPage(pageSize);
    y = 790;
  };
  const ensureSpace = (height: number) => {
    if (y - height > 54) return;
    newPage();
  };
  const drawCard = (x: number, top: number, w: number, h: number, fill = rgb(1, 1, 1)) => {
    page.drawRectangle({ x, y: top - h, width: w, height: h, color: fill, borderColor: border, borderWidth: 1 });
  };
  const drawLabel = (label: string, x: number, atY: number) => drawText(label.toUpperCase(), x, atY, 7.5, bold, muted);

  const isInvoice = document.document_type === "invoice";
  const title = isInvoice
    ? (language === "fi" ? "LASKU" : "INVOICE")
    : (language === "fi" ? "KUITTI" : "RECEIPT");
  const titleSub = isInvoice
    ? (language === "fi" ? "Invoice" : "Lasku")
    : (language === "fi" ? "Receipt" : "Kuitti");
  const buyerName = String(buyer?.name ?? "").trim();
  const hasRealBuyerName = Boolean(buyerName && !["customer", "-"].includes(buyerName.toLowerCase()));
  const hasBuyerDetails = hasRealBuyerName || Boolean(
    buyer?.address_line1 || buyer?.address_line2 || buyer?.postal_code || buyer?.city || buyer?.business_id || buyer?.vat_id || buyer?.email || buyer?.phone
  );
  const buyerLines = [
    hasRealBuyerName ? buyerName : "",
    buyer?.address_line1 ?? "",
    buyer?.address_line2 ?? "",
    [buyer?.postal_code, buyer?.city].filter(Boolean).join(" "),
    buyer?.business_id ? `Y-tunnus: ${buyer.business_id}` : "",
    buyer?.vat_id ? `ALV: ${buyer.vat_id}` : "",
    buyer?.email ?? "",
    buyer?.phone ?? "",
  ].filter(Boolean);
  const sellerLines = [
    seller?.name ?? "Mitra Auto Oy",
    seller?.address_line1 ?? "",
    seller?.address_line2 ?? "",
    `Y-tunnus: ${seller?.business_id ?? "3408833-8"}`,
    `ALV: ${seller?.vat_id ?? "FI34088338"}`,
    seller?.email ?? "",
    seller?.phone ?? "",
  ].filter(Boolean);

  drawText("Mitra Auto", margin, y, 22, bold, ink);
  drawRight(title, pageSize[0] - margin, y + 1, 24, bold, orange);
  y -= 20;
  drawText(titleSub, margin, y, 9, font, muted);
  y -= 26;

  drawCard(margin, y, contentWidth, 82, soft);
  const metaTop = y - 20;
  drawLabel(isInvoice ? (language === "fi" ? "Laskunumero" : "Invoice number") : (language === "fi" ? "Kuittinumero" : "Receipt number"), margin + 18, metaTop);
  drawText(document.document_number, margin + 18, metaTop - 16, 11, bold);
  drawLabel(language === "fi" ? "Paivays" : "Issue date", margin + 210, metaTop);
  drawText(dateText(document.issue_date ?? document.issued_at, language), margin + 210, metaTop - 16, 11, bold);
  drawLabel(isInvoice ? (language === "fi" ? "Erapaiva" : "Due date") : (language === "fi" ? "Suorituspaiva" : "Supply date"), margin + 350, metaTop);
  drawText(dateText(isInvoice ? (document.due_date ?? document.issue_date) : (document.supply_date ?? document.issue_date), language), margin + 350, metaTop - 16, 11, bold);
  y -= 104;

  const cardW = (contentWidth - 14) / 2;
  if (isInvoice || hasBuyerDetails) {
    drawCard(margin, y, cardW, 118);
    drawCard(margin + cardW + 14, y, cardW, 118);
    drawLabel(language === "fi" ? "Myyja" : "Seller", margin + 16, y - 18);
    drawLabel(language === "fi" ? "Asiakas" : "Customer", margin + cardW + 30, y - 18);
    sellerLines.slice(0, 7).forEach((line, index) => {
      drawWrapped(line, margin + 16, y - 38 - index * 13, cardW - 32, index === 0 ? 10 : 9, index === 0 ? bold : font, index === 0 ? ink : muted, 11);
    });
    const visibleBuyerLines = buyerLines.length ? buyerLines : [language === "fi" ? "Ei asiakastietoja" : "No customer details"];
    visibleBuyerLines.slice(0, 7).forEach((line, index) => {
      drawWrapped(line, margin + cardW + 30, y - 38 - index * 13, cardW - 32, index === 0 ? 10 : 9, index === 0 && buyerLines.length ? bold : font, index === 0 && buyerLines.length ? ink : muted, 11);
    });
    y -= 144;
  } else {
    drawCard(margin, y, contentWidth, 98);
    drawLabel(language === "fi" ? "Myyja" : "Seller", margin + 16, y - 18);
    sellerLines.slice(0, 5).forEach((line, index) => {
      drawWrapped(line, margin + 16, y - 38 - index * 13, 260, index === 0 ? 10 : 9, index === 0 ? bold : font, index === 0 ? ink : muted, 11);
    });
    drawLabel(language === "fi" ? "Maksu" : "Payment", margin + 340, y - 18);
    drawText(invoice.payment?.payment_provider ?? (language === "fi" ? "Maksettu" : "Paid"), margin + 340, y - 38, 10, bold);
    if (invoice.payment?.transaction_id) drawWrapped(`Transaction: ${invoice.payment.transaction_id}`, margin + 340, y - 53, 155, 8, font, muted, 10);
    y -= 124;
  }

  drawText(language === "fi" ? "Rivit" : "Items", margin, y, 14, bold);
  y -= 20;
  page.drawRectangle({ x: margin, y: y - 24, width: contentWidth, height: 24, color: rgb(0.09, 0.11, 0.16) });
  drawText(language === "fi" ? "Tuote tai palvelu" : "Goods or services", margin + 12, y - 15, 8, bold, rgb(1, 1, 1));
  drawRight(language === "fi" ? "Maara" : "Qty", margin + 308, y - 15, 8, bold, rgb(1, 1, 1));
  drawRight(language === "fi" ? "Yks." : "Unit", margin + 386, y - 15, 8, bold, rgb(1, 1, 1));
  drawRight("ALV", margin + 444, y - 15, 8, bold, rgb(1, 1, 1));
  drawRight(language === "fi" ? "Summa" : "Total", margin + contentWidth - 12, y - 15, 8, bold, rgb(1, 1, 1));
  y -= 30;

  for (const line of lines) {
    const titleRows = wrapText(line.title, 54).slice(0, 3);
    const rowHeight = Math.max(42, 18 + titleRows.length * 12 + (line.description ? 12 : 0));
    ensureSpace(rowHeight + 8);
    page.drawRectangle({ x: margin, y: y - rowHeight, width: contentWidth, height: rowHeight, color: rgb(1, 1, 1), borderColor: border, borderWidth: 0.6 });
    let rowTextY = y - 16;
    titleRows.forEach((row, index) => {
      drawText(row, margin + 12, rowTextY - index * 12, 9.5, index === 0 ? bold : font);
    });
    if (line.description) drawWrapped(line.description, margin + 12, rowTextY - titleRows.length * 12, 260, 8, font, muted, 10);
    drawRight(`${line.quantity} ${line.unit_label}`, margin + 308, rowTextY, 9);
    drawRight(money(line.unit_price_excl_vat_cents), margin + 386, rowTextY, 9);
    drawRight(`${line.vat_rate}%`, margin + 444, rowTextY, 9);
    drawRight(money(line.line_total_cents), margin + contentWidth - 12, rowTextY, 9.5, bold);
    y -= rowHeight;
  }
  y -= 22;

  ensureSpace(160);
  const summaryX = margin + 300;
  const summaryW = contentWidth - 300;
  drawCard(summaryX, y, summaryW, 96, soft);
  drawText(language === "fi" ? "Veroton" : "Net subtotal", summaryX + 14, y - 20, 9, font, muted);
  drawRight(money(document.subtotal_cents), summaryX + summaryW - 14, y - 20, 9, bold);
  drawText("ALV / VAT", summaryX + 14, y - 40, 9, font, muted);
  drawRight(money(document.vat_cents), summaryX + summaryW - 14, y - 40, 9, bold);
  page.drawLine({ start: { x: summaryX + 14, y: y - 56 }, end: { x: summaryX + summaryW - 14, y: y - 56 }, thickness: 0.8, color: border });
  drawText(language === "fi" ? "Yhteensa" : "Total", summaryX + 14, y - 78, 14, bold);
  drawRight(money(document.total_cents), summaryX + summaryW - 14, y - 78, 15, bold, orange);

  drawText("ALV / VAT breakdown", margin, y - 12, 10, bold);
  let vatY = y - 32;
  for (const row of vatBreakdowns) {
    drawText(`${row.vat_rate}%`, margin, vatY, 9, bold);
    drawText(`${money(row.base_cents)} + ${money(row.vat_cents)} = ${money(row.total_cents)}`, margin + 54, vatY, 9, font, muted);
    vatY -= 14;
  }
  y -= 126;

  const printed = new Date().toLocaleString(language === "fi" ? "fi-FI" : "en-GB", { timeZone: "Europe/Helsinki" });
  page.drawLine({ start: { x: margin, y: 48 }, end: { x: pageSize[0] - margin, y: 48 }, thickness: 0.6, color: border });
  drawText(`${language === "fi" ? "Lahetetty / tulostettu" : "Sent / printed"} ${printed}`, margin, 31, 8, font, muted);
  drawRight(`${seller?.name ?? "Mitra Auto Oy"} · ${seller?.business_id ?? "3408833-8"}`, pageSize[0] - margin, 31, 8, font, muted);

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
