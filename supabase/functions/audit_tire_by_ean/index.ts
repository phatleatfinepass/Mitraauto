import { createClient } from "npm:@supabase/supabase-js@2";

type SupportedLanguage = "fi" | "en";
type AuditSeason = "summer" | "winter" | "all_season" | null;
type ReviewStatus = "pending" | "accepted" | "rejected" | "kept_current";
type MatchStatus =
  | "matched"
  | "no_match"
  | "multiple_matches"
  | "wrong_product_group"
  | "blocked"
  | "unverified"
  | "error";

type AuditInput = {
  variant_id?: string | null;
  ean?: string | null;
  manual_eprel_registration_number?: string | null;
  use_fallback_search?: boolean | null;
  language?: SupportedLanguage | null;
  current?: {
    brand?: string | null;
    model?: string | null;
    size_string?: string | null;
    season?: string | null;
    runflat?: boolean | null;
    xl?: boolean | null;
    studded?: boolean | null;
    threepmsf?: boolean | null;
    winter_approved?: boolean | null;
    ice_approved?: boolean | null;
    eu_fuel?: string | null;
    eu_wet?: string | null;
    eu_noise?: number | null;
    eu_noise_class?: string | null;
  } | null;
};

type EprelModel = {
  eprelRegistrationNumber?: string | number | null;
  productGroup?: string | null;
  supplierOrTrademark?: string | null;
  commercialName?: string | null;
  modelIdentifier?: string | null;
  sizeDesignation?: string | null;
  tyreDesignation?: string | null;
  tyreClass?: string | null;
  loadCapacityIndex?: number | string | null;
  loadCapacityIndicator?: string | null;
  speedCategorySymbol?: string | null;
  energyClass?: string | null;
  wetGripClass?: string | null;
  externalRollingNoiseClass?: string | null;
  externalRollingNoiseValue?: number | string | null;
  severeSnowTyre?: boolean | null;
  iceTyre?: boolean | null;
  organisation?: {
    website?: string | null;
  } | null;
  contactDetails?: {
    serviceName?: string | null;
    webSiteURL?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  onMarketStartDate?: [number, number, number] | null;
  dateStartProductionWeek?: number | null;
  dateStartProductionYear?: number | null;
  dateEndProductionWeek?: number | null;
  dateEndProductionYear?: number | null;
  blocked?: boolean | null;
  orgVerificationStatus?: string | null;
  trademarkVerificationStatus?: string | null;
  [key: string]: unknown;
};

type EprelCandidate = {
  registration_number: string;
  brand: string | null;
  model: string | null;
  size_string: string | null;
  tyre_class: string | null;
  score: number;
  match_reasons: string[];
};

type TireAuditStatus =
  | "match"
  | "mismatch"
  | "missing_current"
  | "missing_audited"
  | "unknown";

type TireAuditCheck = {
  field: string;
  label: string;
  current_value: string | null;
  audited_value: string | null;
  status: TireAuditStatus;
};

type TireAuditExtracted = {
  brand: string | null;
  model: string | null;
  size_string: string | null;
  season: AuditSeason;
  metadata: {
    tyre_type_identifier: string | null;
    tyre_class: string | null;
    load_version: string | null;
    eprel_registration_number: string | null;
    eprel_qr_url: string | null;
    eprel_sheet_url: string | null;
    production_start: string | null;
    production_end: string | null;
    market_start: string | null;
    supplier_website: string | null;
    supplier_contact_name: string | null;
    supplier_contact_email: string | null;
    supplier_contact_phone: string | null;
    data_source: string | null;
    data_source_url: string | null;
    last_verified_at: string | null;
  };
  badges: {
    runflat: boolean | null;
    xl: boolean | null;
    studded: boolean | null;
    threepmsf: boolean | null;
    winter_approved: boolean | null;
    ice_approved: boolean | null;
  };
  eu_label: {
    fuel_class: string | null;
    wet_grip_class: string | null;
    noise_db: number | null;
    noise_class: string | null;
  };
};

const serviceSupabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class EprelFetchError extends Error {
  status: number;
  code: string | null;
  data: unknown;

  constructor(message: string, status: number, code: string | null, data: unknown) {
    super(message);
    this.name = "EprelFetchError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

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

async function withCors(request: Request, handler: () => Promise<Response>) {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    return await handler();
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}

async function ensureAuthorized(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthenticated");
  }

  let isAdmin = user.email === "admin@mitra-auto.fi";
  if (!isAdmin) {
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  if (!isAdmin) {
    throw new Error("Forbidden");
  }
}

function normalizeLanguage(value: unknown): SupportedLanguage {
  return value === "fi" ? "fi" : "en";
}

function normalizeEan(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length < 8) {
    throw new Error("Valid EAN is required for audit");
  }
  return digits;
}

function normalizeVariantId(value: unknown) {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : null;
}

function normalizeSeason(value: unknown): AuditSeason {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (raw === "summer") return "summer";
  if (raw === "winter") return "winter";
  if (raw === "all_season" || raw === "all season" || raw === "all-season") return "all_season";
  return null;
}

function normalizeGrade(value: unknown) {
  const grade = String(value ?? "").trim().toUpperCase();
  return /^[A-E]$/.test(grade) ? grade : null;
}

function normalizeNoiseClass(value: unknown) {
  const grade = String(value ?? "").trim().toUpperCase();
  return /^[A-C]$/.test(grade) ? grade : null;
}

function normalizeInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function buildSourceUrl(registrationNumber: string) {
  return `https://eprel.ec.europa.eu/screen/product/tyres/${registrationNumber}`;
}

function buildSizeString(detail: EprelModel) {
  const tyreDesignation = String(detail.tyreDesignation ?? "").trim();
  if (tyreDesignation) return tyreDesignation;

  const sizeDesignation = String(detail.sizeDesignation ?? "").trim();
  const loadIndex = normalizeInteger(detail.loadCapacityIndex);
  const speed = String(detail.speedCategorySymbol ?? "").trim().toUpperCase();
  return [sizeDesignation, loadIndex ? String(loadIndex) : null, speed || null].filter(Boolean).join(" ") || null;
}

function parseTireSizeParts(size?: string | null) {
  const cleaned = String(size ?? "").trim();
  const baseMatch = cleaned.match(/(\d{3})\s*\/\s*(\d{2})\s*R?\s*(\d{2})/i);

  if (!baseMatch) {
    return {
      width: null,
      aspect: null,
      rim: null,
      load_index: null,
      speed_rating: null,
    };
  }

  const tail = cleaned.slice((baseMatch.index ?? 0) + baseMatch[0].length).trim();
  const liSrMatch = tail.match(/^(\d{2,3})\s*([A-Z]{1,2})/i);

  return {
    width: baseMatch[1] ?? null,
    aspect: baseMatch[2] ?? null,
    rim: baseMatch[3] ?? null,
    load_index: liSrMatch?.[1] ?? null,
    speed_rating: liSrMatch?.[2]?.toUpperCase() ?? null,
  };
}

function stringifyBoolean(value: boolean | null | undefined, language: SupportedLanguage) {
  if (value === null || value === undefined) return null;
  return value ? (language === "fi" ? "Kyllä" : "Yes") : "No";
}

function normalizeComparable(value: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeSearchText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSizeString(value: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*R\s*/g, " R")
    .replace(/(\d)\s+([A-Z])$/, "$1$2");
}

function normalizeCoreSizeString(value: string | null) {
  const normalized = normalizeSizeString(value);
  const match = normalized.match(/^(\d{3}\/\d{2}\sR\d{2}(?:\s\d{2,3}[A-Z]{1,2}|\s\d{2,3}\s[A-Z]{1,2})?)/i);
  return match?.[1]?.replace(/\s+/g, " ").replace(/(\d)\s+([A-Z])$/, "$1$2") ?? normalized;
}

function compareValues(current: string | null, audited: string | null): TireAuditStatus {
  const currentNorm = normalizeComparable(current);
  const auditedNorm = normalizeComparable(audited);
  if (!currentNorm && !auditedNorm) return "unknown";
  if (!currentNorm && auditedNorm) return "missing_current";
  if (currentNorm && !auditedNorm) return "missing_audited";
  return currentNorm === auditedNorm ? "match" : "mismatch";
}

function compareSizeValues(current: string | null, audited: string | null): TireAuditStatus {
  const currentNorm = normalizeCoreSizeString(current);
  const auditedNorm = normalizeCoreSizeString(audited);
  if (!currentNorm && !auditedNorm) return "unknown";
  if (!currentNorm && auditedNorm) return "missing_current";
  if (currentNorm && !auditedNorm) return "missing_audited";
  return currentNorm === auditedNorm ? "match" : "mismatch";
}

function compareBooleanAudit(current: boolean | null | undefined, audited: boolean | null | undefined): TireAuditStatus {
  if (audited === null || audited === undefined) {
    return "unknown";
  }
  if (current === null || current === undefined) {
    return "missing_current";
  }
  return current === audited ? "match" : "mismatch";
}

function extractFicheAddress(payload: unknown) {
  if (!payload) return null;
  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed.address === "string") return parsed.address;
    } catch {
      if (/^https?:\/\//i.test(payload)) return payload;
    }
    return null;
  }
  if (typeof payload === "object" && payload !== null && "address" in payload) {
    const address = (payload as Record<string, unknown>).address;
    return typeof address === "string" ? address : null;
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryEprelStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function eprelFetch(path: string, init: RequestInit = {}) {
  const baseUrl = Deno.env.get("EPREL_API_BASE_URL") ?? "https://eprel.ec.europa.eu/api";
  const apiKey = Deno.env.get("EPREL_API_KEY") ?? "";
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const headers = new Headers(init.headers ?? {});
    headers.set("Accept", "application/json");
    if (apiKey.trim()) {
      headers.set("x-api-key", apiKey.trim());
    }

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers,
      });

      const text = await response.text();
      let parsed: unknown = null;
      if (text.trim()) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (!response.ok) {
        if (response.status === 404) {
          return { response, data: null };
        }

        const code = parsed && typeof parsed === "object" && "code" in parsed
          && typeof (parsed as Record<string, unknown>).code === "string"
          ? (parsed as Record<string, unknown>).code as string
          : null;
        const message = parsed && typeof parsed === "object" && "message" in parsed
          && typeof (parsed as Record<string, unknown>).message === "string"
          ? (parsed as Record<string, unknown>).message as string
          : `EPREL request failed with status ${response.status}`;

        if (attempt < maxAttempts && shouldRetryEprelStatus(response.status)) {
          await sleep(250 * attempt);
          continue;
        }

        throw new EprelFetchError(message, response.status, code, parsed);
      }

      return { response, data: parsed };
    } catch (error) {
      if (error instanceof EprelFetchError) {
        throw error;
      }

      if (attempt < maxAttempts) {
        await sleep(250 * attempt);
        continue;
      }

      throw error;
    }
  }

  throw new Error("EPREL request failed after retries");
}

