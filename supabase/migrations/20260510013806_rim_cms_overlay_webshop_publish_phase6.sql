-- Phase 6: selected rim -> CMS overlay -> webshop_items publish snapshot.

set lock_timeout = '5s';
set statement_timeout = '120s';

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.webshop_items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%product_type%'
  loop
    execute format('alter table public.webshop_items drop constraint if exists %I', v_constraint.conname);
  end loop;
end $$;

alter table public.webshop_items
  add constraint webshop_items_product_type_check
  check (product_type in ('tire', 'rim')) not valid;

alter table public.webshop_items
  add column if not exists center_bore_mm numeric(8,2),
  add column if not exists cb_mm numeric(8,2),
  add column if not exists material text,
  add column if not exists bolts_included boolean,
  add column if not exists wheel_load_kg numeric(8,2),
  add column if not exists supplier_external_id_best text;

create index if not exists webshop_items_rim_specs_idx
  on public.webshop_items (
    rim_diameter_in,
    width_in,
    bolt_pattern,
    et_offset_mm,
    center_bore_mm
  )
  where product_type = 'rim' and is_visible;

create or replace view public.catalog_selected_rims_cms_admin_v1 as
with selected as (
  select *
  from public.catalog_selected_items
  where product_type = 'rim'
    and is_available
),
legacy_cms_by_ean as (
  select distinct on (legacy_source.legacy_ean)
    legacy_source.*
  from (
    select
      nullif(regexp_replace(coalesce(ps.ean, ps.derived_ean, ''), '\D', '', 'g'), '') as legacy_ean,
      pc.*
    from public.product_cms pc
    join public.products_search ps
      on ps.variant_id = pc.variant_id
     and ps.product_type = 'rim'
  ) legacy_source
  where legacy_ean is not null
  order by legacy_ean, variant_id
),
rows as (
  select
    s.*,
    coalesce(pc_direct.title, pc_legacy.title) as cms_title,
    coalesce(pc_direct.subtitle, pc_legacy.subtitle) as cms_subtitle,
    coalesce(pc_direct.short_description, pc_legacy.short_description) as cms_short_description,
    coalesce(pc_direct.long_description, pc_legacy.long_description) as cms_long_description,
    coalesce(pc_direct.hero_image_url, pc_legacy.hero_image_url) as cms_hero_image_url,
    coalesce(pc_direct.gallery, pc_legacy.gallery) as cms_gallery,
    coalesce(pc_direct.seo_slug, pc_legacy.seo_slug) as cms_seo_slug,
    coalesce(pc_direct.seo_title, pc_legacy.seo_title) as cms_seo_title,
    coalesce(pc_direct.seo_description, pc_legacy.seo_description) as cms_seo_description,
    coalesce(pc_direct.is_hidden, pc_legacy.is_hidden) as cms_is_hidden,
    coalesce(pc_direct.spec_overrides, pc_legacy.spec_overrides) as cms_spec_overrides,
    coalesce(pc_direct.price_override_eur, pc_legacy.price_override_eur) as cms_price_override_eur,
    coalesce(pc_direct.promo_enabled, pc_legacy.promo_enabled) as cms_promo_enabled,
    coalesce(pc_direct.promo_price_eur, pc_legacy.promo_price_eur) as cms_promo_price_eur,
    coalesce(pc_direct.promo_start, pc_legacy.promo_start) as cms_promo_start,
    coalesce(pc_direct.promo_end, pc_legacy.promo_end) as cms_promo_end,
    coalesce(pc_direct.variant_id, pc_legacy.variant_id) as cms_source_variant_id
  from selected s
  left join public.product_cms pc_direct
    on pc_direct.variant_id = s.id
  left join legacy_cms_by_ean pc_legacy
    on pc_direct.variant_id is null
   and s.ean is not null
   and pc_legacy.legacy_ean = s.ean
)
select
  id as variant_id,
  product_type,
  ean as derived_ean,
  selected_supplier as supplier_code_best,
  selected_external_id as supplier_external_id_best,
  brand,
  model,
  size_string,
  width_in,
  rim_diameter_in,
  et_offset_mm,
  bolt_pattern,
  center_bore_mm,
  cb_mm,
  color,
  finish,
  material,
  bolts_included,
  winter_approved,
  wheel_load_kg,
  final_base_price_eur as final_price_eur,
  final_base_price_eur as price,
  stock_qty,
  in_stock,
  delivery_days_min,
  delivery_days_max,
  supplier_image_url,
  ean,
  final_base_price_eur is null as missing_supplier_price,
  supplier_image_url is null as missing_supplier_image,
  case
    when cms_source_variant_id is null then null
    else jsonb_build_object(
      'variant_id', id,
      'legacy_variant_id', cms_source_variant_id,
      'title', cms_title,
      'subtitle', cms_subtitle,
      'short_description', cms_short_description,
      'long_description', cms_long_description,
      'hero_image_url', cms_hero_image_url,
      'gallery', coalesce(cms_gallery, '[]'::jsonb),
      'seo_slug', cms_seo_slug,
      'seo_title', cms_seo_title,
      'seo_description', cms_seo_description,
      'is_hidden', coalesce(cms_is_hidden, false),
      'spec_overrides', coalesce(cms_spec_overrides, '{}'::jsonb),
      'price_override_eur', cms_price_override_eur,
      'promo_enabled', coalesce(cms_promo_enabled, false),
      'promo_price_eur', cms_promo_price_eur,
      'promo_start', cms_promo_start,
      'promo_end', cms_promo_end
    )
  end as cms_data
