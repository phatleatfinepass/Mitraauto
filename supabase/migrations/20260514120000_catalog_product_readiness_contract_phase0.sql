-- Phase 0: freeze and implement the shared product-readiness contract.
--
-- The final search/read-model tables will use the same reason names. Until those
-- tables exist, store the computed readiness state on the published layer so CMS
-- health/readiness counters and future backfills have one source of truth.

alter table public.webshop_items
  add column if not exists product_ready boolean not null default false,
  add column if not exists readiness_reasons text[] not null default '{}'::text[],
  add column if not exists primary_readiness_reason text,
  add column if not exists readiness_checked_at timestamptz;

create index if not exists webshop_items_product_readiness_idx
  on public.webshop_items (product_type, product_ready, primary_readiness_reason, variant_id);

create index if not exists webshop_items_readiness_reasons_gin_idx
  on public.webshop_items using gin (readiness_reasons);

create or replace function public.catalog_jsonb_flag_true(p_value text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(nullif(btrim(p_value), ''), 'false')) in ('true', '1', 'yes', 'y', 'on');
$$;

revoke all on function public.catalog_jsonb_flag_true(text) from public;
grant execute on function public.catalog_jsonb_flag_true(text) to authenticated, service_role;

create or replace function public.catalog_is_tire_manual_not_sellable(p_spec_overrides jsonb)
returns boolean
language sql
immutable
as $$
  select
    public.catalog_jsonb_flag_true(p_spec_overrides->'classification'->>'non_passenger_manual')
    or public.catalog_jsonb_flag_true(p_spec_overrides->'classification'->>'manual_not_sellable')
    or public.catalog_jsonb_flag_true(p_spec_overrides->'classification'->>'exclude_from_storefront');
$$;

revoke all on function public.catalog_is_tire_manual_not_sellable(jsonb) from public;
grant execute on function public.catalog_is_tire_manual_not_sellable(jsonb) to authenticated, service_role;

create or replace function public.catalog_is_rim_manual_not_sellable(p_spec_overrides jsonb)
returns boolean
language sql
immutable
as $$
  select
    public.catalog_jsonb_flag_true(p_spec_overrides->'classification'->>'manual_not_sellable')
    or public.catalog_jsonb_flag_true(p_spec_overrides->'classification'->>'exclude_from_storefront');
$$;

revoke all on function public.catalog_is_rim_manual_not_sellable(jsonb) from public;
grant execute on function public.catalog_is_rim_manual_not_sellable(jsonb) to authenticated, service_role;

create or replace function public.catalog_product_readiness_reasons(p_row public.webshop_items)
returns text[]
language plpgsql
stable
as $$
declare
  v_reasons text[] := '{}'::text[];
  v_gallery_has_image boolean := false;
  v_has_image boolean := false;
  v_has_price boolean := false;
  v_has_stock boolean := false;
  v_has_ean boolean := false;
  v_spec_overrides jsonb := coalesce(p_row.spec_overrides, '{}'::jsonb);
