-- Phase 7 Account & Customer audit and RPC hardening.
-- Move CMS service-book/reminder writes behind audited RPCs and remove
-- browser-side write grants for the supporting portal tables.

create or replace function public.cms_upsert_customer_service_book_entry(
  p_entry_id uuid default null,
  p_customer_id uuid default null,
  p_customer_vehicle_id uuid default null,
  p_entry_type text default 'maintenance',
  p_title text default null,
  p_description text default null,
  p_work_date date default null,
  p_mileage_km integer default null,
  p_parts jsonb default '[]'::jsonb,
  p_staff_notes text default null,
  p_visible_to_customer boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
  v_entry_type text := lower(nullif(btrim(coalesce(p_entry_type, 'maintenance')), ''));
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_event_type text;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_customer_id is null or not exists (
    select 1 from public.customers
    where id = p_customer_id
      and status not in ('deleted', 'merged')
  ) then
    raise exception 'Customer not found';
  end if;

  if p_customer_vehicle_id is not null and not exists (
    select 1 from public.customer_vehicles
    where id = p_customer_vehicle_id
      and customer_id = p_customer_id
  ) then
    raise exception 'Customer vehicle not found';
  end if;

  if v_entry_type not in ('maintenance', 'service', 'inspection', 'estimate', 'repair', 'tire', 'cleaning', 'note') then
    raise exception 'Invalid service book entry type';
  end if;

  if v_title is null then
    raise exception 'Service book title is required';
  end if;

  if p_mileage_km is not null and p_mileage_km < 0 then
    raise exception 'Mileage must be zero or greater';
  end if;

  if p_parts is not null and jsonb_typeof(p_parts) <> 'array' then
    raise exception 'Parts must be a JSON array';
  end if;

  if p_entry_id is null then
    insert into public.customer_service_book_entries (
      customer_id,
      customer_vehicle_id,
      entry_type,
      title,
      description,
      work_date,
      mileage_km,
      parts,
      staff_notes,
      visible_to_customer,
      created_by,
      updated_by
    )
    values (
      p_customer_id,
      p_customer_vehicle_id,
      v_entry_type,
      v_title,
      nullif(btrim(coalesce(p_description, '')), ''),
      p_work_date,
      p_mileage_km,
      coalesce(p_parts, '[]'::jsonb),
      nullif(btrim(coalesce(p_staff_notes, '')), ''),
      coalesce(p_visible_to_customer, true),
      auth.uid(),
      auth.uid()
    )
    returning id into v_entry_id;

    v_event_type := 'customer_service_book_entry_created';
  else
    update public.customer_service_book_entries
    set customer_vehicle_id = p_customer_vehicle_id,
        entry_type = v_entry_type,
        title = v_title,
        description = nullif(btrim(coalesce(p_description, '')), ''),
        work_date = p_work_date,
        mileage_km = p_mileage_km,
        parts = coalesce(p_parts, '[]'::jsonb),
        staff_notes = nullif(btrim(coalesce(p_staff_notes, '')), ''),
        visible_to_customer = coalesce(p_visible_to_customer, true),
        updated_by = auth.uid(),
        updated_at = now()
    where id = p_entry_id
      and customer_id = p_customer_id
    returning id into v_entry_id;

    if v_entry_id is null then
      raise exception 'Service book entry not found';
    end if;

    v_event_type := 'customer_service_book_entry_updated';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    v_event_type,
    jsonb_build_object(
      'entry_id', v_entry_id,
      'entry_type', v_entry_type,
      'customer_vehicle_id', p_customer_vehicle_id,
      'visible_to_customer', coalesce(p_visible_to_customer, true)
    )
  );

  return v_entry_id;
end;
$$;

create or replace function public.cms_delete_customer_service_book_entry(
  p_entry_id uuid,
  p_customer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.customer_service_book_entries%rowtype;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  select * into v_entry
  from public.customer_service_book_entries
  where id = p_entry_id
    and customer_id = p_customer_id;

  if not found then
    raise exception 'Service book entry not found';
  end if;

  delete from public.customer_service_book_entries
  where id = p_entry_id
    and customer_id = p_customer_id;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_service_book_entry_deleted',
    jsonb_build_object(
      'entry_id', p_entry_id,
      'entry_type', v_entry.entry_type,
      'customer_vehicle_id', v_entry.customer_vehicle_id,
      'visible_to_customer', v_entry.visible_to_customer
    )
  );
end;
$$;

