-- Phase 2: tire catalog health and product-ready storefront support.
-- These indexes support the CMS health panel timestamp probes and the tire
-- product-ready fallback path used when the public tire RPC times out.

create index if not exists supplier_raw_rd_tires_fetched_at_desc_idx
on public.supplier_raw_rd_tires (fetched_at desc nulls last);

create index if not exists supplier_raw_vt_tires_fetched_at_desc_idx
on public.supplier_raw_vt_tires (fetched_at desc nulls last);

create index if not exists catalog_selected_items_tire_last_selected_idx
on public.catalog_selected_items (product_type, last_selected_at desc nulls last)
where product_type = 'tire';

create index if not exists webshop_items_tire_ready_brand_idx
on public.webshop_items (
  brand_display_name,
  brand,
  model,
  variant_id
)
where product_type = 'tire'
  and is_visible = true
  and publish_status = 'published'
  and product_ready = true;

create index if not exists webshop_items_tire_ready_price_asc_idx
on public.webshop_items (
  final_price_eur asc nulls last,
  price asc nulls last,
  variant_id
)
where product_type = 'tire'
  and is_visible = true
  and publish_status = 'published'
  and product_ready = true;

create index if not exists webshop_items_tire_ready_price_desc_idx
on public.webshop_items (
  final_price_eur desc nulls last,
  price desc nulls last,
  variant_id
)
where product_type = 'tire'
  and is_visible = true
  and publish_status = 'published'
  and product_ready = true;

create index if not exists webshop_items_tire_ready_size_idx
on public.webshop_items (
  width_mm,
  aspect_ratio,
  diameter_in,
  season,
  variant_id
)
where product_type = 'tire'
  and is_visible = true
  and publish_status = 'published'
  and product_ready = true;

create index if not exists webshop_items_tire_ready_wet_noise_idx
on public.webshop_items (
  eu_wet asc nulls last,
  eu_noise asc nulls last,
  brand,
  model,
  variant_id
)
where product_type = 'tire'
  and is_visible = true
  and publish_status = 'published'
  and product_ready = true;

create index if not exists webshop_items_tire_last_synced_idx
on public.webshop_items (product_type, last_synced_at desc nulls last)
where product_type = 'tire';
