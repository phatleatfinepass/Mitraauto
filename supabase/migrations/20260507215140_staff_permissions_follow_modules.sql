create or replace function public.cms_has_permission(p_module text, p_action text default 'read')
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role text;
  v_status text;
  v_permission text;
  v_module text := nullif(btrim(coalesce(p_module, '')), '');
  v_action text := lower(nullif(btrim(coalesce(p_action, 'read')), ''));
begin
  if v_module not in ('rescue', 'schedule', 'catalog_tires', 'catalog_rims', 'orders', 'invoices', 'customers', 'accounts') then
    return false;
  end if;

  if v_action not in ('read', 'write') then
    return false;
  end if;

  select p.role, p.account_status, p.cms_permissions ->> v_module
  into v_role, v_status, v_permission
  from public.profiles p
  where p.id = auth.uid();

  if v_status is distinct from 'active' then
    return false;
  end if;

  if v_action = 'write' and not public.cms_has_verified_mfa() then
    return false;
  end if;

  if v_role = 'super_admin' then
    return true;
  end if;

  if v_role not in ('admin', 'supervisor', 'staff') then
    return false;
  end if;

  if v_permission is null or v_permission = 'none' then
    return false;
  end if;

  if v_action = 'read' then
    return v_permission in ('read', 'read_write');
  end if;

  return v_permission = 'read_write';
end;
$$;

grant execute on function public.cms_has_permission(text, text) to authenticated;

drop function if exists public.cms_get_current_access();

create or replace function public.cms_get_current_access()
returns table (
  user_id uuid,
  email text,
  role text,
  account_status text,
  is_super_admin boolean,
  can_manage_accounts boolean,
  can_manage_customers boolean,
  cms_permissions jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    auth.uid(),
    u.email::text,
    coalesce(p.role, 'user')::text,
    coalesce(p.account_status, 'active')::text,
    public.cms_is_super_admin(),
    public.cms_has_permission('accounts', 'read'),
    public.cms_has_permission('customers', 'read'),
    coalesce(p.cms_permissions, '{}'::jsonb)
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid();
$$;

grant execute on function public.cms_get_current_access() to authenticated;
