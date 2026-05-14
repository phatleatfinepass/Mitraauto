-- Tire-style lifecycle for rims:
-- supplier_raw_*_rims -> catalog_selected_items -> CMS overlay -> webshop_items -> public rim RPCs.

set lock_timeout = '5s';
set statement_timeout = '90s';

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.catalog_selected_item_runs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%product_type%'
  loop
    execute format('alter table public.catalog_selected_item_runs drop constraint if exists %I', v_constraint.conname);
  end loop;
end $$;

alter table public.catalog_selected_item_runs
  add constraint catalog_selected_item_runs_product_type_check
  check (product_type in ('tire', 'rim')) not valid;

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.catalog_selected_items'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%product_type%'
  loop
    execute format('alter table public.catalog_selected_items drop constraint if exists %I', v_constraint.conname);
  end loop;
end $$;

alter table public.catalog_selected_items
  add constraint catalog_selected_items_product_type_check
  check (product_type in ('tire', 'rim')) not valid;

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

alter table public.catalog_selected_items
  add column if not exists width_in numeric(8,2),
  add column if not exists rim_diameter_in numeric(8,2),
  add column if not exists et_offset_mm numeric(8,2),
  add column if not exists bolt_pattern text,
  add column if not exists center_bore_mm numeric(8,2),
  add column if not exists cb_mm numeric(8,2),
  add column if not exists color text,
  add column if not exists finish text,
  add column if not exists material text,
  add column if not exists bolts_included boolean,
  add column if not exists wheel_load_kg numeric(8,2);

alter table public.webshop_items
  add column if not exists center_bore_mm numeric(8,2),
  add column if not exists cb_mm numeric(8,2),
  add column if not exists material text,
  add column if not exists bolts_included boolean,
  add column if not exists wheel_load_kg numeric(8,2),
  add column if not exists supplier_external_id_best text;

create index if not exists catalog_selected_items_rim_specs_idx
  on public.catalog_selected_items (
    rim_diameter_in,
    width_in,
    bolt_pattern,
    et_offset_mm,
    center_bore_mm
  )
  where product_type = 'rim';

create index if not exists webshop_items_rim_specs_idx
  on public.webshop_items (
    rim_diameter_in,
    width_in,
    bolt_pattern,
    et_offset_mm,
    center_bore_mm
  )
  where product_type = 'rim' and is_visible;

create or replace function public.catalog_selected_format_rim_size(
  p_width numeric,
  p_diameter numeric,
  p_bolt_pattern text,
  p_et numeric,
  p_fallback text default null
)
returns text
language sql
immutable
as $$
  select coalesce(
    case
      when p_width is not null and p_diameter is not null then
        concat(
          public.catalog_selected_compact_numeric(p_width),
          'x',
          public.catalog_selected_compact_numeric(p_diameter),
          case when nullif(btrim(coalesce(p_bolt_pattern, '')), '') is not null then ' ' || btrim(p_bolt_pattern) else '' end,
          case when p_et is not null then ' ET' || public.catalog_selected_compact_numeric(p_et) else '' end
        )
      else null
    end,
    nullif(btrim(p_fallback), '')
  );
$$;

create or replace function public.catalog_normalize_rim_pcd(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    regexp_replace(
      replace(replace(lower(btrim(coalesce(p_value, ''))), '×', 'x'), ',', '.'),
      '\s+',
      '',
      'g'
    ),
    ''
  );
$$;

