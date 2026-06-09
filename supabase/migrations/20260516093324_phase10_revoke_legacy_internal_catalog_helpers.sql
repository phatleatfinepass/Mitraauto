-- Phase 10 canary: remove client execution from legacy internal catalog helpers.
--
-- These functions belong to the old raw -> mixed catalog/import pipeline and
-- still reference cleanup candidates such as `supplier_products_raw`,
-- `catalog_tire_variants`, `catalog_rim_variants`, `tires_variants`, and
-- `rims_variants`.
--
-- This migration does not drop functions or data. It removes PUBLIC and
-- authenticated execution from helpers that are not called by current app
-- source or active cron. `service_role` remains for rollback/debug and for any
-- still-deployed legacy Edge Function until those functions are retired.
--
-- Intentionally not touched here:
-- - public.catalog_patch_offer_ean_v3(...) is still called by Tire CMS mutation code.
-- - public.catalog_product_cms_variant_matches_type(...) is used by CMS product
--   row policies.
-- - old cms_list_tires_admin_v1 overloads are handled separately because the
--   active CMS tire list function name is still used.

revoke execute on function public._patch_catalog_import_brand_model()
  from public, anon, authenticated;

revoke execute on function public.catalog_backfill_missing_ean_issues()
  from public, anon, authenticated;

revoke execute on function public.catalog_backfill_raw_v3_from_legacy()
  from public, anon, authenticated;

revoke execute on function public.catalog_build_variant_id_map_v3()
  from public, anon, authenticated;

revoke execute on function public.catalog_import_rim_from_issue(uuid)
  from public, anon, authenticated;

revoke execute on function public.catalog_import_rims_from_supplier(text, integer, uuid)
  from public, anon, authenticated;

revoke execute on function public.catalog_import_tires_from_supplier(text, integer, uuid)
  from public, anon, authenticated;

revoke execute on function public.catalog_mark_all_dirty()
  from public, anon, authenticated;

revoke execute on function public.catalog_normalize_select_batch(integer)
  from public, anon, authenticated;

revoke execute on function public.catalog_refresh_products_search_v3()
  from public, anon, authenticated;

revoke execute on function public.catalog_refresh_reconcile_queues(uuid)
  from public, anon, authenticated;

revoke execute on function public.catalog_run_all_imports_v3(integer)
  from public, anon, authenticated;

revoke execute on function public.catalog_upsert_rim(uuid)
  from public, anon, authenticated;

revoke execute on function public.catalog_upsert_rim_variant(
  uuid,
  text,
  numeric,
  numeric,
  numeric,
  text,
  numeric,
  text,
  text,
  jsonb
) from public, anon, authenticated;

revoke execute on function public.catalog_upsert_tire(uuid)
  from public, anon, authenticated;

revoke execute on function public.catalog_upsert_tire_variant(
  uuid,
  text,
  numeric,
  numeric,
  numeric,
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  text,
  text,
  integer,
  text,
  text,
  jsonb
) from public, anon, authenticated;

revoke execute on function public.catalog_v3_shadow_raw_from_legacy_trigger()
  from public, anon, authenticated;

revoke execute on function public.normalize_raw_row(bigint)
  from public, anon, authenticated;

revoke execute on function public.publish_catalog_refresh()
  from public, anon, authenticated;

revoke execute on function public.trg_mark_dirty_master()
  from public, anon, authenticated;
