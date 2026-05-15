set lock_timeout = '5s';
set statement_timeout = '60s';

create or replace function public.catalog_rebuild_selected_rims_admin_v1()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.cms_has_permission('catalog_rims', 'write') then
    raise exception 'Admin access required';
  end if;

  return public.catalog_rebuild_selected_rims_v1();
end;
$function$;

create or replace function public.catalog_close_stale_zero_progress_sync_runs_admin_v1(
  p_product_type text default null,
  p_stale_after_minutes integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tire_closed integer := 0;
  v_rim_closed integer := 0;
  v_stale_after interval := make_interval(mins => greatest(coalesce(p_stale_after_minutes, 30), 5));
  v_product_type text := lower(nullif(btrim(coalesce(p_product_type, '')), ''));
begin
  if v_product_type is not null and v_product_type not in ('tire', 'rim') then
    raise exception 'Unsupported product type: %', p_product_type;
  end if;

  if (v_product_type is null or v_product_type = 'tire') then
    if not public.cms_has_permission('catalog_tires', 'write') then
      raise exception 'Admin access required';
    end if;

    update public.webshop_tire_sync_runs
    set
      status = 'failed',
      error_message = concat_ws(
        E'\n',
        nullif(error_message, ''),
        'Closed by CMS health panel: stale zero-progress run.'
      ),
      finished_at = now()
    where status in ('running', 'processing', 'started')
      and coalesce(processed_items, 0) = 0
      and started_at < now() - v_stale_after;

    get diagnostics v_tire_closed = row_count;
  end if;

  if (v_product_type is null or v_product_type = 'rim') then
    if not public.cms_has_permission('catalog_rims', 'write') then
      raise exception 'Admin access required';
    end if;

    update public.webshop_rim_sync_runs
    set
      status = 'failed',
      error_message = concat_ws(
        E'\n',
        nullif(error_message, ''),
        'Closed by CMS health panel: stale zero-progress run.'
      ),
      finished_at = now()
    where status in ('running', 'processing', 'started')
      and coalesce(processed_items, 0) = 0
      and started_at < now() - v_stale_after;

    get diagnostics v_rim_closed = row_count;
  end if;

  return jsonb_build_object(
    'tires_closed', v_tire_closed,
    'rims_closed', v_rim_closed
  );
end;
$function$;

revoke all on function public.catalog_rebuild_selected_rims_admin_v1() from public;
grant execute on function public.catalog_rebuild_selected_rims_admin_v1() to authenticated;

revoke all on function public.catalog_close_stale_zero_progress_sync_runs_admin_v1(text, integer) from public;
grant execute on function public.catalog_close_stale_zero_progress_sync_runs_admin_v1(text, integer) to authenticated;
