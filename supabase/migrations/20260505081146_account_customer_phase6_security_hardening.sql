-- Phase 6 security hardening for Account & Customer.
-- Permanent super-admin access must come from the profile row, not a hardcoded
-- email bypass. The email bootstrap remains as data migration only.

update public.profiles p
set role = 'super_admin',
    cms_permissions = jsonb_build_object(
      'rescue', 'read_write',
      'schedule', 'read_write',
      'catalog_tires', 'read_write',
      'catalog_rims', 'read_write',
      'orders', 'read_write',
      'invoices', 'read_write',
      'customers', 'read_write',
      'accounts', 'read_write'
    ),
    account_status = 'active',
    account_hidden = false,
    updated_at = now()
from auth.users u
where u.id = p.id
  and lower(u.email) = 'phat.le@finepass.fi';

create or replace function public.cms_is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.account_status = 'active'
  );
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
begin
  select p.role, p.account_status, p.cms_permissions ->> p_module
  into v_role, v_status, v_permission
  from public.profiles p
  where p.id = auth.uid();

  if public.cms_is_super_admin() then
    return true;
  end if;

  if v_status is distinct from 'active' then
    return false;
  end if;

  if v_role = 'admin' then
    return p_module <> 'accounts';
  end if;

  if v_role = 'supervisor' and p_module <> 'customers' then
    return false;
  end if;

  if v_permission is null or v_permission = 'none' then
    return false;
  end if;

  if p_action = 'read' then
    return v_permission in ('read', 'read_write');
  end if;

  return v_permission = 'read_write';
end;
$$;

-- Customer portal users must not read raw internal tables through PostgREST.
-- Portal access is exposed through sanitized RPC output below.

drop policy if exists "customer_benefits_cms_read" on public.customer_benefits;
create policy "customer_benefits_cms_read"
on public.customer_benefits
for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "customer_benefit_events_cms_read" on public.customer_benefit_events;
create policy "customer_benefit_events_cms_read"
on public.customer_benefit_events
for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "customer_service_book_entries_read" on public.customer_service_book_entries;
create policy "customer_service_book_entries_read"
on public.customer_service_book_entries
for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "customer_maintenance_reminders_read" on public.customer_maintenance_reminders;
create policy "customer_maintenance_reminders_read"
on public.customer_maintenance_reminders
for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "customer_notification_history_read" on public.customer_notification_history;
create policy "customer_notification_history_read"
on public.customer_notification_history
for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

