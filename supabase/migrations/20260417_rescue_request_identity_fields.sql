alter table public.emergency_requests
  add column if not exists customer_name text,
  add column if not exists license_plate text;

create or replace function public.emergency_roadside_create(
  p_phone text,
  p_lat double precision default null,
  p_lng double precision default null,
  p_street_address text default null,
  p_postcode text default null,
  p_city text default null,
  p_customer_name text default null,
  p_license_plate text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_id bigint;
  v_source text;
begin
  if p_phone is null or btrim(p_phone) = '' then
    raise exception 'Phone is required';
  end if;

  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'Customer name is required';
  end if;

  if p_license_plate is null or btrim(p_license_plate) = '' then
    raise exception 'License plate is required';
  end if;

  if p_lat is not null and p_lng is not null then
    v_source := 'gps';
  elsif p_street_address is not null and p_postcode is not null and p_city is not null then
    v_source := 'manual';
  else
    raise exception 'Location is required';
  end if;

  insert into public.emergency_requests (
    phone,
    lat,
    lng,
    street_address,
    postcode,
    city,
    customer_name,
    license_plate,
    source,
    status,
    priority
  )
  values (
    btrim(p_phone),
    p_lat,
    p_lng,
    nullif(btrim(coalesce(p_street_address, '')), ''),
    nullif(btrim(coalesce(p_postcode, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    btrim(p_customer_name),
    upper(btrim(p_license_plate)),
    v_source,
    'received',
    0
  )
  returning id into v_request_id;

  insert into public.emergency_request_events (
    request_id,
    event_type,
    meta
  )
  values (
    v_request_id,
    'received',
    json_build_object(
      'source', v_source,
      'customer_name', btrim(p_customer_name),
      'license_plate', upper(btrim(p_license_plate))
    )
  );

  return json_build_object(
    'request_id', v_request_id,
    'status', 'received'
  );
end;
$$;

grant execute on function public.emergency_roadside_create(
  text,
  double precision,
  double precision,
  text,
  text,
  text,
  text,
  text
) to anon, authenticated;
