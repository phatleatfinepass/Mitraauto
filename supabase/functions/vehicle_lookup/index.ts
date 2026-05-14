import { createClient } from "npm:@supabase/supabase-js@2";

interface VehicleTyreLookupResult {
  plate: string;
  country?: string;
  vin?: string;
  description: string;
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  factoryTyreSize: string;
  factoryTyreSizes?: string[];
  maxWeightKg?: number | null;
  weightEmptyKg?: number | null;
  maxSpeedKmh?: number | null;
  powerKw?: number | null;
  engineSizeCc?: number | null;
  rimMounting?: VehicleRimMountingData | null;
  source: "carsxe" | "development-fallback";
  specifications?: Record<string, unknown>;
  lookups?: {
    plateDecoder: Record<string, unknown>;
    specifications: Record<string, unknown> | null;
    internationalVinDecoder: Record<string, unknown> | null;
  };
  warnings?: string[];
}

interface VehicleRimMountingData {
  pcd?: string | null;
  centerBoreMm?: number | null;
  offsetMinMm?: number | null;
  offsetMaxMm?: number | null;
  factoryOffsetMm?: number | null;
  factoryRimWidthIn?: number | null;
  boltThread?: string | null;
  boltSeat?: string | null;
  brakeClearanceNotes?: string | null;
  source?: "provider" | "development-fallback" | "cache" | null;
}

type VehicleLookupCacheRow = {
  vehicle: Record<string, unknown>;
  lookup_count: number;
  provider_fetched_at: string;
  expires_at: string;
};

type ProviderCallContext = {
  requestId: string;
  plateHash: string | null;
  plateHint: string;
  country: string;
  state: string;
  vin?: string | null;
};

const serviceSupabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const CACHE_TTL_DAYS = Math.max(
  1,
  Number(Deno.env.get("VEHICLE_LOOKUP_CACHE_TTL_DAYS") ?? "180") || 180,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEVELOPMENT_FIXTURES: Record<string, VehicleTyreLookupResult> = {
  "XJZ-140": {
    plate: "XJZ-140",
    vin: "TMAD381CADJ004071",
    description: "Hyundai i30 Kombi",
    make: "Hyundai",
    model: "i30 Kombi",
    year: "2013",
    variant: "Hyundai i30 Kombi 1.6 GDI Manuaalinen, 6 vaihdetta, 135ps, 2013",
    factoryTyreSize: "195/65 R15 91H",
    factoryTyreSizes: ["195/65 R15 91H"],
    rimMounting: {
      pcd: "5x114.3",
      centerBoreMm: 67.1,
      factoryOffsetMm: 48,
      offsetMinMm: 43,
      offsetMaxMm: 53,
      factoryRimWidthIn: 6,
      boltThread: "M12x1.5",
      boltSeat: "tapered",
      source: "development-fallback",
    },
    maxWeightKg: 1820,
    weightEmptyKg: 1298,
    maxSpeedKmh: 192,
    powerKw: 99,
    source: "development-fallback",
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const requestId = crypto.randomUUID();
    const body = await req.json().catch(() => ({}));
    const country = normalizeCountryCode(body?.country);
    const state = body?.state ? normalizeCountryCode(body.state) : country;
    const plate = normalizePlate(String(body?.plate ?? ""), country);
    if (!isValidPlate(plate, country)) {
      return jsonResponse({ error: "A valid license plate is required." }, 400);
    }

    const fixture = country === "FI" ? DEVELOPMENT_FIXTURES[plate] : null;
    const apiKey = Deno.env.get("CARSXE_API_KEY")?.trim();
    if (!apiKey || apiKey === "TODO" || apiKey === "TODO_SET_CARSXE_API_KEY") {
      if (fixture) {
        return jsonResponse({ vehicle: fixture, usingFixture: true });
      }
      return jsonResponse({
        error: "CarsXE is not configured. Set Supabase secret CARSXE_API_KEY.",
        missingSecret: "CARSXE_API_KEY",
      }, 503);
    }

    const cacheKey = await buildPlateCacheKey(plate, country);
    const providerContext: ProviderCallContext = {
      requestId,
      plateHash: cacheKey,
      plateHint: buildPlateHint(plate),
      country,
      state,
      vin: null,
    };
    const cachedVehicle = cacheKey
      ? await readCachedVehicle(cacheKey, plate)
      : null;
    if (cachedVehicle) {
      return jsonResponse({
        vehicle: cachedVehicle.vehicle,
        usingFixture: false,
        cache: {
          hit: true,
          requestId,
          providerFetchedAt: cachedVehicle.providerFetchedAt,
          expiresAt: cachedVehicle.expiresAt,
        },
      });
    }

    const vehicle = await lookupCarsXeVehicle(plate, apiKey, providerContext);
    if (cacheKey) {
      await writeCachedVehicle(cacheKey, plate, country, vehicle);
    }
    return jsonResponse({
      vehicle,
      usingFixture: false,
      cache: {
        hit: false,
        requestId,
      },
    });
  } catch (error) {
    console.error("Vehicle lookup failed:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Vehicle lookup failed",
    });
  }
});

