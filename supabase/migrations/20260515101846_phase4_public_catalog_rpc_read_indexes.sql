set lock_timeout = '5s';
set statement_timeout = '120s';

create table if not exists public.webshop_rim_filter_options (
  option_group text not null,
  option_value text not null,
  label text not null,
  item_count integer not null default 0,
  sort_order integer not null default 0,
  metadata jsonb,
  updated_at timestamptz not null default now(),
  primary key (option_group, option_value)
);

alter table public.webshop_rim_filter_options enable row level security;

drop policy if exists "public can read rim filter options" on public.webshop_rim_filter_options;
create policy "public can read rim filter options"
  on public.webshop_rim_filter_options
  for select
  to anon, authenticated
  using (true);

drop policy if exists "service role can manage rim filter options" on public.webshop_rim_filter_options;
create policy "service role can manage rim filter options"
  on public.webshop_rim_filter_options
  for all
  to service_role
  using (true)
  with check (true);

grant select on public.webshop_rim_filter_options to anon, authenticated;
grant select, insert, update, delete on public.webshop_rim_filter_options to service_role;

create or replace function public.refresh_webshop_rim_filter_options_v1()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  delete from public.webshop_rim_filter_options;

  insert into public.webshop_rim_filter_options (option_group, option_value, label, item_count, sort_order, metadata)
  select 'diameter', rim_diameter_in::text, rim_diameter_in::text, count(*)::integer, rim_diameter_in::integer, null::jsonb
  from public.webshop_rim_search_index
  where is_visible and publish_status = 'published' and product_ready and rim_diameter_in is not null
  group by rim_diameter_in
  union all
  select 'width', width_in::text, width_in::text, count(*)::integer, (width_in * 10)::integer, null::jsonb
  from public.webshop_rim_search_index
  where is_visible and publish_status = 'published' and product_ready and width_in is not null
  group by width_in
  union all
  select
    'pcd',
    public.catalog_format_rim_pcd_for_display(pcd_normalized),
    public.catalog_format_rim_pcd_for_display(pcd_normalized),
    count(*)::integer,
    (
      coalesce(nullif(split_part(pcd_normalized, 'x', 1), '')::numeric, 0) * 1000
      + coalesce(nullif(split_part(pcd_normalized, 'x', 2), '')::numeric, 0)
    )::integer,
    jsonb_build_object('normalized', pcd_normalized)
  from public.webshop_rim_search_index
  where is_visible and publish_status = 'published' and product_ready and pcd_normalized is not null
  group by pcd_normalized
  union all
  select 'brand', coalesce(nullif(brand_display_name, ''), brand), coalesce(nullif(brand_display_name, ''), brand), count(*)::integer, 100000 + dense_rank() over (order by lower(coalesce(nullif(brand_display_name, ''), brand)))::integer, null::jsonb
  from public.webshop_rim_search_index
  where is_visible and publish_status = 'published' and product_ready and nullif(coalesce(nullif(brand_display_name, ''), brand), '') is not null
  group by coalesce(nullif(brand_display_name, ''), brand)
  union all
  select 'et_offset', et_offset_mm::text, et_offset_mm::text, count(*)::integer, (et_offset_mm + 1000)::integer, null::jsonb
  from public.webshop_rim_search_index
  where is_visible and publish_status = 'published' and product_ready and et_offset_mm is not null
  group by et_offset_mm
  union all
  select 'center_bore', center_bore_mm::text, center_bore_mm::text, count(*)::integer, (center_bore_mm * 10)::integer, null::jsonb
  from public.webshop_rim_search_index
  where is_visible and publish_status = 'published' and product_ready and center_bore_mm is not null
  group by center_bore_mm;

  select count(*) into v_count from public.webshop_rim_filter_options;
  return v_count;
end;
$function$;

