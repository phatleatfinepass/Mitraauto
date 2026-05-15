-- Phase 2: normalize tire segment/category from supplier raw categories.
-- This gives CMS and future storefront filters a stable field independent of
-- supplier-specific labels such as RD MainGroupName or VT Tyre_type.

alter table public.catalog_selected_items
  add column if not exists tire_segment text;

alter table public.webshop_items
  add column if not exists tire_segment text;

alter table public.catalog_selected_items
  drop constraint if exists catalog_selected_items_tire_segment_check;

alter table public.catalog_selected_items
  add constraint catalog_selected_items_tire_segment_check
  check (
    tire_segment is null
    or tire_segment in (
      'passenger',
      'van_c',
      'suv_4x4',
      'excluded_heavy',
      'excluded_motorcycle',
      'excluded_agri_industrial',
      'other'
    )
  );

alter table public.webshop_items
  drop constraint if exists webshop_items_tire_segment_check;

alter table public.webshop_items
  add constraint webshop_items_tire_segment_check
  check (
    tire_segment is null
    or tire_segment in (
      'passenger',
      'van_c',
      'suv_4x4',
      'excluded_heavy',
      'excluded_motorcycle',
      'excluded_agri_industrial',
      'other'
    )
  );

create or replace function public.catalog_normalize_tire_segment(
  p_supplier text,
  p_supplier_metadata_json jsonb,
  p_size_string text default null
)
returns text
language sql
immutable
set search_path = public
as $$
  with raw as (
    select lower(btrim(coalesce(
      p_supplier_metadata_json->>'main_group_name',
      p_supplier_metadata_json->>'tyre_type',
      p_supplier_metadata_json->>'category',
      p_supplier_metadata_json->>'main_group',
      ''
    ))) as category,
    lower(btrim(coalesce(p_supplier, ''))) as supplier,
    lower(btrim(coalesce(p_size_string, ''))) as size_string
  )
  select case
    when category in ('kesä c', 'talvi c kitka', 'talvirenkaat c nastoitetut', 'talvi c nastoitettavat', 'van') then 'van_c'
    when category in ('4x4', '4x4c') then 'suv_4x4'
    when category in (
      'kesärenkaat ha',
      'talvirenkaat kitka',
      'talvirenkaat nastoitetut',
      'talvirenkaat nastoitettavat',
      'kesä tuumakoot',
      'talvi tuumakoot',
      'passenger car'
    ) then 'passenger'
    when category in ('ka renkaat', 'truck') then 'excluded_heavy'
    when category in ('mp-renkaat', 'motorbike') then 'excluded_motorcycle'
    when category in ('traktori', 'tractor', 'otr / teollisuus', 'otr', 'trukin renkaat', 'atv', 'trailer') then 'excluded_agri_industrial'
    when supplier = 'vt' and category = '' and size_string like '%c%' then 'van_c'
    when supplier = 'rd' and category like '% c%' then 'van_c'
    when category like '%4x4%' then 'suv_4x4'
    when category = '' then null
    else 'other'
  end
  from raw;
$$;

create or replace function public.catalog_selected_items_set_tire_segment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.product_type = 'tire' then
    new.tire_segment := public.catalog_normalize_tire_segment(
      new.selected_supplier,
      coalesce(new.supplier_metadata_json, '{}'::jsonb),
      new.size_string
    );
  else
    new.tire_segment := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_catalog_selected_items_tire_segment on public.catalog_selected_items;
create trigger trg_catalog_selected_items_tire_segment
before insert or update of product_type, selected_supplier, supplier_metadata_json, size_string
on public.catalog_selected_items
for each row
execute function public.catalog_selected_items_set_tire_segment();

create or replace function public.webshop_items_set_tire_segment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.product_type = 'tire' then
    select s.tire_segment
    into new.tire_segment
    from public.catalog_selected_items s
    where s.id = new.variant_id
      and s.product_type = 'tire';

    if new.tire_segment is null then
      new.tire_segment := 'other';
    end if;
  else
    new.tire_segment := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_webshop_items_tire_segment on public.webshop_items;
create trigger trg_webshop_items_tire_segment
before insert or update of product_type, variant_id
on public.webshop_items
for each row
execute function public.webshop_items_set_tire_segment();

update public.catalog_selected_items
set tire_segment = public.catalog_normalize_tire_segment(
  selected_supplier,
  coalesce(supplier_metadata_json, '{}'::jsonb),
  size_string
)
where product_type = 'tire';

update public.webshop_items w
set tire_segment = coalesce(s.tire_segment, 'other')
from public.catalog_selected_items s
where w.product_type = 'tire'
  and s.product_type = 'tire'
  and s.id = w.variant_id;

create index if not exists catalog_selected_items_tire_segment_idx
on public.catalog_selected_items (product_type, tire_segment)
where product_type = 'tire';

create index if not exists webshop_items_tire_ready_segment_idx
on public.webshop_items (tire_segment, brand_display_name, brand, model, variant_id)
where product_type = 'tire'
  and is_visible = true
  and publish_status = 'published'
  and product_ready = true;

comment on column public.catalog_selected_items.tire_segment is
  'Normalized tire segment derived from supplier category metadata: passenger, van_c, suv_4x4, excluded_* or other.';

comment on column public.webshop_items.tire_segment is
  'Published tire segment copied from the selected winner layer for CMS visibility and future storefront filters.';

revoke all on function public.catalog_normalize_tire_segment(text, jsonb, text) from public;
revoke all on function public.catalog_selected_items_set_tire_segment() from public;
revoke all on function public.webshop_items_set_tire_segment() from public;
