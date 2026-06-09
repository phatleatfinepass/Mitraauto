# Catalog Legacy Cleanup Phase 6 Backend Cleanup Plan

## Status

Phase 6 is complete as a non-destructive backend cleanup preparation phase.

No tables, views, functions, cron jobs, or Edge Functions were dropped.

Update after Phase 10: this report is historical. Phase 6 intentionally stopped at comments and dependency documentation. Phase 10 later removed the remaining blockers, took a fresh snapshot, deleted legacy deployed Edge Functions, and dropped the legacy catalog objects.

Implemented:

- Created a live dependency report for old catalog objects.
- Added database comments marking legacy/compatibility objects.
- Added a migration so the comments are reproducible:

```txt
supabase/migrations/20260516012633_catalog_legacy_deprecation_comments.sql
```

## Key Finding

Backend deletion was not safe yet at the end of Phase 6.

Even though the active frontend, CMS Apply Sync, and cron paths are on the current lifecycle, the database still has live dependencies on old compatibility objects.

Current lifecycle remains:

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
supplier_raw_rd_rims / supplier_raw_vt_rims
-> catalog_selected_items
-> CMS Catalog
-> webshop_items
-> public catalog RPCs
```

But these compatibility objects still have live DB dependents:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
```

## Objects Marked With Legacy Comments

### Tables / Views / Materialized Views

```txt
supplier_products_raw
products_search
products_search_base
products_search_v3
products_search_v3_base
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
catalog_tires_public_mv
cms_tires_admin_mv
```

### Functions

```txt
catalog_import_tires_from_supplier(text, integer)
catalog_import_tires_from_supplier(text, integer, uuid)
catalog_import_rims_from_supplier(text, integer)
catalog_import_rims_from_supplier(text, integer, uuid)
catalog_normalize_select_batch(integer)
catalog_refresh_products_search_v3()
catalog_run_all_imports_v3(integer)
refresh_webshop_tire_items_v1()
refresh_webshop_rim_items_v1()
refresh_catalog_tires_public_mv()
refresh_cms_tires_admin_mv()
storefront_search(text, product_category, boolean, integer, integer, integer, integer)
storefront_product_detail(product_category, uuid)
storefront_suggest(text, integer)
tires_browse_ui(integer, integer, integer, integer, integer)
tires_search_ui(integer, integer, integer)
rims_browse_ui(numeric, numeric, text, integer, integer)
rims_search_ui(numeric, integer, text)
publish_catalog_refresh()
```

## Live Dependency Findings

### `products_search`

Still referenced by live database objects, including:

```txt
catalog_selected_tires_cms_admin_v1
catalog_selected_rims_cms_admin_v1
catalog_tires_public_mv
cms_tires_admin_mv
products_search_* compatibility views
```

This means `products_search` cannot be dropped until selected CMS views and compatibility materialized views are rebuilt away from it.

### `catalog_tire_variants`

Still referenced by live database objects, including:

```txt
catalog_best_tire_offers
catalog_tire_variants_safe
catalog_tires_for_ui
catalog_tires_final_for_ui
catalog_tires_public_mv
cms_tires_admin_mv
products_search_base_old_20251217_080121
```

This means `catalog_tire_variants` cannot be dropped until those views/materialized views/functions are retired or rebuilt.

### `catalog_rim_variants`

Still referenced by live database objects, including:

```txt
catalog_best_rim_offers
catalog_rims_for_ui
products_search_base_old_20251217_080121
```

This means `catalog_rim_variants` cannot be dropped until those views/functions are retired or rebuilt.

### `supplier_products_raw`

Still referenced by legacy functions/views, including:

```txt
catalog_import_tires_from_supplier
catalog_import_rims_from_supplier
catalog_normalize_select_batch
catalog_refresh_reconcile_queues
products_search_passenger_only_old
rd_articles_classified
```

It is also referenced by deployed legacy/debug Edge Function source from Phase 5:

```txt
catalog_sync_rd_tires
catalog_sync_rd_rims
debug_rd_sync_state
```

This means `supplier_products_raw` cannot be dropped until those paths are retired.

### `tires_variants` / `rims_variants`

Still referenced by early UI/helper functions:

```txt
tires_browse_ui
tires_search_ui
rims_browse_ui
rims_search_ui
publish_catalog_refresh
trg_mark_dirty_master
```

They cannot be dropped until those helpers/triggers are retired.

## Cleanup Candidates

Safe status today:

```txt
Documented only. Not safe to drop yet.
```

Candidate groups:

- Old tire raw path: `supplier_products_raw` and functions using it.
- Old rim raw path: `supplier_products_raw` and functions using it.
- Old variant model: `catalog_tire_variants`, `catalog_rim_variants`, `tires_variants`, `rims_variants`.
- Old storefront functions: `storefront_search`, `storefront_product_detail`, `storefront_suggest`.
- Old UI helper functions: `tires_browse_ui`, `rims_browse_ui`, and related search helpers.
- Old non-batched publish functions: `refresh_webshop_tire_items_v1`, `refresh_webshop_rim_items_v1`, `publish_catalog_refresh`.
- Old materialized view refresh functions: `refresh_catalog_tires_public_mv`, `refresh_cms_tires_admin_mv`.

## Required Phase 6 Follow-Up Before Any Drop

1. Replace `catalog_selected_tires_cms_admin_v1` and `catalog_selected_rims_cms_admin_v1` dependencies on `products_search`.
2. Retire or rebuild `catalog_tires_public_mv` and `cms_tires_admin_mv`.
3. Retire old `catalog_*_for_ui`, `catalog_best_*_offers`, and old `products_search_*` compatibility views.
4. Delete or archive deployed legacy Edge Functions after confirming no manual/external caller uses them.
5. Re-run dependency report.
6. Wait one stable deployment cycle.
7. Create a dedicated destructive cleanup migration only after dependencies are gone.

## Verification

Verified:

- DB comments applied to legacy relations.
- DB comments applied to legacy functions.
- No destructive SQL was run.