async function lookupCarsXeVehicle(
  plate: string,
  apiKey: string,
  context: ProviderCallContext,
): Promise<VehicleTyreLookupResult> {
  const plateResponse = await callCarsXePlateLookup(plate, apiKey, context);
  const vin = firstString(plateResponse.vin, plateResponse.VIN);
  if (!vin) {
    throw new Error("CarsXE plate lookup did not return a VIN.");
  }
  context.vin = vin;

  let specificationsResponse: Record<string, unknown> | null = null;
  let internationalVinResponse: Record<string, unknown> | null = null;
  const warnings: string[] = [];

  try {
    internationalVinResponse = await callCarsXeInternationalVinLookup(
      vin,
      apiKey,
      context,
    );
  } catch (error) {
    warnings.push(
      `CarsXE international VIN lookup failed: ${errorMessage(error)}`,
    );
  }

  let attributes = readAttributes(internationalVinResponse);
  let factoryTyreSizes = parseFactoryTyreSizes(
    attributes.wheel_size,
    attributes.wheel_size_array,
    attributes.tire_size,
    attributes.tyre_size,
  );

  if (factoryTyreSizes.length === 0) {
    try {
      specificationsResponse = await callCarsXeSpecificationsLookup(
        vin,
        apiKey,
        context,
      );
      const specificationAttributes = readAttributes(specificationsResponse);
      attributes = {
        ...attributes,
        ...specificationAttributes,
      };
      factoryTyreSizes = parseFactoryTyreSizes(
        attributes.wheel_size,
        attributes.wheel_size_array,
        attributes.tire_size,
        attributes.tyre_size,
      );
    } catch (error) {
      warnings.push(
        `CarsXE specifications lookup failed: ${errorMessage(error)}`,
      );
    }
  }

  const factoryTyreSize = factoryTyreSizes[0] ?? "";
  if (!factoryTyreSize) {
    throw new Error(
      "CarsXE VIN/specification lookup succeeded, but no factory tyre size was returned.",
    );
  }
  const rimMounting = extractRimMountingData(
    attributes,
    plateResponse,
    internationalVinResponse,
    specificationsResponse,
  );

  const make = firstString(
    plateResponse.make,
    plateResponse.CarMake,
    attributes.make,
  );
  const model = firstString(
    plateResponse.model,
    plateResponse.CarModel,
    attributes.model,
  );
  return {
    plate,
    country: context.country,
    vin,
    description: firstString(
      plateResponse.description,
      plateResponse.Description,
      [make, model].filter(Boolean).join(" "),
      plate,
    ),
    make: make || undefined,
    model: model || undefined,
    year: firstString(
      plateResponse.registration_year,
      plateResponse.model_year,
      attributes.year,
      attributes.model_year,
    ) || undefined,
    variant: firstString(
      plateResponse.variant,
      plateResponse.Variant,
      attributes.variant,
      attributes.trim,
    ) || undefined,
    factoryTyreSize,
    factoryTyreSizes,
    maxWeightKg: numberOrNull(attributes.max_weight_kg),
    weightEmptyKg: numberOrNull(attributes.weight_empty_kg),
    maxSpeedKmh: numberOrNull(attributes.max_speed_kmh),
    powerKw: numberOrNull(plateResponse.power ?? plateResponse.Power),
    engineSizeCc: numberOrNull(
      plateResponse.engine_size ??
        plateResponse.EngineSize ??
        attributes.engine_size ??
        attributes.engine_size_cc,
    ),
    rimMounting,
    source: "carsxe",
    specifications: attributes,
    lookups: {
      plateDecoder: plateResponse,
      specifications: specificationsResponse,
      internationalVinDecoder: internationalVinResponse,
    },
    warnings,
  };
}

