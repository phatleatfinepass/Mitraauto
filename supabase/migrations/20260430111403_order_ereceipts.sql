create table if not exists public.ereceipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  source_type text not null check (source_type in ('order', 'booking', 'manual')),
  order_id uuid references public.orders(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  status text not null default 'issued' check (status in ('draft', 'issued', 'sent', 'void')),
  language text not null default 'fi' check (language in ('fi', 'en')),
  recipient_email text,
  customer_name text,
  customer_phone text,
  transaction_id text,
  payment_provider text,
  currency text not null default 'EUR',
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  vat_cents integer not null default 0,
  total_cents integer not null default 0,
  vat_rate numeric(5, 2) not null default 25.50,
  issued_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  voided_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ereceipts_source_reference check (
    (source_type = 'order' and order_id is not null)
    or (source_type = 'booking' and booking_id is not null)
    or (source_type = 'manual')
  )
);

create table if not exists public.ereceipt_access_tokens (
  id uuid primary key default gen_random_uuid(),
  ereceipt_id uuid not null references public.ereceipts(id) on delete cascade,
  token_hash text not null unique,
  purpose text not null default 'download' check (purpose in ('download')),
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ereceipt_events (
  id uuid primary key default gen_random_uuid(),
  ereceipt_id uuid not null references public.ereceipts(id) on delete cascade,
  event_type text not null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_ereceipts_updated_at on public.ereceipts;
create trigger trg_ereceipts_updated_at
before update on public.ereceipts
for each row
execute function public.touch_updated_at_generic();

create unique index if not exists idx_ereceipts_order_id
  on public.ereceipts (order_id)
  where source_type = 'order' and order_id is not null and status <> 'void';

create index if not exists idx_ereceipts_booking_id
  on public.ereceipts (booking_id, created_at desc);

create index if not exists idx_ereceipts_transaction_id
  on public.ereceipts (transaction_id)
  where transaction_id is not null;

create index if not exists idx_ereceipts_recipient_email
  on public.ereceipts (recipient_email, created_at desc)
  where recipient_email is not null;

create index if not exists idx_ereceipt_access_tokens_ereceipt_id
  on public.ereceipt_access_tokens (ereceipt_id, created_at desc);

create index if not exists idx_ereceipt_events_ereceipt_id
  on public.ereceipt_events (ereceipt_id, created_at desc);
