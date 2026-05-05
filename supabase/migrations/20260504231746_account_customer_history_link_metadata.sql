create or replace function public.cms_get_customer_history(
  p_customer_id uuid,
  p_limit integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_customer public.customers%rowtype;
  v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 80);
  v_email text;
  v_phone text;
  v_plates text[];
begin
  if not public.cms_has_permission('customers', 'read') then
    raise exception 'Customer access required';
  end if;

  select * into v_customer
  from public.customers
  where id = p_customer_id;

  if not found then
    raise exception 'Customer not found';
  end if;

  v_email := lower(nullif(btrim(v_customer.primary_email), ''));
  v_phone := nullif(regexp_replace(coalesce(v_customer.primary_phone, ''), '\s+', '', 'g'), '');

  select coalesce(array_agg(distinct upper(btrim(license_plate))), '{}'::text[])
  into v_plates
  from public.customer_vehicles
  where customer_id = p_customer_id
    and not hidden
    and nullif(btrim(license_plate), '') is not null;

  return jsonb_build_object(
    'bookings', coalesce((
      select jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc)
      from (
        select
          b.id,
          b.created_at,
          b.status,
          b.booking_date,
          b.booking_time,
          b.booking_language,
          b.license_plate,
          b.service_name,
          b.customer_name,
          b.customer_email,
          b.customer_phone,
          b.notes,
          b.customer_id,
          b.customer_vehicle_id,
          b.customer_match_source,
          b.customer_linked_at
        from public.bookings b
        where b.customer_id = p_customer_id
          or (
            b.customer_id is null
            and (
              (v_email is not null and lower(nullif(btrim(b.customer_email), '')) = v_email)
              or (v_phone is not null and regexp_replace(coalesce(b.customer_phone, ''), '\s+', '', 'g') = v_phone)
              or (array_length(v_plates, 1) is not null and upper(btrim(coalesce(b.license_plate, ''))) = any(v_plates))
            )
          )
        order by b.created_at desc nulls last
        limit v_limit
      ) row_data
    ), '[]'::jsonb),
    'orders', coalesce((
      select jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc)
      from (
        select
          o.id,
          o.created_at,
          o.status,
          o.paytrail_status,
          o.paytrail_transaction_id,
          o.paytrail_reference,
          o.email,
          o.phone,
          o.grand_total_cents,
          o.cart_snapshot,
          o.customer_id,
          o.customer_vehicle_id,
          o.customer_match_source,
          o.customer_linked_at
        from public.orders o
        where o.customer_id = p_customer_id
          or (
            o.customer_id is null
            and (
              (v_email is not null and lower(nullif(btrim(coalesce(o.email, o.cart_snapshot #>> '{customer,email}', o.cart_snapshot #>> '{billing,email}')), '')) = v_email)
              or (v_phone is not null and regexp_replace(coalesce(o.phone, o.cart_snapshot #>> '{customer,phone}', o.cart_snapshot #>> '{billing,phone}', ''), '\s+', '', 'g') = v_phone)
            )
          )
        order by o.created_at desc nulls last
        limit v_limit
      ) row_data
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc)
      from (
        select
          i.id,
          i.document_number,
          i.document_type,
          i.source_type,
          i.order_id,
          i.booking_id,
          i.status,
          i.issue_date,
          i.due_date,
          i.sent_at,
          i.paid_at,
          i.total_cents,
          i.balance_cents,
          i.customer_name,
          i.customer_email,
          i.customer_phone,
          i.payment_status,
          i.created_at,
          i.updated_at,
          d.customer_id,
          d.customer_vehicle_id,
          d.customer_match_source,
          d.customer_linked_at
        from public.invoice_document_summaries i
        join public.invoice_documents d on d.id = i.id
        where d.customer_id = p_customer_id
          or (
            d.customer_id is null
            and (
              (v_email is not null and lower(nullif(btrim(i.customer_email), '')) = v_email)
              or (v_phone is not null and regexp_replace(coalesce(i.customer_phone, ''), '\s+', '', 'g') = v_phone)
            )
          )
        order by i.created_at desc nulls last
        limit v_limit
      ) row_data
    ), '[]'::jsonb),
    'rescue', coalesce((
      select jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc)
      from (
        select
          e.id,
          e.created_at,
          e.status::text as status,
          e.customer_name,
          e.phone,
          e.license_plate,
          e.city,
          e.customer_id,
          e.customer_vehicle_id,
          e.customer_match_source,
          e.customer_linked_at
        from public.emergency_requests e
        where e.customer_id = p_customer_id
          or (
            e.customer_id is null
            and (
              (v_phone is not null and regexp_replace(coalesce(e.phone, ''), '\s+', '', 'g') = v_phone)
              or (array_length(v_plates, 1) is not null and upper(btrim(coalesce(e.license_plate, ''))) = any(v_plates))
            )
          )
        order by e.created_at desc nulls last
        limit v_limit
      ) row_data
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(to_jsonb(row_data) order by row_data.created_at desc)
      from (
        select
          e.id,
          e.actor_id,
          u.email::text as actor_email,
          e.event_type,
          e.details,
          e.created_at
        from public.customer_events e
        left join auth.users u on u.id = e.actor_id
        where e.customer_id = p_customer_id
        order by e.created_at desc
        limit v_limit
      ) row_data
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.cms_get_customer_history(uuid, integer) to authenticated;
