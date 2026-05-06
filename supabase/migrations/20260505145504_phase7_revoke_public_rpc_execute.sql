-- Phase 7 security-definer RPC review hardening.
-- Account & Customer RPCs are intended for authenticated CMS/customer sessions
-- or service-role workers only. Remove inherited PUBLIC/anon execute exposure
-- from the cms_* and customer_* public function surface while preserving
-- existing explicit authenticated/service_role grants.

do $$
declare
  v_function regprocedure;
begin
  for v_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname like 'cms\_%' escape '\'
        or p.proname like 'customer\_%' escape '\'
      )
  loop
    execute format('revoke all on function %s from public, anon', v_function);
  end loop;
end $$;

insert into public.customer_events(customer_id, actor_id, event_type, details)
values (
  null,
  auth.uid(),
  'account_customer_phase7_public_rpc_execute_revoked',
  jsonb_build_object(
    'function_name_patterns', jsonb_build_array('cms_%', 'customer_%'),
    'revoked_from', jsonb_build_array('public', 'anon'),
    'applied_at', now()
  )
);
