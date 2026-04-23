export const TYRE_LABEL_SECTION_TITLE = 'Tyre Label & Product Identity';

export interface TyreLabelIdentity {
  supplier_name: string | null;
  supplier_trademark: string | null;
  commercial_name: string | null;
  model: string | null;
  tyre_type_identifier: string | null;
  tyre_class: string | null;
  size_designation: string | null;
  width: number | null;
  aspect_ratio: number | null;
  diameter: number | null;
  load_index: string | null;
  speed_symbol: string | null;
  speed_kmh: number | null;
  load_version: string | null;
  ean: string | null;
  supplier_code: string | null;
  season: string | null;
}

export interface TyreEuLabelData {
  fuel_efficiency_class: string | null;
  wet_grip_class: string | null;
  external_noise_db: number | null;
  external_noise_class: string | null;
  severe_snow: boolean | null;
  severe_ice: boolean | null;
  eprel_registration_number: string | null;
  eprel_qr_url: string | null;
  eprel_sheet_url: string | null;
}

export interface TyreBadgeData {
  runflat: boolean | null;
  ev_ready: boolean | null;
  studded: boolean | null;
  extra_load: boolean | null;
  threepmsf: boolean | null;
  winter_approved: boolean | null;
}

export interface TyreComplianceData {
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
}

export interface TyreLabelSectionData {
  section_title: string;
  identity: TyreLabelIdentity;
  eu_label: TyreEuLabelData;
  badges: TyreBadgeData;
  compliance: TyreComplianceData;
}

export type PartialTyreLabelSectionData = Partial<{
  section_title: string;
  identity: Partial<TyreLabelIdentity>;
  eu_label: Partial<TyreEuLabelData>;
  badges: Partial<TyreBadgeData>;
  compliance: Partial<TyreComplianceData>;
}>;

interface ParsedTyreSizeParts {
  width: number | null;
  aspect_ratio: number | null;
  diameter: number | null;
}

export interface BuildTyreLabelSectionInput {
  existing?: PartialTyreLabelSectionData | null;
  brand?: string | null;
  supplierName?: string | null;
  commercialName?: string | null;
  model?: string | null;
  tyreTypeIdentifier?: string | null;
  sizeString?: string | null;
  widthMm?: number | null;
  aspectRatio?: number | null;
  diameterIn?: number | null;
  loadIndex?: string | number | null;
  speedRating?: string | null;
  season?: string | null;
  ean?: string | null;
  supplierCodeBest?: string | null;
  runflat?: boolean | null;
  xlReinforced?: boolean | null;
  evReady?: boolean | null;
  studded?: boolean | null;
  threepmsf?: boolean | null;
  winterApproved?: boolean | null;
  iceApproved?: boolean | null;
  euFuelClass?: string | null;
  euWetGripClass?: string | null;
  euNoiseDb?: number | null;
  euNoiseClass?: string | null;
  supplierWebsite?: string | null;
  supplierContactName?: string | null;
  supplierContactEmail?: string | null;
  supplierContactPhone?: string | null;
  dataSource?: string | null;
  dataSourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  productionStart?: string | null;
  productionEnd?: string | null;
  marketStart?: string | null;
}

