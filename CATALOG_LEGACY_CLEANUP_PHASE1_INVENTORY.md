# Catalog Legacy Cleanup Phase 1 Inventory

Last updated: 2026-05-16

## Phase 1 Status

Progress: 100% for inventory. No files or database objects were deleted during Phase 1.

Update after Phase 10: this inventory is historical. Later phases removed unused tire editor sections, stale local legacy Edge Function source, deployed legacy Edge Functions, legacy public RPCs, compatibility views, and the final legacy DB objects after the drop gate passed.

```txt
[####################] 100%
CMS catalog files: inventoried
Routes/hash redirects: inventoried
Raw/table references: inventoried
RPC/function references: inventoried
Edge Functions: inventoried
Cleanup blockers: documented
```

## Active CMS Catalog Files

### CMS Shell

- `src/components/cms/layout/CmsControlCenter.tsx`
- `src/components/cms/core/CmsAccessContext.tsx`
- `src/components/cms/core/CmsGuard.tsx`
- `src/components/cms/core/CmsTabErrorBoundary.tsx`

### Tires Catalog

- `src/components/cms/tires/TiresCMSPage.tsx`
- `src/components/cms/tires/TiresCmsTableSection.tsx`
- `src/components/cms/tires/TiresCmsToolbar.tsx`
- `src/components/cms/tires/TiresCmsPagination.tsx`
- `src/components/cms/tires/TiresConflictResolvePage.tsx`
- `src/components/cms/tires/TiresBundlePricingSection.tsx`
- `src/components/cms/tires/TiresContentSection.tsx`
- `src/components/cms/tires/TiresImagesSection.tsx`
- `src/components/cms/tires/TiresPricingSection.tsx`
- `src/components/cms/tires/TiresTyreLabelSection.tsx`
- `src/components/cms/tires/TiresVisibilitySection.tsx`
- `src/components/cms/tires/TiresWarningTooltip.tsx`
- `src/components/cms/tires/aiCopy.ts`
- `src/components/cms/tires/eanAudit.ts`
- `src/components/cms/tires/types.ts`
- `src/components/cms/tires/useTiresCmsCatalogSync.ts`
- `src/components/cms/tires/useTiresCmsEditor.ts`
- `src/components/cms/tires/useTiresCmsImages.ts`
- `src/components/cms/tires/useTiresCmsList.ts`
- `src/components/cms/tires/useTiresCmsMutations.ts`
- `src/components/cms/tires/useTiresCmsSupplierMarkup.ts`
- `src/components/cms/tires/useTiresCmsWarnings.ts`

### Rims Catalog

- `src/components/cms/rims/RimsCMSPage.tsx`
- `src/components/cms/rims/RimsCmsTableSection.tsx`
- `src/components/cms/rims/RimsCmsToolbar.tsx`
- `src/components/cms/rims/RimsCmsPagination.tsx`
- `src/components/cms/rims/RimsContentSection.tsx`
- `src/components/cms/rims/RimsImagesSection.tsx`
- `src/components/cms/rims/RimsPricingSection.tsx`
- `src/components/cms/rims/RimsSpecsSection.tsx`
- `src/components/cms/rims/RimsVisibilitySection.tsx`
- `src/components/cms/rims/rimReadiness.ts`
- `src/components/cms/rims/types.ts`
- `src/components/cms/rims/useRimsCmsEditor.ts`
- `src/components/cms/rims/useRimsCmsImages.ts`
- `src/components/cms/rims/useRimsCmsList.ts`
- `src/components/cms/rims/useRimsCmsMutations.ts`

## Duplicate Page Findings

- No `RimsCMSPageV2` file or import remains.
- Only one active rim CMS page remains: `src/components/cms/rims/RimsCMSPage.tsx`.
- Only one active tire CMS page remains: `src/components/cms/tires/TiresCMSPage.tsx`.
- `types.ts` exists in both tire and rim folders by design; that is not a duplicate-page issue.

## Active CMS Route Findings

Active CMS route owners:

- `src/SiteApp.tsx`
- `src/components/cms/layout/CmsControlCenter.tsx`

Current route behavior found:

- `/cms#catalog/tires` resolves to the tire catalog tab.
- `/cms#catalog/rims` resolves to the rim catalog tab.
- `#catalog-rims` and `#catalog/rims` are both accepted in `CmsControlCenter`.
- Compatibility redirects still exist:
  - `/cms/tires` -> `/cms#catalog/tires`
  - `/cms-tires` -> `/cms#catalog/tires`
  - `/cms/rims` -> `/cms#catalog/rims`
  - `/cms-rims` -> `/cms#catalog/rims`
- Tire conflicts still uses:
  - `/cms/tires/conflicts`

Do not remove compatibility redirects until Phase 2 confirms no deployed links, bookmarks, or staff workflows need them.

## Active Frontend Catalog RPCs

### CMS Health And Shell

- `catalog_get_health_summary_v1`
- `catalog_list_tires_v1`
- `catalog_list_rims_v1`
- `catalog_rebuild_selected_tires_admin_v1`
- `catalog_rebuild_selected_rims_admin_v1`
- `catalog_apply_rd_external_stock_v1`
- `catalog_close_stale_zero_progress_sync_runs_admin_v1`

### CMS Tire Catalog

- `cms_count_tires_admin_v1`
- `cms_list_tires_admin_v1`
- `cms_get_tire_admin_pricing_v1`
- `catalog_patch_offer_ean_v3`
- `catalog_sync_cms_item_images_v1`
- `catalog_list_selected_tire_conflicts_v1`
- `catalog_set_selected_item_review_v1`
- `start_webshop_tire_items_sync_v1`
- `refresh_webshop_tire_items_batch_v1`
- `finalize_webshop_tire_items_sync_v1`

