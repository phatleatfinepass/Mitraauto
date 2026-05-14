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

  if v_role = 'admin' and v_module <> 'accounts' then
    return true;
  end if;

  if v_role = 'supervisor' and v_module <> 'customers' then
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
