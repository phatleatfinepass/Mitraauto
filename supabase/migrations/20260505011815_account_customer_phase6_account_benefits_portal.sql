alter table public.customers
  add column if not exists account_id uuid references auth.users(id) on delete set null,
  add column if not exists portal_enabled boolean not null default false,
  add column if not exists portal_invited_at timestamptz;

create unique index if not exists customers_account_id_unique_idx
  on public.customers(account_id)
  where account_id is not null;

create table if not exists public.customer_benefits (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  tier text not null default 'bronze',
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint customer_benefits_tier_check check (tier in ('bronze', 'silver', 'gold', 'platinum'))
);

create table if not exists public.customer_benefit_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  points_delta integer not null,
  balance_after integer not null,
  tier_after text not null,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  adjusted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint customer_benefit_events_tier_check check (tier_after in ('bronze', 'silver', 'gold', 'platinum'))
);

create table if not exists public.customer_service_book_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
  entry_type text not null,
  title text not null,
  description text,
  work_date date,
  mileage_km integer check (mileage_km is null or mileage_km >= 0),
  parts jsonb not null default '[]'::jsonb,
  source_type text,
  source_id uuid,
  invoice_id uuid,
  booking_id uuid,
  staff_notes text,
  visible_to_customer boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_service_book_entries_type_check check (entry_type in ('maintenance', 'service', 'inspection', 'estimate', 'repair', 'tire', 'cleaning', 'note'))
);

create index if not exists customer_service_book_entries_customer_idx
  on public.customer_service_book_entries(customer_id, work_date desc nulls last, created_at desc);

create index if not exists customer_service_book_entries_vehicle_idx
  on public.customer_service_book_entries(customer_vehicle_id)
  where customer_vehicle_id is not null;

create table if not exists public.customer_maintenance_reminders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  customer_vehicle_id uuid references public.customer_vehicles(id) on delete cascade,
  reminder_type text not null,
  title text not null,
  description text,
  due_date date,
  due_mileage_km integer check (due_mileage_km is null or due_mileage_km >= 0),
  last_known_mileage_km integer check (last_known_mileage_km is null or last_known_mileage_km >= 0),
  status text not null default 'active',
  service_critical boolean not null default true,
  next_email_at timestamptz,
  last_email_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_maintenance_reminders_status_check check (status in ('active', 'paused', 'sent', 'completed', 'cancelled'))
);

create index if not exists customer_maintenance_reminders_customer_idx
  on public.customer_maintenance_reminders(customer_id, status, due_date nulls last);

create table if not exists public.customer_notification_history (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
  reminder_id uuid references public.customer_maintenance_reminders(id) on delete set null,
  notification_type text not null,
  channel text not null default 'email',
  recipient text not null,
  subject text,
  status text not null default 'queued',
  provider_message_id text,
  sent_at timestamptz,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint customer_notification_history_status_check check (status in ('queued', 'sent', 'failed', 'cancelled')),
  constraint customer_notification_history_channel_check check (channel in ('email', 'sms', 'push', 'phone', 'internal'))
);

create index if not exists customer_notification_history_customer_idx
  on public.customer_notification_history(customer_id, created_at desc);

alter table public.customer_benefits enable row level security;
alter table public.customer_benefit_events enable row level security;
alter table public.customer_service_book_entries enable row level security;
alter table public.customer_maintenance_reminders enable row level security;
alter table public.customer_notification_history enable row level security;

drop policy if exists "customer_benefits_cms_read" on public.customer_benefits;
create policy "customer_benefits_cms_read"
on public.customer_benefits
for select
to authenticated
using (
  public.cms_has_permission('customers', 'read')
  or exists (
    select 1 from public.customers c
    where c.id = customer_benefits.customer_id
      and c.account_id = auth.uid()
      and c.portal_enabled
      and c.status = 'active'
      and not c.hidden
  )
);

drop policy if exists "customer_benefits_cms_write" on public.customer_benefits;
create policy "customer_benefits_cms_write"
on public.customer_benefits
for all
to authenticated
using (public.cms_has_permission('customers', 'write'))
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "customer_benefit_events_cms_read" on public.customer_benefit_events;
create policy "customer_benefit_events_cms_read"
on public.customer_benefit_events
for select
to authenticated
using (
  public.cms_has_permission('customers', 'read')
  or exists (
    select 1 from public.customers c
    where c.id = customer_benefit_events.customer_id
      and c.account_id = auth.uid()
      and c.portal_enabled
      and c.status = 'active'
      and not c.hidden
  )
);

