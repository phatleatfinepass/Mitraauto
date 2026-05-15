drop function if exists public.cms_list_rims_admin_v1(
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  integer,
  integer
);

create or replace function public.cms_list_rims_admin_v1(
  p_search text default null,
  p_supplier_code text default null,
  p_missing_price_only boolean default false,
  p_missing_image_only boolean default false,
  p_missing_seo_only boolean default false,
  p_missing_specs_only boolean default false,
  p_status text default 'all',
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  variant_id uuid,
  product_type text,
  derived_ean text,
  supplier_code_best text,
  supplier_external_id_best text,
  brand text,
  model text,
  size_string text,
  width_in numeric,
  rim_diameter_in numeric,
  et_offset_mm numeric,
  bolt_pattern text,
  center_bore_mm numeric,
  cb_mm numeric,
  color text,
  finish text,
  material text,
  bolts_included boolean,
  winter_approved boolean,
  wheel_load_kg numeric,
  final_price_eur numeric,
  price numeric,
  stock_qty integer,
  in_stock boolean,
  delivery_days_min integer,
  delivery_days_max integer,
  supplier_image_url text,
  ean text,
  missing_supplier_price boolean,
  missing_supplier_image boolean,
  cms_data jsonb,
  is_visible boolean,
  product_ready boolean,
  readiness_reasons text[],
  primary_readiness_reason text,
  publish_status text,
  publish_block_reason text,
  conflict_status text,
  conflict_reason text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    mv.variant_id,
    mv.product_type,
    mv.derived_ean,
    mv.supplier_code_best,
    mv.supplier_external_id_best,
    mv.brand,
    mv.model,
    mv.size_string,
    mv.width_in,
    mv.rim_diameter_in,
    mv.et_offset_mm,
    mv.bolt_pattern,
    mv.center_bore_mm,
    mv.cb_mm,
    mv.color,
    mv.finish,
    mv.material,
    mv.bolts_included,
    mv.winter_approved,
    mv.wheel_load_kg,
    mv.final_price_eur,
    mv.price,
    mv.stock_qty,
    mv.in_stock,
    mv.delivery_days_min,
    mv.delivery_days_max,
    mv.supplier_image_url,
    mv.ean,
    mv.missing_supplier_price,
    mv.missing_supplier_image,
    mv.cms_data,
    wi.is_visible,
    wi.product_ready,
    wi.readiness_reasons,
    wi.primary_readiness_reason,
    wi.publish_status,
    wi.publish_block_reason,
    selected.conflict_status,
    selected.conflict_reason
  from public.catalog_selected_rims_cms_admin_v1 mv
  left join public.webshop_items wi
    on wi.product_type = 'rim'
   and wi.variant_id = mv.variant_id
  left join public.catalog_selected_items selected
    on selected.product_type = 'rim'
   and selected.id = mv.variant_id
  where public.cms_has_permission('catalog_rims', 'read')
    and public.cms_rim_admin_matches_search(mv, p_search)
    and public.cms_rim_admin_matches_filters(
      mv,
      p_supplier_code,
      p_missing_price_only,
      p_missing_image_only,
      p_missing_seo_only,
      p_missing_specs_only,
      p_status
    )
  order by lower(coalesce(mv.brand, '')), lower(coalesce(mv.model, '')), mv.variant_id
  limit greatest(1, least(coalesce(p_limit, 100), 250))
  offset greatest(0, coalesce(p_offset, 0));
$function$;

revoke all on function public.cms_list_rims_admin_v1(
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  integer,
  integer
) from public;

grant execute on function public.cms_list_rims_admin_v1(
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  integer,
  integer
) to authenticated, service_role;