create or replace function public.cms_upsert_customer_maintenance_reminder(
  p_reminder_id uuid default null,
  p_customer_id uuid default null,
  p_customer_vehicle_id uuid default null,
  p_reminder_type text default 'maintenance',
  p_title text default null,
  p_description text default null,
  p_due_date date default null,
  p_due_mileage_km integer default null,
  p_last_known_mileage_km integer default null,
  p_status text default 'active',
  p_service_critical boolean default true,
  p_next_email_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reminder_id uuid;
  v_status text := lower(nullif(btrim(coalesce(p_status, 'active')), ''));
  v_reminder_type text := lower(nullif(btrim(coalesce(p_reminder_type, 'maintenance')), ''));
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_event_type text;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_customer_id is null or not exists (
    select 1 from public.customers
    where id = p_customer_id
      and status not in ('deleted', 'merged')
  ) then
    raise exception 'Customer not found';
  end if;

  if p_customer_vehicle_id is not null and not exists (
    select 1 from public.customer_vehicles
    where id = p_customer_vehicle_id
      and customer_id = p_customer_id
  ) then
    raise exception 'Customer vehicle not found';
  end if;

  if v_status not in ('active', 'paused', 'sent', 'completed', 'cancelled') then
    raise exception 'Invalid reminder status';
  end if;

  if v_title is null then
    raise exception 'Reminder title is required';
  end if;

  if p_due_date is null and p_due_mileage_km is null and p_next_email_at is null then
    raise exception 'Set a due date, due mileage, or next email time';
  end if;

  if p_due_mileage_km is not null and p_due_mileage_km < 0 then
    raise exception 'Due mileage must be zero or greater';
  end if;

  if p_last_known_mileage_km is not null and p_last_known_mileage_km < 0 then
    raise exception 'Last known mileage must be zero or greater';
  end if;

  if p_reminder_id is null then
    insert into public.customer_maintenance_reminders (
      customer_id,
      customer_vehicle_id,
      reminder_type,
      title,
      description,
      due_date,
      due_mileage_km,
      last_known_mileage_km,
      status,
      service_critical,
      next_email_at,
      created_by,
      updated_by
    )
    values (
      p_customer_id,
      p_customer_vehicle_id,
      coalesce(v_reminder_type, 'maintenance'),
      v_title,
      nullif(btrim(coalesce(p_description, '')), ''),
      p_due_date,
      p_due_mileage_km,
      p_last_known_mileage_km,
      v_status,
      coalesce(p_service_critical, true),
      p_next_email_at,
      auth.uid(),
      auth.uid()
    )
    returning id into v_reminder_id;

    v_event_type := 'customer_maintenance_reminder_created';
  else
    update public.customer_maintenance_reminders
    set customer_vehicle_id = p_customer_vehicle_id,
        reminder_type = coalesce(v_reminder_type, 'maintenance'),
        title = v_title,
        description = nullif(btrim(coalesce(p_description, '')), ''),
        due_date = p_due_date,
        due_mileage_km = p_due_mileage_km,
        last_known_mileage_km = p_last_known_mileage_km,
        status = v_status,
        service_critical = coalesce(p_service_critical, true),
        next_email_at = p_next_email_at,
        updated_by = auth.uid(),
        updated_at = now()
    where id = p_reminder_id
      and customer_id = p_customer_id
    returning id into v_reminder_id;

    if v_reminder_id is null then
      raise exception 'Maintenance reminder not found';
    end if;

    v_event_type := 'customer_maintenance_reminder_updated';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    v_event_type,
    jsonb_build_object(
      'reminder_id', v_reminder_id,
      'reminder_type', coalesce(v_reminder_type, 'maintenance'),
      'customer_vehicle_id', p_customer_vehicle_id,
      'status', v_status,
      'service_critical', coalesce(p_service_critical, true)
    )
  );

  return v_reminder_id;
end;
$$;

create or replace function public.cms_delete_customer_maintenance_reminder(
  p_reminder_id uuid,
  p_customer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reminder public.customer_maintenance_reminders%rowtype;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  select * into v_reminder
  from public.customer_maintenance_reminders
  where id = p_reminder_id
    and customer_id = p_customer_id;

  if not found then
    raise exception 'Maintenance reminder not found';
  end if;

  delete from public.customer_maintenance_reminders
  where id = p_reminder_id
    and customer_id = p_customer_id;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_maintenance_reminder_deleted',
    jsonb_build_object(
      'reminder_id', p_reminder_id,
      'reminder_type', v_reminder.reminder_type,
      'customer_vehicle_id', v_reminder.customer_vehicle_id,
      'status', v_reminder.status,
      'service_critical', v_reminder.service_critical
    )
  );
end;
$$;

revoke insert, update, delete on table public.customer_service_book_entries from authenticated;
revoke insert, update, delete on table public.customer_maintenance_reminders from authenticated;
revoke insert, update, delete on table public.customer_notification_history from authenticated;

grant execute on function public.cms_upsert_customer_service_book_entry(uuid, uuid, uuid, text, text, text, date, integer, jsonb, text, boolean) to authenticated;
grant execute on function public.cms_delete_customer_service_book_entry(uuid, uuid) to authenticated;
grant execute on function public.cms_upsert_customer_maintenance_reminder(uuid, uuid, uuid, text, text, text, date, integer, integer, text, boolean, timestamptz) to authenticated;
grant execute on function public.cms_delete_customer_maintenance_reminder(uuid, uuid) to authenticated;

insert into public.customer_events(customer_id, actor_id, event_type, details)
values (
  null,
  auth.uid(),
  'account_customer_phase7_audit_rpc_hardening_applied',
  jsonb_build_object(
    'service_book_writes_use_rpc', true,
    'maintenance_reminder_writes_use_rpc', true,
    'notification_history_browser_writes_revoked', true,
    'applied_at', now()
  )
);