create or replace function public.catalog_list_rim_filter_options_v1()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'diameters', coalesce((
      select jsonb_agg(option_value order by sort_order, option_value)
      from public.webshop_rim_filter_options
      where option_group = 'diameter'
    ), '[]'::jsonb),
    'widths', coalesce((
      select jsonb_agg(option_value order by sort_order, option_value)
      from public.webshop_rim_filter_options
      where option_group = 'width'
    ), '[]'::jsonb),
    'pcds', coalesce((
      select jsonb_agg(jsonb_build_object('value', option_value, 'label', label, 'count', item_count) order by sort_order, option_value)
      from public.webshop_rim_filter_options
      where option_group = 'pcd'
    ), '[]'::jsonb),
    'et_offsets', coalesce((
      select jsonb_agg(option_value order by sort_order, option_value)
      from public.webshop_rim_filter_options
      where option_group = 'et_offset'
    ), '[]'::jsonb),
    'center_bores', coalesce((
      select jsonb_agg(option_value order by sort_order, option_value)
      from public.webshop_rim_filter_options
      where option_group = 'center_bore'
    ), '[]'::jsonb),
    'brands', coalesce((
      select jsonb_agg(option_value order by sort_order, option_value)
      from public.webshop_rim_filter_options
      where option_group = 'brand'
    ), '[]'::jsonb)
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
  variant_id uuid, product_type text, tire_segment text, brand text, brand_display_name text,
  brand_logo_url text, model text, size_string text, season text, studded boolean,
  runflat boolean, xl_reinforced boolean, load_index text, speed_rating text,
  speed_index text, ev_ready boolean, sound_absorber boolean, threepmsf boolean,
  winter_approved boolean, ice_approved boolean, width_mm numeric, aspect_ratio numeric,
  diameter_in numeric, width_in numeric, rim_diameter_in numeric, et_offset_mm numeric,
  bolt_pattern text, color text, finish text, price numeric, final_price_eur numeric,
  currency text, in_stock boolean, stock_qty integer, delivery_days_min integer,
  delivery_days_max integer, supplier_code_best text, best_image_url text,
  hero_image_url text, gallery jsonb, best_image_alt text, card_title text,
  subtitle text, short_description text, long_description text, tags jsonb,
  seo_slug text, ean text, derived_ean text, eu_label_json jsonb, eu_wet text,
  eu_noise numeric, manufacture_year integer
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_order_by text;
begin
  v_order_by := case coalesce(p_sort_by, 'brand_asc')
    when 'price_desc' then 'i.price_sort desc nulls last, i.brand_sort asc, i.model_sort asc, i.variant_id asc'
    when 'price_asc' then 'i.price_sort asc nulls last, i.brand_sort asc, i.model_sort asc, i.variant_id asc'
    when 'wet_grip' then 'i.eu_wet asc nulls last, i.brand_sort asc, i.model_sort asc, i.variant_id asc'
    when 'noise' then 'i.eu_noise asc nulls last, i.brand_sort asc, i.model_sort asc, i.variant_id asc'
    else 'i.brand_sort asc, i.model_sort asc, i.variant_id asc'
  end;

  return query execute
    'select
      i.variant_id, i.product_type, i.tire_segment, i.brand, i.brand_display_name,
      i.brand_logo_url, i.model, i.size_string, i.season, i.studded,
      i.runflat, i.xl_reinforced, i.load_index, i.speed_rating,
      i.speed_index, i.ev_ready, i.sound_absorber, i.threepmsf,
      i.winter_approved, i.ice_approved, i.width_mm, i.aspect_ratio,
      i.diameter_in, i.width_in, i.rim_diameter_in, i.et_offset_mm,
      i.bolt_pattern, i.color, i.finish, i.price, i.final_price_eur,
      i.currency, i.in_stock, i.stock_qty, i.delivery_days_min,
      i.delivery_days_max, i.supplier_code_best, i.best_image_url,
      i.hero_image_url, i.gallery, i.best_image_alt, i.card_title,
      i.subtitle, i.short_description, i.long_description, i.tags,
      i.seo_slug, i.ean, i.derived_ean, i.eu_label_json, i.eu_wet,
      i.eu_noise, i.manufacture_year
    from public.webshop_tire_search_index i
    where i.is_visible
      and i.publish_status = ''published''
      and i.product_ready
      and ($1 is null or btrim($1) = '''' or i.search_text ilike ''%'' || lower(btrim($1)) || ''%'')
      and (
        coalesce(array_length($2, 1), 0) = 0
        or exists (
          select 1 from unnest($2) as selected_brand(brand_name)
          where lower(i.brand_display_name) = lower(btrim(selected_brand.brand_name))
        )
      )
      and ($3 is null or i.width_mm = $3)
      and ($4 is null or i.aspect_ratio = $4)
      and ($5 is null or i.diameter_in = $5)
      and ($6 is null or btrim($6) = '''' or i.season = $6)
      and ($7 is null or btrim($7) = '''' or coalesce(i.ean, i.derived_ean, '''') ilike ''%'' || regexp_replace($7, ''\\D'', '''', ''g'') || ''%'')
      and ($15 is null or btrim($15) = '''' or $15 = ''all'' or i.tire_segment = $15)
      and (not $8 or coalesce(i.runflat, false))
      and (not $9 or coalesce(i.xl_reinforced, false))
      and (not $10 or coalesce(i.studded, false))
      and (not $11 or coalesce(i.in_stock, false))
      and ($12 or not i.is_retreaded)
      and (not $13 or coalesce(i.ev_ready, false))
      and (not $14 or coalesce(i.sound_absorber, false))
    order by ' || v_order_by || '
    limit least(greatest(coalesce($16, 24), 1), 100)
    offset greatest(coalesce($17, 0), 0)'
    using p_search, p_brands, p_width, p_aspect_ratio, p_diameter, p_season, p_ean,
      p_runflat, p_xl, p_studded, p_in_stock, p_include_retreaded, p_ev_ready,
      p_sound_absorber, p_tire_segment, p_limit, p_offset;
end;
$function$;

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
set search_path to 'public'
as $function$
  select count(*)::bigint
  from public.webshop_tire_search_index i
  where i.is_visible
    and i.publish_status = 'published'
    and i.product_ready
    and (p_search is null or btrim(p_search) = '' or i.search_text ilike '%' || lower(btrim(p_search)) || '%')
    and (
      coalesce(array_length(p_brands, 1), 0) = 0
      or exists (
        select 1 from unnest(p_brands) as selected_brand(brand_name)
        where lower(i.brand_display_name) = lower(btrim(selected_brand.brand_name))
      )
    )
    and (p_width is null or i.width_mm = p_width)
    and (p_aspect_ratio is null or i.aspect_ratio = p_aspect_ratio)
    and (p_diameter is null or i.diameter_in = p_diameter)
    and (p_season is null or btrim(p_season) = '' or i.season = p_season)
    and (p_ean is null or btrim(p_ean) = '' or coalesce(i.ean, i.derived_ean, '') ilike '%' || regexp_replace(p_ean, '\D', '', 'g') || '%')
    and (p_tire_segment is null or btrim(p_tire_segment) = '' or p_tire_segment = 'all' or i.tire_segment = p_tire_segment)
    and (not p_runflat or coalesce(i.runflat, false))
    and (not p_xl or coalesce(i.xl_reinforced, false))
    and (not p_studded or coalesce(i.studded, false))
    and (not p_in_stock or coalesce(i.in_stock, false))
    and (p_include_retreaded or not i.is_retreaded)
    and (not p_ev_ready or coalesce(i.ev_ready, false))
    and (not p_sound_absorber or coalesce(i.sound_absorber, false));
$function$;

create or replace function public.catalog_list_rims_v1(
  p_search text default null,
  p_brands text[] default null,
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
returns table (
  variant_id uuid, product_type text, brand text, brand_display_name text,
  brand_logo_url text, model text, size_string text, season text, studded boolean,
  runflat boolean, xl_reinforced boolean, load_index text, speed_rating text,
  speed_index text, ev_ready boolean, sound_absorber boolean, threepmsf boolean,
  winter_approved boolean, ice_approved boolean, width_mm numeric, aspect_ratio numeric,
  diameter_in numeric, width_in numeric, rim_diameter_in numeric, et_offset_mm numeric,
  bolt_pattern text, center_bore_mm numeric, cb_mm numeric, color text,
  finish text, material text, bolts_included boolean, wheel_load_kg numeric,
  price numeric, final_price_eur numeric, currency text, in_stock boolean,
  stock_qty integer, delivery_days_min integer, delivery_days_max integer,
  supplier_code_best text, supplier_external_id_best text, best_image_url text,
  hero_image_url text, gallery jsonb, best_image_alt text, card_title text,
  title text, subtitle text, short_description text, long_description text,
  generated_tags jsonb, tags jsonb, seo_slug text, seo_title text,
  seo_description text, eu_label_json jsonb, eu_fuel text, eu_wet text,
  eu_noise numeric, final_is_hidden boolean, ean text, derived_ean text,
  manufacture_year integer, pricing_rules jsonb, spec_overrides jsonb
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_order_sql text;
begin
  v_order_sql := case coalesce(p_sort_by, 'price_asc')
    when 'price_desc' then 'i.price_sort desc nulls last, i.variant_id asc'
    when 'brand_desc' then 'i.brand_sort desc, i.model_sort desc, i.variant_id asc'
    when 'brand_asc' then 'i.brand_sort asc, i.model_sort asc, i.variant_id asc'
    else 'i.price_sort asc nulls last, i.variant_id asc'
  end;

  return query execute
    'select
      i.variant_id, i.product_type, i.brand, i.brand_display_name,
      i.brand_logo_url, i.model, i.size_string, i.season, i.studded,
      i.runflat, i.xl_reinforced, i.load_index, i.speed_rating,
      i.speed_index, i.ev_ready, i.sound_absorber, i.threepmsf,
      i.winter_approved, i.ice_approved, i.width_mm, i.aspect_ratio,
      i.diameter_in, i.width_in, i.rim_diameter_in, i.et_offset_mm,
      i.bolt_pattern, i.center_bore_mm, i.cb_mm, i.color,
      i.finish, i.material, i.bolts_included, i.wheel_load_kg,
      i.price, i.final_price_eur, i.currency, i.in_stock,
      i.stock_qty, i.delivery_days_min, i.delivery_days_max,
      i.supplier_code_best, i.supplier_external_id_best, i.best_image_url,
      i.hero_image_url, i.gallery, i.best_image_alt, i.card_title,
      i.title, i.subtitle, i.short_description, i.long_description,
      i.generated_tags, i.tags, i.seo_slug, i.seo_title,
      i.seo_description, i.eu_label_json, i.eu_fuel, i.eu_wet,
      i.eu_noise, false as final_is_hidden, i.ean, i.derived_ean,
      i.manufacture_year, i.pricing_rules, i.spec_overrides
    from public.webshop_rim_search_index i
    where i.is_visible
      and i.publish_status = ''published''
      and i.product_ready
      and ($1 is null or btrim($1) = '''' or i.search_text ilike ''%'' || lower(btrim($1)) || ''%'')
      and (
        coalesce(array_length($2, 1), 0) = 0
        or exists (
          select 1 from unnest($2) as selected_brand(brand_name)
          where lower(i.brand_display_name) = lower(btrim(selected_brand.brand_name))
        )
      )
      and ($3 is null or i.rim_diameter_in = $3)
      and ($4 is null or i.width_in = $4)
      and (coalesce(array_length($5, 1), 0) = 0 or i.width_in = any($5))
      and (
        public.catalog_normalize_rim_pcd($6) is null
        or public.catalog_normalize_rim_pcd($6) = ''all''
        or i.pcd_normalized = public.catalog_normalize_rim_pcd($6)
      )
      and ($7 is null or i.et_offset_mm = $7)
      and ($8 is null or coalesce(i.center_bore_mm, i.cb_mm) >= $8)
      and ($9 is null or btrim($9) = '''' or lower(btrim($9)) = ''all'' or i.color ilike btrim($9) or i.finish ilike btrim($9))
      and ($10 is null or btrim($10) = '''' or lower(btrim($10)) = ''all'' or i.material ilike btrim($10) or i.finish ilike btrim($10))
      and ($11 is null or i.bolts_included is not distinct from $11)
      and (coalesce($12, false) = false or i.in_stock)
    order by ' || v_order_sql || '
    limit least(greatest(coalesce($13, 24), 1), 100)
    offset greatest(coalesce($14, 0), 0)'
    using p_search, p_brands, p_diameter, p_width, p_widths, p_pcd, p_et_offset,
      p_center_bore_min, p_color, p_material, p_bolts_included, p_in_stock,
      p_limit, p_offset;
end;
$function$;

create or replace function public.catalog_count_rims_v1(
  p_search text default null,
  p_brands text[] default null,
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
set search_path to 'public'
as $function$
  select count(*)::bigint
  from public.webshop_rim_search_index i
  where i.is_visible
    and i.publish_status = 'published'
    and i.product_ready
    and (p_search is null or btrim(p_search) = '' or i.search_text ilike '%' || lower(btrim(p_search)) || '%')
    and (
      coalesce(array_length(p_brands, 1), 0) = 0
      or exists (
        select 1 from unnest(p_brands) as selected_brand(brand_name)
        where lower(i.brand_display_name) = lower(btrim(selected_brand.brand_name))
      )
    )
    and (p_diameter is null or i.rim_diameter_in = p_diameter)
    and (p_width is null or i.width_in = p_width)
    and (coalesce(array_length(p_widths, 1), 0) = 0 or i.width_in = any(p_widths))
    and (
      public.catalog_normalize_rim_pcd(p_pcd) is null
      or public.catalog_normalize_rim_pcd(p_pcd) = 'all'
      or i.pcd_normalized = public.catalog_normalize_rim_pcd(p_pcd)
    )
    and (p_et_offset is null or i.et_offset_mm = p_et_offset)
    and (p_center_bore_min is null or coalesce(i.center_bore_mm, i.cb_mm) >= p_center_bore_min)
    and (p_color is null or btrim(p_color) = '' or lower(btrim(p_color)) = 'all' or i.color ilike btrim(p_color) or i.finish ilike btrim(p_color))
    and (p_material is null or btrim(p_material) = '' or lower(btrim(p_material)) = 'all' or i.material ilike btrim(p_material) or i.finish ilike btrim(p_material))
    and (p_bolts_included is null or i.bolts_included is not distinct from p_bolts_included)
    and (coalesce(p_in_stock, false) = false or i.in_stock);
$function$;

select public.refresh_webshop_rim_filter_options_v1();

revoke all on function public.refresh_webshop_rim_filter_options_v1() from public;
grant execute on function public.refresh_webshop_rim_filter_options_v1() to service_role;

revoke all on function public.catalog_list_rim_filter_options_v1() from public;
grant execute on function public.catalog_list_rim_filter_options_v1() to anon, authenticated, service_role;

revoke all on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text, integer, integer) from public;
grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text, integer, integer) to anon, authenticated, service_role;

revoke all on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text) from public;
grant execute on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text) to anon, authenticated, service_role;

revoke all on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) to anon, authenticated, service_role;

revoke all on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated, service_role;
