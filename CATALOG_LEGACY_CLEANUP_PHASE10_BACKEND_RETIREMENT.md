# Catalog Legacy Cleanup Phase 10 Backend Retirement

## Status

Phase 10 is complete.

This phase retired the remaining legacy catalog backend path after the frontend, cron, selected-layer, webshop publish, and public catalog checks were already green. The destructive database drop was applied only after the live dependency report returned zero blockers and a fresh object-level snapshot was created.

## Completed Local Cleanup

Removed stale local source for old deployed/debug Edge Functions:

```txt
supabase/functions/catalog_sync_rd_tires/index.ts
supabase/functions/catalog_sync_rd_rims/index.ts
supabase/functions/debug_rd_sync_state/index.ts
supabase/functions/make-server-bdaaf773/index.tsx
supabase/functions/make-server-bdaaf773/kv_store.tsx
src/supabase/functions/server/index.tsx
src/supabase/functions/server/kv_store.tsx
```

These files were not referenced by frontend source, package scripts, build config, or active cron. Removing them prevents accidental redeploy of the old `supplier_products_raw` / `products_search` paths.

## Verification

Source scan after cleanup:

```txt
src/components/catalog/README.md: guardrail only
```

No active source under `src` or `supabase/functions` references:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
catalog_sync_rd_tires
catalog_sync_rd_rims
debug_rd_sync_state
make-server-bdaaf773
```

Passed:

```txt
git diff --check
npm run i18n:audit
npm run build
```

## Edge Function Bundle Archive Attempt

Attempted to archive deployed legacy bundles before deletion:

```txt
/Users/chandler/code/mitraauto-edge-function-backups/phase10-legacy-retirement-20260516T021034Z
/Users/chandler/code/mitraauto-edge-function-backups/phase10-legacy-retirement-docker-20260516T021045Z
```

Supabase CLI returned `Error status 500: {"message":"Failed to retrieve function bundle"}` for each legacy function download.

Because the database drop would make those legacy functions broken if called, and because active cron/source had already moved to the raw-selected-webshop lifecycle, the deployed legacy functions were deleted after the final drop gate passed.

Deleted deployed legacy/debug Edge Functions:

```txt
catalog_sync_rd_tires
catalog_sync_rd_rims
catalog_sync_vt_tires
catalog_sync_vt_rims
catalog_normalize_batch
debug_rd_sync_state
make-server-bdaaf773
```

Current deployed raw-sync Edge Functions remain active:

```txt
catalog_sync_raw_rd_tires
catalog_sync_raw_vt_tires
catalog_sync_raw_rd_rims
catalog_sync_raw_vt_rims
```

## Applied Public RPC Canary

Created and applied:

```txt
supabase/migrations/20260516021103_phase10_revoke_legacy_public_catalog_rpcs.sql
```

This migration revokes `PUBLIC` and `anon` execute from old public catalog RPCs:

```txt
storefront_search
storefront_suggest
storefront_product_detail
tires_browse_ui
tires_search_ui
rims_browse_ui
rims_search_ui
```

Verification:

```txt
Old RPC under anon:
storefront_suggest -> permission denied

Current public RPCs under anon:
catalog_count_rims_v1  -> 19353
catalog_count_tires_v1 -> 50 with explicit null feature filters
```

ACL check now shows no `anon` or `PUBLIC` execute grant on the old public RPCs. `authenticated` and `service_role` execute grants remain for rollback/debug while the canary is observed.

Second canary:

```txt
supabase/migrations/20260516021556_phase10_revoke_legacy_authenticated_catalog_rpcs.sql
```

This migration also revokes `authenticated` execute from the same old catalog RPCs. The old RPCs now expose execute only to:

```txt
postgres
service_role
```

Verification:

```txt
Old RPC under authenticated:
storefront_suggest -> permission denied

Current public RPCs under anon:
catalog_count_rims_v1  -> 19353
catalog_count_tires_v1 -> 50 with explicit null feature filters
```

Old public RPC removal:

```txt
supabase/migrations/20260516022000_phase10_drop_legacy_public_catalog_rpcs.sql
```

Dropped old public catalog entry points:

```txt
storefront_search
storefront_suggest
storefront_product_detail
tires_browse_ui
tires_search_ui
rims_browse_ui
rims_search_ui
```

Verification:

```txt
No matching public functions remain for the seven dropped RPC names.
Current public catalog count RPCs still execute under anon.
```

Legacy internal helper access hardening:

```txt
supabase/migrations/20260516093324_phase10_revoke_legacy_internal_catalog_helpers.sql
supabase/migrations/20260516093428_phase10_revoke_legacy_import_overloads.sql
```

These migrations removed `PUBLIC`, `anon`, and `authenticated` execution from old internal import/upsert/normalize helpers that are not used by current source or active cron. `postgres` and `service_role` remain so rollback/debug and still-deployed legacy Edge Functions are not abruptly broken.

Dropped old tire CMS compatibility functions:

```txt
supabase/migrations/20260516093531_phase10_drop_legacy_tire_cms_overloads.sql
```

Removed:

```txt
cms_list_tires_admin_v1(text, boolean, boolean, integer, integer)
cms_list_tires_admin_v1(text, boolean, integer, integer)
cms_resolve_tire_supplier_pricing_v1(text, text)
```

The active tire CMS list/count functions remain:

```txt
cms_list_tires_admin_v1(text, boolean, boolean, text, text, text[], boolean, boolean, text[], integer, integer)
cms_count_tires_admin_v1(text, boolean, boolean, text, text, text[], boolean, boolean, text[])
```

Current legacy-dependent helper hardening:

```txt
supabase/migrations/20260516093623_phase10_harden_current_legacy_dependent_helpers.sql
```

Kept authenticated access but removed `PUBLIC`/`anon` access from:

```txt
catalog_patch_offer_ean_v3
catalog_product_cms_variant_matches_type
```

These are intentionally kept because the first is still called by Tire CMS mutation code and the second is used by CMS product row policies.

Browser smoke after canary:

```txt
https://www.mitra-auto.fi/catalog