function toModelList(payload: unknown): EprelModel[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter(Boolean) as EprelModel[];
  if (typeof payload === "object") {
    const maybeWrappedHits = (payload as { hits?: unknown }).hits;
    if (Array.isArray(maybeWrappedHits)) {
      return maybeWrappedHits.filter(Boolean) as EprelModel[];
    }
    return [payload as EprelModel];
  }
  return [];
}

function dedupeModelsByRegistration(models: EprelModel[]) {
  const seen = new Set<string>();
  const result: EprelModel[] = [];
  for (const model of models) {
    const registrationNumber = model?.eprelRegistrationNumber != null
      ? String(model.eprelRegistrationNumber).trim()
      : "";
    if (!registrationNumber || seen.has(registrationNumber)) continue;
    seen.add(registrationNumber);
    result.push(model);
  }
  return result;
}

function hasLookupSignal(model: EprelModel) {
  return Boolean(
    model?.eprelRegistrationNumber != null ||
    String(model?.productGroup ?? "").trim() ||
    String(model?.supplierOrTrademark ?? "").trim() ||
    String(model?.commercialName ?? model?.modelIdentifier ?? "").trim()
  );
}

function deriveMatchStatus(model: EprelModel | null) {
  if (!model) return "no_match" as const;
  if (model.blocked === true) return "blocked" as const;
  if (
    String(model.orgVerificationStatus ?? "").toUpperCase() === "UNVERIFIED" ||
    String(model.trademarkVerificationStatus ?? "").toUpperCase() === "UNVERIFIED"
  ) {
    return "unverified" as const;
  }
  return "matched" as const;
}

