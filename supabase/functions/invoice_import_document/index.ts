import { createClient } from "npm:@supabase/supabase-js@2";

const serviceSupabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

async function ensureAuthorized(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) throw new Error("Unauthenticated");

  let isAdmin = user.email === "admin@mitra-auto.fi";
  if (!isAdmin) {
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  if (!isAdmin) throw new Error("Forbidden");
}

function normalizeDataUrl(value: unknown) {
  const dataUrl = String(value ?? "").trim();
  if (!dataUrl.startsWith("data:")) throw new Error("Invalid file data");
  if (dataUrl.length > 18_000_000) {
    throw new Error("File is too large for direct import. Use a smaller PDF or image.");
  }
  return dataUrl;
}

function normalizeMimeType(value: unknown) {
  const mimeType = String(value ?? "").trim().toLowerCase();
  if (mimeType === "application/pdf" || mimeType.startsWith("image/")) return mimeType;
  throw new Error("Only PDF and image files are supported");
}

function base64FromDataUrl(dataUrl: string) {
  const separatorIndex = dataUrl.indexOf(",");
  if (separatorIndex === -1) throw new Error("Invalid file data");
  const base64 = dataUrl.slice(separatorIndex + 1).trim();
  if (!base64) throw new Error("Invalid file data");
  return base64;
}

function bytesFromBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function parseFinnishDate(value: string) {
  const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return "";
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function normalizeReceiptLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function moneyToNumber(value: string) {
  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRegexValue(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim() ?? "";
}

function valueAfterLabel(lines: string[], label: string, stopLabels: Set<string>) {
  const index = lines.findIndex((line) => normalizeReceiptLine(line) === label);
  if (index === -1) return "";
  const values: string[] = [];
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = normalizeReceiptLine(lines[cursor]);
    if (!line) continue;
    if (stopLabels.has(line)) break;
    if (line.startsWith("Puh:")) break;
    if (line.startsWith("Muokattu ")) break;
    values.push(line);
  }
  return values.join(" ").trim();
}

function cleanLicensePlate(value: string) {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  const match = compact.match(/[A-ZÅÄÖ]{2,3}-?\d{2,4}/);
  if (!match) return value.trim();
  const raw = match[0].replace("-", "");
  return raw.length > 3 ? `${raw.slice(0, 3)}-${raw.slice(3)}` : match[0];
}

function isIgnoredReceiptLine(line: string) {
  const normalized = normalizeReceiptLine(line);
  if (!normalized) return true;
  if (normalized.startsWith("-- ")) return true;
  if (normalized === "Toimenpide /") return true;
  if (normalized.includes("Tuotemerkki") && normalized.includes("Hinta")) return true;
  if (normalized === "Mitra Auto Oy") return true;
  if (normalized === "Hankasuontie 5") return true;
  if (normalized === "00390 HELSINKI") return true;
  if (normalized.startsWith("Y-tunnus:")) return true;
  if (normalized.startsWith("info.mitra.auto")) return true;
  if (normalized.startsWith("Kuittinumero")) return true;
  if (normalized.startsWith("Työmääräys")) return true;
  if (normalized.startsWith("Myyntipäivä")) return true;
  if (normalized.startsWith("KUITTI")) return true;
  if (["Ajoneuvo", "Ajettu", "Rekisterinumero", "Moottorikoodi", "Rekisteröity", "Valmistenumero", "Asiakas", "Huollossa huomioitu"].includes(normalized)) return true;
  if (normalized.startsWith("Puh:")) return true;
  if (normalized.startsWith("Muokattu ")) return true;
  if (normalized === "Huoltotyön summa") return true;
  if (normalized === "Varaosien summa") return true;
  if (normalized === "Maksettu" || normalized.startsWith("Maksettu ")) return true;
  if (normalized.startsWith("Korttimaksu") || normalized.startsWith("Käteismaksu") || normalized.startsWith("Tilisiirto")) return true;
  if (normalized.startsWith("Verokanta") || normalized.startsWith("Myynti Alv") || normalized.startsWith("Yhteensä")) return true;
  return false;
}

function receiptWorkLines(lines: string[]) {
  const normalized = lines.map(normalizeReceiptLine);
  const firstSellerIndex = normalized.findIndex((line) => line === "Mitra Auto Oy");
  const summaryIndex = normalized.findIndex((line) => line === "Huoltotyön summa");
  const chunks: string[] = [];

  if (firstSellerIndex > 0) {
    const firstChunkEnd = summaryIndex >= 0 && summaryIndex < firstSellerIndex ? summaryIndex : firstSellerIndex;
    chunks.push(...lines.slice(0, firstChunkEnd));
  }

  const firstPageMarker = normalized.findIndex((line) => /^--\s*1\s+of\s+\d+\s*--$/i.test(line));
  if (firstPageMarker >= 0) {
    const end = summaryIndex > firstPageMarker ? summaryIndex : lines.length;
    chunks.push(...lines.slice(firstPageMarker + 1, end));
  }

  if (firstSellerIndex === -1 && firstPageMarker === -1) {
    const end = summaryIndex >= 0 ? summaryIndex : lines.length;
    chunks.push(...lines.slice(0, end));
  }

  return chunks;
}

function unitLabelEn(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "kpl") return "pcs";
  if (normalized === "l") return "l";
  if (normalized === "pari") return "pair";
  if (normalized === "sarja") return "set";
  return normalized || "pcs";
}

