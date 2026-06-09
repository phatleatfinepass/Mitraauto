# Catalog Legacy Cleanup Phase 7 Docs Update

## Status

Phase 7 is complete.

Updated:

```txt
CMS_CATALOG_FINALIZATION_CHECKLIST.md
CATALOG_LEGACY_CLEANUP_PLAN.md
```

## CMS Catalog Finalization Checklist Updates

Added a top-level `Current Active Lifecycle` section documenting the canonical Tires/Rims path:

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
supplier_raw_rd_rims / supplier_raw_vt_rims
-> catalog_selected_items
-> CMS Catalog overlay/editing
-> webshop_items
-> precomputed search/filter read models
-> public catalog RPCs
```

Added active CMS/storefront/sync entry points:

- CMS shell and current tire/rim pages.
- CMS tire/rim admin RPCs.
- Public tire/rim catalog RPCs.
- Raw, selected, and webshop publish sync functions.

Added `Removed Legacy Code` section for:

- Removed old tire editor section files.
- Removed old local label helper files.
- Removed storefront fallback reads from old `products_search` / variant-table paths.
- Removed old CMS order EAN fallback paths.
- Current replacement through `webshop_items`.

Added `Kept Intentionally` section for:

- Route/hash compatibility aliases.
- CMS page caches and bounded positive preloading.
- Timeout-safe `webshop_items` fallbacks.
- Live selected/admin compatibility views.
- Legacy DB objects marked by comments but not yet safe to drop.
- Deployed legacy/debug Edge Functions pending Phase 8/9 safety review.

Added `Do Not Reintroduce` section:

- No `supplier_products_raw` tire source of truth.
- No storefront direct raw supplier reads.
- No new storefront reads from `products_search`.
- No new CMS order lookups through old catalog variant paths.
- No duplicate Rims CMS page versions.
- No duplicate Tires/Rims table ownership split.
- No non-batched current webshop publish path.
- No backend object drops before dependency reports show zero live references and one stable deployment cycle has passed.

## Notes

The docs intentionally say old DB objects are cleanup candidates, not deleted objects. Phase 6 found live database dependencies and Phase 5 found active deployed legacy/debug Edge Functions, so destructive backend cleanup remains blocked.

