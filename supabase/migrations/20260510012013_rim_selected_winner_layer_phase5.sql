-- Phase 5: selected rim winner layer.
-- Keeps rims non-public: raw supplier rows are resolved into catalog_selected_items,
-- but CMS overlay and webshop publishing are handled in later phases.

set lock_timeout = '5s';
set statement_timeout = '120s';

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

create index if not exists catalog_selected_items_rim_specs_idx
  on public.catalog_selected_items (
    rim_diameter_in,
    width_in,
    bolt_pattern,
    et_offset_mm,
    center_bore_mm
  )
  where product_type = 'rim';

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

  create temp table tmp_catalog_selected_rim_groups on commit drop as
  select
    c.match_key,
    count(*) as offer_count,
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
    ) as alternative_offers_json
  from tmp_catalog_selected_rim_candidates c
  group by c.match_key;

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
    g.offer_count,
    g.alternative_offers_json
  from tmp_catalog_selected_rim_candidates c
  join tmp_catalog_selected_rim_groups g using (match_key);

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
