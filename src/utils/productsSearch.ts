import { getSupabaseConfigError, supabase } from './supabase/client';
import type { ProductPricingRules } from './pricing';

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
  currency: string | null;
  in_stock: boolean;
  stock_qty: number | null;
  delivery_days_min?: number | null;
  delivery_days_max?: number | null;
  supplier_code_best?: string | null;
  best_image_url: string | null;
  hero_image_url?: string | null;
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
  pricing_rules?: ProductPricingRules | null;
};

interface FetchOptions {
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

const PRODUCTS_SEARCH_PAGE_SIZE = 1000;

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

function matchesTireFilters(row: ProductSearchRow, filters: Record<string, any>): boolean {
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

  if (filters.width && filters.width !== 'all' && Number(filters.width) !== width) return false;
  if (filters.aspectRatio && filters.aspectRatio !== 'all' && Number(filters.aspectRatio) !== aspect) return false;
  if (filters.diameter && filters.diameter !== 'all' && Number(filters.diameter) !== diameter) return false;

  if (filters.season && filters.season !== 'all' && String(row.season ?? '').toLowerCase() !== String(filters.season).toLowerCase()) {
    return false;
  }

  if (filters.runflat && !row.runflat) return false;
  if (filters.xl && !row.xl_reinforced) return false;
  if (filters.studded && !row.studded) return false;
  if (filters.inStockOnly && !row.in_stock) return false;

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
    default:
      return list;
  }
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

  const { data, error } = await supabase
    .from('products_search')
    .select(baseSelect)
    .eq('product_type', productType)
    .eq('final_is_hidden', false)
    .limit(PRODUCTS_SEARCH_PAGE_SIZE);

  if (error) throw error;

  const rows = ((data ?? []) as any[]).map((row) => ({
    ...row,
    pricing_rules: null,
  })) as ProductSearchRow[];

  const filtered = productType === 'tire'
    ? rows.filter((row) => matchesTireFilters(row, filters))
    : rows.filter((row) => matchesRimFilters(row, filters));

  const sorted = applySort(filtered, filters.sortBy);
  return { items: sorted.slice(offset, offset + limit), total: sorted.length };
}