drop policy if exists "customer_benefit_events_cms_insert" on public.customer_benefit_events;
create policy "customer_benefit_events_cms_insert"
on public.customer_benefit_events
for insert
to authenticated
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "customer_service_book_entries_read" on public.customer_service_book_entries;
create policy "customer_service_book_entries_read"
on public.customer_service_book_entries
for select
to authenticated
using (
  public.cms_has_permission('customers', 'read')
  or (
    visible_to_customer
    and exists (
      select 1 from public.customers c
      where c.id = customer_service_book_entries.customer_id
        and c.account_id = auth.uid()
        and c.portal_enabled
        and c.status = 'active'
        and not c.hidden
    )
  )
);

drop policy if exists "customer_service_book_entries_cms_write" on public.customer_service_book_entries;
create policy "customer_service_book_entries_cms_write"
on public.customer_service_book_entries
for all
to authenticated
using (public.cms_has_permission('customers', 'write'))
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "customer_maintenance_reminders_read" on public.customer_maintenance_reminders;
create policy "customer_maintenance_reminders_read"
on public.customer_maintenance_reminders
for select
to authenticated
using (
  public.cms_has_permission('customers', 'read')
  or exists (
    select 1 from public.customers c
    where c.id = customer_maintenance_reminders.customer_id
      and c.account_id = auth.uid()
      and c.portal_enabled
      and c.status = 'active'
      and not c.hidden
  )
);

drop policy if exists "customer_maintenance_reminders_cms_write" on public.customer_maintenance_reminders;
create policy "customer_maintenance_reminders_cms_write"
on public.customer_maintenance_reminders
for all
to authenticated
using (public.cms_has_permission('customers', 'write'))
with check (public.cms_has_permission('customers', 'write'));

drop policy if exists "customer_notification_history_read" on public.customer_notification_history;
create policy "customer_notification_history_read"
on public.customer_notification_history
for select
to authenticated
using (
  public.cms_has_permission('customers', 'read')
  or exists (
    select 1 from public.customers c
    where c.id = customer_notification_history.customer_id
      and c.account_id = auth.uid()
      and c.portal_enabled
      and c.status = 'active'
      and not c.hidden
  )
);

drop policy if exists "customer_notification_history_cms_write" on public.customer_notification_history;
create policy "customer_notification_history_cms_write"
on public.customer_notification_history
for all
to authenticated
using (public.cms_has_permission('customers', 'write'))
with check (public.cms_has_permission('customers', 'write'));

grant select, insert, update, delete on table public.customer_benefits to authenticated;
grant select, insert on table public.customer_benefit_events to authenticated;
grant select, insert, update, delete on table public.customer_service_book_entries to authenticated;
grant select, insert, update, delete on table public.customer_maintenance_reminders to authenticated;
grant select, insert, update, delete on table public.customer_notification_history to authenticated;

create or replace function public.customer_benefit_tier_for_points(p_points integer)
returns table (tier text, discount_percent numeric)
language sql
immutable
as $$
  select
    case
      when coalesce(p_points, 0) >= 2000 then 'platinum'
      when coalesce(p_points, 0) >= 1000 then 'gold'
      when coalesce(p_points, 0) >= 500 then 'silver'
      else 'bronze'
    end::text,
    case
      when coalesce(p_points, 0) >= 2000 then 15
      when coalesce(p_points, 0) >= 1000 then 10
      when coalesce(p_points, 0) >= 500 then 5
      else 0
    end::numeric;
$$;