create or replace function public.customer_portal_get_account()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer_id uuid;
  v_payload jsonb;
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

  select jsonb_build_object(
    'customer', jsonb_build_object(
      'id', c.id,
      'customer_type', c.customer_type,
      'full_name', c.full_name,
      'primary_email', c.primary_email,
      'primary_phone', c.primary_phone,
      'language', c.language,
      'portal_enabled', c.portal_enabled
    ),
    'vehicles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'license_plate', v.license_plate,
        'vehicle_name', v.vehicle_name,
        'vin', v.vin
      ) order by upper(v.license_plate))
      from public.customer_vehicles v
      where v.customer_id = c.id
        and not v.hidden
    ), '[]'::jsonb),
    'benefits', jsonb_build_object(
      'points_balance', coalesce(cb.points_balance, 0),
      'lifetime_points', coalesce(cb.lifetime_points, 0),
      'tier', coalesce(cb.tier, 'bronze'),
      'discount_percent', coalesce(cb.discount_percent, 0),
      'updated_at', cb.updated_at
    ),
    'benefit_events', coalesce((
      select jsonb_agg(event_row order by event_created_at desc)
      from (
        select jsonb_build_object(
          'points_delta', e.points_delta,
          'balance_after', e.balance_after,
          'tier_after', e.tier_after,
          'reason', e.reason,
          'created_at', e.created_at
        ) as event_row,
        e.created_at as event_created_at
        from public.customer_benefit_events e
        where e.customer_id = c.id
        order by e.created_at desc
        limit 20
      ) limited_events
    ), '[]'::jsonb),
    'service_book', coalesce((
      select jsonb_agg(entry_row order by entry_work_date desc nulls last, entry_created_at desc)
      from (
        select jsonb_build_object(
          'id', s.id,
          'customer_vehicle_id', s.customer_vehicle_id,
          'entry_type', s.entry_type,
          'title', s.title,
          'description', s.description,
          'work_date', s.work_date,
          'mileage_km', s.mileage_km,
          'parts', s.parts,
          'invoice_id', s.invoice_id,
          'booking_id', s.booking_id,
          'created_at', s.created_at,
          'updated_at', s.updated_at
        ) as entry_row,
        s.work_date as entry_work_date,
        s.created_at as entry_created_at
        from public.customer_service_book_entries s
        where s.customer_id = c.id
          and s.visible_to_customer
        order by s.work_date desc nulls last, s.created_at desc
        limit 80
      ) limited_entries
    ), '[]'::jsonb),
    'maintenance_reminders', coalesce((
      select jsonb_agg(reminder_row order by reminder_due_date nulls last, reminder_created_at desc)
      from (
        select jsonb_build_object(
          'id', r.id,
          'customer_vehicle_id', r.customer_vehicle_id,
          'reminder_type', r.reminder_type,
          'title', r.title,
          'description', r.description,
          'due_date', r.due_date,
          'due_mileage_km', r.due_mileage_km,
          'last_known_mileage_km', r.last_known_mileage_km,
          'status', r.status,
          'service_critical', r.service_critical
        ) as reminder_row,
        r.due_date as reminder_due_date,
        r.created_at as reminder_created_at
        from public.customer_maintenance_reminders r
        where r.customer_id = c.id
          and r.status in ('active', 'sent', 'completed')
        order by r.due_date nulls last, r.created_at desc
        limit 50
      ) limited_reminders
    ), '[]'::jsonb),
    'notification_history', coalesce((
      select jsonb_agg(notification_row order by notification_created_at desc)
      from (
        select jsonb_build_object(
          'notification_type', n.notification_type,
          'channel', n.channel,
          'subject', n.subject,
          'status', n.status,
          'sent_at', n.sent_at,
          'created_at', n.created_at
        ) as notification_row,
        n.created_at as notification_created_at
        from public.customer_notification_history n
        where n.customer_id = c.id
        order by n.created_at desc
        limit 30
      ) limited_notifications
    ), '[]'::jsonb)
  )
  into v_payload
  from public.customers c
  left join public.customer_benefits cb on cb.customer_id = c.id
  where c.id = v_customer_id;

  return v_payload;
end;
$$;

create or replace function public.cms_link_customer_account_by_email(
  p_customer_id uuid,
  p_email text,
  p_portal_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(nullif(btrim(p_email), ''));
  v_account_id uuid;
  v_customer_email text;
  v_account_role text;
  v_account_status text;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if v_email is null then
    raise exception 'Email is required';
  end if;

  select lower(nullif(btrim(c.primary_email), ''))
  into v_customer_email
  from public.customers c
  where c.id = p_customer_id
    and c.status not in ('deleted', 'merged');

  if not found then
    raise exception 'Customer not found';
  end if;

  if v_customer_email is not null and v_customer_email <> v_email and not public.cms_is_super_admin() then
    raise exception 'Customer account email must match the customer primary email. Super admin override required.';
  end if;

  select u.id
  into v_account_id
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_account_id is null then
    raise exception 'Auth account not found for email %', v_email;
  end if;

  select p.role, p.account_status
  into v_account_role, v_account_status
  from public.profiles p
  where p.id = v_account_id;

  if v_account_role in ('super_admin', 'admin', 'supervisor', 'staff')
     and coalesce(v_account_status, 'active') <> 'deleted'
     and not public.cms_is_super_admin() then
    raise exception 'Linking a CMS staff account as a customer requires super admin';
  end if;

  if exists (
    select 1
    from public.customers c
    where c.account_id = v_account_id
      and c.id <> p_customer_id
      and c.status not in ('deleted', 'merged')
  ) then
    raise exception 'Auth account is already linked to another customer';
  end if;

  update public.customers
  set account_id = v_account_id,
      portal_enabled = coalesce(p_portal_enabled, true),
      portal_invited_at = coalesce(portal_invited_at, now()),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_account_linked',
    jsonb_build_object(
      'account_id', v_account_id,
      'email', v_email,
      'portal_enabled', coalesce(p_portal_enabled, true),
      'email_matched_primary', v_customer_email = v_email
    )
  );

  return v_account_id;
end;
$$;

grant execute on function public.cms_is_super_admin() to authenticated;
grant execute on function public.cms_has_permission(text, text) to authenticated;
grant execute on function public.customer_portal_get_account() to authenticated;
grant execute on function public.cms_link_customer_account_by_email(uuid, text, boolean) to authenticated;
