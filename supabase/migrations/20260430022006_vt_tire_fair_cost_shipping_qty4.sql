do $$
declare
  v_function_sql text;
  v_patched_sql text;
begin
  select pg_get_functiondef('public.catalog_rebuild_selected_tires_v1()'::regprocedure)
  into v_function_sql;

  v_patched_sql := replace(
    v_function_sql,
    $old$
      coalesce(v.wholesale_price_eur, v.consumer_price_eur) as final_base_price_eur,
      coalesce(v.wholesale_price_eur, v.consumer_price_eur) as raw_supplier_price_ex_vat,
      null::numeric(12,2) as shipping_fee_ex_vat,
      coalesce(v.wholesale_price_eur, v.consumer_price_eur) as fair_cost_ex_vat,
      'vt_wholesale_or_consumer_price'::text as fair_cost_reason,
$old$,
    $new$
      coalesce(v.wholesale_price_eur, v.consumer_price_eur) as final_base_price_eur,
      coalesce(v.wholesale_price_eur, v.consumer_price_eur) as raw_supplier_price_ex_vat,
      4.95::numeric(12,2) as shipping_fee_ex_vat,
      case
        when coalesce(v.wholesale_price_eur, v.consumer_price_eur) is not null
          then (coalesce(v.wholesale_price_eur, v.consumer_price_eur) + 4.95)::numeric(12,2)
        else null
      end as fair_cost_ex_vat,
      'vt_wholesale_plus_shipping_qty4'::text as fair_cost_reason,
$new$
  );

  if v_patched_sql = v_function_sql then
    raise exception 'catalog_rebuild_selected_tires_v1 VT pricing block was not patched';
  end if;

  v_function_sql := v_patched_sql;
  v_patched_sql := replace(
    v_function_sql,
    $old$
        (c.fair_cost_ex_vat is null) asc,
        c.fair_cost_ex_vat asc nulls last,
$old$,
    $new$
        (
          case
            when c.supplier_code = 'VT' and c.raw_supplier_price_ex_vat is not null
              then (c.raw_supplier_price_ex_vat + 4.95)::numeric(12,2)
            else c.fair_cost_ex_vat
          end is null
        ) asc,
        case
          when c.supplier_code = 'VT' and c.raw_supplier_price_ex_vat is not null
            then (c.raw_supplier_price_ex_vat + 4.95)::numeric(12,2)
          else c.fair_cost_ex_vat
        end asc nulls last,
$new$
  );

  if v_patched_sql = v_function_sql then
    raise exception 'catalog_rebuild_selected_tires_v1 comparison ranking block was not patched';
  end if;

  execute v_patched_sql;
end $$;
