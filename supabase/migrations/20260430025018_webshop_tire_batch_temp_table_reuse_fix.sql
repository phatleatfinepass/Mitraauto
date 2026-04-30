do $$
declare
  v_function_sql text;
  v_patched_sql text;
begin
  select pg_get_functiondef('public.refresh_webshop_tire_items_batch_v1(uuid, integer)'::regprocedure)
  into v_function_sql;

  v_patched_sql := replace(
    v_function_sql,
    $old$
  create temp table tmp_webshop_tire_items_batch on commit drop as
$old$,
    $new$
  drop table if exists pg_temp.tmp_webshop_tire_items_batch;

  create temp table tmp_webshop_tire_items_batch on commit drop as
$new$
  );

  if v_patched_sql = v_function_sql then
    raise exception 'refresh_webshop_tire_items_batch_v1 temp table block was not patched';
  end if;

  execute v_patched_sql;
end $$;
