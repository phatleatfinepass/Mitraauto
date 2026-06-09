-- Phase 10 cleanup: drop isolated legacy internal catalog helpers.
--
-- These functions are part of the old supplier_products_raw/products_search
-- import and early variant-table pipeline. They were first narrowed to
-- postgres/service_role only, then verified to have no active source, cron, or
-- dependency blockers.
--
-- This migration does not drop tables, views, materialized views, product CMS
-- data, selected-layer data, webshop data, or current CMS/public catalog RPCs.
--
-- Intentionally not dropped here:
-- - catalog_patch_offer_ean_v3(...) because Tire CMS still calls it.
-- - catalog_product_cms_variant_matches_type(...) because product_cms policies
--   still use it.

drop function if exists public._patch_catalog_import_brand_model();

drop function if exists public.catalog_backfill_missing_ean_issues();

drop function if exists public.catalog_backfill_raw_v3_from_legacy();

drop function if exists public.catalog_build_variant_id_map_v3();

drop function if exists public.catalog_import_rim_from_issue(uuid);

drop function if exists public.catalog_import_rims_from_supplier(text, integer);

drop function if exists public.catalog_import_rims_from_supplier(text, integer, uuid);

drop function if exists public.catalog_import_tires_from_supplier(text, integer);

drop function if exists public.catalog_import_tires_from_supplier(text, integer, uuid);

drop function if exists public.catalog_mark_all_dirty();

drop function if exists public.catalog_normalize_select_batch(integer);

drop function if exists public.catalog_refresh_products_search_v3();

drop function if exists public.catalog_refresh_reconcile_queues(uuid);

drop function if exists public.catalog_run_all_imports_v3(integer);

drop function if exists public.catalog_upsert_rim(uuid);

drop function if exists public.catalog_upsert_rim_variant(
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
);

drop function if exists public.catalog_upsert_tire(uuid);

drop function if exists public.catalog_upsert_tire_variant(
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
);

drop trigger if exists trg_catalog_v3_shadow_supplier_raw on public.supplier_products_raw;

drop function if exists public.catalog_v3_shadow_raw_from_legacy_trigger();

drop function if exists public.normalize_raw_row(bigint);

drop function if exists public.publish_catalog_refresh();

drop trigger if exists t_products_master_dirty on public.products_master;

drop function if exists public.trg_mark_dirty_master();
