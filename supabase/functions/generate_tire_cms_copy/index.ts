import { createClient } from "npm:@supabase/supabase-js@2";

type SupportedLanguage = "fi" | "en";
type TiresAiCopyField =
  | "title"
  | "subtitle"
  | "short_description"
  | "long_description"
  | "seo_slug"
  | "seo_title"
  | "seo_description";

type TireCopyContext = {
  variant_id?: string | null;
  brand?: string | null;
  model?: string | null;
  size_string?: string | null;
  season?: string | null;
  supplier_code_best?: string | null;
  studded?: boolean | null;
  runflat?: boolean | null;
  xl_reinforced?: boolean | null;
  ev_ready?: boolean | null;
  threepmsf?: boolean | null;
  winter_approved?: boolean | null;
  ice_approved?: boolean | null;
  eu_fuel?: string | null;
  eu_wet?: string | null;
  eu_noise?: number | null;
};

type CmsCopyInput = {
  title?: string | null;
  subtitle?: string | null;
  short_description?: string | null;
  long_description?: string | null;
  seo_slug?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
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

function normalizeField(value: unknown): TiresAiCopyField {
  const field = String(value ?? "").trim() as TiresAiCopyField;
  const allowedFields: TiresAiCopyField[] = [
    "title",
    "subtitle",
    "short_description",
    "long_description",
    "seo_slug",
    "seo_title",
    "seo_description",
  ];
  if (!allowedFields.includes(field)) {
    throw new Error("Invalid field");
  }
  return field;
}

function sanitizeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

function buildFieldInstructions(field: TiresAiCopyField, language: SupportedLanguage) {
  const fi = language === "fi";
  switch (field) {
    case "title":
      return fi
        ? "Kirjoita tiivis tuoteotsikko. Käytä brändiä ja mallia. Älä lisää keksittyjä väittämiä."
        : "Write a concise product title. Use the brand and model. Do not add invented claims.";
    case "subtitle":
      return fi
        ? "Kirjoita lyhyt alaotsikko, ensisijaisesti koko- ja luokitustiedoista. Pidä se yhtenä rivinä."
        : "Write a short subtitle focused on size and rating data. Keep it to one line.";
    case "short_description":
      return fi
        ? "Kirjoita 1-2 virkkeen lyhyt kuvaus verkkokauppaa varten. Korosta vain annettuja ominaisuuksia."
        : "Write a 1-2 sentence short ecommerce description. Highlight only provided attributes.";
    case "long_description":
      return fi
        ? "Kirjoita 2 lyhyttä kappaletta pitkäksi kuvaukseksi. Pidä sävy myyvä mutta täsmällinen."
        : "Write 2 short paragraphs for a longer description. Keep the tone commercial but precise.";
    case "seo_slug":
      return fi
        ? "Palauta vain selkeä URL-tunniste muodossa brand-model-size. Käytä vain pieniä ASCII-kirjaimia ja yhdysmerkkejä."
        : "Return only a clean URL slug in brand-model-size form. Use lowercase ASCII and hyphens only.";
    case "seo_title":
      return fi
        ? "Kirjoita hakukoneotsikko, noin 50-65 merkkiä. Sisällytä brändi, malli ja koko jos mahtuu."
        : "Write an SEO title, about 50-65 characters. Include brand, model, and size if they fit.";
    case "seo_description":
      return fi
        ? "Kirjoita hakukonekuvaus, noin 140-160 merkkiä. Tee siitä klikattava, mutta älä keksi faktoja."
        : "Write an SEO description, about 140-160 characters. Make it clickable, but do not invent facts.";
  }
}

function buildPrompt(
  field: TiresAiCopyField,
  language: SupportedLanguage,
  tire: TireCopyContext,
  cms: CmsCopyInput,
) {
  return [
    {
      role: "system",
      content:
        "You write accurate ecommerce copy for tire products sold by a Finnish automotive business. Use only the provided facts. Never invent pricing, warranties, stock, certifications, or performance claims. If a fact is missing, omit it.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Generate one field value for the tire CMS editor.",
          target_field: field,
          language,
          field_instructions: buildFieldInstructions(field, language),
          tire,
          existing_cms_values: cms,
          output_rules: {
            return_json: true,
            json_shape: { value: "string" },
            no_markdown: true,
            no_extra_keys: true,
          },
        },
        null,
        2,
      ),
    },
  ];
}

async function generateFieldValue(
  field: TiresAiCopyField,
  language: SupportedLanguage,
  tire: TireCopyContext,
  cms: CmsCopyInput,
) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getEnv("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model: getEnv("OPENAI_MODEL", "gpt-4.1-mini"),
      input: buildPrompt(field, language, tire, cms),
      max_output_tokens: field === "long_description" ? 520 : 220,
      text: {
        format: {
          type: "json_schema",
          name: "tire_cms_copy",
          strict: true,
          schema: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
            required: ["value"],
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
    throw new Error("AI returned an empty response");
  }

  const parsed = JSON.parse(outputText) as { value?: string };
  const rawValue = String(parsed?.value ?? "").trim();
  if (!rawValue) {
    throw new Error("AI returned an empty field value");
  }

  return field === "seo_slug" ? sanitizeSlug(rawValue) : rawValue;
}

Deno.serve((request) =>
  withCors(request, async () => {
    await ensureAuthorized(request);

    const body = await request.json().catch(() => ({}));
    const language = normalizeLanguage(body?.language);
    const field = normalizeField(body?.field);
    const tire = (body?.tire ?? {}) as TireCopyContext;
    const cms = (body?.cms ?? {}) as CmsCopyInput;

    const value = await generateFieldValue(field, language, tire, cms);
    return jsonResponse({ value, field });
  }));
