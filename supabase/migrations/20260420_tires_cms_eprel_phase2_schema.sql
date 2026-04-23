create table if not exists public.cms_tire_eprel_matches (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.catalog_tire_variants(id) on delete cascade,
  gtin_queried text not null,
  eprel_registration_number text,
  product_group text,
  match_status text not null default 'not_checked'
    check (
      match_status in (
        'not_checked',
        'matched',
        'no_match',
        'multiple_matches',
        'wrong_product_group',
        'blocked',
        'unverified',
        'error'
      )
    ),
  match_reason text,
  supplier_or_trademark text,
  commercial_name text,
  size_designation text,
  tyre_designation text,
  tyre_class text,
  load_capacity_index integer,
  speed_category_symbol text,
  fuel_efficiency_class text check (
    fuel_efficiency_class is null or fuel_efficiency_class in ('A', 'B', 'C', 'D', 'E')
  ),
  wet_grip_class text check (
    wet_grip_class is null or wet_grip_class in ('A', 'B', 'C', 'D', 'E')
  ),
  external_rolling_noise_class text check (
    external_rolling_noise_class is null or external_rolling_noise_class in ('A', 'B', 'C')
  ),
  external_rolling_noise_value integer,
  severe_snow_tyre boolean,
  ice_tyre boolean,
  eprel_source_url text,
  eprel_fiche_url text,
  fetched_at timestamptz not null default timezone('utc', now()),
  raw_payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.cms_tire_eprel_matches is
  'Raw EPREL lookup results for tire CMS enrichment. Additive only; no live catalog writeback occurs here.';

comment on column public.cms_tire_eprel_matches.variant_id is
  'catalog_tire_variants.id targeted by the EPREL lookup.';

comment on column public.cms_tire_eprel_matches.raw_payload_json is
  'Raw normalized or original EPREL response payload kept for audit/debug purposes.';

create table if not exists public.cms_tire_eprel_field_reviews (
  id uuid primary key default gen_random_uuid(),
  eprel_match_id uuid not null references public.cms_tire_eprel_matches(id) on delete cascade,
  variant_id uuid not null references public.catalog_tire_variants(id) on delete cascade,
  field_name text not null,
  current_value jsonb,
  proposed_value jsonb,
  review_status text not null default 'pending'
    check (
      review_status in (
        'pending',
        'accepted',
        'rejected',
        'kept_current'
      )
    ),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  applied_to_product boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (eprel_match_id, field_name)
);

comment on table public.cms_tire_eprel_field_reviews is
  'Field-level review decisions for EPREL proposals before any approved value is copied into live CMS fields.';

comment on column public.cms_tire_eprel_field_reviews.current_value is
  'Current live CMS value captured at review time.';

comment on column public.cms_tire_eprel_field_reviews.proposed_value is
  'EPREL-sourced candidate value pending approval.';

grant select, insert, update on table public.cms_tire_eprel_matches to authenticated;
grant select, insert, update on table public.cms_tire_eprel_field_reviews to authenticated;

alter table public.cms_tire_eprel_matches enable row level security;
alter table public.cms_tire_eprel_field_reviews enable row level security;

drop policy if exists "Tire EPREL matches admin read" on public.cms_tire_eprel_matches;
create policy "Tire EPREL matches admin read"
on public.cms_tire_eprel_matches
for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Tire EPREL matches admin insert" on public.cms_tire_eprel_matches;
create policy "Tire EPREL matches admin insert"
on public.cms_tire_eprel_matches
for insert
to authenticated
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Tire EPREL matches admin update" on public.cms_tire_eprel_matches;
create policy "Tire EPREL matches admin update"
on public.cms_tire_eprel_matches
for update
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Tire EPREL field reviews admin read" on public.cms_tire_eprel_field_reviews;
create policy "Tire EPREL field reviews admin read"
on public.cms_tire_eprel_field_reviews
for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Tire EPREL field reviews admin insert" on public.cms_tire_eprel_field_reviews;
create policy "Tire EPREL field reviews admin insert"
on public.cms_tire_eprel_field_reviews
for insert
to authenticated
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Tire EPREL field reviews admin update" on public.cms_tire_eprel_field_reviews;
create policy "Tire EPREL field reviews admin update"
on public.cms_tire_eprel_field_reviews
for update
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create index if not exists cms_tire_eprel_matches_variant_id_idx
  on public.cms_tire_eprel_matches (variant_id, fetched_at desc);

create index if not exists cms_tire_eprel_matches_registration_idx
  on public.cms_tire_eprel_matches (eprel_registration_number);

create index if not exists cms_tire_eprel_matches_status_idx
  on public.cms_tire_eprel_matches (match_status);

create index if not exists cms_tire_eprel_field_reviews_variant_id_idx
  on public.cms_tire_eprel_field_reviews (variant_id, created_at desc);

create index if not exists cms_tire_eprel_field_reviews_status_idx
  on public.cms_tire_eprel_field_reviews (review_status);

create index if not exists cms_tire_eprel_field_reviews_match_id_idx
  on public.cms_tire_eprel_field_reviews (eprel_match_id);

drop trigger if exists trg_cms_tire_eprel_matches_updated_at on public.cms_tire_eprel_matches;
create trigger trg_cms_tire_eprel_matches_updated_at
before update on public.cms_tire_eprel_matches
for each row
execute function public.touch_updated_at_generic();

drop trigger if exists trg_cms_tire_eprel_field_reviews_updated_at on public.cms_tire_eprel_field_reviews;
create trigger trg_cms_tire_eprel_field_reviews_updated_at
before update on public.cms_tire_eprel_field_reviews
for each row
execute function public.touch_updated_at_generic();