create or replace function public.catalog_selected_rim_match_key(
  p_supplier_code text,
  p_ean text,
  p_source_sku text,
  p_brand text,
  p_model text,
  p_width numeric,
  p_diameter numeric,
  p_bolt_pattern text,
  p_et numeric,
  p_center_bore numeric
)
returns text
language sql
immutable
as $$
  select coalesce(
    case
      when nullif(regexp_replace(coalesce(p_ean, ''), '\D', '', 'g'), '') is not null
      then 'rim_ean:' || nullif(regexp_replace(coalesce(p_ean, ''), '\D', '', 'g'), '')
      else null
    end,
    case
      when nullif(btrim(coalesce(p_source_sku, '')), '') is not null
      then 'rim_sku:' || lower(btrim(coalesce(p_supplier_code, 'unknown'))) || ':' || lower(btrim(p_source_sku))
      else null
    end,
    'rim_spec:' || concat_ws(
      '|',
      lower(btrim(coalesce(p_brand, ''))),
      lower(btrim(coalesce(p_model, ''))),
      public.catalog_selected_compact_numeric(p_width),
      public.catalog_selected_compact_numeric(p_diameter),
      public.catalog_normalize_rim_pcd(p_bolt_pattern),
      public.catalog_selected_compact_numeric(p_et),
      public.catalog_selected_compact_numeric(p_center_bore)
    )
  );
$$;

create or replace function public.catalog_rebuild_selected_rims_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_source_rd_count integer := 0;
  v_source_vt_count integer := 0;
  v_selected_count integer := 0;
  v_marked_unavailable_count integer := 0;
  v_stats jsonb := '{}'::jsonb;
