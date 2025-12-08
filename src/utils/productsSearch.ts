import { getSupabaseClient } from './supabase/client.tsx';

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
  const supabase = getSupabaseClient();
  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;

  const { data, error, count } = await supabase
    .from('products_search')
    .select(
      `variant_id, product_type, brand, brand_display_name, brand_logo_url, model, size_string, 
       season, studded, runflat, xl_reinforced, 
       width_in, rim_diameter_in, et_offset_mm, bolt_pattern, color, finish,
       price, currency, in_stock, stock_qty,
       best_image_url, best_image_alt, card_title, subtitle, tags, seo_slug`,
      { count: 'exact' }
    )
    .eq('product_type', category)
    .order('price', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return {
    items: data ?? [],
    total: count ?? (data?.length ?? 0),
  };
}