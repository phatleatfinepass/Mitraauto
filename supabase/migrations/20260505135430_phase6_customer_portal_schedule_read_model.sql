-- Phase 6 customer portal schedule read model.
-- Extends the sanitized customer portal RPC with upcoming appointments,
-- next appointment metadata, service-date hints, and pickup/order status.

create or replace function public.customer_portal_get_account()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer_id uuid;
  v_payload jsonb;
  v_email text;
  v_phone text;
  v_plates text[];
begin
  select c.id,
         lower(nullif(btrim(c.primary_email), '')),
         nullif(regexp_replace(coalesce(c.primary_phone, ''), '\s+', '', 'g'), '')
  into v_customer_id, v_email, v_phone
  from public.customers c
  where c.account_id = auth.uid()
    and c.portal_enabled
    and c.status = 'active'
    and not c.hidden
  order by c.updated_at desc
  limit 1;

  if v_customer_id is null then
    raise exception 'Customer portal access not found';
  end if;

  select coalesce(array_agg(distinct upper(btrim(v.license_plate))), '{}'::text[])
  into v_plates
  from public.customer_vehicles v
  where v.customer_id = v_customer_id
    and not v.hidden
    and nullif(btrim(v.license_plate), '') is not null;

  select jsonb_build_object(
    'customer', jsonb_build_object(
      'id', c.id,
      'customer_type', c.customer_type,
      'full_name', c.full_name,
      'primary_email', c.primary_email,
      'primary_phone', c.primary_phone,
      'language', c.language,
      'portal_enabled', c.portal_enabled
    ),
    'vehicles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id,
        'license_plate', v.license_plate,
        'vehicle_name', v.vehicle_name,
        'vin', v.vin
      ) order by upper(v.license_plate))
      from public.customer_vehicles v
      where v.customer_id = c.id
        and not v.hidden
    ), '[]'::jsonb),
    'appointments', coalesce((
      select jsonb_agg(appointment_row order by appointment_date, appointment_time nulls last, appointment_created_at desc)
      from (
        select jsonb_build_object(
          'id', b.id,
          'booking_date', b.booking_date,
          'booking_time', b.booking_time,
          'status', b.status,
          'service_name', b.service_name,
          'license_plate', b.license_plate,
          'customer_vehicle_id', b.customer_vehicle_id,
          'notes', b.notes,
          'created_at', b.created_at,
          'updated_at', b.updated_at
        ) as appointment_row,
        b.booking_date as appointment_date,
        b.booking_time as appointment_time,
        b.created_at as appointment_created_at
        from public.bookings b
        where b.booking_date >= current_date
          and coalesce(b.status, '') <> 'cancelled'
          and (
            b.customer_id = c.id
            or (
              b.customer_id is null
              and (
                (v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email)
                or (v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone)
                or (array_length(v_plates, 1) is not null and upper(btrim(coalesce(b.license_plate, ''))) = any(v_plates))
              )
            )
          )
        order by b.booking_date, b.booking_time nulls last, b.created_at desc
        limit 30
      ) limited_appointments
    ), '[]'::jsonb),
    'next_appointment', (
      select jsonb_build_object(
        'id', b.id,
        'booking_date', b.booking_date,
        'booking_time', b.booking_time,
        'status', b.status,
        'service_name', b.service_name,
        'license_plate', b.license_plate,
        'customer_vehicle_id', b.customer_vehicle_id
      )
      from public.bookings b
      where b.booking_date >= current_date
        and coalesce(b.status, '') <> 'cancelled'
        and (
          b.customer_id = c.id
          or (
            b.customer_id is null
            and (
              (v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email)
              or (v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone)
              or (array_length(v_plates, 1) is not null and upper(btrim(coalesce(b.license_plate, ''))) = any(v_plates))
            )
          )
        )
      order by b.booking_date, b.booking_time nulls last, b.created_at desc
      limit 1
    ),
    'next_appointment_day', (
      select b.booking_date
      from public.bookings b
      where b.booking_date >= current_date
        and coalesce(b.status, '') <> 'cancelled'
        and (
          b.customer_id = c.id
          or (
            b.customer_id is null
            and (
              (v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email)
              or (v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone)
              or (array_length(v_plates, 1) is not null and upper(btrim(coalesce(b.license_plate, ''))) = any(v_plates))
            )
          )
        )
      order by b.booking_date, b.booking_time nulls last, b.created_at desc
      limit 1
    ),
    'next_possible_service_date', (
      select min(candidate_date)
      from (
        select b.booking_date as candidate_date
        from public.bookings b
        where b.booking_date >= current_date
          and coalesce(b.status, '') <> 'cancelled'
          and (
            b.customer_id = c.id
            or (
              b.customer_id is null
              and (
                (v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email)
                or (v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone)
                or (array_length(v_plates, 1) is not null and upper(btrim(coalesce(b.license_plate, ''))) = any(v_plates))
              )
            )
          )
        union all
        select r.due_date as candidate_date
        from public.customer_maintenance_reminders r
        where r.customer_id = c.id
          and r.status = 'active'
          and r.due_date >= current_date
      ) service_candidates
    ),
    'pickup_schedule', coalesce((
      select jsonb_agg(pickup_row order by pickup_created_at desc)
      from (
        select jsonb_build_object(
          'id', o.id,
          'created_at', o.created_at,
          'status', o.status,
          'fulfillment_status', coalesce(o.cart_snapshot #>> '{fulfillment_status}', o.status),
          'total_cents', o.grand_total_cents,
          'item_label', coalesce(
            o.cart_snapshot #>> '{items,0,name}',
            o.cart_snapshot #>> '{items,0,title}',
            o.cart_snapshot #>> '{cart,items,0,name}',
            o.cart_snapshot #>> '{cart,items,0,title}'
          )
        ) as pickup_row,
        o.created_at as pickup_created_at
        from public.orders o
        where coalesce(o.cart_snapshot #>> '{fulfillment_status}', o.status) in ('ready_for_pickup', 'arrived', 'processing', 'ready')
          and (
            o.customer_id = c.id
            or (
              o.customer_id is null
              and (
                (v_email is not null and lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) = v_email)
                or (v_phone is not null and regexp_replace(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}', ''), '\s+', '', 'g') = v_phone)
              )
            )
          )
        order by o.created_at desc
        limit 20
      ) limited_pickups
    ), '[]'::jsonb),
    'benefits', jsonb_build_object(
      'points_balance', coalesce(cb.points_balance, 0),
      'lifetime_points', coalesce(cb.lifetime_points, 0),
      'tier', coalesce(cb.tier, 'bronze'),
      'discount_percent', coalesce(cb.discount_percent, 0),
      'updated_at', cb.updated_at
    ),
    'benefit_events', coalesce((
      select jsonb_agg(event_row order by event_created_at desc)
      from (
        select jsonb_build_object(
          'points_delta', e.points_delta,
          'balance_after', e.balance_after,
          'tier_after', e.tier_after,
          'reason', e.reason,
          'created_at', e.created_at
        ) as event_row,
        e.created_at as event_created_at
        from public.customer_benefit_events e
        where e.customer_id = c.id
        order by e.created_at desc
        limit 20
      ) limited_events
    ), '[]'::jsonb),
    'service_book', coalesce((
      select jsonb_agg(entry_row order by entry_work_date desc nulls last, entry_created_at desc)
      from (
        select jsonb_build_object(
          'id', s.id,
          'customer_vehicle_id', s.customer_vehicle_id,
          'entry_type', s.entry_type,
          'title', s.title,
          'description', s.description,
          'work_date', s.work_date,
          'mileage_km', s.mileage_km,
          'parts', s.parts,
          'invoice_id', s.invoice_id,
          'booking_id', s.booking_id,
          'created_at', s.created_at,
          'updated_at', s.updated_at
        ) as entry_row,
        s.work_date as entry_work_date,
        s.created_at as entry_created_at
        from public.customer_service_book_entries s
        where s.customer_id = c.id
          and s.visible_to_customer
        order by s.work_date desc nulls last, s.created_at desc
        limit 80
      ) limited_entries
    ), '[]'::jsonb),
    'maintenance_reminders', coalesce((
      select jsonb_agg(reminder_row order by reminder_due_date nulls last, reminder_created_at desc)
      from (
        select jsonb_build_object(
          'id', r.id,
          'customer_vehicle_id', r.customer_vehicle_id,
          'reminder_type', r.reminder_type,
          'title', r.title,
          'description', r.description,
          'due_date', r.due_date,
          'due_mileage_km', r.due_mileage_km,
          'last_known_mileage_km', r.last_known_mileage_km,
          'status', r.status,
          'service_critical', r.service_critical
        ) as reminder_row,
        r.due_date as reminder_due_date,
        r.created_at as reminder_created_at
        from public.customer_maintenance_reminders r
        where r.customer_id = c.id
          and r.status in ('active', 'sent', 'completed')
        order by r.due_date nulls last, r.created_at desc
        limit 50
      ) limited_reminders
    ), '[]'::jsonb),
    'notification_history', coalesce((
      select jsonb_agg(notification_row order by notification_created_at desc)
      from (
        select jsonb_build_object(
          'notification_type', n.notification_type,
          'channel', n.channel,
          'subject', n.subject,
          'status', n.status,
          'sent_at', n.sent_at,
          'created_at', n.created_at
        ) as notification_row,
        n.created_at as notification_created_at
        from public.customer_notification_history n
        where n.customer_id = c.id
        order by n.created_at desc
        limit 30
      ) limited_notifications
    ), '[]'::jsonb)
  )
  into v_payload
  from public.customers c
  left join public.customer_benefits cb on cb.customer_id = c.id
  where c.id = v_customer_id;

  return v_payload;
end;
$$;

grant execute on function public.customer_portal_get_account() to authenticated;
