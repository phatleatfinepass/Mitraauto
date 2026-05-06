-- Phase 7 Account & Customer security hardening.
-- Tighten CMS write permissions to require verified MFA/AAL2 and restrict
-- notification queue worker RPCs to service-role execution.

create or replace function public.cms_has_verified_mfa()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.cms_has_permission(p_module text, p_action text default 'read')
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role text;
  v_status text;
  v_permission text;
  v_module text := nullif(btrim(coalesce(p_module, '')), '');
  v_action text := lower(nullif(btrim(coalesce(p_action, 'read')), ''));
begin
  if v_module not in ('rescue', 'schedule', 'catalog_tires', 'catalog_rims', 'orders', 'invoices', 'customers', 'accounts') then
    return false;
  end if;

  if v_action not in ('read', 'write') then
    return false;
  end if;

  select p.role, p.account_status, p.cms_permissions ->> v_module
  into v_role, v_status, v_permission
  from public.profiles p
  where p.id = auth.uid();

  if v_status is distinct from 'active' then
    return false;
  end if;

  if v_action = 'write' and not public.cms_has_verified_mfa() then
    return false;
  end if;

  if v_role = 'super_admin' then
    return true;
  end if;

  if v_role = 'admin' then
    return v_module <> 'accounts';
  end if;

  if v_role = 'supervisor' and v_module <> 'customers' then
    return false;
  end if;

  if v_permission is null or v_permission = 'none' then
    return false;
  end if;

  if v_action = 'read' then
    return v_permission in ('read', 'read_write');
  end if;

  return v_permission = 'read_write';
end;
$$;

create or replace function public.cms_require_verified_mfa()
returns void
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.cms_has_verified_mfa() then
    raise exception 'Verified MFA session required';
  end if;
end;
$$;

create or replace function public.customer_notification_claim_email_queue(
  p_limit integer default 25,
  p_lock_timeout interval default interval '15 minutes'
)
returns setof public.customer_notification_history
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_jwt_role text := current_setting('request.jwt.claim.role', true);
begin
  if coalesce(v_jwt_role, '') <> 'service_role' then
    raise exception 'Service role required';
  end if;

  return query
  with candidates as (
    select n.id
    from public.customer_notification_history n
    where n.status = 'queued'
      and n.channel = 'email'
      and (
        n.details ->> 'locked_at' is null
        or (n.details ->> 'locked_at')::timestamptz < now() - p_lock_timeout
      )
    order by n.created_at
    limit v_limit
    for update skip locked
  ),
  claimed as (
    update public.customer_notification_history n
    set details = n.details || jsonb_build_object('locked_at', now())
    from candidates c
    where n.id = c.id
    returning n.*
  )
  select * from claimed;
end;
$$;

revoke all on function public.customer_notification_claim_email_queue(integer, interval) from public, anon, authenticated;
grant execute on function public.customer_notification_claim_email_queue(integer, interval) to service_role;

revoke all on function public.customer_enqueue_due_notifications(timestamptz, interval, integer) from public, anon, authenticated;
grant execute on function public.customer_enqueue_due_notifications(timestamptz, interval, integer) to service_role;

grant execute on function public.cms_has_verified_mfa() to authenticated;
grant execute on function public.cms_require_verified_mfa() to authenticated;
grant execute on function public.cms_has_permission(text, text) to authenticated;

insert into public.customer_events(customer_id, actor_id, event_type, details)
values (
  null,
  auth.uid(),
  'account_customer_phase7_security_hardening_applied',
  jsonb_build_object(
    'cms_write_requires_aal2', true,
    'queue_claim_requires_service_role', true,
    'applied_at', now()
  )
);
