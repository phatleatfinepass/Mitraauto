drop function if exists public.cms_tire_admin_matches_audit_filters(public.cms_tires_admin_mv, text[], boolean, text[]);
drop function if exists public.cms_count_tires_admin_v1(text, boolean, boolean, text);
drop function if exists public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[]);
drop function if exists public.cms_list_tires_admin_v1(text, boolean, boolean, text, integer, integer);
drop function if exists public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer);
drop function if exists public.refresh_cms_tires_admin_mv();
drop materialized view if exists public.cms_tires_admin_mv;

create materialized view public.cms_tires_admin_mv as
select
  ps.variant_id,
  ps.product_type,
  coalesce(nullif(ps.derived_ean, ''), nullif(ctv.ean, '')) as derived_ean,
  ps.supplier_code_best,
  ps.supplier_external_id_best,
  ps.brand,
  ps.model,
  ps.size_string,
  ps.season,
  ps.studded,
  ps.runflat,
  ps.xl_reinforced,
  ps.load_index::text as load_index,
  ps.speed_rating,
  ps.speed_index,
  ps.ev_ready,
  ps.threepmsf,
  ps.winter_approved,
  ps.ice_approved,
  ps.eu_wet,
  nullif(regexp_replace(coalesce(ps.eu_noise::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as eu_noise,
  ps.eu_label_json,
  ps.final_price_eur,
  ps.price,
  ps.ean_conflict_open,
  ps.width_mm,
  ps.aspect_ratio,
  ps.diameter_in,
  coalesce(ps.ean, ctv.ean) as ean,
  coalesce(ps.has_ean_multi_spec_conflict, false) as has_ean_multi_spec_conflict,
  coalesce(ps.has_mandatory_conflict, false) as has_mandatory_conflict,
  coalesce(ps.missing_supplier_price, false) as missing_supplier_price,
  coalesce(ps.is_non_passenger_auto, false) as is_non_passenger_auto,
  coalesce(ps.is_non_passenger_manual, false) as is_non_passenger_manual,
  coalesce(ps.is_non_passenger, false) as is_non_passenger,
  case
    when pc.variant_id is null then null
    else jsonb_build_object(
      'variant_id', pc.variant_id,
      'title', pc.title,
      'subtitle', pc.subtitle,
      'short_description', pc.short_description,
      'long_description', pc.long_description,
      'hero_image_url', pc.hero_image_url,
      'gallery', pc.gallery,
      'seo_slug', pc.seo_slug,
      'seo_title', pc.seo_title,
      'seo_description', pc.seo_description,
      'is_hidden', pc.is_hidden,
      'spec_overrides', pc.spec_overrides,
      'price_override_eur', pc.price_override_eur,
      'promo_enabled', pc.promo_enabled,
      'promo_price_eur', pc.promo_price_eur,
      'promo_start', pc.promo_start,
      'promo_end', pc.promo_end
    )
  end as cms_data
from public.products_search ps
left join public.catalog_tire_variants ctv
  on ctv.id = ps.variant_id
left join public.product_cms pc
  on pc.variant_id = ps.variant_id
where ps.product_type = 'tire';

create unique index cms_tires_admin_mv_variant_id_idx
  on public.cms_tires_admin_mv (variant_id);

create index cms_tires_admin_mv_supplier_variant_idx
  on public.cms_tires_admin_mv (supplier_code_best, variant_id);

create index cms_tires_admin_mv_non_passenger_variant_idx
  on public.cms_tires_admin_mv (is_non_passenger, variant_id);

create index cms_tires_admin_mv_missing_ean_variant_idx
  on public.cms_tires_admin_mv (variant_id)
  where derived_ean is null or derived_ean like 'EANMISSING_%';

create extension if not exists pg_trgm;

create index cms_tires_admin_mv_brand_trgm_idx
  on public.cms_tires_admin_mv using gin (brand gin_trgm_ops);

create index cms_tires_admin_mv_model_trgm_idx
  on public.cms_tires_admin_mv using gin (model gin_trgm_ops);

create index cms_tires_admin_mv_size_trgm_idx
  on public.cms_tires_admin_mv using gin (size_string gin_trgm_ops);

create index cms_tires_admin_mv_ean_trgm_idx
  on public.cms_tires_admin_mv using gin (derived_ean gin_trgm_ops);

create or replace function public.refresh_cms_tires_admin_mv()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  refresh materialized view public.cms_tires_admin_mv;
end;
$$;

revoke all on function public.refresh_cms_tires_admin_mv() from public;
grant execute on function public.refresh_cms_tires_admin_mv() to authenticated;

create or replace function public.cms_tire_admin_matches_audit_filters(
  p_row public.cms_tires_admin_mv,
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
          when 'ean' then
            coalesce(
              nullif(regexp_replace(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
              nullif(btrim(coalesce(p_row.derived_ean, p_row.ean)), '')
            ) is null
            or coalesce(
              nullif(regexp_replace(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
              nullif(btrim(coalesce(p_row.derived_ean, p_row.ean)), '')
            ) like 'EANMISSING_%'
          when 'size' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'size_string', p_row.size_string)), '') is null
          when 'season' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'season', p_row.season)), '') is null
          when 'ev_ready' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'ev_ready')::boolean, p_row.ev_ready, false) = false
          when 'runflat' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'runflat')::boolean, p_row.runflat, false) = false
          when 'xl' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'xl')::boolean, p_row.xl_reinforced, false) = false
          when 'studded' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'studded')::boolean, p_row.studded, false) = false
          when 'threepmsf' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'threepmsf')::boolean, p_row.threepmsf, false) = false
          when 'winter_approved' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'winter_approved')::boolean, p_row.winter_approved, false) = false
          when 'ice_approved' then coalesce((p_row.cms_data->'spec_overrides'->'features'->>'ice_approved')::boolean, p_row.ice_approved, false) = false
          when 'eu_fuel_class' then nullif(
            btrim(
              coalesce(
                p_row.cms_data->'spec_overrides'->'eu'->>'fuel_class',
                upper(coalesce(
                  p_row.eu_label_json->>'fuel',
                  p_row.eu_label_json->>'fuel_class',
                  p_row.eu_label_json->>'fuelclass',
                  p_row.eu_label_json->>'fuelefficiency',
                  p_row.eu_label_json->>'fuel_efficiency',
                  p_row.eu_label_json->>'rrc',
                  p_row.eu_label_json->>'rolling_resistance',
                  p_row.eu_label_json->>'energy'
                ))
              )
            ),
            ''
          ) is null
          when 'eu_wet_grip_class' then nullif(
            btrim(coalesce(p_row.cms_data->'spec_overrides'->'eu'->>'wet_grip_class', p_row.eu_wet)),
            ''
          ) is null
          when 'eu_noise_db' then coalesce((p_row.cms_data->'spec_overrides'->'eu'->>'noise_db')::numeric, p_row.eu_noise) is null
          when 'eu_noise_class' then nullif(
            btrim(
              coalesce(
                p_row.cms_data->'spec_overrides'->'eu'->>'noise_class',
                p_row.eu_label_json->>'noise_class',
                p_row.eu_label_json->>'noiseClass',
                p_row.eu_label_json->>'external_noise_class',
                p_row.eu_label_json->>'externalNoiseClass'
              )
            ),
            ''
          ) is null
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
  from public.cms_tires_admin_mv mv
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || p_search || '%'
    or mv.model ilike '%' || p_search || '%'
    or mv.size_string ilike '%' || p_search || '%'
    or coalesce(mv.derived_ean, mv.ean, '') ilike '%' || p_search || '%'
  )
    and (
      not p_exclude_non_passenger
      or coalesce(mv.is_non_passenger, false) = false
    )
    and (
      p_supplier_code is null
      or btrim(p_supplier_code) = ''
      or upper(coalesce(mv.supplier_code_best, '')) = upper(btrim(p_supplier_code))
    )
    and (
      not p_missing_ean_only
      or coalesce(mv.derived_ean, mv.ean) is null
      or coalesce(mv.derived_ean, mv.ean) like 'EANMISSING_%'
    )
    and public.cms_tire_admin_matches_audit_filters(
      mv,
      p_missing_metadata_fields,
      p_missing_image_only,
      p_missing_seo_fields
    );
$$;

revoke all on function public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[]) from public;
grant execute on function public.cms_count_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[]) to authenticated;

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
  from public.cms_tires_admin_mv mv
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || p_search || '%'
    or mv.model ilike '%' || p_search || '%'
    or mv.size_string ilike '%' || p_search || '%'
    or coalesce(mv.derived_ean, mv.ean, '') ilike '%' || p_search || '%'
  )
    and (
      not p_exclude_non_passenger
      or coalesce(mv.is_non_passenger, false) = false
    )
    and (
      p_supplier_code is null
      or btrim(p_supplier_code) = ''
      or upper(coalesce(mv.supplier_code_best, '')) = upper(btrim(p_supplier_code))
    )
    and (
      not p_missing_ean_only
      or coalesce(mv.derived_ean, mv.ean) is null
      or coalesce(mv.derived_ean, mv.ean) like 'EANMISSING_%'
    )
    and public.cms_tire_admin_matches_audit_filters(
      mv,
      p_missing_metadata_fields,
      p_missing_image_only,
      p_missing_seo_fields
    )
  order by mv.variant_id asc
  limit greatest(coalesce(p_limit, 26), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer) from public;
grant execute on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer) to authenticated;
