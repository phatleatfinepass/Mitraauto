-- Allow public Rescue 24/7 intake through the RPC without granting anon
-- direct table access. The function executes as its owner and uses a locked
-- search_path so inserts into emergency_requests and emergency_request_events
-- succeed under RLS.

create or replace function public.emergency_roadside_create(
  p_phone text,
  p_lat numeric default null,
  p_lng numeric default null,
  p_street_address text default null,
  p_postcode text default null,
  p_city text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_id bigint;
begin
  if p_phone is null or length(trim(p_phone)) < 6 then
    raise exception 'phone_required';
  end if;

  insert into public.emergency_requests(
    user_id,
    lat,
    lng,
    street_address,
    postcode,
    city,
    phone,
    source
  )
  values (
    auth.uid(),
    p_lat,
    p_lng,
    p_street_address,
    p_postcode,
    p_city,
    trim(p_phone),
    'web'
  )
  returning id into v_id;

  insert into public.emergency_request_events(request_id, event_type, meta)
  values (
    v_id,
    'created',
    jsonb_build_object('source', 'web')
  );

  return jsonb_build_object(
    'request_id', v_id,
    'status', 'received'
  );
end
$function$;

grant execute on function public.emergency_roadside_create(
  text,
  numeric,
  numeric,
  text,
  text,
  text
) to anon, authenticated;