function parseReceiptLines(lines: string[]) {
  const result: Array<{ description: string; description_en?: string; quantity: number; unit_label: string; unit_label_en: string; unit_gross_eur: number; vat_rate: number }> = [];
  const candidateLines = receiptWorkLines(lines)
    .map((line) => line.trim())
    .filter((line) => !isIgnoredReceiptLine(line));

  let pending: string[] = [];
  for (const rawLine of candidateLines) {
    const line = normalizeReceiptLine(rawLine);
    const priceMatches = [...line.matchAll(/(\d+,\d{2})\s*€/g)];
    const hasPrice = priceMatches.length > 0;
    if (!hasPrice) {
      if (rawLine.includes("\t")) {
        pending = [line];
      } else {
        pending.push(line);
      }
      continue;
    }

    const totalGross = moneyToNumber(priceMatches[priceMatches.length - 1][1]);
    if (totalGross <= 0) {
      pending = [];
      continue;
    }

    const quantityMatch = line.match(/(\d+,\d{2})\s*(kpl|l|pari|sarja)\b/i);
    const quantity = quantityMatch ? moneyToNumber(quantityMatch[1]) : 1;
    const unitLabel = quantityMatch ? quantityMatch[2].toLowerCase() : "kpl";
    const lineBeforeQuantity = quantityMatch ? line.slice(0, quantityMatch.index).trim() : line.replace(/\d+,\d{2}\s*€/g, "").trim();
    const lineDescription = lineBeforeQuantity
      .replace(/\b\d{2}-\d{4,5}\b/g, "")
      .replace(/\s+-\s+-\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const descriptionParts = [...pending];
    if (lineDescription && !/^\d{2}-\d{4,5}$/.test(lineDescription)) {
      descriptionParts.push(lineDescription);
    }
    const description = descriptionParts
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);

    if (description && !["Huoltotyön summa", "Varaosien summa"].includes(description)) {
      result.push({
        description,
        quantity: quantity > 0 ? quantity : 1,
        unit_label: unitLabel,
        unit_label_en: unitLabelEn(unitLabel),
        unit_gross_eur: Number((totalGross / (quantity > 0 ? quantity : 1)).toFixed(2)),
        vat_rate: 25.5,
      });
    }
    pending = [];
  }
  return result;
}

function buildWorkSummaryFi(lines: string[]) {
  const candidateLines = receiptWorkLines(lines)
    .map(normalizeReceiptLine)
    .filter((line) => !isIgnoredReceiptLine(line));
  const clean = candidateLines
    .filter((line) => !/^\d{2}-\d{4,5}\b/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return clean.slice(0, 5000);
}

async function translateFiToEnMany(texts: string[]) {
  const key = Deno.env.get("GOOGLE_TRANSLATE_API_KEY") ?? Deno.env.get("GOOGLE_CLOUD_TRANSLATE_API_KEY");
  const cleanTexts = texts.map((text) => String(text ?? "").trim());
  if (!key || cleanTexts.every((text) => !text)) return cleanTexts.map(() => "");
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: cleanTexts,
      source: "fi",
      target: "en",
      format: "text",
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    console.error("Google Translate failed", payload);
    return cleanTexts.map(() => "");
  }
  const translations = Array.isArray(payload?.data?.translations) ? payload.data.translations : [];
  return cleanTexts.map((_, index) => String(translations[index]?.translatedText ?? "").trim());
}

async function translateFiToEn(text: string) {
  return (await translateFiToEnMany([text]))[0] ?? "";
}

