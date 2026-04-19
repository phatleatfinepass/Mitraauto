import { createClient } from "npm:@supabase/supabase-js@2";

type SupportedLanguage = "fi" | "en";
type AuditSeason = "summer" | "winter" | "all_season" | null;

type AuditInput = {
  ean?: string | null;
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

function getEnv(name: string, fallback?: string) {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
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

function inferBooleanFromText(values: Array<string | null | undefined>, patterns: RegExp[]) {
  const haystack = values
    .map((value) => String(value ?? ""))
    .join(" \n ")
    .toUpperCase();

  return patterns.some((pattern) => pattern.test(haystack));
}

function forceFalseIfSummer(
  season: AuditSeason,
  value: boolean | null | undefined,
) {
  if (season === "summer" && value !== true) {
    return false;
  }
  return value ?? null;
}

function isExactIdentifierMatch(text: string, ean: string, sizeString: string | null) {
  const normalizedText = text.toUpperCase();
  const normalizedSize = normalizeSizeString(sizeString);
  const compactSize = normalizedSize.replace(/\s+/g, "");
  return normalizedText.includes(ean) && (!!normalizedSize ? (normalizedText.includes(normalizedSize) || normalizedText.includes(compactSize)) : true);
}

function classifySourceQuality(url: string) {
  const normalized = String(url).trim().toLowerCase();
  if (!normalized) return "weak" as const;
  if (normalized.includes("eprel.ec.europa.eu")) return "eprel" as const;
  if (normalized.includes("barum-tyres.com") || normalized.includes("continental-tires.com") || normalized.includes("conti.com")) {
    return "manufacturer" as const;
  }
  if (
    normalized.includes("auto-doc") ||
    normalized.includes("autodoc") ||
    normalized.includes("oponeo") ||
    normalized.includes("tirendo") ||
    normalized.includes("reifen.com")
  ) {
    return "retailer_strong" as const;
  }
  return "retailer_other" as const;
}

function scoreConfidence(params: {
  ean: string;
  sourceUrls: string[];
  brand: string | null;
  model: string | null;
  sizeString: string | null;
}) {
  const haystack = [params.brand, params.model, params.sizeString].filter(Boolean).join(" ").toUpperCase();
  const exactStrongSources = params.sourceUrls.filter((url) => {
    const quality = classifySourceQuality(url);
    return (quality === "eprel" || quality === "manufacturer" || quality === "retailer_strong") &&
      isExactIdentifierMatch(`${url} ${haystack}`, params.ean, params.sizeString);
  });
  const manufacturerOrEprel = params.sourceUrls.filter((url) => {
    const quality = classifySourceQuality(url);
    return quality === "eprel" || quality === "manufacturer";
  });

  if (manufacturerOrEprel.length >= 1 && exactStrongSources.length >= 1) {
    return "high" as const;
  }
  if (exactStrongSources.length >= 2) {
    return "high" as const;
  }
  if (exactStrongSources.length >= 1) {
    return "medium" as const;
  }
  if (params.sourceUrls.length >= 2) {
    return "medium" as const;
  }
  return "low" as const;
}

function buildPrompt(language: SupportedLanguage, input: AuditInput & { ean: string }) {
  const fi = language === "fi";
  return [
    {
      role: "system",
      content:
        "You audit tire catalog data by using web search. Prioritize manufacturer pages, reputable tire retailers, and EU tyre label sources. Strong retailer sources include AUTODOC, Oponeo, Tirendo, and comparable specialist tire shops. Do not invent facts. If sources conflict, prefer the most reputable source and lower the confidence. Return only the requested JSON schema.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Audit a tire product by exact EAN and compare with current CMS values.",
          language,
          instructions: fi
            ? [
                "Hae tarkalla EAN-koodilla.",
                "Tarkista erityisesti brändi, malli, koko, kausi, RunFlat, XL, nastat, 3PMSF ja EU-rengasmerkinnät.",
                "Suosi valmistajan sivuja, AUTODOCia, Oponeoa, Tirendoa ja EU-rengasmerkintälähteitä.",
                "Tunnista myös lyhenteet: RFT, ROF, SSR, EMT, DSST, ZP tai RSC = RunFlat; XL, Extra Load tai Reinforced = XL; 3PMSF, mountain snowflake tai three peak = 3PMSF.",
                "Käytä vain verkosta löytyviä tietoja. Jos et löydä tietoa, jätä kenttä nulliksi.",
                "Lisää lähde-URL:t, joita käytit.",
                "Kirjoita lyhyt yhteenveto auditista.",
              ]
            : [
                "Search by the exact EAN code.",
                "Verify brand, model, size, season, RunFlat, XL, studded, 3PMSF, and EU tyre label fields.",
                "Prefer manufacturer pages, AUTODOC, Oponeo, Tirendo, and EU tyre label sources.",
                "Recognize abbreviations: RFT, ROF, SSR, EMT, DSST, ZP, or RSC = RunFlat; XL, Extra Load, or Reinforced = XL; 3PMSF, mountain snowflake, or three peak = 3PMSF.",
                "Only set a badge to true when it is explicitly shown for the exact product or exact EAN. Do not infer true from generic category text, related products, or broad page copy.",
                "If the product is a summer tire, studded, 3PMSF, winter_approved, and ice_approved should normally be false unless a source explicitly proves otherwise.",
                "Use only facts you can find on the web. If you cannot verify a field, return null for it.",
                "Search not only by EAN but also by exact product code / MPN if you find one.",
                "Confidence should be higher only when exact-product sources agree. Manufacturer or EPREL exact-product sources are stronger than generic reseller pages.",
                "Include the source URLs you used.",
                "Write a short audit summary.",
              ],
          ean: input.ean,
          current_values: input.current ?? {},
          output_rules: {
            return_json: true,
            no_markdown: true,
            include_null_for_unknown_fields: true,
          },
        },
        null,
        2,
      ),
    },
  ];
}

