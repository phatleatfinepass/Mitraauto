-- Canonical invoice/receipt foundation.
-- Keep legacy public.ereceipts working; this model is the future source for CMS invoices,
-- receipts, credit notes, exports, and optional Finvoice XML generation.

create table if not exists public.invoice_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique default 'default',
  display_name text not null default 'Default',
  company_name text not null default 'Mitra Auto Oy',
  business_id text not null default '3408833-8',
  vat_id text not null default 'FI34088338',
  address_line1 text not null default 'Hankasuontie 5',
  address_line2 text not null default '00390 HELSINKI',
  country_code text not null default 'FI',
  email text not null default 'contact@mitra-auto.fi',
  phone text not null default '0407777163',
  iban text,
  bic text,
  payment_terms text,
  footer_text text,
  is_default boolean not null default false,
  valid_from timestamptz not null default timezone('utc', now()),
  valid_to timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_invoice_templates_one_default
  on public.invoice_templates (is_default)
  where is_default;

insert into public.invoice_templates (
  template_key,
  display_name,
  company_name,
  business_id,
  vat_id,
  address_line1,
  address_line2,
  country_code,
  email,
  phone,
  is_default
) values (
  'default',
  'Default',
  'Mitra Auto Oy',
  '3408833-8',
  'FI34088338',
  'Hankasuontie 5',
  '00390 HELSINKI',
  'FI',
  'contact@mitra-auto.fi',
  '0407777163',
  true
) on conflict (template_key) do nothing;

create table if not exists public.invoice_documents (
  id uuid primary key default gen_random_uuid(),
  document_number text not null unique,
  document_type text not null default 'receipt' check (
    document_type in ('receipt', 'invoice', 'credit_note', 'refund_receipt', 'proforma')
  ),
  source_type text not null default 'manual' check (source_type in ('order', 'booking', 'manual', 'legacy_ereceipt')),
  order_id uuid references public.orders(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  legacy_ereceipt_id uuid references public.ereceipts(id) on delete set null,
  status text not null default 'draft' check (
    status in ('draft', 'issued', 'sent', 'paid', 'partially_paid', 'credited', 'void', 'cancelled')
  ),
  language text not null default 'fi' check (language in ('fi', 'en')),
  currency text not null default 'EUR',
  template_id uuid references public.invoice_templates(id) on delete set null,
  issue_date date not null default current_date,
  due_date date,
  paid_at timestamptz,
  sent_at timestamptz,
  voided_at timestamptz,
  original_document_id uuid references public.invoice_documents(id) on delete set null,
  original_document_number text,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  shipping_cents integer not null default 0,
  vat_cents integer not null default 0,
  total_cents integer not null default 0,
  paid_cents integer not null default 0,
  balance_cents integer generated always as (greatest(total_cents - paid_cents, 0)) stored,
  finvoice_ready boolean not null default false,
  finvoice_validation_status text check (finvoice_validation_status in ('not_checked', 'valid', 'invalid', 'blocked')),
  notes text,
  internal_notes text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint invoice_documents_source_reference check (
    (source_type = 'order' and order_id is not null)
    or (source_type = 'booking' and booking_id is not null)
    or (source_type = 'legacy_ereceipt' and legacy_ereceipt_id is not null)
    or (source_type = 'manual')
  )
);

create index if not exists idx_invoice_documents_created_at
  on public.invoice_documents (created_at desc);
create index if not exists idx_invoice_documents_status
  on public.invoice_documents (status, created_at desc);
create index if not exists idx_invoice_documents_source
  on public.invoice_documents (source_type, order_id, booking_id, legacy_ereceipt_id);
create index if not exists idx_invoice_documents_original
  on public.invoice_documents (original_document_id)
  where original_document_id is not null;

create table if not exists public.invoice_parties (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  role text not null check (role in ('seller', 'buyer', 'payer', 'delivery')),
  name text not null,
  business_id text,
  vat_id text,
  contact_name text,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country_code text not null default 'FI',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (document_id, role)
);

create index if not exists idx_invoice_parties_document_id
  on public.invoice_parties (document_id);
create index if not exists idx_invoice_parties_email
  on public.invoice_parties (email)
  where email is not null;

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  line_number integer not null default 1,
  item_type text not null default 'service' check (item_type in ('product', 'service', 'shipping', 'discount', 'fee', 'note')),
  title text not null,
  description text,
  sku text,
  ean text,
  product_id uuid,
  quantity numeric(12, 3) not null default 1,
  unit_label text not null default 'kpl',
  unit_price_excl_vat_cents integer not null default 0,
  unit_price_incl_vat_cents integer not null default 0,
  vat_rate numeric(5, 2) not null default 25.50,
  vat_code text not null default 'S',
  vat_exemption_reason text,
  discount_cents integer not null default 0,
  line_vat_excl_cents integer not null default 0,
  line_vat_cents integer not null default 0,
  line_total_cents integer not null default 0,
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (document_id, line_number)
);

