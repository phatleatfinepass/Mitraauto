create extension if not exists pgcrypto;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'supervisor', 'staff', 'customer', 'user', 'disabled'));

alter table public.profiles
  add column if not exists cms_permissions jsonb not null default '{}'::jsonb,
  add column if not exists account_status text not null default 'active',
  add column if not exists account_hidden boolean not null default false,
  add column if not exists display_name text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'hidden', 'suspended', 'deleted'));

update public.profiles p
set role = 'supervisor',
    cms_permissions = jsonb_build_object(
      'customers', 'read_write',
      'accounts', 'none',
      'rescue', 'none',
      'schedule', 'none',
      'catalog_tires', 'none',
      'catalog_rims', 'none',
      'orders', 'none',
      'invoices', 'none'
    ),
    account_status = case when p.account_status = 'deleted' then p.account_status else 'active' end,
    account_hidden = false,
    updated_at = now()
where p.role in ('super_admin', 'admin', 'supervisor', 'staff')
  and not exists (
    select 1
    from auth.users u
    where u.id = p.id
      and lower(u.email) = 'phat.le@finepass.fi'
  );

update public.profiles
set role = 'super_admin',
    cms_permissions = jsonb_build_object(
      'rescue', 'read_write',
      'schedule', 'read_write',
      'catalog_tires', 'read_write',
      'catalog_rims', 'read_write',
      'orders', 'read_write',
      'invoices', 'read_write',
      'customers', 'read_write',
      'accounts', 'read_write'
    ),
    account_status = 'active',
    account_hidden = false
where id in (
  select u.id
  from auth.users u
  where lower(u.email) = 'phat.le@finepass.fi'
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  primary_email text,
  primary_phone text,
  full_name text,
  language text,
  business_id text,
  vat_id text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country_code text not null default 'FI',
  status text not null default 'active',
  tags text[] not null default '{}'::text[],
  marketing_consent boolean,
  contact_consent boolean,
  hidden boolean not null default false,
  source text not null default 'cms',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_status_check check (status in ('active', 'hidden', 'blocked', 'merged', 'deleted'))
);

create unique index if not exists customers_primary_email_unique_idx
  on public.customers (lower(primary_email))
  where primary_email is not null and primary_email <> '';

create index if not exists customers_primary_phone_idx
  on public.customers (primary_phone)
  where primary_phone is not null and primary_phone <> '';

create table if not exists public.customer_vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  license_plate text not null,
  vehicle_name text,
  vin text,
  notes text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_vehicles_customer_plate_unique_idx
  on public.customer_vehicles (customer_id, upper(license_plate));

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  body text not null,
  visibility text not null default 'internal',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint customer_notes_visibility_check check (visibility in ('internal', 'super_admin'))
);

create table if not exists public.customer_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cms_account_events (
  id uuid primary key default gen_random_uuid(),
  target_profile_id uuid references public.profiles(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.cms_is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select lower(u.email) = 'phat.le@finepass.fi'
     from auth.users u
     where u.id = auth.uid()),
    false
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
      and p.account_status = 'active'
  );
$$;

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
begin
  select p.role, p.account_status, p.cms_permissions ->> p_module
  into v_role, v_status, v_permission
  from public.profiles p
  where p.id = auth.uid();

  if public.cms_is_super_admin() then
    return true;
  end if;

  if v_status is distinct from 'active' then
    return false;
  end if;

  if v_role = 'admin' then
    return p_module <> 'accounts';
  end if;

  if v_role = 'supervisor' then
    if p_module <> 'customers' then
      return false;
    end if;
    return p_action in ('read', 'write');
  end if;

  if v_permission is null or v_permission = 'none' then
    return false;
  end if;

  if p_action = 'read' then
    return v_permission in ('read', 'read_write');
  end if;

  return v_permission = 'read_write';
end;
$$;

