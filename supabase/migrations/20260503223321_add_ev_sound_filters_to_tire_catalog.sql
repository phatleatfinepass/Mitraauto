alter table public.webshop_items
  add column if not exists sound_absorber boolean;

alter table public.catalog_selected_items
  add column if not exists sound_absorber boolean;

create or replace function public.webshop_tire_text_blob(p_row public.webshop_items)
returns text
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
    p_row.short_description,
    p_row.long_description,
    p_row.seo_slug,
    p_row.tags::text,
    p_row.eu_label_json::text
  ));
$$;

create or replace function public.webshop_tire_is_ev_ready(p_row public.webshop_items)
returns boolean
language sql
stable
as $$
  select coalesce(p_row.ev_ready, false)
    or public.webshop_tire_text_blob(p_row) ~* '(^|[^[:alnum:]])(ev|e[.]v[.])([^[:alnum:]]|$)|electric|elect';
$$;

create or replace function public.webshop_tire_has_sound_absorber(p_row public.webshop_items)
returns boolean
language sql
stable
as $$
  select coalesce(p_row.sound_absorber, false)
    or public.webshop_tire_text_blob(p_row) ~* 'sound|absorber|acoustic|silent|foam|contisilent|pncs|silentdrive|sponge|noise[ -]?reduc|b[ -]?silent|k[ -]?silent';
$$;

update public.webshop_items w
set ev_ready = true
where w.product_type = 'tire'
  and coalesce(w.ev_ready, false) = false
  and public.webshop_tire_is_ev_ready(w);

update public.webshop_items w
set sound_absorber = true
where w.product_type = 'tire'
  and coalesce(w.sound_absorber, false) = false
  and public.webshop_tire_has_sound_absorber(w);

update public.catalog_selected_items c
set ev_ready = true
where c.product_type = 'tire'
  and coalesce(c.ev_ready, false) = false
  and lower(concat_ws(
    ' ',
    c.brand,
    c.model,
    c.supplier_title,
    c.size_string,
    c.supplier_metadata_json::text,
    c.alternative_offers_json::text,
    c.eu_label_json::text
  )) ~* '(^|[^[:alnum:]])(ev|e[.]v[.])([^[:alnum:]]|$)|electric|elect';

update public.catalog_selected_items c
set sound_absorber = true
where c.product_type = 'tire'
  and coalesce(c.sound_absorber, false) = false
  and lower(concat_ws(
    ' ',
    c.brand,
    c.model,
    c.supplier_title,
    c.size_string,
    c.supplier_metadata_json::text,
    c.alternative_offers_json::text,
    c.eu_label_json::text
  )) ~* 'sound|absorber|acoustic|silent|foam|contisilent|pncs|silentdrive|sponge|noise[ -]?reduc|b[ -]?silent|k[ -]?silent';

drop function if exists public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean);
drop function if exists public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean);
drop function if exists public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean);
drop function if exists public.catalog_count_tires_v1(text, numeric, numeric, numeric, text, boolean, boolean, boolean, boolean);
drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_list_tires_v1(text, numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer);
drop function if exists public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean);
drop function if exists public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean);
drop function if exists public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean);

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
  p_sound_absorber boolean default false
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
    and (p_ean is null or btrim(p_ean) = '' or coalesce(p_row.ean, p_row.derived_ean, '') ilike '%' || regexp_replace(p_ean, '\D', '', 'g') || '%')
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
  p_sound_absorber boolean default false
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
    p_runflat, p_xl, p_studded, p_in_stock, p_include_retreaded, p_ev_ready, p_sound_absorber
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
    w, p_search, p_brands, p_width, p_aspect_ratio, p_diameter, p_season, p_ean,
    p_runflat, p_xl, p_studded, p_in_stock, p_include_retreaded, p_ev_ready, p_sound_absorber
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