create index if not exists idx_invoice_lines_document_id
  on public.invoice_lines (document_id, line_number);
create index if not exists idx_invoice_lines_ean
  on public.invoice_lines (ean)
  where ean is not null;

create table if not exists public.invoice_vat_breakdowns (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  vat_rate numeric(5, 2) not null,
  vat_code text not null default 'S',
  vat_exemption_reason text,
  base_cents integer not null default 0,
  vat_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (document_id, vat_rate, vat_code)
);

create index if not exists idx_invoice_vat_breakdowns_document_id
  on public.invoice_vat_breakdowns (document_id);

create table if not exists public.invoice_payment_details (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.invoice_documents(id) on delete cascade,
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'pending', 'paid', 'partially_paid', 'failed', 'refunded', 'cancelled')
  ),
  payment_provider text,
  payment_method text,
  transaction_id text,
  reference_number text,
  iban text,
  bic text,
  terms text,
  due_date date,
  paid_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_invoice_payment_details_transaction
  on public.invoice_payment_details (transaction_id)
  where transaction_id is not null;
create index if not exists idx_invoice_payment_details_reference
  on public.invoice_payment_details (reference_number)
  where reference_number is not null;

create table if not exists public.invoice_exports (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  export_type text not null check (export_type in ('html', 'pdf', 'finvoice_xml', 'json')),
  status text not null default 'generated' check (status in ('queued', 'generated', 'sent', 'failed', 'void')),
  storage_bucket text,
  storage_path text,
  public_url text,
  checksum_sha256 text,
  content_type text,
  file_size_bytes integer,
  export_version text,
  validation_status text check (validation_status in ('not_checked', 'valid', 'invalid')),
  validation_errors jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_invoice_exports_document_type
  on public.invoice_exports (document_id, export_type, created_at desc);
create index if not exists idx_invoice_exports_checksum
  on public.invoice_exports (checksum_sha256)
  where checksum_sha256 is not null;

create table if not exists public.invoice_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_invoice_events_document_id
  on public.invoice_events (document_id, created_at desc);

create or replace view public.invoice_document_summaries
with (security_invoker = true)
as
select
  d.id,
  d.document_number,
  d.document_type,
  d.source_type,
  d.order_id,
  d.booking_id,
  d.legacy_ereceipt_id,
  d.status,
  d.language,
  d.currency,
  d.issue_date,
  d.due_date,
  d.sent_at,
  d.paid_at,
  d.subtotal_cents,
  d.shipping_cents,
  d.vat_cents,
  d.total_cents,
  d.paid_cents,
  d.balance_cents,
  buyer.name as customer_name,
  buyer.email as customer_email,
  buyer.phone as customer_phone,
  p.payment_status,
  p.payment_provider,
  p.transaction_id,
  d.created_at,
  d.updated_at
from public.invoice_documents d
left join public.invoice_parties buyer
  on buyer.document_id = d.id
 and buyer.role = 'buyer'
left join public.invoice_payment_details p
  on p.document_id = d.id;

drop trigger if exists trg_invoice_templates_updated_at on public.invoice_templates;
create trigger trg_invoice_templates_updated_at
before update on public.invoice_templates
for each row execute function public.touch_updated_at_generic();

drop trigger if exists trg_invoice_documents_updated_at on public.invoice_documents;
create trigger trg_invoice_documents_updated_at
before update on public.invoice_documents
for each row execute function public.touch_updated_at_generic();

drop trigger if exists trg_invoice_parties_updated_at on public.invoice_parties;
create trigger trg_invoice_parties_updated_at
before update on public.invoice_parties
for each row execute function public.touch_updated_at_generic();

drop trigger if exists trg_invoice_lines_updated_at on public.invoice_lines;
create trigger trg_invoice_lines_updated_at
before update on public.invoice_lines
for each row execute function public.touch_updated_at_generic();

drop trigger if exists trg_invoice_payment_details_updated_at on public.invoice_payment_details;
create trigger trg_invoice_payment_details_updated_at
before update on public.invoice_payment_details
for each row execute function public.touch_updated_at_generic();

-- Backfill a canonical document for existing legacy e-receipts without changing legacy behavior.
insert into public.invoice_documents (
  document_number,
  document_type,
  source_type,
  order_id,
  booking_id,
  legacy_ereceipt_id,
  status,
  language,
  currency,
  issue_date,
  sent_at,
  subtotal_cents,
  shipping_cents,
  vat_cents,
  total_cents,
  paid_cents,
  payload,
  created_at,
  updated_at
)
select
  e.receipt_number,
  case
    when e.payload ->> 'document_type' in ('invoice', 'credit_note', 'refund_receipt', 'proforma')
      then e.payload ->> 'document_type'
    else 'receipt'
  end,
  'legacy_ereceipt',
  e.order_id,
  e.booking_id,
  e.id,
  case
    when e.status = 'void' then 'void'
    when e.status = 'sent' then 'sent'
    when e.status = 'issued' then 'issued'
    else 'draft'
  end,
  e.language,
  e.currency,
  (e.issued_at at time zone 'utc')::date,
  e.sent_at,
  e.subtotal_cents,
  e.shipping_cents,
  e.vat_cents,
  e.total_cents,
  case when e.status in ('issued', 'sent') then e.total_cents else 0 end,
  jsonb_build_object('legacy_ereceipt', e.payload),
  e.created_at,
  e.updated_at
from public.ereceipts e
where not exists (
  select 1
  from public.invoice_documents d
  where d.legacy_ereceipt_id = e.id
);

insert into public.invoice_parties (
  document_id,
  role,
  name,
  business_id,
  vat_id,
  email,
  phone,
  address_line1,
  address_line2,
  country_code
)
select
  d.id,
  'seller',
  t.company_name,
  t.business_id,
  t.vat_id,
  t.email,
  t.phone,
  t.address_line1,
  t.address_line2,
  t.country_code
from public.invoice_documents d
cross join lateral (
  select *
  from public.invoice_templates
  where is_default
  order by created_at desc
  limit 1
) t
where not exists (
  select 1 from public.invoice_parties p where p.document_id = d.id and p.role = 'seller'
);

insert into public.invoice_parties (
  document_id,
  role,
  name,
  email,
  phone,
  country_code
)
select
  d.id,
  'buyer',
  coalesce(nullif(e.customer_name, ''), 'Customer'),
  nullif(e.recipient_email, ''),
  nullif(e.customer_phone, ''),
  'FI'
from public.invoice_documents d
join public.ereceipts e on e.id = d.legacy_ereceipt_id
where not exists (
  select 1 from public.invoice_parties p where p.document_id = d.id and p.role = 'buyer'
);

insert into public.invoice_payment_details (
  document_id,
  payment_status,
  payment_provider,
  transaction_id,
  due_date,
  paid_at,
  payload
)
select
  d.id,
  case when d.status in ('issued', 'sent', 'paid') and d.total_cents > 0 then 'paid' else 'unpaid' end,
  e.payment_provider,
  e.transaction_id,
  d.due_date,
  d.paid_at,
  jsonb_build_object('legacy_ereceipt_id', e.id)
from public.invoice_documents d
join public.ereceipts e on e.id = d.legacy_ereceipt_id
where not exists (
  select 1 from public.invoice_payment_details p where p.document_id = d.id
);

insert into public.invoice_lines (
  document_id,
  line_number,
  item_type,
  title,
  description,
  sku,
  ean,
  quantity,
  unit_label,
  unit_price_incl_vat_cents,
  vat_rate,
  line_vat_excl_cents,
  line_vat_cents,
  line_total_cents,
  source_payload
)
select
  d.id,
  item.ordinality::integer,
  case when item.value ->> 'sku' = 'shipping' then 'shipping' else 'product' end,
  coalesce(nullif(item.value ->> 'title', ''), nullif(item.value ->> 'description', ''), 'Item'),
  nullif(concat_ws(' ', nullif(item.value ->> 'brand', ''), nullif(item.value ->> 'size', '')), ''),
  nullif(item.value ->> 'sku', ''),
  nullif(item.value ->> 'ean', ''),
  coalesce(nullif(item.value ->> 'quantity', '')::numeric, 1),
  coalesce(nullif(item.value ->> 'unit_label', ''), 'kpl'),
  coalesce(nullif(item.value ->> 'unit_cents', '')::integer, 0),
  coalesce(nullif(item.value ->> 'vat_rate', '')::numeric, 25.50),
  greatest(coalesce(nullif(item.value ->> 'line_total_cents', '')::integer, 0) - coalesce(nullif(item.value ->> 'vat_cents', '')::integer, 0), 0),
  coalesce(nullif(item.value ->> 'vat_cents', '')::integer, 0),
  coalesce(nullif(item.value ->> 'line_total_cents', '')::integer, 0),
  item.value
from public.invoice_documents d
join public.ereceipts e on e.id = d.legacy_ereceipt_id
cross join lateral jsonb_array_elements(coalesce(e.payload -> 'items', '[]'::jsonb)) with ordinality as item(value, ordinality)
where not exists (
  select 1 from public.invoice_lines l where l.document_id = d.id
);

insert into public.invoice_vat_breakdowns (
  document_id,
  vat_rate,
  vat_code,
  base_cents,
  vat_cents,
  total_cents
)
select
  d.id,
  coalesce(nullif(l.vat_rate, 0), 25.50),
  coalesce(nullif(l.vat_code, ''), 'S'),
  sum(l.line_vat_excl_cents)::integer,
  sum(l.line_vat_cents)::integer,
  sum(l.line_total_cents)::integer
from public.invoice_documents d
join public.invoice_lines l on l.document_id = d.id
where not exists (
  select 1 from public.invoice_vat_breakdowns v where v.document_id = d.id
)
group by d.id, coalesce(nullif(l.vat_rate, 0), 25.50), coalesce(nullif(l.vat_code, ''), 'S');

alter table public.invoice_templates enable row level security;
alter table public.invoice_documents enable row level security;
alter table public.invoice_parties enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.invoice_vat_breakdowns enable row level security;
alter table public.invoice_payment_details enable row level security;
alter table public.invoice_exports enable row level security;
alter table public.invoice_events enable row level security;

grant select, insert, update on table public.invoice_templates to authenticated, service_role;
grant select, insert, update on table public.invoice_documents to authenticated, service_role;
grant select, insert, update on table public.invoice_parties to authenticated, service_role;
grant select, insert, update, delete on table public.invoice_lines to authenticated, service_role;
grant select, insert, update, delete on table public.invoice_vat_breakdowns to authenticated, service_role;
grant select, insert, update on table public.invoice_payment_details to authenticated, service_role;
grant select, insert, update on table public.invoice_exports to authenticated, service_role;
grant select, insert on table public.invoice_events to authenticated, service_role;
grant select on public.invoice_document_summaries to authenticated, service_role;

drop policy if exists "Invoice templates admin read" on public.invoice_templates;
create policy "Invoice templates admin read"
on public.invoice_templates for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
);

