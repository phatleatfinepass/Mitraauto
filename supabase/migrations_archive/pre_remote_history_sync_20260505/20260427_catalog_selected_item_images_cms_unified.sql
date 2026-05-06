-- Unify item images across CMS and supplier fallbacks.
-- Simple rule: position 1 is hero, higher positions are gallery. CMS wins over
-- supplier rows, but supplier rows remain available as fallback and audit trail.

alter table public.catalog_selected_item_images
  drop constraint if exists catalog_selected_item_images_image_kind_check;

alter table public.catalog_selected_item_images
  add constraint catalog_selected_item_images_image_kind_check
  check (image_kind in ('item', 'supplier_product'));

alter table public.catalog_selected_item_images
  drop constraint if exists catalog_selected_item_images_source_supplier_check;

alter table public.catalog_selected_item_images
  add constraint catalog_selected_item_images_source_supplier_check
  check (source_supplier in ('CMS', 'RD', 'VT'));

create index if not exists catalog_selected_item_images_source_position_idx
  on public.catalog_selected_item_images (selected_item_id, source_supplier, is_active, position);

create or replace view public.catalog_selected_item_effective_images as
with cms_rows as (
  select
    selected_item_id,
    product_type,
    jsonb_agg(
      coalesce(public_url, source_url)
      order by position, created_at
    ) filter (where coalesce(public_url, source_url) is not null) as gallery
  from public.catalog_selected_item_images
  where is_active
    and source_supplier = 'CMS'
    and status = 'stored'
  group by selected_item_id, product_type
),
supplier_rows as (
  select
    selected_item_id,
    product_type,
    jsonb_agg(
      coalesce(public_url, source_url)
      order by
        is_primary_candidate desc,
        case status when 'stored' then 0 when 'external_ready' then 1 else 2 end,
        position,
        created_at
    ) filter (where coalesce(public_url, source_url) is not null) as gallery
  from public.catalog_selected_item_images
  where is_active
    and source_supplier in ('RD', 'VT')
    and status in ('stored', 'external_ready')
  group by selected_item_id, product_type
),
selected as (
  select id as selected_item_id, product_type
  from public.catalog_selected_items
  where is_available
)
select
  s.selected_item_id,
  s.product_type,
  case
    when jsonb_array_length(coalesce(c.gallery, '[]'::jsonb)) > 0 then 'CMS'
    when jsonb_array_length(coalesce(sp.gallery, '[]'::jsonb)) > 0 then 'SUPPLIER'
    else null
  end as image_source,
  case
    when jsonb_array_length(coalesce(c.gallery, '[]'::jsonb)) > 0 then c.gallery->>0
    when jsonb_array_length(coalesce(sp.gallery, '[]'::jsonb)) > 0 then sp.gallery->>0
    else null
  end as hero_image_url,
  case
    when jsonb_array_length(coalesce(c.gallery, '[]'::jsonb)) > 0 then c.gallery
    when jsonb_array_length(coalesce(sp.gallery, '[]'::jsonb)) > 0 then sp.gallery
    else '[]'::jsonb
  end as gallery
from selected s
left join cms_rows c
  on c.selected_item_id = s.selected_item_id
left join supplier_rows sp
  on sp.selected_item_id = s.selected_item_id;

