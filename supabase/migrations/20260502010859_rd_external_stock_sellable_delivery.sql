-- Treat RD external stock as sellable stock and preserve RD delivery estimates.
-- RD exposes local supplier stock as stock_qty and external supplier stock in
-- supplier_metadata_json.quantity_external. External stock is still orderable,
-- but has a longer delivery estimate in supplier_metadata_json.external_delivery_time.

create or replace function public.catalog_parse_delivery_days_range(
  p_value text,
  out min_days integer,
  out max_days integer
)
language plpgsql
immutable
as $$
declare
  v_match text[];
begin
  min_days := null;
  max_days := null;

  v_match := regexp_match(coalesce(p_value, ''), '^\s*(\d+)(?:\s*-\s*(\d+))?');
  if v_match is null then
    return;
  end if;

  min_days := v_match[1]::integer;
  max_days := coalesce(v_match[2]::integer, min_days);
end;
$$;

create or replace function public.catalog_apply_rd_external_stock_v1()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_selected_updated integer := 0;
  v_webshop_updated integer := 0;
begin
  with rd_external as (
    select
      s.id,
      greatest(
        coalesce(s.stock_qty, 0),
        coalesce(nullif(btrim(s.supplier_metadata_json->>'quantity_external'), '')::integer, 0)
      ) as sellable_stock_qty,
      parsed.min_days,
      parsed.max_days
    from public.catalog_selected_items s
    cross join lateral public.catalog_parse_delivery_days_range(
      s.supplier_metadata_json->>'external_delivery_time'
    ) parsed
    where s.product_type = 'tire'
      and s.selected_supplier = 'RD'
      and s.is_available
      and coalesce(nullif(btrim(s.supplier_metadata_json->>'quantity_external'), '')::integer, 0) > 0
  )
  update public.catalog_selected_items s
  set
    stock_qty = rd_external.sellable_stock_qty,
    in_stock = rd_external.sellable_stock_qty > 0,
    delivery_days_min = coalesce(rd_external.min_days, s.delivery_days_min),
    delivery_days_max = coalesce(rd_external.max_days, s.delivery_days_max),
    updated_at = now()
  from rd_external
  where s.id = rd_external.id
    and (
      coalesce(s.stock_qty, 0) is distinct from rd_external.sellable_stock_qty
      or not coalesce(s.in_stock, false)
      or s.delivery_days_min is distinct from coalesce(rd_external.min_days, s.delivery_days_min)
      or s.delivery_days_max is distinct from coalesce(rd_external.max_days, s.delivery_days_max)
    );

  get diagnostics v_selected_updated = row_count;

  update public.webshop_items w
  set
    in_stock = s.in_stock,
    stock_qty = s.stock_qty,
    delivery_days_min = s.delivery_days_min,
    delivery_days_max = s.delivery_days_max,
    refreshed_at = now(),
    updated_at = now()
  from public.catalog_selected_items s
  where w.variant_id = s.id
    and w.product_type = 'tire'
    and s.product_type = 'tire'
    and s.selected_supplier = 'RD'
    and s.is_available
    and coalesce(nullif(btrim(s.supplier_metadata_json->>'quantity_external'), '')::integer, 0) > 0
    and (
      w.in_stock is distinct from s.in_stock
      or w.stock_qty is distinct from s.stock_qty
      or w.delivery_days_min is distinct from s.delivery_days_min
      or w.delivery_days_max is distinct from s.delivery_days_max
    );

  get diagnostics v_webshop_updated = row_count;

  return jsonb_build_object(
    'selected_updated', v_selected_updated,
    'webshop_updated', v_webshop_updated
  );
end;
$$;

grant execute on function public.catalog_parse_delivery_days_range(text) to authenticated, service_role;
grant execute on function public.catalog_apply_rd_external_stock_v1() to authenticated, service_role;

select public.catalog_apply_rd_external_stock_v1();
