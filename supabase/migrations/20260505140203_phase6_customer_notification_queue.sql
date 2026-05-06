-- Phase 6 customer notification queue.
-- Queues service-critical appointment reminders and maintenance reminders in
-- customer_notification_history. A service-role Edge Function sends queued rows.

create index if not exists customer_notification_history_queue_idx
  on public.customer_notification_history(status, channel, created_at)
  where status = 'queued';

create or replace function public.customer_enqueue_due_notifications(
  p_now timestamptz default now(),
  p_appointment_window interval default interval '24 hours',
  p_limit integer default 200
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_maintenance_count integer := 0;
  v_appointment_count integer := 0;
  v_limit integer := least(greatest(coalesce(p_limit, 200), 1), 500);
begin
  with due_reminders as (
    select
      r.id,
      r.customer_id,
      r.customer_vehicle_id,
      r.title,
      r.description,
      r.due_date,
      r.due_mileage_km,
      r.last_known_mileage_km,
      r.service_critical,
      c.full_name,
      c.primary_email,
      v.license_plate,
      v.vehicle_name
    from public.customer_maintenance_reminders r
    join public.customers c on c.id = r.customer_id
    left join public.customer_vehicles v on v.id = r.customer_vehicle_id
    where r.status = 'active'
      and r.next_email_at is not null
      and r.next_email_at <= p_now
      and nullif(btrim(c.primary_email), '') is not null
      and c.status = 'active'
      and not c.hidden
      and (r.service_critical or c.marketing_consent is true)
      and not exists (
        select 1
        from public.customer_notification_history n
        where n.reminder_id = r.id
          and n.notification_type = 'maintenance_reminder'
          and n.status in ('queued', 'sent')
      )
    order by r.next_email_at, r.created_at
    limit v_limit
  ),
  inserted as (
    insert into public.customer_notification_history(
      customer_id,
      customer_vehicle_id,
      reminder_id,
      notification_type,
      channel,
      recipient,
      subject,
      status,
      details
    )
    select
      d.customer_id,
      d.customer_vehicle_id,
      d.id,
      'maintenance_reminder',
      'email',
      d.primary_email,
      'Mitra Auto service reminder: ' || d.title,
      'queued',
      jsonb_build_object(
        'template', 'maintenance_reminder',
        'service_critical', d.service_critical,
        'customer_name', d.full_name,
        'title', d.title,
        'description', d.description,
        'due_date', d.due_date,
        'due_mileage_km', d.due_mileage_km,
        'last_known_mileage_km', d.last_known_mileage_km,
        'license_plate', d.license_plate,
        'vehicle_name', d.vehicle_name,
        'queued_at', p_now
      )
    from due_reminders d
    returning id
  )
  select count(*) into v_maintenance_count from inserted;

  with due_bookings as (
    select
      b.id,
      coalesce(b.customer_id, c.id) as customer_id,
      coalesce(b.customer_vehicle_id, v.id) as customer_vehicle_id,
      b.booking_date,
      b.booking_time,
      b.service_name,
      b.license_plate,
      b.customer_name,
      coalesce(nullif(btrim(b.customer_email), ''), nullif(btrim(c.primary_email), '')) as recipient,
      b.notes
    from public.bookings b
    left join public.customers c on c.id = b.customer_id
    left join public.customer_vehicles v on v.id = b.customer_vehicle_id
    where b.booking_date >= p_now::date
      and make_timestamptz(
        extract(year from b.booking_date)::integer,
        extract(month from b.booking_date)::integer,
        extract(day from b.booking_date)::integer,
        extract(hour from coalesce(b.booking_time, time '09:00'))::integer,
        extract(minute from coalesce(b.booking_time, time '09:00'))::integer,
        0,
        'Europe/Helsinki'
      ) between p_now and p_now + p_appointment_window
      and coalesce(b.status, '') <> 'cancelled'
      and coalesce(b.customer_action_state, 'active') <> 'cancelled'
      and nullif(btrim(coalesce(b.customer_email, c.primary_email)), '') is not null
      and (c.id is null or (c.status = 'active' and not c.hidden))
      and not exists (
        select 1
        from public.customer_notification_history n
        where n.notification_type = 'appointment_reminder'
          and n.details ->> 'booking_id' = b.id::text
          and n.status in ('queued', 'sent')
      )
    order by b.booking_date, b.booking_time nulls last, b.created_at
    limit v_limit
  ),
  inserted as (
    insert into public.customer_notification_history(
      customer_id,
      customer_vehicle_id,
      notification_type,
      channel,
      recipient,
      subject,
      status,
      details
    )
    select
      d.customer_id,
      d.customer_vehicle_id,
      'appointment_reminder',
      'email',
      d.recipient,
      'Mitra Auto appointment reminder',
      'queued',
      jsonb_build_object(
        'template', 'appointment_reminder',
        'service_critical', true,
        'booking_id', d.id,
        'customer_name', d.customer_name,
        'booking_date', d.booking_date,
        'booking_time', d.booking_time,
        'service_name', d.service_name,
        'license_plate', d.license_plate,
        'notes', d.notes,
        'queued_at', p_now
      )
    from due_bookings d
    returning id
  )
  select count(*) into v_appointment_count from inserted;

  return jsonb_build_object(
    'maintenance_queued', v_maintenance_count,
    'appointment_queued', v_appointment_count
  );
end;
$$;

create or replace function public.customer_notification_claim_email_queue(
  p_limit integer default 25,
  p_lock_timeout interval default interval '15 minutes'
)
returns setof public.customer_notification_history
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
begin
  return query
  with candidates as (
    select n.id
    from public.customer_notification_history n
    where n.status = 'queued'
      and n.channel = 'email'
      and (
        n.details ->> 'locked_at' is null
        or (n.details ->> 'locked_at')::timestamptz < now() - p_lock_timeout
      )
    order by n.created_at
    limit v_limit
    for update skip locked
  ),
  claimed as (
    update public.customer_notification_history n
    set details = n.details || jsonb_build_object('locked_at', now())
    from candidates c
    where n.id = c.id
    returning n.*
  )
  select * from claimed;
end;
$$;

grant execute on function public.customer_enqueue_due_notifications(timestamptz, interval, integer) to authenticated;
grant execute on function public.customer_notification_claim_email_queue(integer, interval) to authenticated;

select cron.unschedule('customer_notifications_enqueue_due')
where exists (
  select 1
  from cron.job
  where jobname = 'customer_notifications_enqueue_due'
);

select cron.schedule(
  'customer_notifications_enqueue_due',
  '*/15 * * * *',
  $$
  select public.customer_enqueue_due_notifications(now(), interval '24 hours', 200);
  $$
);