create or replace function public.catalog_sync_cms_item_images_v1(
  p_selected_item_id uuid,
  p_image_urls jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_type text;
  v_active_total integer := 0;
  v_deactivated_total integer := 0;
  v_result jsonb;
begin
  select product_type into v_product_type
  from public.catalog_selected_items
  where id = p_selected_item_id;

  if v_product_type is null then
    raise exception 'Selected item % not found', p_selected_item_id using errcode = 'P0002';
  end if;

  if jsonb_typeof(coalesce(p_image_urls, '[]'::jsonb)) <> 'array' then
    raise exception 'p_image_urls must be a JSON array' using errcode = '22023';
  end if;

  drop table if exists tmp_catalog_cms_item_images;

  create temp table tmp_catalog_cms_item_images on commit drop as
  select distinct on (source_key)
    public.catalog_selected_image_stable_uuid(
      p_selected_item_id::text || ':CMS:' || md5(url)
    ) as id,
    p_selected_item_id as selected_item_id,
    v_product_type as product_type,
    url,
    'CMS:' || md5(url) as source_key,
    min(position) over (partition by url) as position
  from (
    select
      nullif(btrim(value #>> '{}'), '') as url,
      ordinality::integer as position
    from jsonb_array_elements(p_image_urls) with ordinality
  ) image_rows
  where url is not null
  order by source_key, position;

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
    public_url,
    position,
    is_primary_candidate,
    is_active,
    status,
    error,
    metadata_json,
    last_seen_at,
    fetched_at
  )
  select
    id,
    selected_item_id,
    product_type,
    'item',
    'CMS',
    null,
    null,
    null,
    null,
    url,
    source_key,
    'product-images',
    case
      when url like '%/storage/v1/object/public/product-images/%'
        then split_part(url, '/storage/v1/object/public/product-images/', 2)
      else null
    end,
    url,
    position,
    position = 1,
    true,
    'stored',
    null,
    jsonb_build_object('source', 'cms_manual', 'synced_at', now()),
    now(),
    now()
  from tmp_catalog_cms_item_images
  on conflict (selected_item_id, source_key) do update set
    source_url = excluded.source_url,
    storage_path = excluded.storage_path,
    public_url = excluded.public_url,
    position = excluded.position,
    is_primary_candidate = excluded.is_primary_candidate,
    is_active = true,
    status = 'stored',
    error = null,
    metadata_json = public.catalog_selected_item_images.metadata_json || excluded.metadata_json,
    last_seen_at = now(),
    fetched_at = coalesce(public.catalog_selected_item_images.fetched_at, now()),
    updated_at = now();

  get diagnostics v_active_total = row_count;

  update public.catalog_selected_item_images i
  set
    is_active = false,
    updated_at = now(),
    metadata_json = i.metadata_json || jsonb_build_object('deactivated_by', 'cms_sync', 'deactivated_at', now())
  where i.selected_item_id = p_selected_item_id
    and i.source_supplier = 'CMS'
    and i.is_active
    and not exists (
      select 1
      from tmp_catalog_cms_item_images c
      where c.source_key = i.source_key
    );

  get diagnostics v_deactivated_total = row_count;

  select jsonb_build_object(
    'selected_item_id', p_selected_item_id,
    'active_total', (
      select count(*)
      from public.catalog_selected_item_images
      where selected_item_id = p_selected_item_id
        and source_supplier = 'CMS'
        and is_active
    ),
    'upserted_total', v_active_total,
    'deactivated_total', v_deactivated_total,
    'effective_images', (
      select to_jsonb(e)
      from public.catalog_selected_item_effective_images e
      where e.selected_item_id = p_selected_item_id
    )
  ) into v_result;

  return v_result;
end;
$$;

grant select on public.catalog_selected_item_effective_images to authenticated, service_role;
grant execute on function public.catalog_sync_cms_item_images_v1(uuid, jsonb) to authenticated, service_role;

do $$
declare
  v_def text;
begin
  select pg_get_functiondef('public.catalog_rebuild_selected_tire_image_candidates_v1'::regproc)
  into v_def;

  v_def := replace(
    v_def,
    $old$
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
$old$,
    $new$
  update public.catalog_selected_item_images i
  set
    is_active = false,
    status = case when status = 'stored' then status else 'skipped' end,
    updated_at = now()
  where i.product_type = 'tire'
    and i.source_supplier in ('RD', 'VT')
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
$new$
  );

  if v_def not like '%and i.source_supplier in (''RD'', ''VT'')%' then
    raise exception 'Failed to patch supplier-only deactivation in catalog_rebuild_selected_tire_image_candidates_v1';
  end if;

  execute v_def;
end;
$$;
