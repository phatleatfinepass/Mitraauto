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
  subtitle: string | null;
  short_description?: string | null;
  long_description?: string | null;
  tags: string[] | null;
  seo_slug: string | null;
  eu_label_json?: any;
  eu_fuel?: string | null;
  eu_wet?: string | null;
  eu_noise?: number | null;
  final_is_hidden?: boolean | null;
  ean?: string | null;
  derived_ean?: string | null;
  manufacture_year?: number | null;
  pricing_rules?: ProductPricingRules | null;
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
  'sound_absorber',
  'gallery',
  'manufacture_year',
  'is_visible',
  'publish_status',
].join(',');

interface FetchOptions {
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

type TireVariantLookupRow = {
  id: string;
};

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
  switch (sortBy) {
    case 'price_desc':
      return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case 'price_asc':
      return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
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

function hasExactTireSizeFilters(filters: Record<string, any>) {
  return Boolean(
    (filters.width && filters.width !== 'all') ||
    (filters.aspectRatio && filters.aspectRatio !== 'all') ||
    (filters.diameter && filters.diameter !== 'all')
  );
}

function isNumericTireSearch(query: string) {
  const normalized = query.trim();
  return /\d/.test(normalized) && !/[a-z]/i.test(normalized.replace(/\bxl\b/gi, '').replace(/\bev\b/gi, ''));
}

function parseSearchTireSize(query: string): { width?: number; aspect?: number; diameter?: number } {
  const normalized = query.toUpperCase().replace(/\s+/g, '');
  const match =
    normalized.match(/(\d{3})[\/-](\d{2})(?:ZR|R)?(\d{2})/) ??
    normalized.match(/(\d{3})(\d{2})R?(\d{2})/);

  if (!match) return {};

  return {
    width: Number.parseInt(match[1], 10),
    aspect: Number.parseInt(match[2], 10),
    diameter: Number.parseInt(match[3], 10),
  };
}

async function fetchTireVariantIdsBySearch(
  query: string,
  limit: number,
  offset: number,
): Promise<{ ids: string[]; total: number }> {
  const trimmed = normalizeSearchTerm(query);
  if (!trimmed) return { ids: [], total: 0 };

  let request = supabase
    .from('catalog_tire_variants')
    .select('id', { count: 'estimated' })
    .eq('cms_visible', true);

  const digits = trimmed.replace(/\D/g, '');
  const parsedSize = parseSearchTireSize(trimmed);

  if (/^\d{8,14}$/.test(digits) && digits === trimmed) {
    request = request.eq('ean', digits);
  } else if (parsedSize.width && parsedSize.aspect && parsedSize.diameter) {
    request = request
      .eq('width_mm', parsedSize.width)
      .eq('aspect_ratio', parsedSize.aspect)
      .eq('diameter_in', parsedSize.diameter);
  } else if (/^\d{3}$/.test(digits) && digits === trimmed) {
    request = request.eq('width_mm', Number(digits));
  } else if (/^\d{2}$/.test(digits) && digits === trimmed) {
    request = request.or(`aspect_ratio.eq.${Number(digits)},diameter_in.eq.${Number(digits)}`);
  } else {
    request = request.ilike('size_string', `%${trimmed}%`);
  }

  const { data, error, count } = await request
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as TireVariantLookupRow[];
  return {
    ids: rows.map((row) => row.id),
    total: count ?? rows.length,
  };
}

async function fetchTireVariantIdsByFilters(
  filters: Record<string, any>,
  limit: number,
  offset: number,
): Promise<{ ids: string[]; total: number }> {
  let request = supabase
    .from('catalog_tire_variants')
    .select('id', { count: 'estimated' })
    .eq('cms_visible', true);

  const normalizedSearch = normalizeSearchTerm(filters.search);
  const parsedSearchSize = parseSearchTireSize(normalizedSearch);
  const digits = normalizedSearch.replace(/\D/g, '');

  const widthFilter =
    filters.width && filters.width !== 'all'
      ? Number(filters.width)
      : parsedSearchSize.width ?? (/^\d{3}$/.test(digits) && digits === normalizedSearch ? Number(digits) : null);
  const aspectFilter =
    filters.aspectRatio && filters.aspectRatio !== 'all'
      ? Number(filters.aspectRatio)
      : parsedSearchSize.aspect ?? null;
  const diameterFilter =
    filters.diameter && filters.diameter !== 'all'
      ? Number(filters.diameter)
      : parsedSearchSize.diameter ?? null;

  if (normalizedSearch) {
    if (/^\d{8,14}$/.test(digits) && digits === normalizedSearch) {
      request = request.eq('ean', digits);
    } else if (!widthFilter && !aspectFilter && !diameterFilter) {
      request = request.ilike('size_string', `%${normalizedSearch}%`);
    }
  }

  if (widthFilter !== null) request = request.eq('width_mm', widthFilter);
  if (aspectFilter !== null) request = request.eq('aspect_ratio', aspectFilter);
  if (diameterFilter !== null) request = request.eq('diameter_in', diameterFilter);

  const seasonFilterValues = getSeasonFilterValues(filters.season);
  if (seasonFilterValues.length === 1) request = request.eq('season', seasonFilterValues[0]);
  if (seasonFilterValues.length > 1) request = request.in('season', seasonFilterValues);
  if (filters.runflat) request = request.eq('runflat', true);
  if (filters.xl) request = request.eq('xl_reinforced', true);
  if (filters.studded) request = request.eq('studded', true);

  const { data, error, count } = await request
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as TireVariantLookupRow[];
  return {
    ids: rows.map((row) => row.id),
    total: count ?? rows.length,
  };
}

async function fetchProductsByVariantIds(
  productType: 'tire' | 'rim',
  variantIds: string[],
): Promise<ProductSearchRow[]> {
  if (!variantIds.length) return [];

  const baseSelect = [
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

  const { data, error } = await supabase
    .from('products_search')
    .select(baseSelect)
    .eq('product_type', productType)
    .eq('final_is_hidden', false)
    .in('variant_id', variantIds)
    .order('variant_id', { ascending: true });

  if (error) {
    throw error;
  }

  const rowMap = new Map(
    ((data ?? []) as ProductSearchRow[]).map((row) => [row.variant_id, { ...row, pricing_rules: null } satisfies ProductSearchRow]),
  );

  return variantIds.map((id) => rowMap.get(id)).filter(Boolean) as ProductSearchRow[];
}

function buildTireSizeSearchPattern(filters: Record<string, any>, normalizedSearch: string): string | null {
  const width = filters.width && filters.width !== 'all' ? String(filters.width).trim() : '';
  const aspect = filters.aspectRatio && filters.aspectRatio !== 'all' ? String(filters.aspectRatio).trim() : '';
  const diameter = filters.diameter && filters.diameter !== 'all' ? String(filters.diameter).trim() : '';

  if (width && aspect && diameter) return `${width}/${aspect} R${diameter}%`;
  if (width && aspect) return `${width}/${aspect}%`;
  if (width) return `${width}/%`;

  const digits = normalizedSearch.replace(/\D/g, '');
  const parsedSize = parseSearchTireSize(normalizedSearch);

  if (parsedSize.width && parsedSize.aspect && parsedSize.diameter) {
    return `${parsedSize.width}/${parsedSize.aspect} R${parsedSize.diameter}%`;
  }
  if (/^\d{3}$/.test(digits) && digits === normalizedSearch) {
    return `${digits}/%`;
  }
  if (/^\d{3}\/\d{2}$/.test(normalizedSearch)) {
    return `${normalizedSearch}%`;
  }

  return null;
}

async function fetchTireProductsBySizePattern(
  filters: Record<string, any>,
  normalizedSearch: string,
  limit: number,
  offset: number,
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const pattern = buildTireSizeSearchPattern(filters, normalizedSearch);
  if (!pattern) {
    return { items: [], total: 0 };
  }

  const baseSelect = [
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
  ].join(',');

  const buildQuery = (orderMode: 'preferred' | 'safe' | 'none' = 'preferred') => {
    let query = supabase
      .from('products_search')
      .select(baseSelect)
      .eq('product_type', 'tire')
      .eq('final_is_hidden', false)
      .ilike('size_string', pattern);

    const seasonFilterValues = getSeasonFilterValues(filters.season);
    if (seasonFilterValues.length === 1) query = query.eq('season', seasonFilterValues[0]);
    if (seasonFilterValues.length > 1) query = query.in('season', seasonFilterValues);
    if (filters.ean) {
      const ean = String(filters.ean).replace(/\D/g, '');
      if (ean) {
        query = query.or(`ean.ilike.%${ean}%,derived_ean.ilike.%${ean}%`);
      }
    }
    if (filters.runflat) query = query.eq('runflat', true);
    if (filters.xl) query = query.eq('xl_reinforced', true);
    if (filters.studded) query = query.eq('studded', true);
    if (filters.electricCar) query = query.eq('ev_ready', true);
    if (filters.soundAbsorber) query = query.eq('sound_absorber', true);
    if (filters.inStockOnly) query = query.eq('in_stock', true);

    if (orderMode === 'safe') {
      query = query.order('variant_id', { ascending: true });
    } else if (orderMode === 'preferred') {
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
    }

    return query.range(offset, offset + limit - 1);
  };

  const firstResult = await buildQuery('preferred');
  if (firstResult.error && !isStatementTimeoutError(firstResult.error)) {
    throw firstResult.error;
  }

  let usedFallbackOrdering = false;
  let data: ProductSearchRow[] = [];

  if (firstResult.error && isStatementTimeoutError(firstResult.error)) {
    const safeOrderResult = await buildQuery('safe');
    if (safeOrderResult.error && !isStatementTimeoutError(safeOrderResult.error)) {
      throw safeOrderResult.error;
    }

    if (safeOrderResult.error && isStatementTimeoutError(safeOrderResult.error)) {
      const unorderedResult = await buildQuery('none');
      if (unorderedResult.error) {
        throw unorderedResult.error;
      }
      usedFallbackOrdering = true;
      data = (unorderedResult.data ?? []) as ProductSearchRow[];
    } else {
      usedFallbackOrdering = true;
      data = (safeOrderResult.data ?? []) as ProductSearchRow[];
    }
  } else {
    data = (firstResult.data ?? []) as ProductSearchRow[];
  }

  let filtered = data.map((row) => ({ ...row, pricing_rules: null })).filter((row) => matchesTireFilters(row, filters));
  if (usedFallbackOrdering) {
    filtered = applySort(filtered, filters.sortBy);
  }

  return {
    items: filtered,
    total: filtered.length === limit ? offset + filtered.length + 1 : offset + filtered.length,
  };
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

  const { data, error, count } = await buildQuery(true);
  if (error) throw error;

  const rows = ((data ?? []) as ProductSearchRow[])
    .map((row) => ({ ...row, pricing_rules: null, final_is_hidden: false }))
    .filter((row) => matchesTireFilters(row, filters));

  return { items: rows, total: count ?? rows.length };
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

  if (shouldRetryWithoutRetreadParam || shouldRetryWithoutEanParam || shouldRetryWithoutEvSoundParams) {
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
  if (countError) throw countError;

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
    .filter((row) => {
      if (!ean) return true;
      const rowEan = String((row as any).ean ?? (row as any).derived_ean ?? '').replace(/\D/g, '');
      return rowEan.includes(ean);
    });

  return {
    items,
    total: (shouldRetryWithoutRetreadParam || shouldRetryWithoutEanParam) && (!includeRetreaded || ean) ? items.length : Number(countValue ?? items.length),
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

  if (productType === 'tire' && !isAllSeasonFilter(filters.season)) {
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

  let query = supabase
    .from('products_search')
    .select(PRODUCT_SEARCH_BASE_SELECT)
    .eq('product_type', productType)
    .eq('final_is_hidden', false)
    .limit(1);

  query = isUuid ? query.eq('variant_id', trimmedIdentifier) : query.eq('seo_slug', trimmedIdentifier);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? ({ ...(data as ProductSearchRow), pricing_rules: null }) : null;
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

  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;
  const filters = options.filters ?? {};
  const normalizedSearch = normalizeSearchTerm(filters.search);

  if (productType === 'tire' && isAllSeasonFilter(filters.season) && getFitmentSizeFilters(filters).length === 0) {
    return await fetchAllSeasonTireProducts(limit, offset, filters);
  }

  if (productType === 'tire') {
    try {
      return await fetchTireCatalogRpc(limit, offset, filters);
    } catch (error) {
      if (!isRecoverableAuthError(error)) {
        throw error;
      }

      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore cleanup failures and retry once with anon state.
      }

      return await fetchTireCatalogRpc(limit, offset, filters);
    }
  }

  const shouldUseFastTireLookup =
    productType === 'tire' && ((normalizedSearch && isNumericTireSearch(normalizedSearch)) || hasExactTireSizeFilters(filters));

  if (shouldUseFastTireLookup) {
    return await fetchTireProductsBySizePattern(filters, normalizedSearch, limit, offset);
  }

  const runFetch = async (): Promise<{ items: ProductSearchRow[]; total: number }> => {
    const baseSelect = PRODUCT_SEARCH_BASE_SELECT;

    const buildQuery = (withCount: boolean, useSafeOrder = false) => {
      let query = supabase
        .from('products_search')
        .select(baseSelect, withCount ? { count: 'estimated' } : undefined)
        .eq('product_type', productType)
        .eq('final_is_hidden', false);

      if (productType === 'tire') {
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
        const seasonFilterValues = getSeasonFilterValues(filters.season);
        if (seasonFilterValues.length === 1) query = query.eq('season', seasonFilterValues[0]);
        if (seasonFilterValues.length > 1) query = query.in('season', seasonFilterValues);
        if (filters.ean) {
          const ean = String(filters.ean).replace(/\D/g, '');
          if (ean) {
            query = query.or(`ean.ilike.%${ean}%,derived_ean.ilike.%${ean}%`);
          }
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
              query = query.order('brand', { ascending: true }).order('model', { ascending: true }).order('variant_id', { ascending: true });
              break;
          }
        }
      } else {
        if (filters.search) {
          const q = String(filters.search).trim();
          if (q) {
            query = query.or([
              `brand.ilike.%${q}%`,
              `brand_display_name.ilike.%${q}%`,
              `model.ilike.%${q}%`,
              `card_title.ilike.%${q}%`,
              `color.ilike.%${q}%`,
            ].join(','));
          }
        }

        if (filters.rimDiameter && filters.rimDiameter !== 'all') query = query.eq('rim_diameter_in', Number(filters.rimDiameter));
        if (filters.rimWidth && filters.rimWidth !== 'all') query = query.eq('width_in', Number(filters.rimWidth));
        if (filters.pcd && filters.pcd !== 'all') query = query.eq('bolt_pattern', filters.pcd);
        if (filters.etOffset !== '' && filters.etOffset !== null && filters.etOffset !== undefined) {
          query = query.eq('et_offset_mm', Number(filters.etOffset));
        }
        if (filters.color && filters.color !== 'all') query = query.ilike('color', filters.color);
        if (filters.inStockOnly) query = query.eq('in_stock', true);

        if (useSafeOrder) {
          query = query.order('variant_id', { ascending: true });
        } else {
          switch (filters.sortBy) {
            case 'price_desc':
              query = query.order('final_price_eur', { ascending: false, nullsFirst: false }).order('price', { ascending: false, nullsFirst: false });
              break;
            case 'brand_asc':
              query = query.order('brand', { ascending: true }).order('model', { ascending: true }).order('variant_id', { ascending: true });
              break;
            case 'price_asc':
            default:
              query = query.order('final_price_eur', { ascending: true, nullsFirst: false }).order('price', { ascending: true, nullsFirst: false });
              break;
          }
        }
      }

      return query.range(offset, offset + limit - 1);
    };

    let data: any[] | null = null;
    let count: number | null = null;
    let usedSafeOrderFallback = false;

    const firstResult = await buildQuery(true);
    if (firstResult.error && !isStatementTimeoutError(firstResult.error)) {
      throw firstResult.error;
    }

    if (firstResult.error && isStatementTimeoutError(firstResult.error)) {
      const fallbackResult = await buildQuery(false);
      if (fallbackResult.error && !isStatementTimeoutError(fallbackResult.error)) {
        throw fallbackResult.error;
      }

      if (fallbackResult.error && isStatementTimeoutError(fallbackResult.error)) {
        const safeOrderResult = await buildQuery(false, true);
        if (safeOrderResult.error) {
          throw safeOrderResult.error;
        }
        usedSafeOrderFallback = true;
        data = (safeOrderResult.data ?? []) as any[];
      } else {
        data = (fallbackResult.data ?? []) as any[];
      }

      // Approximate count enough for public catalog pagination when exact count is too expensive.
      count = data.length === limit ? offset + data.length + 1 : offset + data.length;
    } else {
      data = (firstResult.data ?? []) as any[];
      count = firstResult.count ?? data.length;
    }

    let rows = (data ?? []).map((row) => ({
      ...row,
      pricing_rules: null,
    })) as ProductSearchRow[];

    rows = rows.filter((row) => !row.final_is_hidden);
    if (usedSafeOrderFallback) {
      rows = applySort(rows, filters.sortBy);
    }

    return { items: rows, total: count ?? rows.length };
  };

  try {
    return await runFetch();
  } catch (error) {
    if (!isRecoverableAuthError(error)) {
      throw error;
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore cleanup failures and retry once with anon state.
    }

    return await runFetch();
  }
}
