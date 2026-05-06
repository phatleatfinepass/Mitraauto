-- Step 2 of the catalog rebuild: resolve clean RD/VT tire raw rows into one
-- selected catalog item per matched product. This layer is still not public;
-- CMS/webshop publishing will be wired in a later migration.

create or replace function public.catalog_selected_stable_uuid(p_key text)
returns uuid
language sql
immutable
as $$
  select (
    substr(md5('catalog_selected_items:' || coalesce(p_key, '')), 1, 8) || '-' ||
    substr(md5('catalog_selected_items:' || coalesce(p_key, '')), 9, 4) || '-' ||
    substr(md5('catalog_selected_items:' || coalesce(p_key, '')), 13, 4) || '-' ||
    substr(md5('catalog_selected_items:' || coalesce(p_key, '')), 17, 4) || '-' ||
    substr(md5('catalog_selected_items:' || coalesce(p_key, '')), 21, 12)
  )::uuid;
$$;

create or replace function public.catalog_selected_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.catalog_selected_compact_numeric(p_value numeric)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(p_value::text, ''), '\.?0+$', ''), '');
$$;

create or replace function public.catalog_selected_format_tire_size(
  p_width numeric,
  p_aspect numeric,
  p_diameter numeric,
  p_load_index text,
  p_speed_rating text,
  p_fallback text default null
)
returns text
language sql
immutable
as $$
  select coalesce(
    case
      when p_width is not null
        and p_aspect is not null
        and p_diameter is not null
        and p_width between 100 and 399
        and p_aspect between 20 and 99
        and p_diameter between 10 and 30
      then
        concat(
          public.catalog_selected_compact_numeric(p_width),
          ' / ',
          lpad(public.catalog_selected_compact_numeric(p_aspect), 2, '0'),
          ' R',
          lpad(public.catalog_selected_compact_numeric(p_diameter), 2, '0'),
          case
            when nullif(btrim(coalesce(p_load_index, '')), '') is not null
              or nullif(btrim(coalesce(p_speed_rating, '')), '') is not null
            then ' ' || concat(
              nullif(regexp_replace(coalesce(p_load_index, ''), '\D', '', 'g'), ''),
              case
                when nullif(regexp_replace(coalesce(p_load_index, ''), '\D', '', 'g'), '') is not null
                  and nullif(regexp_replace(upper(coalesce(p_speed_rating, '')), '[^A-Z]', '', 'g'), '') is not null
                then ' '
                else ''
              end,
              nullif(regexp_replace(upper(coalesce(p_speed_rating, '')), '[^A-Z]', '', 'g'), '')
            )
            else ''
          end
        )
      else null
    end,
    nullif(btrim(p_fallback), '')
  );
$$;

