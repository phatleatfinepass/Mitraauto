-- Phase 7 Account & Customer security-definer function body hardening.
-- Tighten destructive GDPR actions and prevent lower-scope staff from exporting
-- super-admin-only notes through the GDPR export RPC.

create or replace function public.cms_upsert_customer_vehicle(
  p_customer_id uuid,
  p_vehicle_id uuid default null,
  p_license_plate text default null,
  p_vehicle_name text default null,
  p_vin text default null,
  p_notes text default null,
  p_hidden boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle_id uuid;
  v_plate text := upper(regexp_replace(btrim(coalesce(p_license_plate, '')), '\s+', '', 'g'));
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if not exists (
    select 1
    from public.customers
    where id = p_customer_id
      and status not in ('deleted', 'merged')
  ) then
    raise exception 'Customer not found';
  end if;

  if nullif(v_plate, '') is null then
    raise exception 'License plate is required';
  end if;

  if p_vehicle_id is null then
    insert into public.customer_vehicles (
      customer_id,
      license_plate,
      vehicle_name,
      vin,
      notes,
      hidden
    )
    values (
      p_customer_id,
      v_plate,
      nullif(btrim(p_vehicle_name), ''),
      nullif(btrim(p_vin), ''),
      nullif(btrim(p_notes), ''),
      coalesce(p_hidden, false)
    )
    returning id into v_vehicle_id;
  else
    update public.customer_vehicles
    set license_plate = v_plate,
        vehicle_name = nullif(btrim(p_vehicle_name), ''),
        vin = nullif(btrim(p_vin), ''),
        notes = nullif(btrim(p_notes), ''),
        hidden = coalesce(p_hidden, false),
        updated_at = now()
    where id = p_vehicle_id
      and customer_id = p_customer_id
    returning id into v_vehicle_id;
  end if;

  if v_vehicle_id is null then
    raise exception 'Vehicle not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_vehicle_saved',
    jsonb_build_object('vehicle_id', v_vehicle_id)
  );

  return v_vehicle_id;
end;
$$;

create or replace function public.cms_add_customer_note(
  p_customer_id uuid,
  p_body text,
  p_visibility text default 'internal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_note_id uuid;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if not exists (
    select 1
    from public.customers
    where id = p_customer_id
      and status not in ('deleted', 'merged')
  ) then
    raise exception 'Customer not found';
  end if;

  if p_visibility not in ('internal', 'super_admin') then
    raise exception 'Invalid note visibility';
  end if;

  if p_visibility = 'super_admin' and not public.cms_is_super_admin() then
    raise exception 'Super admin note access required';
  end if;

  if nullif(btrim(p_body), '') is null then
    raise exception 'Note body is required';
  end if;

  insert into public.customer_notes(customer_id, body, visibility, created_by)
  values (p_customer_id, btrim(p_body), p_visibility, auth.uid())
  returning id into v_note_id;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_note_added',
    jsonb_build_object('note_id', v_note_id, 'visibility', p_visibility)
  );

  return v_note_id;
end;
$$;

create or replace function public.cms_export_customer_data(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer public.customers%rowtype;
  v_is_super_admin boolean := public.cms_is_super_admin();
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  select * into v_customer
  from public.customers
  where id = p_customer_id;

  if not found then
    raise exception 'Customer not found';
  end if;

  return jsonb_build_object(
    'customer', to_jsonb(v_customer),
    'vehicles', coalesce((
      select jsonb_agg(to_jsonb(v) order by v.created_at)
      from public.customer_vehicles v
      where v.customer_id = p_customer_id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at)
      from public.customer_notes n
      where n.customer_id = p_customer_id
        and (n.visibility = 'internal' or v_is_super_admin)
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.created_at)
      from public.customer_events e
      where e.customer_id = p_customer_id
    ), '[]'::jsonb),
    'linked_activity', jsonb_build_object(
      'bookings', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', b.id,
          'customer_vehicle_id', b.customer_vehicle_id,
          'customer_match_source', b.customer_match_source,
          'customer_linked_at', b.customer_linked_at
        ) order by b.created_at)
        from public.bookings b
        where b.customer_id = p_customer_id
      ), '[]'::jsonb),
      'orders', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', o.id,
          'customer_vehicle_id', o.customer_vehicle_id,
          'customer_match_source', o.customer_match_source,
          'customer_linked_at', o.customer_linked_at
        ) order by o.created_at)
        from public.orders o
        where o.customer_id = p_customer_id
      ), '[]'::jsonb),
      'invoices', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', d.id,
          'customer_vehicle_id', d.customer_vehicle_id,
          'customer_match_source', d.customer_match_source,
          'customer_linked_at', d.customer_linked_at
        ) order by d.created_at)
        from public.invoice_documents d
        where d.customer_id = p_customer_id
      ), '[]'::jsonb),
      'rescue', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', e.id,
          'customer_vehicle_id', e.customer_vehicle_id,
          'customer_match_source', e.customer_match_source,
          'customer_linked_at', e.customer_linked_at
        ) order by e.created_at)
        from public.emergency_requests e
        where e.customer_id = p_customer_id
      ), '[]'::jsonb)
    )
  );
end;
$$;

create or replace function public.cms_anonymize_customer(
  p_customer_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cms_is_super_admin() then
    raise exception 'Super admin access required';
  end if;

  perform public.cms_require_verified_mfa();

  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_anonymized',
    jsonb_build_object('reason', nullif(btrim(coalesce(p_reason, '')), ''))
  );

  update public.bookings
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.orders
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.invoice_documents
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.emergency_requests
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.customer_vehicles
  set license_plate = 'ANON-' || substr(id::text, 1, 8),
      vehicle_name = null,
      vin = null,
      notes = null,
      hidden = true,
      updated_at = now()
  where customer_id = p_customer_id;

  update public.customer_notes
  set body = '[anonymized]'
  where customer_id = p_customer_id;

  update public.customers
  set primary_email = null,
      primary_phone = null,
      full_name = 'Anonymized customer',
      language = null,
      business_id = null,
      vat_id = null,
      address_line1 = null,
      address_line2 = null,
      postal_code = null,
      city = null,
      country_code = 'FI',
      status = 'deleted',
      tags = '{}'::text[],
      marketing_consent = false,
      contact_consent = false,
      hidden = true,
      source = 'gdpr_anonymized',
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id;
end;
$$;

grant execute on function public.cms_upsert_customer_vehicle(uuid, uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.cms_add_customer_note(uuid, text, text) to authenticated;
grant execute on function public.cms_export_customer_data(uuid) to authenticated;
grant execute on function public.cms_anonymize_customer(uuid, text) to authenticated;

insert into public.customer_events(customer_id, actor_id, event_type, details)
values (
  null,
  auth.uid(),
  'account_customer_phase7_customer_rpc_body_hardening_applied',
  jsonb_build_object(
    'vehicle_and_note_customer_existence_checks', true,
    'gdpr_export_filters_super_admin_notes', true,
    'gdpr_anonymize_super_admin_only', true,
    'applied_at', now()
  )
);