begin
  insert into public.catalog_selected_item_runs (product_type, status)
  values ('rim', 'running')
  returning id into v_run_id;

  create temp table tmp_catalog_selected_rim_candidates on commit drop as
  with rd as (
    select
      'RD'::text as supplier_code,
      'supplier_raw_rd_rims'::text as raw_table,
      r.id as raw_id,
      r.external_id,
      r.source_sku,
      nullif(regexp_replace(coalesce(r.ean, ''), '\D', '', 'g'), '') as ean,
      nullif(btrim(r.brand), '') as brand,
      nullif(btrim(coalesce(r.model, r.article_text)), '') as model,
      r.article_text as supplier_title,
      public.catalog_selected_format_rim_size(r.width_in, r.rim_diameter_in, r.bolt_pattern, r.et_offset_mm, r.size_text) as size_string,
      r.width_in,
      r.rim_diameter_in,
      r.et_offset_mm,
      public.catalog_normalize_rim_pcd(r.bolt_pattern) as bolt_pattern,
      r.center_bore_mm,
      r.center_bore_mm as cb_mm,
      r.color,
      r.finish,
      r.material,
      null::boolean as bolts_included,
      null::boolean as winter_approved,
      r.wheel_load_kg,
      greatest(coalesce(r.stock_qty, 0), coalesce(r.external_stock_qty, 0)) as stock_qty,
      coalesce(r.stock_qty, 0) > 0 or coalesce(r.external_stock_qty, 0) > 0 as in_stock,
      r.delivery_days_min,
      r.delivery_days_max,
      r.wholesale_price_eur,
      r.consumer_price_eur,
      r.retail_price_eur,
      coalesce(r.wholesale_price_eur, r.consumer_price_eur, r.retail_price_eur) as final_base_price_eur,
      r.image_id as supplier_image_id,
      r.image_url as supplier_image_url,
      r.supplier_metadata_json || jsonb_build_object('source_sku', r.source_sku) as supplier_metadata_json,
      r.raw_payload,
      r.last_seen_at,
      r.first_seen_at,
      1 as supplier_priority
    from public.supplier_raw_rd_rims r
    where r.is_available
  ),
  vt as (
    select
      'VT'::text as supplier_code,
      'supplier_raw_vt_rims'::text as raw_table,
      r.id as raw_id,
      r.external_id,
      r.source_sku,
      nullif(regexp_replace(coalesce(r.ean, ''), '\D', '', 'g'), '') as ean,
      nullif(btrim(r.brand), '') as brand,
      nullif(btrim(coalesce(r.model, r.description)), '') as model,
      r.description as supplier_title,
      public.catalog_selected_format_rim_size(r.width_in, r.rim_diameter_in, r.bolt_pattern, r.et_offset_mm, r.size_text) as size_string,
      r.width_in,
      r.rim_diameter_in,
      r.et_offset_mm,
      public.catalog_normalize_rim_pcd(r.bolt_pattern) as bolt_pattern,
      r.center_bore_mm,
      r.center_bore_mm as cb_mm,
      r.color,
      r.finish,
      r.material,
      r.bolts_included,
      r.winter_approved,
      r.wheel_load_kg,
      r.stock_qty,
      coalesce(r.stock_qty, 0) > 0 as in_stock,
      null::integer as delivery_days_min,
      null::integer as delivery_days_max,
      r.wholesale_price_eur,
      r.consumer_price_eur,
      null::numeric as retail_price_eur,
      coalesce(r.wholesale_price_eur, r.consumer_price_eur) as final_base_price_eur,
      null::text as supplier_image_id,
      r.image_url as supplier_image_url,
      r.supplier_metadata_json || jsonb_build_object(
        'source_sku', r.source_sku,
        'gallery', coalesce(r.gallery, '[]'::jsonb),
        'freight_class', r.freight_class
      ) as supplier_metadata_json,
      r.raw_payload,
      r.last_seen_at,
      r.first_seen_at,
      2 as supplier_priority
    from public.supplier_raw_vt_rims r
    where r.is_available
  )
  select
    c.*,
    public.catalog_selected_rim_match_key(
      c.supplier_code,
      c.ean,
      c.source_sku,
      c.brand,
      c.model,
      c.width_in,
      c.rim_diameter_in,
      c.bolt_pattern,
      c.et_offset_mm,
      c.center_bore_mm
    ) as match_key
  from (
    select * from rd
    union all
    select * from vt
  ) c
  where nullif(btrim(coalesce(c.brand, '')), '') is not null
    and nullif(btrim(coalesce(c.model, '')), '') is not null;

  select count(*) filter (where supplier_code = 'RD'),
         count(*) filter (where supplier_code = 'VT')
  into v_source_rd_count, v_source_vt_count
  from tmp_catalog_selected_rim_candidates;

  create index on tmp_catalog_selected_rim_candidates (match_key);

  create temp table tmp_catalog_selected_rim_ranked on commit drop as
  select
    c.*,
    row_number() over (
      partition by c.match_key
      order by
        c.in_stock desc,
        (c.final_base_price_eur is not null) desc,
        (c.supplier_image_url is not null) desc,
        c.supplier_priority asc,
        c.final_base_price_eur asc nulls last,
        c.external_id asc
    ) as winner_rank,
    count(*) over (partition by c.match_key) as offer_count,
    jsonb_agg(
      jsonb_build_object(
        'supplier_code', c.supplier_code,
        'external_id', c.external_id,
        'raw_table', c.raw_table,
        'raw_id', c.raw_id,
        'source_sku', c.source_sku,
        'price', c.final_base_price_eur,
        'stock_qty', c.stock_qty,
        'in_stock', c.in_stock
      )
      order by c.supplier_priority asc, c.final_base_price_eur asc nulls last
    ) over (partition by c.match_key) as alternative_offers_json
  from tmp_catalog_selected_rim_candidates c;

  insert into public.catalog_selected_items (
    id,
    product_type,
    selected_supplier,
    selected_external_id,
    selected_raw_table,
    selected_raw_id,
    selected_reason,
    match_key,
    match_confidence,
    conflict_status,
    conflict_reason,
    ean,
    brand,
    model,
    supplier_title,
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
    stock_qty,
    in_stock,
    delivery_days_min,
    delivery_days_max,
    wholesale_price_eur,
    consumer_price_eur,
    retail_price_eur,
    final_base_price_eur,
    raw_supplier_price_ex_vat,
    fair_cost_ex_vat,
    fair_cost_reason,
    supplier_image_id,
    supplier_image_url,
    supplier_metadata_json,
    alternative_offers_json,
    source_raw_ids,
    last_rebuild_run_id,
    first_seen_at,
    last_seen_at,
    last_selected_at,
    is_available,
    unavailable_since
  )
  select
    public.catalog_selected_stable_uuid('rim:' || w.match_key) as id,
    'rim',
    w.supplier_code,
    w.external_id,
    w.raw_table,
    w.raw_id,
    case when w.offer_count > 1 then 'ranked_supplier_offer' else 'single_supplier_offer' end,
    w.match_key,
    case when w.ean is not null then 'high' when w.source_sku is not null then 'medium' else 'low' end,
    'resolved',
    null::text,
    w.ean,
    w.brand,
    w.model,
    w.supplier_title,
    w.size_string,
    w.width_in,
    w.rim_diameter_in,
    w.et_offset_mm,
    w.bolt_pattern,
    w.center_bore_mm,
    w.cb_mm,
    w.color,
    w.finish,
    w.material,
    w.bolts_included,
    w.winter_approved,
    w.wheel_load_kg,
    w.stock_qty,
    w.in_stock,
    w.delivery_days_min,
    w.delivery_days_max,
    w.wholesale_price_eur,
    w.consumer_price_eur,
    w.retail_price_eur,
    w.final_base_price_eur,
    w.final_base_price_eur,
    w.final_base_price_eur,
    'supplier_rim_base_price',
    w.supplier_image_id,
    w.supplier_image_url,
    w.supplier_metadata_json,
    coalesce(w.alternative_offers_json, '[]'::jsonb),
    jsonb_build_object(w.supplier_code, w.raw_id),
    v_run_id,
    w.first_seen_at,
    w.last_seen_at,
    now(),
    true,
    null::timestamptz
  from tmp_catalog_selected_rim_ranked w
  where w.winner_rank = 1
  on conflict (match_key) do update set
    selected_supplier = excluded.selected_supplier,
    selected_external_id = excluded.selected_external_id,
    selected_raw_table = excluded.selected_raw_table,
    selected_raw_id = excluded.selected_raw_id,
    selected_reason = excluded.selected_reason,
    match_confidence = excluded.match_confidence,
    conflict_status = excluded.conflict_status,
    conflict_reason = excluded.conflict_reason,
    ean = excluded.ean,
    brand = excluded.brand,
    model = excluded.model,
    supplier_title = excluded.supplier_title,
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
    stock_qty = excluded.stock_qty,
    in_stock = excluded.in_stock,
    delivery_days_min = excluded.delivery_days_min,
    delivery_days_max = excluded.delivery_days_max,
    wholesale_price_eur = excluded.wholesale_price_eur,
    consumer_price_eur = excluded.consumer_price_eur,
    retail_price_eur = excluded.retail_price_eur,
    final_base_price_eur = excluded.final_base_price_eur,
    raw_supplier_price_ex_vat = excluded.raw_supplier_price_ex_vat,
    fair_cost_ex_vat = excluded.fair_cost_ex_vat,
    fair_cost_reason = excluded.fair_cost_reason,
    supplier_image_id = excluded.supplier_image_id,
    supplier_image_url = excluded.supplier_image_url,
    supplier_metadata_json = excluded.supplier_metadata_json,
    alternative_offers_json = excluded.alternative_offers_json,
    source_raw_ids = excluded.source_raw_ids,
    last_rebuild_run_id = excluded.last_rebuild_run_id,
    first_seen_at = least(public.catalog_selected_items.first_seen_at, excluded.first_seen_at),
    last_seen_at = excluded.last_seen_at,
    last_selected_at = excluded.last_selected_at,
    is_available = true,
    unavailable_since = null;

  get diagnostics v_selected_count = row_count;

  update public.catalog_selected_items
  set
    is_available = false,
    unavailable_since = coalesce(unavailable_since, now()),
    last_rebuild_run_id = v_run_id
  where product_type = 'rim'
    and is_available
    and last_rebuild_run_id is distinct from v_run_id;

  get diagnostics v_marked_unavailable_count = row_count;

  v_stats := jsonb_build_object(
    'source_rd_count', v_source_rd_count,
    'source_vt_count', v_source_vt_count,
    'selected_count', v_selected_count,
    'marked_unavailable_count', v_marked_unavailable_count
  );

  update public.catalog_selected_item_runs
  set
    status = 'success',
    finished_at = now(),
    source_rd_count = v_source_rd_count,
    source_vt_count = v_source_vt_count,
    selected_count = v_selected_count,
    resolved_count = v_selected_count,
    needs_review_count = 0,
    marked_unavailable_count = v_marked_unavailable_count,
    stats = v_stats
  where id = v_run_id;

  return v_stats || jsonb_build_object('run_id', v_run_id);