create or replace function public.cms_adjust_customer_benefit_points(
  p_customer_id uuid,
  p_points_delta integer,
  p_reason text,
  p_details jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_points integer;
  v_next_points integer;
  v_lifetime_points integer;
  v_tier text;
  v_discount numeric;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_customer_id is null or not exists (
    select 1 from public.customers where id = p_customer_id and status not in ('deleted', 'merged')
  ) then
    raise exception 'Customer not found';
  end if;

  if coalesce(p_points_delta, 0) = 0 then
    raise exception 'Point adjustment cannot be zero';
  end if;

  if v_reason is null then
    raise exception 'Point adjustment reason is required';
  end if;

  insert into public.customer_benefits(customer_id, points_balance, lifetime_points, tier, discount_percent, updated_by)
  values (p_customer_id, 0, 0, 'bronze', 0, auth.uid())
  on conflict (customer_id) do nothing;

  select points_balance, lifetime_points
  into v_current_points, v_lifetime_points
  from public.customer_benefits
  where customer_id = p_customer_id
  for update;

  v_next_points := greatest(0, coalesce(v_current_points, 0) + p_points_delta);
  v_lifetime_points := greatest(coalesce(v_lifetime_points, 0), coalesce(v_lifetime_points, 0) + greatest(p_points_delta, 0));

  select tier, discount_percent
  into v_tier, v_discount
  from public.customer_benefit_tier_for_points(v_next_points);

  update public.customer_benefits
  set points_balance = v_next_points,
      lifetime_points = v_lifetime_points,
      tier = v_tier,
      discount_percent = v_discount,
      updated_by = auth.uid(),
      updated_at = now()
  where customer_id = p_customer_id;

  insert into public.customer_benefit_events(customer_id, points_delta, balance_after, tier_after, reason, details, adjusted_by)
  values (p_customer_id, p_points_delta, v_next_points, v_tier, v_reason, coalesce(p_details, '{}'::jsonb), auth.uid());

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_benefit_points_adjusted',
    jsonb_build_object(
      'points_delta', p_points_delta,
      'balance_after', v_next_points,
      'tier_after', v_tier,
      'discount_percent', v_discount,
      'reason', v_reason
    )
  );

  return jsonb_build_object(
    'customer_id', p_customer_id,
    'points_balance', v_next_points,
    'lifetime_points', v_lifetime_points,
    'tier', v_tier,
    'discount_percent', v_discount
  );
end;
$$;

create or replace function public.cms_link_customer_account_by_email(
  p_customer_id uuid,
  p_email text,
  p_portal_enabled boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(nullif(btrim(p_email), ''));
  v_account_id uuid;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if v_email is null then
    raise exception 'Email is required';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id and status not in ('deleted', 'merged')) then
    raise exception 'Customer not found';
  end if;

  select u.id into v_account_id
  from auth.users u
  where lower(u.email) = v_email
  limit 1;

  if v_account_id is null then
    raise exception 'Auth account not found for email %', v_email;
  end if;

  if exists (
    select 1
    from public.customers c
    where c.account_id = v_account_id
      and c.id <> p_customer_id
      and c.status not in ('deleted', 'merged')
  ) then
    raise exception 'Auth account is already linked to another customer';
  end if;

  update public.customers
  set account_id = v_account_id,
      portal_enabled = coalesce(p_portal_enabled, true),
      portal_invited_at = coalesce(portal_invited_at, now()),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_account_linked',
    jsonb_build_object('account_id', v_account_id, 'email', v_email, 'portal_enabled', coalesce(p_portal_enabled, true))
  );

  return v_account_id;
end;
$$;

create or replace function public.cms_set_customer_portal_enabled(
  p_customer_id uuid,
  p_portal_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  update public.customers
  set portal_enabled = coalesce(p_portal_enabled, false),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id
    and status not in ('deleted', 'merged');

  if not found then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_portal_access_changed',
    jsonb_build_object('portal_enabled', coalesce(p_portal_enabled, false))
  );
end;
$$;

drop function if exists public.cms_list_customer_overview_v2(text, integer, text, text, boolean);

