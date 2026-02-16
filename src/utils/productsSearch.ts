import { supabase } from './supabase/client';

export type ProductSearchRow = {
  variant_id: string;
  product_type: 'tire' | 'rim';
  brand: string;
  brand_display_name: string | null;
  brand_logo_url: string | null;
  model: string;
  size_string: string | null;
  // Tire-specific
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
  // Rim-specific
  width_in: number | null;
  rim_diameter_in: number | null;
  et_offset_mm: number | null;
  bolt_pattern: string | null;
  color: string | null;
  finish: string | null;
  // Pricing and stock
  price: number | null;
  currency: string | null;
  in_stock: boolean;
  stock_qty: number | null;
  // Display fields
  best_image_url: string | null;
  best_image_alt: string | null;
  card_title: string | null;
  subtitle: string | null;
  tags: string[] | null;
  seo_slug: string | null;
  final_is_hidden?: boolean | null;
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
  // Accept common formats:
  // 205/55R16, 205/55ZR16, 205-55R16, 20555R16, 205/55 R16 91V
  const match =
    normalized.match(/(\d{3})[\/\-]?(\d{2})(?:ZR|R)?(\d{2})/) ??
    normalized.match(/(\d{3})[\/\-](\d{2}).*?R(\d{2})/);
  if (!match) return {};
  return {
    width: Number.parseInt(match[1], 10),
    aspect: Number.parseInt(match[2], 10),
    diameter: Number.parseInt(match[3], 10),
  };
}

function parseTireSizeFromRow(row: ProductSearchRow): { width?: number; aspect?: number; diameter?: number } {
  const candidates = [row.size_string, row.card_title, row.subtitle];
  for (const candidate of candidates) {
    const parsed = parseTireSize(candidate ?? null);
    if (parsed.width !== undefined || parsed.aspect !== undefined || parsed.diameter !== undefined) {
      return parsed;
    }
  }

  // Fallback only when textual size cannot be parsed.
  const structuredWidth = toNumberOrUndefined((row as any).width_mm);
  const structuredAspect = toNumberOrUndefined((row as any).aspect_ratio);
  const structuredDiameter = toNumberOrUndefined((row as any).diameter_in);
  if (structuredWidth !== undefined && structuredAspect !== undefined && structuredDiameter !== undefined) {
    return {
      width: Math.round(structuredWidth),
      aspect: Math.round(structuredAspect),
      diameter: Math.round(structuredDiameter),
    };
  }
  return {};
}

function normalizeSeason(value: string | null): string {
  return (value ?? '').toLowerCase().replace(/[^a-z]/g, '');
}

function matchesSeason(rowSeason: string | null, filterSeason: string): boolean {
  const filter = normalizeSeason(filterSeason);
  if (!filter || filter === 'all') return true;
  const season = normalizeSeason(rowSeason);
  if (filter === 'allseason') {
    return season === 'allseason' || season === 'allweather' || season === 'allseasons';
  }
  return season === filter;
}

function normalizePcd(value: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/×/g, 'x');
}

function toNumberOrUndefined(value: any): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function applyFilters(rows: ProductSearchRow[], category: 'tire' | 'rim', filters: Record<string, any>): ProductSearchRow[] {
  if (!filters || Object.keys(filters).length === 0) return rows;

  const searchText = String(filters.search ?? '').trim().toLowerCase();
  const widthFilter = filters.width && filters.width !== 'all' ? Number.parseInt(filters.width, 10) : undefined;
  const aspectFilter = filters.aspectRatio && filters.aspectRatio !== 'all' ? Number.parseInt(filters.aspectRatio, 10) : undefined;
  const diameterFilter = filters.diameter && filters.diameter !== 'all' ? Number.parseInt(filters.diameter, 10) : undefined;
  const rimDiameterFilter = filters.rimDiameter && filters.rimDiameter !== 'all' ? Number.parseFloat(filters.rimDiameter) : undefined;
  const rimWidthFilter = filters.rimWidth && filters.rimWidth !== 'all' ? Number.parseFloat(filters.rimWidth) : undefined;
  const pcdFilter = filters.pcd && filters.pcd !== 'all' ? normalizePcd(filters.pcd) : '';
  const etOffsetFilter = toNumberOrUndefined(filters.etOffset);
  const colorFilter = filters.color && filters.color !== 'all' ? String(filters.color).toLowerCase() : '';
  const materialFilter = filters.material && filters.material !== 'all' ? String(filters.material).toLowerCase() : '';

  return rows.filter((row) => {
    if (filters.inStockOnly && !row.in_stock) return false;

    if (searchText) {
      const haystack = `${row.brand ?? ''} ${row.brand_display_name ?? ''} ${row.model ?? ''} ${row.size_string ?? ''}`.toLowerCase();
      if (!haystack.includes(searchText)) return false;
    }

    if (category === 'tire') {
      const size = parseTireSizeFromRow(row);

      if (widthFilter !== undefined && size.width !== widthFilter) return false;
      if (aspectFilter !== undefined && size.aspect !== aspectFilter) return false;
      if (diameterFilter !== undefined && size.diameter !== diameterFilter) return false;
      if (!matchesSeason(row.season, String(filters.season ?? 'all'))) return false;
      if (filters.runflat && !row.runflat) return false;
      if (filters.xl && !row.xl_reinforced) return false;
      if (filters.studded && !row.studded) return false;
    } else {
      if (rimDiameterFilter !== undefined && row.rim_diameter_in !== rimDiameterFilter) return false;
      if (rimWidthFilter !== undefined && row.width_in !== rimWidthFilter) return false;
      if (pcdFilter && normalizePcd(row.bolt_pattern) !== pcdFilter) return false;
      if (etOffsetFilter !== undefined) {
        const rowEt = toNumberOrUndefined(row.et_offset_mm);
        if (rowEt === undefined || Math.abs(rowEt - etOffsetFilter) > 0.5) return false;
      }
      if (colorFilter) {
        const rowColor = String(row.color ?? '').toLowerCase();
        if (!rowColor.includes(colorFilter)) return false;
      }
      if (materialFilter) {
        const materialCandidate = String((row as any).material ?? row.finish ?? '').toLowerCase();
        if (!materialCandidate.includes(materialFilter)) return false;
      }
      if (filters.boltsIncluded === true && !(row as any).bolts_included) return false;
      if (filters.cb !== undefined && String(filters.cb).trim() !== '') {
        const cbFilter = toNumberOrUndefined(filters.cb);
        const cbValue = toNumberOrUndefined((row as any).cb_mm ?? (row as any).center_bore_mm ?? (row as any).cb);
        if (cbFilter !== undefined) {
          if (cbValue === undefined || Math.abs(cbValue - cbFilter) > 0.2) return false;
        }
      }
    }

    return true;
  });
}

