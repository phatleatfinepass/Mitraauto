drop function if exists public.cms_resolve_tire_supplier_pricing_v1(text, text);

create or replace function public.cms_resolve_tire_supplier_pricing_v1(
  p_supplier_code text,
  p_supplier_external_id text
)
returns table (
  wholesale_price_ex_vat numeric,
  consumer_price_ex_vat numeric,
  raw_net_price_ex_vat numeric,
  raw_price_ex_vat numeric,
  raw_retail_price_inc_vat numeric,
  recycling_fee_ex_vat numeric,
  rd_effective_price_ex_vat numeric
)
language sql
stable
set search_path = public
as $$
  with offer_match as (
    select
      nullif(regexp_replace(coalesce(cso.wholesale_price::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as wholesale_price_ex_vat,
      nullif(regexp_replace(coalesce(cso.consumer_price::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as consumer_price_ex_vat
    from public.catalog_supplier_offers cso
    where upper(coalesce(cso.supplier_code, '')) = upper(coalesce(p_supplier_code, ''))
      and cso.supplier_external_id = p_supplier_external_id
    order by
      cso.available_pcs desc nulls last,
      cso.consumer_price desc nulls last,
      cso.wholesale_price desc nulls last,
      cso.variant_id asc
    limit 1
  ),
  raw_match as (
    select
      nullif(regexp_replace(coalesce(spr.payload->'raw'->>'NetPrice', ''), '[^0-9\.-]', '', 'g'), '')::numeric as raw_net_price_ex_vat,
      nullif(regexp_replace(coalesce(spr.payload->'raw'->>'Price', ''), '[^0-9\.-]', '', 'g'), '')::numeric as raw_price_ex_vat,
      nullif(regexp_replace(coalesce(spr.payload->'raw'->>'RetailPrice', ''), '[^0-9\.-]', '', 'g'), '')::numeric as raw_retail_price_inc_vat,
      nullif(regexp_replace(coalesce(spr.payload->'raw'->>'RecyclingFee', ''), '[^0-9\.-]', '', 'g'), '')::numeric as recycling_fee_ex_vat
    from public.supplier_products_raw spr
    where upper(coalesce(spr.supplier_code, '')) = upper(coalesce(p_supplier_code, ''))
      and spr.external_id = p_supplier_external_id
    order by spr.fetched_at desc nulls last
    limit 1
  )
  select
    offer_match.wholesale_price_ex_vat,
    offer_match.consumer_price_ex_vat,
    raw_match.raw_net_price_ex_vat,
    raw_match.raw_price_ex_vat,
    raw_match.raw_retail_price_inc_vat,
    raw_match.recycling_fee_ex_vat,
    case
      when upper(coalesce(p_supplier_code, '')) = 'RD'
       and coalesce(raw_match.raw_net_price_ex_vat, offer_match.wholesale_price_ex_vat) is not null
       and raw_match.recycling_fee_ex_vat is not null
      then round((
        coalesce(raw_match.raw_net_price_ex_vat, offer_match.wholesale_price_ex_vat) +
        raw_match.recycling_fee_ex_vat +
        12
      )::numeric, 2)
      else null
    end as rd_effective_price_ex_vat
  from offer_match
  full outer join raw_match on true;
$$;

drop function if exists public.cms_get_tire_admin_pricing_v1(uuid);

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

  return query
  select
    ps.variant_id,
    ps.supplier_code_best,
    ps.supplier_external_id_best,
    nullif(regexp_replace(coalesce(ps.price::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as catalog_price_ex_vat,
    nullif(regexp_replace(coalesce(ps.final_price_eur::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as current_catalog_effective_price_ex_vat,
    resolved.wholesale_price_ex_vat,
    resolved.consumer_price_ex_vat,
    resolved.raw_net_price_ex_vat,
    resolved.raw_price_ex_vat,
    resolved.raw_retail_price_inc_vat,
    resolved.recycling_fee_ex_vat,
    resolved.rd_effective_price_ex_vat
  from public.products_search ps
  left join lateral public.cms_resolve_tire_supplier_pricing_v1(
    ps.supplier_code_best,
    ps.supplier_external_id_best
  ) resolved on true
  where ps.product_type = 'tire'
    and ps.variant_id = p_variant_id
  limit 1;
end;
$$;

revoke all on function public.cms_get_tire_admin_pricing_v1(uuid) from public;
grant execute on function public.cms_get_tire_admin_pricing_v1(uuid) to authenticated;

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
        or coalesce(mv.derived_ean, mv.ean) is null
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
    br.ean,
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
