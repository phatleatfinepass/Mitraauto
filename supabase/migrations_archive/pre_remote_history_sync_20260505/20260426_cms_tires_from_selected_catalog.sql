-- Wire Tire CMS reads to the new selected tire catalog, without publishing it
-- to the webshop yet. Existing product_cms overrides are preserved by direct
-- selected-id match first, then by legacy tire EAN match.

drop function if exists public.catalog_selected_tire_cms_matches_filters(public.catalog_selected_tires_cms_admin_v1, text[], boolean, text[]);
drop view if exists public.catalog_selected_tires_cms_admin_v1;

create view public.catalog_selected_tires_cms_admin_v1 as
with selected as (
  select *
  from public.catalog_selected_items
  where product_type = 'tire'
    and is_available
),
legacy_cms_by_ean as (
  select distinct on (legacy_source.legacy_ean)
    legacy_source.*
  from (
    select
      nullif(regexp_replace(coalesce(ps.ean, ps.derived_ean, ''), '\D', '', 'g'), '') as legacy_ean,
      pc.*
    from public.product_cms pc
    join public.products_search ps
      on ps.variant_id = pc.variant_id
     and ps.product_type = 'tire'
  ) legacy_source
  where legacy_ean is not null
  order by legacy_ean, variant_id
),
rows as (
  select
    s.*,
    coalesce(pc_direct.title, pc_legacy.title) as cms_title,
    coalesce(pc_direct.subtitle, pc_legacy.subtitle) as cms_subtitle,
    coalesce(pc_direct.short_description, pc_legacy.short_description) as cms_short_description,
    coalesce(pc_direct.long_description, pc_legacy.long_description) as cms_long_description,
    coalesce(pc_direct.hero_image_url, pc_legacy.hero_image_url) as cms_hero_image_url,
    coalesce(pc_direct.gallery, pc_legacy.gallery) as cms_gallery,
    coalesce(pc_direct.seo_slug, pc_legacy.seo_slug) as cms_seo_slug,
    coalesce(pc_direct.seo_title, pc_legacy.seo_title) as cms_seo_title,
    coalesce(pc_direct.seo_description, pc_legacy.seo_description) as cms_seo_description,
    coalesce(pc_direct.is_hidden, pc_legacy.is_hidden) as cms_is_hidden,
    coalesce(pc_direct.spec_overrides, pc_legacy.spec_overrides) as cms_spec_overrides,
    coalesce(pc_direct.price_override_eur, pc_legacy.price_override_eur) as cms_price_override_eur,
    coalesce(pc_direct.promo_enabled, pc_legacy.promo_enabled) as cms_promo_enabled,
    coalesce(pc_direct.promo_price_eur, pc_legacy.promo_price_eur) as cms_promo_price_eur,
    coalesce(pc_direct.promo_start, pc_legacy.promo_start) as cms_promo_start,
    coalesce(pc_direct.promo_end, pc_legacy.promo_end) as cms_promo_end,
    coalesce(pc_direct.variant_id, pc_legacy.variant_id) as cms_source_variant_id
  from selected s
  left join public.product_cms pc_direct
    on pc_direct.variant_id = s.id
  left join legacy_cms_by_ean pc_legacy
    on pc_direct.variant_id is null
   and s.ean is not null
   and pc_legacy.legacy_ean = s.ean
)
select
  id as variant_id,
  product_type,
  ean as derived_ean,
  selected_supplier as supplier_code_best,
  selected_external_id as supplier_external_id_best,
  brand,
  model,
  size_string,
  season,
  studded,
  runflat,
  xl_reinforced,
  load_index,
  speed_rating,
  speed_rating as speed_index,
  ev_ready,
  threepmsf,
  winter_approved,
  ice_approved,
  eu_wet_grip_class as eu_wet,
  eu_noise_db::numeric as eu_noise,
  eu_label_json,
  fair_cost_ex_vat as final_price_eur,
  fair_cost_ex_vat as price,
  conflict_status <> 'resolved' as ean_conflict_open,
  width_mm,
  aspect_ratio,
  diameter_in,
  ean,
  false as has_ean_multi_spec_conflict,
  conflict_status <> 'resolved' as has_mandatory_conflict,
  fair_cost_ex_vat is null as missing_supplier_price,
  false as is_non_passenger_auto,
  coalesce((cms_spec_overrides->'classification'->>'non_passenger_manual')::boolean, false) as is_non_passenger_manual,
  coalesce((cms_spec_overrides->'classification'->>'non_passenger_manual')::boolean, false) as is_non_passenger,
  case
    when cms_source_variant_id is null then null
    else jsonb_build_object(
      'variant_id', id,
      'legacy_variant_id', cms_source_variant_id,
      'title', cms_title,
      'subtitle', cms_subtitle,
      'short_description', cms_short_description,
      'long_description', cms_long_description,
      'hero_image_url', cms_hero_image_url,
      'gallery', coalesce(cms_gallery, '[]'::jsonb),
      'seo_slug', cms_seo_slug,
      'seo_title', cms_seo_title,
      'seo_description', cms_seo_description,
      'is_hidden', coalesce(cms_is_hidden, false),
      'spec_overrides', coalesce(cms_spec_overrides, '{}'::jsonb),
      'price_override_eur', cms_price_override_eur,
      'promo_enabled', coalesce(cms_promo_enabled, false),
      'promo_price_eur', cms_promo_price_eur,
      'promo_start', cms_promo_start,
      'promo_end', cms_promo_end
    )
  end as cms_data
