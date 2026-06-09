import { getSupabaseConfigError, supabase } from './supabase/client';
import type { ProductPricingRules } from './pricing';
import type { TyreLabelSectionData } from './tyreLabel';

export type ProductSearchRow = {
  variant_id: string;
  product_type: 'tire' | 'rim';
  brand: string;
  brand_display_name: string | null;
  brand_logo_url: string | null;
  model: string;
  size_string: string | null;
  season: string | null;
  tire_segment?: string | null;
  studded: boolean | null;
  runflat: boolean | null;
  xl_reinforced: boolean | null;
  load_index?: string | number | null;
  speed_rating?: string | null;
  speed_index?: string | null;
  ev_ready?: boolean | null;
  sound_absorber?: boolean | null;
  threepmsf?: boolean | null;
  winter_approved?: boolean | null;
  ice_approved?: boolean | null;
  width_mm?: number | null;
  aspect_ratio?: number | null;
  diameter_in?: number | null;
  width_in: number | null;
  rim_diameter_in: number | null;
  et_offset_mm: number | null;
  bolt_pattern: string | null;
  color: string | null;
  finish: string | null;
  center_bore_mm?: number | null;
  cb_mm?: number | null;
  material?: string | null;
  bolts_included?: boolean | null;
  wheel_load_kg?: number | null;
  price: number | null;
  final_price_eur?: number | null;
  currency: string | null;
  in_stock: boolean;
  stock_qty: number | null;
  delivery_days_min?: number | null;
  delivery_days_max?: number | null;
  supplier_code_best?: string | null;
  best_image_url: string | null;
  hero_image_url?: string | null;
  gallery?: string[] | null;
  best_image_alt: string | null;
  card_title: string | null;
  title?: string | null;
  subtitle: string | null;
  short_description?: string | null;
  long_description?: string | null;
  tags: string[] | null;
  generated_tags?: string[] | null;
  seo_slug: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  eu_label_json?: any;
  eu_fuel?: string | null;
  eu_wet?: string | null;
  eu_noise?: number | null;
  final_is_hidden?: boolean | null;
  product_ready?: boolean | null;
  ean?: string | null;
  derived_ean?: string | null;
  manufacture_year?: number | null;
  pricing_rules?: ProductPricingRules | null;
  spec_overrides?: Record<string, unknown> | null;
  tyre_label_section?: TyreLabelSectionData;
};

export type ProductLocaleContent = {
  title_fi?: string | null;
  subtitle_fi?: string | null;
  short_description_fi?: string | null;
  long_description_fi?: string | null;
  seo_slug_fi?: string | null;
  seo_title_fi?: string | null;
  seo_description_fi?: string | null;
  title_en?: string | null;
  subtitle_en?: string | null;
  short_description_en?: string | null;
  long_description_en?: string | null;
  seo_slug_en?: string | null;
  seo_title_en?: string | null;
  seo_description_en?: string | null;
};

const PRODUCT_SEARCH_BASE_SELECT = [
  'variant_id',
  'product_type',
  'brand',
  'brand_display_name',
  'brand_logo_url',
  'model',
  'size_string',
  'season',
  'studded',
  'runflat',
  'xl_reinforced',
  'load_index',
  'speed_rating',
  'speed_index',
  'ev_ready',
  'threepmsf',
  'winter_approved',
  'ice_approved',
  'width_mm',
  'aspect_ratio',
  'diameter_in',
  'width_in',
  'rim_diameter_in',
  'et_offset_mm',
  'bolt_pattern',
  'color',
  'finish',
  'price',
  'final_price_eur',
  'currency',
  'in_stock',
  'stock_qty',
  'delivery_days_min',
  'delivery_days_max',
  'supplier_code_best',
  'best_image_url',
  'hero_image_url',
  'best_image_alt',
  'card_title',
  'subtitle',
  'short_description',
  'long_description',
  'tags',
  'seo_slug',
  'eu_label_json',
  'eu_wet',
  'eu_noise',
  'final_is_hidden',
  'ean',
  'derived_ean',
].join(',');

const WEBSHOP_TIRE_PUBLIC_SELECT = [
  PRODUCT_SEARCH_BASE_SELECT.replace(',final_is_hidden', ''),
  'tire_segment',
  'sound_absorber',
  'gallery',
  'manufacture_year',
  'is_visible',
  'publish_status',
  'product_ready',
].join(',');

const WEBSHOP_RIM_PUBLIC_SELECT = [
  PRODUCT_SEARCH_BASE_SELECT.replace(',final_is_hidden', ''),
  'gallery',
  'center_bore_mm',
  'cb_mm',
  'material',
  'bolts_included',
  'wheel_load_kg',
  'manufacture_year',
  'is_visible',
  'publish_status',
].join(',');