create table if not exists public.catalog_selected_item_runs (
  id uuid primary key default gen_random_uuid(),
  product_type text not null default 'tire' check (product_type = 'tire'),
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_rd_count integer not null default 0,
  source_vt_count integer not null default 0,
  selected_count integer not null default 0,
  resolved_count integer not null default 0,
  needs_review_count integer not null default 0,
  marked_unavailable_count integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  error jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_selected_items (
  id uuid primary key,
  product_type text not null default 'tire' check (product_type = 'tire'),

  selected_supplier text not null check (selected_supplier in ('RD', 'VT')),
  selected_external_id text not null,
  selected_raw_table text not null,
  selected_raw_id uuid not null,
  selected_reason text not null,

  match_key text not null unique,
  match_confidence text not null check (match_confidence in ('high', 'medium', 'low')),
  conflict_status text not null check (conflict_status in ('resolved', 'needs_review', 'manual_selected')),
  conflict_reason text,

  ean text,
  eprel_code text,

  brand text,
  model text,
  supplier_title text,
  size_string text,
  season text,

  width_mm numeric(8,2),
  aspect_ratio numeric(8,2),
  diameter_in numeric(8,2),
  load_index text,
  speed_rating text,

  stock_qty integer,
  in_stock boolean not null default false,
  delivery_days_min integer,
  delivery_days_max integer,

  wholesale_price_eur numeric(12,2),
  consumer_price_eur numeric(12,2),
  retail_price_eur numeric(12,2),
  recycling_fee_eur numeric(12,2),
  final_base_price_eur numeric(12,2),
  raw_supplier_price_ex_vat numeric(12,2),
  shipping_fee_ex_vat numeric(12,2),
  fair_cost_ex_vat numeric(12,2),
  fair_cost_reason text,

  runflat boolean,
  xl_reinforced boolean,
  studded boolean,
  ev_ready boolean,
  threepmsf boolean,
  winter_approved boolean,
  ice_approved boolean,

  eu_fuel_class text,
  eu_wet_grip_class text,
  eu_noise_db integer,
  eu_noise_class text,
  eu_label_json jsonb not null default '{}'::jsonb,

  supplier_image_id text,
  supplier_image_url text,
  supplier_metadata_json jsonb not null default '{}'::jsonb,
  alternative_offers_json jsonb not null default '[]'::jsonb,

  source_raw_ids jsonb not null default '{}'::jsonb,
  last_rebuild_run_id uuid references public.catalog_selected_item_runs(id) on delete set null,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_selected_at timestamptz not null default now(),
  is_available boolean not null default true,
  unavailable_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint catalog_selected_items_stock_nonnegative check (stock_qty is null or stock_qty >= 0),
  constraint catalog_selected_items_price_nonnegative check (
    (wholesale_price_eur is null or wholesale_price_eur >= 0)
    and (consumer_price_eur is null or consumer_price_eur >= 0)
    and (retail_price_eur is null or retail_price_eur >= 0)
    and (recycling_fee_eur is null or recycling_fee_eur >= 0)
    and (final_base_price_eur is null or final_base_price_eur >= 0)
    and (raw_supplier_price_ex_vat is null or raw_supplier_price_ex_vat >= 0)
    and (shipping_fee_ex_vat is null or shipping_fee_ex_vat >= 0)
    and (fair_cost_ex_vat is null or fair_cost_ex_vat >= 0)
  ),
  constraint catalog_selected_items_unavailable_since_check check (
    is_available or unavailable_since is not null
  )
);

alter table public.catalog_selected_items
  add column if not exists raw_supplier_price_ex_vat numeric(12,2),
  add column if not exists shipping_fee_ex_vat numeric(12,2),
  add column if not exists fair_cost_ex_vat numeric(12,2),
  add column if not exists fair_cost_reason text;

create index if not exists catalog_selected_items_product_available_idx
  on public.catalog_selected_items (product_type, is_available, last_selected_at desc);

create index if not exists catalog_selected_items_supplier_idx
  on public.catalog_selected_items (selected_supplier, selected_external_id);

create index if not exists catalog_selected_items_ean_idx
  on public.catalog_selected_items (ean)
  where ean is not null and ean <> '';

create index if not exists catalog_selected_items_eprel_idx
  on public.catalog_selected_items (eprel_code)
  where eprel_code is not null and eprel_code <> '';

create index if not exists catalog_selected_items_brand_model_idx
  on public.catalog_selected_items (brand, model);

create index if not exists catalog_selected_items_size_dims_idx
  on public.catalog_selected_items (width_mm, aspect_ratio, diameter_in);

create index if not exists catalog_selected_items_conflict_idx
  on public.catalog_selected_items (conflict_status, conflict_reason)
  where conflict_status <> 'resolved';

drop trigger if exists trg_catalog_selected_items_updated_at on public.catalog_selected_items;
create trigger trg_catalog_selected_items_updated_at
before update on public.catalog_selected_items
for each row
execute function public.catalog_selected_touch_updated_at();

alter table public.catalog_selected_item_runs enable row level security;
alter table public.catalog_selected_items enable row level security;

comment on table public.catalog_selected_items is
  'Resolved supplier tire layer. One selected item per match_key, with losing supplier offers preserved for audit and conflict review.';

create or replace function public.catalog_rebuild_selected_tires_v1()
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
  v_resolved_count integer := 0;
  v_needs_review_count integer := 0;
  v_marked_unavailable_count integer := 0;
  v_stats jsonb := '{}'::jsonb;
begin
  insert into public.catalog_selected_item_runs (product_type, status)
  values ('tire', 'running')
  returning id into v_run_id;

  create temp table tmp_catalog_selected_candidates on commit drop as
  with rd as (
    select
      'RD'::text as supplier_code,
      'supplier_raw_rd_tires'::text as raw_table,
      r.id as raw_id,
      r.external_id,
      nullif(btrim(r.source_sku), '') as source_sku,
      case
        when length(nullif(regexp_replace(coalesce(r.ean, ''), '\D', '', 'g'), '')) between 8 and 14
          and nullif(regexp_replace(coalesce(r.ean, ''), '\D', '', 'g'), '') !~ '^([0-9])\1+$'
        then nullif(regexp_replace(coalesce(r.ean, ''), '\D', '', 'g'), '')
        else null
      end as ean,
      nullif(btrim(r.raw_payload->>'EPRELId'), '') as eprel_code,
      nullif(btrim(r.brand), '') as brand,
      nullif(btrim(r.model), '') as model,
      nullif(btrim(coalesce(r.raw_payload->>'ArticleText', r.size_text)), '') as supplier_title,
      public.catalog_selected_format_tire_size(
        r.width_mm,
        r.aspect_ratio,
        r.diameter_in,
        nullif(regexp_replace(coalesce(r.load_index, ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(upper(coalesce(r.speed_index, '')), '[^A-Z]', '', 'g'), ''),
        r.size_text
      ) as size_string,
      case
        when lower(concat_ws(' ', r.model, r.raw_payload->>'ArticleText', r.size_text)) ~ '(^|[^a-z0-9])(all[[:space:]_-]*season|allseason|4[[:space:]_-]*season|4seasons|multi[[:space:]_-]*season|multiseason)([^a-z0-9]|$)' then 'all_season'
        when lower(coalesce(r.season, r.raw_payload->>'MainGroupName', '')) like '%all%' then 'all_season'
        when lower(coalesce(r.season, r.raw_payload->>'MainGroupName', '')) like '%talvi%' then 'winter'
        when lower(coalesce(r.season, r.raw_payload->>'MainGroupName', '')) like '%kesä%' then 'summer'
        else nullif(btrim(r.season), '')
      end as season,
      r.width_mm,
      r.aspect_ratio,
      r.diameter_in,
      nullif(regexp_replace(coalesce(r.load_index, ''), '\D', '', 'g'), '') as load_index,
      nullif(regexp_replace(upper(coalesce(r.speed_index, '')), '[^A-Z]', '', 'g'), '') as speed_rating,
      r.stock_qty,
      coalesce(nullif(btrim(r.raw_payload->>'QuantityExternal'), '')::integer, 0) as external_stock_qty,
      coalesce(r.stock_qty, 0) > 0 as in_stock,
      case when nullif(btrim(r.raw_payload->>'ExternalDeliveryTime'), '') ~ '^\d+$'
        then (r.raw_payload->>'ExternalDeliveryTime')::integer
        else null
      end as delivery_days_min,
      case when nullif(btrim(r.raw_payload->>'ExternalDeliveryTime'), '') ~ '^\d+$'
        then (r.raw_payload->>'ExternalDeliveryTime')::integer
        else null
      end as delivery_days_max,
      r.wholesale_price_eur,
      r.consumer_price_eur,
      case when nullif(btrim(r.raw_payload->>'RetailPrice'), '') ~ '^\d+(\.\d+)?$'
        then (r.raw_payload->>'RetailPrice')::numeric(12,2)
        else null
      end as retail_price_eur,
      case when nullif(btrim(r.raw_payload->>'RecyclingFee'), '') ~ '^\d+(\.\d+)?$'
        then (r.raw_payload->>'RecyclingFee')::numeric(12,2)
        else null
      end as recycling_fee_eur,
      coalesce(r.wholesale_price_eur, r.consumer_price_eur) as final_base_price_eur,
      coalesce(
        case when nullif(btrim(r.raw_payload->>'NetPrice'), '') ~ '^\d+(\.\d+)?$'
          then (r.raw_payload->>'NetPrice')::numeric(12,2)
          else null
        end,
        r.wholesale_price_eur
      ) as raw_supplier_price_ex_vat,
      12::numeric(12,2) as shipping_fee_ex_vat,
      case
        when coalesce(
          case when nullif(btrim(r.raw_payload->>'NetPrice'), '') ~ '^\d+(\.\d+)?$'
            then (r.raw_payload->>'NetPrice')::numeric(12,2)
            else null
          end,
          r.wholesale_price_eur
        ) is not null
        and case when nullif(btrim(r.raw_payload->>'RecyclingFee'), '') ~ '^\d+(\.\d+)?$'
          then (r.raw_payload->>'RecyclingFee')::numeric(12,2)
          else null
        end is not null
        then round((
          coalesce(
            case when nullif(btrim(r.raw_payload->>'NetPrice'), '') ~ '^\d+(\.\d+)?$'
              then (r.raw_payload->>'NetPrice')::numeric(12,2)
              else null
            end,
            r.wholesale_price_eur
          ) +
          case when nullif(btrim(r.raw_payload->>'RecyclingFee'), '') ~ '^\d+(\.\d+)?$'
            then (r.raw_payload->>'RecyclingFee')::numeric(12,2)
            else null
          end +
          12
        )::numeric, 2)
        else null
      end as fair_cost_ex_vat,
      'rd_net_or_wholesale_plus_recycling_plus_shipping_12'::text as fair_cost_reason,
      lower(coalesce(r.raw_payload->>'RunFlat', '')) in ('true', '1', 'yes') as runflat,
      lower(coalesce(r.raw_payload->>'ExtraLoad', '')) in ('true', '1', 'yes') as xl_reinforced,
      lower(coalesce(r.raw_payload->>'Extra', r.model, '')) like '%studd%' as studded,
      null::boolean as ev_ready,
      lower(coalesce(r.raw_payload->>'SnowGrip', '')) in ('true', '1', 'yes') as threepmsf,
      lower(coalesce(r.raw_payload->>'IsWinterApproved', '')) in ('true', '1', 'yes') as winter_approved,
      lower(coalesce(r.raw_payload->>'IceGrip', '')) in ('true', '1', 'yes') as ice_approved,
      nullif(btrim(r.raw_payload->>'FuelEffiency'), '') as eu_fuel_class,
      nullif(btrim(r.raw_payload->>'WetGrip'), '') as eu_wet_grip_class,
      case when nullif(btrim(r.raw_payload->>'NoiceValue'), '') ~ '^\d+$'
        then (r.raw_payload->>'NoiceValue')::integer
        else null
      end as eu_noise_db,
      nullif(btrim(r.raw_payload->>'NoiceClass'), '') as eu_noise_class,
      jsonb_strip_nulls(jsonb_build_object(
        'source', 'RD',
        'eprel_code', nullif(btrim(r.raw_payload->>'EPRELId'), ''),
        'fuel_class', nullif(btrim(r.raw_payload->>'FuelEffiency'), ''),
        'wet_grip_class', nullif(btrim(r.raw_payload->>'WetGrip'), ''),
        'noise_db', nullif(btrim(r.raw_payload->>'NoiceValue'), ''),
        'noise_class', nullif(btrim(r.raw_payload->>'NoiceClass'), ''),
        'severe_snow', lower(coalesce(r.raw_payload->>'SnowGrip', '')) in ('true', '1', 'yes'),
        'severe_ice', lower(coalesce(r.raw_payload->>'IceGrip', '')) in ('true', '1', 'yes'),
        'tyre_class', nullif(btrim(r.raw_payload->>'TyreClass'), '')
      )) as eu_label_json,
      nullif(btrim(r.raw_payload->>'ImageId'), '') as supplier_image_id,
      nullif(btrim(r.image_url), '') as supplier_image_url,
      jsonb_strip_nulls(jsonb_build_object(
        'brand_id', r.raw_payload->'BrandId',
        'main_group_id', r.raw_payload->'MainGroupId',
        'main_group_name', r.raw_payload->'MainGroupName',
        'created', r.raw_payload->'Created',
        'dot_year', r.raw_payload->'DotYear',
        'extra', r.raw_payload->'Extra',
        'external_delivery_time', r.raw_payload->'ExternalDeliveryTime',
        'external_stock_region', r.raw_payload->'ExternalStockRegion',
        'quantity_external', r.raw_payload->'QuantityExternal',
        'oem_marking', r.raw_payload->'OEMarking',
        'position_text', r.raw_payload->'PositionText',
        'tread_depth', r.raw_payload->'TreadDepth',
        'tyre_class', r.raw_payload->'TyreClass',
        'weight_kg', r.raw_payload->'Weight',
        'friction_region', r.raw_payload->'FrictionRegion'
      )) as supplier_metadata_json,
      r.first_seen_at,
      r.last_seen_at,
      r.is_available,
      r.raw_checksum
    from public.supplier_raw_rd_tires r
    where r.is_available
      and (
        coalesce(r.stock_qty, 0) > 0
        or coalesce(nullif(btrim(r.raw_payload->>'QuantityExternal'), '')::integer, 0) > 0
      )
      and lower(coalesce(r.raw_payload->>'MainGroupName', '')) in (
        'kesärenkaat ha',
        'talvirenkaat kitka',
        'talvirenkaat nastoitetut',
        'talvirenkaat nastoitettavat',
        'kesä c',
        'talvi c kitka',
        'talvirenkaat c nastoitetut',
        'talvi c nastoitettavat',
        'kesä tuumakoot',
        'talvi tuumakoot'
      )
  ),
  vt as (
    select
      'VT'::text as supplier_code,
      'supplier_raw_vt_tires'::text as raw_table,
      v.id as raw_id,
      v.external_id,
      nullif(btrim(v.source_sku), '') as source_sku,
      case
        when length(nullif(regexp_replace(coalesce(v.ean, ''), '\D', '', 'g'), '')) between 8 and 14
          and nullif(regexp_replace(coalesce(v.ean, ''), '\D', '', 'g'), '') !~ '^([0-9])\1+$'
        then nullif(regexp_replace(coalesce(v.ean, ''), '\D', '', 'g'), '')
        else null
      end as ean,
      nullif(btrim(coalesce(v.eprel_code, v.raw_payload#>>'{EU_Label,EprelCode}')), '') as eprel_code,
      nullif(btrim(v.brand), '') as brand,
      nullif(btrim(v.model), '') as model,
      nullif(btrim(concat_ws(' ', v.brand, v.model, v.size_text)), '') as supplier_title,
      public.catalog_selected_format_tire_size(
        v.width_mm,
        v.aspect_ratio,
        v.diameter_in,
        nullif(regexp_replace(coalesce(v.load_index, ''), '\D', '', 'g'), ''),
        nullif(regexp_replace(upper(coalesce(v.speed_index, '')), '[^A-Z]', '', 'g'), ''),
        v.size_text
      ) as size_string,
      case
        when lower(concat_ws(' ', v.model, v.size_text)) ~ '(^|[^a-z0-9])(all[[:space:]_-]*season|allseason|4[[:space:]_-]*season|4seasons|multi[[:space:]_-]*season|multiseason)([^a-z0-9]|$)' then 'all_season'
        when lower(coalesce(v.season, '')) in ('all season', 'all-season', 'allseason') then 'all_season'
        when lower(coalesce(v.season, '')) in ('summer', 'winter', 'all_season') then lower(v.season)
        else nullif(btrim(v.season), '')
      end as season,
      v.width_mm,
      v.aspect_ratio,
      v.diameter_in,
      nullif(regexp_replace(coalesce(v.load_index, ''), '\D', '', 'g'), '') as load_index,
      nullif(regexp_replace(upper(coalesce(v.speed_index, '')), '[^A-Z]', '', 'g'), '') as speed_rating,
      v.stock_qty,
      0::integer as external_stock_qty,
      coalesce(v.stock_qty, 0) > 0 as in_stock,
      null::integer as delivery_days_min,
      null::integer as delivery_days_max,
      v.wholesale_price_eur,
      v.consumer_price_eur,
      v.consumer_price_eur as retail_price_eur,
      null::numeric(12,2) as recycling_fee_eur,
      coalesce(v.wholesale_price_eur, v.consumer_price_eur) as final_base_price_eur,
      coalesce(v.wholesale_price_eur, v.consumer_price_eur) as raw_supplier_price_ex_vat,
      20::numeric(12,2) as shipping_fee_ex_vat,
      case
        when coalesce(v.wholesale_price_eur, v.consumer_price_eur) is not null
          then (coalesce(v.wholesale_price_eur, v.consumer_price_eur) + 20)::numeric(12,2)
        else null
      end as fair_cost_ex_vat,
      'vt_wholesale_plus_fixed_shipping_20'::text as fair_cost_reason,
      lower(coalesce(v.raw_payload->>'Runflat', '')) in ('yes', 'true', '1') as runflat,
      null::boolean as xl_reinforced,
      lower(coalesce(v.raw_payload->>'Studded', '')) in ('yes', 'true', '1') as studded,
      null::boolean as ev_ready,
      coalesce(
        nullif(btrim(v.raw_payload#>>'{EU_Label,SnowClass}'), '') is not null,
        false
      ) or lower(coalesce(v.raw_payload->>'MS_tyre', '')) in ('yes', 'true', '1') as threepmsf,
      lower(coalesce(v.raw_payload->>'MS_tyre', '')) in ('yes', 'true', '1')
        or lower(coalesce(v.season, '')) in ('winter', 'all_season') as winter_approved,
      nullif(btrim(v.raw_payload#>>'{EU_Label,IceClass}'), '') is not null as ice_approved,
      nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,RRC}', v.raw_payload->>'RRC')), '') as eu_fuel_class,
      nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,WetGrip}', v.raw_payload->>'WetGrip')), '') as eu_wet_grip_class,
      case when nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,NoiseValuedB}', v.raw_payload->>'NoiseDb')), '') ~ '^\d+$'
        then coalesce(v.raw_payload#>>'{EU_Label,NoiseValuedB}', v.raw_payload->>'NoiseDb')::integer
        else null
      end as eu_noise_db,
      nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,NoiseClass}', v.raw_payload->>'NoiseEmission')), '') as eu_noise_class,
      jsonb_strip_nulls(jsonb_build_object(
        'source', 'VT',
        'eprel_code', nullif(btrim(coalesce(v.eprel_code, v.raw_payload#>>'{EU_Label,EprelCode}')), ''),
        'eprel_url', nullif(btrim(v.raw_payload#>>'{EU_Label,RegisterCode}'), ''),
        'label_image_url', nullif(btrim(v.raw_payload#>>'{EU_Label,LabelImage}'), ''),
        'fuel_class', nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,RRC}', v.raw_payload->>'RRC')), ''),
        'wet_grip_class', nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,WetGrip}', v.raw_payload->>'WetGrip')), ''),
        'noise_db', nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,NoiseValuedB}', v.raw_payload->>'NoiseDb')), ''),
        'noise_class', nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,NoiseClass}', v.raw_payload->>'NoiseEmission')), ''),
        'severe_snow', nullif(btrim(v.raw_payload#>>'{EU_Label,SnowClass}'), ''),
        'severe_ice', nullif(btrim(v.raw_payload#>>'{EU_Label,IceClass}'), ''),
        'tyre_class', nullif(btrim(coalesce(v.raw_payload#>>'{EU_Label,LabelType}', v.raw_payload->>'Tyre_type')), '')
      )) as eu_label_json,
      nullif(btrim(coalesce(v.raw_payload->>'Image', v.external_id)), '') as supplier_image_id,
      nullif(btrim(v.image_url), '') as supplier_image_url,
      jsonb_strip_nulls(jsonb_build_object(
        'category', v.raw_payload->'Category',
        'dot', v.raw_payload->'DOT',
        'date_available', v.raw_payload->'DateAvailable',
        'date_modified', v.raw_payload->'Date_modified',
        'description', v.raw_payload->'Description',
        'freight_class', v.raw_payload->'FreightClass',
        'tyre_type', v.raw_payload->'Tyre_type',
        'weight_net_kg', v.raw_payload#>'{Measurements,WeightNet,#text}',
        'weight_gross_kg', v.raw_payload#>'{Measurements,WeightGross,#text}',
        'whitewall', v.raw_payload->'Whitewall',
        'replace_size', v.raw_payload->'ReplaceSize',
        'warehouse', v.raw_payload#>'{Availability,Warehouse}'
      )) as supplier_metadata_json,
      v.first_seen_at,
      v.last_seen_at,
      v.is_available,
      v.raw_checksum
    from public.supplier_raw_vt_tires v
    where v.is_available
      and coalesce(v.stock_qty, 0) > 0
      and lower(coalesce(v.raw_payload->>'Tyre_type', '')) in (
        'passenger car',
        '4x4',
        'van',
        '4x4c'
      )
  ),
  unioned as (
    select * from rd
    union all
    select * from vt
  )
  select
    *,
    coalesce(
      case when ean is not null then 'ean:' || ean end,
      case when eprel_code is not null then 'eprel:' || regexp_replace(eprel_code, '\s+', '', 'g') end,
      'spec:' ||
        md5(lower(concat_ws('|', brand, width_mm::text, aspect_ratio::text, diameter_in::text, load_index, speed_rating, season)))
    ) as match_key,
    (
      (case when ean is not null then 32 else 0 end) +
      (case when eprel_code is not null then 16 else 0 end) +
      (case when eu_label_json <> '{}'::jsonb then 8 else 0 end) +
      (case when supplier_image_id is not null or supplier_image_url is not null then 4 else 0 end) +
      (case when load_index is not null and speed_rating is not null then 2 else 0 end) +
      (case when supplier_metadata_json <> '{}'::jsonb then 1 else 0 end)
    ) as metadata_score
  from unioned;

  get diagnostics v_source_rd_count = row_count;
  select count(*) filter (where supplier_code = 'RD'),
         count(*) filter (where supplier_code = 'VT')
    into v_source_rd_count, v_source_vt_count
  from tmp_catalog_selected_candidates;

  create index on tmp_catalog_selected_candidates (match_key);

  create temp table tmp_catalog_selected_groups on commit drop as
  with basis as (
    select
      c.*,
      bool_or(coalesce(c.stock_qty, 0) > 0) over (partition by c.match_key) as group_has_local_stock
    from tmp_catalog_selected_candidates c
  )
  select
    match_key,
    bool_or(group_has_local_stock) as group_has_local_stock,
    count(*) as offer_count,
    count(*) filter (where not group_has_local_stock or coalesce(stock_qty, 0) > 0) as conflict_offer_count,
    count(distinct supplier_code) filter (where not group_has_local_stock or coalesce(stock_qty, 0) > 0) as supplier_count,
    count(distinct supplier_code || ':' || external_id) as distinct_source_count,
    count(distinct nullif(ean, '')) filter (where ean is not null and (not group_has_local_stock or coalesce(stock_qty, 0) > 0)) as ean_count,
    count(distinct nullif(eprel_code, '')) filter (where eprel_code is not null and (not group_has_local_stock or coalesce(stock_qty, 0) > 0)) as eprel_count,
    count(distinct lower(coalesce(brand, ''))) filter (where brand is not null and (not group_has_local_stock or coalesce(stock_qty, 0) > 0)) as brand_count,
    count(distinct concat_ws('|', coalesce(width_mm::text, ''), coalesce(aspect_ratio::text, ''), coalesce(diameter_in::text, ''))) filter (where not group_has_local_stock or coalesce(stock_qty, 0) > 0) as size_dim_count,
    count(distinct concat_ws('|', coalesce(load_index, ''), coalesce(speed_rating, ''))) filter (where not group_has_local_stock or coalesce(stock_qty, 0) > 0) as load_speed_count,
    min(first_seen_at) as first_seen_at,
    max(last_seen_at) as last_seen_at
  from basis
  group by match_key;

  create temp table tmp_catalog_selected_ranked on commit drop as
  select
    c.*,
    g.offer_count,
    g.conflict_offer_count,
    g.supplier_count,
    g.group_has_local_stock,
    g.ean_count,
    g.eprel_count,
    g.brand_count,
    g.size_dim_count,
    g.load_speed_count,
    g.first_seen_at as group_first_seen_at,
    g.last_seen_at as group_last_seen_at,
    row_number() over (
      partition by c.match_key
      order by
        c.in_stock desc,
        (coalesce(c.stock_qty, 0) > 0) desc,
        (
          case
            when c.supplier_code = 'VT' and c.raw_supplier_price_ex_vat is not null
              then (c.raw_supplier_price_ex_vat + 4.95)::numeric(12,2)
            else c.fair_cost_ex_vat
          end is null
        ) asc,
        case
          when c.supplier_code = 'VT' and c.raw_supplier_price_ex_vat is not null
            then (c.raw_supplier_price_ex_vat + 4.95)::numeric(12,2)
          else c.fair_cost_ex_vat
        end asc nulls last,
        c.metadata_score desc,
        (c.supplier_code = 'RD') desc,
        c.last_seen_at desc,
        c.external_id asc
    ) as winner_rank
  from tmp_catalog_selected_candidates c
  join tmp_catalog_selected_groups g using (match_key);

  create index on tmp_catalog_selected_ranked (match_key);
  create index on tmp_catalog_selected_ranked (match_key, winner_rank);

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
    eprel_code,
    brand,
    model,
    supplier_title,
    size_string,
    season,
    width_mm,
    aspect_ratio,
    diameter_in,
    load_index,
    speed_rating,
    stock_qty,
    in_stock,
    delivery_days_min,
    delivery_days_max,
    wholesale_price_eur,
    consumer_price_eur,
    retail_price_eur,
    recycling_fee_eur,
    final_base_price_eur,
    raw_supplier_price_ex_vat,
    shipping_fee_ex_vat,
    fair_cost_ex_vat,
    fair_cost_reason,
    runflat,
    xl_reinforced,
    studded,
    ev_ready,
    threepmsf,
    winter_approved,
    ice_approved,
    eu_fuel_class,
    eu_wet_grip_class,
    eu_noise_db,
    eu_noise_class,
    eu_label_json,
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
    public.catalog_selected_stable_uuid(w.match_key) as id,
    'tire' as product_type,
    w.supplier_code as selected_supplier,
    w.external_id as selected_external_id,
    w.raw_table as selected_raw_table,
    w.raw_id as selected_raw_id,
    case
      when w.in_stock then 'winner:in_stock_lowest_price'
      when w.fair_cost_ex_vat is not null then 'winner:lowest_fair_cost'
      else 'winner:metadata_priority'
    end as selected_reason,
    w.match_key,
    case
      when w.match_key like 'ean:%' then 'high'
      when w.match_key like 'eprel:%' then 'medium'
      else 'low'
    end as match_confidence,
    case
      when w.supplier_count = 1 and w.offer_count > 1 then 'resolved'
      when w.supplier_count > 1 and (w.brand_count > 1 or w.size_dim_count > 1 or w.eprel_count > 1) then 'needs_review'
      when w.ean is null and w.eprel_code is null then 'needs_review'
      when w.brand is null or w.model is null or w.size_string is null or w.fair_cost_ex_vat is null then 'needs_review'
      else 'resolved'
    end as conflict_status,
    case
      when w.supplier_count > 1 and w.brand_count > 1 then 'brand_mismatch'
      when w.supplier_count > 1 and w.size_dim_count > 1 then 'identity_mismatch'
      when w.supplier_count > 1 and w.eprel_count > 1 then 'eprel_mismatch'
      when w.supplier_count = 1 and w.offer_count > 1 then 'same_supplier_duplicate_resolved'
      when w.ean is null and w.eprel_code is null then 'weak_match_missing_ean_eprel'
      when w.brand is null or w.model is null or w.size_string is null or w.fair_cost_ex_vat is null then 'missing_required_data'
      when w.conflict_offer_count > 1 then 'multi_supplier_or_duplicate_resolved'
      else null
    end as conflict_reason,
    w.ean,
    w.eprel_code,
    w.brand,
    w.model,
    w.supplier_title,
    w.size_string,
    w.season,
    w.width_mm,
    w.aspect_ratio,
    w.diameter_in,
    w.load_index,
    w.speed_rating,
    w.stock_qty,
    w.in_stock,
    w.delivery_days_min,
    w.delivery_days_max,
    w.wholesale_price_eur,
    w.consumer_price_eur,
    w.retail_price_eur,
    w.recycling_fee_eur,
    w.final_base_price_eur,
    w.raw_supplier_price_ex_vat,
    w.shipping_fee_ex_vat,
    w.fair_cost_ex_vat,
    w.fair_cost_reason,
    w.runflat,
    w.xl_reinforced,
    w.studded,
    w.ev_ready,
    w.threepmsf,
    w.winter_approved,
    w.ice_approved,
    w.eu_fuel_class,
    w.eu_wet_grip_class,
    w.eu_noise_db,
    w.eu_noise_class,
    w.eu_label_json,
    w.supplier_image_id,
    w.supplier_image_url,
    w.supplier_metadata_json,
    coalesce(offers.alternative_offers_json, '[]'::jsonb),
    coalesce(offers.source_raw_ids, '{}'::jsonb),
    v_run_id,
    w.group_first_seen_at,
    w.group_last_seen_at,
    now(),
    true,
    null
  from tmp_catalog_selected_ranked w
  left join lateral (
    select
      jsonb_agg(
        jsonb_strip_nulls(jsonb_build_object(
          'supplier', a.supplier_code,
          'external_id', a.external_id,
          'raw_table', a.raw_table,
          'raw_id', a.raw_id,
          'ean', a.ean,
          'eprel_code', a.eprel_code,
          'brand', a.brand,
          'model', a.model,
          'supplier_title', a.supplier_title,
          'size_string', a.size_string,
          'season', a.season,
          'width_mm', a.width_mm,
          'aspect_ratio', a.aspect_ratio,
          'diameter_in', a.diameter_in,
          'load_index', a.load_index,
          'speed_rating', a.speed_rating,
          'stock_qty', a.stock_qty,
          'external_stock_qty', a.external_stock_qty,
          'in_stock', a.in_stock,
          'wholesale_price_eur', a.wholesale_price_eur,
          'consumer_price_eur', a.consumer_price_eur,
          'retail_price_eur', a.retail_price_eur,
          'recycling_fee_eur', a.recycling_fee_eur,
          'final_base_price_eur', a.final_base_price_eur,
          'raw_supplier_price_ex_vat', a.raw_supplier_price_ex_vat,
          'shipping_fee_ex_vat', a.shipping_fee_ex_vat,
          'fair_cost_ex_vat', a.fair_cost_ex_vat,
          'fair_cost_reason', a.fair_cost_reason,
          'eu_fuel_class', a.eu_fuel_class,
          'eu_wet_grip_class', a.eu_wet_grip_class,
          'eu_noise_db', a.eu_noise_db,
          'eu_noise_class', a.eu_noise_class,
          'supplier_image_id', a.supplier_image_id,
          'supplier_image_url', a.supplier_image_url,
          'supplier_metadata_json', a.supplier_metadata_json,
          'metadata_score', a.metadata_score,
          'last_seen_at', a.last_seen_at
        ))
        order by a.supplier_code, a.external_id
      ) filter (where a.raw_id <> w.raw_id) as alternative_offers_json,
      jsonb_object_agg(a.supplier_code || ':' || a.external_id, a.raw_id::text) as source_raw_ids
    from tmp_catalog_selected_ranked a
    where a.match_key = w.match_key
      and (
        not w.group_has_local_stock
        or coalesce(a.stock_qty, 0) > 0
      )
  ) offers on true
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
    eprel_code = excluded.eprel_code,
    brand = excluded.brand,
    model = excluded.model,
    supplier_title = excluded.supplier_title,
    size_string = excluded.size_string,
    season = excluded.season,
    width_mm = excluded.width_mm,
    aspect_ratio = excluded.aspect_ratio,
    diameter_in = excluded.diameter_in,
    load_index = excluded.load_index,
    speed_rating = excluded.speed_rating,
    stock_qty = excluded.stock_qty,
    in_stock = excluded.in_stock,
    delivery_days_min = excluded.delivery_days_min,
    delivery_days_max = excluded.delivery_days_max,
    wholesale_price_eur = excluded.wholesale_price_eur,
    consumer_price_eur = excluded.consumer_price_eur,
    retail_price_eur = excluded.retail_price_eur,
    recycling_fee_eur = excluded.recycling_fee_eur,
    final_base_price_eur = excluded.final_base_price_eur,
    raw_supplier_price_ex_vat = excluded.raw_supplier_price_ex_vat,
    shipping_fee_ex_vat = excluded.shipping_fee_ex_vat,
    fair_cost_ex_vat = excluded.fair_cost_ex_vat,
    fair_cost_reason = excluded.fair_cost_reason,
    runflat = excluded.runflat,
    xl_reinforced = excluded.xl_reinforced,
    studded = excluded.studded,
    ev_ready = excluded.ev_ready,
    threepmsf = excluded.threepmsf,
    winter_approved = excluded.winter_approved,
    ice_approved = excluded.ice_approved,
    eu_fuel_class = excluded.eu_fuel_class,
    eu_wet_grip_class = excluded.eu_wet_grip_class,
    eu_noise_db = excluded.eu_noise_db,
    eu_noise_class = excluded.eu_noise_class,
    eu_label_json = excluded.eu_label_json,
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
  where product_type = 'tire'
    and is_available
    and last_rebuild_run_id is distinct from v_run_id;

  get diagnostics v_marked_unavailable_count = row_count;

  select
    count(*)::integer,
    count(*) filter (where conflict_status = 'resolved')::integer,
    count(*) filter (where conflict_status = 'needs_review')::integer
  into v_selected_count, v_resolved_count, v_needs_review_count
  from public.catalog_selected_items
  where product_type = 'tire'
    and is_available;

  v_stats := jsonb_build_object(
    'by_supplier', (
      select jsonb_object_agg(selected_supplier, supplier_count)
      from (
        select selected_supplier, count(*) as supplier_count
        from public.catalog_selected_items
        where product_type = 'tire' and is_available
        group by selected_supplier
      ) s
    ),
    'by_conflict_reason', (
      select coalesce(jsonb_object_agg(coalesce(conflict_reason, 'none'), reason_count), '{}'::jsonb)
      from (
        select conflict_reason, count(*) as reason_count
        from public.catalog_selected_items
        where product_type = 'tire' and is_available
        group by conflict_reason
      ) r
    ),
    'match_confidence', (
      select jsonb_object_agg(match_confidence, confidence_count)
      from (
        select match_confidence, count(*) as confidence_count
        from public.catalog_selected_items
        where product_type = 'tire' and is_available
        group by match_confidence
      ) c
    )
  );

  update public.catalog_selected_item_runs
  set
    status = 'success',
    finished_at = now(),
    source_rd_count = v_source_rd_count,
    source_vt_count = v_source_vt_count,
    selected_count = v_selected_count,
    resolved_count = v_resolved_count,
    needs_review_count = v_needs_review_count,
    marked_unavailable_count = v_marked_unavailable_count,
    stats = v_stats
  where id = v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id,
    'source_rd_count', v_source_rd_count,
    'source_vt_count', v_source_vt_count,
    'selected_count', v_selected_count,
    'resolved_count', v_resolved_count,
    'needs_review_count', v_needs_review_count,
    'marked_unavailable_count', v_marked_unavailable_count,
    'stats', v_stats
  );
exception
  when others then
    update public.catalog_selected_item_runs
    set
      status = 'failed',
      finished_at = now(),
      error = jsonb_build_object(
        'sqlstate', sqlstate,
        'message', sqlerrm
      )
    where id = v_run_id;
    raise;
end;
$$;

revoke all on function public.catalog_rebuild_selected_tires_v1() from public;
grant execute on function public.catalog_rebuild_selected_tires_v1() to service_role;

create or replace view public.catalog_selected_tire_conflicts as
select
  id,
  match_key,
  match_confidence,
  conflict_status,
  conflict_reason,
  selected_supplier,
  selected_external_id,
  ean,
  eprel_code,
  brand,
  model,
  size_string,
  season,
  width_mm,
  aspect_ratio,
  diameter_in,
  load_index,
  speed_rating,
  stock_qty,
  wholesale_price_eur,
  jsonb_array_length(alternative_offers_json) as alternative_offer_count,
  alternative_offers_json,
  last_selected_at
from public.catalog_selected_items
where product_type = 'tire'
  and is_available
  and conflict_status <> 'resolved';

create or replace view public.catalog_selected_tire_summary as
select
  count(*) filter (where is_available) as available_selected_items,
  count(*) filter (where is_available and conflict_status = 'resolved') as resolved_items,
  count(*) filter (where is_available and conflict_status = 'needs_review') as needs_review_items,
  count(*) filter (where is_available and selected_supplier = 'RD') as rd_winners,
  count(*) filter (where is_available and selected_supplier = 'VT') as vt_winners,
  count(*) filter (where is_available and ean is not null) as with_ean,
  count(*) filter (where is_available and eprel_code is not null) as with_eprel,
  count(*) filter (where is_available and supplier_image_id is not null) as with_supplier_image_reference,
  count(*) filter (where is_available and supplier_image_url is not null) as with_supplier_image_url,
  max(last_selected_at) as latest_selected_at
from public.catalog_selected_items
where product_type = 'tire';