from rows;

create or replace function public.catalog_selected_tire_cms_matches_filters(
  p_row public.catalog_selected_tires_cms_admin_v1,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_missing_seo_fields text[] default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    (
      coalesce(array_length(p_missing_metadata_fields, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_missing_metadata_fields) as selected_field(field_name)
        where case selected_field.field_name
          when 'brand' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'brand', p_row.brand)), '') is null
          when 'model' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'model', p_row.model)), '') is null
          when 'ean' then nullif(regexp_replace(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'ean', p_row.derived_ean, p_row.ean, ''), '\D', '', 'g'), '') is null
          when 'size' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'size_string', p_row.size_string)), '') is null
          when 'season' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'season', p_row.season)), '') is null
          when 'ev_ready' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'ev_ready')::boolean, p_row.ev_ready, false) = false
          when 'runflat' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'runflat')::boolean, p_row.runflat, false) = false
          when 'xl' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'xl')::boolean, p_row.xl_reinforced, false) = false
          when 'studded' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'studded')::boolean, p_row.studded, false) = false
          when 'threepmsf' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'threepmsf')::boolean, p_row.threepmsf, false) = false
          when 'winter_approved' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'winter_approved')::boolean, p_row.winter_approved, false) = false
          when 'ice_approved' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'ice_approved')::boolean, p_row.ice_approved, false) = false
          when 'eu_fuel_class' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'eu'->>'fuel_class', p_row.eu_label_json->>'fuel_class')), '') is null
          when 'eu_wet_grip_class' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'eu'->>'wet_grip_class', p_row.eu_wet)), '') is null
          when 'eu_noise_db' then coalesce((p_row.cms_data->'spec_overrides'->'eu'->>'noise_db')::numeric, p_row.eu_noise) is null
          when 'eu_noise_class' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'eu'->>'noise_class', p_row.eu_label_json->>'noise_class')), '') is null
          else false
        end
      )
    )
    and (
      not p_missing_image_only
      or (
        nullif(btrim(coalesce(p_row.cms_data->>'hero_image_url', '')), '') is null
        and case
          when jsonb_typeof(coalesce(p_row.cms_data->'gallery', '[]'::jsonb)) = 'array'
            then jsonb_array_length(coalesce(p_row.cms_data->'gallery', '[]'::jsonb)) = 0
          else true
        end
      )
    )
    and (
      coalesce(array_length(p_missing_seo_fields, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_missing_seo_fields) as selected_field(field_name)
        where case selected_field.field_name
          when 'title' then nullif(btrim(coalesce(p_row.cms_data->>'title', '')), '') is null
          when 'subtitle' then nullif(btrim(coalesce(p_row.cms_data->>'subtitle', '')), '') is null
          when 'short_description' then nullif(btrim(coalesce(p_row.cms_data->>'short_description', '')), '') is null
          when 'long_description' then nullif(btrim(coalesce(p_row.cms_data->>'long_description', '')), '') is null
          when 'seo_slug' then nullif(btrim(coalesce(p_row.cms_data->>'seo_slug', '')), '') is null
          when 'seo_title' then nullif(btrim(coalesce(p_row.cms_data->>'seo_title', '')), '') is null
          when 'seo_description' then nullif(btrim(coalesce(p_row.cms_data->>'seo_description', '')), '') is null
          else false
        end
      )
    );
$$;

drop function if exists public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[]);
drop function if exists public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer);
drop function if exists public.cms_get_tire_admin_pricing_v1(uuid);

create or replace function public.cms_count_tires_admin_v1(
  p_search text default null,
  p_missing_ean_only boolean default false,
  p_exclude_non_passenger boolean default true,
  p_supplier_code text default null,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_missing_seo_fields text[] default null
)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)
  from public.catalog_selected_tires_cms_admin_v1 mv
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || p_search || '%'
    or mv.model ilike '%' || p_search || '%'
    or mv.size_string ilike '%' || p_search || '%'
    or coalesce(mv.derived_ean, mv.ean, '') ilike '%' || p_search || '%'
  )
    and (not p_exclude_non_passenger or coalesce(mv.is_non_passenger, false) = false)
    and (p_supplier_code is null or btrim(p_supplier_code) = '' or upper(coalesce(mv.supplier_code_best, '')) = upper(btrim(p_supplier_code)))
    and (not p_missing_ean_only or coalesce(mv.derived_ean, mv.ean) is null)
    and public.catalog_selected_tire_cms_matches_filters(mv, p_missing_metadata_fields, p_missing_image_only, p_missing_seo_fields);
$$;

