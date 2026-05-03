create table if not exists public.vehicle_lookup_cache (
  id uuid primary key default gen_random_uuid(),
  plate_hash text not null unique,
  normalized_plate_hint text null,
  vin text null,
  vehicle jsonb not null,
  provider text not null default 'carsxe',
  country text not null default 'FI',
  source_version text not null default 'vehicle_lookup:v1',
  lookup_count integer not null default 1 check (lookup_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  provider_fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '180 days'),
  deleted_at timestamptz null,
  gdpr_basis text not null default 'legitimate_interest_cache'
);

comment on table public.vehicle_lookup_cache is
  'Server-side vehicle lookup cache. License plates are looked up by HMAC hash; raw plates are not stored.';
comment on column public.vehicle_lookup_cache.plate_hash is
  'HMAC-SHA256 of normalized plate using VEHICLE_LOOKUP_CACHE_PEPPER. Not reversible without the secret.';
comment on column public.vehicle_lookup_cache.normalized_plate_hint is
  'Non-identifying format hint only, for example ***-140. Do not store the full plate here.';
comment on column public.vehicle_lookup_cache.vehicle is
  'Cached normalized CarsXE vehicle/spec payload. Contains VIN/specification data and must remain server-side.';
comment on column public.vehicle_lookup_cache.expires_at is
  'Retention deadline. The Edge Function ignores expired rows and refreshes from provider.';
comment on column public.vehicle_lookup_cache.gdpr_basis is
  'Processing basis label used for retention/audit documentation.';

create index if not exists vehicle_lookup_cache_active_lookup_idx
  on public.vehicle_lookup_cache (plate_hash, expires_at)
  where deleted_at is null;

create index if not exists vehicle_lookup_cache_retention_idx
  on public.vehicle_lookup_cache (expires_at)
  where deleted_at is null;

alter table public.vehicle_lookup_cache enable row level security;

revoke all on table public.vehicle_lookup_cache from anon;
revoke all on table public.vehicle_lookup_cache from authenticated;

create schema if not exists private;

create or replace function private.purge_expired_vehicle_lookup_cache()
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  deleted_count integer;
begin
  delete from public.vehicle_lookup_cache
  where expires_at < now()
     or deleted_at is not null;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on schema private from public;
revoke all on function private.purge_expired_vehicle_lookup_cache() from public;
revoke all on function private.purge_expired_vehicle_lookup_cache() from anon;
revoke all on function private.purge_expired_vehicle_lookup_cache() from authenticated;
