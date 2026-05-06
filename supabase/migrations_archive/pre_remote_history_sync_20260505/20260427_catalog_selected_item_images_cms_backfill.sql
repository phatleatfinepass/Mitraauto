-- Backfill current CMS tire hero/gallery images into the unified selected item
-- image table using one set-based upsert.

with raw_images as (
  select
    variant_id as selected_item_id,
    'tire'::text as product_type,
    nullif(btrim(cms_data->>'hero_image_url'), '') as url,
    0 as position
  from public.catalog_selected_tires_cms_admin_v1
  where cms_data is not null

  union all

  select
    v.variant_id as selected_item_id,
    'tire'::text as product_type,
    nullif(btrim(g.value #>> '{}'), '') as url,
    g.ordinality::integer as position
  from public.catalog_selected_tires_cms_admin_v1 v
  cross join lateral jsonb_array_elements(coalesce(v.cms_data->'gallery', '[]'::jsonb)) with ordinality g(value, ordinality)
  where v.cms_data is not null
),
deduped as (
  select
    selected_item_id,
    product_type,
    url,
    min(position) as position,
    'CMS:' || md5(url) as source_key
  from raw_images
  where url is not null
  group by selected_item_id, product_type, url
),
upserted as (
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
    public.catalog_selected_image_stable_uuid(selected_item_id::text || ':CMS:' || md5(url)),
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
    position + 1,
    position = 0,
    true,
    'stored',
    null,
    jsonb_build_object('source', 'cms_backfill', 'synced_at', now()),
    now(),
    now()
  from deduped
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
    updated_at = now()
  returning selected_item_id
)
select
  count(*) as synced_image_rows,
  count(distinct selected_item_id) as synced_items
from upserted;
