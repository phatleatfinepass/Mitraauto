-- Webshop publish layer for tire items.
-- The website keeps using catalog_* tire RPCs, but those RPCs now read from
-- webshop_items built from catalog_selected_items + CMS-resolved overrides + effective images.

create table if not exists public.webshop_items (
  variant_id uuid primary key,
  product_type text not null check (product_type in ('tire')),
  selected_supplier text not null,
  selected_external_id text not null,
  match_key text not null,
  conflict_status text not null,
  conflict_reason text,

  brand text not null,
  brand_display_name text not null,
  brand_logo_url text,
  model text not null,
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
  currency text not null default 'EUR',
  in_stock boolean not null default false,
  stock_qty integer,
  delivery_days_min integer,
  delivery_days_max integer,
  supplier_code_best text,

  best_image_url text,
  hero_image_url text,
  gallery jsonb not null default '[]'::jsonb,
  best_image_alt text,

  card_title text,
  subtitle text,
  short_description text,
  long_description text,
  tags jsonb not null default '[]'::jsonb,
  seo_slug text,
  seo_title text,
  seo_description text,

  eu_label_json jsonb not null default '{}'::jsonb,
  eu_wet text,
  eu_noise numeric,
  derived_ean text,
  ean text,
  spec_overrides jsonb not null default '{}'::jsonb,
  pricing_rules jsonb,
  image_source text,
  is_visible boolean not null default true,
  publish_status text not null default 'published' check (publish_status in ('published', 'hidden', 'blocked')),
  publish_block_reason text,
  refreshed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.webshop_items enable row level security;

grant select on table public.webshop_items to anon, authenticated, service_role;
grant insert, update, delete on table public.webshop_items to service_role;

create index if not exists webshop_items_product_visible_idx
  on public.webshop_items (product_type, is_visible, brand_display_name, model);

create index if not exists webshop_items_tire_size_idx
  on public.webshop_items (width_mm, aspect_ratio, diameter_in)
  where product_type = 'tire' and is_visible;

create index if not exists webshop_items_price_idx
  on public.webshop_items (final_price_eur, price, variant_id)
  where is_visible;

create index if not exists webshop_items_supplier_idx
  on public.webshop_items (supplier_code_best, selected_external_id);

drop trigger if exists trg_webshop_items_updated_at on public.webshop_items;
create trigger trg_webshop_items_updated_at
before update on public.webshop_items
for each row
execute function public.catalog_selected_touch_updated_at();

drop policy if exists "Webshop items public read visible" on public.webshop_items;
create policy "Webshop items public read visible"
on public.webshop_items
for select
to anon, authenticated
using (is_visible and publish_status = 'published');

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
  p_in_stock boolean default false
)
returns boolean
language sql
stable
as $$
  select
    p_row.product_type = 'tire'
    and p_row.is_visible
    and p_row.publish_status = 'published'
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

create or replace function public.refresh_webshop_tire_items_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_upserted integer := 0;
  v_hidden integer := 0;
  v_result jsonb;
