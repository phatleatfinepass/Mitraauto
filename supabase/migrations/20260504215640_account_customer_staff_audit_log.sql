create or replace function public.cms_list_account_events(
  p_target_profile_id uuid default null,
  p_limit integer default 80
)
returns table (
  id uuid,
  target_profile_id uuid,
  target_email text,
  actor_id uuid,
  actor_email text,
  event_type text,
  details jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 80), 1), 200);
begin
  if not public.cms_has_permission('accounts', 'read') then
    raise exception 'Account management access required';
  end if;

  return query
  select
    e.id,
    e.target_profile_id,
    target_user.email::text as target_email,
    e.actor_id,
    actor_user.email::text as actor_email,
    e.event_type,
    e.details,
    e.created_at
  from public.cms_account_events e
  left join auth.users target_user on target_user.id = e.target_profile_id
  left join auth.users actor_user on actor_user.id = e.actor_id
  where p_target_profile_id is null
    or e.target_profile_id = p_target_profile_id
  order by e.created_at desc
  limit v_limit;
end;
$$;

grant execute on function public.cms_list_account_events(uuid, integer) to authenticated;
