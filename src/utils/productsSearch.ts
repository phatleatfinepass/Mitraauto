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
};

interface FetchOptions {
  limit?: number;
  offset?: number;
}

export async function fetchProductsSearch(
  category: 'tire' | 'rim',
  options: FetchOptions = {}
): Promise<{ items: ProductSearchRow[]; total: number }> {
  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;

  // Fetch broad set first so storefront pagination can be based on visible (non-hidden) items.
  const { data, error } = await supabase
    .from('products_search')
    .select(
      `variant_id, product_type, brand, brand_display_name, brand_logo_url, model, size_string, 
       season, studded, runflat, xl_reinforced, 
       width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, finish,
       price, currency, in_stock, stock_qty,
       best_image_url, best_image_alt, card_title, subtitle, tags, seo_slug`
    )
    .eq('product_type', category)
    .order('price', { ascending: true, nullsFirst: false })
    .range(0, 4999);

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

    return {
      items: rows.slice(offset, offset + limit),
      total: rows.length,
    };
  }

  const hiddenVariantIds = new Set((hiddenRows ?? []).map((row) => row.variant_id));
  const visibleRows = rows.filter((row) => !hiddenVariantIds.has(row.variant_id));
  const pagedRows = visibleRows.slice(offset, offset + limit);

  return {
    items: pagedRows,
    total: visibleRows.length,
  };
}
