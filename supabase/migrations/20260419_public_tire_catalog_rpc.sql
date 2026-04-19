drop function if exists public.catalog_list_tire_brands_v1();
drop function if exists public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean);
drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer);
drop function if exists public.refresh_catalog_tires_public_mv();
drop materialized view if exists public.catalog_tires_public_mv;

create materialized view public.catalog_tires_public_mv as
select
  ps.variant_id,
  ps.product_type,
  ps.brand,
  ps.brand_display_name,
  ps.brand_logo_url,
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
  ps.width_mm,
  ps.aspect_ratio,
  ps.diameter_in,
  ps.width_in,
  ps.rim_diameter_in,
  ps.et_offset_mm,
  ps.bolt_pattern,
  ps.color,
  ps.finish,
  ps.price,
  ps.final_price_eur,
  ps.currency,
  ps.in_stock,
  ps.stock_qty,
  ps.delivery_days_min,
  ps.delivery_days_max,
  ps.supplier_code_best,
  ps.best_image_url,
  ps.hero_image_url,
  ps.best_image_alt,
  ps.card_title,
  ps.subtitle,
  ps.short_description,
  ps.long_description,
  ps.tags,
  ps.seo_slug,
  ps.eu_label_json,
  ps.eu_wet,
  nullif(regexp_replace(coalesce(ps.eu_noise::text, ''), '[^0-9\.-]', '', 'g'), '')::numeric as eu_noise
from public.products_search ps
where ps.product_type = 'tire'
  and coalesce(ps.final_is_hidden, false) = false;

create unique index catalog_tires_public_mv_variant_id_idx
  on public.catalog_tires_public_mv (variant_id);

create index catalog_tires_public_mv_brand_model_variant_idx
  on public.catalog_tires_public_mv (brand, model, variant_id);

create index catalog_tires_public_mv_price_variant_idx
  on public.catalog_tires_public_mv (final_price_eur, price, variant_id);

create index catalog_tires_public_mv_wet_variant_idx
  on public.catalog_tires_public_mv (eu_wet, brand, model, variant_id);

create index catalog_tires_public_mv_noise_variant_idx
  on public.catalog_tires_public_mv (eu_noise, brand, model, variant_id);

create index catalog_tires_public_mv_size_dims_variant_idx
  on public.catalog_tires_public_mv (width_mm, aspect_ratio, diameter_in, variant_id);

create index catalog_tires_public_mv_season_variant_idx
  on public.catalog_tires_public_mv (season, variant_id);

create index catalog_tires_public_mv_stock_variant_idx
  on public.catalog_tires_public_mv (in_stock, variant_id);

create extension if not exists pg_trgm;

create index catalog_tires_public_mv_brand_trgm_idx
  on public.catalog_tires_public_mv using gin (brand gin_trgm_ops);

create index catalog_tires_public_mv_brand_display_trgm_idx
  on public.catalog_tires_public_mv using gin (brand_display_name gin_trgm_ops);

create index catalog_tires_public_mv_model_trgm_idx
  on public.catalog_tires_public_mv using gin (model gin_trgm_ops);

create index catalog_tires_public_mv_size_trgm_idx
  on public.catalog_tires_public_mv using gin (size_string gin_trgm_ops);

create index catalog_tires_public_mv_card_title_trgm_idx
  on public.catalog_tires_public_mv using gin (card_title gin_trgm_ops);

create or replace function public.refresh_catalog_tires_public_mv()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.catalog_tires_public_mv;
end;
$$;

revoke all on function public.refresh_catalog_tires_public_mv() from public;
grant execute on function public.refresh_catalog_tires_public_mv() to anon;
grant execute on function public.refresh_catalog_tires_public_mv() to authenticated;

create or replace function public.catalog_list_tire_brands_v1()
returns table (
  brand text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct coalesce(nullif(btrim(mv.brand_display_name), ''), mv.brand) as brand
  from public.catalog_tires_public_mv mv
  where nullif(btrim(coalesce(mv.brand_display_name, mv.brand)), '') is not null
  order by 1 asc;
$$;

revoke all on function public.catalog_list_tire_brands_v1() from public;
grant execute on function public.catalog_list_tire_brands_v1() to anon;
grant execute on function public.catalog_list_tire_brands_v1() to authenticated;

create or replace function public.catalog_count_tires_v1(
  p_search text default null,
  p_brands text[] default null,
  p_width numeric default null,
  p_aspect_ratio numeric default null,
  p_diameter numeric default null,
  p_season text default null,
  p_runflat boolean default false,
  p_xl boolean default false,
  p_studded boolean default false,
  p_in_stock boolean default false
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.catalog_tires_public_mv mv
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || btrim(p_search) || '%'
    or coalesce(mv.brand_display_name, '') ilike '%' || btrim(p_search) || '%'
    or mv.model ilike '%' || btrim(p_search) || '%'
    or coalesce(mv.size_string, '') ilike '%' || btrim(p_search) || '%'
    or coalesce(mv.card_title, '') ilike '%' || btrim(p_search) || '%'
  )
    and (
      coalesce(array_length(p_brands, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_brands) as selected_brand(brand_name)
        where lower(coalesce(nullif(btrim(mv.brand_display_name), ''), mv.brand)) = lower(btrim(selected_brand.brand_name))
      )
    )
    and (p_width is null or mv.width_mm = p_width)
    and (p_aspect_ratio is null or mv.aspect_ratio = p_aspect_ratio)
    and (p_diameter is null or mv.diameter_in = p_diameter)
    and (p_season is null or btrim(p_season) = '' or mv.season = p_season)
    and (not p_runflat or coalesce(mv.runflat, false) = true)
    and (not p_xl or coalesce(mv.xl_reinforced, false) = true)
    and (not p_studded or coalesce(mv.studded, false) = true)
    and (not p_in_stock or coalesce(mv.in_stock, false) = true);
$$;

revoke all on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean) from public;
grant execute on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean) to anon;
grant execute on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean) to authenticated;

