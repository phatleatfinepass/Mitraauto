import { createClient } from "npm:@supabase/supabase-js@2";

type SupportedLanguage = "fi" | "en";
type TiresAiCopyField =
  | "title"
  | "subtitle"
  | "short_description"
  | "long_description"
  | "seo_slug"
  | "seo_title"
  | "seo_description"
  | "all_fields";

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
    "all_fields",
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
        ? "Kirjoita luonnollinen ja hakukelpoinen tuoteotsikko. Sisällytä brändi, malli, koko, kuormitus- ja nopeusluokka sekä tärkeä badge kuten XL vain jos ne ovat tiedossa. Ei täytesanoja kuten 'laadukas'."
        : "Write a natural, search-friendly product title. Include brand, model, size, load index, speed rating, and an important badge like XL only when known. No filler words.";
    case "subtitle":
      return fi
        ? "Kirjoita yksi selkeä rivi tärkeimmistä teknisistä tiedoista. Priorisoi koko, XL/runflat jos totta, kausi sekä EU-arvot. Älä toista otsikkoa sellaisenaan."
        : "Write one clear line of the key technical facts. Prioritize size, XL/runflat if true, season, and EU ratings. Do not repeat the title verbatim.";
    case "short_description":
      return fi
        ? "Kirjoita 1-2 luonnollista virkettä verkkokauppaa varten. Kerro mitä rengas on ja mitkä tiedossa olevat ominaisuudet ovat tärkeimmät. Älä käytä geneerisiä markkinointifraaseja."
        : "Write a natural 1-2 sentence ecommerce summary. Say what the tire is and which known attributes matter most. Avoid generic marketing filler.";
    case "long_description":
      return fi
        ? "Kirjoita 2 lyhyttä kappaletta. Ensimmäinen kappale kuvaa tuotteen ydinkäyttöä ja rakennetta. Toinen kappale kuvaa vain tunnetut EU-arvot ja tekniset tiedot. Älä kirjoita väitteitä joita tiedot eivät tue. Kesärenkaasta ei saa kirjoittaa ympärivuotiseen ajoon sopivana."
        : "Write 2 short paragraphs. The first describes the tire's core use and construction. The second covers only known EU ratings and technical details. Do not add claims not supported by the data.";
    case "seo_slug":
      return fi
        ? "Palauta vain selkeä URL-tunniste muodossa brand-model-size. Käytä vain pieniä ASCII-kirjaimia ja yhdysmerkkejä."
        : "Return only a clean URL slug in brand-model-size form. Use lowercase ASCII and hyphens only.";
    case "seo_title":
      return fi
        ? "Kirjoita vahva hakukoneotsikko, noin 50-65 merkkiä. Sisällytä brändi, malli, koko, kuormitus/nopeusluokka ja kausi tai XL jos ne mahtuvat. Vältä geneerisiä sanoja kuten 'laadukas autonrengas'."
        : "Write a strong SEO title, about 50-65 characters. Include brand, model, size, load/speed rating, and season or XL if they fit. Avoid generic filler.";
    case "seo_description":
      return fi
        ? "Kirjoita tarkka hakukonekuvaus, noin 140-160 merkkiä. Kuvaile rengas, koko ja tärkeät tunnetut EU-arvot luonnollisella suomella. Ei klikkiotsikkomaista liioittelua."
        : "Write a precise SEO description, about 140-160 characters. Describe the tire, size, and known EU ratings in natural English. No hype or invented claims.";
    case "all_fields":
      return fi
        ? "Luo koko tuotesisältö- ja SEO-paketti yhdellä kertaa. Sisällön pitää olla luonnollista suomea, tarkkaa ja hakukelpoinen ilman geneeristä AI-tekstiä."
        : "Generate the full product content and SEO package in one pass. The copy must be natural, precise, and search-friendly without generic AI phrasing.";
  }
}

