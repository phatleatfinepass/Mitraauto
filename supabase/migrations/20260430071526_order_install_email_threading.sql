create table if not exists public.order_install_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  token_hash text not null unique,
  customer_email text,
  expires_at timestamptz not null,
  used_booking_id uuid references public.bookings(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_install_tokens_order_id
  on public.order_install_tokens (order_id, created_at desc);

create index if not exists idx_order_install_tokens_expires_at
  on public.order_install_tokens (expires_at);

create table if not exists public.order_email_threads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
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

create table if not exists public.order_email_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.order_email_threads(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
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

drop trigger if exists trg_order_email_threads_updated_at on public.order_email_threads;
create trigger trg_order_email_threads_updated_at
before update on public.order_email_threads
for each row
execute function public.touch_updated_at_generic();

create unique index if not exists idx_order_email_threads_provider_thread
  on public.order_email_threads (provider, mailbox_email, provider_thread_id)
  where provider_thread_id is not null;

create index if not exists idx_order_email_threads_order_id
  on public.order_email_threads (order_id, created_at desc);

create unique index if not exists idx_order_email_messages_provider_message
  on public.order_email_messages (provider, mailbox_email, provider_message_id)
  where provider_message_id is not null;

create index if not exists idx_order_email_messages_order_id
  on public.order_email_messages (order_id, created_at desc);

create index if not exists idx_order_email_messages_thread_id
  on public.order_email_messages (thread_id, created_at desc);