Tires tab:
- Loads product cards.
- No permission/error text detected.

Rims tab:
- Opens from the Tires/Rims toggle.
- Shows rim search UI.
- No permission/error text detected.

https://www.mitra-auto.fi/cms#catalog

CMS Tires tab:
- Loads item count: 14344 items total.
- Loads page 1 table rows.
- No permission/fetch/timeout error text detected.

CMS Rims tab:
- Loads item count: 250 items total.
- Loads page 1 table rows.
- No permission/fetch/timeout error text detected.
```

Browser smoke after dropping old public RPCs:

```txt
https://www.mitra-auto.fi/catalog

Storefront Tires:
- Product cards render.
- No permission/fetch/timeout error text detected.

Storefront Rims:
- Rims tab opens.
- Rim search UI renders.
- No permission/fetch/timeout error text detected.

https://www.mitra-auto.fi/cms#catalog

CMS Tires:
- Catalog tab opens from Control Center.
- Tire table renders.
- No permission/fetch/timeout error text detected.

CMS Rims:
- Rims tab opens.
- Rim table renders.
- No permission/fetch/timeout error text detected.
```

Browser smoke after internal helper hardening:

```txt
https://www.mitra-auto.fi/catalog

Storefront Tires:
- Product cards render.
- No permission/fetch/timeout error text detected.

https://www.mitra-auto.fi/cms#catalog

CMS Tires:
- Catalog tab opens from Control Center.
- Tire table renders.
- No permission/fetch/timeout error text detected.
```

## Internal Helper And View Cleanup

Dropped legacy helper/function paths after access hardening and dependency checks:

```txt
supabase/migrations/20260516094705_phase10_drop_legacy_internal_catalog_helpers.sql
supabase/migrations/20260516095045_phase10_drop_legacy_tire_materialized_views.sql
supabase/migrations/20260516095145_phase10_drop_legacy_catalog_compat_views.sql
```

Removed old tire materialized view refresh calls from:

```txt
src/components/cms/tires/useTiresCmsMutations.ts
```

Retired materialized views:

```txt
catalog_tires_public_mv
cms_tires_admin_mv
```

Retired compatibility views included:

```txt
catalog_tires_final_for_ui
catalog_tires_for_ui
catalog_rims_for_ui
catalog_best_tire_offers
catalog_best_rim_offers
catalog_tire_variants_safe
products_final
products_eu_flat
products_search_old_final
products_search_base_old_20251217_080121
products_search_old_backup
products_search_passenger_only_old
products_search_unfiltered_backup
rd_articles_classified
```

Rebuilt current selected CMS views so they no longer depend on `products_search` fallback:

```txt
supabase/migrations/20260516095447_phase10_backfill_selected_product_cms_and_rebuild_selected_views.sql
```

Affected current views:

```txt
catalog_selected_tires_cms_admin_v1
catalog_selected_rims_cms_admin_v1
```

Backfill result:

```txt
Inserted selected product CMS rows: 1549
CMS tire rows after rebuild: 14476
CMS rim rows after rebuild: 42530
```

Removed `products_search` usage from still-current helpers:

```txt
supabase/migrations/20260516095731_phase10_remove_products_search_from_current_helpers.sql
```

Updated:

```txt
catalog_product_cms_variant_matches_type
catalog_patch_offer_ean_v3
```

## Final Snapshot

Created a fresh snapshot immediately before the destructive legacy object drop:

```txt
/Users/chandler/code/mitraauto-db-snapshots/phase10-pre-legacy-drop-20260516T095857Z
```

Snapshot files:

```txt
legacy_catalog_objects.dump
legacy_catalog_objects_schema.sql
```

## Final Legacy Object Drop

Applied:

```txt
supabase/migrations/20260516095912_phase10_drop_legacy_catalog_objects.sql
```

Dropped legacy objects:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
```

Dropped legacy foreign-key constraints that pointed to the retired variant tables:

