-- Phase 7: dynamic storefront rim filter options from the published webshop layer.

set lock_timeout = '5s';
set statement_timeout = '60s';

create or replace function public.catalog_format_rim_pcd_for_display(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(replace(public.catalog_normalize_rim_pcd(p_value), '.', ','), '');
$$;

create or replace function public.catalog_list_rim_filter_options_v1()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select *
    from public.webshop_items
    where product_type = 'rim'
      and is_visible
      and publish_status = 'published'
  ),
  diameters as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct rim_diameter_in as value
      from base
      where rim_diameter_in is not null
    ) rows
  ),
  widths as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct width_in as value
      from base
      where width_in is not null
    ) rows
  ),
  pcds as (
    select jsonb_agg(jsonb_build_object('value', value, 'label', label, 'count', row_count) order by holes, pitch, value) as items
    from (
      select
        public.catalog_format_rim_pcd_for_display(bolt_pattern) as value,
        public.catalog_format_rim_pcd_for_display(bolt_pattern) as label,
        nullif(split_part(public.catalog_normalize_rim_pcd(bolt_pattern), 'x', 1), '')::numeric as holes,
        nullif(split_part(public.catalog_normalize_rim_pcd(bolt_pattern), 'x', 2), '')::numeric as pitch,
        count(*) as row_count
      from base
      where public.catalog_normalize_rim_pcd(bolt_pattern) is not null
      group by value, label, holes, pitch
    ) rows
  ),
  et_offsets as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct et_offset_mm as value
      from base
      where et_offset_mm is not null
    ) rows
  ),
  center_bores as (
    select jsonb_agg(value order by value) as items
    from (
      select distinct center_bore_mm as value
      from base
      where center_bore_mm is not null
    ) rows
  ),
  brands as (
    select jsonb_agg(value order by lower(value), value) as items
    from (
      select distinct coalesce(nullif(btrim(brand_display_name), ''), brand) as value
      from base
      where nullif(btrim(coalesce(brand_display_name, brand)), '') is not null
    ) rows
  )
  select jsonb_build_object(
    'diameters', coalesce((select items from diameters), '[]'::jsonb),
    'widths', coalesce((select items from widths), '[]'::jsonb),
    'pcds', coalesce((select items from pcds), '[]'::jsonb),
    'et_offsets', coalesce((select items from et_offsets), '[]'::jsonb),
    'center_bores', coalesce((select items from center_bores), '[]'::jsonb),
    'brands', coalesce((select items from brands), '[]'::jsonb)
  );
$$;

revoke all on function public.catalog_format_rim_pcd_for_display(text) from public;
grant execute on function public.catalog_format_rim_pcd_for_display(text) to anon, authenticated, service_role;

revoke all on function public.catalog_list_rim_filter_options_v1() from public;
grant execute on function public.catalog_list_rim_filter_options_v1() to anon, authenticated, service_role;
