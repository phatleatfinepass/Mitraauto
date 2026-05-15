-- Phase 2: expose tire vehicle type/segment as a public storefront filter.

drop function if exists public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean);
drop function if exists public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text);
drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text, integer, integer);
drop function if exists public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean);
drop function if exists public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text);

create or replace function public.webshop_tire_matches_filters(
  p_row public.webshop_items,
  p_search text default null,
  p_brands text[] default null,
  p_width numeric default null,
  p_aspect_ratio numeric default null,
  p_diameter numeric default null,
  p_season text default null,
  p_ean text default null,
  p_runflat boolean default false,
  p_xl boolean default false,
  p_studded boolean default false,
  p_in_stock boolean default false,
  p_include_retreaded boolean default false,
  p_ev_ready boolean default false,
  p_sound_absorber boolean default false,
  p_tire_segment text default null
)
returns boolean
language sql
stable
as $$
  select
    p_row.product_type = 'tire'
    and p_row.is_visible
    and p_row.publish_status = 'published'
    and coalesce(p_row.product_ready, false)
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
    and (p_ean is null or btrim(p_ean) = '' or coalesce(p_row.ean, p_row.derived_ean, '') ilike '%' || regexp_replace(p_ean, '\D', '', 'g') || '%')
    and (p_tire_segment is null or btrim(p_tire_segment) = '' or p_tire_segment = 'all' or p_row.tire_segment = p_tire_segment)
    and (not p_runflat or coalesce(p_row.runflat, false) = true)
    and (not p_xl or coalesce(p_row.xl_reinforced, false) = true)
    and (not p_studded or coalesce(p_row.studded, false) = true)
    and (not p_in_stock or coalesce(p_row.in_stock, false) = true)
    and (not p_ev_ready or public.webshop_tire_is_ev_ready(p_row))
    and (not p_sound_absorber or public.webshop_tire_has_sound_absorber(p_row));
$$;

create or replace function public.catalog_count_tires_v1(
  p_search text default null,
  p_brands text[] default null,
  p_width numeric default null,
  p_aspect_ratio numeric default null,
  p_diameter numeric default null,
  p_season text default null,
  p_ean text default null,
  p_runflat boolean default false,
  p_xl boolean default false,
  p_studded boolean default false,
  p_in_stock boolean default false,
  p_include_retreaded boolean default false,
  p_ev_ready boolean default false,
  p_sound_absorber boolean default false,
  p_tire_segment text default null
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
    w, p_search, p_brands, p_width, p_aspect_ratio, p_diameter, p_season, p_ean,
    p_runflat, p_xl, p_studded, p_in_stock, p_include_retreaded, p_ev_ready, p_sound_absorber, p_tire_segment
  );
$$;

create or replace function public.catalog_list_tires_v1(
  p_search text default null,
  p_brands text[] default null,
  p_width numeric default null,
  p_aspect_ratio numeric default null,
  p_diameter numeric default null,
  p_season text default null,
  p_ean text default null,
  p_runflat boolean default false,
  p_xl boolean default false,
  p_studded boolean default false,
  p_in_stock boolean default false,
  p_include_retreaded boolean default false,
  p_ev_ready boolean default false,
  p_sound_absorber boolean default false,
  p_tire_segment text default null,
  p_sort_by text default 'brand_asc',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  variant_id uuid,
  product_type text,
  tire_segment text,
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
  sound_absorber boolean,
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
  ean text,
  derived_ean text,
  eu_label_json jsonb,
  eu_wet text,
  eu_noise numeric,
  manufacture_year integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_order_by text;
begin
  v_order_by := case coalesce(p_sort_by, 'brand_asc')
    when 'price_desc' then 'w.final_price_eur desc nulls last, w.price desc nulls last, w.brand_display_name asc, w.brand asc, w.model asc, w.variant_id asc'
    when 'price_asc' then 'w.final_price_eur asc nulls last, w.price asc nulls last, w.brand_display_name asc, w.brand asc, w.model asc, w.variant_id asc'
    when 'wet_grip' then 'w.eu_wet asc nulls last, w.brand_display_name asc, w.brand asc, w.model asc, w.variant_id asc'
    when 'noise' then 'w.eu_noise asc nulls last, w.brand_display_name asc, w.brand asc, w.model asc, w.variant_id asc'
    else 'w.brand_display_name asc, w.brand asc, w.model asc, w.variant_id asc'
  end;

  return query execute
    'select
      w.variant_id,
      w.product_type,
      w.tire_segment,
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
      public.webshop_tire_is_ev_ready(w) as ev_ready,
      public.webshop_tire_has_sound_absorber(w) as sound_absorber,
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
      w.ean,
      w.derived_ean,
      w.eu_label_json,
      w.eu_wet,
      w.eu_noise,
      w.manufacture_year
    from public.webshop_items w
    where public.webshop_tire_matches_filters(
      w, $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12, $13, $14, $15
    )
    order by ' || v_order_by || '
    limit greatest(coalesce($16, 24), 1)
    offset greatest(coalesce($17, 0), 0)'
    using
      p_search,
      p_brands,
      p_width,
      p_aspect_ratio,
      p_diameter,
      p_season,
      p_ean,
      p_runflat,
      p_xl,
      p_studded,
      p_in_stock,
      p_include_retreaded,
      p_ev_ready,
      p_sound_absorber,
      p_tire_segment,
      p_limit,
      p_offset;
end;
$$;

create index if not exists webshop_items_tire_ready_segment_sort_idx
on public.webshop_items (
  tire_segment,
  brand_display_name,
  brand,
  model,
  variant_id
)
where product_type = 'tire'
  and is_visible = true
  and publish_status = 'published'
  and product_ready = true;

revoke all on function public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text) from public;
grant execute on function public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text) to anon, authenticated, service_role;

revoke all on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text) from public;
grant execute on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text) to anon, authenticated;

revoke all on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text, integer, integer) from public;
grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text, integer, integer) to anon, authenticated;
