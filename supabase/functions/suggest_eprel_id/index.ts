import { createClient } from "npm:@supabase/supabase-js@2";

type SupportedLanguage = "fi" | "en";

type SuggestInput = {
  ean?: string | null;
  brand?: string | null;
  model?: string | null;
  size_string?: string | null;
  language?: SupportedLanguage | null;
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

function getEnv(name: string, fallback?: string) {
  const value = Deno.env.get(name) ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
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

function normalizeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeEan(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function buildPrompt(input: SuggestInput, language: SupportedLanguage) {
  const ean = normalizeEan(input.ean);
  const brand = normalizeText(input.brand);
  const model = normalizeText(input.model);
  const size = normalizeText(input.size_string);
  const exactQuery = [brand, model, size, "EPREL"].filter(Boolean).join(" ");
  const exactQueryWithoutSize = [brand, model, "EPREL"].filter(Boolean).join(" ");
  const ficheQuery = [brand, model, size, "EPREL fiche"].filter(Boolean).join(" ");
  const qrQuery = [brand, model, size, "EPREL QR"].filter(Boolean).join(" ");

  return [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text:
            language === "fi"
              ? [
                  "Tehtäväsi on etsiä todennäköinen EPREL-rekisterinumero rengastuotteelle.",
                  "Käytä julkista verkkoa löytääksesi vain EPREL-julkisia sivuja, fiche-PDF:iä tai QR-linkkejä.",
                  "Etsi iteratiivisesti useilla täsmäkyselyillä, ei vain yhdellä yrityksellä.",
                  "Palauta EPREL-rekisterinumero vain jos voit yhdistää sen suoraan tähän renkaaseen julkisen lähteen perusteella.",
                  "Älä arvaa rekisterinumeroa. Jos et löydä luotettavaa EPREL-ID:tä, palauta status no_match.",
                  "Jos löydät useita uskottavia vaihtoehtoja, palauta status multiple_candidates.",
                  "Käytä EAN-, brand-, model- ja size-tietoja tunnistukseen.",
                  "Jos suora EAN-haku ei auta, painota täsmähakua muodossa brand + model + size + EPREL.",
                  "Jos löydät fiche-, QR- tai EPREL-tuotesivun, poimi rekisterinumero sieltä.",
                  "Jos näet jälleenmyyjän sivulla täsmälleen saman brand/model/size/load/speed yhdistelmän ja sivu viittaa EPREL-etikettiin tai ficheen, käytä sitä johtolankana etsiessäsi EPREL-lähdettä.",
                ].join(" ")
              : [
                  "Your task is to find the most likely EPREL registration number for a tire product.",
                  "Use the public web to find only EPREL public pages, fiche PDFs, or QR links.",
                  "Search iteratively with multiple exact queries instead of giving up after one weak search.",
                  "Return an EPREL registration number only if you can tie it directly to this tire from public evidence.",
                  "Do not guess a registration number. If you cannot find a reliable EPREL ID, return status no_match.",
                  "If you find multiple plausible options, return status multiple_candidates.",
                  "Use EAN, brand, model, and size as identification hints.",
                  "If direct EAN lookup is weak, prioritize exact brand + model + size + EPREL searches.",
                  "If you find a fiche PDF, QR link, or EPREL product page, extract the registration number from there.",
                  "If a retailer page shows the exact same brand/model/size/load/speed combination and references EPREL labels or fiche, use that as a clue to continue searching for the public EPREL source.",
                ].join(" "),
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: JSON.stringify(
            {
              product: {
                ean,
                brand,
                model,
                size_string: size,
              },
              suggested_search_queries: [
                exactQuery,
                exactQueryWithoutSize,
                ficheQuery,
                qrQuery,
                ean ? `${ean} EPREL` : null,
              ].filter(Boolean),
              output_rules: {
                return_json_only: true,
                json_shape: {
                  status: "matched | multiple_candidates | no_match",
                  summary: "string",
                  confidence: "low | medium | high",
                  suggested_registration_number: "string | null",
                  candidates: [
                    {
                      registration_number: "string",
                      reason: "string",
                      source_hint: "string",
                    },
                  ],
                },
              },
            },
            null,
            2,
          ),
        },
      ],
    },
  ];
}

function safeNoMatch(language: SupportedLanguage, summary?: string) {
  return {
    status: "no_match" as const,
    summary:
      summary ??
      (language === "fi"
        ? "AI ei löytänyt luotettavaa EPREL ID -ehdotusta."
        : "AI did not find a reliable EPREL ID suggestion."),
    confidence: "low" as const,
    suggested_registration_number: null,
    candidates: [] as Array<{
      registration_number: string;
      reason: string;
      source_hint: string;
    }>,
  };
}

function extractOutputText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = Array.isArray(payload?.output)
    ? payload.output.flatMap((item: any) =>
        Array.isArray(item?.content) ? item.content : [],
      )
    : [];

  const text = parts
    .map((part: any) => {
      if (typeof part === "string") return part;
      if (typeof part?.text === "string") return part.text;
      if (typeof part?.text?.value === "string") return part.text.value;
      if (typeof part?.output_text === "string") return part.output_text;
      if (typeof part?.content === "string") return part.content;
      return "";
    })
    .join("")
    .trim();

  return text || "";
}

Deno.serve((request) =>
  withCors(request, async () => {
    await ensureAuthorized(request);

    const body = (await request.json().catch(() => ({}))) as SuggestInput;
    const language = normalizeLanguage(body?.language);
    const brand = normalizeText(body?.brand);
    const model = normalizeText(body?.model);
    const sizeString = normalizeText(body?.size_string);

    if (!brand || !model) {
      throw new Error(language === "fi" ? "Brand ja model vaaditaan AI-ehdotusta varten." : "Brand and model are required for AI suggestion.");
    }

    const modelName = getEnv(
      "OPENAI_MODEL_EPREL_ID",
      Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano",
    );

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getEnv("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: modelName,
        tools: [{ type: "web_search_preview" }],
        input: buildPrompt(body, language),
        max_output_tokens: 700,
        text: {
          format: {
            type: "json_schema",
            name: "suggest_eprel_id",
            strict: true,
            schema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["matched", "multiple_candidates", "no_match"],
                },
                summary: { type: "string" },
                confidence: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                },
                suggested_registration_number: {
                  anyOf: [{ type: "string" }, { type: "null" }],
                },
                candidates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      registration_number: { type: "string" },
                      reason: { type: "string" },
                      source_hint: { type: "string" },
                    },
                    required: ["registration_number", "reason", "source_hint"],
                    additionalProperties: false,
                  },
                },
              },
              required: [
                "status",
                "summary",
                "confidence",
                "suggested_registration_number",
                "candidates",
              ],
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

    const outputText = extractOutputText(payload);

    if (!outputText) {
      return jsonResponse(safeNoMatch(language));
    }

    try {
      const parsed = JSON.parse(outputText) as {
        status: "matched" | "multiple_candidates" | "no_match";
        summary: string;
        confidence: "low" | "medium" | "high";
        suggested_registration_number: string | null;
        candidates: Array<{
          registration_number: string;
          reason: string;
          source_hint: string;
        }>;
      };

      return jsonResponse(parsed);
    } catch {
      return jsonResponse(
        safeNoMatch(
          language,
          language === "fi"
            ? "AI ei palauttanut jäsennettävää EPREL ID -ehdotusta."
            : "AI did not return a parseable EPREL ID suggestion.",
        ),
      );
    }
  }));
