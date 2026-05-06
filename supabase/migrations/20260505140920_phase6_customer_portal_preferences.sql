-- Phase 6 customer portal communication preferences.
-- Customer accounts can withdraw optional marketing/contact consent through a
-- sanitized RPC. Service-critical messages remain controlled by service need.

create or replace function public.customer_portal_update_preferences(
  p_marketing_consent boolean default null,
  p_contact_consent boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_result jsonb;
begin
  select c.id
  into v_customer_id
  from public.customers c
  where c.account_id = auth.uid()
    and c.portal_enabled
    and c.status = 'active'
    and not c.hidden
  order by c.updated_at desc
  limit 1;

  if v_customer_id is null then
    raise exception 'Customer portal access not found';
  end if;

  update public.customers c
  set marketing_consent = p_marketing_consent,
      contact_consent = p_contact_consent,
      updated_by = auth.uid(),
      updated_at = now()
  where c.id = v_customer_id
  returning jsonb_build_object(
    'customer_id', c.id,
    'marketing_consent', c.marketing_consent,
    'contact_consent', c.contact_consent,
    'updated_at', c.updated_at
  )
  into v_result;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    v_customer_id,
    auth.uid(),
    'customer_portal_preferences_updated',
    jsonb_build_object(
      'marketing_consent', p_marketing_consent,
      'contact_consent', p_contact_consent
    )
  );

  return v_result;
end;
$$;

grant execute on function public.customer_portal_update_preferences(boolean, boolean) to authenticated;

create or replace function public.customer_portal_get_preferences()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'customer_id', c.id,
    'marketing_consent', c.marketing_consent,
    'contact_consent', c.contact_consent,
    'updated_at', c.updated_at
  )
  into v_result
  from public.customers c
  where c.account_id = auth.uid()
    and c.portal_enabled
    and c.status = 'active'
    and not c.hidden
  order by c.updated_at desc
  limit 1;

  if v_result is null then
    raise exception 'Customer portal access not found';
  end if;

  return v_result;
end;
$$;

grant execute on function public.customer_portal_get_preferences() to authenticated;