async function readCachedVehicle(cacheKey: string, plate: string) {
  const nowIso = new Date().toISOString();
  const { data, error } = await serviceSupabase
    .from("vehicle_lookup_cache")
    .select("vehicle, lookup_count, provider_fetched_at, expires_at")
    .eq("plate_hash", cacheKey)
    .is("deleted_at", null)
    .gt("expires_at", nowIso)
    .maybeSingle<VehicleLookupCacheRow>();

  if (error) {
    console.warn("Vehicle cache read failed:", error.message);
    return null;
  }
  if (!data?.vehicle) return null;

  const cachedVehicle = restoreCachedVehicle(data.vehicle, plate);
  const repairedVehicleForCache = sanitizeVehicleForCache(cachedVehicle);
  await serviceSupabase
    .from("vehicle_lookup_cache")
    .update({
      vehicle: repairedVehicleForCache,
      lookup_count: (data.lookup_count ?? 0) + 1,
      last_seen_at: nowIso,
    })
    .eq("plate_hash", cacheKey);

  return {
    vehicle: cachedVehicle,
    providerFetchedAt: data.provider_fetched_at,
    expiresAt: data.expires_at,
  };
}

async function writeCachedVehicle(
  cacheKey: string,
  plate: string,
  country: string,
  vehicle: VehicleTyreLookupResult,
) {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  const sanitizedVehicle = sanitizeVehicleForCache(vehicle);

  const { error } = await serviceSupabase
    .from("vehicle_lookup_cache")
    .upsert({
      plate_hash: cacheKey,
      normalized_plate_hint: buildPlateHint(plate),
      vin: vehicle.vin ?? null,
      vehicle: sanitizedVehicle,
      provider: vehicle.source,
      country,
      source_version: "vehicle_lookup:v2",
      lookup_count: 1,
      last_seen_at: now.toISOString(),
      provider_fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      deleted_at: null,
      gdpr_basis: "legitimate_interest_cache",
    }, {
      onConflict: "plate_hash",
    });

  if (error) {
    console.warn("Vehicle cache write failed:", error.message);
  }
}

async function callCarsXePlateLookup(
  plate: string,
  apiKey: string,
  context: ProviderCallContext,
): Promise<Record<string, unknown>> {
  const endpoint = Deno.env.get("CARSXE_PLATE_ENDPOINT")?.trim() ||
    "https://api.carsxe.com/platedecoder";
  const url = new URL(endpoint);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("plate", plate);
  url.searchParams.set("state", context.state);
  url.searchParams.set("country", context.country);

  return fetchCarsXeJson(url, apiKey, "plate_decoder", context);
}

async function callCarsXeSpecificationsLookup(
  vin: string,
  apiKey: string,
  context: ProviderCallContext,
): Promise<Record<string, unknown>> {
  const endpoint = Deno.env.get("CARSXE_SPECS_ENDPOINT")?.trim() ||
    "https://api.carsxe.com/specs";
  const url = new URL(endpoint);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vin", vin);

  return fetchCarsXeJson(url, apiKey, "specifications", context);
}

async function callCarsXeInternationalVinLookup(
  vin: string,
  apiKey: string,
  context: ProviderCallContext,
): Promise<Record<string, unknown>> {
  const endpoint = Deno.env.get("CARSXE_VIN_ENDPOINT")?.trim() ||
    "https://api.carsxe.com/v1/international-vin-decoder";
  const url = new URL(endpoint);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vin", vin);

  return fetchCarsXeJson(url, apiKey, "international_vin_decoder", context);
}