function inferXl(detail: EprelModel) {
  const raw = String(detail.loadCapacityIndicator ?? "").trim().toUpperCase();
  if (!raw) return null;
  if (raw.includes("XL")) return true;
  if (raw === "SL") return false;
  return null;
}

function formatDateParts(parts: [number, number, number] | null | undefined) {
  if (!parts || parts.length < 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function formatProductionWindow(week: number | null | undefined, year: number | null | undefined) {
  if (week == null || year == null) return null;
  const normalizedYear = year < 100 ? 2000 + year : year;
  return `${String(week).padStart(2, "0")}/${normalizedYear}`;
}

function buildExtracted(detail: EprelModel): TireAuditExtracted {
  const registrationNumber = detail.eprelRegistrationNumber != null
    ? String(detail.eprelRegistrationNumber)
    : null;

  return {
    brand: String(detail.supplierOrTrademark ?? "").trim() || null,
    model: String(detail.commercialName ?? detail.modelIdentifier ?? "").trim() || null,
    size_string: buildSizeString(detail),
    season: null,
    metadata: {
      tyre_type_identifier: String(detail.modelIdentifier ?? "").trim() || null,
      tyre_class: String(detail.tyreClass ?? "").trim() || null,
      load_version: String(detail.loadCapacityIndicator ?? "").trim().toUpperCase() || null,
      eprel_registration_number: registrationNumber,
      eprel_qr_url: registrationNumber ? `https://eprel.ec.europa.eu/qr/${registrationNumber}` : null,
      eprel_sheet_url: null,
      production_start: formatProductionWindow(detail.dateStartProductionWeek, detail.dateStartProductionYear),
      production_end: formatProductionWindow(detail.dateEndProductionWeek, detail.dateEndProductionYear) ?? "No",
      market_start: formatDateParts(detail.onMarketStartDate),
      supplier_website: String(detail.contactDetails?.webSiteURL ?? detail.organisation?.website ?? "").trim() || null,
      supplier_contact_name: String(detail.contactDetails?.serviceName ?? "").trim() || null,
      supplier_contact_email: String(detail.contactDetails?.email ?? "").trim() || null,
      supplier_contact_phone: String(detail.contactDetails?.phone ?? "").trim() || null,
      data_source: "EPREL",
      data_source_url: registrationNumber ? buildSourceUrl(registrationNumber) : null,
      last_verified_at: new Date().toISOString().slice(0, 10),
    },
    badges: {
      runflat: null,
      xl: inferXl(detail),
      studded: null,
      threepmsf: detail.severeSnowTyre ?? null,
      winter_approved: null,
      ice_approved: detail.iceTyre ?? null,
    },
    eu_label: {
      fuel_class: normalizeGrade(detail.energyClass),
      wet_grip_class: normalizeGrade(detail.wetGripClass),
      noise_db: normalizeInteger(detail.externalRollingNoiseValue),
      noise_class: normalizeNoiseClass(detail.externalRollingNoiseClass),
    },
  };
}

function scoreFallbackCandidate(
  current: NonNullable<AuditInput["current"]>,
  candidate: EprelModel,
) {
  const reasons: string[] = [];
  const currentBrand = normalizeSearchText(current.brand ?? null);
  const candidateBrand = normalizeSearchText(String(candidate.supplierOrTrademark ?? ""));
  const currentModel = normalizeSearchText(current.model ?? null);
  const candidateCommercial = normalizeSearchText(String(candidate.commercialName ?? ""));
  const candidateModelIdentifier = normalizeSearchText(String(candidate.modelIdentifier ?? ""));
  const currentSize = normalizeCoreSizeString(current.size_string ?? null);
  const candidateSize = normalizeCoreSizeString(buildSizeString(candidate));
  const currentSizeParts = parseTireSizeParts(current.size_string ?? null);
  const candidateSizeParts = parseTireSizeParts(buildSizeString(candidate));

  let score = 0;
  let exactModel = false;
  let exactCoreSize = false;

  if (currentBrand && candidateBrand) {
    if (currentBrand === candidateBrand) {
      score += 30;
      reasons.push("brand exact");
    } else if (candidateBrand.includes(currentBrand) || currentBrand.includes(candidateBrand)) {
      score += 15;
      reasons.push("brand partial");
    }
  }

  if (currentModel) {
    if (currentModel === candidateCommercial || currentModel === candidateModelIdentifier) {
      score += 45;
      exactModel = true;
      reasons.push("model exact");
    } else if (
      candidateCommercial.includes(currentModel) ||
      currentModel.includes(candidateCommercial) ||
      candidateModelIdentifier.includes(currentModel) ||
      currentModel.includes(candidateModelIdentifier)
    ) {
      score += 25;
      reasons.push("model partial");
    }
  }

  if (currentSize && candidateSize) {
    if (currentSize === candidateSize) {
      score += 40;
      exactCoreSize = true;
      reasons.push("size exact");
    } else {
      const widthExact = currentSizeParts.width && currentSizeParts.width === candidateSizeParts.width;
      const aspectExact = currentSizeParts.aspect && currentSizeParts.aspect === candidateSizeParts.aspect;
      const rimExact = currentSizeParts.rim && currentSizeParts.rim === candidateSizeParts.rim;
      if (widthExact && aspectExact && rimExact) {
        score += 28;
        exactCoreSize = true;
        reasons.push("size core exact");
      }
    }
  }

  if (currentSizeParts.load_index && currentSizeParts.load_index === candidateSizeParts.load_index) {
    score += 8;
    reasons.push("load exact");
  }
  if (currentSizeParts.speed_rating && currentSizeParts.speed_rating === candidateSizeParts.speed_rating) {
    score += 8;
    reasons.push("speed exact");
  }

  return {
    score,
    exactModel,
    exactCoreSize,
    candidate: {
      registration_number: String(candidate.eprelRegistrationNumber ?? "").trim(),
      brand: String(candidate.supplierOrTrademark ?? "").trim() || null,
      model: String(candidate.commercialName ?? candidate.modelIdentifier ?? "").trim() || null,
      size_string: buildSizeString(candidate),
      tyre_class: String(candidate.tyreClass ?? "").trim() || null,
      score,
      match_reasons: reasons,
    } satisfies EprelCandidate,
  };
}

async function fallbackSearchTyres(current: NonNullable<AuditInput["current"]>) {
  const brand = String(current.brand ?? "").trim();
  if (!brand) {
    return {
      candidates: [] as EprelCandidate[],
      rawPayload: null as unknown,
      errorMessage: null as string | null,
    };
  }

  const searchPaths: string[] = [];
  const model = String(current.model ?? "").trim();
  const encodedBrand = encodeURIComponent(brand);
  if (model) {
    searchPaths.push(
      `/products/tyres?_page=1&_limit=25&includeOldProducts=true&supplierOrTrademark=${encodedBrand}&modelIdentifier=${encodeURIComponent(model)}`,
    );
  }
  searchPaths.push(
    `/products/tyres?_page=1&_limit=50&includeOldProducts=true&supplierOrTrademark=${encodedBrand}`,
  );

  const rawResponses: Array<{ path: string; data: unknown }> = [];
  const collected: EprelModel[] = [];

  for (const path of searchPaths) {
    try {
      const result = await eprelFetch(path);
      rawResponses.push({ path, data: result.data });
      collected.push(...toModelList(result.data).filter(hasLookupSignal));
    } catch (error) {
      if (error instanceof EprelFetchError && (error.status === 401 || error.status === 403)) {
        return {
          candidates: [] as EprelCandidate[],
          rawPayload: rawResponses,
          errorMessage: "EPREL fallback search requires an API key.",
        };
      }
      throw error;
    }
  }

  const scored = dedupeModelsByRegistration(collected)
    .filter((model) => String(model.productGroup ?? "").trim().toLowerCase() === "tyres")
    .map((model) => scoreFallbackCandidate(current, model))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const candidates = scored.slice(0, 5).map((entry) => entry.candidate);
  const best = scored[0] ?? null;
  const secondBest = scored[1] ?? null;
  const autoSelected = best && best.exactModel && best.exactCoreSize && best.score >= 90 &&
      (!secondBest || best.score - secondBest.score >= 15)
    ? dedupeModelsByRegistration(collected).find((model) =>
      String(model.eprelRegistrationNumber ?? "").trim() === best.candidate.registration_number
    ) ?? null
    : null;

  return {
    candidates,
    autoSelected,
    rawPayload: rawResponses,
    errorMessage: null as string | null,
  };
}

function buildChecks(language: SupportedLanguage, current: NonNullable<AuditInput["current"]>, extracted: TireAuditExtracted): TireAuditCheck[] {
  const currentSizeParts = parseTireSizeParts(current.size_string);
  const auditedSizeParts = parseTireSizeParts(extracted.size_string);

  return [
    {
      field: "brand",
      label: "Brand",
      current_value: current.brand ?? null,
      audited_value: extracted.brand,
      status: compareValues(current.brand ?? null, extracted.brand),
    },
    {
      field: "model",
      label: "Model",
      current_value: current.model ?? null,
      audited_value: extracted.model,
      status: compareValues(current.model ?? null, extracted.model),
    },
    {
      field: "size_string",
      label: "Size",
      current_value: current.size_string ?? null,
      audited_value: extracted.size_string,
      status: compareSizeValues(current.size_string ?? null, extracted.size_string),
    },
    {
      field: "size_width",
      label: "Width",
      current_value: currentSizeParts.width,
      audited_value: auditedSizeParts.width,
      status: compareValues(currentSizeParts.width, auditedSizeParts.width),
    },
    {
      field: "size_aspect",
      label: "Aspect Ratio",
      current_value: currentSizeParts.aspect,
      audited_value: auditedSizeParts.aspect,
      status: compareValues(currentSizeParts.aspect, auditedSizeParts.aspect),
    },
    {
      field: "size_rim",
      label: "Diameter",
      current_value: currentSizeParts.rim,
      audited_value: auditedSizeParts.rim,
      status: compareValues(currentSizeParts.rim, auditedSizeParts.rim),
    },
    {
      field: "size_load_index",
      label: "Load Index",
      current_value: currentSizeParts.load_index,
      audited_value: auditedSizeParts.load_index,
      status: compareValues(currentSizeParts.load_index, auditedSizeParts.load_index),
    },
    {
      field: "size_speed_rating",
      label: "Speed Rating",
      current_value: currentSizeParts.speed_rating,
      audited_value: auditedSizeParts.speed_rating,
      status: compareValues(currentSizeParts.speed_rating, auditedSizeParts.speed_rating),
    },
    {
      field: "season",
      label: "Season",
      current_value: normalizeSeason(current.season),
      audited_value: extracted.season,
      status: compareValues(normalizeSeason(current.season), extracted.season),
    },
    {
      field: "runflat",
      label: "RunFlat",
      current_value: stringifyBoolean(current.runflat, language),
      audited_value: stringifyBoolean(extracted.badges.runflat, language),
      status: compareBooleanAudit(current.runflat, extracted.badges.runflat),
    },
    {
      field: "xl",
      label: "XL",
      current_value: stringifyBoolean(current.xl, language),
      audited_value: stringifyBoolean(extracted.badges.xl, language),
      status: compareBooleanAudit(current.xl, extracted.badges.xl),
    },
    {
      field: "studded",
      label: "Studded",
      current_value: stringifyBoolean(current.studded, language),
      audited_value: stringifyBoolean(extracted.badges.studded, language),
      status: compareBooleanAudit(current.studded, extracted.badges.studded),
    },
    {
      field: "threepmsf",
      label: "3PMSF",
      current_value: stringifyBoolean(current.threepmsf, language),
      audited_value: stringifyBoolean(extracted.badges.threepmsf, language),
      status: compareBooleanAudit(current.threepmsf, extracted.badges.threepmsf),
    },
    {
      field: "winter_approved",
      label: "Winter approved",
      current_value: stringifyBoolean(current.winter_approved, language),
      audited_value: stringifyBoolean(extracted.badges.winter_approved, language),
      status: compareBooleanAudit(current.winter_approved, extracted.badges.winter_approved),
    },
    {
      field: "ice_approved",
      label: "Ice approved",
      current_value: stringifyBoolean(current.ice_approved, language),
      audited_value: stringifyBoolean(extracted.badges.ice_approved, language),
      status: compareBooleanAudit(current.ice_approved, extracted.badges.ice_approved),
    },
    {
      field: "eu_fuel",
      label: "EU Fuel",
      current_value: normalizeGrade(current.eu_fuel),
      audited_value: extracted.eu_label.fuel_class,
      status: compareValues(normalizeGrade(current.eu_fuel), extracted.eu_label.fuel_class),
    },
    {
      field: "eu_wet",
      label: "EU Wet Grip",
      current_value: normalizeGrade(current.eu_wet),
      audited_value: extracted.eu_label.wet_grip_class,
      status: compareValues(normalizeGrade(current.eu_wet), extracted.eu_label.wet_grip_class),
    },
    {
      field: "eu_noise",
      label: "EU Noise",
      current_value:
        current.eu_noise !== null && current.eu_noise !== undefined ? String(current.eu_noise) : null,
      audited_value:
        extracted.eu_label.noise_db !== null && extracted.eu_label.noise_db !== undefined
          ? String(extracted.eu_label.noise_db)
          : null,
      status: compareValues(
        current.eu_noise !== null && current.eu_noise !== undefined ? String(current.eu_noise) : null,
        extracted.eu_label.noise_db !== null && extracted.eu_label.noise_db !== undefined
          ? String(extracted.eu_label.noise_db)
          : null,
      ),
    },
    {
      field: "eu_noise_class",
      label: "EU Noise Class",
      current_value: normalizeNoiseClass(current.eu_noise_class),
      audited_value: extracted.eu_label.noise_class,
      status: compareValues(normalizeNoiseClass(current.eu_noise_class), extracted.eu_label.noise_class),
    },
  ];
}

function buildSummary(
  language: SupportedLanguage,
  matchStatus: MatchStatus,
  detail: EprelModel | null,
  options?: {
    fallbackMode?: "gtin" | "search";
    candidateCount?: number;
    matchReason?: string | null;
  },
) {
  if (matchStatus === "matched" && detail) {
    const brand = String(detail.supplierOrTrademark ?? "").trim();
    const model = String(detail.commercialName ?? detail.modelIdentifier ?? "").trim();
    const designation = buildSizeString(detail);
    if (language === "fi") {
      return `${options?.fallbackMode === "search" ? "EPREL fallback-haku löysi osuman" : "EPREL-match löytyi"}${brand || model || designation ? `: ${[brand, model, designation].filter(Boolean).join(" / ")}` : ""}.`;
    }
    return `${options?.fallbackMode === "search" ? "EPREL fallback search found a match" : "EPREL match found"}${brand || model || designation ? `: ${[brand, model, designation].filter(Boolean).join(" / ")}` : ""}.`;
  }
  if (matchStatus === "no_match") {
    if (options?.matchReason) return options.matchReason;
    return language === "fi" ? "EAN-koodille ei löytynyt EPREL-osumaa." : "No EPREL match was found for this EAN.";
  }
  if (matchStatus === "multiple_matches") {
    if (options?.candidateCount) {
      return language === "fi"
        ? `Fallback-haku löysi ${options.candidateCount} EPREL-ehdokasta. Valitse oikea osuma manuaalisesti.`
        : `Fallback search found ${options.candidateCount} EPREL candidates. Manual confirmation is required.`;
    }
    return language === "fi" ? "EAN palautti useita EPREL-osumia." : "The EAN returned multiple EPREL matches.";
  }
  if (matchStatus === "wrong_product_group") {
    return language === "fi" ? "EAN löytyi EPREListä, mutta se ei ollut rengas." : "The EAN exists in EPREL, but it is not a tire product.";
  }
  if (matchStatus === "blocked") {
    return language === "fi" ? "EPREL-malli on estetty eikä sitä voi käyttää." : "The EPREL model is blocked and cannot be used.";
  }
  if (matchStatus === "unverified") {
    return language === "fi" ? "EPREL-malli löytyi, mutta toimittajan vahvistus puuttuu." : "The EPREL model was found, but the supplier or trademark is unverified.";
  }
  return language === "fi" ? "EPREL-haku epäonnistui." : "EPREL lookup failed.";
}

async function persistMatchAndReviews(params: {
  variantId: string | null;
  ean: string;
  current: NonNullable<AuditInput["current"]>;
  detail: EprelModel | null;
  extracted: TireAuditExtracted | null;
  checks: TireAuditCheck[];
  matchStatus: string;
  matchReason: string | null;
  sourceUrls: string[];
  ficheUrl: string | null;
  rawPayload: unknown;
}) {
  if (!params.variantId) return null;

  const registrationNumber = params.detail?.eprelRegistrationNumber != null
    ? String(params.detail.eprelRegistrationNumber)
    : null;
  const sourceUrl = registrationNumber ? buildSourceUrl(registrationNumber) : null;

  const { data: matchRow, error: matchError } = await serviceSupabase
    .from("cms_tire_eprel_matches")
    .insert({
      variant_id: params.variantId,
      gtin_queried: params.ean,
      eprel_registration_number: registrationNumber,
      product_group: params.detail?.productGroup ?? null,
      match_status: params.matchStatus,
      match_reason: params.matchReason,
      supplier_or_trademark: params.detail?.supplierOrTrademark ?? null,
      commercial_name: params.detail?.commercialName ?? params.detail?.modelIdentifier ?? null,
      size_designation: params.detail?.sizeDesignation ?? null,
      tyre_designation: params.detail?.tyreDesignation ?? null,
      tyre_class: params.detail?.tyreClass ?? null,
      load_capacity_index: normalizeInteger(params.detail?.loadCapacityIndex),
      speed_category_symbol: params.detail?.speedCategorySymbol ?? null,
      fuel_efficiency_class: params.extracted?.eu_label.fuel_class ?? null,
      wet_grip_class: params.extracted?.eu_label.wet_grip_class ?? null,
      external_rolling_noise_class: params.extracted?.eu_label.noise_class ?? null,
      external_rolling_noise_value: params.extracted?.eu_label.noise_db ?? null,
      severe_snow_tyre: params.detail?.severeSnowTyre ?? null,
      ice_tyre: params.detail?.iceTyre ?? null,
      eprel_source_url: sourceUrl,
      eprel_fiche_url: params.ficheUrl,
      raw_payload_json: params.rawPayload ?? {},
    })
    .select("id")
    .single();

  if (matchError) {
    console.error("Failed to persist EPREL match", matchError);
    return null;
  }

  const reviewRows: Array<{
    eprel_match_id: string;
    variant_id: string;
    field_name: string;
    current_value: unknown;
    proposed_value: unknown;
    review_status: ReviewStatus;
  }> = [];

  const pushReview = (fieldName: string, currentValue: unknown, proposedValue: unknown) => {
    reviewRows.push({
      eprel_match_id: matchRow.id,
      variant_id: params.variantId!,
      field_name: fieldName,
      current_value: currentValue ?? null,
      proposed_value: proposedValue ?? null,
      review_status: "pending",
    });
  };

  pushReview("eprel_registration_number", null, registrationNumber);
  pushReview("eprel_source_url", null, sourceUrl);
  pushReview("eprel_fiche_url", null, params.ficheUrl);

  if (params.extracted) {
    pushReview("brand", params.current.brand ?? null, params.extracted.brand);
    pushReview("model", params.current.model ?? null, params.extracted.model);
    pushReview("size_string", params.current.size_string ?? null, params.extracted.size_string);
    pushReview("season", normalizeSeason(params.current.season), params.extracted.season);
    pushReview("runflat", params.current.runflat ?? null, params.extracted.badges.runflat);
    pushReview("xl", params.current.xl ?? null, params.extracted.badges.xl);
    pushReview("studded", params.current.studded ?? null, params.extracted.badges.studded);
    pushReview("threepmsf", params.current.threepmsf ?? null, params.extracted.badges.threepmsf);
    pushReview("winter_approved", params.current.winter_approved ?? null, params.extracted.badges.winter_approved);
    pushReview("ice_approved", params.current.ice_approved ?? null, params.extracted.badges.ice_approved);
    pushReview("eu_fuel", normalizeGrade(params.current.eu_fuel), params.extracted.eu_label.fuel_class);
    pushReview("eu_wet", normalizeGrade(params.current.eu_wet), params.extracted.eu_label.wet_grip_class);
    pushReview("eu_noise", params.current.eu_noise ?? null, params.extracted.eu_label.noise_db);
    pushReview("eu_noise_class", normalizeNoiseClass(params.current.eu_noise_class), params.extracted.eu_label.noise_class);
  }

  if (reviewRows.length > 0) {
    const { error: reviewsError } = await serviceSupabase
      .from("cms_tire_eprel_field_reviews")
      .insert(reviewRows);
    if (reviewsError) {
      console.error("Failed to persist EPREL field reviews", reviewsError);
    }
  }

  return matchRow.id as string;
}

Deno.serve((request) =>
  withCors(request, async () => {
    await ensureAuthorized(request);

    const body = (await request.json().catch(() => ({}))) as AuditInput;
    const language = normalizeLanguage(body?.language);
    const ean = normalizeEan(body?.ean);
    const variantId = normalizeVariantId(body?.variant_id);
    const current = body?.current ?? {};
    const manualRegistrationNumber = String(body?.manual_eprel_registration_number ?? "").trim();
    const useFallbackSearch = body?.use_fallback_search === true;

    const lookupResult = manualRegistrationNumber
      ? { response: null, data: null }
      : await eprelFetch(`/product/gtin/${encodeURIComponent(ean)}`);
    const candidates = manualRegistrationNumber ? [] : toModelList(lookupResult.data).filter(hasLookupSignal);

    const tyreCandidates = candidates.filter((model) => String(model.productGroup ?? "").trim().toLowerCase() === "tyres");

    let matchStatus: MatchStatus = "no_match";
    let matchReason: string | null = null;
    let detail: EprelModel | null = null;
    let ficheUrl: string | null = null;
    let fallbackMode: "gtin" | "search" = "gtin";
    let fallbackCandidates: EprelCandidate[] = [];
    let fallbackRawPayload: unknown = null;

    if (manualRegistrationNumber) {
      fallbackMode = "search";
      try {
        const detailResult = await eprelFetch(`/products/tyres/${encodeURIComponent(manualRegistrationNumber)}`);
        detail = ((detailResult.data && typeof detailResult.data === "object")
          ? detailResult.data
          : { eprelRegistrationNumber: manualRegistrationNumber, productGroup: "tyres" }) as EprelModel;
        matchStatus = deriveMatchStatus(detail);
        matchReason = language === "fi"
          ? "EPREL-ehdokas valittiin manuaalisesti fallback-listasta."
          : "An EPREL candidate was selected manually from the fallback shortlist.";

        if (matchStatus === "matched" || matchStatus === "unverified") {
          try {
            const ficheResult = await eprelFetch(
              `/products/tyres/${encodeURIComponent(manualRegistrationNumber)}/fiches?noRedirect=true&language=EN`,
            );
            ficheUrl = extractFicheAddress(ficheResult.data);
          } catch (error) {
            if (error instanceof EprelFetchError && error.code === "BLOCKED_MODEL") {
              matchStatus = "blocked";
              matchReason = "EPREL model is blocked";
              ficheUrl = null;
            } else {
              throw error;
            }
          }
        }
      } catch (error) {
        if (error instanceof EprelFetchError && error.code === "BLOCKED_MODEL") {
          matchStatus = "blocked";
          matchReason = "EPREL model is blocked";
          detail = {
            eprelRegistrationNumber: manualRegistrationNumber,
            productGroup: "tyres",
            blocked: true,
          };
        } else {
          throw error;
        }
      }
    } else if (tyreCandidates.length === 0) {
      matchStatus = candidates.length > 0 ? "wrong_product_group" : "no_match";
      matchReason = candidates.length > 0 ? "GTIN returned a non-tyre EPREL model" : "GTIN not found in EPREL";
    } else if (tyreCandidates.length > 1) {
      matchStatus = "multiple_matches";
      matchReason = "GTIN returned multiple tyre models in EPREL";
    } else {
      const selected = tyreCandidates[0];
      const registrationNumber = selected?.eprelRegistrationNumber != null
        ? String(selected.eprelRegistrationNumber)
        : "";
      if (!registrationNumber) {
        matchStatus = "no_match";
        matchReason = "EPREL GTIN lookup returned an empty model without registration number";
      } else {
        try {
          const detailResult = await eprelFetch(`/products/tyres/${encodeURIComponent(registrationNumber)}`);
          detail = ((detailResult.data && typeof detailResult.data === "object") ? detailResult.data : selected) as EprelModel;
          matchStatus = deriveMatchStatus(detail);
          matchReason =
            matchStatus === "blocked"
              ? "EPREL model is blocked"
              : matchStatus === "unverified"
                ? "EPREL model belongs to an unverified supplier or trademark"
                : null;

          if (matchStatus === "matched" || matchStatus === "unverified") {
            try {
              const ficheResult = await eprelFetch(
                `/products/tyres/${encodeURIComponent(registrationNumber)}/fiches?noRedirect=true&language=EN`
              );
              ficheUrl = extractFicheAddress(ficheResult.data);
            } catch (error) {
              if (error instanceof EprelFetchError && error.code === "BLOCKED_MODEL") {
                matchStatus = "blocked";
                matchReason = "EPREL model is blocked";
                ficheUrl = null;
              } else {
                throw error;
              }
            }
          }
        } catch (error) {
          if (error instanceof EprelFetchError && error.code === "BLOCKED_MODEL") {
            matchStatus = "blocked";
            matchReason = "EPREL model is blocked";
            detail = {
              ...selected,
              blocked: true,
              eprelRegistrationNumber: registrationNumber,
              productGroup: "tyres",
            };
          } else {
            throw error;
          }
        }
      }
    }

    if (useFallbackSearch && (matchStatus === "no_match" || matchStatus === "wrong_product_group") && current.brand && current.model) {
      const fallbackResult = await fallbackSearchTyres(current);
      fallbackMode = "search";
      fallbackCandidates = fallbackResult.candidates;
      fallbackRawPayload = fallbackResult.rawPayload;

      if (fallbackResult.errorMessage) {
        matchReason = language === "fi"
          ? "EAN ei löytynyt, eikä fallback-haku ollut käytettävissä ilman EPREL API -avainta."
          : "The EAN was not found, and fallback search could not be used without an EPREL API key.";
      } else if (fallbackResult.autoSelected) {
        const registrationNumber = String(fallbackResult.autoSelected.eprelRegistrationNumber ?? "").trim();
        try {
          const detailResult = await eprelFetch(`/products/tyres/${encodeURIComponent(registrationNumber)}`);
          detail = ((detailResult.data && typeof detailResult.data === "object")
            ? detailResult.data
            : fallbackResult.autoSelected) as EprelModel;
          matchStatus = deriveMatchStatus(detail);
          matchReason = language === "fi"
            ? "EAN ei löytynyt, mutta EPREL fallback-haku löysi vahvan brandi/malli/koko-osuman."
            : "The EAN was not found, but EPREL fallback search found a strong brand/model/size match.";

          if (matchStatus === "matched" || matchStatus === "unverified") {
            try {
              const ficheResult = await eprelFetch(
                `/products/tyres/${encodeURIComponent(registrationNumber)}/fiches?noRedirect=true&language=EN`,
              );
              ficheUrl = extractFicheAddress(ficheResult.data);
            } catch (error) {
              if (error instanceof EprelFetchError && error.code === "BLOCKED_MODEL") {
                matchStatus = "blocked";
                matchReason = "EPREL model is blocked";
                ficheUrl = null;
              } else {
                throw error;
              }
            }
          }
        } catch (error) {
          if (error instanceof EprelFetchError && error.code === "BLOCKED_MODEL") {
            matchStatus = "blocked";
            matchReason = "EPREL model is blocked";
            detail = {
              ...fallbackResult.autoSelected,
              blocked: true,
              eprelRegistrationNumber: registrationNumber,
              productGroup: "tyres",
            };
          } else {
            throw error;
          }
        }
      } else if (fallbackCandidates.length > 0) {
        matchStatus = "multiple_matches";
        matchReason = language === "fi"
          ? "EAN ei löytynyt, mutta fallback-haku löysi EPREL-ehdokkaita brandin, mallin ja koon perusteella."
          : "The EAN was not found, but fallback search found EPREL candidates using brand, model, and size.";
      }
    }

    const extracted = detail ? buildExtracted(detail) : null;
    if (extracted && ficheUrl) {
      extracted.metadata.eprel_sheet_url = ficheUrl.startsWith("http")
        ? ficheUrl
        : `https://eprel.ec.europa.eu${ficheUrl}`;
    }
    const checks = extracted ? buildChecks(language, current, extracted) : [];
    const sourceUrls = detail
      ? [buildSourceUrl(String(detail.eprelRegistrationNumber ?? "")), ficheUrl]
          .filter((value): value is string => Boolean(value))
      : [];

    const persistedMatchId = await persistMatchAndReviews({
      variantId,
      ean,
      current,
      detail,
      extracted,
      checks,
      matchStatus,
      matchReason,
      sourceUrls,
      ficheUrl,
      rawPayload: {
        gtin_lookup: lookupResult.data,
        fallback_search: fallbackRawPayload,
        fallback_candidates: fallbackCandidates,
        detail,
        fiche_url: ficheUrl,
      },
    });

    const summary = buildSummary(language, matchStatus, detail, {
      fallbackMode,
      candidateCount: fallbackCandidates.length,
      matchReason,
    });
    const confidence = matchStatus === "matched" ? "high" : matchStatus === "multiple_matches" ? "low" : "medium";

    return jsonResponse({
      ean,
      eprel_match_id: persistedMatchId,
      match_status: matchStatus,
      eprel_registration_number: detail?.eprelRegistrationNumber != null ? String(detail.eprelRegistrationNumber) : null,
      eprel_fiche_url: ficheUrl,
      summary,
      confidence,
      source_urls: sourceUrls,
      fallback_mode: fallbackMode,
      candidates: fallbackCandidates,
      extracted: extracted ?? {
        brand: null,
        model: null,
        size_string: null,
        season: null,
        metadata: {
          tyre_type_identifier: null,
          tyre_class: null,
          load_version: null,
          eprel_registration_number: null,
          eprel_qr_url: null,
          eprel_sheet_url: null,
          production_start: null,
          production_end: null,
          market_start: null,
          supplier_website: null,
          supplier_contact_name: null,
          supplier_contact_email: null,
          supplier_contact_phone: null,
          data_source: null,
          data_source_url: null,
          last_verified_at: null,
        },
        badges: {
          runflat: null,
          xl: null,
          studded: null,
          threepmsf: null,
          winter_approved: null,
          ice_approved: null,
        },
        eu_label: {
          fuel_class: null,
          wet_grip_class: null,
          noise_db: null,
          noise_class: null,
        },
      },
      checks,
    });
  }));
