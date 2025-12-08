import { getSupabaseClient } from './supabase/client.tsx';

export type ProductSearchRow = {
  variant_id: string;
  brand_name: string;
  model_name: string;
  size_label: string | null;
  title: string | null;
  min_price_cents: number | null;
  min_price_sell_cents: number | null;
  supplier_count: number | null;
  in_stock: boolean;
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

  // Use different views/tables for tires and rims
  const tableName = category === 'tire' ? 'products_search' : 'products_search';

  const { data, error, count } = await supabase
    .from(tableName)
    .select(
      `variant_id, brand_name, model_name, size_label, title, min_price_cents, min_price_sell_cents, supplier_count, in_stock`,
      { count: 'exact' }
    )
    .order('min_price_sell_cents', { ascending: true, nullsFirst: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return {
    items: data ?? [],
    total: count ?? (data?.length ?? 0),
  };
}