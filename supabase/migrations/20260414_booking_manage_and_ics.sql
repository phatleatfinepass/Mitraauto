alter table public.bookings
  add column if not exists updated_at timestamptz not null default timezone('utc', now()),
  add column if not exists customer_manage_token_hash text,
  add column if not exists customer_manage_token_expires_at timestamptz,
  add column if not exists customer_manage_last_used_at timestamptz,
  add column if not exists customer_action_state text not null default 'active',
  add column if not exists customer_action_email text,
  add column if not exists customer_action_revoked_at timestamptz,
  add column if not exists customer_last_action_at timestamptz,
  add column if not exists calendar_uid text,
  add column if not exists ics_sequence integer not null default 0,
  add column if not exists ics_last_sent_at timestamptz,
  add column if not exists calendar_last_sent_at timestamptz,
  add column if not exists cancellation_note text;

create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_bookings_updated_at on public.bookings;

create trigger trg_bookings_updated_at
before update on public.bookings
for each row
execute function public.set_bookings_updated_at();

create table if not exists public.booking_email_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  recipient_email text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_bookings_manage_token_hash
  on public.bookings (customer_manage_token_hash);

create unique index if not exists idx_bookings_calendar_uid
  on public.bookings (calendar_uid);

create index if not exists idx_bookings_customer_action_state
  on public.bookings (customer_action_state);

create index if not exists idx_bookings_date_time_status
  on public.bookings (booking_date, booking_time, status);

create index if not exists idx_booking_email_events_booking_id
  on public.booking_email_events (booking_id, created_at desc);
