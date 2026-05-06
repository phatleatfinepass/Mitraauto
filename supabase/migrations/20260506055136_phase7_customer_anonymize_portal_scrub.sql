-- Complete GDPR anonymization for customer portal/account data.
-- The earlier Phase 7 hardening removed contact and plate identifiers; this
-- also severs portal account links and scrubs notification/reminder text that
-- can carry personal data.

create or replace function public.cms_anonymize_customer(
  p_customer_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cms_is_super_admin() then
    raise exception 'Super admin access required';
  end if;

  perform public.cms_require_verified_mfa();

  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    p_customer_id,
    auth.uid(),
    'customer_anonymized',
    jsonb_build_object('reason', nullif(btrim(coalesce(p_reason, '')), ''))
  );

  update public.bookings
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.orders
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.invoice_documents
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.emergency_requests
  set customer_id = null,
      customer_vehicle_id = null,
      customer_match_source = null,
      customer_linked_at = null,
      customer_linked_by = auth.uid()
  where customer_id = p_customer_id;

  update public.customer_vehicles
  set license_plate = 'ANON-' || substr(id::text, 1, 8),
      vehicle_name = null,
      vin = null,
      notes = null,
      hidden = true,
      updated_at = now()
  where customer_id = p_customer_id;

  update public.customer_notes
  set body = '[anonymized]'
  where customer_id = p_customer_id;

  update public.customer_service_book_entries
  set title = '[anonymized]',
      description = null,
      parts = '[]'::jsonb,
      staff_notes = null,
      visible_to_customer = false,
      updated_by = auth.uid(),
      updated_at = now()
  where customer_id = p_customer_id;

  update public.customer_maintenance_reminders
  set title = '[anonymized]',
      description = null,
      status = 'cancelled',
      next_email_at = null,
      updated_by = auth.uid(),
      updated_at = now()
  where customer_id = p_customer_id;

  update public.customer_notification_history
  set recipient = '[anonymized]',
      subject = null,
      provider_message_id = null,
      details = '{}'::jsonb
  where customer_id = p_customer_id;

  update public.customer_benefits
  set points_balance = 0,
      tier = 'bronze',
      discount_percent = 0,
      updated_by = auth.uid(),
      updated_at = now()
  where customer_id = p_customer_id;

  update public.customers
  set account_id = null,
      portal_enabled = false,
      portal_invited_at = null,
      primary_email = null,
      primary_phone = null,
      full_name = 'Anonymized customer',
      language = null,
      business_id = null,
      vat_id = null,
      address_line1 = null,
      address_line2 = null,
      postal_code = null,
      city = null,
      country_code = 'FI',
      status = 'deleted',
      tags = '{}'::text[],
      marketing_consent = false,
      contact_consent = false,
      hidden = true,
      source = 'gdpr_anonymized',
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id;
end;
$$;

grant execute on function public.cms_anonymize_customer(uuid, text) to authenticated;