async function extractPdfText(dataUrl: string) {
  const globalScope = globalThis as unknown as {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
  };
  globalScope.DOMMatrix ??= class DOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
  };
  globalScope.ImageData ??= class ImageData {
    constructor(
      public data: Uint8ClampedArray,
      public width: number,
      public height: number,
    ) {}
  };
  globalScope.Path2D ??= class Path2D {};

  const { PDFParse } = await import("npm:pdf-parse");
  const parser = new PDFParse({ data: bytesFromBase64(base64FromDataUrl(dataUrl)) });
  try {
    const result = await parser.getText();
    return String(result.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
}

export async function parseTextReceipt(dataUrl: string, fileName: string) {
  const text = await extractPdfText(dataUrl);
  if (!text) throw new Error("This PDF does not contain readable text.");
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const normalizedText = lines.map(normalizeReceiptLine).join("\n");
  if (!normalizedText.includes("KUITTI") || !normalizedText.includes("Kuittinumero")) {
    throw new Error("This PDF does not match the supported Finnish receipt format.");
  }

  const stopLabels = new Set(["Ajettu", "Rekisterinumero", "Moottorikoodi", "Rekisteröity", "Valmistenumero", "Asiakas", "Huollossa huomioitu"]);
  const receiptNumber = getRegexValue(normalizedText, /Kuittinumero\s+([^\n]+)/);
  const workOrderNumber = getRegexValue(normalizedText, /Työmääräys\s+([^\n]+)/);
  const saleDateRaw = getRegexValue(normalizedText, /Myyntipäivä\s+([^\n]+)/);
  const licensePlate = cleanLicensePlate(valueAfterLabel(lines, "Rekisterinumero", stopLabels));
  const workSummaryFi = buildWorkSummaryFi(lines);
  const parsedLines = parseReceiptLines(lines);
  const translations = await translateFiToEnMany([workSummaryFi, ...parsedLines.map((line) => line.description)]);
  const workSummaryEn = translations[0] ?? "";
  const translatedLines = parsedLines.map((line, index) => ({
    ...line,
    description_en: translations[index + 1] ?? "",
  }));
  const phoneMatches = [...normalizedText.matchAll(/^Puh:\s*([^\n]+)/gm)].map((match) => match[1].trim());

  return {
    document_type: "receipt",
    language: "fi",
    confidence: "high",
    receipt: {
      receipt_number: receiptNumber,
      work_order_number: workOrderNumber,
      sale_date: saleDateRaw,
    },
    vehicle: {
      license_plate: licensePlate,
      vehicle: valueAfterLabel(lines, "Ajoneuvo", new Set(["Ajettu"])),
      mileage_km: valueAfterLabel(lines, "Ajettu", stopLabels).replace(/[^\d]/g, ""),
      vin: valueAfterLabel(lines, "Valmistenumero", stopLabels),
      engine_code: valueAfterLabel(lines, "Moottorikoodi", stopLabels),
      first_registered: valueAfterLabel(lines, "Rekisteröity", stopLabels),
    },
    customer: {
      name: valueAfterLabel(lines, "Asiakas", stopLabels),
      email: "",
      phone: phoneMatches.at(-1) ?? "",
      business_id: "",
      vat_id: "",
      address_line1: "",
      address_line2: "",
      postal_code: "",
      city: "",
    },
    payment: {
      provider: normalizedText.includes("Korttimaksu") ? "card" : normalizedText.includes("Käteismaksu") ? "cash" : normalizedText.includes("Tilisiirto") ? "bank_transfer" : "",
      transaction_id: "",
    },
    supply_date: parseFinnishDate(saleDateRaw),
    work_summary: workSummaryFi,
    work_summary_fi: workSummaryFi,
    work_summary_en: workSummaryEn,
    notes: `Imported without AI from ${fileName}`,
    lines: translatedLines,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (request.method !== "POST") throw new Error("Method not allowed");
    await ensureAuthorized(request);

    const body = await request.json();
    const fileName = String(body?.fileName ?? "document").trim();
    const mimeType = normalizeMimeType(body?.mimeType);
    const dataUrl = normalizeDataUrl(body?.dataUrl);
    if (mimeType === "application/pdf") {
      return jsonResponse(await parseTextReceipt(dataUrl, fileName));
    }

    throw new Error("Image import needs OCR. The non-AI importer currently supports text-based PDF receipts only.");
  } catch (error) {
    console.error("invoice_import_document failed", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
});
