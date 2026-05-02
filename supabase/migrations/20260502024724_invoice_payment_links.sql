create table if not exists public.invoice_payment_access_tokens (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_invoice_payment_access_tokens_document
  on public.invoice_payment_access_tokens (document_id, created_at desc);

create table if not exists public.invoice_payment_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  payment_status text not null default 'created' check (
    payment_status in ('created', 'pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded')
  ),
  payment_provider text not null default 'paytrail',
  payment_link_url text,
  payment_link_created_at timestamptz not null default timezone('utc', now()),
  payment_link_expires_at timestamptz,
  paytrail_transaction_id text,
  paytrail_reference text,
  paytrail_stamp text,
  paytrail_provider text,
  amount_cents integer not null default 0,
  currency text not null default 'EUR',
  paid_at timestamptz,
  last_reminder_sent_at timestamptz,
  reminder_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_invoice_payment_links_document
  on public.invoice_payment_links (document_id, created_at desc);
create index if not exists idx_invoice_payment_links_transaction
  on public.invoice_payment_links (paytrail_transaction_id)
  where paytrail_transaction_id is not null;
create index if not exists idx_invoice_payment_links_reference
  on public.invoice_payment_links (paytrail_reference)
  where paytrail_reference is not null;
create index if not exists idx_invoice_payment_links_active
  on public.invoice_payment_links (document_id, payment_status, payment_link_expires_at desc)
  where payment_status in ('created', 'pending');

drop trigger if exists trg_invoice_payment_links_updated_at on public.invoice_payment_links;
create trigger trg_invoice_payment_links_updated_at
before update on public.invoice_payment_links
for each row execute function public.touch_updated_at_generic();

alter table public.invoice_payment_access_tokens enable row level security;
alter table public.invoice_payment_links enable row level security;

grant select, insert, update on table public.invoice_payment_access_tokens to authenticated, service_role;
grant select, insert, update on table public.invoice_payment_links to authenticated, service_role;

drop policy if exists "Invoice payment tokens admin read" on public.invoice_payment_access_tokens;
create policy "Invoice payment tokens admin read"
on public.invoice_payment_access_tokens for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice payment tokens admin write" on public.invoice_payment_access_tokens;
create policy "Invoice payment tokens admin write"
on public.invoice_payment_access_tokens for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice payment links admin read" on public.invoice_payment_links;
create policy "Invoice payment links admin read"
on public.invoice_payment_links for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice payment links admin write" on public.invoice_payment_links;
create policy "Invoice payment links admin write"
on public.invoice_payment_links for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));
