-- Phase 2: precompute public tire storefront filter options.
-- This keeps the storefront from deriving option lists during browsing.

create table if not exists public.webshop_tire_filter_options (
  option_group text not null,
  option_value text not null,
  label text not null,
  item_count integer not null default 0,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (option_group, option_value)
);

alter table public.webshop_tire_filter_options enable row level security;

drop policy if exists "Public can read tire filter options" on public.webshop_tire_filter_options;
create policy "Public can read tire filter options"
  on public.webshop_tire_filter_options
  for select
  to anon, authenticated
  using (true);

grant select on public.webshop_tire_filter_options to anon, authenticated;
grant select, insert, update, delete on public.webshop_tire_filter_options to service_role;

create or replace function public.refresh_webshop_tire_filter_options_v1()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  delete from public.webshop_tire_filter_options;

  with tire_ready as (
    select *
    from public.webshop_items w
    where w.product_type = 'tire'
      and w.is_visible = true
      and w.publish_status = 'published'
      and coalesce(w.product_ready, false) = true
  ),
  option_rows as (
    select
      'width'::text as option_group,
      width_mm::text as option_value,
      trim(to_char(width_mm, 'FM999999990D999')) as label,
      count(*)::integer as item_count,
      width_mm::integer as sort_order,
      '{}'::jsonb as metadata
    from tire_ready
    where width_mm is not null
    group by width_mm

    union all

    select
      'aspect_ratio',
      aspect_ratio::text,
      trim(to_char(aspect_ratio, 'FM999999990D999')),
      count(*)::integer,
      aspect_ratio::integer,
      '{}'::jsonb
    from tire_ready
    where aspect_ratio is not null
    group by aspect_ratio

    union all

    select
      'diameter',
      diameter_in::text,
      trim(to_char(diameter_in, 'FM999999990D999')),
      count(*)::integer,
      diameter_in::integer,
      '{}'::jsonb
    from tire_ready
    where diameter_in is not null
    group by diameter_in

    union all

    select
      'season',
      season,
      case season
        when 'summer' then 'Summer'
        when 'winter' then 'Winter'
        when 'all_season' then 'All Season'
        else initcap(replace(season, '_', ' '))
      end,
      count(*)::integer,
      case season when 'summer' then 10 when 'winter' then 20 when 'all_season' then 30 else 90 end,
      '{}'::jsonb
    from tire_ready
    where nullif(btrim(coalesce(season, '')), '') is not null
    group by season

    union all

    select
      'brand',
      coalesce(nullif(btrim(brand_display_name), ''), brand),
      coalesce(nullif(btrim(brand_display_name), ''), brand),
      count(*)::integer,
      dense_rank() over (order by lower(coalesce(nullif(btrim(brand_display_name), ''), brand)))::integer,
      jsonb_build_object('brand', min(brand))
    from tire_ready
    where nullif(btrim(coalesce(brand_display_name, brand, '')), '') is not null
    group by coalesce(nullif(btrim(brand_display_name), ''), brand)

    union all

    select
      'vehicle_type',
      tire_segment,
      case tire_segment
        when 'passenger' then 'Passenger car'
        when 'van_c' then 'Van / C'
        when 'suv_4x4' then 'SUV / 4x4'
        else initcap(replace(tire_segment, '_', ' '))
      end,
      count(*)::integer,
      case tire_segment when 'passenger' then 10 when 'van_c' then 20 when 'suv_4x4' then 30 else 90 end,
      '{}'::jsonb
    from tire_ready
    where tire_segment in ('passenger', 'van_c', 'suv_4x4')
    group by tire_segment

    union all

    select 'feature', 'runflat', 'RunFlat', count(*)::integer, 10, '{}'::jsonb
    from tire_ready
    where coalesce(runflat, false) = true

    union all

    select 'feature', 'xl', 'XL', count(*)::integer, 20, '{}'::jsonb
    from tire_ready
    where coalesce(xl_reinforced, false) = true

    union all

    select 'feature', 'studded', 'Studded', count(*)::integer, 30, '{}'::jsonb
    from tire_ready
    where coalesce(studded, false) = true

    union all

    select 'feature', 'electric_car', 'Electric car', count(*)::integer, 40, '{}'::jsonb
    from tire_ready
    where public.webshop_tire_is_ev_ready(tire_ready)

    union all

    select 'feature', 'sound_absorber', 'Sound absorber', count(*)::integer, 50, '{}'::jsonb
    from tire_ready
    where public.webshop_tire_has_sound_absorber(tire_ready)

    union all

    select 'feature', 'retreaded', 'Retreaded', count(*)::integer, 60, '{}'::jsonb
    from tire_ready
    where public.webshop_tire_is_retreaded(tire_ready)

    union all

    select 'stock', 'in_stock', 'In stock', count(*)::integer, 10, '{}'::jsonb
    from tire_ready
    where coalesce(in_stock, false) = true

    union all

    select
      'eu_wet',
      upper(eu_wet),
      upper(eu_wet),
      count(*)::integer,
      ascii(upper(eu_wet)),
      '{}'::jsonb
    from tire_ready
    where upper(nullif(btrim(coalesce(eu_wet, '')), '')) ~ '^[A-E]$'
    group by upper(eu_wet)

    union all

    select
      'eu_noise',
      eu_noise::integer::text,
      eu_noise::integer::text || ' dB',
      count(*)::integer,
      eu_noise::integer,
      '{}'::jsonb
    from tire_ready
    where eu_noise is not null
    group by eu_noise::integer
  )
  insert into public.webshop_tire_filter_options (
    option_group,
    option_value,
    label,
    item_count,
    sort_order,
    metadata,
    updated_at
  )
  select
    option_group,
    option_value,
    label,
    item_count,
    sort_order,
    metadata,
    now()
  from option_rows
  where item_count > 0;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.refresh_webshop_tire_filter_options_v1() from public;
grant execute on function public.refresh_webshop_tire_filter_options_v1() to service_role;

create or replace function public.catalog_list_tire_filter_options_v1()
returns table (
  option_group text,
  option_value text,
  label text,
  item_count integer,
  sort_order integer,
  metadata jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    option_group,
    option_value,
    label,
    item_count,
    sort_order,
    metadata,
    updated_at
  from public.webshop_tire_filter_options
  order by option_group asc, sort_order asc, lower(label) asc;
$$;

revoke all on function public.catalog_list_tire_filter_options_v1() from public;
grant execute on function public.catalog_list_tire_filter_options_v1() to anon, authenticated;

select public.refresh_webshop_tire_filter_options_v1();