function buildPrompt(field: TiresAiCopyField, language: SupportedLanguage, tire: TireCopyContext, cms: CmsCopyInput) {
  return [
    {
      role: "system",
      content:
        "You write accurate ecommerce product copy for tires sold by a Finnish automotive business. Use only the provided facts. Never invent pricing, warranties, stock, certifications, compatibility, or performance claims. If a fact is missing, omit it. Avoid generic AI phrases, avoid repetition across fields, and prefer concise, native-sounding wording. For Finnish, write natural ecommerce Finnish and avoid literal English-style phrasing. For summer tires, never suggest year-round or winter suitability unless explicit facts support it.",
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

type BulkCopyOutput = {
  title: string;
  subtitle: string;
  short_description: string;
  long_description: string;
  seo_slug: string;
  seo_title: string;
  seo_description: string;
};

function buildAllFieldsPrompt(language: SupportedLanguage, tire: TireCopyContext, cms: CmsCopyInput) {
  const fi = language === "fi";
  return [
    {
      role: "system",
      content:
        "You write accurate ecommerce product copy for tires sold by a Finnish automotive business. Use only the provided facts. Never invent pricing, warranties, stock, certifications, compatibility, or performance claims. If a fact is missing, omit it. Avoid generic filler like 'quality tire', 'balanced performance', 'excellent choice', or similar. Ensure each field has a distinct job and does not just repeat another field. Finnish must sound natural to a native reader.",
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          task: "Generate the complete product content and SEO package for one tire.",
          language,
          writing_goals: fi
            ? [
                "Tuoteotsikko on selkeä, hakukelpoinen ja tarkka.",
                "Alaotsikko on yksi tiivis tekninen rivi.",
                "Lyhyt kuvaus kertoo tuotteen olennaisen arvon ilman täytesanoja.",
                "Pitkä kuvaus on 2 lyhyttä kappaletta, luonnollista suomea ja perustuu vain tiedossa oleviin faktoihin.",
                "SEO-otsikko on vahva mutta ei geneerinen.",
                "SEO-kuvaus on tarkka ja luonnollinen, noin 140-160 merkkiä.",
                "Kesärenkaasta ei saa kirjoittaa ympärivuotiseen käyttöön sopivana.",
              ]
            : [
                "The title is clear, precise, and search-friendly.",
                "The subtitle is one concise technical line.",
                "The short description explains the product without filler.",
                "The long description is 2 short paragraphs based only on known facts.",
                "The SEO title is strong but not generic.",
                "The SEO description is precise and natural, about 140-160 characters.",
              ],
          style_rules: fi
            ? [
                "Vältä fraaseja kuten 'laadukas rengas', 'erinomainen valinta', 'tasapainoinen suorituskyky'.",
                "Käytä kokoa muodossa esimerkiksi '205/45 R18 90Y XL'.",
                "Jos XL on totta, käsittele se vahvistettuna rakenteena tai XL-merkintänä, ei irrallisena myyntifraasina.",
                "EU-arvot saa mainita vain jos ne ovat annettuina tiedoissa.",
              ]
            : [
                "Avoid filler like 'quality tire', 'excellent choice', or 'balanced performance'.",
                "Use size formatting like '205/45 R18 90Y XL'.",
                "Mention EU ratings only when known.",
              ],
          tire,
          existing_cms_values: cms,
          output_rules: {
            return_json: true,
            no_markdown: true,
            no_extra_keys: true,
            json_shape: {
              title: "string",
              subtitle: "string",
              short_description: "string",
              long_description: "string",
              seo_slug: "string",
              seo_title: "string",
              seo_description: "string",
            },
          },
        },
        null,
        2,
      ),
    },
  ];
}

async function generateFieldValue(field: TiresAiCopyField, language: SupportedLanguage, tire: TireCopyContext, cms: CmsCopyInput) {
  const model = getEnv(
    "OPENAI_MODEL_COPY",
    Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano",
  );

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getEnv("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model,
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

async function generateAllFieldValues(
  language: SupportedLanguage,
  tire: TireCopyContext,
  cms: CmsCopyInput,
) {
  const model = getEnv(
    "OPENAI_MODEL_COPY",
    Deno.env.get("OPENAI_MODEL") ?? "gpt-5-nano",
  );

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getEnv("OPENAI_API_KEY")}`,
    },
    body: JSON.stringify({
      model,
      input: buildAllFieldsPrompt(language, tire, cms),
      max_output_tokens: 1100,
      text: {
        format: {
          type: "json_schema",
          name: "tire_cms_copy_all_fields",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              subtitle: { type: "string" },
              short_description: { type: "string" },
              long_description: { type: "string" },
              seo_slug: { type: "string" },
              seo_title: { type: "string" },
              seo_description: { type: "string" },
            },
            required: [
              "title",
              "subtitle",
              "short_description",
              "long_description",
              "seo_slug",
              "seo_title",
              "seo_description",
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

  const outputText = String(
    payload?.output_text ??
      payload?.output?.flatMap((item: any) => item?.content ?? [])?.map((part: any) => part?.text ?? "")?.join("") ??
      "",
  ).trim();
  if (!outputText) {
    throw new Error("AI returned an empty response");
  }

  const parsed = JSON.parse(outputText) as Partial<BulkCopyOutput>;
  const result: BulkCopyOutput = {
    title: String(parsed.title ?? "").trim(),
    subtitle: String(parsed.subtitle ?? "").trim(),
    short_description: String(parsed.short_description ?? "").trim(),
    long_description: String(parsed.long_description ?? "").trim(),
    seo_slug: sanitizeSlug(String(parsed.seo_slug ?? "").trim()),
    seo_title: String(parsed.seo_title ?? "").trim(),
    seo_description: String(parsed.seo_description ?? "").trim(),
  };

  for (const [key, value] of Object.entries(result)) {
    if (!value) {
      throw new Error(`AI returned an empty ${key}`);
    }
  }

  return result;
}

Deno.serve((request) =>
  withCors(request, async () => {
    await ensureAuthorized(request);

    const body = await request.json().catch(() => ({}));
    const language = normalizeLanguage(body?.language);
    const field = normalizeField(body?.field);
    const tire = (body?.tire ?? {}) as TireCopyContext;
    const cms = (body?.cms ?? {}) as CmsCopyInput;

    if (field === "all_fields") {
      const values = await generateAllFieldValues(language, tire, cms);
      return jsonResponse({ values, field });
    }

    const value = await generateFieldValue(field, language, tire, cms);
    return jsonResponse({ value, field });
  }));