create or replace function public.cms_list_customer_overview_v2(
  p_search text default null,
  p_limit integer default 120,
  p_status text default null,
  p_tag text default null,
  p_include_hidden boolean default false
)
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
  source text,
  hidden boolean,
  tags text[],
  account_id uuid,
  account_email text,
  portal_enabled boolean,
  benefit_points integer,
  benefit_tier text,
  benefit_discount_percent numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_search text := lower(nullif(btrim(p_search), ''));
  v_status text := lower(nullif(btrim(p_status), ''));
  v_tag text := lower(nullif(btrim(p_tag), ''));
  v_limit integer := least(greatest(coalesce(p_limit, 120), 1), 200);
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  return query
  with booking_customers as (
    select
      lower(nullif(btrim(b.customer_email), '')) as row_email,
      nullif(btrim(b.customer_phone), '') as row_phone,
      nullif(btrim(b.customer_name), '') as row_full_name,
      array_remove(array_agg(distinct nullif(upper(btrim(b.license_plate)), '')), null) as row_plates,
      count(*)::integer as row_booking_count,
      0::integer as row_order_count,
      0::integer as row_invoice_count,
      max(b.created_at)::timestamptz as row_last_activity_at
    from public.bookings b
    group by 1, 2, 3
  ),
  order_customers as (
    select
      lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) as row_email,
      nullif(btrim(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}')), '') as row_phone,
      nullif(btrim(coalesce(
        o.cart_snapshot #>> '{customer,name}',
        nullif(btrim(concat_ws(' ', o.cart_snapshot #>> '{customer,firstName}', o.cart_snapshot #>> '{customer,lastName}')), '')
      )), '') as row_full_name,
      '{}'::text[] as row_plates,
      0::integer as row_booking_count,
      count(*)::integer as row_order_count,
      0::integer as row_invoice_count,
      max(o.created_at)::timestamptz as row_last_activity_at
    from public.orders o
    group by 1, 2, 3
  ),
  invoice_customers as (
    select
      lower(nullif(btrim(i.customer_email), '')) as row_email,
      nullif(btrim(i.customer_phone), '') as row_phone,
      nullif(btrim(i.customer_name), '') as row_full_name,
      '{}'::text[] as row_plates,
      0::integer as row_booking_count,
      0::integer as row_order_count,
      count(*)::integer as row_invoice_count,
      max(i.created_at)::timestamptz as row_last_activity_at
    from public.invoice_document_summaries i
    group by 1, 2, 3
  ),
  manual_customers as (
    select
      lower(nullif(btrim(c.primary_email), '')) as row_email,
      nullif(btrim(c.primary_phone), '') as row_phone,
      nullif(btrim(c.full_name), '') as row_full_name,
      coalesce(
        (select array_remove(array_agg(distinct nullif(upper(btrim(v.license_plate)), '')), null)
         from public.customer_vehicles v
         where v.customer_id = c.id and (p_include_hidden or not v.hidden)),
        '{}'::text[]
      ) as row_plates,
      0::integer as row_booking_count,
      0::integer as row_order_count,
      0::integer as row_invoice_count,
      c.updated_at::timestamptz as row_last_activity_at
    from public.customers c
    where (p_include_hidden or (not c.hidden and c.status <> 'deleted'))
  ),
  combined as (
    select * from booking_customers
    union all select * from order_customers
    union all select * from invoice_customers
    union all select * from manual_customers
  ),
  rolled as (
    select
      coalesce(combined.row_email, combined.row_phone, lower(combined.row_full_name), 'unknown') as rolled_customer_key,
      max(combined.row_full_name) filter (where combined.row_full_name is not null) as rolled_full_name,
      max(combined.row_email) filter (where combined.row_email is not null) as rolled_email,
      max(combined.row_phone) filter (where combined.row_phone is not null) as rolled_phone,
      array_remove(array_agg(distinct plate), null) as rolled_license_plates,
      sum(combined.row_booking_count)::integer as rolled_booking_count,
      sum(combined.row_order_count)::integer as rolled_order_count,
      sum(combined.row_invoice_count)::integer as rolled_invoice_count,
      max(combined.row_last_activity_at)::timestamptz as rolled_last_activity_at
    from combined
    left join lateral unnest(combined.row_plates) as plate on true
    where coalesce(combined.row_email, combined.row_phone, combined.row_full_name) is not null
    group by coalesce(combined.row_email, combined.row_phone, lower(combined.row_full_name), 'unknown')
  )
  select
    r.rolled_customer_key,
    c.id as customer_id,
    coalesce(c.full_name, r.rolled_full_name, 'Customer') as full_name,
    coalesce(c.primary_email, r.rolled_email) as email,
    coalesce(c.primary_phone, r.rolled_phone) as phone,
    r.rolled_license_plates,
    r.rolled_booking_count,
    r.rolled_order_count,
    r.rolled_invoice_count,
    nullif(
      greatest(
        coalesce(r.rolled_last_activity_at, '-infinity'::timestamptz),
        coalesce(c.updated_at, '-infinity'::timestamptz)
      ),
      '-infinity'::timestamptz
    )::timestamptz as last_activity_at,
    coalesce(c.status, 'active') as status,
    case when c.id is null then 'activity' else 'customer_record' end as source,
    coalesce(c.hidden, false) as hidden,
    coalesce(c.tags, '{}'::text[]) as tags,
    c.account_id,
    au.email::text as account_email,
    coalesce(c.portal_enabled, false) as portal_enabled,
    coalesce(cb.points_balance, 0) as benefit_points,
    coalesce(cb.tier, 'bronze') as benefit_tier,
    coalesce(cb.discount_percent, 0) as benefit_discount_percent
  from rolled r
  left join public.customers c
    on lower(c.primary_email) = r.rolled_email
    or (c.primary_email is null and c.primary_phone = r.rolled_phone)
  left join auth.users au on au.id = c.account_id
  left join public.customer_benefits cb on cb.customer_id = c.id
  where (p_include_hidden or c.id is null or (not c.hidden and c.status <> 'deleted'))
    and (v_status is null or lower(coalesce(c.status, 'active')) = v_status)
    and (v_tag is null or exists (
      select 1 from unnest(coalesce(c.tags, '{}'::text[])) as tag
      where lower(tag) = v_tag
    ))
    and (
      v_search is null
      or lower(coalesce(c.full_name, r.rolled_full_name, '')) like '%' || v_search || '%'
      or lower(coalesce(c.primary_email, r.rolled_email, '')) like '%' || v_search || '%'
      or lower(coalesce(c.primary_phone, r.rolled_phone, '')) like '%' || v_search || '%'
      or lower(coalesce(au.email, '')) like '%' || v_search || '%'
      or exists (
        select 1 from unnest(r.rolled_license_plates) as p
        where lower(p) like '%' || v_search || '%'
      )
      or exists (
        select 1 from unnest(coalesce(c.tags, '{}'::text[])) as tag
        where lower(tag) like '%' || v_search || '%'
      )
    )
  order by greatest(
    coalesce(r.rolled_last_activity_at, '-infinity'::timestamptz),
    coalesce(c.updated_at, '-infinity'::timestamptz)
  ) desc nulls last
  limit v_limit;
end;
$$;

create or replace function public.cms_get_customer_detail(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer jsonb;
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  select jsonb_build_object(
    'id', c.id,
    'customer_type', c.customer_type,
    'account_id', c.account_id,
    'account_email', au.email,
    'portal_enabled', c.portal_enabled,
    'portal_invited_at', c.portal_invited_at,
    'benefits', jsonb_build_object(
      'points_balance', coalesce(cb.points_balance, 0),
      'lifetime_points', coalesce(cb.lifetime_points, 0),
      'tier', coalesce(cb.tier, 'bronze'),
      'discount_percent', coalesce(cb.discount_percent, 0),
      'updated_at', cb.updated_at
    ),
    'primary_email', c.primary_email,
    'primary_phone', c.primary_phone,
    'full_name', c.full_name,
    'language', c.language,
    'business_id', c.business_id,
    'vat_id', c.vat_id,
    'address_line1', c.address_line1,
    'address_line2', c.address_line2,
    'postal_code', c.postal_code,
    'city', c.city,
    'country_code', c.country_code,
    'status', c.status,
    'tags', c.tags,
    'marketing_consent', c.marketing_consent,
    'contact_consent', c.contact_consent,
    'hidden', c.hidden,
    'source', c.source,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'vehicles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'license_plate', v.license_plate,
        'vehicle_name', v.vehicle_name,
        'vin', v.vin,
        'notes', v.notes,
        'hidden', v.hidden,
        'created_at', v.created_at,
        'updated_at', v.updated_at
      ) order by v.hidden, upper(v.license_plate))
      from public.customer_vehicles v
      where v.customer_id = c.id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(note_row order by limited_notes.created_at desc)
      from (
        select jsonb_build_object(
          'id', n.id,
          'body', n.body,
          'visibility', n.visibility,
          'created_by', n.created_by,
          'created_at', n.created_at
        ) as note_row,
        n.created_at
        from public.customer_notes n
        where n.customer_id = c.id
          and (n.visibility = 'internal' or public.cms_is_super_admin())
        order by n.created_at desc
        limit 40
      ) limited_notes
    ), '[]'::jsonb)
  )
  into v_customer
  from public.customers c
  left join auth.users au on au.id = c.account_id
  left join public.customer_benefits cb on cb.customer_id = c.id
  where c.id = p_customer_id;

  return v_customer;
end;
$$;

grant execute on function public.customer_benefit_tier_for_points(integer) to authenticated;
grant execute on function public.cms_adjust_customer_benefit_points(uuid, integer, text, jsonb) to authenticated;
grant execute on function public.cms_link_customer_account_by_email(uuid, text, boolean) to authenticated;
grant execute on function public.cms_set_customer_portal_enabled(uuid, boolean) to authenticated;
grant execute on function public.cms_list_customer_overview_v2(text, integer, text, text, boolean) to authenticated;
grant execute on function public.cms_get_customer_detail(uuid) to authenticated;
