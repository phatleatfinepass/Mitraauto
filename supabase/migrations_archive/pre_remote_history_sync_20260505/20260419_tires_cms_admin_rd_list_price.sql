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
    select *
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
        or mv.derived_ean is null
        or mv.derived_ean like 'EANMISSING_%'
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
    case
      when upper(coalesce(br.supplier_code_best, '')) = 'RD'
        and rd_price.rd_effective_price_ex_vat is not null
        then rd_price.rd_effective_price_ex_vat
      else br.final_price_eur
    end as final_price_eur,
    case
      when upper(coalesce(br.supplier_code_best, '')) = 'RD'
        and rd_price.rd_effective_price_ex_vat is not null
        then rd_price.rd_effective_price_ex_vat
      else br.price
    end as price,
    br.ean_conflict_open,
    br.width_mm,
    br.aspect_ratio,
    br.diameter_in,
    br.ean,
    br.has_ean_multi_spec_conflict,
    br.has_mandatory_conflict,
    br.missing_supplier_price,
    br.is_non_passenger_auto,
    br.is_non_passenger_manual,
    br.is_non_passenger,
    br.cms_data
  from base_rows br
  left join lateral (
    select
      nullif(regexp_replace(coalesce(cso.wholesale_price::text, ''), '[^0-9\\.-]', '', 'g'), '')::numeric as wholesale_price_ex_vat,
      nullif(regexp_replace(coalesce(spr.payload->'raw'->>'RecyclingFee', ''), '[^0-9\\.-]', '', 'g'), '')::numeric as recycling_fee_ex_vat,
      case
        when nullif(regexp_replace(coalesce(cso.wholesale_price::text, ''), '[^0-9\\.-]', '', 'g'), '')::numeric is not null
         and nullif(regexp_replace(coalesce(spr.payload->'raw'->>'RecyclingFee', ''), '[^0-9\\.-]', '', 'g'), '')::numeric is not null
        then round((
          nullif(regexp_replace(coalesce(cso.wholesale_price::text, ''), '[^0-9\\.-]', '', 'g'), '')::numeric +
          nullif(regexp_replace(coalesce(spr.payload->'raw'->>'RecyclingFee', ''), '[^0-9\\.-]', '', 'g'), '')::numeric +
          12
        )::numeric, 2)
        else null
      end as rd_effective_price_ex_vat
    from public.catalog_supplier_offers cso
    left join lateral (
      select supplier_products_raw.payload
      from public.supplier_products_raw
      where supplier_products_raw.supplier_code = br.supplier_code_best
        and supplier_products_raw.external_id = br.supplier_external_id_best
      order by supplier_products_raw.fetched_at desc nulls last
      limit 1
    ) spr on true
    where cso.variant_id = br.variant_id
      and cso.supplier_code = br.supplier_code_best
      and cso.supplier_external_id = br.supplier_external_id_best
    limit 1
  ) rd_price on upper(coalesce(br.supplier_code_best, '')) = 'RD';
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