interface FetchOptions {
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

const PUBLIC_CATALOG_MAX_LIMIT = 100;
const PUBLIC_CATALOG_MAX_OFFSET = 2400;

type FitmentSizeFilter = {
  sizeKey?: string;
  widthMm: number;
  aspectRatio: number;
  rimDiameterIn: number;
};

function parseTireSize(sizeString: string | null): { width?: number; aspect?: number; diameter?: number } {
  if (!sizeString) return {};
  const normalized = sizeString.toUpperCase().replace(/\s+/g, '');
  const match =
    normalized.match(/(\d{3})[\/-]?(\d{2})(?:ZR|R)?(\d{2})/) ??
    normalized.match(/(\d{3})[\/-](\d{2}).*?R(\d{2})/);
  if (!match) return {};
  return {
    width: Number.parseInt(match[1], 10),
    aspect: Number.parseInt(match[2], 10),
    diameter: Number.parseInt(match[3], 10),
  };
}

function parseFloatOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getFitmentSizeFilters(filters: Record<string, any>): FitmentSizeFilter[] {
  if (!Array.isArray(filters.fitmentSizes)) return [];

  const byKey = new Map<string, FitmentSizeFilter>();
  filters.fitmentSizes.forEach((rawSize: any) => {
    const widthMm = Number(rawSize?.widthMm ?? rawSize?.width ?? rawSize?.width_mm);
    const aspectRatio = Number(rawSize?.aspectRatio ?? rawSize?.aspect ?? rawSize?.aspect_ratio);
    const rimDiameterIn = Number(rawSize?.rimDiameterIn ?? rawSize?.diameter ?? rawSize?.diameter_in);
    if (!Number.isFinite(widthMm) || !Number.isFinite(aspectRatio) || !Number.isFinite(rimDiameterIn)) return;

    const sizeKey = String(rawSize?.sizeKey ?? `${widthMm}/${aspectRatio}R${rimDiameterIn}`);
    if (!byKey.has(sizeKey)) {
      byKey.set(sizeKey, { sizeKey, widthMm, aspectRatio, rimDiameterIn });
    }
  });

  return Array.from(byKey.values());
}

function rowMatchesFitmentSize(row: ProductSearchRow, fitmentSize: FitmentSizeFilter): boolean {
  const parsedSize = parseTireSize(row.size_string);
  const width = parseFloatOrNull((row as any).width_mm) ?? parsedSize.width ?? null;
  const aspect = parseFloatOrNull((row as any).aspect_ratio) ?? parsedSize.aspect ?? null;
  const diameter = parseFloatOrNull((row as any).diameter_in) ?? parsedSize.diameter ?? null;

  return width === fitmentSize.widthMm &&
    aspect === fitmentSize.aspectRatio &&
    diameter === fitmentSize.rimDiameterIn;
}

function normalizeSeasonValue(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function getSeasonFilterValues(value: unknown): string[] {
  const normalized = normalizeSeasonValue(value);
  if (!normalized || normalized === 'all') return [];
  if (normalized === 'all_season' || normalized === 'allseason') {
    return ['all_season', 'all season', 'all-season', 'allseason'];
  }
  return [normalized];
}

function getTireVehicleTypeFilter(filters: Record<string, any>): string | null {
  const value = String(filters.vehicleType ?? filters.tireSegment ?? '').trim().toLowerCase();
  return value && value !== 'all' ? value : null;
}

function isAllSeasonFilter(value: unknown): boolean {
  const normalized = normalizeSeasonValue(value);
  return normalized === 'all_season' || normalized === 'allseason';
}

function isRetreadedTire(row: ProductSearchRow): boolean {
  const blob = [
    row.brand,
    row.brand_display_name,
    row.model,
    row.size_string,
    row.card_title,
    row.subtitle,
    row.seo_slug,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return blob.includes('pinnoitettu') || blob.includes('pinoitettu');
}

function isSoundAbsorberTire(row: ProductSearchRow): boolean {
  if (row.sound_absorber) return true;
  const blob = [
    row.brand,
    row.brand_display_name,
    row.model,
    row.size_string,
    row.card_title,
    row.subtitle,
    row.short_description,
    row.long_description,
    row.seo_slug,
    Array.isArray(row.tags) ? row.tags.join(' ') : '',
    row.eu_label_json ? JSON.stringify(row.eu_label_json) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /sound|absorber|acoustic|silent|foam|contisilent|pncs|silentdrive|sponge|noise[ -]?reduc|b[ -]?silent|k[ -]?silent/.test(blob);
}

function isElectricCarTire(row: ProductSearchRow): boolean {
  if (row.ev_ready) return true;
  const blob = [
    row.brand,
    row.brand_display_name,
    row.model,
    row.size_string,
    row.card_title,
    row.subtitle,
    row.short_description,
    row.long_description,
    row.seo_slug,
    Array.isArray(row.tags) ? row.tags.join(' ') : '',
    row.eu_label_json ? JSON.stringify(row.eu_label_json) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return /(^|[^a-z0-9])(ev|e[.]v[.])([^a-z0-9]|$)|electric|elect/.test(blob);
}

function matchesTireFilters(row: ProductSearchRow, filters: Record<string, any>): boolean {
  const selectedBrands = Array.isArray(filters.brand)
    ? filters.brand
        .map((brand: unknown) => String(brand ?? '').trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (selectedBrands.length > 0) {
    const rowBrands = [
      row.brand,
      row.brand_display_name,
    ]
      .map((brand) => String(brand ?? '').trim().toLowerCase())
      .filter(Boolean);
    if (!rowBrands.some((brand) => selectedBrands.includes(brand))) {
      return false;
    }
  }

  const eanFilter = String(filters.ean ?? '').replace(/\D/g, '');
  if (eanFilter) {
    const rowEan = String((row as any).ean ?? (row as any).derived_ean ?? '').replace(/\D/g, '');
    if (!rowEan.includes(eanFilter)) return false;
  }

  if (filters.search) {
    const q = String(filters.search).toLowerCase().trim();
    if (q) {
      const blob = `${row.brand} ${row.model} ${row.size_string ?? ''} ${row.card_title ?? ''}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
  }

  const parsedSize = parseTireSize(row.size_string);
  const width = parseFloatOrNull((row as any).width_mm) ?? parsedSize.width ?? null;
  const aspect = parseFloatOrNull((row as any).aspect_ratio) ?? parsedSize.aspect ?? null;
  const diameter = parseFloatOrNull((row as any).diameter_in) ?? parsedSize.diameter ?? null;

  const fitmentSizes = getFitmentSizeFilters(filters);
  if (fitmentSizes.length > 0) {
    if (!fitmentSizes.some((fitmentSize) => (
      width === fitmentSize.widthMm &&
      aspect === fitmentSize.aspectRatio &&
      diameter === fitmentSize.rimDiameterIn
    ))) {
      return false;
    }
  } else {
    if (filters.width && filters.width !== 'all' && Number(filters.width) !== width) return false;
    if (filters.aspectRatio && filters.aspectRatio !== 'all' && Number(filters.aspectRatio) !== aspect) return false;
    if (filters.diameter && filters.diameter !== 'all' && Number(filters.diameter) !== diameter) return false;
  }

  const seasonFilterValues = getSeasonFilterValues(filters.season);
  if (seasonFilterValues.length > 0 && !seasonFilterValues.includes(normalizeSeasonValue(row.season))) {
    return false;
  }

  const vehicleType = getTireVehicleTypeFilter(filters);
  if (vehicleType && String(row.tire_segment ?? '').trim().toLowerCase() !== vehicleType) {
    return false;
  }

  if (filters.runflat && !row.runflat) return false;
  if (filters.xl && !row.xl_reinforced) return false;
  if (filters.studded && !row.studded) return false;
  if (filters.electricCar && !isElectricCarTire(row)) return false;
  if (filters.soundAbsorber && !isSoundAbsorberTire(row)) return false;
  if (filters.inStockOnly && !row.in_stock) return false;
  if (!filters.includeRetreaded && isRetreadedTire(row)) return false;

  return true;
}

function matchesRimFilters(row: ProductSearchRow, filters: Record<string, any>): boolean {
  if (filters.search) {
    const q = String(filters.search).toLowerCase().trim();
    if (q) {
      const blob = `${row.brand} ${row.model} ${row.size_string ?? ''} ${row.card_title ?? ''}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
  }

  const rimDiameter = parseFloatOrNull(row.rim_diameter_in);
  const rimWidth = parseFloatOrNull(row.width_in);
  const etOffset = parseFloatOrNull(row.et_offset_mm);
  const centerBore = parseFloatOrNull((row as any).cb_mm ?? (row as any).center_bore_mm);
  const pcd = String(row.bolt_pattern ?? '').replace(/\s+/g, '').toLowerCase().replace('×', 'x');

  if (filters.rimDiameter && filters.rimDiameter !== 'all' && Number(filters.rimDiameter) !== rimDiameter) return false;
  if (filters.rimWidth && filters.rimWidth !== 'all' && Number(filters.rimWidth) !== rimWidth) return false;
  if (filters.pcd && filters.pcd !== 'all') {
    const expectedPcd = String(filters.pcd).replace(/\s+/g, '').toLowerCase().replace('×', 'x');
    if (pcd !== expectedPcd) return false;
  }
  if (filters.etOffset !== '' && filters.etOffset !== null && filters.etOffset !== undefined) {
    if (etOffset === null || Number(filters.etOffset) !== etOffset) return false;
  }
  if (filters.cb !== '' && filters.cb !== null && filters.cb !== undefined) {
    if (centerBore === null || Number(filters.cb) !== centerBore) return false;
  }
  if (filters.color && filters.color !== 'all' && String(row.color ?? '').toLowerCase() !== String(filters.color).toLowerCase()) return false;
  if (filters.inStockOnly && !row.in_stock) return false;

  return true;
}

function applySort(rows: ProductSearchRow[], sortBy: string | undefined): ProductSearchRow[] {
  const list = [...rows];
  const getEffectivePrice = (row: ProductSearchRow) => {
    const finalPrice = parseFloatOrNull(row.final_price_eur);
    return finalPrice ?? parseFloatOrNull(row.price) ?? 0;
  };

  switch (sortBy) {
    case 'price_desc':
      return list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    case 'price_asc':
      return list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    case 'wet_grip':
      return list.sort((a, b) => String(a.eu_wet ?? 'Z').localeCompare(String(b.eu_wet ?? 'Z')));
    case 'noise':
      return list.sort((a, b) => (a.eu_noise ?? 999) - (b.eu_noise ?? 999));
    case 'brand_asc':
      return list.sort((a, b) =>
        String(a.brand ?? '').localeCompare(String(b.brand ?? '')) ||
        String(a.model ?? '').localeCompare(String(b.model ?? '')) ||
        String(a.variant_id ?? '').localeCompare(String(b.variant_id ?? ''))
      );
    default:
      return list.sort((a, b) =>
        String(a.brand ?? '').localeCompare(String(b.brand ?? '')) ||
        String(a.model ?? '').localeCompare(String(b.model ?? '')) ||
        String(a.variant_id ?? '').localeCompare(String(b.variant_id ?? ''))
      );
  }
}

function normalizeOverlayPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeSearchTerm(value: unknown) {
  return String(value ?? '').trim();
}

function isRecoverableAuthError(error: unknown) {
  const message = String((error as any)?.message ?? error ?? '').toLowerCase();
  return (
    message.includes('jwt') ||
    message.includes('auth') ||
    message.includes('refresh token') ||
    message.includes('session') ||
    message.includes('invalid token') ||
    message.includes('token') ||
    message.includes('not authenticated')
  );
}

function isStatementTimeoutError(error: unknown) {
  const code = String((error as any)?.code ?? '');
  const message = String((error as any)?.message ?? error ?? '').toLowerCase();
  return code === '57014' || message.includes('statement timeout');
}

async function fetchTireCatalogRpcByFitmentSizes(
  limit: number,
  offset: number,
  filters: Record<string, any>,
  fitmentSizes: FitmentSizeFilter[],
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const sizeOrFilter = fitmentSizes
    .map((fitmentSize) => `and(width_mm.eq.${fitmentSize.widthMm},aspect_ratio.eq.${fitmentSize.aspectRatio},diameter_in.eq.${fitmentSize.rimDiameterIn})`)
    .join(',');

  const buildQuery = (withCount: boolean) => {
    let query = supabase
      .from('webshop_items')
      .select(WEBSHOP_TIRE_PUBLIC_SELECT, withCount ? { count: 'estimated' } : undefined)
      .eq('product_type', 'tire')
      .eq('is_visible', true)
      .eq('publish_status', 'published')
      .eq('product_ready', true)
      .or(sizeOrFilter);

    const normalizedSearch = normalizeSearchTerm(filters.search);
    if (normalizedSearch) {
      query = query.or([
        `brand.ilike.%${normalizedSearch}%`,
        `brand_display_name.ilike.%${normalizedSearch}%`,
        `model.ilike.%${normalizedSearch}%`,
        `size_string.ilike.%${normalizedSearch}%`,
        `card_title.ilike.%${normalizedSearch}%`,
      ].join(','));
    }

    const brands = Array.isArray(filters.brand)
      ? filters.brand.map((brand: unknown) => String(brand ?? '').trim()).filter(Boolean)
      : [];
    if (brands.length > 0) query = query.in('brand', brands);

    const seasonFilterValues = getSeasonFilterValues(filters.season);
    if (seasonFilterValues.length === 1) query = query.eq('season', seasonFilterValues[0]);
    if (seasonFilterValues.length > 1) query = query.in('season', seasonFilterValues);

    const vehicleType = getTireVehicleTypeFilter(filters);
    if (vehicleType) query = query.eq('tire_segment', vehicleType);

    if (filters.ean) {
      const ean = String(filters.ean).replace(/\D/g, '');
      if (ean) query = query.or(`ean.ilike.%${ean}%,derived_ean.ilike.%${ean}%`);
    }
    if (filters.runflat) query = query.eq('runflat', true);
    if (filters.xl) query = query.eq('xl_reinforced', true);
    if (filters.studded) query = query.eq('studded', true);
    if (filters.electricCar) query = query.eq('ev_ready', true);
    if (filters.soundAbsorber) query = query.eq('sound_absorber', true);
    if (filters.inStockOnly) query = query.eq('in_stock', true);

    switch (filters.sortBy) {
      case 'price_desc':
        query = query.order('final_price_eur', { ascending: false, nullsFirst: false }).order('price', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
        query = query.order('final_price_eur', { ascending: true, nullsFirst: false }).order('price', { ascending: true, nullsFirst: false });
        break;
      case 'wet_grip':
        query = query.order('eu_wet', { ascending: true, nullsFirst: false }).order('brand', { ascending: true }).order('model', { ascending: true });
        break;
      case 'noise':
        query = query.order('eu_noise', { ascending: true, nullsFirst: false }).order('brand', { ascending: true }).order('model', { ascending: true });
        break;
      default:
        query = query.order('brand', { ascending: true }).order('model', { ascending: true }).order('variant_id', { ascending: true });
        break;
    }

    return query.range(offset, offset + limit - 1);
  };

  let { data, error, count } = await buildQuery(true);
  if (error && isStatementTimeoutError(error)) {
    const retry = await buildQuery(false);
    data = retry.data;
    error = retry.error;
    count = null;
  }
  if (error) throw error;

  const rows = ((data ?? []) as ProductSearchRow[])
    .map((row) => ({ ...row, pricing_rules: null, final_is_hidden: false }))
    .filter((row) => matchesTireFilters(row, filters));

  return { items: rows, total: count ?? (rows.length === limit ? offset + rows.length + 1 : offset + rows.length) };
}

async function fetchTireCatalogRpc(
  limit: number,
  offset: number,
  filters: Record<string, any>,
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const fitmentSizes = getFitmentSizeFilters(filters);
  if (fitmentSizes.length > 0) {
    return fetchTireCatalogRpcByFitmentSizes(limit, offset, filters, fitmentSizes);
  }

  const width =
    filters.width && filters.width !== 'all' ? Number(filters.width) : null;
  const brands =
    Array.isArray(filters.brand) && filters.brand.length > 0
      ? filters.brand
          .map((brand: unknown) => String(brand ?? '').trim())
          .filter((brand: string) => brand.length > 0)
      : null;
  const aspectRatio =
    filters.aspectRatio && filters.aspectRatio !== 'all' ? Number(filters.aspectRatio) : null;
  const diameter =
    filters.diameter && filters.diameter !== 'all' ? Number(filters.diameter) : null;
  const season =
    filters.season && filters.season !== 'all' ? normalizeSeasonValue(filters.season) : null;
  const search = normalizeSearchTerm(filters.search) || null;
  const ean = String(filters.ean ?? '').replace(/\D/g, '') || null;
  const sortBy =
    typeof filters.sortBy === 'string' && filters.sortBy.length > 0 ? filters.sortBy : 'brand_asc';
  const includeRetreaded = Boolean(filters.includeRetreaded);
  const tireSegment = getTireVehicleTypeFilter(filters);

  const listArgs = {
    p_search: search,
    p_brands: brands,
    p_width: width,
    p_aspect_ratio: aspectRatio,
    p_diameter: diameter,
    p_season: season,
    p_ean: ean,
    p_runflat: Boolean(filters.runflat),
    p_xl: Boolean(filters.xl),
    p_studded: Boolean(filters.studded),
    p_in_stock: Boolean(filters.inStockOnly),
    p_include_retreaded: includeRetreaded,
    p_ev_ready: Boolean(filters.electricCar),
    p_sound_absorber: Boolean(filters.soundAbsorber),
    p_tire_segment: tireSegment,
    p_sort_by: sortBy,
    p_limit: limit,
    p_offset: offset,
  };

  const countArgs = {
    p_search: search,
    p_brands: brands,
    p_width: width,
    p_aspect_ratio: aspectRatio,
    p_diameter: diameter,
    p_season: season,
    p_ean: ean,
    p_runflat: Boolean(filters.runflat),
    p_xl: Boolean(filters.xl),
    p_studded: Boolean(filters.studded),
    p_in_stock: Boolean(filters.inStockOnly),
    p_include_retreaded: includeRetreaded,
    p_ev_ready: Boolean(filters.electricCar),
    p_sound_absorber: Boolean(filters.soundAbsorber),
    p_tire_segment: tireSegment,
  };

  let [{ data: rows, error: listError }, { data: countValue, error: countError }] = await Promise.all([
    supabase.rpc('catalog_list_tires_v1', listArgs),
    supabase.rpc('catalog_count_tires_v1', countArgs),
  ]);

  const shouldRetryWithoutRetreadParam =
    (listError || countError) &&
    String(listError?.message ?? countError?.message ?? '').toLowerCase().includes('p_include_retreaded');
  const shouldRetryWithoutEanParam =
    (listError || countError) &&
    String(listError?.message ?? countError?.message ?? '').toLowerCase().includes('p_ean');
  const shouldRetryWithoutEvSoundParams =
    (listError || countError) &&
    /p_ev_ready|p_sound_absorber/.test(String(listError?.message ?? countError?.message ?? '').toLowerCase());
  const shouldRetryWithoutVehicleTypeParam =
    (listError || countError) &&
    String(listError?.message ?? countError?.message ?? '').toLowerCase().includes('p_tire_segment');

  if (shouldRetryWithoutRetreadParam || shouldRetryWithoutEanParam || shouldRetryWithoutEvSoundParams || shouldRetryWithoutVehicleTypeParam) {
    const [{ data: retryRows, error: retryListError }, { data: retryCountValue, error: retryCountError }] = await Promise.all([
      supabase.rpc('catalog_list_tires_v1', {
      p_search: search,
      p_brands: brands,
      p_width: width,
      p_aspect_ratio: aspectRatio,
      p_diameter: diameter,
      p_season: season,
      p_runflat: Boolean(filters.runflat),
      p_xl: Boolean(filters.xl),
      p_studded: Boolean(filters.studded),
      p_in_stock: Boolean(filters.inStockOnly),
      p_sort_by: sortBy,
      p_limit: limit,
      p_offset: offset,
      }),
      supabase.rpc('catalog_count_tires_v1', {
      p_search: search,
      p_brands: brands,
      p_width: width,
      p_aspect_ratio: aspectRatio,
      p_diameter: diameter,
      p_season: season,
      p_runflat: Boolean(filters.runflat),
      p_xl: Boolean(filters.xl),
      p_studded: Boolean(filters.studded),
      p_in_stock: Boolean(filters.inStockOnly),
      }),
    ]);
    rows = retryRows;
    listError = retryListError;
    countValue = retryCountValue;
    countError = retryCountError;
  }

  if (listError) throw listError;
  if (countError && !isStatementTimeoutError(countError)) throw countError;

  let enrichedRows = ((rows ?? []) as ProductSearchRow[]).map((row) => ({
    ...row,
    pricing_rules: null,
    final_is_hidden: false,
  }));

  const variantIds = enrichedRows
    .map((row) => row.variant_id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (variantIds.length > 0 && enrichedRows.some((row) => row.manufacture_year === undefined)) {
    const { data: dotRows, error: dotRowsError } = await supabase
      .from('webshop_items')
      .select('variant_id,manufacture_year')
      .in('variant_id', variantIds);

    if (!dotRowsError) {
      const dotYearByVariantId = new Map(
        ((dotRows ?? []) as any[]).map((row) => [row.variant_id, row.manufacture_year]),
      );
      enrichedRows = enrichedRows.map((row) => ({
        ...row,
        manufacture_year: dotYearByVariantId.get(row.variant_id) ?? row.manufacture_year ?? null,
      }));
    } else {
      console.warn('Failed to enrich tire DOT years:', dotRowsError);
    }
  }

  const items = enrichedRows
    .filter((row) => includeRetreaded || !isRetreadedTire(row))
    .filter((row) => !tireSegment || String(row.tire_segment ?? '').trim().toLowerCase() === tireSegment)
    .filter((row) => {
      if (!ean) return true;
      const rowEan = String((row as any).ean ?? (row as any).derived_ean ?? '').replace(/\D/g, '');
      return rowEan.includes(ean);
    });

  return {
    items,
    total:
      countError && isStatementTimeoutError(countError)
        ? (items.length === limit ? offset + items.length + 1 : offset + items.length)
        : (shouldRetryWithoutRetreadParam || shouldRetryWithoutEanParam || shouldRetryWithoutVehicleTypeParam) && (!includeRetreaded || ean || tireSegment)
          ? items.length
          : Number(countValue ?? items.length),
  };
}

async function fetchTireCatalogPublishedFallback(
  limit: number,
  offset: number,
  filters: Record<string, any>,
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const buildQuery = (useSafeOrder = false) => {
    let query = supabase
      .from('webshop_items')
      .select(WEBSHOP_TIRE_PUBLIC_SELECT)
      .eq('product_type', 'tire')
      .eq('is_visible', true)
      .eq('publish_status', 'published')
      .eq('product_ready', true);

    const search = normalizeSearchTerm(filters.search);
    if (search) {
      query = query.or([
        `brand.ilike.%${search}%`,
        `brand_display_name.ilike.%${search}%`,
        `model.ilike.%${search}%`,
        `size_string.ilike.%${search}%`,
        `card_title.ilike.%${search}%`,
        `ean.ilike.%${search}%`,
        `derived_ean.ilike.%${search}%`,
      ].join(','));
    }

    if (Array.isArray(filters.brand) && filters.brand.length > 0) {
      query = query.in('brand', filters.brand.map((brand: unknown) => String(brand ?? '').trim()).filter(Boolean));
    }
    if (filters.width && filters.width !== 'all') query = query.eq('width_mm', Number(filters.width));
    if (filters.aspectRatio && filters.aspectRatio !== 'all') query = query.eq('aspect_ratio', Number(filters.aspectRatio));
    if (filters.diameter && filters.diameter !== 'all') query = query.eq('diameter_in', Number(filters.diameter));

    const seasonFilterValues = getSeasonFilterValues(filters.season);
    if (seasonFilterValues.length === 1) query = query.eq('season', seasonFilterValues[0]);
    if (seasonFilterValues.length > 1) query = query.in('season', seasonFilterValues);

    const vehicleType = getTireVehicleTypeFilter(filters);
    if (vehicleType) query = query.eq('tire_segment', vehicleType);

    if (filters.ean) {
      const ean = String(filters.ean).replace(/\D/g, '');
      if (ean) query = query.or(`ean.ilike.%${ean}%,derived_ean.ilike.%${ean}%`);
    }
    if (filters.runflat) query = query.eq('runflat', true);
    if (filters.xl) query = query.eq('xl_reinforced', true);
    if (filters.studded) query = query.eq('studded', true);
    if (filters.electricCar) query = query.eq('ev_ready', true);
    if (filters.soundAbsorber) query = query.eq('sound_absorber', true);
    if (filters.inStockOnly) query = query.eq('in_stock', true);

    if (useSafeOrder) {
      query = query.order('variant_id', { ascending: true });
    } else {
      switch (filters.sortBy) {
        case 'price_desc':
          query = query.order('final_price_eur', { ascending: false, nullsFirst: false }).order('price', { ascending: false, nullsFirst: false });
          break;
        case 'price_asc':
          query = query.order('final_price_eur', { ascending: true, nullsFirst: false }).order('price', { ascending: true, nullsFirst: false });
          break;
        case 'wet_grip':
          query = query.order('eu_wet', { ascending: true, nullsFirst: false }).order('brand', { ascending: true }).order('model', { ascending: true });
          break;
        case 'noise':
          query = query.order('eu_noise', { ascending: true, nullsFirst: false }).order('brand', { ascending: true }).order('model', { ascending: true });
          break;
        default:
          query = query.order('brand_display_name', { ascending: true }).order('brand', { ascending: true }).order('model', { ascending: true }).order('variant_id', { ascending: true });
          break;
      }
    }

    return query.range(offset, offset + limit - 1);
  };

  const firstResult = await buildQuery(false);
  let rows: ProductSearchRow[] = [];
  let usedSafeOrderFallback = false;

  if (firstResult.error && !isStatementTimeoutError(firstResult.error)) {
    throw firstResult.error;
  }

  if (firstResult.error && isStatementTimeoutError(firstResult.error)) {
    const safeOrderResult = await buildQuery(true);
    if (safeOrderResult.error) throw safeOrderResult.error;
    rows = (safeOrderResult.data ?? []) as ProductSearchRow[];
    usedSafeOrderFallback = true;
  } else {
    rows = (firstResult.data ?? []) as ProductSearchRow[];
  }

  let items = rows.map((row) => ({
    ...row,
    product_type: 'tire' as const,
    final_is_hidden: false,
    pricing_rules: null,
  })).filter((row) => matchesTireFilters(row, filters));

  if (usedSafeOrderFallback) {
    items = applySort(items, filters.sortBy);
  }

  return {
    items,
    total: items.length === limit ? offset + items.length + 1 : offset + items.length,
  };
}

async function fetchRimCatalogRpc(
  limit: number,
  offset: number,
  filters: Record<string, any>,
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const search = normalizeSearchTerm(filters.search) || null;
  const brands =
    Array.isArray(filters.brand) && filters.brand.length > 0
      ? filters.brand
          .map((brand: unknown) => String(brand ?? '').trim())
          .filter((brand: string) => brand.length > 0)
      : typeof filters.brand === 'string' && filters.brand !== 'all'
        ? [filters.brand.trim()].filter(Boolean)
        : null;
  const diameter = filters.rimDiameter && filters.rimDiameter !== 'all' ? Number(filters.rimDiameter) : null;
  const width = filters.rimWidth && filters.rimWidth !== 'all' ? Number(filters.rimWidth) : null;
  const widths = Array.isArray(filters.rimWidths)
    ? filters.rimWidths
        .map((value: unknown) => Number(value))
        .filter((value: number) => Number.isFinite(value))
    : null;
  const pcd = filters.pcd && filters.pcd !== 'all' ? String(filters.pcd) : null;
  const etOffset = filters.etOffset !== '' && filters.etOffset !== null && filters.etOffset !== undefined
    ? Number(filters.etOffset)
    : null;
  const centerBoreMin = filters.cb !== '' && filters.cb !== null && filters.cb !== undefined
    ? Number(filters.cb)
    : null;
  const color = filters.color && filters.color !== 'all' ? String(filters.color) : null;
  const material = filters.material && filters.material !== 'all' ? String(filters.material) : null;
  const boltsIncluded =
    typeof filters.boltsIncluded === 'boolean' ? Boolean(filters.boltsIncluded) : null;
  const sortBy =
    typeof filters.sortBy === 'string' && filters.sortBy.length > 0 ? filters.sortBy : 'price_asc';

  const listArgs = {
    p_search: search,
    p_brands: brands,
    p_diameter: Number.isFinite(diameter) ? diameter : null,
    p_width: Number.isFinite(width) ? width : null,
    p_widths: widths && widths.length > 0 ? widths : null,
    p_pcd: pcd,
    p_et_offset: Number.isFinite(etOffset) ? etOffset : null,
    p_center_bore_min: Number.isFinite(centerBoreMin) ? centerBoreMin : null,
    p_color: color,
    p_material: material,
    p_bolts_included: boltsIncluded,
    p_in_stock: Boolean(filters.inStockOnly),
    p_sort_by: sortBy,
    p_limit: limit,
    p_offset: offset,
  };

  const countArgs = {
    p_search: listArgs.p_search,
    p_brands: listArgs.p_brands,
    p_diameter: listArgs.p_diameter,
    p_width: listArgs.p_width,
    p_widths: listArgs.p_widths,
    p_pcd: listArgs.p_pcd,
    p_et_offset: listArgs.p_et_offset,
    p_center_bore_min: listArgs.p_center_bore_min,
    p_color: listArgs.p_color,
    p_material: listArgs.p_material,
    p_bolts_included: listArgs.p_bolts_included,
    p_in_stock: listArgs.p_in_stock,
  };

  const [{ data: rows, error: listError }, { data: countValue, error: countError }] = await Promise.all([
    supabase.rpc('catalog_list_rims_v1', listArgs),
    supabase.rpc('catalog_count_rims_v1', countArgs),
  ]);

  if (listError) throw listError;
  if (countError && !isStatementTimeoutError(countError)) throw countError;

  const itemRows = ((rows ?? []) as ProductSearchRow[]).map((row) => ({
    ...row,
    product_type: 'rim',
    final_is_hidden: false,
  }));

  return {
    items: itemRows,
    total: countError && isStatementTimeoutError(countError)
      ? (itemRows.length === limit ? offset + itemRows.length + 1 : offset + itemRows.length)
      : Number(countValue ?? itemRows.length),
  };
}

async function fetchRimCatalogPublishedFallback(
  limit: number,
  offset: number,
  filters: Record<string, any>,
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const buildQuery = (useSafeOrder = false) => {
    let query = supabase
      .from('webshop_items')
      .select(WEBSHOP_RIM_PUBLIC_SELECT)
      .eq('product_type', 'rim')
      .eq('is_visible', true)
      .eq('publish_status', 'published')
      .eq('product_ready', true);

    const search = normalizeSearchTerm(filters.search);
    if (search) {
      query = query.or([
        `brand.ilike.%${search}%`,
        `brand_display_name.ilike.%${search}%`,
        `model.ilike.%${search}%`,
        `size_string.ilike.%${search}%`,
        `card_title.ilike.%${search}%`,
        `color.ilike.%${search}%`,
        `ean.ilike.%${search}%`,
        `derived_ean.ilike.%${search}%`,
      ].join(','));
    }

    if (Array.isArray(filters.brand) && filters.brand.length > 0) {
      query = query.in('brand_display_name', filters.brand);
    } else if (filters.brand && filters.brand !== 'all') {
      query = query.eq('brand_display_name', String(filters.brand));
    }

    if (filters.rimDiameter && filters.rimDiameter !== 'all') query = query.eq('rim_diameter_in', Number(filters.rimDiameter));
    if (filters.rimWidth && filters.rimWidth !== 'all') query = query.eq('width_in', Number(filters.rimWidth));
    if (Array.isArray(filters.rimWidths) && filters.rimWidths.length > 0) {
      query = query.in('width_in', filters.rimWidths.map((value: unknown) => Number(value)).filter(Number.isFinite));
    }
    if (filters.pcd && filters.pcd !== 'all') query = query.eq('bolt_pattern', filters.pcd);
    if (filters.etOffset !== '' && filters.etOffset !== null && filters.etOffset !== undefined) {
      query = query.eq('et_offset_mm', Number(filters.etOffset));
    }
    if (filters.color && filters.color !== 'all') query = query.ilike('color', String(filters.color));
    if (filters.material && filters.material !== 'all') query = query.ilike('material', String(filters.material));
    if (typeof filters.boltsIncluded === 'boolean') query = query.eq('bolts_included', filters.boltsIncluded);
    if (filters.inStockOnly) query = query.eq('in_stock', true);

    if (useSafeOrder) {
      query = query.order('variant_id', { ascending: true });
    } else {
      switch (filters.sortBy) {
        case 'price_desc':
          query = query.order('final_price_eur', { ascending: false, nullsFirst: false }).order('price', { ascending: false, nullsFirst: false });
          break;
        case 'brand_desc':
          query = query.order('brand_display_name', { ascending: false }).order('brand', { ascending: false }).order('model', { ascending: false }).order('variant_id', { ascending: true });
          break;
        case 'brand_asc':
          query = query.order('brand_display_name', { ascending: true }).order('brand', { ascending: true }).order('model', { ascending: true }).order('variant_id', { ascending: true });
          break;
        case 'price_asc':
        default:
          query = query.order('final_price_eur', { ascending: true, nullsFirst: false }).order('price', { ascending: true, nullsFirst: false });
          break;
      }
    }

    return query.range(offset, offset + limit - 1);
  };

  const firstResult = await buildQuery(false);
  let rows: ProductSearchRow[] = [];
  let usedSafeOrderFallback = false;

  if (firstResult.error && !isStatementTimeoutError(firstResult.error)) {
    throw firstResult.error;
  }

  if (firstResult.error && isStatementTimeoutError(firstResult.error)) {
    const safeOrderResult = await buildQuery(true);
    if (safeOrderResult.error) throw safeOrderResult.error;
    rows = (safeOrderResult.data ?? []) as ProductSearchRow[];
    usedSafeOrderFallback = true;
  } else {
    rows = (firstResult.data ?? []) as ProductSearchRow[];
  }

  let items = rows.map((row) => ({
    ...row,
    product_type: 'rim' as const,
    final_is_hidden: false,
    pricing_rules: null,
  })).filter((row) => matchesRimFilters(row, filters));

  if (usedSafeOrderFallback) {
    items = applySort(items, filters.sortBy);
  }

  return {
    items,
    total: items.length === limit ? offset + items.length + 1 : offset + items.length,
  };
}

async function fetchAllSeasonTireProducts(
  limit: number,
  offset: number,
  filters: Record<string, any>,
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const allSeasonSearch = [
    'model.ilike.%allseason%',
    'model.ilike.%all season%',
    'model.ilike.%all-season%',
    'model.ilike.%4season%',
    'model.ilike.%4seasons%',
    'model.ilike.%multiseason%',
    'card_title.ilike.%allseason%',
    'card_title.ilike.%all season%',
    'card_title.ilike.%all-season%',
    'card_title.ilike.%4season%',
    'card_title.ilike.%4seasons%',
    'card_title.ilike.%multiseason%',
  ].join(',');

  const buildQuery = (withCount: boolean) => {
    let query = supabase
      .from('webshop_items')
      .select(WEBSHOP_TIRE_PUBLIC_SELECT, withCount ? { count: 'estimated' } : undefined)
      .eq('product_type', 'tire')
      .eq('is_visible', true)
      .eq('publish_status', 'published')
      .eq('product_ready', true)
      .or(allSeasonSearch);

    if (filters.search) {
      const q = String(filters.search).trim();
      if (q) {
        query = query.or([
          `brand.ilike.%${q}%`,
          `brand_display_name.ilike.%${q}%`,
          `model.ilike.%${q}%`,
          `size_string.ilike.%${q}%`,
          `card_title.ilike.%${q}%`,
        ].join(','));
      }
    }

    if (filters.width && filters.width !== 'all') query = query.eq('width_mm', Number(filters.width));
    if (filters.aspectRatio && filters.aspectRatio !== 'all') query = query.eq('aspect_ratio', Number(filters.aspectRatio));
    if (filters.diameter && filters.diameter !== 'all') query = query.eq('diameter_in', Number(filters.diameter));

    const vehicleType = getTireVehicleTypeFilter(filters);
    if (vehicleType) query = query.eq('tire_segment', vehicleType);

    if (filters.ean) {
      const ean = String(filters.ean).replace(/\D/g, '');
      if (ean) query = query.or(`ean.ilike.%${ean}%,derived_ean.ilike.%${ean}%`);
    }
    if (filters.runflat) query = query.eq('runflat', true);
    if (filters.xl) query = query.eq('xl_reinforced', true);
    if (filters.studded) query = query.eq('studded', true);
    if (filters.electricCar) query = query.eq('ev_ready', true);
    if (filters.soundAbsorber) query = query.eq('sound_absorber', true);
    if (filters.inStockOnly) query = query.eq('in_stock', true);

    switch (filters.sortBy) {
      case 'price_desc':
        query = query.order('final_price_eur', { ascending: false, nullsFirst: false }).order('price', { ascending: false, nullsFirst: false });
        break;
      case 'price_asc':
        query = query.order('final_price_eur', { ascending: true, nullsFirst: false }).order('price', { ascending: true, nullsFirst: false });
        break;
      default:
        query = query.order('brand', { ascending: true }).order('model', { ascending: true }).order('variant_id', { ascending: true });
        break;
    }

    return query.range(offset, offset + limit - 1);
  };

  const { data, error, count } = await buildQuery(true);
  if (error) throw error;

  const rows = ((data ?? []) as ProductSearchRow[])
    .map((row) => ({ ...row, pricing_rules: null, final_is_hidden: false }))
    .filter((row) => matchesTireFilters(row, filters));

  return { items: rows, total: count ?? rows.length };
}

export async function fetchProductSearchRowByIdentifier(
  productType: 'tire' | 'rim',
  identifier: string,
): Promise<ProductSearchRow | null> {
  const trimmedIdentifier = String(identifier ?? '').trim();
  if (!trimmedIdentifier) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedIdentifier);

  if (productType === 'rim') {
    const { data, error } = await supabase.rpc('catalog_get_rim_by_identifier_v1', {
      p_identifier: trimmedIdentifier,
    });
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    return rows[0] ? ({ ...(rows[0] as ProductSearchRow), product_type: 'rim', final_is_hidden: false }) : null;
  }

  if (productType === 'tire') {
    let query = supabase
      .from('webshop_items')
      .select(WEBSHOP_TIRE_PUBLIC_SELECT)
      .eq('product_type', 'tire')
      .eq('is_visible', true)
      .eq('publish_status', 'published')
      .limit(1);

    query = isUuid ? query.eq('variant_id', trimmedIdentifier) : query.eq('seo_slug', trimmedIdentifier);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? ({ ...(data as ProductSearchRow), pricing_rules: null, final_is_hidden: false }) : null;
  }

  return null;
}

export async function fetchProductLocaleContent(variantId: string): Promise<ProductLocaleContent | null> {
  const trimmedVariantId = String(variantId ?? '').trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmedVariantId);
  if (!trimmedVariantId || !isUuid) {
    return null;
  }

  const { data, error } = await supabase.rpc('catalog_get_product_locale_content_v1', {
    p_variant_id: trimmedVariantId,
  });

  if (error) {
    console.warn('fetchProductLocaleContent error:', error);
    return null;
  }

  if (Array.isArray(data)) {
    return (data[0] as ProductLocaleContent | undefined) ?? null;
  }

  return (data as ProductLocaleContent | null) ?? null;
}

export async function fetchProductsSearch(
  productType: 'tire' | 'rim',
  options: FetchOptions = {},
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const limit = Math.min(Math.max(options.limit ?? 24, 1), PUBLIC_CATALOG_MAX_LIMIT);
  const requestedOffset = Math.max(options.offset ?? 0, 0);
  if (requestedOffset > PUBLIC_CATALOG_MAX_OFFSET) {
    return { items: [], total: PUBLIC_CATALOG_MAX_OFFSET };
  }
  const offset = requestedOffset;
  const filters = options.filters ?? {};

  if (productType === 'tire' && isAllSeasonFilter(filters.season) && getFitmentSizeFilters(filters).length === 0) {
    return await fetchAllSeasonTireProducts(limit, offset, filters);
  }

  if (productType === 'tire') {
    try {
      return await fetchTireCatalogRpc(limit, offset, filters);
    } catch (error) {
      if (isStatementTimeoutError(error)) {
        console.warn('Tire catalog RPC timed out; falling back to published product-ready webshop_items.', error);
        return await fetchTireCatalogPublishedFallback(limit, offset, filters);
      }

      if (!isRecoverableAuthError(error)) {
        throw error;
      }

      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore cleanup failures and retry once with anon state.
      }

      try {
        return await fetchTireCatalogRpc(limit, offset, filters);
      } catch (retryError) {
        if (isStatementTimeoutError(retryError)) {
          console.warn('Tire catalog RPC timed out after auth retry; falling back to published product-ready webshop_items.', retryError);
          return await fetchTireCatalogPublishedFallback(limit, offset, filters);
        }
        throw retryError;
      }
    }
  }

  if (productType === 'rim') {
    try {
      return await fetchRimCatalogRpc(limit, offset, filters);
    } catch (error) {
      if (isStatementTimeoutError(error)) {
        console.warn('Rim catalog RPC timed out; falling back to published webshop_items.', error);
        return await fetchRimCatalogPublishedFallback(limit, offset, filters);
      }

      if (!isRecoverableAuthError(error)) {
        throw error;
      }

      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore cleanup failures and retry once with anon state.
      }

      try {
        return await fetchRimCatalogRpc(limit, offset, filters);
      } catch (retryError) {
        if (isStatementTimeoutError(retryError)) {
          console.warn('Rim catalog RPC timed out after auth retry; falling back to published webshop_items.', retryError);
          return await fetchRimCatalogPublishedFallback(limit, offset, filters);
        }
        throw retryError;
      }
    }
  }

  return { items: [], total: 0 };
}
