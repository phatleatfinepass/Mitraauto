-- Phase 8: public generated rim tags and deterministic CMS badge merge.

set lock_timeout = '5s';
set statement_timeout = '60s';

create or replace function public.catalog_jsonb_text_tags_distinct(p_tags text[])
returns jsonb
language sql
immutable
set search_path = public
as $$
  with cleaned as (
    select
      nullif(btrim(tag), '') as tag,
      ord
    from unnest(coalesce(p_tags, '{}'::text[])) with ordinality as input(tag, ord)
  ),
  first_seen as (
    select distinct on (lower(tag))
      tag,
      ord
    from cleaned
    where tag is not null
    order by lower(tag), ord
  )
  select coalesce(jsonb_agg(tag order by ord), '[]'::jsonb)
  from first_seen;
$$;

create or replace function public.catalog_merge_jsonb_text_tags(
  p_primary jsonb,
  p_secondary jsonb
)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select public.catalog_jsonb_text_tags_distinct(array(
    select value
    from jsonb_array_elements_text(
      case when jsonb_typeof(coalesce(p_primary, '[]'::jsonb)) = 'array' then coalesce(p_primary, '[]'::jsonb) else '[]'::jsonb end
    ) as primary_tags(value)
    union all
    select value
    from jsonb_array_elements_text(
      case when jsonb_typeof(coalesce(p_secondary, '[]'::jsonb)) = 'array' then coalesce(p_secondary, '[]'::jsonb) else '[]'::jsonb end
    ) as secondary_tags(value)
  ));
$$;

create or replace function public.catalog_build_rim_generated_tags(
  p_width_in numeric,
  p_diameter_in numeric,
  p_bolt_pattern text,
  p_et_offset_mm numeric,
  p_center_bore_mm numeric,
  p_in_stock boolean,
  p_material text,
  p_bolts_included boolean,
  p_winter_approved boolean,
  p_wheel_load_kg numeric,
  p_color text,
  p_finish text
)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select public.catalog_jsonb_text_tags_distinct(array_remove(array[
    case when p_diameter_in is not null then public.catalog_selected_compact_numeric(p_diameter_in) || '"' end,
    case when p_width_in is not null then public.catalog_selected_compact_numeric(p_width_in) || 'J' end,
    public.catalog_format_rim_pcd_for_display(p_bolt_pattern),
    case when p_et_offset_mm is not null then 'ET' || public.catalog_selected_compact_numeric(p_et_offset_mm) end,
    case when p_center_bore_mm is not null then 'CB' || public.catalog_selected_compact_numeric(p_center_bore_mm) end,
    case when coalesce(p_in_stock, false) then 'In stock' end,
    case
      when nullif(btrim(coalesce(p_material, '')), '') is null then null
      when lower(btrim(p_material)) in ('alloy', 'alumiini', 'aluminum', 'aluminium', 'kevytmetalli') then 'Alloy'
      when lower(btrim(p_material)) in ('steel', 'teräs', 'teras') then 'Steel'
      else initcap(btrim(p_material))
    end,
    case when coalesce(p_bolts_included, false) then 'Bolts included' end,
    case when coalesce(p_winter_approved, false) then 'Winter approved' end,
    case when p_wheel_load_kg is not null then 'Load ' || public.catalog_selected_compact_numeric(p_wheel_load_kg) || ' kg' end,
    case when nullif(btrim(coalesce(p_color, '')), '') is not null then initcap(btrim(p_color)) end,
    case when nullif(btrim(coalesce(p_finish, '')), '') is not null then initcap(btrim(p_finish)) end
  ]::text[], null));
$$;

revoke all on function public.catalog_jsonb_text_tags_distinct(text[]) from public;
grant execute on function public.catalog_jsonb_text_tags_distinct(text[]) to anon, authenticated, service_role;

revoke all on function public.catalog_merge_jsonb_text_tags(jsonb, jsonb) from public;
grant execute on function public.catalog_merge_jsonb_text_tags(jsonb, jsonb) to anon, authenticated, service_role;

revoke all on function public.catalog_build_rim_generated_tags(numeric, numeric, text, numeric, numeric, boolean, text, boolean, boolean, numeric, text, text) from public;
grant execute on function public.catalog_build_rim_generated_tags(numeric, numeric, text, numeric, numeric, boolean, text, boolean, boolean, numeric, text, text) to anon, authenticated, service_role;

drop function if exists public.catalog_get_rim_by_identifier_v1(text);
drop function if exists public.catalog_list_rim_brands_v1();
drop function if exists public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop function if exists public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop view if exists public.catalog_rims_public_v1;