exception
  when others then
    update public.catalog_selected_item_runs
    set
      status = 'failed',
      finished_at = now(),
      error = jsonb_build_object('message', sqlerrm, 'state', sqlstate)
    where id = v_run_id;
    raise;
end;
$$;

revoke all on function public.catalog_rebuild_selected_rims_v1() from public;
grant execute on function public.catalog_rebuild_selected_rims_v1() to service_role;

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
      coalesce(cms.cms_data->'gallery', '[]'::jsonb) as cms_gallery
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
        when jsonb_typeof(coalesce(cms_gallery, '[]'::jsonb)) = 'array'
          and jsonb_array_length(coalesce(cms_gallery, '[]'::jsonb)) > 0
          then cms_gallery
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
      case when cms_hero_image_url is not null or jsonb_array_length(coalesce(cms_gallery, '[]'::jsonb)) > 0 then 'cms' else selected_supplier end as image_source,
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
    price,
    final_price_eur,
    currency,
    in_stock,
    stock_qty,
    delivery_days_min,
    delivery_days_max,
    supplier_code_best,
    supplier_external_id_best,
    best_image_url,
    hero_image_url,
    gallery,
    card_title,
    subtitle,
    short_description,
    long_description,
    tags,
    seo_slug,
    seo_title,
    seo_description,
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
    price,
    final_price_eur,
    currency,
    in_stock,
    stock_qty,
    delivery_days_min,
    delivery_days_max,
    supplier_code_best,
    supplier_external_id_best,
    hero_image_url,
    hero_image_url,
    gallery,
    card_title,
    subtitle,
    short_description,
    long_description,
    coalesce(tags, '[]'::jsonb),
    seo_slug,
    seo_title,
    seo_description,
    derived_ean,
    ean,
    spec_overrides,
    pricing_rules,
    image_source,
    is_visible,
    publish_status,
    publish_block_reason,
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