function applySort(rows: ProductSearchRow[], sortBy: string | undefined, category: 'tire' | 'rim'): ProductSearchRow[] {
  const sorted = [...rows];
  switch (sortBy) {
    case 'price_desc':
      sorted.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      break;
    case 'brand_asc':
      sorted.sort((a, b) => (a.brand_display_name ?? a.brand).localeCompare(b.brand_display_name ?? b.brand));
      break;
    case 'wet_grip':
      if (category === 'tire') {
        sorted.sort((a: any, b: any) => String(a.eu_wet ?? '').localeCompare(String(b.eu_wet ?? '')));
      }
      break;
    case 'noise':
      if (category === 'tire') {
        sorted.sort((a: any, b: any) => {
          const aNoise = toNumberOrUndefined((a as any).eu_noise) ?? Number.MAX_SAFE_INTEGER;
          const bNoise = toNumberOrUndefined((b as any).eu_noise) ?? Number.MAX_SAFE_INTEGER;
          return aNoise - bNoise;
        });
      }
      break;
    case 'price_asc':
    default:
      sorted.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));
      break;
  }
  return sorted;
}

function applyCmsOverrides(row: ProductSearchRow, cmsRow: any): ProductSearchRow {
  const spec = cmsRow?.spec_overrides ?? {};
  const identity = spec?.identity ?? {};
  const features = spec?.features ?? {};

  return {
    ...row,
    size_string: identity.size_string ?? row.size_string,
    season: identity.season ?? row.season,
    load_index: identity.load_index ?? row.load_index,
    speed_rating: identity.speed_rating ?? row.speed_rating,
    runflat: Object.prototype.hasOwnProperty.call(features, 'runflat') ? Boolean(features.runflat) : row.runflat,
    xl_reinforced: Object.prototype.hasOwnProperty.call(features, 'xl') ? Boolean(features.xl) : row.xl_reinforced,
    studded: Object.prototype.hasOwnProperty.call(features, 'studded') ? Boolean(features.studded) : row.studded,
    ev_ready: Object.prototype.hasOwnProperty.call(features, 'ev_ready') ? Boolean(features.ev_ready) : row.ev_ready,
    threepmsf: Object.prototype.hasOwnProperty.call(features, 'threepmsf') ? Boolean(features.threepmsf) : row.threepmsf,
    winter_approved: Object.prototype.hasOwnProperty.call(features, 'winter_approved') ? Boolean(features.winter_approved) : row.winter_approved,
    ice_approved: Object.prototype.hasOwnProperty.call(features, 'ice_approved') ? Boolean(features.ice_approved) : row.ice_approved,
  };
}