create or replace view public.catalog_rims_public_v1 as
select
  w.variant_id,
  w.product_type,
  w.brand,
  coalesce(nullif(w.brand_display_name, ''), w.brand) as brand_display_name,
  w.brand_logo_url,
  w.model,
  w.size_string,
  w.season,
  w.studded,
  w.runflat,
  w.xl_reinforced,
  w.load_index::text as load_index,
  w.speed_rating,
  w.speed_index,
  w.ev_ready,
  w.sound_absorber,
  w.threepmsf,
  w.winter_approved,
  w.ice_approved,
  w.width_mm,
  w.aspect_ratio,
  w.diameter_in,
  w.width_in,
  w.rim_diameter_in,
  w.et_offset_mm,
  w.bolt_pattern,
  coalesce(w.center_bore_mm, w.cb_mm) as center_bore_mm,
  coalesce(w.cb_mm, w.center_bore_mm) as cb_mm,
  w.color,
  w.finish,
  coalesce(nullif(w.material, ''), nullif(w.finish, '')) as material,
  w.bolts_included,
  w.wheel_load_kg,
  w.price,
  coalesce(w.final_price_eur, w.price) as final_price_eur,
  w.currency,
  coalesce(w.in_stock, false) as in_stock,
  w.stock_qty,
  w.delivery_days_min,
  w.delivery_days_max,
  w.supplier_code_best,
  w.supplier_external_id_best,
  coalesce(nullif(w.best_image_url, ''), nullif(w.hero_image_url, '')) as best_image_url,
  coalesce(nullif(w.hero_image_url, ''), nullif(w.best_image_url, '')) as hero_image_url,
  case
    when jsonb_typeof(coalesce(w.gallery, '[]'::jsonb)) = 'array' then coalesce(w.gallery, '[]'::jsonb)
    when nullif(w.hero_image_url, '') is not null then jsonb_build_array(w.hero_image_url)
    when nullif(w.best_image_url, '') is not null then jsonb_build_array(w.best_image_url)
    else '[]'::jsonb
  end as gallery,
  w.best_image_alt,
  w.card_title,
  w.card_title as title,
  w.subtitle,
  w.short_description,
  w.long_description,
  gt.generated_tags,
  public.catalog_merge_jsonb_text_tags(gt.generated_tags, coalesce(cms.cms_data->'badges', '[]'::jsonb)) as tags,
  w.seo_slug,
  w.seo_title,
  w.seo_description,
  w.eu_label_json,
  null::text as eu_fuel,
  w.eu_wet,
  w.eu_noise,
  false as final_is_hidden,
  w.ean,
  w.derived_ean,
  w.manufacture_year,
  w.pricing_rules,
  coalesce(w.spec_overrides, '{}'::jsonb) as spec_overrides
from public.webshop_items w
left join public.catalog_selected_rims_cms_admin_v1 cms
  on cms.variant_id = w.variant_id
cross join lateral (
  select public.catalog_build_rim_generated_tags(
    w.width_in,
    w.rim_diameter_in,
    w.bolt_pattern,
    w.et_offset_mm,
    coalesce(w.center_bore_mm, w.cb_mm),
    w.in_stock,
    coalesce(nullif(w.material, ''), nullif(w.finish, '')),
    w.bolts_included,
    w.winter_approved,
    w.wheel_load_kg,
    w.color,
    w.finish
  ) as generated_tags
) gt
where w.product_type = 'rim'
  and w.is_visible
  and w.publish_status = 'published';

grant select on public.catalog_rims_public_v1 to anon, authenticated, service_role;

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
      or p_row.size_string ilike '%' || btrim(p_search) || '%'
      or p_row.card_title ilike '%' || btrim(p_search) || '%'
      or p_row.title ilike '%' || btrim(p_search) || '%'
      or p_row.color ilike '%' || btrim(p_search) || '%'
      or p_row.ean ilike '%' || btrim(p_search) || '%'
      or p_row.derived_ean ilike '%' || btrim(p_search) || '%'
      or public.catalog_normalize_rim_pcd(p_row.bolt_pattern) ilike '%' || public.catalog_normalize_rim_pcd(p_search) || '%'
      or p_row.tags::text ilike '%' || btrim(p_search) || '%'
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
      or p_row.finish ilike btrim(p_color)
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
    case when coalesce(p_sort_by, 'price_asc') = 'price_asc' then r.final_price_eur end asc nulls last,
    case when p_sort_by = 'brand_desc' then r.brand_display_name end desc,
    case when p_sort_by in ('brand_asc', 'default') then r.brand_display_name end asc,
    r.brand_display_name asc,
    r.model asc,
    r.rim_diameter_in asc nulls last,
    r.width_in asc nulls last,
    r.variant_id asc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.catalog_get_rim_by_identifier_v1(p_identifier text)
returns setof public.catalog_rims_public_v1
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.catalog_rims_public_v1 r
  where nullif(btrim(coalesce(p_identifier, '')), '') is not null
    and (
      r.variant_id::text = btrim(p_identifier)
      or r.seo_slug = btrim(p_identifier)
      or r.ean = btrim(p_identifier)
      or r.derived_ean = btrim(p_identifier)
    )
  order by
    case when r.variant_id::text = btrim(p_identifier) then 0 else 1 end,
    r.variant_id
  limit 1;
$$;

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
  order by 1 asc;
$$;

revoke all on function public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to service_role;

revoke all on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated, service_role;

revoke all on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) to anon, authenticated, service_role;

revoke all on function public.catalog_get_rim_by_identifier_v1(text) from public;
grant execute on function public.catalog_get_rim_by_identifier_v1(text) to anon, authenticated, service_role;

revoke all on function public.catalog_list_rim_brands_v1() from public;
grant execute on function public.catalog_list_rim_brands_v1() to anon, authenticated, service_role;
