-- Reduce timeout risk for storefront and CMS tire/rim catalog list/count paths.

set lock_timeout = '5s';
set statement_timeout = '120s';

create index if not exists webshop_items_rim_public_price_idx
  on public.webshop_items (product_type, is_visible, publish_status, final_price_eur, price, variant_id)
  where product_type = 'rim';

create index if not exists webshop_items_rim_public_brand_idx
  on public.webshop_items (product_type, is_visible, publish_status, brand_display_name, brand, model, variant_id)
  where product_type = 'rim';

create index if not exists webshop_items_rim_public_fitment_idx
  on public.webshop_items (product_type, is_visible, publish_status, rim_diameter_in, width_in, bolt_pattern, et_offset_mm, center_bore_mm)
  where product_type = 'rim';

create index if not exists webshop_items_tire_public_price_idx
  on public.webshop_items (product_type, is_visible, publish_status, final_price_eur, price, variant_id)
  where product_type = 'tire';

create index if not exists webshop_items_tire_public_size_idx
  on public.webshop_items (product_type, is_visible, publish_status, width_mm, aspect_ratio, diameter_in, season, variant_id)
  where product_type = 'tire';

create index if not exists webshop_items_tire_public_brand_idx
  on public.webshop_items (product_type, is_visible, publish_status, brand_display_name, brand, model, variant_id)
  where product_type = 'tire';

create index if not exists catalog_selected_items_rim_cms_order_idx
  on public.catalog_selected_items (product_type, is_available, brand, model, id)
  where product_type = 'rim';

create index if not exists catalog_selected_items_tire_cms_order_idx
  on public.catalog_selected_items (product_type, is_available, brand, model, id)
  where product_type = 'tire';