begin
  if jsonb_typeof(coalesce(p_row.gallery, '[]'::jsonb)) = 'array' then
    select exists (
      select 1
      from jsonb_array_elements_text(coalesce(p_row.gallery, '[]'::jsonb)) as image_url(value)
      where nullif(btrim(image_url.value), '') is not null
    )
    into v_gallery_has_image;
  end if;

  v_has_image := nullif(btrim(coalesce(p_row.hero_image_url, '')), '') is not null or v_gallery_has_image;
  v_has_price := coalesce(p_row.final_price_eur, p_row.price) is not null and coalesce(p_row.final_price_eur, p_row.price) > 0;
  v_has_stock := coalesce(p_row.in_stock, false) and coalesce(p_row.stock_qty, 0) > 0;
  v_has_ean := nullif(regexp_replace(coalesce(p_row.ean, p_row.derived_ean, ''), '\D', '', 'g'), '') is not null;

  if p_row.publish_block_reason = 'not_in_selected_catalog' then
    v_reasons := array_append(v_reasons, 'not_in_selected_catalog');
  end if;

  if nullif(btrim(coalesce(p_row.selected_supplier, '')), '') is null
    or nullif(btrim(coalesce(p_row.selected_external_id, '')), '') is null then
    v_reasons := array_append(v_reasons, 'missing_selected_winner');
  end if;

  if p_row.publish_block_reason = 'cms_hidden'
    or (coalesce(p_row.publish_status, '') = 'hidden' and coalesce(p_row.is_visible, false) = false) then
    v_reasons := array_append(v_reasons, 'cms_hidden');
  end if;

  if p_row.product_type = 'tire' and public.catalog_is_tire_manual_not_sellable(v_spec_overrides) then
    v_reasons := array_append(v_reasons, 'manual_not_sellable');
  elsif p_row.product_type = 'rim' and public.catalog_is_rim_manual_not_sellable(v_spec_overrides) then
    v_reasons := array_append(v_reasons, 'manual_not_sellable');
  elsif p_row.publish_block_reason in ('manual_not_sellable', 'manual_non_passenger') then
    v_reasons := array_append(v_reasons, 'manual_not_sellable');
  end if;

  if nullif(btrim(coalesce(p_row.brand, '')), '') is null
    or nullif(btrim(coalesce(p_row.model, '')), '') is null then
    v_reasons := array_append(v_reasons, 'missing_identity');
  end if;

  if p_row.product_type = 'tire' then
    if nullif(btrim(coalesce(p_row.size_string, '')), '') is null
      or p_row.width_mm is null
      or p_row.aspect_ratio is null
      or p_row.diameter_in is null
      or nullif(btrim(coalesce(p_row.season, '')), '') is null then
      v_reasons := array_append(v_reasons, 'missing_size');
    end if;

    if p_row.publish_block_reason in ('unresolved_conflict', 'duplicate_ean_conflict') then
      v_reasons := array_append(v_reasons, 'duplicate_ean_conflict');
    end if;
  elsif p_row.product_type = 'rim' then
    if nullif(btrim(coalesce(p_row.size_string, '')), '') is null then
      v_reasons := array_append(v_reasons, 'missing_size');
    end if;

    if p_row.width_in is null
      or p_row.rim_diameter_in is null
      or nullif(btrim(coalesce(p_row.bolt_pattern, '')), '') is null
      or p_row.et_offset_mm is null
      or coalesce(p_row.center_bore_mm, p_row.cb_mm) is null then
      v_reasons := array_append(v_reasons, 'missing_mounting_specs');
    end if;
  end if;

  if not v_has_ean then
    v_reasons := array_append(v_reasons, 'missing_ean');
  end if;

  if not v_has_price or p_row.publish_block_reason = 'missing_price' then
    v_reasons := array_append(v_reasons, 'missing_price');
  end if;

  if not v_has_stock then
    v_reasons := array_append(v_reasons, 'missing_stock');
  end if;

  if not v_has_image or p_row.publish_block_reason = 'missing_image' then
    v_reasons := array_append(v_reasons, 'missing_image');
  end if;

  if public.catalog_jsonb_flag_true(v_spec_overrides->'inventory'->>'force_out_of_stock')
    or public.catalog_jsonb_flag_true(v_spec_overrides->'availability'->>'force_out_of_stock') then
    v_reasons := array_append(v_reasons, 'force_out_of_stock');
  end if;

  if coalesce(p_row.publish_status, '') not in ('published', 'hidden', 'blocked')
    or coalesce(p_row.publish_block_reason, '') = 'sync_failed' then
    v_reasons := array_append(v_reasons, 'sync_failed');
  end if;

  return array(
    select reason
    from unnest(v_reasons) with ordinality as reasons(reason, ord)
    where reason is not null and btrim(reason) <> ''
    group by reason
    order by min(ord)
  );
end;
$$;

revoke all on function public.catalog_product_readiness_reasons(public.webshop_items) from public;
grant execute on function public.catalog_product_readiness_reasons(public.webshop_items) to authenticated, service_role;

create or replace function public.catalog_product_primary_readiness_reason(p_reasons text[])
returns text
language sql
immutable
as $$
  select coalesce(p_reasons[1], 'ready');
$$;

revoke all on function public.catalog_product_primary_readiness_reason(text[]) from public;
grant execute on function public.catalog_product_primary_readiness_reason(text[]) to authenticated, service_role;

create or replace function public.webshop_items_apply_readiness_contract()
returns trigger
language plpgsql
as $$
declare
  v_reasons text[];
begin
  if new.product_type not in ('tire', 'rim') then
    return new;
  end if;

  v_reasons := public.catalog_product_readiness_reasons(new);
  new.readiness_reasons := coalesce(v_reasons, '{}'::text[]);
  new.primary_readiness_reason := public.catalog_product_primary_readiness_reason(new.readiness_reasons);
  new.product_ready := cardinality(new.readiness_reasons) = 0
    and coalesce(new.is_visible, false)
    and coalesce(new.publish_status, '') = 'published';
  new.readiness_checked_at := now();

  return new;
end;
$$;

revoke all on function public.webshop_items_apply_readiness_contract() from public;
grant execute on function public.webshop_items_apply_readiness_contract() to service_role;

drop trigger if exists trg_webshop_items_apply_readiness_contract on public.webshop_items;
create trigger trg_webshop_items_apply_readiness_contract
before insert or update
on public.webshop_items
for each row
execute function public.webshop_items_apply_readiness_contract();

with computed as (
  select
    w.variant_id,
    public.catalog_product_readiness_reasons(w) as reasons
  from public.webshop_items w
  where w.product_type in ('tire', 'rim')
)
update public.webshop_items w
set
  readiness_reasons = computed.reasons,
  primary_readiness_reason = public.catalog_product_primary_readiness_reason(computed.reasons),
  product_ready = cardinality(computed.reasons) = 0
    and coalesce(w.is_visible, false)
    and coalesce(w.publish_status, '') = 'published',
  readiness_checked_at = now()
from computed
where w.variant_id = computed.variant_id;

comment on column public.webshop_items.product_ready is
  'Phase 0 readiness contract result for the published product row. True means the row has no readiness reasons and is published/visible.';

comment on column public.webshop_items.readiness_reasons is
  'Ordered readiness contract reasons such as missing_price, missing_image, cms_hidden, manual_not_sellable, or ready when empty.';

comment on column public.webshop_items.primary_readiness_reason is
  'First readiness reason for counters and queues. Uses ready when readiness_reasons is empty.';

comment on column public.webshop_items.readiness_checked_at is
  'Timestamp when the published row readiness contract was last computed.';
