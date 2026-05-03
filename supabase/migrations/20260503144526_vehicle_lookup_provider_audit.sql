create table if not exists public.vehicle_lookup_provider_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  plate_hash text null,
  normalized_plate_hint text null,
  vin text null,
  provider text not null default 'carsxe',
  endpoint_name text not null,
  endpoint_url text not null,
  http_status integer null,
  success boolean not null default false,
  error_message text null,
  called_at timestamptz not null default now(),
  duration_ms integer null,
  cache_hit boolean not null default false
);

comment on table public.vehicle_lookup_provider_audit is
  'Server-side audit of external vehicle provider calls. No raw license plates or API keys are stored.';
comment on column public.vehicle_lookup_provider_audit.request_id is
  'Generated per vehicle_lookup invocation to correlate endpoint calls.';
comment on column public.vehicle_lookup_provider_audit.plate_hash is
  'Same HMAC-SHA256 lookup key used by vehicle_lookup_cache; not reversible without the secret.';
comment on column public.vehicle_lookup_provider_audit.endpoint_url is
  'Sanitized provider URL without API key query values.';

create index if not exists vehicle_lookup_provider_audit_plate_hash_idx
  on public.vehicle_lookup_provider_audit (plate_hash, called_at desc);

create index if not exists vehicle_lookup_provider_audit_vin_idx
  on public.vehicle_lookup_provider_audit (vin, called_at desc);

create index if not exists vehicle_lookup_provider_audit_request_idx
  on public.vehicle_lookup_provider_audit (request_id, called_at);

alter table public.vehicle_lookup_provider_audit enable row level security;

revoke all on table public.vehicle_lookup_provider_audit from anon;
revoke all on table public.vehicle_lookup_provider_audit from authenticated;
