-- Remove the old eReceipt tables after canonical invoice_documents backfill.
-- From here onward receipts/invoices are produced from invoice_documents.

drop view if exists public.invoice_document_summaries;

update public.invoice_documents
set source_type = 'manual',
    payload = jsonb_set(
      coalesce(payload, '{}'::jsonb),
      '{dropped_legacy_ereceipt_id}',
      to_jsonb(legacy_ereceipt_id::text),
      true
    )
where source_type = 'legacy_ereceipt';

alter table public.invoice_documents
  drop constraint if exists invoice_documents_source_reference;

alter table public.invoice_documents
  drop constraint if exists invoice_documents_legacy_ereceipt_id_fkey;

alter table public.invoice_documents
  drop column if exists legacy_ereceipt_id;

alter table public.invoice_documents
  add constraint invoice_documents_source_reference check (
    (source_type = 'order' and order_id is not null)
    or (source_type = 'booking' and booking_id is not null)
    or (source_type = 'manual')
  );

do $$
begin
  alter table public.invoice_documents
    drop constraint if exists invoice_documents_source_type_check;

  alter table public.invoice_documents
    add constraint invoice_documents_source_type_check
    check (source_type in ('order', 'booking', 'manual'));
end $$;

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
  d.status,
  d.language,
  d.currency,
  d.issue_date,
  d.due_date,
  d.supply_date,
  d.sent_at,
  d.paid_at,
  d.issued_at,
  d.subtotal_cents,
  d.shipping_cents,
  d.vat_cents,
  d.total_cents,
  d.paid_cents,
  d.balance_cents,
  d.validation_tier,
  d.validation_errors,
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

grant select on public.invoice_document_summaries to authenticated, service_role;

drop table if exists public.ereceipt_events cascade;
drop table if exists public.ereceipt_access_tokens cascade;
drop table if exists public.ereceipts cascade;