drop policy if exists "Invoice templates admin write" on public.invoice_templates;
create policy "Invoice templates admin write"
on public.invoice_templates for all
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
)
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
);

drop policy if exists "Invoice documents admin read" on public.invoice_documents;
create policy "Invoice documents admin read"
on public.invoice_documents for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
);

drop policy if exists "Invoice documents admin write" on public.invoice_documents;
create policy "Invoice documents admin write"
on public.invoice_documents for all
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
)
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
);

drop policy if exists "Invoice child tables admin read" on public.invoice_parties;
create policy "Invoice child tables admin read"
on public.invoice_parties for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice parties admin write" on public.invoice_parties;
create policy "Invoice parties admin write"
on public.invoice_parties for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice lines admin read" on public.invoice_lines;
create policy "Invoice lines admin read"
on public.invoice_lines for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice lines admin write" on public.invoice_lines;
create policy "Invoice lines admin write"
on public.invoice_lines for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice vat admin read" on public.invoice_vat_breakdowns;
create policy "Invoice vat admin read"
on public.invoice_vat_breakdowns for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice vat admin write" on public.invoice_vat_breakdowns;
create policy "Invoice vat admin write"
on public.invoice_vat_breakdowns for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice payment admin read" on public.invoice_payment_details;
create policy "Invoice payment admin read"
on public.invoice_payment_details for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice payment admin write" on public.invoice_payment_details;
create policy "Invoice payment admin write"
on public.invoice_payment_details for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice exports admin read" on public.invoice_exports;
create policy "Invoice exports admin read"
on public.invoice_exports for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice exports admin write" on public.invoice_exports;
create policy "Invoice exports admin write"
on public.invoice_exports for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice events admin read" on public.invoice_events;
create policy "Invoice events admin read"
on public.invoice_events for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice events admin insert" on public.invoice_events;
create policy "Invoice events admin insert"
on public.invoice_events for insert
to authenticated
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));
