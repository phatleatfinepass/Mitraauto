create or replace function public.cms_update_staff_account(
  p_profile_id uuid,
  p_role text,
  p_account_status text,
  p_account_hidden boolean,
  p_display_name text default null,
  p_cms_permissions jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_role text;
  v_actor_status text;
  v_actor_is_super_admin boolean;
  v_current_role text;
  v_current_permissions jsonb;
begin
  if not public.cms_has_permission('accounts', 'write') then
    raise exception 'Account management access required';
  end if;

  select role, account_status
  into v_actor_role, v_actor_status
  from public.profiles
  where id = auth.uid();

  v_actor_is_super_admin := coalesce(v_actor_role, '') = 'super_admin'
    and coalesce(v_actor_status, '') = 'active';

  select role, cms_permissions
  into v_current_role, v_current_permissions
  from public.profiles
  where id = p_profile_id;

  if not found then
    raise exception 'Target account not found';
  end if;

  if p_profile_id = auth.uid() and (p_account_status <> 'active' or p_role <> 'super_admin') then
    raise exception 'Cannot remove your own super admin access';
  end if;

  if p_role not in ('super_admin', 'admin', 'supervisor', 'staff', 'customer', 'user', 'disabled') then
    raise exception 'Invalid role';
  end if;

  if p_account_status not in ('active', 'hidden', 'suspended', 'deleted') then
    raise exception 'Invalid account status';
  end if;

  if not v_actor_is_super_admin then
    if p_account_status = 'deleted' then
      raise exception 'Only super admin can delete staff accounts';
    end if;

    if p_role is distinct from v_current_role then
      raise exception 'Only super admin can change staff roles';
    end if;

    if coalesce(p_cms_permissions, '{}'::jsonb) is distinct from coalesce(v_current_permissions, '{}'::jsonb) then
      raise exception 'Only super admin can change module permissions';
    end if;
  end if;

  update public.profiles
  set role = p_role,
      account_status = p_account_status,
      account_hidden = coalesce(p_account_hidden, false),
      display_name = nullif(btrim(p_display_name), ''),
      cms_permissions = coalesce(p_cms_permissions, '{}'::jsonb),
      updated_at = now()
  where id = p_profile_id;

  insert into public.cms_account_events(target_profile_id, actor_id, event_type, details)
  values (
    p_profile_id,
    auth.uid(),
    'staff_account_updated',
    jsonb_build_object(
      'role', p_role,
      'account_status', p_account_status,
      'account_hidden', coalesce(p_account_hidden, false)
    )
  );
end;
$$;

grant execute on function public.cms_update_staff_account(uuid, text, text, boolean, text, jsonb) to authenticated;
