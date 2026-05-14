-- Keep manual rim Apply Sync finalization under API statement timeout.
-- The heavy storefront summary counts can run in health checks instead of the user action.

set lock_timeout = '5s';
set statement_timeout = '120s';

create index if not exists webshop_items_rim_stale_publish_idx
  on public.webshop_items (product_type, last_rim_sync_run_id, variant_id)
  where product_type = 'rim';

create or replace function public.finalize_webshop_rim_items_sync_v1(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.webshop_rim_sync_runs%rowtype;
  v_hidden integer := 0;
  v_result jsonb;
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
  from public.webshop_rim_sync_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception 'Sync run not found: %', p_run_id;
  end if;

  if v_run.status <> 'running' then
    raise exception 'Sync run is not running: %', v_run.status;
  end if;

  if v_run.processed_items < v_run.total_items then
    raise exception 'Cannot finalize incomplete sync run: %/%', v_run.processed_items, v_run.total_items;
  end if;

  update public.webshop_items w
  set
    is_visible = false,
    publish_status = 'hidden',
    publish_block_reason = 'not_in_selected_catalog',
    refreshed_at = now(),
    updated_at = now()
  where w.product_type = 'rim'
    and w.last_rim_sync_run_id is distinct from p_run_id
    and (
      w.is_visible is distinct from false
      or w.publish_status is distinct from 'hidden'
      or w.publish_block_reason is distinct from 'not_in_selected_catalog'
    );

  get diagnostics v_hidden = row_count;

  update public.webshop_rim_sync_runs
  set
    status = 'completed',
    finished_at = now()
  where id = p_run_id
  returning * into v_run;

  select jsonb_build_object(
    'run_id', p_run_id,
    'status', v_run.status,
    'processed', v_run.processed_items,
    'total', v_run.total_items,
    'inserted', v_run.inserted_items,
    'updated', v_run.updated_items,
    'skipped_incomplete', v_run.skipped_incomplete_items,
    'failed', v_run.failed_items,
    'hidden_total', v_hidden
  ) into v_result;

  return v_result;
exception
  when others then
    update public.webshop_rim_sync_runs
    set
      status = 'failed',
      error_message = sqlerrm,
      finished_at = now()
    where id = p_run_id
      and status = 'running';
    raise;
end;
$$;

revoke all on function public.finalize_webshop_rim_items_sync_v1(uuid) from public;
grant execute on function public.finalize_webshop_rim_items_sync_v1(uuid) to authenticated;
