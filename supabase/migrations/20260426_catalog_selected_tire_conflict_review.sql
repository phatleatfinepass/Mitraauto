-- Step 3 of the catalog rebuild: conflict review layer for selected tires.
-- This is a parallel review surface only. It records human decisions, but does
-- not publish to CMS/webshop and does not change resolver winner logic yet.

create table if not exists public.catalog_selected_item_reviews (
  id uuid primary key default gen_random_uuid(),
  selected_item_id uuid not null references public.catalog_selected_items(id) on delete cascade,
  product_type text not null default 'tire' check (product_type = 'tire'),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'accepted', 'needs_supplier_check', 'manual_selected', 'ignored')),
  resolution_action text
    check (resolution_action is null or resolution_action in (
      'accept_selected',
      'keep_for_manual_review',
      'select_alternative_supplier',
      'ignore_conflict',
      'fix_source_data'
    )),
  selected_supplier text check (selected_supplier is null or selected_supplier in ('RD', 'VT')),
  selected_external_id text,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (selected_item_id)
);

create index if not exists catalog_selected_item_reviews_status_idx
  on public.catalog_selected_item_reviews (review_status, updated_at desc);

create index if not exists catalog_selected_item_reviews_item_idx
  on public.catalog_selected_item_reviews (selected_item_id);

drop trigger if exists trg_catalog_selected_item_reviews_updated_at on public.catalog_selected_item_reviews;
create trigger trg_catalog_selected_item_reviews_updated_at
before update on public.catalog_selected_item_reviews
for each row
execute function public.catalog_selected_touch_updated_at();

alter table public.catalog_selected_item_reviews enable row level security;

comment on table public.catalog_selected_item_reviews is
  'Human review decisions for catalog selected item conflicts. This table is not used by public catalog publishing until a later wiring step.';

create or replace view public.catalog_selected_tire_conflict_queue as
select
  c.id as selected_item_id,
  c.match_key,
  c.match_confidence,
  c.conflict_status,
  c.conflict_reason,
  coalesce(r.review_status, 'pending') as review_status,
  r.resolution_action,
  r.selected_supplier as review_selected_supplier,
  r.selected_external_id as review_selected_external_id,
  r.notes as review_notes,
  r.reviewed_by,
  r.reviewed_at,
  c.selected_supplier,
  c.selected_external_id,
  c.selected_reason,
  c.ean,
  c.eprel_code,
  c.brand,
  c.model,
  c.supplier_title,
  c.size_string,
  c.season,
  c.width_mm,
  c.aspect_ratio,
  c.diameter_in,
  c.load_index,
  c.speed_rating,
  c.stock_qty,
  c.in_stock,
  c.wholesale_price_eur,
  c.consumer_price_eur,
  c.retail_price_eur,
  c.recycling_fee_eur,
  c.final_base_price_eur,
  c.eu_fuel_class,
  c.eu_wet_grip_class,
  c.eu_noise_db,
  c.eu_noise_class,
  c.supplier_image_id,
  c.supplier_image_url,
  jsonb_array_length(c.alternative_offers_json) as alternative_offer_count,
  c.alternative_offers_json,
  c.supplier_metadata_json,
  c.last_selected_at,
  c.updated_at,
  c.selected_raw_table,
  c.selected_raw_id,
  c.last_seen_at,
  c.raw_supplier_price_ex_vat,
  c.shipping_fee_ex_vat,
  c.fair_cost_ex_vat,
  c.fair_cost_reason
from public.catalog_selected_items c
left join public.catalog_selected_item_reviews r
  on r.selected_item_id = c.id
where c.product_type = 'tire'
  and c.is_available
  and c.conflict_status <> 'resolved'
  and jsonb_array_length(c.alternative_offers_json) > 0;

create or replace view public.catalog_selected_tire_conflict_offer_rows as
select
  c.id as selected_item_id,
  c.match_key,
  c.conflict_reason,
  coalesce(r.review_status, 'pending') as review_status,
  true as is_current_winner,
  c.selected_supplier as supplier_code,
  c.selected_external_id as external_id,
  c.selected_raw_table as raw_table,
  c.selected_raw_id as raw_id,
  c.ean,
  c.eprel_code,
  c.brand,
  c.model,
  c.size_string,
  c.season,
  c.width_mm,
  c.aspect_ratio,
  c.diameter_in,
  c.load_index,
  c.speed_rating,
  c.stock_qty,
  c.in_stock,
  c.wholesale_price_eur,
  c.consumer_price_eur,
  c.retail_price_eur,
  c.recycling_fee_eur,
  c.supplier_image_id,
  c.supplier_image_url,
  c.last_seen_at
