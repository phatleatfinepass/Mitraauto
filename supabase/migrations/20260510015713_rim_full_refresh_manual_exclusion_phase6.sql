-- Phase 6: make the rim full-refresh fallback honor manual not-sellable exclusion.

set lock_timeout = '5s';
set statement_timeout = '60s';

do $$
declare
  v_sql text;
begin
  select pg_get_functiondef('public.refresh_webshop_rim_items_v1()'::regprocedure)
  into v_sql;

  if v_sql is null then
    raise exception 'refresh_webshop_rim_items_v1() was not found';
  end if;

  v_sql := replace(
    v_sql,
    'not cms_is_hidden
        and final_base_price_eur is not null
        and coalesce(nullif(cms_hero_image_url, ''''), nullif(cms_gallery->>0, ''''), supplier_image_url) is not null as is_visible,',
    'not cms_is_hidden
        and final_base_price_eur is not null
        and coalesce(nullif(cms_hero_image_url, ''''), nullif(cms_gallery->>0, ''''), supplier_image_url) is not null
        and public.catalog_is_rim_manual_not_sellable(spec_overrides) = false as is_visible,'
  );

  v_sql := replace(
    v_sql,
    'when cms_is_hidden then ''hidden''
        when final_base_price_eur is null then ''blocked''',
    'when cms_is_hidden then ''hidden''
        when public.catalog_is_rim_manual_not_sellable(spec_overrides) then ''blocked''
        when final_base_price_eur is null then ''blocked'''
  );

  v_sql := replace(
    v_sql,
    'when cms_is_hidden then ''cms_hidden''
        when final_base_price_eur is null then ''missing_price''',
    'when cms_is_hidden then ''cms_hidden''
        when public.catalog_is_rim_manual_not_sellable(spec_overrides) then ''manual_not_sellable''
        when final_base_price_eur is null then ''missing_price'''
  );

  if v_sql not like '%manual_not_sellable%' then
    raise exception 'refresh_webshop_rim_items_v1() manual exclusion patch did not apply';
  end if;

  execute v_sql;
end $$;
