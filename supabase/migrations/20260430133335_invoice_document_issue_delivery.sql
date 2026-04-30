-- Issue/send/download foundation for canonical invoice documents.
-- Drafts can be edited freely. Issued documents get final numbering, immutable export records,
-- access tokens, and enough metadata for Finnish simplified/full invoice validation.

alter table public.invoice_documents
  add column if not exists supply_date date,
  add column if not exists validation_tier text not null default 'unchecked'
    check (validation_tier in ('unchecked', 'simplified_ok', 'full_required', 'full_ok', 'blocked')),
  add column if not exists validation_errors jsonb not null default '[]'::jsonb,
  add column if not exists issued_export_id uuid,
  add column if not exists issued_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'invoice_documents_issued_export_fk'
  ) then
    alter table public.invoice_documents
      add constraint invoice_documents_issued_export_fk
      foreign key (issued_export_id)
      references public.invoice_exports(id)
      on delete set null
      deferrable initially deferred;
  end if;
end $$;

create sequence if not exists public.invoice_document_final_number_seq;

create or replace function public.next_invoice_document_number(prefix text default 'MA')
returns text
language plpgsql
as $$
declare
  next_value bigint;
begin
  next_value := nextval('public.invoice_document_final_number_seq');
  return concat(prefix, '-', to_char(timezone('Europe/Helsinki', now()), 'YYYYMMDD'), '-', lpad(next_value::text, 6, '0'));
end;
$$;

create table if not exists public.invoice_document_access_tokens (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.invoice_documents(id) on delete cascade,
  export_id uuid references public.invoice_exports(id) on delete set null,
  token_hash text not null unique,
  purpose text not null default 'download' check (purpose in ('download', 'preview')),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '365 days'),
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_invoice_document_access_tokens_document
  on public.invoice_document_access_tokens (document_id, created_at desc);
create index if not exists idx_invoice_document_access_tokens_export
  on public.invoice_document_access_tokens (export_id)
  where export_id is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoice-documents',
  'invoice-documents',
  false,
  10485760,
  array['application/pdf', 'text/html', 'application/xml', 'application/json']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.invoice_document_access_tokens enable row level security;

grant select, insert, update on table public.invoice_document_access_tokens to authenticated, service_role;
grant usage, select on sequence public.invoice_document_final_number_seq to authenticated, service_role;
grant execute on function public.next_invoice_document_number(text) to authenticated, service_role;

drop policy if exists "Invoice document tokens admin read" on public.invoice_document_access_tokens;
create policy "Invoice document tokens admin read"
on public.invoice_document_access_tokens for select
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice document tokens admin write" on public.invoice_document_access_tokens;
create policy "Invoice document tokens admin write"
on public.invoice_document_access_tokens for all
to authenticated
using (exists (
  select 1 from public.invoice_documents d where d.id = document_id
))
with check (exists (
  select 1 from public.invoice_documents d where d.id = document_id
));

drop policy if exists "Invoice documents storage admin select" on storage.objects;
create policy "Invoice documents storage admin select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'invoice-documents'
  and auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
);

drop policy if exists "Invoice documents storage admin insert" on storage.objects;
create policy "Invoice documents storage admin insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'invoice-documents'
  and auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
);

drop policy if exists "Invoice documents storage admin update" on storage.objects;
create policy "Invoice documents storage admin update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'invoice-documents'
  and auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
)
with check (
  bucket_id = 'invoice-documents'
  and auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
);