from public.catalog_selected_items c
left join public.catalog_selected_item_reviews r
  on r.selected_item_id = c.id
where c.product_type = 'tire'
  and c.is_available
  and c.conflict_status <> 'resolved'
  and jsonb_array_length(c.alternative_offers_json) > 0

union all

select
  c.id as selected_item_id,
  c.match_key,
  c.conflict_reason,
  coalesce(r.review_status, 'pending') as review_status,
  false as is_current_winner,
  offer.value->>'supplier' as supplier_code,
  offer.value->>'external_id' as external_id,
  offer.value->>'raw_table' as raw_table,
  nullif(offer.value->>'raw_id', '')::uuid as raw_id,
  offer.value->>'ean' as ean,
  offer.value->>'eprel_code' as eprel_code,
  offer.value->>'brand' as brand,
  offer.value->>'model' as model,
  offer.value->>'size_string' as size_string,
  offer.value->>'season' as season,
  nullif(offer.value->>'width_mm', '')::numeric as width_mm,
  nullif(offer.value->>'aspect_ratio', '')::numeric as aspect_ratio,
  nullif(offer.value->>'diameter_in', '')::numeric as diameter_in,
  offer.value->>'load_index' as load_index,
  offer.value->>'speed_rating' as speed_rating,
  nullif(offer.value->>'stock_qty', '')::integer as stock_qty,
  coalesce((offer.value->>'in_stock')::boolean, false) as in_stock,
  nullif(offer.value->>'wholesale_price_eur', '')::numeric as wholesale_price_eur,
  nullif(offer.value->>'consumer_price_eur', '')::numeric as consumer_price_eur,
  nullif(offer.value->>'retail_price_eur', '')::numeric as retail_price_eur,
  nullif(offer.value->>'recycling_fee_eur', '')::numeric as recycling_fee_eur,
  offer.value->>'supplier_image_id' as supplier_image_id,
  offer.value->>'supplier_image_url' as supplier_image_url,
  nullif(offer.value->>'last_seen_at', '')::timestamptz as last_seen_at
from public.catalog_selected_items c
cross join lateral jsonb_array_elements(c.alternative_offers_json) as offer(value)
left join public.catalog_selected_item_reviews r
  on r.selected_item_id = c.id
where c.product_type = 'tire'
  and c.is_available
  and c.conflict_status <> 'resolved'
  and jsonb_array_length(c.alternative_offers_json) > 0;

create or replace view public.catalog_selected_tire_conflict_review_summary as
select
  conflict_reason,
  review_status,
  count(*) as item_count,
  count(*) filter (where alternative_offer_count > 0) as with_alternatives,
  count(*) filter (where ean is not null) as with_ean,
  count(*) filter (where eprel_code is not null) as with_eprel,
  count(*) filter (where selected_supplier = 'RD') as rd_winners,
  count(*) filter (where selected_supplier = 'VT') as vt_winners
from public.catalog_selected_tire_conflict_queue
group by conflict_reason, review_status;

drop function if exists public.catalog_list_selected_tire_conflicts_v1(text, text, integer, integer);