create or replace function public.cms_list_tires_admin_v1(
  p_search text default null,
  p_missing_ean_only boolean default false,
  p_exclude_non_passenger boolean default true,
  p_supplier_code text default null,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_missing_seo_fields text[] default null,
  p_limit integer default 26,
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
  season text,
  studded boolean,
  runflat boolean,
  xl_reinforced boolean,
  load_index text,
  speed_rating text,
  speed_index text,
  ev_ready boolean,
  threepmsf boolean,
  winter_approved boolean,
  ice_approved boolean,
  eu_wet text,
  eu_noise numeric,
  eu_label_json jsonb,
  final_price_eur numeric,
  price numeric,
  ean_conflict_open boolean,
  width_mm numeric,
  aspect_ratio numeric,
  diameter_in numeric,
  ean text,
  has_ean_multi_spec_conflict boolean,
  has_mandatory_conflict boolean,
  missing_supplier_price boolean,
  is_non_passenger_auto boolean,
  is_non_passenger_manual boolean,
  is_non_passenger boolean,
  cms_data jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    mv.variant_id,
    mv.product_type,
    mv.derived_ean,
    mv.supplier_code_best,
    mv.supplier_external_id_best,
    mv.brand,
    mv.model,
    mv.size_string,
    mv.season,
    mv.studded,
    mv.runflat,
    mv.xl_reinforced,
    mv.load_index,
    mv.speed_rating,
    mv.speed_index,
    mv.ev_ready,
    mv.threepmsf,
    mv.winter_approved,
    mv.ice_approved,
    mv.eu_wet,
    mv.eu_noise,
    mv.eu_label_json,
    mv.final_price_eur,
    mv.price,
    mv.ean_conflict_open,
    mv.width_mm,
    mv.aspect_ratio,
    mv.diameter_in,
    mv.ean,
    mv.has_ean_multi_spec_conflict,
    mv.has_mandatory_conflict,
    mv.missing_supplier_price,
    mv.is_non_passenger_auto,
    mv.is_non_passenger_manual,
    mv.is_non_passenger,
    mv.cms_data
  from public.catalog_selected_tires_cms_admin_v1 mv
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || p_search || '%'
    or mv.model ilike '%' || p_search || '%'
    or mv.size_string ilike '%' || p_search || '%'
    or coalesce(mv.derived_ean, mv.ean, '') ilike '%' || p_search || '%'
  )
    and (not p_exclude_non_passenger or coalesce(mv.is_non_passenger, false) = false)
    and (p_supplier_code is null or btrim(p_supplier_code) = '' or upper(coalesce(mv.supplier_code_best, '')) = upper(btrim(p_supplier_code)))
    and (not p_missing_ean_only or coalesce(mv.derived_ean, mv.ean) is null)
    and public.catalog_selected_tire_cms_matches_filters(mv, p_missing_metadata_fields, p_missing_image_only, p_missing_seo_fields)
  order by mv.brand asc, mv.model asc, mv.size_string asc, mv.variant_id asc
  limit greatest(coalesce(p_limit, 26), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.cms_get_tire_admin_pricing_v1(
  p_variant_id uuid
)
returns table (
  variant_id uuid,
  supplier_code_best text,
  supplier_external_id_best text,
  catalog_price_ex_vat numeric,
  current_catalog_effective_price_ex_vat numeric,
  wholesale_price_ex_vat numeric,
  consumer_price_ex_vat numeric,
  raw_net_price_ex_vat numeric,
  raw_price_ex_vat numeric,
  raw_retail_price_inc_vat numeric,
  recycling_fee_ex_vat numeric,
  rd_effective_price_ex_vat numeric
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as variant_id,
    s.selected_supplier as supplier_code_best,
    s.selected_external_id as supplier_external_id_best,
    s.fair_cost_ex_vat as catalog_price_ex_vat,
    coalesce(pc.price_override_eur, s.fair_cost_ex_vat) as current_catalog_effective_price_ex_vat,
    s.wholesale_price_eur as wholesale_price_ex_vat,
    s.consumer_price_eur as consumer_price_ex_vat,
    case when s.selected_supplier = 'RD' then s.raw_supplier_price_ex_vat else null end as raw_net_price_ex_vat,
    s.raw_supplier_price_ex_vat as raw_price_ex_vat,
    s.retail_price_eur as raw_retail_price_inc_vat,
    s.recycling_fee_eur as recycling_fee_ex_vat,
    case when s.selected_supplier = 'RD' then s.fair_cost_ex_vat else null end as rd_effective_price_ex_vat
  from public.catalog_selected_items s
  left join public.product_cms pc
    on pc.variant_id = s.id
  where s.product_type = 'tire'
    and s.is_available
    and s.id = p_variant_id
  limit 1;
$$;

revoke all on function public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[]) from public;
grant execute on function public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[]) to authenticated;

revoke all on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer) from public;
grant execute on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer) to authenticated;

revoke all on function public.cms_get_tire_admin_pricing_v1(uuid) from public;
grant execute on function public.cms_get_tire_admin_pricing_v1(uuid) to authenticated;
