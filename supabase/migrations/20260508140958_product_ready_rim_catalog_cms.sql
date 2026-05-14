create or replace function public.catalog_normalize_rim_pcd(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    regexp_replace(
      replace(replace(lower(btrim(coalesce(p_value, ''))), '×', 'x'), ',', '.'),
      '\s+',
      '',
      'g'
    ),
    ''
  );
$$;

create or replace view public.catalog_rims_public_v1 as
  with source_rows as (
    select
      ps.*,
      pc.title as cms_title,
      pc.subtitle as cms_subtitle,
      pc.short_description as cms_short_description,
      pc.long_description as cms_long_description,
      pc.hero_image_url as cms_hero_image_url,
      pc.gallery as cms_gallery,
      pc.seo_slug as cms_seo_slug,
      pc.seo_title as cms_seo_title,
      pc.seo_description as cms_seo_description,
      pc.is_hidden as cms_is_hidden,
      pc.spec_overrides as cms_spec_overrides,
      pc.price_override,
      pc.price_override_eur,
      pc.promo_price_override,
      pc.promo_price_eur,
      coalesce(pc.promo_enabled, pc.promo_active, false) as cms_promo_enabled,
      coalesce(pc.promo_start, pc.promo_starts_at) as cms_promo_start,
      coalesce(pc.promo_end, pc.promo_ends_at) as cms_promo_end,
      pc.stock_override,
      coalesce(pc.force_out_of_stock, false) as force_out_of_stock
    from public.products_search ps
    left join public.product_cms pc on pc.variant_id = ps.variant_id
    where ps.product_type = 'rim'
      and coalesce(ps.final_is_hidden, false) = false
      and coalesce(pc.is_hidden, false) = false
  )
  select
    sr.variant_id,
    sr.product_type,
    sr.brand,
    coalesce(nullif(sr.brand_display_name, ''), sr.brand) as brand_display_name,
    sr.brand_logo_url,
    sr.model,
    sr.size_string,
    sr.season,
    sr.studded,
    sr.runflat,
    sr.xl_reinforced,
    sr.load_index::text,
    sr.speed_rating,
    sr.speed_index,
    sr.ev_ready,
    null::boolean as sound_absorber,
    sr.threepmsf,
    sr.winter_approved,
    sr.ice_approved,
    sr.width_mm,
    sr.aspect_ratio,
    sr.diameter_in,
    sr.width_in,
    sr.rim_diameter_in,
    sr.et_offset_mm,
    sr.bolt_pattern,
    coalesce(sr.center_bore_mm, sr.cb_mm) as center_bore_mm,
    coalesce(sr.cb_mm, sr.center_bore_mm) as cb_mm,
    sr.color,
    sr.finish,
    coalesce(nullif(sr.material, ''), nullif(sr.finish, '')) as material,
    sr.bolts_included,
    sr.price,
    case
      when sr.cms_promo_enabled
        and coalesce(sr.cms_promo_start, '-infinity'::timestamptz) <= now()
        and coalesce(sr.cms_promo_end, 'infinity'::timestamptz) >= now()
        and coalesce(sr.promo_price_eur, sr.promo_price_override) is not null
        then coalesce(sr.promo_price_eur, sr.promo_price_override)
      else coalesce(sr.price_override_eur, sr.price_override, sr.final_price_eur, sr.price)
    end as final_price_eur,
    sr.currency,
    case
      when sr.force_out_of_stock then false
      when sr.stock_override is not null then sr.stock_override > 0
      else coalesce(sr.in_stock, false)
    end as in_stock,
    coalesce(sr.stock_override, sr.stock_qty) as stock_qty,
    sr.delivery_days_min,
    sr.delivery_days_max,
    sr.supplier_code_best,
    coalesce(
      nullif(sr.cms_hero_image_url, ''),
      nullif(sr.cms_gallery->>0, ''),
      nullif(sr.best_image_url, ''),
      nullif(sr.hero_image_url, '')
    ) as best_image_url,
    coalesce(
      nullif(sr.cms_hero_image_url, ''),
      nullif(sr.cms_gallery->>0, ''),
      nullif(sr.hero_image_url, ''),
      nullif(sr.best_image_url, '')
    ) as hero_image_url,
    case
      when jsonb_typeof(coalesce(sr.cms_gallery, '[]'::jsonb)) = 'array'
        and jsonb_array_length(coalesce(sr.cms_gallery, '[]'::jsonb)) > 0
        then sr.cms_gallery
      when nullif(sr.hero_image_url, '') is not null then jsonb_build_array(sr.hero_image_url)
      when nullif(sr.best_image_url, '') is not null then jsonb_build_array(sr.best_image_url)
      else '[]'::jsonb
    end as gallery,
    sr.best_image_alt,
    coalesce(nullif(sr.cms_title, ''), nullif(sr.card_title, '')) as card_title,
    nullif(sr.cms_title, '') as title,
    coalesce(nullif(sr.cms_subtitle, ''), nullif(sr.subtitle, '')) as subtitle,
    coalesce(nullif(sr.cms_short_description, ''), nullif(sr.short_description, '')) as short_description,
    coalesce(nullif(sr.cms_long_description, ''), nullif(sr.long_description, '')) as long_description,
    sr.tags,
    coalesce(nullif(sr.cms_seo_slug, ''), nullif(sr.seo_slug, '')) as seo_slug,
    nullif(sr.cms_seo_title, '') as seo_title,
    nullif(sr.cms_seo_description, '') as seo_description,
    sr.eu_label_json,
    null::text as eu_fuel,
    sr.eu_wet,
    nullif(regexp_replace(coalesce(sr.eu_noise::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as eu_noise,
    false as final_is_hidden,
    sr.ean,
    sr.derived_ean,
    null::integer as manufacture_year,
    sr.cms_spec_overrides->'pricing_rules' as pricing_rules,
    coalesce(sr.cms_spec_overrides, '{}'::jsonb) as spec_overrides
  from source_rows sr;

create or replace function public.catalog_rim_matches_filters(
  p_row public.catalog_rims_public_v1,
  p_search text default null,
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
    r, p_search, p_diameter, p_width, p_widths, p_pcd, p_et_offset, p_center_bore_min,
    p_color, p_material, p_bolts_included, p_in_stock
  );
$$;

create or replace function public.catalog_list_rims_v1(
  p_search text default null,
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
    r, p_search, p_diameter, p_width, p_widths, p_pcd, p_et_offset, p_center_bore_min,
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
    )
  order by
    case when r.variant_id::text = btrim(p_identifier) then 0 else 1 end,
    r.variant_id
  limit 1;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_cms'
      and policyname = 'product_cms_catalog_tires_write_permission'
  ) then
    create policy product_cms_catalog_tires_write_permission
    on public.product_cms
    for all
    to authenticated
    using (
      exists (
        select 1
        from public.products_search ps
        where ps.variant_id = product_cms.variant_id
          and ps.product_type = 'tire'
          and public.cms_has_permission('catalog_tires', 'write')
      )
    )
    with check (
      exists (
        select 1
        from public.products_search ps
        where ps.variant_id = product_cms.variant_id
          and ps.product_type = 'tire'
          and public.cms_has_permission('catalog_tires', 'write')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'product_cms'
      and policyname = 'product_cms_catalog_rims_write_permission'
  ) then
    create policy product_cms_catalog_rims_write_permission
    on public.product_cms
    for all
    to authenticated
    using (
      exists (
        select 1
        from public.products_search ps
        where ps.variant_id = product_cms.variant_id
          and ps.product_type = 'rim'
          and public.cms_has_permission('catalog_rims', 'write')
      )
    )
    with check (
      exists (
        select 1
        from public.products_search ps
        where ps.variant_id = product_cms.variant_id
          and ps.product_type = 'rim'
          and public.cms_has_permission('catalog_rims', 'write')
      )
    );
  end if;
end;
$$;

revoke all on function public.catalog_normalize_rim_pcd(text) from public;
grant execute on function public.catalog_normalize_rim_pcd(text) to anon, authenticated, service_role;

revoke all on table public.catalog_rims_public_v1 from public;
grant select on public.catalog_rims_public_v1 to service_role;

revoke all on function public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to service_role;

revoke all on function public.catalog_count_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_count_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated;

revoke all on function public.catalog_list_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) to anon, authenticated;

revoke all on function public.catalog_get_rim_by_identifier_v1(text) from public;
grant execute on function public.catalog_get_rim_by_identifier_v1(text) to anon, authenticated;