const SPEED_RATING_KMH: Record<string, number> = {
  Q: 160,
  R: 170,
  S: 180,
  T: 190,
  H: 210,
  V: 240,
  W: 270,
  Y: 300,
  '(Y)': 300,
  ZR: 240,
};

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  return null;
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeEan(value: unknown): string | null {
  const text = normalizeText(value);
  if (!text) return null;
  const digits = text.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

function normalizeEuClass(value: unknown): string | null {
  const text = normalizeText(value);
  return text ? text.toUpperCase() : null;
}

function parseTyreSizeParts(sizeString?: string | null): ParsedTyreSizeParts {
  const normalized = String(sizeString ?? '').toUpperCase().replace(/\s+/g, '');
  if (!normalized) {
    return { width: null, aspect_ratio: null, diameter: null };
  }

  const match =
    normalized.match(/(\d{3})[/-]?(\d{2})(?:ZR|R)?(\d{2})/) ??
    normalized.match(/(\d{3})[/-](\d{2}).*?R(\d{2})/);

  if (!match) {
    return { width: null, aspect_ratio: null, diameter: null };
  }

  return {
    width: Number.parseInt(match[1], 10),
    aspect_ratio: Number.parseInt(match[2], 10),
    diameter: Number.parseInt(match[3], 10),
  };
}

function formatSizeDesignation(
  sizeString: string | null,
  width: number | null,
  aspectRatio: number | null,
  diameter: number | null,
): string | null {
  const raw = normalizeText(sizeString);
  if (raw) {
    return raw.replace(/\s+/g, ' ').trim();
  }

  if (width && aspectRatio && diameter) {
    return `${width}/${aspectRatio} R${diameter}`;
  }

  return null;
}

function getSpeedKmh(speedSymbol: string | null): number | null {
  if (!speedSymbol) return null;
  return SPEED_RATING_KMH[speedSymbol.toUpperCase()] ?? null;
}

function inferLoadVersion(
  existingValue: string | null,
  xlReinforced: boolean | null,
): string | null {
  if (existingValue) return existingValue;
  if (xlReinforced === true) return 'XL';
  return null;
}

export function buildTyreLabelSectionData(input: BuildTyreLabelSectionInput): TyreLabelSectionData {
  const existing = input.existing ?? {};
  const existingIdentity = existing.identity ?? {};
  const existingEuLabel = existing.eu_label ?? {};
  const existingBadges = existing.badges ?? {};
  const existingCompliance = existing.compliance ?? {};

  const parsedSize = parseTyreSizeParts(input.sizeString);
  const width = normalizeNumber(input.widthMm) ?? existingIdentity.width ?? parsedSize.width;
  const aspectRatio = normalizeNumber(input.aspectRatio) ?? existingIdentity.aspect_ratio ?? parsedSize.aspect_ratio;
  const diameter = normalizeNumber(input.diameterIn) ?? existingIdentity.diameter ?? parsedSize.diameter;
  const speedSymbol = normalizeText(input.speedRating)?.toUpperCase() ?? existingIdentity.speed_symbol ?? null;

  return {
    section_title: normalizeText(existing.section_title) ?? TYRE_LABEL_SECTION_TITLE,
    identity: {
      supplier_name:
        existingIdentity.supplier_name ??
        normalizeText(input.supplierName) ??
        normalizeText(input.brand) ??
        null,
      supplier_trademark:
        existingIdentity.supplier_trademark ??
        normalizeText(input.brand) ??
        null,
      commercial_name:
        existingIdentity.commercial_name ??
        normalizeText(input.commercialName) ??
        normalizeText(input.model) ??
        null,
      model: existingIdentity.model ?? normalizeText(input.model) ?? null,
      tyre_type_identifier:
        normalizeText(existingIdentity.tyre_type_identifier) ??
        normalizeText(input.tyreTypeIdentifier) ??
        null,
      tyre_class: existingIdentity.tyre_class ?? null,
      size_designation:
        existingIdentity.size_designation ??
        formatSizeDesignation(normalizeText(input.sizeString), width, aspectRatio, diameter) ??
        null,
      width,
      aspect_ratio: aspectRatio,
      diameter,
      load_index:
        existingIdentity.load_index ??
        normalizeText(input.loadIndex) ??
        null,
      speed_symbol: existingIdentity.speed_symbol ?? speedSymbol,
      speed_kmh: getSpeedKmh(speedSymbol) ?? existingIdentity.speed_kmh ?? null,
      load_version:
        existingIdentity.load_version !== undefined
          ? existingIdentity.load_version
          : inferLoadVersion(
              normalizeText(existingIdentity.load_version),
              normalizeBoolean(input.xlReinforced),
            ),
      ean: existingIdentity.ean ?? normalizeEan(input.ean) ?? null,
      supplier_code:
        existingIdentity.supplier_code ??
        normalizeText(input.supplierCodeBest) ??
        null,
      season: existingIdentity.season ?? normalizeText(input.season) ?? null,
    },
    eu_label: {
      fuel_efficiency_class:
        normalizeEuClass(input.euFuelClass) ??
        existingEuLabel.fuel_efficiency_class ??
        null,
      wet_grip_class:
        normalizeEuClass(input.euWetGripClass) ??
        existingEuLabel.wet_grip_class ??
        null,
      external_noise_db:
        normalizeNumber(input.euNoiseDb) ??
        existingEuLabel.external_noise_db ??
        null,
      external_noise_class:
        normalizeEuClass(input.euNoiseClass) ??
        existingEuLabel.external_noise_class ??
        null,
      severe_snow:
        normalizeBoolean(input.threepmsf) ??
        existingEuLabel.severe_snow ??
        null,
      severe_ice:
        normalizeBoolean(input.iceApproved) ??
        existingEuLabel.severe_ice ??
        null,
      eprel_registration_number:
        normalizeText(existingEuLabel.eprel_registration_number) ?? null,
      eprel_qr_url:
        normalizeText(existingEuLabel.eprel_qr_url) ?? null,
      eprel_sheet_url:
        normalizeText(existingEuLabel.eprel_sheet_url) ?? null,
    },
    badges: {
      runflat: normalizeBoolean(input.runflat) ?? existingBadges.runflat ?? null,
      ev_ready: normalizeBoolean(input.evReady) ?? existingBadges.ev_ready ?? null,
      studded: normalizeBoolean(input.studded) ?? existingBadges.studded ?? null,
      extra_load: normalizeBoolean(input.xlReinforced) ?? existingBadges.extra_load ?? null,
      threepmsf: normalizeBoolean(input.threepmsf) ?? existingBadges.threepmsf ?? null,
      winter_approved:
        normalizeBoolean(input.winterApproved) ??
        existingBadges.winter_approved ??
        null,
    },
    compliance: {
      production_start: normalizeText(existingCompliance.production_start) ?? normalizeText(input.productionStart) ?? null,
      production_end: normalizeText(existingCompliance.production_end) ?? normalizeText(input.productionEnd) ?? null,
      market_start: normalizeText(existingCompliance.market_start) ?? normalizeText(input.marketStart) ?? null,
      supplier_website: normalizeText(existingCompliance.supplier_website) ?? normalizeText(input.supplierWebsite) ?? null,
      supplier_contact_name:
        normalizeText(existingCompliance.supplier_contact_name) ?? normalizeText(input.supplierContactName) ?? null,
      supplier_contact_email:
        normalizeText(existingCompliance.supplier_contact_email) ?? normalizeText(input.supplierContactEmail) ?? null,
      supplier_contact_phone:
        normalizeText(existingCompliance.supplier_contact_phone) ?? normalizeText(input.supplierContactPhone) ?? null,
      data_source: normalizeText(existingCompliance.data_source) ?? normalizeText(input.dataSource) ?? null,
      data_source_url: normalizeText(existingCompliance.data_source_url) ?? normalizeText(input.dataSourceUrl) ?? null,
      last_verified_at: normalizeText(existingCompliance.last_verified_at) ?? normalizeText(input.lastVerifiedAt) ?? null,
    },
  };
}
