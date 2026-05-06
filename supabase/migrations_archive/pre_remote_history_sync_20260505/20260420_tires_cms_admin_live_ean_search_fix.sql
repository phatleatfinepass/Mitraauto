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
  left join public.product_cms pc
    on pc.variant_id = mv.variant_id
  left join public.catalog_tire_variants ctv
    on ctv.id = mv.variant_id
  cross join lateral (
    select coalesce(
      nullif(regexp_replace(coalesce(pc.spec_overrides->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
      nullif(regexp_replace(coalesce(pc.spec_overrides->'identity'->>'ean', ''), '\D', '', 'g'), ''),
      nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
      nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
      nullif(btrim(coalesce(mv.derived_ean, mv.ean, ctv.ean)), '')
    ) as effective_ean
  ) as ee
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || p_search || '%'
    or mv.model ilike '%' || p_search || '%'
    or mv.size_string ilike '%' || p_search || '%'
    or coalesce(ee.effective_ean, '') ilike '%' || regexp_replace(p_search, '\D', '', 'g') || '%'
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
      or ee.effective_ean is null
      or ee.effective_ean like 'EANMISSING_%'
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
  with base_rows as (
    select
      mv.*,
      pc.variant_id as live_cms_variant_id,
      case
        when pc.variant_id is null then mv.cms_data
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
      end as live_cms_data,
      coalesce(
        nullif(regexp_replace(coalesce(pc.spec_overrides->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(coalesce(pc.spec_overrides->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(btrim(coalesce(mv.derived_ean, mv.ean, ctv.ean)), '')
      ) as effective_ean
    from public.cms_tires_admin_mv mv
    left join public.product_cms pc
      on pc.variant_id = mv.variant_id
    left join public.catalog_tire_variants ctv
      on ctv.id = mv.variant_id
    where (
      p_search is null
      or btrim(p_search) = ''
      or mv.brand ilike '%' || p_search || '%'
      or mv.model ilike '%' || p_search || '%'
      or mv.size_string ilike '%' || p_search || '%'
      or coalesce(
        nullif(regexp_replace(coalesce(pc.spec_overrides->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(coalesce(pc.spec_overrides->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(btrim(coalesce(mv.derived_ean, mv.ean, ctv.ean)), '')
      ) ilike '%' || regexp_replace(p_search, '\D', '', 'g') || '%'
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
        or coalesce(
          nullif(regexp_replace(coalesce(pc.spec_overrides->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
          nullif(regexp_replace(coalesce(pc.spec_overrides->'identity'->>'ean', ''), '\D', '', 'g'), ''),
          nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'tyre_label_section'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
          nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
          nullif(btrim(coalesce(mv.derived_ean, mv.ean, ctv.ean)), '')
        ) is null
        or coalesce(mv.derived_ean, mv.ean, ctv.ean) like 'EANMISSING_%'
      )
      and public.cms_tire_admin_matches_audit_filters(
        mv,
        p_missing_metadata_fields,
        p_missing_image_only,
        p_missing_seo_fields
      )
    order by mv.variant_id asc
    limit greatest(coalesce(p_limit, 26), 1)
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select
    br.variant_id,
    br.product_type,
    br.derived_ean,
    br.supplier_code_best,
    br.supplier_external_id_best,
    br.brand,
    br.model,
    br.size_string,
    br.season,
    br.studded,
    br.runflat,
    br.xl_reinforced,
    br.load_index,
    br.speed_rating,
    br.speed_index,
    br.ev_ready,
    br.threepmsf,
    br.winter_approved,
    br.ice_approved,
    br.eu_wet,
    br.eu_noise,
    br.eu_label_json,
    br.final_price_eur,
    br.price,
    br.ean_conflict_open,
    br.width_mm,
    br.aspect_ratio,
    br.diameter_in,
    br.effective_ean as ean,
    br.has_ean_multi_spec_conflict,
    br.has_mandatory_conflict,
    br.missing_supplier_price,
    br.is_non_passenger_auto,
    br.is_non_passenger_manual,
    br.is_non_passenger,
    br.live_cms_data as cms_data
  from base_rows br
  order by br.variant_id asc;
$$;

revoke all on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer) from public;
grant execute on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, text[], integer, integer) to authenticated;
