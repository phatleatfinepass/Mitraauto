-- Rescue 24/7 CMS access for authenticated admins.
-- Public intake still goes through the security definer RPC only.

grant select, update on table public.emergency_requests to authenticated;
grant select, insert on table public.emergency_request_events to authenticated;

alter table public.emergency_requests enable row level security;
alter table public.emergency_request_events enable row level security;

drop policy if exists "Emergency requests admin read" on public.emergency_requests;
create policy "Emergency requests admin read"
on public.emergency_requests
for select
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

drop policy if exists "Emergency requests admin update" on public.emergency_requests;
create policy "Emergency requests admin update"
on public.emergency_requests
for update
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

drop policy if exists "Emergency request events admin read" on public.emergency_request_events;
create policy "Emergency request events admin read"
on public.emergency_request_events
for select
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

drop policy if exists "Emergency request events admin insert" on public.emergency_request_events;
create policy "Emergency request events admin insert"
on public.emergency_request_events
for insert
to authenticated
with check (
  auth.jwt() ->> 'email' = 'admin@mitra-auto.fi'
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
