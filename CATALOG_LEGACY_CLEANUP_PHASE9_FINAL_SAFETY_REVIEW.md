# Catalog Legacy Cleanup Phase 9 Final Safety Review

## Status

Phase 9 is complete.

This was a final safety review only. No new destructive backend cleanup was performed.

Update after Phase 10: this report is now historical. The "not safe to drop" verdict below was correct before backend retirement. Phase 10 later removed the remaining blockers, took a fresh snapshot, deleted legacy deployed Edge Functions, and dropped the legacy catalog objects.

## Drop Safety Verdict

As of the latest live audit, the legacy catalog objects are **not safe to drop as a group yet**.

Current cron jobs and active CMS/storefront frontend paths have moved to the new tire/rim lifecycle, but the live database and deployed Edge Function inventory still contain compatibility dependencies. Dropping the legacy objects now could break old deployed functions, old storefront RPCs, compatibility views, or debug/admin paths that still compile against those objects.

Do not drop these objects yet:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
```

## Deleted File Import Check

Checked deleted files and old duplicate page names:

```txt
TiresBadgesSection
TiresEuLabelSection
TiresIdentitySection
TiresSeoSection
src/lib/supabase/labels
src/lib/types/labels
RimsCMSPageV2
```

Result:

```txt
No source imports or references found.
```

## Route / Navigation Check

Remaining old route strings are compatibility handlers only:

```txt
/cms/tires       -> redirects/replaces to /cms#catalog/tires
/cms-tires       -> redirects/replaces to /cms#catalog/tires
/cms/rims        -> redirects/replaces to /cms#catalog/rims
/cms-rims        -> redirects/replaces to /cms#catalog/rims
#catalog-tires   -> compatibility hash
#catalog-rims    -> compatibility hash
```

Intentional active route:

```txt
/cms/tires/conflicts
```

Result:

```txt
No navigation link points users back to removed standalone tire/rim catalog pages.
```

## Frontend RPC Existence Check

Confirmed live Supabase functions used by frontend exist:

```txt
catalog_count_tires_v1
catalog_list_tires_v1
catalog_count_rims_v1
catalog_list_rims_v1
catalog_get_rim_by_identifier_v1
catalog_get_health_summary_v1
catalog_close_stale_zero_progress_sync_runs_admin_v1
catalog_rebuild_selected_tires_admin_v1
catalog_rebuild_selected_rims_admin_v1
cms_count_tires_admin_v1
cms_list_tires_admin_v1
cms_count_rims_admin_v1
cms_list_rims_admin_v1
start_webshop_tire_items_sync_v1
refresh_webshop_tire_items_batch_v1
finalize_webshop_tire_items_sync_v1
start_webshop_rim_items_sync_v1
refresh_webshop_rim_items_batch_v1
finalize_webshop_rim_items_sync_v1
```

Result:

```txt
All current frontend/CMS catalog RPCs are present in the live project.
```

## Backend Safety Check

Confirmed legacy objects are documented, not removed:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
```

Confirmed comments exist on those objects and mark them as legacy/compatibility cleanup candidates.

Confirmed migration is non-destructive:

```txt
supabase/migrations/20260516012633_catalog_legacy_deprecation_comments.sql
```

The migration contains comment-only logic through a guarded `do $$` block. It does not drop, truncate, delete, unschedule, or replace production objects.

Latest object inventory:

```txt
catalog_rim_variants     table  45 MB
catalog_tire_variants    table  24 MB
products_search          view   0 bytes
rims_variants            table  144 kB
supplier_products_raw    table  201 MB
tires_variants           table  200 kB
```

Latest trigger dependency check:

```txt
No trigger action references were found for the six cleanup candidates.
```

Latest cron safety check:

```txt
Active catalog cron jobs use the new raw sync, selected rebuild, and batched webshop publish functions.
No active catalog cron job was found calling the old supplier_products_raw sync path.
```

This makes cron safe, but it does not make table drops safe.

## Known Intentional Legacy References

These source files were removed from the local repo during the backend retirement pass so they cannot be accidentally redeployed:

```txt
supabase/functions/catalog_sync_rd_tires/index.ts
supabase/functions/catalog_sync_rd_rims/index.ts
supabase/functions/debug_rd_sync_state/index.ts
supabase/functions/make-server-bdaaf773/index.tsx
src/supabase/functions/server/index.tsx
```

They were not active frontend catalog paths and were not referenced by package/config/build paths.

This local source cleanup does **not** delete the live deployed Edge Functions. Those remain a separate Supabase operation.

Latest live deployed Edge Function blockers:

```txt
catalog_sync_rd_tires       ACTIVE, uses supplier_products_raw
catalog_sync_rd_rims        ACTIVE, uses supplier_products_raw
catalog_sync_vt_tires       ACTIVE, legacy deployed function
catalog_sync_vt_rims        ACTIVE, legacy deployed function
catalog_normalize_batch     ACTIVE, legacy normalize function
debug_rd_sync_state         ACTIVE, reads supplier_products_raw/products_search
make-server-bdaaf773        ACTIVE, old server function with old catalog object references
```

After local source cleanup, these names are no longer present under active source except documentation:

```txt
catalog_sync_rd_tires
catalog_sync_rd_rims
debug_rd_sync_state
make-server-bdaaf773
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
```

Latest live database function blockers:

```txt
_patch_catalog_import_brand_model
catalog_backfill_missing_ean_issues
catalog_backfill_raw_v3_from_legacy
catalog_build_variant_id_map_v3
catalog_import_rim_from_issue
catalog_import_rims_from_supplier
catalog_import_tires_from_supplier
catalog_mark_all_dirty
catalog_normalize_select_batch
catalog_patch_offer_ean_v3
catalog_product_cms_variant_matches_type
catalog_refresh_products_search_v3
catalog_refresh_reconcile_queues
catalog_run_all_imports_v3
catalog_upsert_rim
catalog_upsert_rim_variant
catalog_upsert_tire
catalog_upsert_tire_variant
catalog_v3_shadow_raw_from_legacy_trigger
cms_list_tires_admin_v1 old overloads
cms_resolve_tire_supplier_pricing_v1
normalize_raw_row
publish_catalog_refresh
rims_browse_ui
rims_search_ui
storefront_product_detail
storefront_search
storefront_suggest
tires_browse_ui
tires_search_ui
trg_mark_dirty_master
```

Latest live view blockers:

```txt
catalog_best_rim_offers
catalog_rims_for_ui
catalog_best_tire_offers
catalog_tire_variants_safe
catalog_tires_final_for_ui
catalog_tires_for_ui
catalog_tires_public_mv
cms_tires_admin_mv
catalog_selected_rims_cms_admin_v1
catalog_selected_tires_cms_admin_v1
products_search_passenger_only_old
rd_articles_classified
products_search_base_old_20251217_080121
```

## Historical Safe Next Step Before Any Drop

At the end of Phase 9, the safe next step was this backend-only retirement pass. Phase 10 has since completed it.

- [x] Retire or prove no external callers for old deployed Edge Functions.
- [x] Remove stale local source for old deployed/debug Edge Functions.
- [x] Replace or drop compatibility RPCs that still read `products_search`, old variant tables, or `supplier_products_raw`.
- [x] Replace or drop compatibility views that still depend on old objects.
- [x] Re-run the live function/view/trigger dependency report until it returns zero blockers.
- [x] Take a fresh DB snapshot after the zero-blocker report.
- [x] Prepare a reviewed drop migration in a separate change.

## Final Verification

Passed:

```txt
git diff --check
npm run i18n:audit
npm run build
```

The deploy build passes locally.
