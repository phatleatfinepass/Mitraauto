-- Align Rescue 24/7 RLS with the current CMS role/permission model.
-- The original policies only accepted role = 'admin', which blocks
-- super_admin and staff accounts that have explicit rescue permissions.

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
  public.cms_has_permission('rescue', 'read')
);

drop policy if exists "Emergency requests admin update" on public.emergency_requests;
create policy "Emergency requests admin update"
on public.emergency_requests
for update
to authenticated
using (
  public.cms_has_permission('rescue', 'write')
)
with check (
  public.cms_has_permission('rescue', 'write')
);

drop policy if exists "Emergency request events admin read" on public.emergency_request_events;
create policy "Emergency request events admin read"
on public.emergency_request_events
for select
to authenticated
using (
  public.cms_has_permission('rescue', 'read')
);

drop policy if exists "Emergency request events admin insert" on public.emergency_request_events;
create policy "Emergency request events admin insert"
on public.emergency_request_events
for insert
to authenticated
with check (
  public.cms_has_permission('rescue', 'write')
);