create or replace function public.catalog_rim_lifecycle_health_v1()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with raw_runs as (
    select distinct on (supplier_code)
      supplier_code,
      status,
      started_at,
      finished_at,
      expected_total,
      fetched_total,
      upserted_total,
      marked_unavailable_total,
      error_count,
      error
    from public.supplier_raw_rim_sync_runs
    where product_type = 'rim'
    order by supplier_code, started_at desc
  ),
  raw_rows as (
    select
      'RD'::text as supplier_code,
      count(*) filter (where is_available) as available_rows,
      max(last_seen_at) as latest_seen_at
    from public.supplier_raw_rd_rims
    union all
    select
      'VT'::text as supplier_code,
      count(*) filter (where is_available) as available_rows,
      max(last_seen_at) as latest_seen_at
    from public.supplier_raw_vt_rims
  ),
  selected_run as (
    select
      status,
      started_at,
      finished_at,
      selected_count,
      marked_unavailable_count,
      error
    from public.catalog_selected_item_runs
    where product_type = 'rim'
    order by started_at desc
    limit 1
  ),
  selected_counts as (
    select
      count(*) filter (where is_available) as available_selected,
      max(last_selected_at) as latest_selected_at
    from public.catalog_selected_items
    where product_type = 'rim'
  ),
  webshop_counts as (
    select
      count(*) as total,
      count(*) filter (where is_visible and publish_status = 'published') as published,
      count(*) filter (where publish_status = 'hidden') as hidden,
      count(*) filter (where publish_status = 'blocked') as blocked,
      count(*) filter (where is_visible and publish_status = 'published' and hero_image_url is not null) as published_with_image,
      max(refreshed_at) as latest_published_at
    from public.webshop_items
    where product_type = 'rim'
  )
  select jsonb_build_object(
    'raw', (
      select jsonb_object_agg(
        rr.supplier_code,
        jsonb_build_object(
          'latest_run_status', run.status,
          'latest_run_started_at', run.started_at,
          'latest_run_finished_at', run.finished_at,
          'latest_seen_at', rr.latest_seen_at,
          'available_rows', rr.available_rows,
          'expected_total', run.expected_total,
          'fetched_total', run.fetched_total,
          'upserted_total', run.upserted_total,
          'marked_unavailable_total', run.marked_unavailable_total,
          'error_count', run.error_count,
          'error', run.error
        )
      )
      from raw_rows rr
      left join raw_runs run using (supplier_code)
    ),
    'selected', (
      select jsonb_build_object(
        'latest_run_status', sr.status,
        'latest_run_started_at', sr.started_at,
        'latest_run_finished_at', sr.finished_at,
        'latest_selected_at', sc.latest_selected_at,
        'available_selected', sc.available_selected,
        'selected_count', sr.selected_count,
        'marked_unavailable_count', sr.marked_unavailable_count,
        'error', sr.error
      )
      from selected_counts sc
      left join selected_run sr on true
    ),
    'webshop', (
      select jsonb_build_object(
        'total', total,
        'published', published,
        'hidden', hidden,
        'blocked', blocked,
        'published_with_image', published_with_image,
        'latest_published_at', latest_published_at
      )
      from webshop_counts
    )
  );