async function fetchCarsXeJson(
  url: URL,
  apiKey: string,
  endpointName: string,
  context: ProviderCallContext,
): Promise<Record<string, unknown>> {
  const startedAt = Date.now();
  let httpStatus: number | null = null;
  let success = false;
  let errorMessageValue: string | null = null;

  try {
    const response = await fetch(url.toString(), {
      headers: carsXeHeaders(apiKey),
    });
    httpStatus = response.status;
    if (!response.ok) {
      throw new Error(
        `CarsXE ${endpointName} lookup failed (${response.status}).`,
      );
    }

    const payload = await response.json();
    if (payload?.success === false) {
      throw new Error(
        firstString(payload.error, payload.message) ||
          `CarsXE ${endpointName} lookup failed.`,
      );
    }
    success = true;
    return payload;
  } catch (error) {
    errorMessageValue = errorMessage(error);
    throw error;
  } finally {
    await recordProviderCall({
      context,
      endpointName,
      url,
      httpStatus,
      success,
      errorMessage: errorMessageValue,
      durationMs: Date.now() - startedAt,
    });
  }
}

async function recordProviderCall(input: {
  context: ProviderCallContext;
  endpointName: string;
  url: URL;
  httpStatus: number | null;
  success: boolean;
  errorMessage: string | null;
  durationMs: number;
}) {
  const sanitizedUrl = sanitizeProviderUrl(input.url);
  const { error } = await serviceSupabase
    .from("vehicle_lookup_provider_audit")
    .insert({
      request_id: input.context.requestId,
      plate_hash: input.context.plateHash,
      normalized_plate_hint: input.context.plateHint,
      vin: input.context.vin ?? input.url.searchParams.get("vin"),
      provider: "carsxe",
      endpoint_name: input.endpointName,
      endpoint_url: sanitizedUrl,
      http_status: input.httpStatus,
      success: input.success,
      error_message: input.errorMessage,
      duration_ms: Math.round(input.durationMs),
      cache_hit: false,
    });

  if (error) {
    console.warn("Vehicle provider audit write failed:", error.message);
  }
}

function sanitizeProviderUrl(url: URL) {
  const sanitized = new URL(url.toString());
  if (sanitized.searchParams.has("key")) {
    sanitized.searchParams.set("key", "[redacted]");
  }
  if (sanitized.searchParams.has("plate")) {
    sanitized.searchParams.set("plate", "[redacted]");
  }
  return sanitized.toString();
}

function readAttributes(payload: Record<string, unknown> | null) {
  return (payload?.attributes ?? payload?.Attributes ?? {}) as Record<
    string,
    unknown
  >;
}

function carsXeHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey,
  };
}

function normalizeCountryCode(value: unknown) {
  const normalized = String(value ?? "FI").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  return normalized || "FI";
}

function normalizePlate(value: string, country: string) {
  if (country === "FI") {
    return normalizeFinnishPlate(value);
  }
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12);
}

