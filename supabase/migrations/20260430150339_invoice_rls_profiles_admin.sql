-- Align invoice CMS RLS with the actual CMS guard.
-- CMS access is based on public.profiles.role = 'admin', not only one hardcoded email.

drop policy if exists "Invoice templates admin read" on public.invoice_templates;
create policy "Invoice templates admin read"
on public.invoice_templates for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Invoice templates admin write" on public.invoice_templates;
create policy "Invoice templates admin write"
on public.invoice_templates for all
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Invoice documents admin read" on public.invoice_documents;
create policy "Invoice documents admin read"
on public.invoice_documents for select
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Invoice documents admin write" on public.invoice_documents;
create policy "Invoice documents admin write"
on public.invoice_documents for all
to authenticated
using (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Invoice documents storage admin select" on storage.objects;
create policy "Invoice documents storage admin select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'invoice-documents'
  and (
    auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
);

drop policy if exists "Invoice documents storage admin insert" on storage.objects;
create policy "Invoice documents storage admin insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'invoice-documents'
  and (
    auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
);

drop policy if exists "Invoice documents storage admin update" on storage.objects;
create policy "Invoice documents storage admin update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'invoice-documents'
  and (
    auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
)
with check (
  bucket_id = 'invoice-documents'
  and (
    auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
);
