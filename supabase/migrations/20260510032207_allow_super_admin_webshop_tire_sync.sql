-- The nightly selected-tire -> webshop publish cron runs as the primary CMS
-- account, which is now a super_admin. The original batched sync functions
-- only accepted role = 'admin', causing the daily publish job to fail after
-- selected tires rebuilt successfully.

set lock_timeout = '5s';
set statement_timeout = '60s';

drop policy if exists "Admins manage webshop tire sync runs" on public.webshop_tire_sync_runs;
create policy "Admins manage webshop tire sync runs"
on public.webshop_tire_sync_runs
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin')
  )
);

do $$
declare
  v_function text;
  v_signature text;
begin
  foreach v_signature in array array[
    'public.start_webshop_tire_items_sync_v1()',
    'public.refresh_webshop_tire_items_batch_v1(uuid, integer)',
    'public.finalize_webshop_tire_items_sync_v1(uuid)'
  ]
  loop
    select pg_get_functiondef(v_signature::regprocedure)
    into v_function;

    if v_function is null then
      raise exception 'Expected function % to exist', v_signature;
    end if;

    v_function := replace(
      v_function,
      'and role = ''admin''',
      'and role in (''admin'', ''super_admin'')'
    );

    execute v_function;
  end loop;
end $$;
