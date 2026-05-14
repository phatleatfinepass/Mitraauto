-- Phase 6: tire-style batched webshop publish and manual exclusion for rims.

set lock_timeout = '5s';
set statement_timeout = '120s';

create table if not exists public.webshop_rim_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  total_items integer not null default 0,
  processed_items integer not null default 0,
  inserted_items integer not null default 0,
  updated_items integer not null default 0,
  skipped_incomplete_items integer not null default 0,
  failed_items integer not null default 0,
  last_variant_id uuid,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_by uuid default auth.uid()
);

alter table public.webshop_rim_sync_runs enable row level security;

grant select, insert, update on table public.webshop_rim_sync_runs to authenticated, service_role;

drop policy if exists "Admins manage webshop rim sync runs" on public.webshop_rim_sync_runs;
create policy "Admins manage webshop rim sync runs"
on public.webshop_rim_sync_runs
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
);

alter table public.webshop_items
  add column if not exists last_rim_sync_run_id uuid references public.webshop_rim_sync_runs(id) on delete set null,
  add column if not exists last_rim_synced_at timestamptz;

create index if not exists webshop_items_rim_sync_run_idx
  on public.webshop_items (product_type, last_rim_sync_run_id);

create or replace function public.catalog_is_rim_manual_not_sellable(p_spec_overrides jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    lower(coalesce(p_spec_overrides->'classification'->>'not_sellable_manual', 'false')) in ('true', '1', 'yes', 'y', 'on')
    or lower(coalesce(p_spec_overrides->'classification'->>'exclude_from_storefront', 'false')) in ('true', '1', 'yes', 'y', 'on')
    or lower(coalesce(p_spec_overrides->'classification'->>'manual_not_sellable', 'false')) in ('true', '1', 'yes', 'y', 'on')
    or lower(coalesce(p_spec_overrides->'classification'->>'rim_not_product_ready', 'false')) in ('true', '1', 'yes', 'y', 'on');
$$;

revoke all on function public.catalog_is_rim_manual_not_sellable(jsonb) from public;
grant execute on function public.catalog_is_rim_manual_not_sellable(jsonb) to authenticated, service_role;

create or replace function public.start_webshop_rim_items_sync_v1()
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
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Admin access required';
  end if;

  select count(*)::integer
  into v_total
  from public.catalog_selected_items s
  where s.product_type = 'rim'
    and s.is_available;

  insert into public.webshop_rim_sync_runs (status, total_items, processed_items, created_by)
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

create or replace function public.refresh_webshop_rim_items_batch_v1(
  p_run_id uuid,
  p_batch_size integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.webshop_rim_sync_runs%rowtype;
  v_batch_size integer := least(greatest(coalesce(p_batch_size, 500), 1), 1000);
  v_processed integer := 0;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
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
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Admin access required';
  end if;

  select *
  into v_run
  from public.webshop_rim_sync_runs
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
      'inserted', v_run.inserted_items,
      'updated', v_run.updated_items,
      'skipped_incomplete', v_run.skipped_incomplete_items,
      'failed', v_run.failed_items,
      'has_more', false,
      'last_variant_id', v_run.last_variant_id
    );
  end if;

  drop table if exists pg_temp.tmp_webshop_rim_items_batch;

  create temp table tmp_webshop_rim_items_batch on commit drop as
  with batch as (
    select s.*
    from public.catalog_selected_items s
    where s.product_type = 'rim'
      and s.is_available
      and (v_run.last_variant_id is null or s.id > v_run.last_variant_id)
    order by s.id
    limit v_batch_size
  ),
  src as (
    select
      s.*,
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
      nullif(cms.cms_data->>'hero_image_url', '') as cms_hero_image_url,
      case when jsonb_typeof(coalesce(cms.cms_data->'gallery', '[]'::jsonb)) = 'array'
        then coalesce(cms.cms_data->'gallery', '[]'::jsonb)
        else '[]'::jsonb
      end as cms_gallery
    from batch s
    left join public.catalog_selected_rims_cms_admin_v1 cms
      on cms.variant_id = s.id
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
      width_in,
      rim_diameter_in,
      coalesce(nullif(spec_overrides->'rim'->>'et_offset_mm', '')::numeric, et_offset_mm) as et_offset_mm,
      coalesce(public.catalog_normalize_rim_pcd(spec_overrides->'rim'->>'bolt_pattern'), bolt_pattern) as bolt_pattern,
      coalesce(nullif(spec_overrides->'rim'->>'center_bore_mm', '')::numeric, center_bore_mm) as center_bore_mm,
      coalesce(nullif(spec_overrides->'rim'->>'center_bore_mm', '')::numeric, cb_mm) as cb_mm,
      coalesce(nullif(btrim(spec_overrides->'rim'->>'color'), ''), color) as color,
      coalesce(nullif(btrim(spec_overrides->'rim'->>'finish'), ''), finish) as finish,
      coalesce(nullif(btrim(spec_overrides->'rim'->>'material'), ''), material) as material,
      coalesce(nullif(spec_overrides->'features'->>'bolts_included', '')::boolean, bolts_included) as bolts_included,
      coalesce(nullif(spec_overrides->'features'->>'winter_approved', '')::boolean, winter_approved) as winter_approved,
      coalesce(nullif(spec_overrides->'rim'->>'wheel_load_kg', '')::numeric, wheel_load_kg) as wheel_load_kg,
      final_base_price_eur as price,
      case
        when coalesce(promo_enabled, false)
          and promo_price_eur is not null
          and (promo_start is null or promo_start <= now())
          and (promo_end is null or promo_end >= now())
          then promo_price_eur
        when price_override_eur is not null then price_override_eur
        else final_base_price_eur
      end as final_price_eur,
      'EUR'::text as currency,
      in_stock,
      stock_qty,
      delivery_days_min,
      delivery_days_max,
      selected_supplier as supplier_code_best,
      selected_external_id as supplier_external_id_best,
      coalesce(nullif(cms_hero_image_url, ''), nullif(cms_gallery->>0, ''), supplier_image_url) as hero_image_url,
      case
        when jsonb_array_length(cms_gallery) > 0 then cms_gallery
        when supplier_metadata_json ? 'gallery'
          and jsonb_typeof(supplier_metadata_json->'gallery') = 'array'
          and jsonb_array_length(supplier_metadata_json->'gallery') > 0
          then supplier_metadata_json->'gallery'
        when supplier_image_url is not null then jsonb_build_array(supplier_image_url)
        else '[]'::jsonb
      end as gallery,
      coalesce(nullif(btrim(title), ''), nullif(btrim(concat_ws(' ', brand, model)), '')) as card_title,
      cms_subtitle as subtitle,
      cms_short_description as short_description,
      cms_long_description as long_description,
      to_jsonb(array_remove(array[
        case when rim_diameter_in is not null then public.catalog_selected_compact_numeric(rim_diameter_in) || '"' end,
        case when width_in is not null then public.catalog_selected_compact_numeric(width_in) || 'J' end,
        case when bolt_pattern is not null then bolt_pattern end,
        case when et_offset_mm is not null then 'ET' || public.catalog_selected_compact_numeric(et_offset_mm) end,
        case when center_bore_mm is not null then 'CB' || public.catalog_selected_compact_numeric(center_bore_mm) end,
        case when coalesce(in_stock, false) then 'in_stock' end,
        case when material is not null then material end,
        case when coalesce(bolts_included, false) then 'bolts_included' end,
        case when coalesce(winter_approved, false) then 'winter_approved' end
      ]::text[], null)) as tags,
      cms_seo_slug as seo_slug,
      cms_seo_title as seo_title,
      cms_seo_description as seo_description,
      ean as derived_ean,
      coalesce(nullif(regexp_replace(spec_overrides->'identity'->>'ean', '\D', '', 'g'), ''), ean) as ean,
      spec_overrides,
      spec_overrides->'pricing_rules' as pricing_rules,
      case when cms_hero_image_url is not null or jsonb_array_length(cms_gallery) > 0 then 'cms' else selected_supplier end as image_source,
      public.catalog_is_rim_manual_not_sellable(spec_overrides) as manual_not_sellable,
      exists (
        select 1
        from public.webshop_items existing
        where existing.variant_id = id
      ) as existed_before,
      not cms_is_hidden
        and final_base_price_eur is not null
        and coalesce(nullif(cms_hero_image_url, ''), nullif(cms_gallery->>0, ''), supplier_image_url) is not null
        and public.catalog_is_rim_manual_not_sellable(spec_overrides) = false as is_visible,
      case
        when cms_is_hidden then 'hidden'
        when public.catalog_is_rim_manual_not_sellable(spec_overrides) then 'blocked'
        when final_base_price_eur is null then 'blocked'
        when coalesce(nullif(cms_hero_image_url, ''), nullif(cms_gallery->>0, ''), supplier_image_url) is null then 'blocked'
        else 'published'
      end as publish_status,
      case
        when cms_is_hidden then 'cms_hidden'
        when public.catalog_is_rim_manual_not_sellable(spec_overrides) then 'manual_not_sellable'
        when final_base_price_eur is null then 'missing_price'
        when coalesce(nullif(cms_hero_image_url, ''), nullif(cms_gallery->>0, ''), supplier_image_url) is null then 'missing_image'
        else null
      end as publish_block_reason
    from src
  )
  select * from effective;

  select
    count(*)::integer,
    count(*) filter (where existed_before = false)::integer,
    count(*) filter (where existed_before = true)::integer,
    count(*) filter (where publish_status <> 'published')::integer
  into v_processed, v_inserted, v_updated, v_skipped
  from tmp_webshop_rim_items_batch;

  insert into public.webshop_items (
    variant_id, product_type, selected_supplier, selected_external_id, match_key,
    conflict_status, conflict_reason, brand, brand_display_name, brand_logo_url,
    model, size_string, width_in, rim_diameter_in, et_offset_mm, bolt_pattern,
    center_bore_mm, cb_mm, color, finish, material, bolts_included,
    winter_approved, wheel_load_kg, price, final_price_eur, currency, in_stock,
    stock_qty, delivery_days_min, delivery_days_max, supplier_code_best,
    supplier_external_id_best, best_image_url, hero_image_url, gallery,
    card_title, subtitle, short_description, long_description, tags, seo_slug,
    seo_title, seo_description, derived_ean, ean, spec_overrides, pricing_rules,
    image_source, is_visible, publish_status, publish_block_reason, refreshed_at,
    last_rim_sync_run_id, last_rim_synced_at
  )
  select
    variant_id, product_type, selected_supplier, selected_external_id, match_key,
    conflict_status, conflict_reason, brand, brand_display_name, brand_logo_url,
    model, size_string, width_in, rim_diameter_in, et_offset_mm, bolt_pattern,
    center_bore_mm, cb_mm, color, finish, material, bolts_included,
    winter_approved, wheel_load_kg, price, final_price_eur, currency, in_stock,
    stock_qty, delivery_days_min, delivery_days_max, supplier_code_best,
    supplier_external_id_best, hero_image_url, hero_image_url, coalesce(gallery, '[]'::jsonb),
    card_title, subtitle, short_description, long_description, coalesce(tags, '[]'::jsonb),
    seo_slug, seo_title, seo_description, derived_ean, ean, spec_overrides,
    pricing_rules, image_source, is_visible, publish_status, publish_block_reason,
    now(), p_run_id, now()
  from tmp_webshop_rim_items_batch
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
    width_in = excluded.width_in,
    rim_diameter_in = excluded.rim_diameter_in,
    et_offset_mm = excluded.et_offset_mm,
    bolt_pattern = excluded.bolt_pattern,
    center_bore_mm = excluded.center_bore_mm,
    cb_mm = excluded.cb_mm,
    color = excluded.color,
    finish = excluded.finish,
    material = excluded.material,
    bolts_included = excluded.bolts_included,
    winter_approved = excluded.winter_approved,
    wheel_load_kg = excluded.wheel_load_kg,
    price = excluded.price,
    final_price_eur = excluded.final_price_eur,
    currency = excluded.currency,
    in_stock = excluded.in_stock,
    stock_qty = excluded.stock_qty,
    delivery_days_min = excluded.delivery_days_min,
    delivery_days_max = excluded.delivery_days_max,
    supplier_code_best = excluded.supplier_code_best,
    supplier_external_id_best = excluded.supplier_external_id_best,
    best_image_url = excluded.best_image_url,
    hero_image_url = excluded.hero_image_url,
    gallery = excluded.gallery,
    card_title = excluded.card_title,
    subtitle = excluded.subtitle,
    short_description = excluded.short_description,
    long_description = excluded.long_description,
    tags = excluded.tags,
    seo_slug = excluded.seo_slug,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    derived_ean = excluded.derived_ean,
    ean = excluded.ean,
    spec_overrides = excluded.spec_overrides,
    pricing_rules = excluded.pricing_rules,
    image_source = excluded.image_source,
    is_visible = excluded.is_visible,
    publish_status = excluded.publish_status,
    publish_block_reason = excluded.publish_block_reason,
    refreshed_at = now(),
    last_rim_sync_run_id = p_run_id,
    last_rim_synced_at = now(),
    updated_at = now();

  select variant_id
  into v_last_variant_id
  from tmp_webshop_rim_items_batch
  order by variant_id desc
  limit 1;

  if v_last_variant_id is not null then
    update public.webshop_rim_sync_runs
    set
      processed_items = least(total_items, processed_items + v_processed),
      inserted_items = inserted_items + v_inserted,
      updated_items = updated_items + v_updated,
      skipped_incomplete_items = skipped_incomplete_items + v_skipped,
      last_variant_id = v_last_variant_id
    where id = p_run_id
    returning * into v_run;
  end if;

  select exists (
    select 1
    from public.catalog_selected_items s
    where s.product_type = 'rim'
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
    'inserted', v_run.inserted_items,
    'updated', v_run.updated_items,
    'skipped_incomplete', v_run.skipped_incomplete_items,
    'failed', v_run.failed_items,
    'has_more', v_has_more,
    'last_variant_id', v_run.last_variant_id
  );
exception
  when others then
    update public.webshop_rim_sync_runs
    set
      status = 'failed',
      failed_items = failed_items + greatest(v_batch_size - coalesce(v_processed, 0), 1),
      error_message = sqlerrm,
      finished_at = now()
    where id = p_run_id
      and status = 'running';
    raise;
end;
$$;

create or replace function public.finalize_webshop_rim_items_sync_v1(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.webshop_rim_sync_runs%rowtype;
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
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Admin access required';
  end if;

  select *
  into v_run
  from public.webshop_rim_sync_runs
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
  where w.product_type = 'rim'
    and w.last_rim_sync_run_id is distinct from p_run_id;

  get diagnostics v_hidden = row_count;

  update public.webshop_rim_sync_runs
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
    'inserted', v_run.inserted_items,
    'updated', v_run.updated_items,
    'skipped_incomplete', v_run.skipped_incomplete_items,
    'failed', v_run.failed_items,
    'hidden_total', v_hidden,
    'summary', jsonb_build_object(
      'total', (select count(*) from public.webshop_items where product_type = 'rim'),
      'published', (select count(*) from public.webshop_items where product_type = 'rim' and is_visible and publish_status = 'published'),
      'hidden', (select count(*) from public.webshop_items where product_type = 'rim' and publish_status = 'hidden'),
      'blocked', (select count(*) from public.webshop_items where product_type = 'rim' and publish_status = 'blocked'),
      'manual_not_sellable', (select count(*) from public.webshop_items where product_type = 'rim' and publish_block_reason = 'manual_not_sellable'),
      'with_image', (select count(*) from public.webshop_items where product_type = 'rim' and is_visible and hero_image_url is not null)
    )
  ) into v_result;

  return v_result;
exception
  when others then
    update public.webshop_rim_sync_runs
    set
      status = 'failed',
      error_message = sqlerrm,
      finished_at = now()
    where id = p_run_id
      and status = 'running';
    raise;
end;
$$;

revoke all on function public.start_webshop_rim_items_sync_v1() from public;
grant execute on function public.start_webshop_rim_items_sync_v1() to authenticated;

revoke all on function public.refresh_webshop_rim_items_batch_v1(uuid, integer) from public;
grant execute on function public.refresh_webshop_rim_items_batch_v1(uuid, integer) to authenticated;

revoke all on function public.finalize_webshop_rim_items_sync_v1(uuid) from public;
grant execute on function public.finalize_webshop_rim_items_sync_v1(uuid) to authenticated;
