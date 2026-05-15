set lock_timeout = '5s';
set statement_timeout = '120s';

create extension if not exists pg_trgm with schema extensions;

create table if not exists public.webshop_tire_search_index (
  variant_id uuid primary key,
  product_type text not null default 'tire' check (product_type = 'tire'),
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
  manufacture_year integer,
  is_visible boolean not null default false,
  publish_status text,
  publish_block_reason text,
  product_ready boolean not null default false,
  readiness_reasons text[] not null default '{}',
  primary_readiness_reason text,
  search_text text not null default '',
  brand_sort text not null default '',
  model_sort text not null default '',
  price_sort numeric,
  is_retreaded boolean not null default false,
  image_ready boolean not null default false,
  stock_ready boolean not null default false,
  seo_ready boolean not null default false,
  source_updated_at timestamptz,
  indexed_at timestamptz not null default now()
);

create table if not exists public.webshop_rim_search_index (
  variant_id uuid primary key,
  product_type text not null default 'rim' check (product_type = 'rim'),
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
  pcd_normalized text,
  center_bore_mm numeric,
  cb_mm numeric,
  color text,
  finish text,
  material text,
  bolts_included boolean,
  wheel_load_kg numeric,
  price numeric,
  final_price_eur numeric,
  currency text,
  in_stock boolean,
  stock_qty integer,
  delivery_days_min integer,
  delivery_days_max integer,
  supplier_code_best text,
  supplier_external_id_best text,
  best_image_url text,
  hero_image_url text,
  gallery jsonb,
  best_image_alt text,
  card_title text,
  title text,
  subtitle text,
  short_description text,
  long_description text,
  generated_tags jsonb,
  tags jsonb,
  seo_slug text,
  seo_title text,
  seo_description text,
  eu_label_json jsonb,
  eu_fuel text,
  eu_wet text,
  eu_noise numeric,
  ean text,
  derived_ean text,
  manufacture_year integer,
  pricing_rules jsonb,
  spec_overrides jsonb,
  is_visible boolean not null default false,
  publish_status text,
  publish_block_reason text,
  product_ready boolean not null default false,
  readiness_reasons text[] not null default '{}',
  primary_readiness_reason text,
  search_text text not null default '',
  brand_sort text not null default '',
  model_sort text not null default '',
  price_sort numeric,
  image_ready boolean not null default false,
  stock_ready boolean not null default false,
  seo_ready boolean not null default false,
  source_updated_at timestamptz,
  indexed_at timestamptz not null default now()
);

alter table public.webshop_tire_search_index enable row level security;
alter table public.webshop_rim_search_index enable row level security;

drop policy if exists "public can read published ready tire index" on public.webshop_tire_search_index;
create policy "public can read published ready tire index"
  on public.webshop_tire_search_index
  for select
  to anon, authenticated
  using (is_visible and publish_status = 'published' and product_ready);

drop policy if exists "service role can manage tire index" on public.webshop_tire_search_index;
create policy "service role can manage tire index"
  on public.webshop_tire_search_index
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "public can read published ready rim index" on public.webshop_rim_search_index;
create policy "public can read published ready rim index"
  on public.webshop_rim_search_index
  for select
  to anon, authenticated
  using (is_visible and publish_status = 'published' and product_ready);

drop policy if exists "service role can manage rim index" on public.webshop_rim_search_index;
create policy "service role can manage rim index"
  on public.webshop_rim_search_index
  for all
  to service_role
  using (true)
  with check (true);

grant select on public.webshop_tire_search_index to anon, authenticated;
grant select, insert, update, delete on public.webshop_tire_search_index to service_role;
grant select on public.webshop_rim_search_index to anon, authenticated;
grant select, insert, update, delete on public.webshop_rim_search_index to service_role;

create index if not exists webshop_tire_search_index_search_trgm_idx
  on public.webshop_tire_search_index using gin (search_text gin_trgm_ops);
create index if not exists webshop_tire_search_index_brand_idx
  on public.webshop_tire_search_index (brand_sort, model_sort, variant_id)
  where is_visible and publish_status = 'published' and product_ready;
create index if not exists webshop_tire_search_index_price_idx
  on public.webshop_tire_search_index (price_sort, brand_sort, model_sort, variant_id)
  where is_visible and publish_status = 'published' and product_ready;
