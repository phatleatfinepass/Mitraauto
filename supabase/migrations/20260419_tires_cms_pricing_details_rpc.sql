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
  recycling_fee_ex_vat numeric
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
    nullif(regexp_replace(coalesce(cso.wholesale_price::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as wholesale_price_ex_vat,
    nullif(regexp_replace(coalesce(cso.consumer_price::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as consumer_price_ex_vat,
    nullif(regexp_replace(coalesce(spr.payload->'raw'->>'NetPrice', ''), '[^0-9\.-]', '', 'g'), '')::numeric as raw_net_price_ex_vat,
    nullif(regexp_replace(coalesce(spr.payload->'raw'->>'Price', ''), '[^0-9\.-]', '', 'g'), '')::numeric as raw_price_ex_vat,
    nullif(regexp_replace(coalesce(spr.payload->'raw'->>'RetailPrice', ''), '[^0-9\.-]', '', 'g'), '')::numeric as raw_retail_price_inc_vat,
    nullif(regexp_replace(coalesce(spr.payload->'raw'->>'RecyclingFee', ''), '[^0-9\.-]', '', 'g'), '')::numeric as recycling_fee_ex_vat
  from public.products_search ps
  left join public.catalog_supplier_offers cso
    on cso.variant_id = ps.variant_id
   and cso.supplier_code = ps.supplier_code_best
   and cso.supplier_external_id = ps.supplier_external_id_best
  left join lateral (
    select supplier_products_raw.payload
    from public.supplier_products_raw
    where supplier_products_raw.supplier_code = ps.supplier_code_best
      and supplier_products_raw.external_id = ps.supplier_external_id_best
    order by supplier_products_raw.fetched_at desc nulls last
    limit 1
  ) spr on true
  where ps.product_type = 'tire'
    and ps.variant_id = p_variant_id
  limit 1;
end;
$$;

revoke all on function public.cms_get_tire_admin_pricing_v1(uuid) from public;
grant execute on function public.cms_get_tire_admin_pricing_v1(uuid) to authenticated;