function normalizeFinnishPlate(value: string) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, 3)}-${compact.slice(3)}`;
}

function isValidPlate(plate: string, country: string) {
  const compact = plate.replace(/[^A-Z0-9]/g, "");
  if (country === "FI") {
    return compact.length >= 6;
  }
  return compact.length >= 2;
}

function normalizeFactoryTyreSize(value: string) {
  return parseFactoryTyreSizes(value)[0] ??
    String(value ?? "").trim().toUpperCase();
}

function parseFactoryTyreSizes(...values: unknown[]) {
  const found: string[] = [];
  const seen = new Set<string>();

  for (
    const value of values.flatMap((item) => Array.isArray(item) ? item : [item])
  ) {
    const raw = String(value ?? "").trim().toUpperCase();
    if (!raw) continue;

    for (
      const match of raw.matchAll(
        /\b(\d{3})\s*\/\s*(\d{2})\s*R\s*(\d{2})(?:\s*(\d{2,3})([A-Z]))?/g,
      )
    ) {
      const normalized = formatTyreSizeMatch(match);
      const key = normalized.replace(/\s+/g, "");
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(normalized);
    }
  }

  return found;
}

function extractRimMountingData(
  ...sources: Array<Record<string, unknown> | null>
): VehicleRimMountingData | null {
  const source = mergeObjects(...sources);
  const wheelText = firstString(
    findFirstValue(source, [
      "wheel_size",
      "wheel_sizes",
      "rim_size",
      "rim_sizes",
      "factory_wheel_size",
      "factory_rim_size",
    ]),
  );
  const parsedWheel = parseWheelMountingText(wheelText);

  const pcd = normalizePcd(firstString(
    findFirstValue(source, [
      "pcd",
      "wheel_pcd",
      "bolt_pattern",
      "boltpattern",
      "lug_pattern",
      "lugpattern",
      "bolt_circle",
      "bolt_circle_mm",
    ]),
    parsedWheel.pcd,
  ));
  const centerBoreMm = numberOrNull(
    findFirstValue(source, [
      "center_bore",
      "center_bore_mm",
      "centre_bore",
      "centre_bore_mm",
      "hub_bore",
      "hub_bore_mm",
      "cb",
    ]),
  );
  const factoryOffsetMm = numberOrNull(
    findFirstValue(source, [
      "factory_offset",
      "factory_offset_mm",
      "offset",
      "offset_mm",
      "wheel_offset",
      "rim_offset",
      "et",
      "et_offset",
      "et_offset_mm",
    ]),
  ) ?? parsedWheel.factoryOffsetMm;
  const explicitOffsetMin = numberOrNull(
    findFirstValue(source, [
      "offset_min",
      "offset_min_mm",
      "et_min",
      "et_min_mm",
      "min_offset",
    ]),
  );
  const explicitOffsetMax = numberOrNull(
    findFirstValue(source, [
      "offset_max",
      "offset_max_mm",
      "et_max",
      "et_max_mm",
      "max_offset",
    ]),
  );
  const factoryRimWidthIn = numberOrNull(
    findFirstValue(source, [
      "factory_rim_width",
      "factory_rim_width_in",
      "rim_width",
      "rim_width_in",
      "wheel_width",
      "wheel_width_in",
    ]),
  ) ?? parsedWheel.factoryRimWidthIn;
  const boltThread = firstString(findFirstValue(source, [
    "bolt_thread",
    "bolt_thread_size",
    "lug_thread",
    "lug_nut_thread",
    "thread_size",
    "fastener_thread",
  ])) || null;
  const boltSeat = firstString(findFirstValue(source, [
    "bolt_seat",
    "lug_seat",
    "seat_type",
    "fastener_seat",
  ])) || null;
  const brakeClearanceNotes = firstString(findFirstValue(source, [
    "brake_clearance",
    "brake_clearance_notes",
    "brake_notes",
    "caliper_clearance",
    "caliper_notes",
  ])) || null;

  const offsetMinMm = explicitOffsetMin ?? (factoryOffsetMm !== null ? factoryOffsetMm - 5 : null);
  const offsetMaxMm = explicitOffsetMax ?? (factoryOffsetMm !== null ? factoryOffsetMm + 5 : null);
  const hasMountingData = Boolean(
    pcd ||
      centerBoreMm !== null ||
      factoryOffsetMm !== null ||
      explicitOffsetMin !== null ||
      explicitOffsetMax !== null ||
      factoryRimWidthIn !== null ||
      boltThread ||
      boltSeat ||
      brakeClearanceNotes,
  );

  if (!hasMountingData) return null;

  return {
    pcd,
    centerBoreMm,
    offsetMinMm,
    offsetMaxMm,
    factoryOffsetMm,
    factoryRimWidthIn,
    boltThread,
    boltSeat,
    brakeClearanceNotes,
    source: "provider",
  };
}

function mergeObjects(...sources: Array<Record<string, unknown> | null>) {
  const merged: Record<string, unknown> = {};
  for (const source of sources) {
    flattenObject(source, merged);
  }
  return merged;
}

function flattenObject(value: unknown, target: Record<string, unknown>, prefix = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenObject(item, target, `${prefix}${index}_`));
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = normalizeFieldKey(key);
    const fullKey = `${prefix}${normalizedKey}`;
    if (child === null || child === undefined || child === "") continue;
    if (typeof child === "object") {
      flattenObject(child, target, `${fullKey}_`);
      continue;
    }
    target[fullKey] = child;
    target[normalizedKey] ??= child;
  }
}

function findFirstValue(source: Record<string, unknown>, keys: string[]) {
  const normalizedKeys = keys.map(normalizeFieldKey);
  for (const key of normalizedKeys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  for (const [sourceKey, value] of Object.entries(source)) {
    if (value === undefined || value === null || value === "") continue;
    if (normalizedKeys.some((key) => sourceKey.endsWith(`_${key}`))) {
      return value;
    }
  }
  return null;
}

function normalizeFieldKey(value: string) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseWheelMountingText(value: string) {
  const text = value.trim();
  const widthMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:j|x|×)/i);
  const etMatch = text.match(/\b(?:et|offset)\s*(-?\d+(?:[.,]\d+)?)/i);
  const pcdMatch = text.match(/\b(\d)\s*[x×]\s*(\d{2,3}(?:[.,]\d+)?)\b/i);

  return {
    factoryRimWidthIn: widthMatch ? numberOrNull(widthMatch[1].replace(",", ".")) : null,
    factoryOffsetMm: etMatch ? numberOrNull(etMatch[1].replace(",", ".")) : null,
    pcd: pcdMatch ? `${pcdMatch[1]}x${pcdMatch[2].replace(",", ".")}` : null,
  };
}

function normalizePcd(value: string) {
  const text = value.trim();
  if (!text) return null;
  const match = text.match(/(\d)\s*[x×]\s*(\d{2,3}(?:[.,]\d+)?)/i);
  if (!match) return text.replace(/\s+/g, "").replace("×", "x").replace(",", ".").toLowerCase();
  return `${match[1]}x${match[2].replace(",", ".")}`;
}

function formatTyreSizeMatch(match: RegExpMatchArray) {
  const [, width, aspect, rim, loadIndex, speedRating] = match;
  return `${width}/${aspect} R${rim}${
    loadIndex && speedRating ? ` ${loadIndex}${speedRating}` : ""
  }`;
}

async function buildPlateCacheKey(plate: string, country: string) {
  const pepper = Deno.env.get("VEHICLE_LOOKUP_CACHE_PEPPER")?.trim();
  if (!pepper) {
    console.warn(
      "Vehicle cache disabled: VEHICLE_LOOKUP_CACHE_PEPPER is missing.",
    );
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${country}:${plate}`),
  );
  return Array.from(new Uint8Array(signature)).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function buildPlateHint(plate: string) {
  const suffix = plate.replace(/[^A-Z0-9]/g, "").slice(-3);
  return `***-${suffix}`;
}