export async function fetchProductsSearch(
  category: 'tire' | 'rim',
  options: FetchOptions = {}
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;
  const filters = options.filters ?? {};

  // Fetch broad set first so storefront pagination can be based on visible (non-hidden) items.
  const richSelect =
    `variant_id, product_type, brand, brand_display_name, brand_logo_url, model, size_string, 
     season, studded, runflat, xl_reinforced, load_index, speed_rating, speed_index, ev_ready, threepmsf, winter_approved, ice_approved, width_mm, aspect_ratio, diameter_in,
     width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, finish, material, bolts_included, cb_mm, center_bore_mm,
     eu_wet, eu_noise,
     price, currency, in_stock, stock_qty,
     best_image_url, best_image_alt, card_title, subtitle, tags, seo_slug, final_is_hidden`;
  const baseSelect =
    `variant_id, product_type, brand, brand_display_name, brand_logo_url, model, size_string, 
     season, studded, runflat, xl_reinforced, 
     width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, finish,
     price, currency, in_stock, stock_qty,
     best_image_url, best_image_alt, card_title, subtitle, tags, seo_slug, final_is_hidden`;

  const isMissingColumn = (error: any) => {
    const text = `${error?.message ?? ''} ${error?.details ?? ''}`.toLowerCase();
    return String(error?.code ?? '') === '42703' || (text.includes('column') && text.includes('does not exist'));
  };

  let data: any[] | null = null;
  let error: any = null;
  const fetchAllRows = async (selectColumns: string) => {
    const firstResult = await supabase
      .from('products_search')
      .select(selectColumns, { count: 'exact' })
      .eq('product_type', category)
      .order('variant_id', { ascending: true })
      .range(0, PRODUCTS_SEARCH_PAGE_SIZE - 1);

    if (firstResult.error) {
      return { rows: null as any[] | null, error: firstResult.error };
    }

    const rows = [...(firstResult.data ?? [])];
    const expectedTotal = firstResult.count ?? null;

    while (true) {
      if (expectedTotal !== null && rows.length >= expectedTotal) {
        break;
      }
      if (rows.length > 0 && rows.length % PRODUCTS_SEARCH_PAGE_SIZE !== 0) {
        break;
      }

      const nextFrom = rows.length;
      const nextResult = await supabase
        .from('products_search')
        .select(selectColumns)
        .eq('product_type', category)
        .order('variant_id', { ascending: true })
        .range(nextFrom, nextFrom + PRODUCTS_SEARCH_PAGE_SIZE - 1);

      if (nextResult.error) {
        return { rows: null as any[] | null, error: nextResult.error };
      }

      const batch = nextResult.data ?? [];
      if (batch.length === 0) {
        break;
      }

      rows.push(...batch);

      if (batch.length < PRODUCTS_SEARCH_PAGE_SIZE) {
        break;
      }
    }

    return { rows, error: null };
  };

  {
    const richResult = await fetchAllRows(richSelect);

    if (!richResult.error) {
      data = richResult.rows;
    } else if (isMissingColumn(richResult.error)) {
      const baseResult = await fetchAllRows(baseSelect);
      data = baseResult.rows;
      error = baseResult.error;
    } else {
      error = richResult.error;
    }
  }

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    return { items: [], total: 0 };
  }

  const { data: hiddenRows, error: hiddenError } = await supabase
    .from('product_cms')
    .select('variant_id')
    .eq('is_hidden', true);

  if (hiddenError) {
    // Some environments don't allow public read on product_cms.
    // In that case, fail open instead of breaking storefront fetch.
    if (hiddenError.code !== '42501') {
      throw hiddenError;
    }

    const visibleRows = (rows as ProductSearchRow[]).filter((row: any) => !Boolean(row.final_is_hidden));
    const filteredRows = applyFilters(visibleRows, category, filters);
    const sortedRows = applySort(filteredRows, filters.sortBy, category);
    return {
      items: sortedRows.slice(offset, offset + limit),
      total: sortedRows.length,
    };
  }

  const hiddenVariantIds = new Set((hiddenRows ?? []).map((row) => row.variant_id));
  const visibleRows = rows.filter((row: any) => {
    if (hiddenVariantIds.has(row.variant_id)) return false;
    return !Boolean(row.final_is_hidden);
  }) as ProductSearchRow[];
  const filteredRows = applyFilters(visibleRows, category, filters);
  const sortedRows = applySort(filteredRows, filters.sortBy, category);
  const pagedRows = sortedRows.slice(offset, offset + limit);
  let mergedPagedRows = pagedRows;

  if (pagedRows.length > 0) {
    const pagedVariantIds = pagedRows.map((row) => row.variant_id);
    const { data: cmsRows, error: cmsError } = await supabase
      .from('product_cms')
      .select('variant_id, spec_overrides')
      .in('variant_id', pagedVariantIds);

    if (cmsError) {
      if (cmsError.code !== '42501') {
        throw cmsError;
      }
    } else if (cmsRows?.length) {
      const cmsMap = new Map(cmsRows.map((cmsRow: any) => [cmsRow.variant_id, cmsRow]));
      mergedPagedRows = pagedRows.map((row) => {
        const cmsRow = cmsMap.get(row.variant_id);
        return cmsRow ? applyCmsOverrides(row, cmsRow) : row;
      });
    }
  }

  return {
    items: mergedPagedRows,
    total: sortedRows.length,
  };
}