create index if not exists webshop_tire_search_index_size_idx
  on public.webshop_tire_search_index (width_mm, aspect_ratio, diameter_in, season, tire_segment, variant_id)
  where is_visible and publish_status = 'published' and product_ready;
create index if not exists webshop_tire_search_index_features_idx
  on public.webshop_tire_search_index (runflat, xl_reinforced, studded, ev_ready, sound_absorber, in_stock, variant_id)
  where is_visible and publish_status = 'published' and product_ready;
create index if not exists webshop_tire_search_index_eu_idx
  on public.webshop_tire_search_index (eu_wet, eu_noise, variant_id)
  where is_visible and publish_status = 'published' and product_ready;

create index if not exists webshop_rim_search_index_search_trgm_idx
  on public.webshop_rim_search_index using gin (search_text gin_trgm_ops);
create index if not exists webshop_rim_search_index_brand_idx
  on public.webshop_rim_search_index (brand_sort, model_sort, variant_id)
  where is_visible and publish_status = 'published' and product_ready;
create index if not exists webshop_rim_search_index_price_idx
  on public.webshop_rim_search_index (price_sort, brand_sort, model_sort, variant_id)
  where is_visible and publish_status = 'published' and product_ready;
create index if not exists webshop_rim_search_index_fitment_idx
  on public.webshop_rim_search_index (rim_diameter_in, width_in, pcd_normalized, et_offset_mm, center_bore_mm, cb_mm, variant_id)
  where is_visible and publish_status = 'published' and product_ready;
create index if not exists webshop_rim_search_index_options_idx
  on public.webshop_rim_search_index (color, finish, material, bolts_included, in_stock, variant_id)
  where is_visible and publish_status = 'published' and product_ready;