create or replace function public.catalog_selected_tire_cms_matches_filters(
  p_row public.catalog_selected_tires_cms_admin_v1,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_missing_seo_fields text[] default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    (
      coalesce(array_length(p_missing_metadata_fields, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_missing_metadata_fields) as selected_field(field_name)
        where case selected_field.field_name
          when 'brand' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'brand', p_row.brand)), '') is null
          when 'model' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'model', p_row.model)), '') is null
          when 'ean' then nullif(regexp_replace(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'ean', p_row.derived_ean, p_row.ean, ''), '\D', '', 'g'), '') is null
          when 'size' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'size_string', p_row.size_string)), '') is null
          when 'season' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'identity'->>'season', p_row.season)), '') is null
          when 'ev_ready' then coalesce((p_row.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'ev_ready')::boolean, (p_row.cms_data->'spec_overrides'->'features'->>'ev_ready')::boolean, p_row.ev_ready, false) = false
          when 'sound_absorber' then coalesce(
            (p_row.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'sound_absorber')::boolean,
            (p_row.cms_data->'spec_overrides'->'features'->>'sound_absorber')::boolean,
            (select c.sound_absorber from public.catalog_selected_items c where c.id = p_row.variant_id),
            false
          ) = false
          when 'runflat' then coalesce((p_row.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'runflat')::boolean, (p_row.cms_data->'spec_overrides'->'features'->>'runflat')::boolean, p_row.runflat, false) = false
          when 'xl' then coalesce((p_row.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'extra_load')::boolean, (p_row.cms_data->'spec_overrides'->'features'->>'xl')::boolean, p_row.xl_reinforced, false) = false
          when 'studded' then coalesce((p_row.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'studded')::boolean, (p_row.cms_data->'spec_overrides'->'features'->>'studded')::boolean, p_row.studded, false) = false
          when 'threepmsf' then coalesce((p_row.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'threepmsf')::boolean, (p_row.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'severe_snow')::boolean, (p_row.cms_data->'spec_overrides'->'features'->>'threepmsf')::boolean, p_row.threepmsf, false) = false
          when 'winter_approved' then coalesce((p_row.cms_data->'spec_overrides'->'tyre_label_section'->'badges'->>'winter_approved')::boolean, (p_row.cms_data->'spec_overrides'->'features'->>'winter_approved')::boolean, p_row.winter_approved, false) = false
          when 'ice_approved' then coalesce((p_row.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'severe_ice')::boolean, (p_row.cms_data->'spec_overrides'->'features'->>'ice_approved')::boolean, p_row.ice_approved, false) = false
          when 'eu_fuel_class' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'eu'->>'fuel_class', p_row.eu_label_json->>'fuel_class')), '') is null
          when 'eu_wet_grip_class' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'eu'->>'wet_grip_class', p_row.eu_wet)), '') is null
          when 'eu_noise_db' then coalesce((p_row.cms_data->'spec_overrides'->'eu'->>'noise_db')::numeric, p_row.eu_noise) is null
          when 'eu_noise_class' then nullif(btrim(coalesce(p_row.cms_data->'spec_overrides'->'eu'->>'noise_class', p_row.eu_label_json->>'noise_class')), '') is null
          else false
        end
      )
    )
    and (
      not p_missing_image_only
      or (
        nullif(btrim(coalesce(p_row.cms_data->>'hero_image_url', '')), '') is null
        and case
          when jsonb_typeof(coalesce(p_row.cms_data->'gallery', '[]'::jsonb)) = 'array'
            then jsonb_array_length(coalesce(p_row.cms_data->'gallery', '[]'::jsonb)) = 0
          else true
        end
      )
    )
    and (
      coalesce(array_length(p_missing_seo_fields, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_missing_seo_fields) as selected_field(field_name)
        where case selected_field.field_name
          when 'title' then nullif(btrim(coalesce(p_row.cms_data->>'title', '')), '') is null
          when 'subtitle' then nullif(btrim(coalesce(p_row.cms_data->>'subtitle', '')), '') is null
          when 'short_description' then nullif(btrim(coalesce(p_row.cms_data->>'short_description', '')), '') is null
          when 'long_description' then nullif(btrim(coalesce(p_row.cms_data->>'long_description', '')), '') is null
          when 'seo_slug' then nullif(btrim(coalesce(p_row.cms_data->>'seo_slug', '')), '') is null
          when 'seo_title' then nullif(btrim(coalesce(p_row.cms_data->>'seo_title', '')), '') is null
          when 'seo_description' then nullif(btrim(coalesce(p_row.cms_data->>'seo_description', '')), '') is null
          else false
        end
      )
    );