function sanitizeVehicleForCache(vehicle: VehicleTyreLookupResult) {
  const cloned = deepClone(vehicle as unknown as Record<string, unknown>);
  delete cloned.plate;

  const lookups = cloned.lookups as Record<string, unknown> | undefined;
  if (lookups?.plateDecoder && typeof lookups.plateDecoder === "object") {
    lookups.plateDecoder = removePlateFields(
      lookups.plateDecoder as Record<string, unknown>,
    );
  }

  return cloned;
}

function restoreCachedVehicle(
  cachedVehicle: Record<string, unknown>,
  plate: string,
): VehicleTyreLookupResult {
  const restored = {
    ...(deepClone(cachedVehicle) as unknown as VehicleTyreLookupResult),
    plate,
  };
  restored.factoryTyreSizes = parseFactoryTyreSizes(
    restored.factoryTyreSizes,
    restored.specifications?.wheel_size,
    restored.specifications?.wheel_size_array,
    restored.factoryTyreSize,
  );
  restored.factoryTyreSize = restored.factoryTyreSizes[0] ??
    normalizeFactoryTyreSize(restored.factoryTyreSize);
  if (!restored.rimMounting) {
    const repairedMounting = extractRimMountingData(
      restored.specifications ?? null,
      restored.lookups?.plateDecoder ?? null,
      restored.lookups?.internationalVinDecoder ?? null,
      restored.lookups?.specifications ?? null,
    );
    restored.rimMounting = repairedMounting ? { ...repairedMounting, source: "cache" } : null;
  }
  return restored;
}

function removePlateFields(value: Record<string, unknown>) {
  const cloned = deepClone(value) as Record<string, unknown>;
  for (const key of Object.keys(cloned)) {
    if (key.toLowerCase().includes("plate")) {
      delete cloned[key];
      continue;
    }

    const child = cloned[key];
    if (Array.isArray(child)) {
      cloned[key] = child.map((item) => {
        if (item && typeof item === "object") {
          return removePlateFields(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (child && typeof child === "object") {
      cloned[key] = removePlateFields(child as Record<string, unknown>);
    }
  }
  return cloned;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : String(value);
}