create or replace function public.catalog_list_selected_tire_conflicts_v1(
  p_conflict_reason text default null,
  p_review_status text default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  selected_item_id uuid,
  match_key text,
  match_confidence text,
  conflict_reason text,
  review_status text,
  selected_supplier text,
  selected_external_id text,
  selected_raw_table text,
  selected_raw_id uuid,
  selected_reason text,
  ean text,
  eprel_code text,
  brand text,
  model text,
  supplier_title text,
  size_string text,
  season text,
  width_mm numeric,
  aspect_ratio numeric,
  diameter_in numeric,
  load_index text,
  speed_rating text,
  stock_qty integer,
  in_stock boolean,
  wholesale_price_eur numeric,
  consumer_price_eur numeric,
  retail_price_eur numeric,
  recycling_fee_eur numeric,
  final_base_price_eur numeric,
  eu_fuel_class text,
  eu_wet_grip_class text,
  eu_noise_db integer,
  eu_noise_class text,
  supplier_image_id text,
  supplier_image_url text,
  supplier_metadata_json jsonb,
  last_seen_at timestamptz,
  raw_supplier_price_ex_vat numeric,
  shipping_fee_ex_vat numeric,
  fair_cost_ex_vat numeric,
  fair_cost_reason text,
  alternative_offer_count integer,
  alternative_offers_json jsonb,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select *
    from public.catalog_selected_tire_conflict_queue q
    where (p_conflict_reason is null or q.conflict_reason = p_conflict_reason)
      and (p_review_status is null or q.review_status = p_review_status)
  ),
  counted as (
    select filtered.*, count(*) over () as total_count
    from filtered
    order by
      case filtered.conflict_reason
        when 'identity_mismatch' then 1
        when 'brand_mismatch' then 2
        when 'eprel_mismatch' then 3
        when 'missing_required_data' then 4
        else 5
      end,
      filtered.brand,
      filtered.model,
      filtered.size_string,
      filtered.selected_item_id
    limit greatest(1, least(coalesce(p_limit, 100), 500))
    offset greatest(0, coalesce(p_offset, 0))
  )
  select
    counted.selected_item_id,
    counted.match_key,
    counted.match_confidence,
    counted.conflict_reason,
    counted.review_status,
    counted.selected_supplier,
    counted.selected_external_id,
    counted.selected_raw_table,
    counted.selected_raw_id,
    counted.selected_reason,
    counted.ean,
    counted.eprel_code,
    counted.brand,
    counted.model,
    counted.supplier_title,
    counted.size_string,
    counted.season,
    counted.width_mm,
    counted.aspect_ratio,
    counted.diameter_in,
    counted.load_index,
    counted.speed_rating,
    counted.stock_qty,
    counted.in_stock,
    counted.wholesale_price_eur,
    counted.consumer_price_eur,
    counted.retail_price_eur,
    counted.recycling_fee_eur,
    counted.final_base_price_eur,
    counted.eu_fuel_class,
    counted.eu_wet_grip_class,
    counted.eu_noise_db,
    counted.eu_noise_class,
    counted.supplier_image_id,
    counted.supplier_image_url,
    counted.supplier_metadata_json,
    counted.last_seen_at,
    counted.raw_supplier_price_ex_vat,
    counted.shipping_fee_ex_vat,
    counted.fair_cost_ex_vat,
    counted.fair_cost_reason,
    counted.alternative_offer_count,
    counted.alternative_offers_json,
    counted.total_count
  from counted;
$$;

create or replace function public.catalog_set_selected_item_review_v1(
  p_selected_item_id uuid,
  p_review_status text,
  p_resolution_action text default null,
  p_selected_supplier text default null,
  p_selected_external_id text default null,
  p_notes text default null
)
returns public.catalog_selected_item_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.catalog_selected_item_reviews;
begin
  if p_review_status not in ('pending', 'accepted', 'needs_supplier_check', 'manual_selected', 'ignored') then
    raise exception 'Invalid review_status: %', p_review_status;
  end if;

  if p_resolution_action is not null and p_resolution_action not in (
    'accept_selected',
    'keep_for_manual_review',
    'select_alternative_supplier',
    'ignore_conflict',
    'fix_source_data'
  ) then
    raise exception 'Invalid resolution_action: %', p_resolution_action;
  end if;

  insert into public.catalog_selected_item_reviews (
    selected_item_id,
    product_type,
    review_status,
    resolution_action,
    selected_supplier,
    selected_external_id,
    notes,
    reviewed_by,
    reviewed_at
  )
  values (
    p_selected_item_id,
    'tire',
    p_review_status,
    p_resolution_action,
    p_selected_supplier,
    p_selected_external_id,
    p_notes,
    auth.uid(),
    case when p_review_status = 'pending' then null else now() end
  )
  on conflict (selected_item_id) do update set
    review_status = excluded.review_status,
    resolution_action = excluded.resolution_action,
    selected_supplier = excluded.selected_supplier,
    selected_external_id = excluded.selected_external_id,
    notes = excluded.notes,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.catalog_list_selected_tire_conflicts_v1(text, text, integer, integer) from public;
grant execute on function public.catalog_list_selected_tire_conflicts_v1(text, text, integer, integer) to authenticated, service_role;

revoke all on function public.catalog_set_selected_item_review_v1(uuid, text, text, text, text, text) from public;
grant execute on function public.catalog_set_selected_item_review_v1(uuid, text, text, text, text, text) to authenticated, service_role;
