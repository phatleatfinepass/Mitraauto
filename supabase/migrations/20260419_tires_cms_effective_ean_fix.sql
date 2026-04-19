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
  cross join lateral (
    select coalesce(
      nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
      nullif(btrim(coalesce(mv.derived_ean, mv.ean)), '')
    ) as effective_ean
  ) as ee
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || p_search || '%'
    or mv.model ilike '%' || p_search || '%'
    or mv.size_string ilike '%' || p_search || '%'
    or coalesce(ee.effective_ean, '') ilike '%' || p_search || '%'
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

drop function if exists public.cms_list_tires_admin_v1(
  text,
  boolean,
  boolean,
  text,
  text[],
  boolean,
  text[],
  integer,
  integer
);

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
      ee.effective_ean
    from public.cms_tires_admin_mv mv
    cross join lateral (
      select coalesce(
        nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(btrim(coalesce(mv.derived_ean, mv.ean)), '')
      ) as effective_ean
    ) as ee
    where (
      p_search is null
      or btrim(p_search) = ''
      or mv.brand ilike '%' || p_search || '%'
      or mv.model ilike '%' || p_search || '%'
      or mv.size_string ilike '%' || p_search || '%'
      or coalesce(
        nullif(regexp_replace(coalesce(mv.cms_data->'spec_overrides'->'identity'->>'ean', ''), '\D', '', 'g'), ''),
        nullif(btrim(coalesce(mv.derived_ean, mv.ean)), ''),
        ''
      ) ilike '%' || p_search || '%'
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
      )
    order by mv.brand asc, mv.model asc, mv.size_string asc, mv.variant_id asc
    limit greatest(p_limit, 0)
    offset greatest(p_offset, 0)
  )
  select
    br.variant_id,
    br.product_type,
    br.effective_ean as derived_ean,
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
    case
      when upper(coalesce(br.supplier_code_best, '')) = 'RD'
        and resolved.rd_effective_price_ex_vat is not null
        then resolved.rd_effective_price_ex_vat
      else br.final_price_eur
    end as final_price_eur,
    case
      when upper(coalesce(br.supplier_code_best, '')) = 'RD'
        and resolved.rd_effective_price_ex_vat is not null
        then resolved.rd_effective_price_ex_vat
      else br.price
    end as price,
    br.ean_conflict_open,
    br.width_mm,
    br.aspect_ratio,
    br.diameter_in,
    coalesce(br.effective_ean, br.ean) as ean,
    br.has_ean_multi_spec_conflict,
    br.has_mandatory_conflict,
    br.missing_supplier_price,
    br.is_non_passenger_auto,
    br.is_non_passenger_manual,
    br.is_non_passenger,
    br.cms_data
  from base_rows br
  left join lateral public.cms_resolve_tire_supplier_pricing_v1(
    br.supplier_code_best,
    br.supplier_external_id_best
  ) resolved on true;
$$;

revoke all on function public.cms_list_tires_admin_v1(
  text,
  boolean,
  boolean,
  text,
  text[],
  boolean,
  text[],
  integer,
  integer
) from public;

grant execute on function public.cms_list_tires_admin_v1(
  text,
  boolean,
  boolean,
  text,
  text[],
  boolean,
  text[],
  integer,
  integer
) to authenticated;
