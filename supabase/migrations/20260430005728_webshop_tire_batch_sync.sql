-- Additive, cursor-based webshop tire sync.
-- Existing refresh_webshop_tire_items_v1 remains available as the full-refresh fallback.

set lock_timeout = '5s';
set statement_timeout = '60s';

create table if not exists public.webshop_tire_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  total_items integer not null default 0,
  processed_items integer not null default 0,
  last_variant_id uuid,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_by uuid default auth.uid()
);

alter table public.webshop_tire_sync_runs enable row level security;

grant select, insert, update on table public.webshop_tire_sync_runs to authenticated, service_role;

drop policy if exists "Admins manage webshop tire sync runs" on public.webshop_tire_sync_runs;
create policy "Admins manage webshop tire sync runs"
on public.webshop_tire_sync_runs
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

alter table public.webshop_items
  add column if not exists last_sync_run_id uuid references public.webshop_tire_sync_runs(id) on delete set null,
  add column if not exists last_synced_at timestamptz;

create index if not exists webshop_items_tire_sync_run_idx
  on public.webshop_items (product_type, last_sync_run_id);

create or replace function public.start_webshop_tire_items_sync_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_total integer;
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

  select count(*)::integer
  into v_total
  from public.catalog_selected_items s
  where s.product_type = 'tire'
    and s.is_available;

  insert into public.webshop_tire_sync_runs (status, total_items, processed_items, created_by)
  values ('running', v_total, 0, auth.uid())
  returning id into v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id,
    'status', 'running',
    'processed', 0,
    'total', v_total,
    'has_more', v_total > 0
  );
end;
$$;

