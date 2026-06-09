set lock_timeout = '5s';
set statement_timeout = '60s';

create or replace function public.catalog_schedule_selected_rebuild_admin_v1(
  p_product_type text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_product_type text := lower(nullif(btrim(coalesce(p_product_type, '')), ''));
  v_permission_module text;
  v_job_prefix text;
  v_job_name text;
  v_command text;
  v_job_id bigint;
  v_existing record;
begin
  if v_product_type not in ('tire', 'rim') then
    raise exception 'Unsupported product type: %', p_product_type;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  v_permission_module := case
    when v_product_type = 'tire' then 'catalog_tires'
    else 'catalog_rims'
  end;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.account_status = 'active'
      and (
        p.role in ('admin', 'super_admin')
        or p.cms_permissions ->> v_permission_module = 'read_write'
      )
  ) then
    raise exception 'Admin access required';
  end if;

  v_job_prefix := case
    when v_product_type = 'tire' then 'catalog_selected_tires_manual_'
    else 'catalog_selected_rims_manual_'
  end;

  -- Keep the CMS button idempotent. A newer manual request replaces any
  -- pending one-off manual rebuild for the same product family.
  for v_existing in
    select jobname
    from cron.job
    where jobname like v_job_prefix || '%'
  loop
    perform cron.unschedule(v_existing.jobname);
  end loop;

  v_job_name := v_job_prefix || replace(gen_random_uuid()::text, '-', '_');

  v_command := case
    when v_product_type = 'tire' then format(
      'do $catalog_manual_rebuild$ begin perform public.catalog_rebuild_selected_tires_v1(); perform cron.unschedule(%L); exception when others then perform cron.unschedule(%L); raise; end $catalog_manual_rebuild$;',
      v_job_name,
      v_job_name
    )
    else format(
      'do $catalog_manual_rebuild$ begin perform public.catalog_rebuild_selected_rims_v1(); perform cron.unschedule(%L); exception when others then perform cron.unschedule(%L); raise; end $catalog_manual_rebuild$;',
      v_job_name,
      v_job_name
    )
  end;

  v_job_id := cron.schedule(v_job_name, '* * * * *', v_command);

  return jsonb_build_object(
    'queued', true,
    'product_type', v_product_type,
    'job_id', v_job_id,
    'job_name', v_job_name,
    'schedule', '* * * * *'
  );
end;
$function$;

revoke all on function public.catalog_schedule_selected_rebuild_admin_v1(text) from public;
grant execute on function public.catalog_schedule_selected_rebuild_admin_v1(text) to authenticated;