$$;

revoke all on function public.catalog_rim_lifecycle_health_v1() from public;
grant execute on function public.catalog_rim_lifecycle_health_v1() to authenticated, service_role;

drop function if exists public.webshop_rim_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop function if exists public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop function if exists public.catalog_count_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop function if exists public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_list_rims_v1(text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer);
drop function if exists public.catalog_get_rim_by_identifier_v1(text);
drop function if exists public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop function if exists public.catalog_rim_matches_filters(public.catalog_rims_public_v1, text, numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean);
drop view if exists public.catalog_rims_public_v1;

create or replace view public.catalog_rims_public_v1 as
select
  w.variant_id,
  w.product_type,
  w.brand,
  coalesce(nullif(w.brand_display_name, ''), w.brand) as brand_display_name,
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
  w.center_bore_mm,
  w.cb_mm,
  w.color,
  w.finish,
  w.material,
  w.bolts_included,
  w.price,
  w.final_price_eur,
  w.currency,
  w.in_stock,
  w.stock_qty,
  w.delivery_days_min,
  w.delivery_days_max,
  w.supplier_code_best,
  w.supplier_external_id_best,
  w.best_image_url,
  w.hero_image_url,
  w.gallery,
  w.best_image_alt,
  w.card_title,
  w.card_title as title,
  w.subtitle,
  w.short_description,
  w.long_description,
  w.tags,
  w.seo_slug,
  w.seo_title,
  w.seo_description,
  w.eu_label_json,
  null::text as eu_fuel,
  w.eu_wet,
  w.eu_noise,
  false as final_is_hidden,
  w.ean,
  w.derived_ean,
  w.manufacture_year,
  w.pricing_rules,
  w.spec_overrides
from public.webshop_items w
where w.product_type = 'rim'
  and w.is_visible
  and w.publish_status = 'published';

grant select on public.catalog_rims_public_v1 to anon, authenticated, service_role;

