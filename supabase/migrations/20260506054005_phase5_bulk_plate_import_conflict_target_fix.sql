create or replace function public.cms_bulk_import_customer_plates(
  p_customer_id uuid,
  p_license_plates text[],
  p_default_vehicle_name text default null
)
returns table (
  license_plate text,
  vehicle_id uuid,
  action text,
  conflict_customer_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plate text;
  v_vehicle_id uuid;
  v_conflict_count integer;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id and status <> 'deleted') then
    raise exception 'Customer not found';
  end if;

  foreach v_plate in array coalesce(p_license_plates, '{}'::text[]) loop
    v_plate := upper(regexp_replace(btrim(v_plate), '\s+', '', 'g'));
    if v_plate = '' then
      continue;
    end if;

    select count(distinct c.id)::integer
    into v_conflict_count
    from public.customer_vehicles cv
    join public.customers c on c.id = cv.customer_id
    where cv.customer_id <> p_customer_id
      and not cv.hidden
      and c.status not in ('deleted', 'merged')
      and not c.hidden
      and upper(cv.license_plate) = v_plate;

    insert into public.customer_vehicles(customer_id, license_plate, vehicle_name, hidden)
    values (p_customer_id, v_plate, nullif(btrim(p_default_vehicle_name), ''), false)
    on conflict on constraint customer_vehicles_customer_plate_unique_idx do update
    set hidden = false,
        vehicle_name = coalesce(nullif(btrim(p_default_vehicle_name), ''), public.customer_vehicles.vehicle_name),
        updated_at = now()
    returning id into v_vehicle_id;

    insert into public.customer_events(customer_id, actor_id, event_type, details)
    values (
      p_customer_id,
      auth.uid(),
      'customer_plate_imported',
      jsonb_build_object(
        'license_plate', v_plate,
        'vehicle_id', v_vehicle_id,
        'conflict_customer_count', v_conflict_count
      )
    );

    license_plate := v_plate;
    vehicle_id := v_vehicle_id;
    action := case when v_conflict_count > 0 then 'saved_with_conflict' else 'saved' end;
    conflict_customer_count := v_conflict_count;
    return next;
  end loop;
end;
$$;

grant execute on function public.cms_bulk_import_customer_plates(uuid, text[], text) to authenticated;