create or replace function public.catalog_list_tires_v1(
  p_search text default null,
  p_brands text[] default null,
  p_width numeric default null,
  p_aspect_ratio numeric default null,
  p_diameter numeric default null,
  p_season text default null,
  p_runflat boolean default false,
  p_xl boolean default false,
  p_studded boolean default false,
  p_in_stock boolean default false,
  p_sort_by text default 'brand_asc',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  variant_id uuid,
  product_type text,
  brand text,
  brand_display_name text,
  brand_logo_url text,
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
  width_mm numeric,
  aspect_ratio numeric,
  diameter_in numeric,
  width_in numeric,
  rim_diameter_in numeric,
  et_offset_mm numeric,
  bolt_pattern text,
  color text,
  finish text,
  price numeric,
  final_price_eur numeric,
  currency text,
  in_stock boolean,
  stock_qty integer,
  delivery_days_min integer,
  delivery_days_max integer,
  supplier_code_best text,
  best_image_url text,
  hero_image_url text,
  best_image_alt text,
  card_title text,
  subtitle text,
  short_description text,
  long_description text,
  tags jsonb,
  seo_slug text,
  eu_label_json jsonb,
  eu_wet text,
  eu_noise numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    mv.variant_id,
    mv.product_type,
    mv.brand,
    mv.brand_display_name,
    mv.brand_logo_url,
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
    mv.width_mm,
    mv.aspect_ratio,
    mv.diameter_in,
    mv.width_in,
    mv.rim_diameter_in,
    mv.et_offset_mm,
    mv.bolt_pattern,
    mv.color,
    mv.finish,
    mv.price,
    mv.final_price_eur,
    mv.currency,
    mv.in_stock,
    mv.stock_qty,
    mv.delivery_days_min,
    mv.delivery_days_max,
    mv.supplier_code_best,
    mv.best_image_url,
    mv.hero_image_url,
    mv.best_image_alt,
    mv.card_title,
    mv.subtitle,
    mv.short_description,
    mv.long_description,
    mv.tags,
    mv.seo_slug,
    mv.eu_label_json,
    mv.eu_wet,
    mv.eu_noise
  from public.catalog_tires_public_mv mv
  where (
    p_search is null
    or btrim(p_search) = ''
    or mv.brand ilike '%' || btrim(p_search) || '%'
    or coalesce(mv.brand_display_name, '') ilike '%' || btrim(p_search) || '%'
    or mv.model ilike '%' || btrim(p_search) || '%'
    or coalesce(mv.size_string, '') ilike '%' || btrim(p_search) || '%'
    or coalesce(mv.card_title, '') ilike '%' || btrim(p_search) || '%'
  )
    and (
      coalesce(array_length(p_brands, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_brands) as selected_brand(brand_name)
        where lower(coalesce(nullif(btrim(mv.brand_display_name), ''), mv.brand)) = lower(btrim(selected_brand.brand_name))
      )
    )
    and (p_width is null or mv.width_mm = p_width)
    and (p_aspect_ratio is null or mv.aspect_ratio = p_aspect_ratio)
    and (p_diameter is null or mv.diameter_in = p_diameter)
    and (p_season is null or btrim(p_season) = '' or mv.season = p_season)
    and (not p_runflat or coalesce(mv.runflat, false) = true)
    and (not p_xl or coalesce(mv.xl_reinforced, false) = true)
    and (not p_studded or coalesce(mv.studded, false) = true)
    and (not p_in_stock or coalesce(mv.in_stock, false) = true)
  order by
    case when coalesce(p_sort_by, 'brand_asc') = 'price_desc' then mv.final_price_eur end desc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_desc' then mv.price end desc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_asc' then mv.final_price_eur end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_asc' then mv.price end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'wet_grip' then mv.eu_wet end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'noise' then mv.eu_noise end asc nulls last,
    mv.brand asc,
    mv.model asc,
    mv.variant_id asc
  limit greatest(coalesce(p_limit, 24), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer) to anon;
grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer) to authenticated;