create or replace function public.webshop_rim_matches_filters(
  p_row public.webshop_items,
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
returns boolean
language sql
stable
as $$
  select
    p_row.product_type = 'rim'
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
      or coalesce(p_row.bolt_pattern, '') ilike '%' || public.catalog_normalize_rim_pcd(btrim(p_search)) || '%'
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
    and (p_diameter is null or p_row.rim_diameter_in = p_diameter)
    and (p_width is null or p_row.width_in = p_width)
    and (coalesce(array_length(p_widths, 1), 0) = 0 or p_row.width_in = any(p_widths))
    and (public.catalog_normalize_rim_pcd(p_pcd) is null or public.catalog_normalize_rim_pcd(p_row.bolt_pattern) = public.catalog_normalize_rim_pcd(p_pcd))
    and (p_et_offset is null or p_row.et_offset_mm = p_et_offset)
    and (p_center_bore_min is null or p_row.center_bore_mm >= p_center_bore_min)
    and (
      nullif(btrim(coalesce(p_color, '')), '') is null
      or lower(btrim(p_color)) = 'all'
      or p_row.color ilike btrim(p_color)
      or p_row.finish ilike btrim(p_color)
    )
    and (
      nullif(btrim(coalesce(p_material, '')), '') is null
      or lower(btrim(p_material)) = 'all'
      or p_row.material ilike btrim(p_material)
      or p_row.finish ilike btrim(p_material)
    )
    and (p_bolts_included is null or p_row.bolts_included is not distinct from p_bolts_included)
    and (not p_in_stock or coalesce(p_row.in_stock, false) = true);
$$;

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
set search_path = public
as $$
  select count(*)
  from public.webshop_items w
  where public.webshop_rim_matches_filters(
    w, p_search, p_brands, p_diameter, p_width, p_widths, p_pcd, p_et_offset, p_center_bore_min,
    p_color, p_material, p_bolts_included, p_in_stock
  );
$$;

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
  p_sort_by text default 'brand_asc',
  p_limit integer default 24,
  p_offset integer default 0
)
returns setof public.webshop_items
language sql
stable
security definer
set search_path = public
as $$
  select w.*
  from public.webshop_items w
  where public.webshop_rim_matches_filters(
    w, p_search, p_brands, p_diameter, p_width, p_widths, p_pcd, p_et_offset, p_center_bore_min,
    p_color, p_material, p_bolts_included, p_in_stock
  )
  order by
    case when p_sort_by = 'price_asc' then w.final_price_eur end asc nulls last,
    case when p_sort_by = 'price_desc' then w.final_price_eur end desc nulls last,
    case when p_sort_by = 'brand_desc' then coalesce(w.brand_display_name, w.brand) end desc,
    case when p_sort_by in ('brand_asc', 'default') or p_sort_by is null then coalesce(w.brand_display_name, w.brand) end asc,
    w.model asc,
    w.rim_diameter_in asc nulls last,
    w.width_in asc nulls last,
    w.variant_id asc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.catalog_get_rim_by_identifier_v1(p_identifier text)
returns setof public.catalog_rims_public_v1
language sql
stable
security definer
set search_path = public
as $$
  select r.*
  from public.catalog_rims_public_v1 r
  where nullif(btrim(coalesce(p_identifier, '')), '') is not null
    and (
      r.variant_id::text = btrim(p_identifier)
      or r.seo_slug = btrim(p_identifier)
      or r.ean = btrim(p_identifier)
      or r.derived_ean = btrim(p_identifier)
    )
  order by
    case when r.variant_id::text = btrim(p_identifier) then 0 else 1 end,
    r.variant_id
  limit 1;
$$;

create or replace function public.catalog_list_rim_brands_v1()
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
  where w.product_type = 'rim'
    and w.is_visible
    and w.publish_status = 'published'
    and nullif(btrim(coalesce(w.brand_display_name, w.brand)), '') is not null
  order by 1 asc;
$$;

revoke all on function public.webshop_rim_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) from public;
grant execute on function public.webshop_rim_matches_filters(public.webshop_items, text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated, service_role;

grant execute on function public.catalog_count_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean) to anon, authenticated, service_role;
grant execute on function public.catalog_list_rims_v1(text, text[], numeric, numeric, numeric[], text, numeric, numeric, text, text, boolean, boolean, text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.catalog_get_rim_by_identifier_v1(text) to anon, authenticated, service_role;
grant execute on function public.catalog_list_rim_brands_v1() to anon, authenticated, service_role;
