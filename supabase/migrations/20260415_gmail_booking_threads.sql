create table if not exists public.booking_email_threads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'gmail',
  mailbox_email text not null,
  provider_thread_id text,
  subject text,
  status text not null default 'active',
  history_id text,
  last_message_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.booking_email_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.booking_email_threads(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'gmail',
  direction text not null,
  mailbox_email text not null,
  provider_message_id text,
  provider_thread_id text,
  message_id_header text,
  in_reply_to text,
  references_header text,
  from_email text,
  to_email text,
  subject text,
  snippet text,
  body_text text,
  body_html text,
  sent_at timestamptz,
  received_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gmail_sync_state (
  mailbox_email text primary key,
  provider text not null default 'gmail',
  google_email text,
  access_token text,
  refresh_token text,
  token_scope text,
  token_type text,
  token_expiry timestamptz,
  history_id text,
  watch_expiration timestamptz,
  pubsub_topic text,
  last_sync_at timestamptz,
  last_error text,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gmail_oauth_states (
  state text primary key,
  mailbox_email text not null,
  redirect_to text,
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create or replace function public.touch_updated_at_generic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_booking_email_threads_updated_at on public.booking_email_threads;
create trigger trg_booking_email_threads_updated_at
before update on public.booking_email_threads
for each row
execute function public.touch_updated_at_generic();

drop trigger if exists trg_gmail_sync_state_updated_at on public.gmail_sync_state;
create trigger trg_gmail_sync_state_updated_at
before update on public.gmail_sync_state
for each row
execute function public.touch_updated_at_generic();

create unique index if not exists idx_booking_email_threads_provider_thread
  on public.booking_email_threads (provider, mailbox_email, provider_thread_id)
  where provider_thread_id is not null;

create index if not exists idx_booking_email_threads_booking_id
  on public.booking_email_threads (booking_id, created_at desc);

create unique index if not exists idx_booking_email_messages_provider_message
  on public.booking_email_messages (provider, mailbox_email, provider_message_id)
  where provider_message_id is not null;

create index if not exists idx_booking_email_messages_booking_id
  on public.booking_email_messages (booking_id, created_at desc);

create index if not exists idx_booking_email_messages_thread_id
  on public.booking_email_messages (thread_id, created_at desc);

create index if not exists idx_gmail_oauth_states_expires_at
  on public.gmail_oauth_states (expires_at);