begin
  create temp table tmp_webshop_tire_items on commit drop as
  with src as (
    select
      s.*,
      coalesce(review.review_status, 'pending') as review_status,
      cms.cms_data->>'title' as title,
      cms.cms_data->>'subtitle' as cms_subtitle,
      cms.cms_data->>'short_description' as cms_short_description,
      cms.cms_data->>'long_description' as cms_long_description,
      cms.cms_data->>'seo_slug' as cms_seo_slug,
      cms.cms_data->>'seo_title' as cms_seo_title,
      cms.cms_data->>'seo_description' as cms_seo_description,
      coalesce(nullif(cms.cms_data->>'is_hidden', '')::boolean, false) as cms_is_hidden,
      coalesce(cms.cms_data->'spec_overrides', '{}'::jsonb) as spec_overrides,
      nullif(cms.cms_data->>'price_override_eur', '')::numeric as price_override_eur,
      coalesce(nullif(cms.cms_data->>'promo_enabled', '')::boolean, false) as promo_enabled,
      nullif(cms.cms_data->>'promo_price_eur', '')::numeric as promo_price_eur,
      nullif(cms.cms_data->>'promo_start', '')::timestamptz as promo_start,
      nullif(cms.cms_data->>'promo_end', '')::timestamptz as promo_end,
      images.hero_image_url as effective_hero_image_url,
      images.gallery as effective_gallery,
      images.image_source
    from public.catalog_selected_items s
    left join public.catalog_selected_tires_cms_admin_v1 cms
      on cms.variant_id = s.id
    left join public.catalog_selected_item_reviews review
      on review.selected_item_id = s.id
    left join public.catalog_selected_item_effective_images images
      on images.selected_item_id = s.id
    where s.product_type = 'tire'
      and s.is_available
  ),
  effective as (
    select
      id as variant_id,
      product_type,
      selected_supplier,
      selected_external_id,
      match_key,
      conflict_status,
      conflict_reason,
      coalesce(nullif(btrim(spec_overrides->'identity'->>'brand'), ''), brand) as brand,
      coalesce(nullif(btrim(spec_overrides->'identity'->>'brand'), ''), brand) as brand_display_name,
      null::text as brand_logo_url,
      coalesce(nullif(btrim(spec_overrides->'identity'->>'model'), ''), model) as model,
      coalesce(nullif(btrim(spec_overrides->'identity'->>'size_string'), ''), size_string) as size_string,
      coalesce(nullif(btrim(spec_overrides->'identity'->>'season'), ''), season) as season,
      coalesce(nullif(spec_overrides->'features'->>'studded', '')::boolean, studded) as studded,
      coalesce(nullif(spec_overrides->'features'->>'runflat', '')::boolean, runflat) as runflat,
      coalesce(nullif(spec_overrides->'features'->>'xl', '')::boolean, xl_reinforced) as xl_reinforced,
      coalesce(nullif(btrim(spec_overrides->'identity'->>'load_index'), ''), load_index) as load_index,
      coalesce(nullif(upper(btrim(spec_overrides->'identity'->>'speed_rating')), ''), speed_rating) as speed_rating,
      coalesce(nullif(upper(btrim(spec_overrides->'identity'->>'speed_rating')), ''), speed_rating) as speed_index,
      coalesce(nullif(spec_overrides->'features'->>'ev_ready', '')::boolean, ev_ready) as ev_ready,
      coalesce(nullif(spec_overrides->'features'->>'threepmsf', '')::boolean, threepmsf) as threepmsf,
      coalesce(nullif(spec_overrides->'features'->>'winter_approved', '')::boolean, winter_approved) as winter_approved,
      coalesce(nullif(spec_overrides->'features'->>'ice_approved', '')::boolean, ice_approved) as ice_approved,
      width_mm,
      aspect_ratio,
      diameter_in,
      null::numeric as width_in,
      null::numeric as rim_diameter_in,
      null::numeric as et_offset_mm,
      null::text as bolt_pattern,
      null::text as color,
      null::text as finish,
      fair_cost_ex_vat as price,
      case
        when coalesce(promo_enabled, false)
          and promo_price_eur is not null
          and (promo_start is null or promo_start <= now())
          and (promo_end is null or promo_end >= now())
          then promo_price_eur
        when price_override_eur is not null then price_override_eur
        else fair_cost_ex_vat
      end as final_price_eur,
      'EUR'::text as currency,
      in_stock,
      stock_qty,
      delivery_days_min,
      delivery_days_max,
      selected_supplier as supplier_code_best,
      effective_hero_image_url as best_image_url,
      effective_hero_image_url as hero_image_url,
      coalesce(effective_gallery, '[]'::jsonb) as gallery,
      null::text as best_image_alt,
      coalesce(nullif(btrim(title), ''), nullif(btrim(concat_ws(' ', brand, model)), '')) as card_title,
      cms_subtitle as subtitle,
      cms_short_description as short_description,
      cms_long_description as long_description,
      to_jsonb(array_remove(array[
        case when coalesce(nullif(spec_overrides->'features'->>'runflat', '')::boolean, runflat, false) then 'runflat' end,
        case when coalesce(nullif(spec_overrides->'features'->>'xl', '')::boolean, xl_reinforced, false) then 'xl' end,
        case when coalesce(nullif(spec_overrides->'features'->>'studded', '')::boolean, studded, false) then 'studded' end,
        case when coalesce(nullif(spec_overrides->'features'->>'ev_ready', '')::boolean, ev_ready, false) then 'ev' end,
        case when coalesce(nullif(spec_overrides->'features'->>'threepmsf', '')::boolean, threepmsf, false) then '3pmsf' end
      ]::text[], null)) as tags,
      cms_seo_slug as seo_slug,
      cms_seo_title as seo_title,
      cms_seo_description as seo_description,
      jsonb_strip_nulls(eu_label_json || jsonb_build_object(
        'fuel_class', coalesce(nullif(btrim(spec_overrides->'eu'->>'fuel_class'), ''), eu_fuel_class),
        'wet_grip_class', coalesce(nullif(btrim(spec_overrides->'eu'->>'wet_grip_class'), ''), eu_wet_grip_class),
        'noise_db', coalesce(nullif(spec_overrides->'eu'->>'noise_db', '')::integer, eu_noise_db),
        'noise_class', coalesce(nullif(btrim(spec_overrides->'eu'->>'noise_class'), ''), eu_noise_class)
      )) as eu_label_json,
      coalesce(nullif(btrim(spec_overrides->'eu'->>'wet_grip_class'), ''), eu_wet_grip_class) as eu_wet,
      coalesce(nullif(spec_overrides->'eu'->>'noise_db', '')::numeric, eu_noise_db::numeric) as eu_noise,
      ean as derived_ean,
      coalesce(nullif(regexp_replace(spec_overrides->'identity'->>'ean', '\D', '', 'g'), ''), ean) as ean,
      spec_overrides,
      spec_overrides->'pricing_rules' as pricing_rules,
      image_source,
      not cms_is_hidden
        and fair_cost_ex_vat is not null
        and (
          conflict_status in ('resolved', 'manual_selected')
          or review_status in ('accepted', 'manual_selected')
        )
        and coalesce(nullif(spec_overrides->'classification'->>'non_passenger_manual', '')::boolean, false) = false as is_visible,
      case
        when cms_is_hidden then 'hidden'
        when fair_cost_ex_vat is null then 'blocked'
        when conflict_status not in ('resolved', 'manual_selected')
          and review_status not in ('accepted', 'manual_selected') then 'blocked'
        when coalesce(nullif(spec_overrides->'classification'->>'non_passenger_manual', '')::boolean, false) then 'blocked'
        else 'published'
      end as publish_status,
      case
        when cms_is_hidden then 'cms_hidden'
        when fair_cost_ex_vat is null then 'missing_price'
        when conflict_status not in ('resolved', 'manual_selected')
          and review_status not in ('accepted', 'manual_selected') then 'unresolved_conflict'
        when coalesce(nullif(spec_overrides->'classification'->>'non_passenger_manual', '')::boolean, false) then 'manual_non_passenger'
        else null
      end as publish_block_reason
    from src
  )
  select * from effective;

  insert into public.webshop_items (
    variant_id,
    product_type,
    selected_supplier,
    selected_external_id,
    match_key,
    conflict_status,
    conflict_reason,
    brand,
    brand_display_name,
    brand_logo_url,
    model,
    size_string,
    season,
    studded,
    runflat,
    xl_reinforced,
    load_index,
    speed_rating,
    speed_index,
    ev_ready,
    threepmsf,
    winter_approved,
    ice_approved,
    width_mm,
    aspect_ratio,
    diameter_in,
    width_in,
    rim_diameter_in,
    et_offset_mm,
    bolt_pattern,
    color,
    finish,
    price,
    final_price_eur,
    currency,
    in_stock,
    stock_qty,
    delivery_days_min,
    delivery_days_max,
    supplier_code_best,
    best_image_url,
    hero_image_url,
    gallery,
    best_image_alt,
    card_title,
    subtitle,
    short_description,
    long_description,
    tags,
    seo_slug,
    seo_title,
    seo_description,
    eu_label_json,
    eu_wet,
    eu_noise,
    derived_ean,
    ean,
    spec_overrides,
    pricing_rules,
    image_source,
    is_visible,
    publish_status,
    publish_block_reason,
    refreshed_at
  )
  select
    variant_id,
    product_type,
    selected_supplier,
    selected_external_id,
    match_key,
    conflict_status,
    conflict_reason,
    brand,
    brand_display_name,
    brand_logo_url,
    model,
    size_string,
    season,
    studded,
    runflat,
    xl_reinforced,
    load_index,
    speed_rating,
    speed_index,
    ev_ready,
    threepmsf,
    winter_approved,
    ice_approved,
    width_mm,
    aspect_ratio,
    diameter_in,
    width_in,
    rim_diameter_in,
    et_offset_mm,
    bolt_pattern,
    color,
    finish,
    price,
    final_price_eur,
    currency,
    in_stock,
    stock_qty,
    delivery_days_min,
    delivery_days_max,
    supplier_code_best,
    best_image_url,
    hero_image_url,
    gallery,
    best_image_alt,
    card_title,
    subtitle,
    short_description,
    long_description,
    coalesce(tags, '[]'::jsonb),
    seo_slug,
    seo_title,
    seo_description,
    eu_label_json,
    eu_wet,
    eu_noise,
    derived_ean,
    ean,
    spec_overrides,
    pricing_rules,
    image_source,
    is_visible,
    publish_status,
    publish_block_reason,
    now()
  from tmp_webshop_tire_items
  on conflict (variant_id) do update set
    selected_supplier = excluded.selected_supplier,
    selected_external_id = excluded.selected_external_id,
    match_key = excluded.match_key,
    conflict_status = excluded.conflict_status,
    conflict_reason = excluded.conflict_reason,
    brand = excluded.brand,
    brand_display_name = excluded.brand_display_name,
    brand_logo_url = excluded.brand_logo_url,
    model = excluded.model,
    size_string = excluded.size_string,
    season = excluded.season,
    studded = excluded.studded,
    runflat = excluded.runflat,
    xl_reinforced = excluded.xl_reinforced,
    load_index = excluded.load_index,
    speed_rating = excluded.speed_rating,
    speed_index = excluded.speed_index,
    ev_ready = excluded.ev_ready,
    threepmsf = excluded.threepmsf,
    winter_approved = excluded.winter_approved,
    ice_approved = excluded.ice_approved,
    width_mm = excluded.width_mm,
    aspect_ratio = excluded.aspect_ratio,
    diameter_in = excluded.diameter_in,
    price = excluded.price,
    final_price_eur = excluded.final_price_eur,
    currency = excluded.currency,
    in_stock = excluded.in_stock,
    stock_qty = excluded.stock_qty,
    delivery_days_min = excluded.delivery_days_min,
    delivery_days_max = excluded.delivery_days_max,
    supplier_code_best = excluded.supplier_code_best,
    best_image_url = excluded.best_image_url,
    hero_image_url = excluded.hero_image_url,
    gallery = excluded.gallery,
    best_image_alt = excluded.best_image_alt,
    card_title = excluded.card_title,
    subtitle = excluded.subtitle,
    short_description = excluded.short_description,
    long_description = excluded.long_description,
    tags = excluded.tags,
    seo_slug = excluded.seo_slug,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    eu_label_json = excluded.eu_label_json,
    eu_wet = excluded.eu_wet,
    eu_noise = excluded.eu_noise,
    derived_ean = excluded.derived_ean,
    ean = excluded.ean,
    spec_overrides = excluded.spec_overrides,
    pricing_rules = excluded.pricing_rules,
    image_source = excluded.image_source,
    is_visible = excluded.is_visible,
    publish_status = excluded.publish_status,
    publish_block_reason = excluded.publish_block_reason,
    refreshed_at = now(),
    updated_at = now();

  get diagnostics v_upserted = row_count;

  update public.webshop_items w
  set
    is_visible = false,
    publish_status = 'hidden',
    publish_block_reason = 'not_in_selected_catalog',
    refreshed_at = now(),
    updated_at = now()
  where w.product_type = 'tire'
    and not exists (
      select 1
      from tmp_webshop_tire_items t
      where t.variant_id = w.variant_id
    );

  get diagnostics v_hidden = row_count;

  select jsonb_build_object(
    'upserted_total', v_upserted,
    'hidden_total', v_hidden,
    'summary', jsonb_build_object(
      'total', (select count(*) from public.webshop_items where product_type = 'tire'),
      'published', (select count(*) from public.webshop_items where product_type = 'tire' and is_visible and publish_status = 'published'),
      'hidden', (select count(*) from public.webshop_items where product_type = 'tire' and publish_status = 'hidden'),
      'blocked', (select count(*) from public.webshop_items where product_type = 'tire' and publish_status = 'blocked'),
      'with_image', (select count(*) from public.webshop_items where product_type = 'tire' and is_visible and hero_image_url is not null)
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.refresh_webshop_tire_items_v1() to service_role, authenticated;

create or replace function public.catalog_list_tire_brands_v1()
returns table (
  brand text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct coalesce(nullif(btrim(w.brand_display_name), ''), w.brand) as brand
  from public.webshop_items w
  where w.product_type = 'tire'
    and w.is_visible
    and w.publish_status = 'published'
    and nullif(btrim(coalesce(w.brand_display_name, w.brand)), '') is not null
  order by 1 asc;
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
  p_in_stock boolean default false
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
    p_in_stock
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
    p_in_stock
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

revoke all on function public.catalog_list_tire_brands_v1() from public;
grant execute on function public.catalog_list_tire_brands_v1() to anon, authenticated;

revoke all on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean) from public;
grant execute on function public.catalog_count_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean) to anon, authenticated;

revoke all on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer) from public;
grant execute on function public.catalog_list_tires_v1(text, text[], numeric, numeric, numeric, text, boolean, boolean, boolean, boolean, text, integer, integer) to anon, authenticated;
