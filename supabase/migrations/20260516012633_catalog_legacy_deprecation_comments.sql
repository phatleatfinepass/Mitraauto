-- Phase 6 catalog legacy cleanup: mark known compatibility objects before any
-- destructive backend cleanup. These comments are intentionally non-destructive.
-- They document that new Tires/Rims work should use the raw -> selected -> CMS
-- -> webshop_items -> public RPC lifecycle, while removal remains blocked until
-- deployed legacy Edge Functions and database dependencies are retired.

do $$
declare
  v_relation record;
  v_function record;
begin
  for v_relation in
    select candidates.*, c.relkind, c.oid::regclass as relation_name
    from (values
      ('public.supplier_products_raw',
       'LEGACY CATALOG COMPATIBILITY OBJECT. Do not use for new Tires/Rims lifecycle work. Current source of truth is supplier_raw_rd_tires/supplier_raw_vt_tires and supplier_raw_rd_rims/supplier_raw_vt_rims feeding catalog_selected_items and webshop_items. Removal is blocked until legacy deployed Edge Functions and all DB dependencies are retired. Planned cleanup phase: after one stable deployment cycle with no references.'),
      ('public.products_search',
       'LEGACY CATALOG COMPATIBILITY VIEW. Do not add new storefront or CMS reads here. Storefront should use catalog_list_tires_v1/catalog_list_rims_v1 or webshop_items-backed helpers. Removal is blocked because live compatibility views/functions still depend on it. Planned cleanup phase: after dependencies are migrated to selected/webshop read models.'),
      ('public.products_search_base',
       'LEGACY CATALOG COMPATIBILITY VIEW. Kept only for products_search compatibility. Do not use for new Tires/Rims code. Planned cleanup phase: with products_search retirement.'),
      ('public.products_search_v3',
       'LEGACY CATALOG COMPATIBILITY VIEW. Kept only for products_search compatibility. Do not use for new Tires/Rims code. Planned cleanup phase: with products_search retirement.'),
      ('public.products_search_v3_base',
       'LEGACY CATALOG COMPATIBILITY VIEW. Kept only for products_search compatibility. Do not use for new Tires/Rims code. Planned cleanup phase: with products_search retirement.'),
      ('public.catalog_tire_variants',
       'LEGACY CATALOG VARIANT TABLE. Do not use for new tire lifecycle work. Current tire lifecycle uses supplier_raw_rd_tires/supplier_raw_vt_tires -> catalog_selected_items -> webshop_items. Removal is blocked by legacy views/functions and deployed Edge Function source.'),
      ('public.catalog_rim_variants',
       'LEGACY CATALOG VARIANT TABLE. Do not use for new rim lifecycle work. Current rim lifecycle uses supplier_raw_rd_rims/supplier_raw_vt_rims -> catalog_selected_items -> webshop_items. Removal is blocked by legacy views/functions and deployed Edge Function source.'),
      ('public.tires_variants',
       'LEGACY EARLY TIRE VARIANT TABLE. Do not use for new tire lifecycle work. Removal is blocked until old UI/helper functions are retired.'),
      ('public.rims_variants',
       'LEGACY EARLY RIM VARIANT TABLE. Do not use for new rim lifecycle work. Removal is blocked until old UI/helper functions are retired.'),
      ('public.catalog_tires_public_mv',
       'LEGACY PUBLIC TIRE MATERIALIZED VIEW. Do not use for new storefront work. Current storefront should use public catalog RPCs backed by webshop_items/search read models.'),
      ('public.cms_tires_admin_mv',
       'LEGACY CMS TIRE MATERIALIZED VIEW. Do not use for new CMS work. Current CMS tire list should use cms_list_tires_admin_v1/cms_count_tires_admin_v1 backed by selected/webshop layers.')
    ) as candidates(object_name, object_comment)
    join pg_class c on c.oid = to_regclass(candidates.object_name)
  loop
    if v_relation.relkind = 'v' then
      execute format('comment on view %s is %L', v_relation.relation_name, v_relation.object_comment);
    elsif v_relation.relkind = 'm' then
      execute format('comment on materialized view %s is %L', v_relation.relation_name, v_relation.object_comment);
    else
      execute format('comment on table %s is %L', v_relation.relation_name, v_relation.object_comment);
    end if;
  end loop;

  for v_function in
    select *
    from (values
      ('public.catalog_import_tires_from_supplier(text, integer)',
       'LEGACY CATALOG IMPORT FUNCTION. Do not use for current tire sync. Current tire raw refresh runs through catalog_sync_raw_rd_tires/catalog_sync_raw_vt_tires, then selected rebuild and batched webshop publish.'),
      ('public.catalog_import_tires_from_supplier(text, integer, uuid)',
       'LEGACY CATALOG IMPORT FUNCTION. Do not use for current tire sync. Current tire raw refresh runs through catalog_sync_raw_rd_tires/catalog_sync_raw_vt_tires, then selected rebuild and batched webshop publish.'),
      ('public.catalog_import_rims_from_supplier(text, integer)',
       'LEGACY CATALOG IMPORT FUNCTION. Do not use for current rim sync. Current rim raw refresh runs through catalog_sync_raw_rd_rims/catalog_sync_raw_vt_rims, then selected rebuild and batched webshop publish.'),
      ('public.catalog_import_rims_from_supplier(text, integer, uuid)',
       'LEGACY CATALOG IMPORT FUNCTION. Do not use for current rim sync. Current rim raw refresh runs through catalog_sync_raw_rd_rims/catalog_sync_raw_vt_rims, then selected rebuild and batched webshop publish.'),
      ('public.catalog_normalize_select_batch(integer)',
       'LEGACY NORMALIZATION FUNCTION for supplier_products_raw. Do not use for current Tires/Rims lifecycle.'),
      ('public.catalog_refresh_products_search_v3()',
       'LEGACY PRODUCTS_SEARCH REFRESH FUNCTION. Do not use for new catalog work. Replacement path is selected/webshop read models plus public catalog RPCs.'),
      ('public.catalog_run_all_imports_v3(integer)',
       'LEGACY IMPORT ORCHESTRATION FUNCTION. Do not use for current Tires/Rims lifecycle.'),
      ('public.refresh_webshop_tire_items_v1()',
       'LEGACY NON-BATCHED TIRE WEBSHOP REFRESH. Use start_webshop_tire_items_sync_v1, refresh_webshop_tire_items_batch_v1, and finalize_webshop_tire_items_sync_v1.'),
      ('public.refresh_webshop_rim_items_v1()',
       'LEGACY NON-BATCHED RIM WEBSHOP REFRESH. Use start_webshop_rim_items_sync_v1, refresh_webshop_rim_items_batch_v1, and finalize_webshop_rim_items_sync_v1.'),
      ('public.refresh_catalog_tires_public_mv()',
       'LEGACY PUBLIC TIRE MATERIALIZED VIEW REFRESH. Do not use for new storefront path.'),
      ('public.refresh_cms_tires_admin_mv()',
       'LEGACY CMS TIRE MATERIALIZED VIEW REFRESH. Do not use for new CMS path.'),
      ('public.storefront_search(text, product_category, boolean, integer, integer, integer, integer)',
       'LEGACY STOREFRONT SEARCH FUNCTION using products_search. Do not use for current storefront catalog; use public catalog RPCs.'),
      ('public.storefront_product_detail(product_category, uuid)',
       'LEGACY STOREFRONT DETAIL FUNCTION using products_search. Do not use for current product detail path.'),
      ('public.storefront_suggest(text, integer)',
       'LEGACY STOREFRONT SUGGEST FUNCTION using products_search. Do not use for current storefront catalog.'),
      ('public.tires_browse_ui(integer, integer, integer, integer, integer)',
       'LEGACY UI HELPER using tires_variants. Do not use for current tire catalog.'),
      ('public.tires_search_ui(integer, integer, integer)',
       'LEGACY UI HELPER using tires_variants. Do not use for current tire catalog.'),
      ('public.rims_browse_ui(numeric, numeric, text, integer, integer)',
       'LEGACY UI HELPER using rims_variants. Do not use for current rim catalog.'),
      ('public.rims_search_ui(numeric, integer, text)',
       'LEGACY UI HELPER using rims_variants. Do not use for current rim catalog.'),
      ('public.publish_catalog_refresh()',
       'LEGACY PUBLISH FUNCTION using early tire/rim variant tables. Do not use for current batched webshop publish path.')
    ) as candidates(function_signature, function_comment)
    where to_regprocedure(candidates.function_signature) is not null
  loop
    execute format('comment on function %s is %L', to_regprocedure(v_function.function_signature), v_function.function_comment);
  end loop;
end $$;
