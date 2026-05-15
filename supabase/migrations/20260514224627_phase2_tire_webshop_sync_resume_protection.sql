-- Phase 2: make tire webshop publish resumable and prevent duplicate running jobs.

set lock_timeout = '5s';
set statement_timeout = '120s';

-- Older UI retries can create duplicate zero-progress running jobs. Keep the
-- newest running job resumable and close older zero-progress duplicates.
with ranked as (
  select
    id,
    row_number() over (order by started_at desc, id desc) as rn
  from public.webshop_tire_sync_runs
  where status = 'running'
)
update public.webshop_tire_sync_runs r
set
  status = 'failed',
  error_message = 'Closed duplicate stale running run during tire resumable sync migration',
  finished_at = now()
from ranked
where r.id = ranked.id
  and ranked.rn > 1
  and r.processed_items = 0;

create or replace function public.start_webshop_tire_items_sync_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.webshop_tire_sync_runs%rowtype;
  v_run_id uuid;
  v_total integer;
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

  select *
  into v_run
  from public.webshop_tire_sync_runs
  where status = 'running'
  order by started_at desc, id desc
  limit 1;

  if found then
    return jsonb_build_object(
      'run_id', v_run.id,
      'status', v_run.status,
      'processed', v_run.processed_items,
      'total', v_run.total_items,
      'has_more', v_run.processed_items < v_run.total_items,
      'last_variant_id', v_run.last_variant_id,
      'resumed', true
    );
  end if;

  select count(*)::integer
  into v_total
  from public.catalog_selected_items s
  where s.product_type = 'tire'
    and s.is_available;

  insert into public.webshop_tire_sync_runs (status, total_items, processed_items, created_by)
  values ('running', v_total, 0, auth.uid())
  returning id into v_run_id;

  return jsonb_build_object(
    'run_id', v_run_id,
    'status', 'running',
    'processed', 0,
    'total', v_total,
    'has_more', v_total > 0,
    'resumed', false
  );
end;
$$;

revoke all on function public.start_webshop_tire_items_sync_v1() from public;
grant execute on function public.start_webshop_tire_items_sync_v1() to authenticated;
