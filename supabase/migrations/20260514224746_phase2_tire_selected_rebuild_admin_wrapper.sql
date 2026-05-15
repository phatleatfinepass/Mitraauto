-- Phase 2: expose selected tire rebuild to CMS through an admin-checked wrapper.
-- The underlying rebuild remains available to database-owned cron jobs, while
-- browser clients must pass CMS role checks before triggering it.

create or replace function public.catalog_rebuild_selected_tires_admin_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Admin access required';
  end if;

  return public.catalog_rebuild_selected_tires_v1();
end;
$$;

revoke all on function public.catalog_rebuild_selected_tires_admin_v1() from public;
grant execute on function public.catalog_rebuild_selected_tires_admin_v1() to authenticated;

-- Avoid direct Data API execution of the raw rebuild function by anon/browser
-- roles. Cron/database-owned jobs can still execute it as the owning DB role.
revoke all on function public.catalog_rebuild_selected_tires_v1() from public;
revoke all on function public.catalog_rebuild_selected_tires_v1() from anon;
revoke all on function public.catalog_rebuild_selected_tires_v1() from authenticated;
