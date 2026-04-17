create or replace function public.cms_list_tires_admin_v1(
  p_search text default null,
  p_missing_ean_only boolean default false,
  p_exclude_non_passenger boolean default true,
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
    ps.product_type,
    coalesce(nullif(ps.derived_ean, ''), nullif(ctv.ean, '')) as derived_ean,
    ps.supplier_code_best,
    ps.supplier_external_id_best,
    ps.brand,
    ps.model,
    ps.size_string,
    ps.season,
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
    ps.eu_noise,
    ps.eu_label_json,
    ps.final_price_eur,
    ps.price,
    ps.ean_conflict_open,
    ps.width_mm,
    ps.aspect_ratio,
    ps.diameter_in,
    coalesce(nullif(ps.ean, ''), nullif(ctv.ean, '')) as ean,
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
  where ps.product_type = 'tire'
    and (
      p_search is null
      or btrim(p_search) = ''
      or ps.brand ilike '%' || p_search || '%'
      or ps.model ilike '%' || p_search || '%'
      or ps.size_string ilike '%' || p_search || '%'
      or coalesce(ps.derived_ean, ctv.ean, '') ilike '%' || p_search || '%'
    )
    and (
      not p_exclude_non_passenger
      or coalesce(ps.is_non_passenger, false) = false
    )
    and (
      not p_missing_ean_only
      or coalesce(ps.derived_ean, ctv.ean) is null
      or coalesce(ps.derived_ean, ctv.ean) like 'EANMISSING_%'
    )
  order by ps.brand asc, ps.model asc, ps.variant_id asc
  limit greatest(coalesce(p_limit, 26), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.cms_list_tires_admin_v1(text, boolean, boolean, integer, integer) from public;
grant execute on function public.cms_list_tires_admin_v1(text, boolean, boolean, integer, integer) to authenticated;