$$;

revoke all on function public.webshop_tire_text_blob(public.webshop_items) from public;
grant execute on function public.webshop_tire_text_blob(public.webshop_items) to anon, authenticated, service_role;
revoke all on function public.webshop_tire_is_ev_ready(public.webshop_items) from public;
grant execute on function public.webshop_tire_is_ev_ready(public.webshop_items) to anon, authenticated, service_role;
revoke all on function public.webshop_tire_has_sound_absorber(public.webshop_items) from public;
grant execute on function public.webshop_tire_has_sound_absorber(public.webshop_items) to anon, authenticated, service_role;
revoke all on function public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean) from public;
grant execute on function public.webshop_tire_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean) to anon, authenticated, service_role;
grant execute on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean) to anon, authenticated;
grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, integer, integer) to anon, authenticated;
revoke all on function public.catalog_selected_tire_cms_matches_filters(public.catalog_selected_tires_cms_admin_v1, text[], boolean, text[]) from public;
grant execute on function public.catalog_selected_tire_cms_matches_filters(public.catalog_selected_tires_cms_admin_v1, text[], boolean, text[]) to authenticated, service_role;

drop function if exists public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer);

create or replace function public.cms_list_tires_admin_v1(
  p_search text default null,
  p_missing_ean_only boolean default false,
  p_exclude_non_passenger boolean default true,
  p_supplier_code text default null,
  p_missing_metadata_fields text[] default null,
  p_missing_image_only boolean default false,
  p_has_eprel_only boolean default false,
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
  sound_absorber boolean,
  cms_data jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    mv.variant_id,
    mv.product_type,
    mv.derived_ean,
    mv.supplier_code_best,
    mv.supplier_external_id_best,
    mv.brand,
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
    mv.eu_wet,
    mv.eu_noise,
    mv.eu_label_json,
    mv.final_price_eur,
    mv.price,
    mv.ean_conflict_open,
    mv.width_mm,
    mv.aspect_ratio,
    mv.diameter_in,
    mv.ean,
    mv.has_ean_multi_spec_conflict,
    mv.has_mandatory_conflict,
    mv.missing_supplier_price,
    mv.is_non_passenger_auto,
    mv.is_non_passenger_manual,
    mv.is_non_passenger,
    coalesce((select c.sound_absorber from public.catalog_selected_items c where c.id = mv.variant_id), false) as sound_absorber,
    mv.cms_data
  from public.catalog_selected_tires_cms_admin_v1 mv
  where public.catalog_selected_tire_cms_matches_search(mv, p_search)
    and (not p_exclude_non_passenger or coalesce(mv.is_non_passenger, false) = false)
    and (p_supplier_code is null or btrim(p_supplier_code) = '' or upper(coalesce(mv.supplier_code_best, '')) = upper(btrim(p_supplier_code)))
    and (not p_missing_ean_only or coalesce(mv.derived_ean, mv.ean) is null)
    and (
      not p_has_eprel_only
      or nullif(
        btrim(
          coalesce(
            mv.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'eprel_registration_number',
            mv.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'eprel_qr_url',
            mv.cms_data->'spec_overrides'->'tyre_label_section'->'eu_label'->>'eprel_sheet_url',
            mv.eu_label_json->>'eprel_registration_number',
            mv.eu_label_json->>'eprel_code',
            mv.eu_label_json->>'eprel_id',
            mv.eu_label_json->>'eprel',
            mv.eu_label_json->>'register_code',
            mv.eu_label_json->>'eprel_qr_url',
            mv.eu_label_json->>'qr_url',
            mv.eu_label_json->>'eprel_sheet_url',
            mv.eu_label_json->>'eprel_fiche_url',
            ''
          )
        ),
        ''
      ) is not null
    )
    and public.catalog_selected_tire_cms_matches_filters(mv, p_missing_metadata_fields, p_missing_image_only, p_missing_seo_fields)
  order by mv.brand asc, mv.model asc, mv.size_string asc, mv.variant_id asc
  limit greatest(coalesce(p_limit, 26), 1)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer) from public;
grant execute on function public.cms_list_tires_admin_v1(text, boolean, boolean, text, text[], boolean, boolean, text[], integer, integer) to authenticated;