### CMS Rim Catalog

- `cms_count_rims_admin_v1`
- `cms_list_rims_admin_v1`
- `start_webshop_rim_items_sync_v1`
- `refresh_webshop_rim_items_batch_v1`
- `finalize_webshop_rim_items_sync_v1`
- `refresh_webshop_rim_search_index_v1`

### Public Storefront

- `catalog_list_tire_filter_options_v1`
- `catalog_list_rim_filter_options_v1`
- `catalog_list_tires_v1`
- `catalog_count_tires_v1`
- `catalog_list_rims_v1`
- `catalog_count_rims_v1`

## Active Frontend Table References

Current intended references:

- `webshop_items`
- `catalog_selected_items`
- `catalog_selected_tire_conflict_queue`

References that need later review before cleanup:

- `products_search`
  - Used by `src/utils/productsSearch.ts` for detail/fallback lookup paths.
  - `src/components/catalog/README.md` still says catalog fetches from `products_search`.
  - Product listing now uses public catalog RPCs, but detail/fallback paths still touch this older view.
- `catalog_tire_variants`
  - Used by `src/utils/productsSearch.ts` as tire search fallback.
  - Used by `src/components/cms/orders/OrdersCMSPage.tsx` as EAN fallback.
- `catalog_rim_variants`
  - Used by `src/components/cms/orders/OrdersCMSPage.tsx` as EAN fallback.
- `tires_variants` and `rims_variants`
  - Used only by `src/lib/supabase/labels.ts`.
  - This file uses a service-role key pattern and appears backend/admin-oriented; it is not imported elsewhere in `src` from the search result.

Do not drop these objects until Phase 4 proves replacements for detail lookup, EAN fallback, and label update paths.

## `supplier_products_raw` Findings

No active frontend source path reads `supplier_products_raw`.

Source references found:

- `supabase/functions/catalog_sync_rd_tires/index.ts`
- `supabase/functions/catalog_sync_rd_rims/index.ts`
- `supabase/functions/debug_rd_sync_state/index.ts`

These are legacy/debug Edge Function paths. They are not the active cron raw refresh path, but the functions are still deployed and active in Supabase, so do not drop `supplier_products_raw` until those functions are retired or redeployed without the dependency.

## Edge Function Inventory

Current raw sync Edge Functions to preserve:

- `catalog_sync_raw_rd_tires`
- `catalog_sync_raw_vt_tires`
- `catalog_sync_raw_rd_rims`
- `catalog_sync_raw_vt_rims`
- `refresh_rd_token_db`
- `catalog_fetch_selected_tire_images`

Legacy deployed Edge Functions still active:

- `catalog_sync_rd_tires`
- `catalog_sync_vt_tires`
- `catalog_sync_rd_rims`
- `catalog_sync_vt_rims`
- `catalog_normalize_batch`
- `debug_rd_sync_state`

Local source exists for:

- `supabase/functions/catalog_sync_rd_tires/index.ts`
- `supabase/functions/catalog_sync_rd_rims/index.ts`
- `supabase/functions/debug_rd_sync_state/index.ts`

Local source was not found under `supabase/functions` for:

- `catalog_sync_vt_tires`
- `catalog_sync_vt_rims`
- `catalog_normalize_batch`

That means deletion/retirement must be done carefully through Supabase function management, not just local file deletion.

## Cron Findings

Live cron references only the new raw sync Edge Functions:

- `catalog_sync_raw_rd_tires`
- `catalog_sync_raw_vt_tires`
- `catalog_sync_raw_rd_rims`
- `catalog_sync_raw_vt_rims`

Live cron did not show active calls to:

- `catalog_sync_rd_tires`
- `catalog_sync_vt_tires`
- `catalog_sync_rd_rims`
- `catalog_sync_vt_rims`
- `catalog_normalize_batch`

## SQL Function Inventory

Legacy/current-compatibility SQL functions that still exist:

- `catalog_normalize_batch(p_supplier_code text, p_limit integer)`
- `catalog_normalize_select_batch(p_limit integer)`
- `catalog_refresh_all(p_limit integer)`
- `refresh_webshop_tire_items_v1()`
- `refresh_webshop_rim_items_v1()`

Dependency check through `pg_depend` did not return dependents for these candidate functions, but this is not enough to drop them yet. Phase 5 must also confirm no cron/manual/CMS/Edge Function workflow calls them.

## Phase 1 Exit Gates

- [x] List all CMS catalog pages/components.
- [x] Find old tire/rim table components.
- [x] Find old duplicate rim pages, including any `RimsCMSPageV2` references.
- [x] Find old duplicate tire pages.
- [x] Find old catalog wrappers that no longer render the active Catalog tab.
- [x] Find old routes/hash routes pointing to removed catalog pages.
- [x] Find old direct reads from `supplier_products_raw`.
- [x] Find old direct reads from mixed catalog/raw tables.
- [x] Find old tire/rim RPC names still referenced by frontend.
- [x] Find old sync functions still referenced by cron or CMS Apply Sync.

## Phase 2 Inputs

Route cleanup should decide what to do with:

- `/cms/tires`
- `/cms-tires`
- `/cms/rims`
- `/cms-rims`
- `/cms/tires/conflicts`
- `#catalog-rims`
- `#catalog/rims`
- `#catalog/tires`

Recommended Phase 2 stance:

- Keep `/cms/tires/conflicts` unless tire conflict UI is intentionally merged into the Catalog tab.
- Keep `/cms#catalog/tires` and `/cms#catalog/rims` as canonical.
- Decide whether compatibility redirects should stay for one more deployment cycle before deletion.
