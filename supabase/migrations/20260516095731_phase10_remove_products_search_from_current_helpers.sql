-- Phase 10 cleanup: remove products_search dependency from current helper RPCs.

create or replace function public.catalog_product_cms_variant_matches_type(
  p_variant_id uuid,
  p_product_type text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.catalog_selected_items csi
    where csi.id = p_variant_id
      and csi.product_type = p_product_type
  )
  or exists (
    select 1
    from public.webshop_items wi
    where wi.variant_id = p_variant_id
      and wi.product_type = p_product_type
  );
$$;

revoke all on function public.catalog_product_cms_variant_matches_type(uuid, text) from public;
grant execute on function public.catalog_product_cms_variant_matches_type(uuid, text) to authenticated, service_role;

create or replace function public.catalog_patch_offer_ean_v3(
  p_supplier_code text,
  p_product_type text,
  p_external_id text,
  p_ean text,
  p_run_rebuild boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
set statement_timeout = '5min'
as $$
declare
  v_offer_exists boolean;
  v_clean_ean text;
  v_override jsonb := '{}'::jsonb;
  v_user uuid := auth.uid();
  v_old_variant_id uuid;
  v_new_variant_id uuid;
  v_offers_run jsonb := '{}'::jsonb;
  v_prefilter_run jsonb := '{}'::jsonb;
  v_variants_run jsonb := '{}'::jsonb;
  v_conflicts_run jsonb := '{}'::jsonb;
begin
  if coalesce(trim(p_supplier_code), '') = '' then
    raise exception 'supplier_code is required';
  end if;
  if coalesce(trim(p_product_type), '') not in ('tire', 'rim') then
    raise exception 'product_type must be tire or rim';
  end if;
  if coalesce(trim(p_external_id), '') = '' then
    raise exception 'external_id is required';
  end if;

  select exists(
    select 1
    from public.wholesale_offer_current_v3 oc
    where oc.supplier_code = p_supplier_code
      and oc.product_type = p_product_type
      and oc.external_id = p_external_id
  ) into v_offer_exists;

  if not v_offer_exists then
    raise exception 'Offer not found for %/%/%', p_supplier_code, p_product_type, p_external_id;
  end if;

  select non.variant_id
  into v_old_variant_id
  from public.wholesale_offer_norm_v3 non
  where non.supplier_code = p_supplier_code
    and non.product_type = p_product_type
    and non.external_id = p_external_id;

  v_clean_ean := public.catalog_v3_clean_ean(p_ean);

  select coalesce(mo.override_payload, '{}'::jsonb)
  into v_override
  from public.catalog_manual_overrides_v3 mo
  where mo.supplier_code = p_supplier_code
    and mo.product_type = p_product_type
    and mo.external_id = p_external_id;

  if v_clean_ean is null then
    v_override := v_override - 'ean';
  else
    v_override := jsonb_set(v_override, '{ean}', to_jsonb(v_clean_ean), true);
  end if;

  insert into public.catalog_manual_overrides_v3 (
    supplier_code,
    product_type,
    external_id,
    override_payload,
    notes,
    updated_by,
    updated_at
  ) values (
    p_supplier_code,
    p_product_type,
    p_external_id,
    coalesce(v_override, '{}'::jsonb),
    'CMS EAN patch',
    v_user,
    now()
  )
  on conflict (supplier_code, product_type, external_id)
  do update set
    override_payload = excluded.override_payload,
    notes = excluded.notes,
    updated_by = excluded.updated_by,
    updated_at = now();

  if p_run_rebuild then
    select public.catalog_build_offers_v3(200000) into v_offers_run;
    if coalesce((v_offers_run->>'errors')::integer, 0) > 0 then
      raise exception 'catalog_build_offers_v3 failed: %', coalesce(v_offers_run->>'error', v_offers_run::text);
    end if;

    select public.catalog_build_offer_prefilter_v3() into v_prefilter_run;
    select public.catalog_build_variants_v3() into v_variants_run;
    select public.catalog_refresh_conflicts_v3() into v_conflicts_run;
  end if;

  select non.variant_id
  into v_new_variant_id
  from public.wholesale_offer_norm_v3 non
  where non.supplier_code = p_supplier_code
    and non.product_type = p_product_type
    and non.external_id = p_external_id;

  return jsonb_build_object(
    'ok', true,
    'supplier_code', p_supplier_code,
    'product_type', p_product_type,
    'external_id', p_external_id,
    'ean', v_clean_ean,
    'old_variant_id', v_old_variant_id,
    'new_variant_id', v_new_variant_id,
    'rebuilt', p_run_rebuild,
    'runs', jsonb_build_object(
      'offers', v_offers_run,
      'prefilter', v_prefilter_run,
      'variants', v_variants_run,
      'conflicts', v_conflicts_run
    )
  );
end;
$$;

revoke all on function public.catalog_patch_offer_ean_v3(text, text, text, text, boolean) from public;
grant execute on function public.catalog_patch_offer_ean_v3(text, text, text, text, boolean) to authenticated, service_role;
