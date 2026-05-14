create or replace function public.cms_lookup_customer_vehicle_by_plate(p_license_plate text)
returns table (
  vehicle_id uuid,
  customer_id uuid,
  license_plate text,
  vehicle_name text,
  vin text,
  notes text,
  hidden boolean,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_compact_plate text := upper(regexp_replace(coalesce(p_license_plate, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  if length(v_compact_plate) < 2 then
    raise exception 'License plate is required';
  end if;

  return query
  select
    cv.id as vehicle_id,
    cv.customer_id,
    cv.license_plate,
    cv.vehicle_name,
    cv.vin,
    cv.notes,
    cv.hidden,
    c.full_name as customer_name,
    c.primary_email as customer_email,
    c.primary_phone as customer_phone,
    c.status as customer_status,
    cv.updated_at
  from public.customer_vehicles cv
  join public.customers c on c.id = cv.customer_id
  where upper(regexp_replace(coalesce(cv.license_plate, ''), '[^A-Za-z0-9]', '', 'g')) = v_compact_plate
    and c.status not in ('deleted', 'merged')
  order by cv.hidden asc, c.hidden asc, cv.updated_at desc nulls last, cv.created_at desc nulls last
  limit 1;
end;
$$;

revoke all on function public.cms_lookup_customer_vehicle_by_plate(text) from public;
grant execute on function public.cms_lookup_customer_vehicle_by_plate(text) to authenticated;