create or replace function public.refresh_webshop_tire_items_batch_v1(
  p_run_id uuid,
  p_batch_size integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.webshop_tire_sync_runs%rowtype;
  v_batch_size integer := least(greatest(coalesce(p_batch_size, 500), 1), 1000);
  v_processed integer := 0;
  v_last_variant_id uuid;
  v_has_more boolean := false;
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

  select *
  into v_run
  from public.webshop_tire_sync_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception 'Sync run not found: %', p_run_id;
  end if;

  if v_run.status <> 'running' then
    return jsonb_build_object(
      'run_id', v_run.id,
      'status', v_run.status,
      'processed', v_run.processed_items,
      'total', v_run.total_items,
      'has_more', false,
      'last_variant_id', v_run.last_variant_id
    );
  end if;

  drop table if exists pg_temp.tmp_webshop_tire_items_batch;

  create temp table tmp_webshop_tire_items_batch on commit drop as
  with batch as (
    select s.*
    from public.catalog_selected_items s
    where s.product_type = 'tire'
      and s.is_available
      and (v_run.last_variant_id is null or s.id > v_run.last_variant_id)
    order by s.id
    limit v_batch_size
  ),
  src as (
    select
      s.*,
      coalesce(review.review_status, 'pending') as review_status,
      pc.title as title,
      pc.subtitle as cms_subtitle,
      pc.short_description as cms_short_description,
      pc.long_description as cms_long_description,
      pc.seo_slug as cms_seo_slug,
      pc.seo_title as cms_seo_title,
      pc.seo_description as cms_seo_description,
      coalesce(pc.is_hidden, false) as cms_is_hidden,
      coalesce(pc.spec_overrides, '{}'::jsonb) as spec_overrides,
      pc.price_override_eur as price_override_eur,
      coalesce(pc.promo_enabled, false) as promo_enabled,
      pc.promo_price_eur as promo_price_eur,
      pc.promo_start as promo_start,
      pc.promo_end as promo_end,
      images.hero_image_url as effective_hero_image_url,
      images.gallery as effective_gallery,
      images.image_source
    from batch s
    left join public.product_cms pc
      on pc.variant_id = s.id
    left join public.catalog_selected_item_reviews review
      on review.selected_item_id = s.id
    left join public.catalog_selected_item_effective_images images
      on images.selected_item_id = s.id
  )
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
  from src;

  insert into public.webshop_items (
    variant_id, product_type, selected_supplier, selected_external_id, match_key,
    conflict_status, conflict_reason, brand, brand_display_name, brand_logo_url,
    model, size_string, season, studded, runflat, xl_reinforced, load_index,
    speed_rating, speed_index, ev_ready, threepmsf, winter_approved, ice_approved,
    width_mm, aspect_ratio, diameter_in, width_in, rim_diameter_in, et_offset_mm,
    bolt_pattern, color, finish, price, final_price_eur, currency, in_stock,
    stock_qty, delivery_days_min, delivery_days_max, supplier_code_best,
    best_image_url, hero_image_url, gallery, best_image_alt, card_title, subtitle,
    short_description, long_description, tags, seo_slug, seo_title, seo_description,
    eu_label_json, eu_wet, eu_noise, derived_ean, ean, spec_overrides, pricing_rules,
    image_source, is_visible, publish_status, publish_block_reason, refreshed_at,
    last_sync_run_id, last_synced_at
  )
  select
    variant_id, product_type, selected_supplier, selected_external_id, match_key,
    conflict_status, conflict_reason, brand, brand_display_name, brand_logo_url,
    model, size_string, season, studded, runflat, xl_reinforced, load_index,
    speed_rating, speed_index, ev_ready, threepmsf, winter_approved, ice_approved,
    width_mm, aspect_ratio, diameter_in, width_in, rim_diameter_in, et_offset_mm,
    bolt_pattern, color, finish, price, final_price_eur, currency, in_stock,
    stock_qty, delivery_days_min, delivery_days_max, supplier_code_best,
    best_image_url, hero_image_url, coalesce(gallery, '[]'::jsonb), best_image_alt,
    card_title, subtitle, short_description, long_description, coalesce(tags, '[]'::jsonb),
    seo_slug, seo_title, seo_description, eu_label_json, eu_wet, eu_noise,
    derived_ean, ean, spec_overrides, pricing_rules, image_source, is_visible,
    publish_status, publish_block_reason, now(), p_run_id, now()
  from tmp_webshop_tire_items_batch
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
    last_sync_run_id = p_run_id,
    last_synced_at = now(),
    updated_at = now();

  get diagnostics v_processed = row_count;

  select variant_id
  into v_last_variant_id
  from tmp_webshop_tire_items_batch
  order by variant_id desc
  limit 1;

  if v_last_variant_id is not null then
    update public.webshop_tire_sync_runs
    set
      processed_items = least(total_items, processed_items + v_processed),
      last_variant_id = v_last_variant_id
    where id = p_run_id
    returning * into v_run;
  end if;

  select exists (
    select 1
    from public.catalog_selected_items s
    where s.product_type = 'tire'
      and s.is_available
      and (v_run.last_variant_id is null or s.id > v_run.last_variant_id)
  )
  into v_has_more;

  return jsonb_build_object(
    'run_id', p_run_id,
    'status', v_run.status,
    'processed', v_run.processed_items,
    'total', v_run.total_items,
    'batch_processed', v_processed,
    'has_more', v_has_more,
    'last_variant_id', v_run.last_variant_id
  );
exception
  when others then
    update public.webshop_tire_sync_runs
    set
      status = 'failed',
      error_message = sqlerrm,
      finished_at = now()
    where id = p_run_id;
    raise;
end;
$$;

create or replace function public.finalize_webshop_tire_items_sync_v1(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.webshop_tire_sync_runs%rowtype;
  v_hidden integer := 0;
  v_result jsonb;
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

  select *
  into v_run
  from public.webshop_tire_sync_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception 'Sync run not found: %', p_run_id;
  end if;

  if v_run.status <> 'running' then
    raise exception 'Sync run is not running: %', v_run.status;
  end if;

  if v_run.processed_items < v_run.total_items then
    raise exception 'Cannot finalize incomplete sync run: %/%', v_run.processed_items, v_run.total_items;
  end if;

  update public.webshop_items w
  set
    is_visible = false,
    publish_status = 'hidden',
    publish_block_reason = 'not_in_selected_catalog',
    refreshed_at = now(),
    updated_at = now()
  where w.product_type = 'tire'
    and w.last_sync_run_id is distinct from p_run_id;

  get diagnostics v_hidden = row_count;

  update public.webshop_tire_sync_runs
  set
    status = 'completed',
    finished_at = now()
  where id = p_run_id
  returning * into v_run;

  select jsonb_build_object(
    'run_id', p_run_id,
    'status', v_run.status,
    'processed', v_run.processed_items,
    'total', v_run.total_items,
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
exception
  when others then
    update public.webshop_tire_sync_runs
    set
      status = 'failed',
      error_message = sqlerrm,
      finished_at = now()
    where id = p_run_id
      and status = 'running';
    raise;
end;
$$;

revoke all on function public.start_webshop_tire_items_sync_v1() from public;
grant execute on function public.start_webshop_tire_items_sync_v1() to authenticated;

revoke all on function public.refresh_webshop_tire_items_batch_v1(uuid, integer) from public;
grant execute on function public.refresh_webshop_tire_items_batch_v1(uuid, integer) to authenticated;

revoke all on function public.finalize_webshop_tire_items_sync_v1(uuid) from public;
grant execute on function public.finalize_webshop_tire_items_sync_v1(uuid) to authenticated;
