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
  with rows as (
    select
      mv.*,
      wi.is_visible,
      wi.product_ready,
      coalesce(wi.readiness_reasons, '{}'::text[]) as readiness_reasons,
      wi.primary_readiness_reason,
      wi.publish_status,
      wi.publish_block_reason,
      selected.conflict_status as selected_conflict_status,
      selected.conflict_reason as selected_conflict_reason
    from public.catalog_selected_rims_cms_admin_v1 mv
    left join public.webshop_items wi
      on wi.product_type = 'rim'
     and wi.variant_id = mv.variant_id
    left join public.catalog_selected_items selected
      on selected.product_type = 'rim'
     and selected.id = mv.variant_id
    where public.cms_has_permission('catalog_rims', 'read')
      and public.cms_rim_admin_matches_search(mv, p_search)
  )
  select
    r.variant_id,
    r.product_type,
    r.derived_ean,
    r.supplier_code_best,
    r.supplier_external_id_best,
    r.brand,
    r.model,
    r.size_string,
    r.width_in,
    r.rim_diameter_in,
    r.et_offset_mm,
    r.bolt_pattern,
    r.center_bore_mm,
    r.cb_mm,
    r.color,
    r.finish,
    r.material,
    r.bolts_included,
    r.winter_approved,
    r.wheel_load_kg,
    r.final_price_eur,
    r.price,
    r.stock_qty,
    r.in_stock,
    r.delivery_days_min,
    r.delivery_days_max,
    r.supplier_image_url,
    r.ean,
    r.missing_supplier_price,
    r.missing_supplier_image,
    r.cms_data,
    r.is_visible,
    coalesce(r.product_ready, false) as product_ready,
    r.readiness_reasons,
    r.primary_readiness_reason,
    r.publish_status,
    r.publish_block_reason,
    r.selected_conflict_status,
    r.selected_conflict_reason
  from rows r
  where (
      nullif(btrim(coalesce(p_supplier_code, '')), '') is null
      or upper(coalesce(r.supplier_code_best, '')) = upper(nullif(btrim(p_supplier_code), ''))
    )
    and (
      not coalesce(p_missing_price_only, false)
      or coalesce(r.missing_supplier_price, false)
      or r.final_price_eur is null
      or 'missing_price' = any(r.readiness_reasons)
    )
    and (
      not coalesce(p_missing_image_only, false)
      or 'missing_image' = any(r.readiness_reasons)
      or coalesce(r.primary_readiness_reason = 'missing_image', false)
    )
    and (
      not coalesce(p_missing_seo_only, false)
      or nullif(r.cms_data->>'seo_slug', '') is null
      or nullif(r.cms_data->>'seo_title', '') is null
      or nullif(r.cms_data->>'seo_description', '') is null
      or 'missing_seo' = any(r.readiness_reasons)
    )
    and (
      not coalesce(p_missing_specs_only, false)
      or 'missing_mounting_specs' = any(r.readiness_reasons)
      or 'missing_specs' = any(r.readiness_reasons)
    )
    and (
      coalesce(nullif(btrim(p_status), ''), 'all') = 'all'
      or (p_status = 'hidden' and coalesce(nullif(r.cms_data->>'is_hidden', '')::boolean, false))
      or (p_status = 'visible' and not coalesce(nullif(r.cms_data->>'is_hidden', '')::boolean, false))
      or (p_status = 'missing_price' and (coalesce(r.missing_supplier_price, false) or r.final_price_eur is null or 'missing_price' = any(r.readiness_reasons)))
      or (p_status = 'missing_image' and ('missing_image' = any(r.readiness_reasons) or coalesce(r.primary_readiness_reason = 'missing_image', false)))
      or (p_status = 'missing_specs' and ('missing_mounting_specs' = any(r.readiness_reasons) or 'missing_specs' = any(r.readiness_reasons)))
      or (p_status = 'manual_not_sellable' and public.catalog_is_rim_manual_not_sellable(coalesce(r.cms_data->'spec_overrides', '{}'::jsonb)))
    )
  order by lower(coalesce(r.brand, '')), lower(coalesce(r.model, '')), r.variant_id
  limit greatest(1, least(coalesce(p_limit, 100), 250))
  offset greatest(0, coalesce(p_offset, 0));
$function$;

create or replace function public.cms_count_rims_admin_v1(
  p_search text default null,
  p_supplier_code text default null,
  p_missing_price_only boolean default false,
  p_missing_image_only boolean default false,
  p_missing_seo_only boolean default false,
  p_missing_specs_only boolean default false,
  p_status text default 'all'
)
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $function$
  with rows as (
    select
      mv.*,
      coalesce(wi.readiness_reasons, '{}'::text[]) as readiness_reasons,
      wi.primary_readiness_reason
    from public.catalog_selected_rims_cms_admin_v1 mv
    left join public.webshop_items wi
      on wi.product_type = 'rim'
     and wi.variant_id = mv.variant_id
    where public.cms_has_permission('catalog_rims', 'read')
      and public.cms_rim_admin_matches_search(mv, p_search)
  )
  select count(*)::bigint
  from rows r
  where (
      nullif(btrim(coalesce(p_supplier_code, '')), '') is null
      or upper(coalesce(r.supplier_code_best, '')) = upper(nullif(btrim(p_supplier_code), ''))
    )
    and (
      not coalesce(p_missing_price_only, false)
      or coalesce(r.missing_supplier_price, false)
      or r.final_price_eur is null
      or 'missing_price' = any(r.readiness_reasons)
    )
    and (
      not coalesce(p_missing_image_only, false)
      or 'missing_image' = any(r.readiness_reasons)
      or coalesce(r.primary_readiness_reason = 'missing_image', false)
    )
    and (
      not coalesce(p_missing_seo_only, false)
      or nullif(r.cms_data->>'seo_slug', '') is null
      or nullif(r.cms_data->>'seo_title', '') is null
      or nullif(r.cms_data->>'seo_description', '') is null
      or 'missing_seo' = any(r.readiness_reasons)
    )
    and (
      not coalesce(p_missing_specs_only, false)
      or 'missing_mounting_specs' = any(r.readiness_reasons)
      or 'missing_specs' = any(r.readiness_reasons)
    )
    and (
      coalesce(nullif(btrim(p_status), ''), 'all') = 'all'
      or (p_status = 'hidden' and coalesce(nullif(r.cms_data->>'is_hidden', '')::boolean, false))
      or (p_status = 'visible' and not coalesce(nullif(r.cms_data->>'is_hidden', '')::boolean, false))
      or (p_status = 'missing_price' and (coalesce(r.missing_supplier_price, false) or r.final_price_eur is null or 'missing_price' = any(r.readiness_reasons)))
      or (p_status = 'missing_image' and ('missing_image' = any(r.readiness_reasons) or coalesce(r.primary_readiness_reason = 'missing_image', false)))
      or (p_status = 'missing_specs' and ('missing_mounting_specs' = any(r.readiness_reasons) or 'missing_specs' = any(r.readiness_reasons)))
      or (p_status = 'manual_not_sellable' and public.catalog_is_rim_manual_not_sellable(coalesce(r.cms_data->'spec_overrides', '{}'::jsonb)))
    );
$function$;

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

grant execute on function public.cms_count_rims_admin_v1(
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  text
) to authenticated, service_role;