create or replace function public.cms_get_current_access()
returns table (
  user_id uuid,
  email text,
  role text,
  account_status text,
  is_super_admin boolean,
  can_manage_accounts boolean,
  can_manage_customers boolean
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
    public.cms_has_permission('accounts', 'write'),
    public.cms_has_permission('customers', 'write')
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = auth.uid();
$$;

create or replace function public.cms_list_staff_accounts()
returns table (
  id uuid,
  email text,
  display_name text,
  role text,
  account_status text,
  account_hidden boolean,
  cms_permissions jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.cms_has_permission('accounts', 'read') then
    raise exception 'Account management access required';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.display_name,
    p.role,
    p.account_status,
    p.account_hidden,
    p.cms_permissions,
    u.created_at,
    p.updated_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role in ('super_admin', 'admin', 'supervisor', 'staff', 'disabled')
  order by
    case p.role
      when 'super_admin' then 1
      when 'admin' then 2
      when 'supervisor' then 3
      when 'staff' then 4
      else 5
    end,
    lower(u.email);
end;
$$;

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
begin
  if not public.cms_has_permission('accounts', 'write') then
    raise exception 'Account management access required';
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

create or replace function public.cms_list_customer_overview(p_search text default null, p_limit integer default 80)
returns table (
  customer_key text,
  customer_id uuid,
  full_name text,
  email text,
  phone text,
  license_plates text[],
  booking_count integer,
  order_count integer,
  invoice_count integer,
  last_activity_at timestamptz,
  status text,
  source text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_search text := lower(nullif(btrim(p_search), ''));
  v_limit integer := least(greatest(coalesce(p_limit, 80), 1), 200);
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  return query
  with booking_customers as (
    select
      lower(nullif(btrim(customer_email), '')) as email,
      nullif(btrim(customer_phone), '') as phone,
      nullif(btrim(customer_name), '') as full_name,
      array_remove(array_agg(distinct nullif(upper(btrim(license_plate)), '')), null) as plates,
      count(*)::integer as booking_count,
      0::integer as order_count,
      0::integer as invoice_count,
      max(created_at)::timestamptz as last_activity_at
    from public.bookings
    group by 1, 2, 3
  ),
  order_customers as (
    select
      lower(nullif(btrim(coalesce(customer_email, email, cart_snapshot #>> '{customer,email}', cart_snapshot #>> '{billing,email}')), '')) as email,
      nullif(btrim(coalesce(customer_phone, phone, cart_snapshot #>> '{customer,phone}', cart_snapshot #>> '{billing,phone}')), '') as phone,
      nullif(btrim(coalesce(
        nullif(btrim(concat_ws(' ', customer_first_name, customer_last_name)), ''),
        cart_snapshot #>> '{customer,name}',
        nullif(btrim(concat_ws(' ', cart_snapshot #>> '{customer,firstName}', cart_snapshot #>> '{customer,lastName}')), '')
      )), '') as full_name,
      '{}'::text[] as plates,
      0::integer as booking_count,
      count(*)::integer as order_count,
      0::integer as invoice_count,
      max(created_at)::timestamptz as last_activity_at
    from public.orders
    group by 1, 2, 3
  ),
  invoice_customers as (
    select
      lower(nullif(btrim(customer_email), '')) as email,
      nullif(btrim(customer_phone), '') as phone,
      nullif(btrim(customer_name), '') as full_name,
      '{}'::text[] as plates,
      0::integer as booking_count,
      0::integer as order_count,
      count(*)::integer as invoice_count,
      max(created_at)::timestamptz as last_activity_at
    from public.invoice_document_summaries
    group by 1, 2, 3
  ),
  manual_customers as (
    select
      lower(nullif(btrim(primary_email), '')) as email,
      nullif(btrim(primary_phone), '') as phone,
      nullif(btrim(full_name), '') as full_name,
      coalesce(
        (select array_remove(array_agg(distinct nullif(upper(btrim(v.license_plate)), '')), null)
         from public.customer_vehicles v
         where v.customer_id = c.id and not v.hidden),
        '{}'::text[]
      ) as plates,
      0::integer as booking_count,
      0::integer as order_count,
      0::integer as invoice_count,
      c.updated_at::timestamptz as last_activity_at
    from public.customers c
    where not c.hidden and c.status <> 'deleted'
  ),
  combined as (
    select * from booking_customers
    union all select * from order_customers
    union all select * from invoice_customers
    union all select * from manual_customers
  ),
  rolled as (
    select
      coalesce(email, phone, lower(full_name), 'unknown') as customer_key,
      max(full_name) filter (where full_name is not null) as full_name,
      max(email) filter (where email is not null) as email,
      max(phone) filter (where phone is not null) as phone,
      array_remove(array_agg(distinct plate), null) as license_plates,
      sum(booking_count)::integer as booking_count,
      sum(order_count)::integer as order_count,
      sum(invoice_count)::integer as invoice_count,
      max(last_activity_at)::timestamptz as last_activity_at
    from combined
    left join lateral unnest(combined.plates) as plate on true
    where coalesce(email, phone, full_name) is not null
    group by coalesce(email, phone, lower(full_name), 'unknown')
  )
  select
    r.customer_key,
    c.id as customer_id,
    coalesce(c.full_name, r.full_name, 'Customer') as full_name,
    coalesce(c.primary_email, r.email) as email,
    coalesce(c.primary_phone, r.phone) as phone,
    r.license_plates,
    r.booking_count,
    r.order_count,
    r.invoice_count,
    greatest(
      coalesce(r.last_activity_at, '-infinity'::timestamptz),
      coalesce(c.updated_at, '-infinity'::timestamptz)
    )::timestamptz as last_activity_at,
    coalesce(c.status, 'active') as status,
    case when c.id is null then 'activity' else 'customer_record' end as source
  from rolled r
  left join public.customers c
    on lower(c.primary_email) = r.email
    or (c.primary_email is null and c.primary_phone = r.phone)
  where v_search is null
    or lower(coalesce(c.full_name, r.full_name, '')) like '%' || v_search || '%'
    or lower(coalesce(c.primary_email, r.email, '')) like '%' || v_search || '%'
    or lower(coalesce(c.primary_phone, r.phone, '')) like '%' || v_search || '%'
    or exists (
      select 1 from unnest(r.license_plates) as p
      where lower(p) like '%' || v_search || '%'
    )
  order by greatest(
    coalesce(r.last_activity_at, '-infinity'::timestamptz),
    coalesce(c.updated_at, '-infinity'::timestamptz)
  ) desc nulls last
  limit v_limit;
end;
$$;

alter table public.customers enable row level security;
alter table public.customer_vehicles enable row level security;
alter table public.customer_notes enable row level security;
alter table public.customer_events enable row level security;
alter table public.cms_account_events enable row level security;

drop policy if exists "CMS customers read" on public.customers;
create policy "CMS customers read"
on public.customers for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS customers insert" on public.customers;
create policy "CMS customers insert"
on public.customers for insert
to authenticated
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "CMS customers update" on public.customers;
create policy "CMS customers update"
on public.customers for update
to authenticated
using (public.cms_has_permission('customers', 'write'))
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "CMS customer vehicles read" on public.customer_vehicles;
create policy "CMS customer vehicles read"
on public.customer_vehicles for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS customer vehicles write" on public.customer_vehicles;
create policy "CMS customer vehicles write"
on public.customer_vehicles for all
to authenticated
using (public.cms_has_permission('customers', 'write'))
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "CMS customer notes read" on public.customer_notes;
create policy "CMS customer notes read"
on public.customer_notes for select
to authenticated
using (
  public.cms_has_permission('customers', 'read')
  and (visibility = 'internal' or public.cms_is_super_admin())
);

drop policy if exists "CMS customer notes insert" on public.customer_notes;
create policy "CMS customer notes insert"
on public.customer_notes for insert
to authenticated
with check (
  public.cms_has_permission('customers', 'write')
  and (visibility = 'internal' or public.cms_is_super_admin())
);

drop policy if exists "CMS customer events read" on public.customer_events;
create policy "CMS customer events read"
on public.customer_events for select
to authenticated
using (public.cms_has_permission('customers', 'read'));

drop policy if exists "CMS customer events insert" on public.customer_events;
create policy "CMS customer events insert"
on public.customer_events for insert
to authenticated
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "CMS account events super admin read" on public.cms_account_events;
create policy "CMS account events super admin read"
on public.cms_account_events for select
to authenticated
using (public.cms_has_permission('accounts', 'read'));

grant select, insert, update on public.customers to authenticated;
grant select, insert, update, delete on public.customer_vehicles to authenticated;
grant select, insert on public.customer_notes to authenticated;
grant select, insert on public.customer_events to authenticated;
grant select on public.cms_account_events to authenticated;
grant execute on function public.cms_is_super_admin() to authenticated;
grant execute on function public.cms_has_permission(text, text) to authenticated;
grant execute on function public.cms_get_current_access() to authenticated;
grant execute on function public.cms_list_staff_accounts() to authenticated;
grant execute on function public.cms_update_staff_account(uuid, text, text, boolean, text, jsonb) to authenticated;
grant execute on function public.cms_list_customer_overview(text, integer) to authenticated;
