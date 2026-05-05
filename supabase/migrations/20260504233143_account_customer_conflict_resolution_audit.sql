create or replace function public.cms_merge_customers(
  p_primary_customer_id uuid,
  p_duplicate_customer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duplicate public.customers%rowtype;
  v_primary public.customers%rowtype;
  v_conflict_plates text[];
  v_moved_plates text[];
  v_hidden_plates text[];
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_primary_customer_id = p_duplicate_customer_id then
    raise exception 'Cannot merge the same customer';
  end if;

  select * into v_primary from public.customers where id = p_primary_customer_id for update;
  if not found then
    raise exception 'Primary customer not found';
  end if;

  select * into v_duplicate from public.customers where id = p_duplicate_customer_id for update;
  if not found then
    raise exception 'Duplicate customer not found';
  end if;

  select coalesce(array_agg(distinct upper(btrim(duplicate_vehicle.license_plate)) order by upper(btrim(duplicate_vehicle.license_plate))), '{}'::text[])
  into v_conflict_plates
  from public.customer_vehicles duplicate_vehicle
  where duplicate_vehicle.customer_id = p_duplicate_customer_id
    and exists (
      select 1
      from public.customer_vehicles primary_vehicle
      where primary_vehicle.customer_id = p_primary_customer_id
        and upper(primary_vehicle.license_plate) = upper(duplicate_vehicle.license_plate)
    );

  select coalesce(array_agg(distinct upper(btrim(duplicate_vehicle.license_plate)) order by upper(btrim(duplicate_vehicle.license_plate))), '{}'::text[])
  into v_moved_plates
  from public.customer_vehicles duplicate_vehicle
  where duplicate_vehicle.customer_id = p_duplicate_customer_id
    and not exists (
      select 1
      from public.customer_vehicles primary_vehicle
      where primary_vehicle.customer_id = p_primary_customer_id
        and upper(primary_vehicle.license_plate) = upper(duplicate_vehicle.license_plate)
    );

  update public.customers
  set primary_email = coalesce(nullif(primary_email, ''), v_duplicate.primary_email),
      primary_phone = coalesce(nullif(primary_phone, ''), v_duplicate.primary_phone),
      full_name = coalesce(nullif(full_name, ''), v_duplicate.full_name),
      language = coalesce(nullif(language, ''), v_duplicate.language),
      business_id = coalesce(nullif(business_id, ''), v_duplicate.business_id),
      vat_id = coalesce(nullif(vat_id, ''), v_duplicate.vat_id),
      address_line1 = coalesce(nullif(address_line1, ''), v_duplicate.address_line1),
      address_line2 = coalesce(nullif(address_line2, ''), v_duplicate.address_line2),
      postal_code = coalesce(nullif(postal_code, ''), v_duplicate.postal_code),
      city = coalesce(nullif(city, ''), v_duplicate.city),
      tags = (
        select array_agg(distinct tag order by tag)
        from unnest(coalesce(public.customers.tags, '{}'::text[]) || coalesce(v_duplicate.tags, '{}'::text[])) as tag
      ),
      marketing_consent = coalesce(marketing_consent, v_duplicate.marketing_consent),
      contact_consent = coalesce(contact_consent, v_duplicate.contact_consent),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_primary_customer_id;

  update public.customer_vehicles
  set customer_id = p_primary_customer_id,
      updated_at = now()
  where customer_id = p_duplicate_customer_id
    and not exists (
      select 1
      from public.customer_vehicles existing
      where existing.customer_id = p_primary_customer_id
        and upper(existing.license_plate) = upper(public.customer_vehicles.license_plate)
    );

  update public.customer_vehicles
  set hidden = true,
      updated_at = now()
  where customer_id = p_duplicate_customer_id;

  select coalesce(array_agg(distinct upper(btrim(license_plate)) order by upper(btrim(license_plate))), '{}'::text[])
  into v_hidden_plates
  from public.customer_vehicles
  where customer_id = p_duplicate_customer_id
    and hidden;

  update public.customer_notes
  set customer_id = p_primary_customer_id
  where customer_id = p_duplicate_customer_id;

  update public.customer_events
  set customer_id = p_primary_customer_id
  where customer_id = p_duplicate_customer_id;

  update public.customers
  set status = 'merged',
      hidden = true,
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_duplicate_customer_id;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_primary_customer_id,
    auth.uid(),
    'customer_merged',
    jsonb_build_object(
      'duplicate_customer_id', p_duplicate_customer_id,
      'primary_customer_email', v_primary.primary_email,
      'duplicate_customer_email', v_duplicate.primary_email,
      'moved_license_plates', v_moved_plates,
      'hidden_duplicate_license_plates', v_hidden_plates,
      'resolved_conflict_license_plates', v_conflict_plates
    )
  );

  if coalesce(array_length(v_conflict_plates, 1), 0) > 0 then
    insert into public.customer_events(customer_id, actor_id, event_type, details)
    values (
      p_primary_customer_id,
      auth.uid(),
      'customer_license_plate_conflict_resolved',
      jsonb_build_object(
        'resolution', 'customer_merge',
        'primary_customer_id', p_primary_customer_id,
        'duplicate_customer_id', p_duplicate_customer_id,
        'license_plates', v_conflict_plates,
        'hidden_duplicate_license_plates', v_hidden_plates
      )
    );
  end if;
end;
$$;

grant execute on function public.cms_merge_customers(uuid, uuid) to authenticated;
