create or replace function public.cms_add_staff_account_by_email(
  p_email text,
  p_role text default 'supervisor',
  p_display_name text default null,
  p_cms_permissions jsonb default '{"customers":"read_write","accounts":"none","rescue":"none","schedule":"none","catalog_tires":"none","catalog_rims":"none","orders":"none","invoices":"none"}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text := lower(nullif(btrim(p_email), ''));
begin
  if not public.cms_has_permission('accounts', 'write') then
    raise exception 'Account management access required';
  end if;

  if v_email is null then
    raise exception 'Email is required';
  end if;

  if p_role not in ('super_admin', 'admin', 'supervisor', 'staff', 'customer', 'user', 'disabled') then
    raise exception 'Invalid role';
  end if;

  select id
  into v_user_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_user_id is null then
    raise exception 'Auth user not found. Ask the user to sign up or create the auth user first.';
  end if;

  insert into public.profiles (
    id,
    role,
    display_name,
    cms_permissions,
    account_status,
    account_hidden,
    updated_at
  )
  values (
    v_user_id,
    p_role,
    nullif(btrim(p_display_name), ''),
    coalesce(p_cms_permissions, '{}'::jsonb),
    'active',
    false,
    now()
  )
  on conflict (id) do update
  set role = excluded.role,
      display_name = excluded.display_name,
      cms_permissions = excluded.cms_permissions,
      account_status = 'active',
      account_hidden = false,
      updated_at = now();

  insert into public.cms_account_events(target_profile_id, actor_id, event_type, details)
  values (
    v_user_id,
    auth.uid(),
    'staff_account_added',
    jsonb_build_object('email', v_email, 'role', p_role)
  );

  return v_user_id;
end;
$$;

grant execute on function public.cms_add_staff_account_by_email(text, text, text, jsonb) to authenticated;