async function runAudit(language: SupportedLanguage, input: AuditInput & { ean: string }) {
  const model = getEnv(
    "OPENAI_MODEL_AUDIT",
    Deno.env.get("OPENAI_MODEL") ?? "gpt-5.4-nano",
  );

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getEnv("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model,
      tools: [{ type: "web_search_preview", search_context_size: "medium" }],
      input: buildPrompt(language, input),
      max_output_tokens: 2200,
      text: {
        format: {
          type: "json_schema",
          name: "tire_ean_audit",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              confidence: {
                type: "string",
                enum: ["low", "medium", "high"],
              },
              source_urls: {
                type: "array",
                items: { type: "string" },
              },
              extracted: {
                type: "object",
                properties: {
                  brand: { type: ["string", "null"] },
                  model: { type: ["string", "null"] },
                  size_string: { type: ["string", "null"] },
                  season: {
                    type: ["string", "null"],
                    enum: ["summer", "winter", "all_season", null],
                  },
                  badges: {
                    type: "object",
                    properties: {
                      runflat: { type: ["boolean", "null"] },
                      xl: { type: ["boolean", "null"] },
                      studded: { type: ["boolean", "null"] },
                      threepmsf: { type: ["boolean", "null"] },
                      winter_approved: { type: ["boolean", "null"] },
                      ice_approved: { type: ["boolean", "null"] },
                    },
                    required: [
                      "runflat",
                      "xl",
                      "studded",
                      "threepmsf",
                      "winter_approved",
                      "ice_approved",
                    ],
                    additionalProperties: false,
                  },
                  eu_label: {
                    type: "object",
                    properties: {
                      fuel_class: { type: ["string", "null"] },
                      wet_grip_class: { type: ["string", "null"] },
                      noise_db: { type: ["number", "null"] },
                      noise_class: { type: ["string", "null"] },
                    },
                    required: [
                      "fuel_class",
                      "wet_grip_class",
                      "noise_db",
                      "noise_class",
                    ],
                    additionalProperties: false,
                  },
                },
                required: ["brand", "model", "size_string", "season", "badges", "eu_label"],
                additionalProperties: false,
              },
            },
            required: ["summary", "confidence", "source_urls", "extracted"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      "OpenAI request failed";
    throw new Error(message);
  }

  const outputText = String(
    payload?.output_text ??
      payload?.output?.flatMap((item: any) => item?.content ?? [])?.map((part: any) => part?.text ?? "")?.join("") ??
      "",
  ).trim();

  if (!outputText) {
    throw new Error("AI returned an empty audit response");
  }

  return JSON.parse(outputText) as {
    summary: string;
    confidence: "low" | "medium" | "high";
    source_urls: string[];
    extracted: {
      brand: string | null;
      model: string | null;
      size_string: string | null;
      season: AuditSeason;
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
  };
}

function stringifyBoolean(value: boolean | null | undefined, language: SupportedLanguage) {
  if (value === null || value === undefined) return null;
  return value ? (language === "fi" ? "Kyllä" : "Yes") : "No";
}

function normalizeComparable(value: string | null) {
  return String(value ?? "").trim().toLowerCase();
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

function compareValues(current: string | null, audited: string | null) {
  const currentNorm = normalizeComparable(current);
  const auditedNorm = normalizeComparable(audited);
  if (!currentNorm && !auditedNorm) return "unknown";
  if (!currentNorm && auditedNorm) return "missing_current";
  if (currentNorm && !auditedNorm) return "missing_audited";
  return currentNorm === auditedNorm ? "match" : "mismatch";
}

function compareSizeValues(current: string | null, audited: string | null) {
  const currentNorm = normalizeCoreSizeString(current);
  const auditedNorm = normalizeCoreSizeString(audited);
  if (!currentNorm && !auditedNorm) return "unknown";
  if (!currentNorm && auditedNorm) return "missing_current";
  if (currentNorm && !auditedNorm) return "missing_audited";
  return currentNorm === auditedNorm ? "match" : "mismatch";
}

function compareBooleanAudit(current: boolean | null | undefined, audited: boolean | null | undefined) {
  if (audited === null || audited === undefined) {
    return "unknown";
  }
  if (current === null || current === undefined) {
    return "missing_current";
  }
  return current === audited ? "match" : "mismatch";
}

Deno.serve((request) =>
  withCors(request, async () => {
    await ensureAuthorized(request);

    const body = (await request.json().catch(() => ({}))) as AuditInput;
    const language = normalizeLanguage(body?.language);
    const ean = normalizeEan(body?.ean);
    const current = body?.current ?? {};
    const audit = await runAudit(language, { ...body, ean });

    const extracted = {
      ...audit.extracted,
      season: normalizeSeason(audit.extracted?.season),
      eu_label: {
        fuel_class: normalizeGrade(audit.extracted?.eu_label?.fuel_class),
        wet_grip_class: normalizeGrade(audit.extracted?.eu_label?.wet_grip_class),
        noise_db:
          audit.extracted?.eu_label?.noise_db !== null &&
          audit.extracted?.eu_label?.noise_db !== undefined &&
          Number.isFinite(Number(audit.extracted.eu_label.noise_db))
            ? Number(audit.extracted.eu_label.noise_db)
            : null,
        noise_class: normalizeNoiseClass(audit.extracted?.eu_label?.noise_class),
      },
    };
    const exactBadgeTexts = [extracted.brand, extracted.model, extracted.size_string];
    if (extracted.badges.runflat === null && inferBooleanFromText(exactBadgeTexts, [/\bRUN ?FLAT\b/, /\bRFT\b/, /\bROF\b/, /\bSSR\b/, /\bEMT\b/, /\bDSST\b/, /\bZP\b/, /\bRSC\b/])) {
      extracted.badges.runflat = true;
    }
    if (extracted.badges.xl === null && inferBooleanFromText(exactBadgeTexts, [/\bXL\b/, /\bEXTRA LOAD\b/, /\bREINFORCED\b/, /\bREINF\b/])) {
      extracted.badges.xl = true;
    }
    if (extracted.badges.threepmsf === null && inferBooleanFromText(exactBadgeTexts, [/\b3PMSF\b/, /\bTHREE PEAK\b/, /\bMOUNTAIN SNOWFLAKE\b/, /\bALPINE SYMBOL\b/])) {
      extracted.badges.threepmsf = true;
    }
    if (extracted.badges.winter_approved === null && (extracted.season === "winter" || inferBooleanFromText(exactBadgeTexts, [/\bM\+S\b/, /\bM&S\b/, /\bWINTER APPROVED\b/])) ) {
      extracted.badges.winter_approved = true;
    }
    if (extracted.badges.studded === null && inferBooleanFromText(exactBadgeTexts, [/\bSTUDDED\b/, /\bNASTA\b/])) {
      extracted.badges.studded = true;
    }
    extracted.badges.studded = forceFalseIfSummer(extracted.season, extracted.badges.studded);
    extracted.badges.threepmsf = forceFalseIfSummer(extracted.season, extracted.badges.threepmsf);
    extracted.badges.winter_approved = forceFalseIfSummer(extracted.season, extracted.badges.winter_approved);
    extracted.badges.ice_approved = forceFalseIfSummer(extracted.season, extracted.badges.ice_approved);
    const currentSizeParts = parseTireSizeParts(current.size_string);
    const auditedSizeParts = parseTireSizeParts(extracted.size_string);

    const checks = [
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

    const sourceUrls = Array.isArray(audit.source_urls)
      ? audit.source_urls.filter((url) => /^https?:\/\//i.test(String(url ?? ""))).slice(0, 6)
      : [];
    const confidence = scoreConfidence({
      ean,
      sourceUrls,
      brand: extracted.brand,
      model: extracted.model,
      sizeString: extracted.size_string,
    });

    return jsonResponse({
      ean,
      summary: String(audit.summary ?? "").trim(),
      confidence,
      source_urls: sourceUrls,
      extracted,
      checks,
    });
  }));