create or replace function public.refresh_webshop_tire_search_index_item_v1(p_variant_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer := 0;
begin
  delete from public.webshop_tire_search_index where variant_id = p_variant_id;

  insert into public.webshop_tire_search_index (
    variant_id, product_type, tire_segment, brand, brand_display_name, brand_logo_url,
    model, size_string, season, studded, runflat, xl_reinforced, load_index,
    speed_rating, speed_index, ev_ready, sound_absorber, threepmsf,
    winter_approved, ice_approved, width_mm, aspect_ratio, diameter_in, width_in,
    rim_diameter_in, et_offset_mm, bolt_pattern, color, finish, price,
    final_price_eur, currency, in_stock, stock_qty, delivery_days_min,
    delivery_days_max, supplier_code_best, best_image_url, hero_image_url,
    gallery, best_image_alt, card_title, subtitle, short_description,
    long_description, tags, seo_slug, ean, derived_ean, eu_label_json,
    eu_wet, eu_noise, manufacture_year, is_visible, publish_status,
    publish_block_reason, product_ready, readiness_reasons, primary_readiness_reason,
    search_text, brand_sort, model_sort, price_sort, is_retreaded, image_ready,
    stock_ready, seo_ready, source_updated_at, indexed_at
  )
  select
    w.variant_id,
    w.product_type,
    w.tire_segment,
    w.brand,
    coalesce(nullif(w.brand_display_name, ''), w.brand),
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
    public.webshop_tire_is_ev_ready(w),
    public.webshop_tire_has_sound_absorber(w),
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
    coalesce(w.in_stock, false),
    w.stock_qty,
    w.delivery_days_min,
    w.delivery_days_max,
    w.supplier_code_best,
    w.best_image_url,
    w.hero_image_url,
    case when jsonb_typeof(coalesce(w.gallery, '[]'::jsonb)) = 'array' then coalesce(w.gallery, '[]'::jsonb) else '[]'::jsonb end,
    w.best_image_alt,
    w.card_title,
    w.subtitle,
    w.short_description,
    w.long_description,
    coalesce(w.tags, '[]'::jsonb),
    w.seo_slug,
    w.ean,
    w.derived_ean,
    w.eu_label_json,
    w.eu_wet,
    w.eu_noise,
    w.manufacture_year,
    coalesce(w.is_visible, false),
    w.publish_status,
    w.publish_block_reason,
    coalesce(w.product_ready, false),
    coalesce(w.readiness_reasons, '{}'::text[]),
    w.primary_readiness_reason,
    lower(concat_ws(' ', w.brand, w.brand_display_name, w.model, w.size_string, w.card_title, w.ean, w.derived_ean, w.season, w.tire_segment)),
    lower(coalesce(nullif(w.brand_display_name, ''), w.brand, '')),
    lower(coalesce(w.model, '')),
    coalesce(w.final_price_eur, w.price),
    public.webshop_tire_is_retreaded(w),
    nullif(coalesce(w.best_image_url, w.hero_image_url, ''), '') is not null,
    coalesce(w.in_stock, false) and coalesce(w.stock_qty, 0) > 0,
    nullif(coalesce(w.seo_slug, w.seo_title, w.seo_description, ''), '') is not null,
    w.updated_at,
    now()
  from public.webshop_items w
  where w.variant_id = p_variant_id
    and w.product_type = 'tire'
    and w.publish_status = 'published';

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

create or replace function public.refresh_webshop_rim_search_index_item_v1(p_variant_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer := 0;
begin
  delete from public.webshop_rim_search_index where variant_id = p_variant_id;

  insert into public.webshop_rim_search_index (
    variant_id, product_type, brand, brand_display_name, brand_logo_url, model,
    size_string, season, studded, runflat, xl_reinforced, load_index,
    speed_rating, speed_index, ev_ready, sound_absorber, threepmsf,
    winter_approved, ice_approved, width_mm, aspect_ratio, diameter_in,
    width_in, rim_diameter_in, et_offset_mm, bolt_pattern, pcd_normalized,
    center_bore_mm, cb_mm, color, finish, material, bolts_included,
    wheel_load_kg, price, final_price_eur, currency, in_stock, stock_qty,
    delivery_days_min, delivery_days_max, supplier_code_best,
    supplier_external_id_best, best_image_url, hero_image_url, gallery,
    best_image_alt, card_title, title, subtitle, short_description,
    long_description, generated_tags, tags, seo_slug, seo_title,
    seo_description, eu_label_json, eu_fuel, eu_wet, eu_noise, ean,
    derived_ean, manufacture_year, pricing_rules, spec_overrides, is_visible,
    publish_status, publish_block_reason, product_ready, readiness_reasons,
    primary_readiness_reason, search_text, brand_sort, model_sort, price_sort,
    image_ready, stock_ready, seo_ready, source_updated_at, indexed_at
  )
  select
    w.variant_id,
    w.product_type,
    w.brand,
    coalesce(nullif(w.brand_display_name, ''), w.brand),
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
    w.sound_absorber,
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
    public.catalog_normalize_rim_pcd(w.bolt_pattern),
    coalesce(w.center_bore_mm, w.cb_mm),
    coalesce(w.cb_mm, w.center_bore_mm),
    w.color,
    w.finish,
    coalesce(nullif(w.material, ''), nullif(w.finish, '')),
    w.bolts_included,
    w.wheel_load_kg,
    w.price,
    coalesce(w.final_price_eur, w.price),
    w.currency,
    coalesce(w.in_stock, false),
    w.stock_qty,
    w.delivery_days_min,
    w.delivery_days_max,
    w.supplier_code_best,
    w.supplier_external_id_best,
    coalesce(nullif(w.best_image_url, ''), nullif(w.hero_image_url, '')),
    coalesce(nullif(w.hero_image_url, ''), nullif(w.best_image_url, '')),
    case
      when jsonb_typeof(coalesce(w.gallery, '[]'::jsonb)) = 'array' then coalesce(w.gallery, '[]'::jsonb)
      when nullif(w.hero_image_url, '') is not null then jsonb_build_array(w.hero_image_url)
      when nullif(w.best_image_url, '') is not null then jsonb_build_array(w.best_image_url)
      else '[]'::jsonb
    end,
    w.best_image_alt,
    w.card_title,
    w.card_title,
    w.subtitle,
    w.short_description,
    w.long_description,
    gt.generated_tags,
    public.catalog_merge_jsonb_text_tags(gt.generated_tags, coalesce(w.tags, '[]'::jsonb)),
    w.seo_slug,
    w.seo_title,
    w.seo_description,
    w.eu_label_json,
    null::text,
    w.eu_wet,
    w.eu_noise,
    w.ean,
    w.derived_ean,
    w.manufacture_year,
    w.pricing_rules,
    coalesce(w.spec_overrides, '{}'::jsonb),
    coalesce(w.is_visible, false),
    w.publish_status,
    w.publish_block_reason,
    coalesce(w.product_ready, false),
    coalesce(w.readiness_reasons, '{}'::text[]),
    w.primary_readiness_reason,
    lower(concat_ws(' ', w.brand, w.brand_display_name, w.model, w.size_string, w.card_title, w.color, w.finish, w.material, w.ean, w.derived_ean, w.bolt_pattern, public.catalog_normalize_rim_pcd(w.bolt_pattern), coalesce(w.tags, '[]'::jsonb)::text)),
    lower(coalesce(nullif(w.brand_display_name, ''), w.brand, '')),
    lower(coalesce(w.model, '')),
    coalesce(w.final_price_eur, w.price),
    nullif(coalesce(w.best_image_url, w.hero_image_url, ''), '') is not null,
    coalesce(w.in_stock, false) and coalesce(w.stock_qty, 0) > 0,
    nullif(coalesce(w.seo_slug, w.seo_title, w.seo_description, ''), '') is not null,
    w.updated_at,
    now()
  from public.webshop_items w
  cross join lateral (
    select public.catalog_build_rim_generated_tags(
      w.width_in,
      w.rim_diameter_in,
      w.bolt_pattern,
      w.et_offset_mm,
      coalesce(w.center_bore_mm, w.cb_mm),
      w.in_stock,
      coalesce(nullif(w.material, ''), nullif(w.finish, '')),
      w.bolts_included,
      w.winter_approved,
      w.wheel_load_kg,
      w.color,
      w.finish
    ) as generated_tags
  ) gt
  where w.variant_id = p_variant_id
    and w.product_type = 'rim'
    and w.publish_status = 'published';

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

create or replace function public.refresh_webshop_tire_search_index_v1()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  delete from public.webshop_tire_search_index;

  select count(*) into v_count
  from public.webshop_items w
  where w.product_type = 'tire'
    and w.publish_status = 'published'
    and public.refresh_webshop_tire_search_index_item_v1(w.variant_id) >= 0;

  return (select count(*)::integer from public.webshop_tire_search_index);
end;
$function$;

create or replace function public.refresh_webshop_rim_search_index_v1()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  delete from public.webshop_rim_search_index;

  select count(*) into v_count
  from public.webshop_items w
  where w.product_type = 'rim'
    and w.publish_status = 'published'
    and public.refresh_webshop_rim_search_index_item_v1(w.variant_id) >= 0;

  return (select count(*)::integer from public.webshop_rim_search_index);
end;
$function$;

create or replace function public.refresh_webshop_catalog_search_indexes_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tire_count integer;
  v_rim_count integer;
begin
  v_tire_count := public.refresh_webshop_tire_search_index_v1();
  v_rim_count := public.refresh_webshop_rim_search_index_v1();
  return jsonb_build_object('tires', v_tire_count, 'rims', v_rim_count);
end;
$function$;

create or replace function public.webshop_catalog_search_index_sync_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_op = 'DELETE' then
    if old.product_type = 'tire' then
      delete from public.webshop_tire_search_index where variant_id = old.variant_id;
    elsif old.product_type = 'rim' then
      delete from public.webshop_rim_search_index where variant_id = old.variant_id;
    end if;
    return old;
  end if;

  if new.product_type = 'tire' then
    perform public.refresh_webshop_tire_search_index_item_v1(new.variant_id);
  elsif new.product_type = 'rim' then
    perform public.refresh_webshop_rim_search_index_item_v1(new.variant_id);
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_webshop_catalog_search_index_sync on public.webshop_items;
create trigger trg_webshop_catalog_search_index_sync
  after insert or update or delete on public.webshop_items
  for each row
  execute function public.webshop_catalog_search_index_sync_trigger_v1();

revoke all on function public.refresh_webshop_tire_search_index_item_v1(uuid) from public;
revoke all on function public.refresh_webshop_rim_search_index_item_v1(uuid) from public;
revoke all on function public.refresh_webshop_tire_search_index_v1() from public;
revoke all on function public.refresh_webshop_rim_search_index_v1() from public;
revoke all on function public.refresh_webshop_catalog_search_indexes_v1() from public;
grant execute on function public.refresh_webshop_tire_search_index_item_v1(uuid) to service_role;
grant execute on function public.refresh_webshop_rim_search_index_item_v1(uuid) to service_role;
grant execute on function public.refresh_webshop_tire_search_index_v1() to service_role;
grant execute on function public.refresh_webshop_rim_search_index_v1() to service_role;
grant execute on function public.refresh_webshop_catalog_search_indexes_v1() to authenticated, service_role;
