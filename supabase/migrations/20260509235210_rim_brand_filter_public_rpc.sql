drop function if exists public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop function if exists public.catalog_count_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop function if exists public.catalog_list_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_list_rim_brands_v1();

create or replace function public.catalog_list_rim_brands_v1()
returns table (
  brand text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct coalesce(nullif(btrim(r.brand_display_name), ''), r.brand) as brand
  from public.catalog_rims_public_v1 r
  where nullif(btrim(coalesce(r.brand_display_name, r.brand)), '') is not null
  order by brand asc;
$$;

create or replace function public.catalog_rim_matches_filters(
  p_row public.catalog_rims_public_v1,
  p_search text default null,
  p_brands text[] default null,
  p_diameter numeric default null,
  p_width numeric default null,
  p_widths numeric[] default null,
  p_pcd text default null,
  p_et_offset numeric default null,
  p_center_bore_min numeric default null,
  p_color text default null,
  p_material text default null,
  p_bolts_included boolean default null,
  p_in_stock boolean default false
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    (
      nullif(btrim(coalesce(p_search, '')), '') is null
      or p_row.brand ilike '%' || btrim(p_search) || '%'
      or p_row.brand_display_name ilike '%' || btrim(p_search) || '%'
      or p_row.model ilike '%' || btrim(p_search) || '%'
      or p_row.card_title ilike '%' || btrim(p_search) || '%'
      or p_row.title ilike '%' || btrim(p_search) || '%'
      or p_row.color ilike '%' || btrim(p_search) || '%'
      or p_row.ean ilike '%' || btrim(p_search) || '%'
      or p_row.derived_ean ilike '%' || btrim(p_search) || '%'
      or public.catalog_normalize_rim_pcd(p_row.bolt_pattern) ilike '%' || public.catalog_normalize_rim_pcd(p_search) || '%'
    )
    and (
      coalesce(array_length(p_brands, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_brands) as selected_brand(brand_name)
        where lower(coalesce(nullif(btrim(p_row.brand_display_name), ''), p_row.brand)) = lower(btrim(selected_brand.brand_name))
      )
    )
    and (p_diameter is null or p_row.rim_diameter_in = p_diameter)
    and (p_width is null or p_row.width_in = p_width)
    and (coalesce(array_length(p_widths, 1), 0) = 0 or p_row.width_in = any(p_widths))
    and (
      public.catalog_normalize_rim_pcd(p_pcd) is null
      or public.catalog_normalize_rim_pcd(p_pcd) = 'all'
      or public.catalog_normalize_rim_pcd(p_row.bolt_pattern) = public.catalog_normalize_rim_pcd(p_pcd)
    )
    and (p_et_offset is null or p_row.et_offset_mm = p_et_offset)
    and (p_center_bore_min is null or p_row.center_bore_mm >= p_center_bore_min)
    and (
      nullif(btrim(coalesce(p_color, '')), '') is null
      or lower(btrim(p_color)) = 'all'
      or p_row.color ilike btrim(p_color)
    )
    and (
      nullif(btrim(coalesce(p_material, '')), '') is null
      or lower(btrim(p_material)) = 'all'
      or p_row.material ilike btrim(p_material)
      or p_row.finish ilike btrim(p_material)
    )
    and (p_bolts_included is null or p_row.bolts_included is not distinct from p_bolts_included)
    and (coalesce(p_in_stock, false) = false or p_row.in_stock = true);
$$;

create or replace function public.catalog_count_rims_v1(
  p_search text default null,
  p_brands text[] default null,
  p_diameter numeric default null,
  p_width numeric default null,
  p_widths numeric[] default null,
  p_pcd text default null,
  p_et_offset numeric default null,
  p_center_bore_min numeric default null,
  p_color text default null,
  p_material text default null,
  p_bolts_included boolean default null,
  p_in_stock boolean default false
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.catalog_rims_public_v1 r
  where public.catalog_rim_matches_filters(
    r, p_search, p_brands, p_diameter, p_width, p_widths, p_pcd, p_et_offset, p_center_bore_min,
    p_color, p_material, p_bolts_included, p_in_stock
  );
$$;

create or replace function public.catalog_list_rims_v1(
  p_search text default null,
  p_brands text[] default null,
  p_diameter numeric default null,
  p_width numeric default null,
  p_widths numeric[] default null,
  p_pcd text default null,
  p_et_offset numeric default null,
  p_center_bore_min numeric default null,
  p_color text default null,
  p_material text default null,
  p_bolts_included boolean default null,
  p_in_stock boolean default false,
  p_sort_by text default 'price_asc',
  p_limit integer default 24,
  p_offset integer default 0
)
returns setof public.catalog_rims_public_v1
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.catalog_rims_public_v1 r
  where public.catalog_rim_matches_filters(
    r, p_search, p_brands, p_diameter, p_width, p_widths, p_pcd, p_et_offset, p_center_bore_min,
    p_color, p_material, p_bolts_included, p_in_stock
  )
  order by
    case when coalesce(p_sort_by, 'price_asc') = 'price_desc' then r.final_price_eur end desc nulls last,
    case when coalesce(p_sort_by, 'price_asc') = 'price_desc' then r.price end desc nulls last,
    case when coalesce(p_sort_by, 'price_asc') = 'price_asc' then r.final_price_eur end asc nulls last,
    case when coalesce(p_sort_by, 'price_asc') = 'price_asc' then r.price end asc nulls last,
    r.brand_display_name asc,
    r.model asc,
    r.variant_id asc
  limit greatest(coalesce(p_limit, 24), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.catalog_list_rim_brands_v1() from public;
grant execute on function public.catalog_list_rim_brands_v1() to anon, authenticated;

revoke all on function public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to service_role;

revoke all on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated;

revoke all on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) to anon, authenticated;