```txt
cms_product_overrides_variant_id_fkey
cms_product_images_variant_id_fkey
cms_tire_images_variant_id_fkey
cms_tire_eprel_matches_variant_id_fkey
cms_tire_eprel_field_reviews_variant_id_fkey
cms_rim_images_variant_id_fkey
cms_tire_listings_tire_variant_id_fkey
cms_rim_listings_rim_variant_id_fkey
raw_product_links_variant_tire_id_fkey
raw_product_links_variant_rim_id_fkey
supplier_offers_variant_tire_id_fkey
supplier_offers_variant_rim_id_fkey
```

The dependent row data was preserved; only the old foreign-key links to dropped legacy variant tables were removed.

Final object absence check:

```txt
catalog_rim_variants     -> absent
catalog_tire_variants    -> absent
products_search          -> absent
rims_variants            -> absent
supplier_products_raw    -> absent
tires_variants           -> absent
```

Final dependency checks:

```txt
Function references to retired objects: 0
View references to retired objects: 0
Cron references to retired legacy function names: 0
```

Final live current-path checks:

```txt
catalog_count_tires_v1 -> 12629 with default storefront filters
catalog_count_rims_v1  -> 19353
catalog_list_tires_v1  -> 10 rows on page smoke
catalog_list_rims_v1   -> 10 rows on page smoke
cms_list_tires_admin_v1 -> 14476 CMS tire rows
cms_list_rims_admin_v1  -> 42530 CMS rim rows
```

## Recommended Retirement Sequence

### Step 1: Edge Function Retirement

- [x] Confirm no known active pg_cron call uses old function URLs.
- [x] Confirm active pg_cron has no old function URL calls.
- [x] Attempt archive of deployed bundles before deletion.
- [x] Delete old deployed Edge Functions:
  - [x] `catalog_sync_rd_tires`
  - [x] `catalog_sync_rd_rims`
  - [x] `catalog_sync_vt_tires`
  - [x] `catalog_sync_vt_rims`
  - [x] `catalog_normalize_batch`
  - [x] `debug_rd_sync_state`
  - [x] `make-server-bdaaf773`
- [x] Re-run `supabase functions list`.
- [x] Confirm current functions remain:
  - [x] `catalog_sync_raw_rd_tires`
  - [x] `catalog_sync_raw_vt_tires`
  - [x] `catalog_sync_raw_rd_rims`
  - [x] `catalog_sync_raw_vt_rims`

Do not delete current payment, booking, account, invoice, fitment, or notification functions.

### Step 2: Public RPC Canary

- [x] Revoke `anon` execute from old public RPCs or replace them with compatibility wrappers to the new public catalog RPCs.
- [x] Revoke `authenticated` execute from old public RPCs after source check confirmed no app usage.
- [x] Drop old public catalog RPCs after canary verification.
- [x] Revoke client execution from unused old internal import/upsert/normalize helpers.
- [x] Drop old tire CMS compatibility overloads.
- [x] Harden current legacy-dependent CMS helpers by removing `PUBLIC`/`anon`.
- [x] Verify current public tire/rim catalog RPCs still execute under `anon`.
- [x] Verify live storefront still works in browser after deployment.
- [x] Verify CMS catalog still works.
- [x] Browser-smoke current storefront/CMS catalog paths after canary.

Old public RPCs:

```txt
storefront_search
storefront_suggest
storefront_product_detail
tires_browse_ui
tires_search_ui
rims_browse_ui
rims_search_ui
```

### Step 3: DB Function Cleanup

- [x] Drop or replace old import/upsert/normalize functions that reference:
  - [x] `supplier_products_raw`
  - [x] `products_search`
  - [x] `catalog_tire_variants`
  - [x] `catalog_rim_variants`
  - [x] `tires_variants`
  - [x] `rims_variants`
- [x] Re-run function dependency report.
- [x] Continue only when zero functions reference cleanup candidates.

### Step 4: View Cleanup

- [x] Drop or replace old compatibility views/materialized views.
- [x] Re-run view dependency report.
- [x] Continue only when zero views reference cleanup candidates.

### Step 5: Final Drop Gate

- [x] Take a fresh DB snapshot.
- [x] Confirm zero Edge Function blockers.
- [x] Confirm zero function blockers.
- [x] Confirm zero view blockers.
- [x] Confirm zero trigger blockers.
- [x] Prepare and review destructive drop migration.
- [x] Apply destructive migration after the drop gate passed.

## Current Verdict

The legacy catalog cleanup is complete.

The old raw/mixed catalog path has been removed from local source, deployed legacy Edge Functions, public legacy RPCs, internal legacy helpers, compatibility views, materialized views, and the final six legacy DB objects.

Current expected product lifecycle:

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
supplier_raw_rd_rims / supplier_raw_vt_rims
-> selected winner layer
-> CMS Catalog
-> webshop_items
-> public webshop/catalog RPCs
```

Final verification passed:

```txt
git diff --check
npm run i18n:audit
npm run build
```
