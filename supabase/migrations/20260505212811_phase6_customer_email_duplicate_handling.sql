drop index if exists public.customers_primary_email_unique_idx;

create unique index customers_primary_email_unique_idx
  on public.customers (lower(primary_email))
  where primary_email is not null
    and primary_email <> ''
    and status not in ('deleted', 'merged');

create or replace function public.cms_upsert_customer(
  p_customer_id uuid default null,
  p_full_name text default null,
  p_primary_email text default null,
  p_primary_phone text default null,
  p_language text default null,
  p_business_id text default null,
  p_vat_id text default null,
  p_address_line1 text default null,
  p_address_line2 text default null,
  p_postal_code text default null,
  p_city text default null,
  p_country_code text default 'FI',
  p_status text default 'active',
  p_tags text[] default '{}'::text[],
  p_marketing_consent boolean default null,
  p_contact_consent boolean default null,
  p_hidden boolean default false,
  p_customer_type text default 'personal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_customer_type text := lower(coalesce(nullif(btrim(p_customer_type), ''), 'personal'));
  v_primary_email text := lower(nullif(btrim(p_primary_email), ''));
  v_duplicate record;
begin
  if not public.cms_has_permission('customers', 'write') then
    raise exception 'Customer write access required';
  end if;

  if p_status not in ('active', 'hidden', 'blocked', 'merged', 'deleted') then
    raise exception 'Invalid customer status';
  end if;

  if v_customer_type not in ('personal', 'business', 'fleet') then
    raise exception 'Invalid customer type';
  end if;

  if v_primary_email is not null and p_status not in ('deleted', 'merged') then
    select c.id, c.full_name, c.status
    into v_duplicate
    from public.customers c
    where lower(c.primary_email) = v_primary_email
      and c.status not in ('deleted', 'merged')
      and (p_customer_id is null or c.id <> p_customer_id)
    order by c.updated_at desc nulls last, c.created_at desc nulls last
    limit 1;

    if v_duplicate.id is not null then
      raise exception 'A customer with email % already exists (%). Open the existing customer, merge duplicates, or use a different email.',
        v_primary_email,
        coalesce(nullif(v_duplicate.full_name, ''), v_duplicate.id::text)
        using errcode = '23505';
    end if;
  end if;

  if p_customer_id is null then
    insert into public.customers (
      customer_type,
      full_name,
      primary_email,
      primary_phone,
      language,
      business_id,
      vat_id,
      address_line1,
      address_line2,
      postal_code,
      city,
      country_code,
      status,
      tags,
      marketing_consent,
      contact_consent,
      hidden,
      source,
      created_by,
      updated_by
    )
    values (
      v_customer_type,
      nullif(btrim(p_full_name), ''),
      v_primary_email,
      nullif(btrim(p_primary_phone), ''),
      nullif(btrim(p_language), ''),
      nullif(btrim(p_business_id), ''),
      nullif(btrim(p_vat_id), ''),
      nullif(btrim(p_address_line1), ''),
      nullif(btrim(p_address_line2), ''),
      nullif(btrim(p_postal_code), ''),
      nullif(btrim(p_city), ''),
      coalesce(nullif(upper(btrim(p_country_code)), ''), 'FI'),
      p_status,
      coalesce(p_tags, '{}'::text[]),
      p_marketing_consent,
      p_contact_consent,
      coalesce(p_hidden, false),
      'cms',
      auth.uid(),
      auth.uid()
    )
    returning id into v_customer_id;

    insert into public.customer_events(customer_id, actor_id, event_type, details)
    values (v_customer_id, auth.uid(), 'customer_created', jsonb_build_object('source', 'cms', 'customer_type', v_customer_type));

    return v_customer_id;
  end if;

  update public.customers
  set customer_type = v_customer_type,
      full_name = nullif(btrim(p_full_name), ''),
      primary_email = v_primary_email,
      primary_phone = nullif(btrim(p_primary_phone), ''),
      language = nullif(btrim(p_language), ''),
      business_id = nullif(btrim(p_business_id), ''),
      vat_id = nullif(btrim(p_vat_id), ''),
      address_line1 = nullif(btrim(p_address_line1), ''),
      address_line2 = nullif(btrim(p_address_line2), ''),
      postal_code = nullif(btrim(p_postal_code), ''),
      city = nullif(btrim(p_city), ''),
      country_code = coalesce(nullif(upper(btrim(p_country_code)), ''), 'FI'),
      status = p_status,
      tags = coalesce(p_tags, '{}'::text[]),
      marketing_consent = p_marketing_consent,
      contact_consent = p_contact_consent,
      hidden = coalesce(p_hidden, false),
      updated_by = auth.uid(),
      updated_at = now()
  where id = p_customer_id
  returning id into v_customer_id;

  if v_customer_id is null then
    raise exception 'Customer not found';
  end if;

  insert into public.customer_events(customer_id, actor_id, event_type, details)
  values (
    v_customer_id,
    auth.uid(),
    'customer_updated',
    jsonb_build_object('status', p_status, 'hidden', coalesce(p_hidden, false), 'customer_type', v_customer_type)
  );

  return v_customer_id;
end;
$$;

grant execute on function public.cms_upsert_customer(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text[], boolean, boolean, boolean, text) to authenticated;