from rows;

revoke all on public.catalog_selected_rims_cms_admin_v1 from public;
grant select on public.catalog_selected_rims_cms_admin_v1 to service_role;

create or replace function public.refresh_webshop_rim_items_v1()
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
  create temp table tmp_webshop_rim_items on commit drop as
  with src as (
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
    from public.catalog_selected_items s
    left join public.catalog_selected_rims_cms_admin_v1 cms
      on cms.variant_id = s.id
    where s.product_type = 'rim'
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
      not cms_is_hidden
        and final_base_price_eur is not null
        and coalesce(nullif(cms_hero_image_url, ''), nullif(cms_gallery->>0, ''), supplier_image_url) is not null as is_visible,
      case
        when cms_is_hidden then 'hidden'
        when final_base_price_eur is null then 'blocked'
        when coalesce(nullif(cms_hero_image_url, ''), nullif(cms_gallery->>0, ''), supplier_image_url) is null then 'blocked'
        else 'published'
      end as publish_status,
      case
        when cms_is_hidden then 'cms_hidden'
        when final_base_price_eur is null then 'missing_price'
        when coalesce(nullif(cms_hero_image_url, ''), nullif(cms_gallery->>0, ''), supplier_image_url) is null then 'missing_image'
        else null
      end as publish_block_reason
    from src
  )
  select * from effective;

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
    image_source, is_visible, publish_status, publish_block_reason, refreshed_at
  )
  select
    variant_id, product_type, selected_supplier, selected_external_id, match_key,
    conflict_status, conflict_reason, brand, brand_display_name, brand_logo_url,
    model, size_string, width_in, rim_diameter_in, et_offset_mm, bolt_pattern,
    center_bore_mm, cb_mm, color, finish, material, bolts_included,
    winter_approved, wheel_load_kg, price, final_price_eur, currency, in_stock,
    stock_qty, delivery_days_min, delivery_days_max, supplier_code_best,
    supplier_external_id_best, hero_image_url, hero_image_url, gallery,
    card_title, subtitle, short_description, long_description, coalesce(tags, '[]'::jsonb),
    seo_slug, seo_title, seo_description, derived_ean, ean, spec_overrides,
    pricing_rules, image_source, is_visible, publish_status, publish_block_reason,
    now()
  from tmp_webshop_rim_items
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
    updated_at = now();

  get diagnostics v_upserted = row_count;

  update public.webshop_items w
  set
    is_visible = false,
    publish_status = 'hidden',
    publish_block_reason = 'not_in_selected_catalog',
    refreshed_at = now(),
    updated_at = now()
  where w.product_type = 'rim'
    and not exists (
      select 1
      from tmp_webshop_rim_items t
      where t.variant_id = w.variant_id
    );

  get diagnostics v_hidden = row_count;

  select jsonb_build_object(
    'upserted_total', v_upserted,
    'hidden_total', v_hidden,
    'summary', jsonb_build_object(
      'total', (select count(*) from public.webshop_items where product_type = 'rim'),
      'published', (select count(*) from public.webshop_items where product_type = 'rim' and is_visible and publish_status = 'published'),
      'hidden', (select count(*) from public.webshop_items where product_type = 'rim' and publish_status = 'hidden'),
      'blocked', (select count(*) from public.webshop_items where product_type = 'rim' and publish_status = 'blocked'),
      'with_image', (select count(*) from public.webshop_items where product_type = 'rim' and is_visible and hero_image_url is not null)
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.refresh_webshop_rim_items_v1() from public;
grant execute on function public.refresh_webshop_rim_items_v1() to service_role;

create or replace function public.start_webshop_rim_items_sync_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
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

  v_result := public.refresh_webshop_rim_items_v1();
  return v_result || jsonb_build_object('status', 'completed');
end;
$$;

revoke all on function public.start_webshop_rim_items_sync_v1() from public;
grant execute on function public.start_webshop_rim_items_sync_v1() to authenticated;
