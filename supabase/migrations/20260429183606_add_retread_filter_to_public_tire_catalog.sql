drop function if exists public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean);
drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer);
drop function if exists public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean);

create or replace function public.webshop_tire_is_retreaded(p_row public.webshop_items)
returns boolean
language sql
stable
as $$
  select lower(concat_ws(
    ' ',
    p_row.brand,
    p_row.brand_display_name,
    p_row.model,
    p_row.size_string,
    p_row.card_title,
    p_row.subtitle,
    p_row.seo_slug
  )) like any (array['%pinnoitettu%', '%pinoitettu%']);
$$;

create or replace function public.webshop_tire_matches_filters(
  p_row public.webshop_items,
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
  p_include_retreaded boolean default false
)
returns boolean
language sql
stable
as $$
  select
    p_row.product_type = 'tire'
    and p_row.is_visible
    and p_row.publish_status = 'published'
    and (p_include_retreaded or not public.webshop_tire_is_retreaded(p_row))
    and (
      p_search is null
      or btrim(p_search) = ''
      or p_row.brand ilike '%' || btrim(p_search) || '%'
      or coalesce(p_row.brand_display_name, '') ilike '%' || btrim(p_search) || '%'
      or p_row.model ilike '%' || btrim(p_search) || '%'
      or coalesce(p_row.size_string, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(p_row.card_title, '') ilike '%' || btrim(p_search) || '%'
      or coalesce(p_row.ean, p_row.derived_ean, '') ilike '%' || btrim(p_search) || '%'
    )
    and (
      coalesce(array_length(p_brands, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_brands) as selected_brand(brand_name)
        where lower(coalesce(nullif(btrim(p_row.brand_display_name), ''), p_row.brand)) = lower(btrim(selected_brand.brand_name))
      )
    )
    and (p_width is null or p_row.width_mm = p_width)
    and (p_aspect_ratio is null or p_row.aspect_ratio = p_aspect_ratio)
    and (p_diameter is null or p_row.diameter_in = p_diameter)
    and (p_season is null or btrim(p_season) = '' or p_row.season = p_season)
    and (not p_runflat or coalesce(p_row.runflat, false) = true)
    and (not p_xl or coalesce(p_row.xl_reinforced, false) = true)
    and (not p_studded or coalesce(p_row.studded, false) = true)
    and (not p_in_stock or coalesce(p_row.in_stock, false) = true);
$$;

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
  p_in_stock boolean default false,
  p_include_retreaded boolean default false
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.webshop_items w
  where public.webshop_tire_matches_filters(
    w,
    p_search,
    p_brands,
    p_width,
    p_aspect_ratio,
    p_diameter,
    p_season,
    p_runflat,
    p_xl,
    p_studded,
    p_in_stock,
    p_include_retreaded
  );
$$;

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
  p_include_retreaded boolean default false,
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
  gallery jsonb,
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
    w.variant_id,
    w.product_type,
    w.brand,
    w.brand_display_name,
    w.brand_logo_url,
    w.model,
    w.size_string,
    w.season,
    w.studded,
    w.runflat,
    w.xl_reinforced,
    w.load_index,
    w.speed_rating,
    w.speed_index,
    w.ev_ready,
    w.threepmsf,
    w.winter_approved,
    w.ice_approved,
    w.width_mm,
    w.aspect_ratio,
    w.diameter_in,
    w.width_in,
    w.rim_diameter_in,
    w.et_offset_mm,
    w.bolt_pattern,
    w.color,
    w.finish,
    w.price,
    w.final_price_eur,
    w.currency,
    w.in_stock,
    w.stock_qty,
    w.delivery_days_min,
    w.delivery_days_max,
    w.supplier_code_best,
    w.best_image_url,
    w.hero_image_url,
    w.gallery,
    w.best_image_alt,
    w.card_title,
    w.subtitle,
    w.short_description,
    w.long_description,
    w.tags,
    w.seo_slug,
    w.eu_label_json,
    w.eu_wet,
    w.eu_noise
  from public.webshop_items w
  where public.webshop_tire_matches_filters(
    w,
    p_search,
    p_brands,
    p_width,
    p_aspect_ratio,
    p_diameter,
    p_season,
    p_runflat,
    p_xl,
    p_studded,
    p_in_stock,
    p_include_retreaded
  )
  order by
    case when coalesce(p_sort_by, 'brand_asc') = 'price_desc' then w.final_price_eur end desc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_desc' then w.price end desc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_asc' then w.final_price_eur end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'price_asc' then w.price end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'wet_grip' then w.eu_wet end asc nulls last,
    case when coalesce(p_sort_by, 'brand_asc') = 'noise' then w.eu_noise end asc nulls last,
    w.brand_display_name asc,
    w.model asc,
    w.variant_id asc
  limit greatest(coalesce(p_limit, 24), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.webshop_tire_is_retreaded(public.webshop_items) from public;
grant execute on function public.webshop_tire_is_retreaded(public.webshop_items) to anon, authenticated, service_role;

revoke all on function public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean) from public;
grant execute on function public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean) to anon, authenticated, service_role;

grant execute on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean) to anon, authenticated;
grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, text, integer, integer) to anon, authenticated;
