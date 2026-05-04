create or replace function public.cms_get_customer_detail(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer jsonb;
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  select jsonb_build_object(
    'id', c.id,
    'primary_email', c.primary_email,
    'primary_phone', c.primary_phone,
    'full_name', c.full_name,
    'language', c.language,
    'business_id', c.business_id,
    'vat_id', c.vat_id,
    'address_line1', c.address_line1,
    'address_line2', c.address_line2,
    'postal_code', c.postal_code,
    'city', c.city,
    'country_code', c.country_code,
    'status', c.status,
    'tags', c.tags,
    'marketing_consent', c.marketing_consent,
    'contact_consent', c.contact_consent,
    'hidden', c.hidden,
    'source', c.source,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'vehicles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'license_plate', v.license_plate,
        'vehicle_name', v.vehicle_name,
        'vin', v.vin,
        'notes', v.notes,
        'hidden', v.hidden,
        'created_at', v.created_at,
        'updated_at', v.updated_at
      ) order by v.hidden, upper(v.license_plate))
      from public.customer_vehicles v
      where v.customer_id = c.id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id,
        'body', n.body,
        'visibility', n.visibility,
        'created_by', n.created_by,
        'created_at', n.created_at
      ) order by n.created_at desc)
      from public.customer_notes n
      where n.customer_id = c.id
        and (n.visibility = 'internal' or public.cms_is_super_admin())
      limit 40
    ), '[]'::jsonb)
  )
  into v_customer
  from public.customers c
  where c.id = p_customer_id;

  return v_customer;
end;
$$;

create or replace function public.cms_upsert_customer(
  p_customer_id uuid default null,
  p_full_name text default null,
  p_primary_email text default null,
  p_primary_phone text default null,
  p_language text default null,
  p_business_id text default null,
  p_vat_id text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_postal_code text default null,
  p_city text default null,
  p_country_code text default 'FI',
  p_status text default 'active',
  p_tags text[] default '{}'::text[],
  p_marketing_consent boolean default null,
  p_contact_consent boolean default null,
  p_hidden boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_status not in ('active', 'hidden', 'blocked', 'merged', 'deleted') then
    raise exception 'Invalid customer status';
  end if;

  if p_customer_id is null then
    insert into public.customers (
      full_name,
      primary_email,
      primary_phone,
      language,
      business_id,
      vat_id,
      address_line1,
      address_line2,
      postal_code,
      city,
      country_code,
      status,
      tags,
      marketing_consent,
      contact_consent,
      hidden,
      source,
      created_by,
      updated_by
    )
    values (
      nullif(btrim(p_full_name), ''),
      lower(nullif(btrim(p_primary_email), '')),
      nullif(btrim(p_primary_phone), ''),
      nullif(btrim(p_language), ''),
      nullif(btrim(p_business_id), ''),
      nullif(btrim(p_vat_id), ''),
      nullif(btrim(p_address_line1), ''),
      nullif(btrim(p_address_line2), ''),
      nullif(btrim(p_postal_code), ''),
      nullif(btrim(p_city), ''),
      coalesce(nullif(upper(btrim(p_country_code)), ''), 'FI'),
      p_status,
      coalesce(p_tags, '{}'::text[]),
      p_marketing_consent,
      p_contact_consent,
      coalesce(p_hidden, false),
      'cms',
      auth.uid(),
      auth.uid()
    )
    returning id into v_customer_id;

    insert into public.customer_events(customer_id, actor_id, event_type, details)
    values (v_customer_id, auth.uid(), 'customer_created', jsonb_build_object('source', 'cms'));

    return v_customer_id;
  end if;

  update public.customers
  set full_name = nullif(btrim(p_full_name), ''),
      primary_email = lower(nullif(btrim(p_primary_email), '')),
      primary_phone = nullif(btrim(p_primary_phone), ''),
      language = nullif(btrim(p_language), ''),
      business_id = nullif(btrim(p_business_id), ''),
      vat_id = nullif(btrim(p_vat_id), ''),
      address_line1 = nullif(btrim(p_address_line1), ''),
      address_line2 = nullif(btrim(p_address_line2), ''),
      postal_code = nullif(btrim(p_postal_code), ''),
      city = nullif(btrim(p_city), ''),
      country_code = coalesce(nullif(upper(btrim(p_country_code)), ''), 'FI'),
      status = p_status,
      tags = coalesce(p_tags, '{}'::text[]),
      marketing_consent = p_marketing_consent,
      contact_consent = p_contact_consent,
      hidden = coalesce(p_hidden, false),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id
  returning id into v_customer_id;

  if v_customer_id is null then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    v_customer_id,
    auth.uid(),
    'customer_updated',
    jsonb_build_object('status', p_status, 'hidden', coalesce(p_hidden, false))
  );

  return v_customer_id;
end;
$$;

create or replace function public.cms_set_customer_status(
  p_customer_id uuid,
  p_status text,
  p_hidden boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_status not in ('active', 'hidden', 'blocked', 'merged', 'deleted') then
    raise exception 'Invalid customer status';
  end if;

  update public.customers
  set status = p_status,
      hidden = coalesce(p_hidden, p_status in ('hidden', 'deleted')),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id;

  if not found then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_status_updated',
    jsonb_build_object('status', p_status, 'hidden', coalesce(p_hidden, p_status in ('hidden', 'deleted')))
  );
end;
$$;

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
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if nullif(btrim(p_license_plate), '') is null then
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
      upper(btrim(p_license_plate)),
      nullif(btrim(p_vehicle_name), ''),
      nullif(btrim(p_vin), ''),
      nullif(btrim(p_notes), ''),
      coalesce(p_hidden, false)
    )
    returning id into v_vehicle_id;
  else
    update public.customer_vehicles
    set license_plate = upper(btrim(p_license_plate)),
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

grant execute on function public.cms_get_customer_detail(uuid) to authenticated;
grant execute on function public.cms_upsert_customer(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text[], boolean, boolean, boolean) to authenticated;
grant execute on function public.cms_set_customer_status(uuid, text, boolean) to authenticated;
grant execute on function public.cms_upsert_customer_vehicle(uuid, uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.cms_add_customer_note(uuid, text, text) to authenticated;
