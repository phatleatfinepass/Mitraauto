-- Supplier image mapping/storage layer for the selected catalog.
-- CMS/manual images stay in product_cms. These rows are fallback candidates
-- derived after conflict resolution, keyed by catalog_selected_items.id.

create or replace function public.catalog_selected_image_stable_uuid(p_key text)
returns uuid
language sql
immutable
as $$
  select (
    substr(md5('catalog_selected_item_images:' || coalesce(p_key, '')), 1, 8) || '-' ||
    substr(md5('catalog_selected_item_images:' || coalesce(p_key, '')), 9, 4) || '-' ||
    substr(md5('catalog_selected_item_images:' || coalesce(p_key, '')), 13, 4) || '-' ||
    substr(md5('catalog_selected_item_images:' || coalesce(p_key, '')), 17, 4) || '-' ||
    substr(md5('catalog_selected_item_images:' || coalesce(p_key, '')), 21, 12)
  )::uuid;
$$;

create table if not exists public.catalog_selected_item_image_runs (
  id uuid primary key default gen_random_uuid(),
  product_type text not null default 'tire' check (product_type = 'tire'),
  run_kind text not null default 'candidate_rebuild' check (run_kind in ('candidate_rebuild', 'fetch_batch')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  candidate_total integer not null default 0,
  inserted_total integer not null default 0,
  updated_total integer not null default 0,
  deactivated_total integer not null default 0,
  fetched_total integer not null default 0,
  failed_total integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  error jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_selected_item_images (
  id uuid primary key,
  selected_item_id uuid not null references public.catalog_selected_items(id) on delete cascade,
  product_type text not null default 'tire' check (product_type = 'tire'),

  image_kind text not null default 'supplier_product' check (image_kind in ('supplier_product', 'eu_label')),
  source_supplier text not null check (source_supplier in ('RD', 'VT', 'EPREL')),
  source_external_id text,
  source_raw_table text,
  source_raw_id uuid,
  source_image_id text,
  source_url text,
  source_key text not null,

  storage_bucket text not null default 'product-images',
  storage_path text,
  public_url text,

  position integer not null default 1 check (position > 0),
  is_primary_candidate boolean not null default false,
  is_active boolean not null default true,
  status text not null default 'pending_source_fetch' check (
    status in ('pending_source_fetch', 'external_ready', 'fetching', 'stored', 'failed', 'skipped')
  ),

  fetch_attempts integer not null default 0 check (fetch_attempts >= 0),
  last_fetch_at timestamptz,
  fetched_at timestamptz,
  content_type text,
  byte_size integer check (byte_size is null or byte_size >= 0),
  width_px integer check (width_px is null or width_px > 0),
  height_px integer check (height_px is null or height_px > 0),
  checksum text,
  error jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint catalog_selected_item_images_source_or_url check (
    nullif(btrim(coalesce(source_image_id, '')), '') is not null
    or nullif(btrim(coalesce(source_url, '')), '') is not null
  ),
  constraint catalog_selected_item_images_stored_has_url check (
    status <> 'stored'
    or nullif(btrim(coalesce(public_url, '')), '') is not null
  ),
  constraint catalog_selected_item_images_unique_source unique (selected_item_id, source_key)
);

create index if not exists catalog_selected_item_images_selected_idx
  on public.catalog_selected_item_images (selected_item_id, is_active, position);

create index if not exists catalog_selected_item_images_fetch_queue_idx
  on public.catalog_selected_item_images (status, source_supplier, last_seen_at desc)
  where is_active and status in ('pending_source_fetch', 'failed');

create index if not exists catalog_selected_item_images_source_supplier_idx
  on public.catalog_selected_item_images (source_supplier, source_external_id);

create index if not exists catalog_selected_item_images_source_image_id_idx
  on public.catalog_selected_item_images (source_supplier, source_image_id)
  where source_image_id is not null;

create trigger trg_catalog_selected_item_images_updated_at
before update on public.catalog_selected_item_images
for each row
execute function public.catalog_selected_touch_updated_at();

alter table public.catalog_selected_item_image_runs enable row level security;
alter table public.catalog_selected_item_images enable row level security;

grant select on table public.catalog_selected_item_image_runs to authenticated, service_role;
grant select on table public.catalog_selected_item_images to authenticated, service_role;
grant insert, update, delete on table public.catalog_selected_item_image_runs to service_role;
grant insert, update, delete on table public.catalog_selected_item_images to service_role;

drop policy if exists "Catalog selected item image runs admin read" on public.catalog_selected_item_image_runs;
create policy "Catalog selected item image runs admin read"
on public.catalog_selected_item_image_runs
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Catalog selected item images admin read" on public.catalog_selected_item_images;
create policy "Catalog selected item images admin read"
on public.catalog_selected_item_images
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create or replace view public.catalog_selected_item_image_fallbacks as
with ranked as (
  select
    i.*,
    row_number() over (
      partition by i.selected_item_id
      order by
        i.is_primary_candidate desc,
        case i.status when 'stored' then 0 when 'external_ready' then 1 else 2 end,
        i.position,
        i.created_at
    ) as fallback_rank
  from public.catalog_selected_item_images i
  where i.is_active
    and coalesce(i.public_url, i.source_url) is not null
    and i.status in ('stored', 'external_ready')
)
select
  selected_item_id,
  product_type,
  (array_agg(
    coalesce(public_url, source_url)
    order by
      is_primary_candidate desc,
      case status when 'stored' then 0 when 'external_ready' then 1 else 2 end,
      position,
      created_at
  ))[1] as fallback_image_url,
  jsonb_agg(
    jsonb_strip_nulls(jsonb_build_object(
      'url', coalesce(public_url, source_url),
      'public_url', public_url,
      'source_url', source_url,
      'status', status,
      'source_supplier', source_supplier,
      'source_external_id', source_external_id,
      'source_image_id', source_image_id,
      'storage_bucket', storage_bucket,
      'storage_path', storage_path,
      'position', position
    ))
    order by
      is_primary_candidate desc,
      case status when 'stored' then 0 when 'external_ready' then 1 else 2 end,
      position,
      created_at
  ) as fallback_gallery,
  count(*) as image_count
from ranked
where fallback_rank <= 10
group by selected_item_id, product_type;

create or replace view public.catalog_selected_tire_image_summary as
select
  count(*) as selected_tire_total,
  count(*) filter (where f.selected_item_id is not null) as with_supplier_fallback,
  count(*) filter (where f.selected_item_id is null) as without_supplier_fallback,
  count(*) filter (where exists (
    select 1
    from public.catalog_selected_item_images i
    where i.selected_item_id = s.id
      and i.is_active
      and i.source_supplier = 'RD'
  )) as with_rd_candidate,
  count(*) filter (where exists (
    select 1
    from public.catalog_selected_item_images i
    where i.selected_item_id = s.id
      and i.is_active
      and i.source_supplier = 'VT'
  )) as with_vt_candidate,
  count(*) filter (where exists (
    select 1
    from public.catalog_selected_item_images i
    where i.selected_item_id = s.id
      and i.is_active
      and i.status = 'pending_source_fetch'
  )) as pending_source_fetch,
  count(*) filter (where exists (
    select 1
    from public.catalog_selected_item_images i
    where i.selected_item_id = s.id
      and i.is_active
      and i.status = 'stored'
  )) as with_stored_image
from public.catalog_selected_items s
left join public.catalog_selected_item_image_fallbacks f
  on f.selected_item_id = s.id
where s.product_type = 'tire'
  and s.is_available;

grant select on public.catalog_selected_item_image_fallbacks to authenticated, service_role;
grant select on public.catalog_selected_tire_image_summary to authenticated, service_role;

create or replace function public.catalog_rebuild_selected_tire_image_candidates_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_candidate_total integer := 0;
  v_inserted_total integer := 0;
  v_updated_total integer := 0;
  v_deactivated_total integer := 0;
  v_result jsonb;
begin
  insert into public.catalog_selected_item_image_runs (product_type, run_kind, status)
  values ('tire', 'candidate_rebuild', 'running')
  returning id into v_run_id;

  create temp table tmp_catalog_selected_tire_image_candidates on commit drop as
  with winner_sources as (
    select
      s.id as selected_item_id,
      s.product_type,
      s.selected_supplier as source_supplier,
      s.selected_external_id as source_external_id,
      s.selected_raw_table as source_raw_table,
      s.selected_raw_id as source_raw_id,
      nullif(btrim(s.supplier_image_id), '') as source_image_id,
      nullif(btrim(s.supplier_image_url), '') as source_url,
      1 as position,
      true as is_primary_candidate,
      jsonb_build_object('source', 'selected_winner', 'match_key', s.match_key) as metadata_json
    from public.catalog_selected_items s
    where s.product_type = 'tire'
      and s.is_available
  ),
  alternative_sources as (
    select
      s.id as selected_item_id,
      s.product_type,
      offer->>'supplier' as source_supplier,
      offer->>'external_id' as source_external_id,
      offer->>'raw_table' as source_raw_table,
      nullif(offer->>'raw_id', '')::uuid as source_raw_id,
      nullif(btrim(offer->>'supplier_image_id'), '') as source_image_id,
      nullif(btrim(offer->>'supplier_image_url'), '') as source_url,
      10 + row_number() over (partition by s.id order by offer->>'supplier', offer->>'external_id')::integer as position,
      false as is_primary_candidate,
      jsonb_build_object('source', 'alternative_offer', 'match_key', s.match_key) as metadata_json
    from public.catalog_selected_items s
    cross join lateral jsonb_array_elements(coalesce(s.alternative_offers_json, '[]'::jsonb)) offer
    where s.product_type = 'tire'
      and s.is_available
  ),
  all_sources as (
    select * from winner_sources
    union all
    select * from alternative_sources
  ),
  normalized as (
    select
      selected_item_id,
      product_type,
      source_supplier,
      nullif(btrim(source_external_id), '') as source_external_id,
      nullif(btrim(source_raw_table), '') as source_raw_table,
      source_raw_id,
      source_image_id,
      source_url,
      position,
      is_primary_candidate,
      metadata_json,
      source_supplier || ':' ||
        coalesce(nullif(btrim(source_external_id), ''), '-') || ':' ||
        coalesce(source_image_id, md5(coalesce(source_url, ''))) as source_key
    from all_sources
    where source_supplier in ('RD', 'VT')
      and (source_image_id is not null or source_url is not null)
  )
  select distinct on (selected_item_id, source_key)
    public.catalog_selected_image_stable_uuid(selected_item_id::text || ':' || source_key) as id,
    selected_item_id,
    product_type,
    'supplier_product'::text as image_kind,
    source_supplier,
    source_external_id,
    source_raw_table,
    source_raw_id,
    source_image_id,
    source_url,
    source_key,
    'product-images'::text as storage_bucket,
    'supplier/tires/' || selected_item_id::text || '/' || lower(source_supplier) || '-' ||
      regexp_replace(coalesce(source_external_id, source_image_id, md5(coalesce(source_url, 'image'))), '[^a-zA-Z0-9._-]+', '-', 'g') ||
      '-' || substr(md5(source_key), 1, 10) || '.jpg' as storage_path,
    position,
    is_primary_candidate,
    case
      when source_url is not null then 'external_ready'
      else 'pending_source_fetch'
    end as status,
    metadata_json
  from normalized
  order by selected_item_id, source_key, is_primary_candidate desc, position;

  get diagnostics v_candidate_total = row_count;

  with upserted as (
    insert into public.catalog_selected_item_images (
      id,
      selected_item_id,
      product_type,
      image_kind,
      source_supplier,
      source_external_id,
      source_raw_table,
      source_raw_id,
      source_image_id,
      source_url,
      source_key,
      storage_bucket,
      storage_path,
      position,
      is_primary_candidate,
      is_active,
      status,
      metadata_json,
      last_seen_at
    )
    select
      id,
      selected_item_id,
      product_type,
      image_kind,
      source_supplier,
      source_external_id,
      source_raw_table,
      source_raw_id,
      source_image_id,
      source_url,
      source_key,
      storage_bucket,
      storage_path,
      position,
      is_primary_candidate,
      true,
      status,
      metadata_json,
      now()
    from tmp_catalog_selected_tire_image_candidates
    on conflict (selected_item_id, source_key) do update set
      source_external_id = excluded.source_external_id,
      source_raw_table = excluded.source_raw_table,
      source_raw_id = excluded.source_raw_id,
      source_image_id = excluded.source_image_id,
      source_url = excluded.source_url,
      storage_path = coalesce(public.catalog_selected_item_images.storage_path, excluded.storage_path),
      position = excluded.position,
      is_primary_candidate = excluded.is_primary_candidate,
      is_active = true,
      status = case
        when public.catalog_selected_item_images.status = 'stored' then public.catalog_selected_item_images.status
        when excluded.source_url is not null then 'external_ready'
        else excluded.status
      end,
      metadata_json = public.catalog_selected_item_images.metadata_json || excluded.metadata_json,
      last_seen_at = now(),
      updated_at = now()
    returning (xmax = 0) as inserted
  )
  select
    count(*) filter (where inserted),
    count(*) filter (where not inserted)
  into v_inserted_total, v_updated_total
  from upserted;

  update public.catalog_selected_item_images i
  set
    is_active = false,
    status = case when status = 'stored' then status else 'skipped' end,
    updated_at = now()
  where i.product_type = 'tire'
    and i.is_active
    and not exists (
      select 1
      from tmp_catalog_selected_tire_image_candidates c
      where c.selected_item_id = i.selected_item_id
        and c.source_key = i.source_key
    )
    and exists (
      select 1
      from public.catalog_selected_items s
      where s.id = i.selected_item_id
        and s.product_type = 'tire'
    );

  get diagnostics v_deactivated_total = row_count;

  update public.catalog_selected_item_image_runs
  set
    status = 'success',
    finished_at = now(),
    candidate_total = v_candidate_total,
    inserted_total = v_inserted_total,
    updated_total = v_updated_total,
    deactivated_total = v_deactivated_total,
    stats = jsonb_build_object(
      'rd_candidates', (select count(*) from tmp_catalog_selected_tire_image_candidates where source_supplier = 'RD'),
      'vt_candidates', (select count(*) from tmp_catalog_selected_tire_image_candidates where source_supplier = 'VT'),
      'with_source_url', (select count(*) from tmp_catalog_selected_tire_image_candidates where source_url is not null),
      'needs_source_fetch', (select count(*) from tmp_catalog_selected_tire_image_candidates where source_url is null)
    )
  where id = v_run_id;

  select jsonb_build_object(
    'run_id', v_run_id,
    'candidate_total', v_candidate_total,
    'inserted_total', v_inserted_total,
    'updated_total', v_updated_total,
    'deactivated_total', v_deactivated_total,
    'summary', (select to_jsonb(s) from public.catalog_selected_tire_image_summary s)
  ) into v_result;

  return v_result;
exception
  when others then
    update public.catalog_selected_item_image_runs
    set
      status = 'failed',
      finished_at = now(),
      error = jsonb_build_object('message', sqlerrm, 'state', sqlstate)
    where id = v_run_id;
    raise;
end;
$$;

grant execute on function public.catalog_rebuild_selected_tire_image_candidates_v1() to authenticated, service_role;

comment on table public.catalog_selected_item_images is
  'Supplier image candidates for selected catalog items. CMS images remain in product_cms; this table provides fallback and batch-fetch state.';
