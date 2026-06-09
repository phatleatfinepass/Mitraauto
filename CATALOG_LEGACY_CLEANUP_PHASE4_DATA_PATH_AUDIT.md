# Catalog Legacy Cleanup Phase 4 Data Path Audit

## Status

Phase 4 is complete for frontend and local source data paths.

The active Tires/Rims user-facing paths now stay on the current lifecycle:

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
supplier_raw_rd_rims / supplier_raw_vt_rims
-> selected winner layer
-> CMS Catalog
-> webshop_items
-> public webshop RPCs
```

## Confirmed Active Paths

### CMS Tires

Active CMS tire list code uses:

```txt
cms_list_tires_admin_v1
cms_count_tires_admin_v1
```

The tire CMS hook can still read current published/selected support layers for enrichment and cache behavior:

```txt
webshop_items
catalog_selected_items
```

It does not use `supplier_products_raw` as the tire source of truth.

### CMS Rims

Active CMS rim list code uses:

```txt
cms_list_rims_admin_v1
cms_count_rims_admin_v1
```

The rim CMS hook can still read `webshop_items` as the current published layer for supplement/fallback behavior.

It does not read the old mixed raw/catalog rim tables from the active CMS list path.

### Storefront Catalog

Active storefront list code uses public catalog RPCs first:

```txt
catalog_list_tires_v1
catalog_count_tires_v1
catalog_list_rims_v1
catalog_count_rims_v1
catalog_get_rim_by_identifier_v1
```

Timeout fallback reads use the current published layer:

```txt
webshop_items
```

The old `products_search` storefront fallback was removed.

### Storefront Product Detail

Tire details resolve from:

```txt
webshop_items
```

Rim details resolve from:

```txt
catalog_get_rim_by_identifier_v1
```

The old `products_search` detail fallback was removed.

### CMS Orders EAN Lookup

Order EAN lookup now resolves products from the current published layer:

```txt
webshop_items
```

Removed lookup dependencies:

```txt
products_search
catalog_tire_variants
catalog_rim_variants
```

## Code Changes

- Removed old public storefront fallback reads from `src/utils/productsSearch.ts`.
- Removed old order EAN fallback reads from `src/components/cms/orders/OrdersCMSPage.tsx`.
- Removed unused local label helpers that wrote to old variant tables:
  - `src/lib/supabase/labels.ts`
  - `src/lib/types/labels.ts`
- Updated `src/components/catalog/README.md` so it documents the current RPC and `webshop_items` paths instead of `products_search`.

## Remaining Legacy References

These references remain intentionally because Phase 4 is an audit/cleanup gate, not the backend deletion phase:

```txt
supabase/functions/catalog_sync_rd_tires/index.ts
supabase/functions/catalog_sync_rd_rims/index.ts
supabase/functions/debug_rd_sync_state/index.ts
supabase/functions/make-server-bdaaf773/index.tsx
src/supabase/functions/server/index.tsx
```

They reference one or more legacy objects:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
```

Do not drop those database objects until Phase 5 confirms cron, deployed Edge Functions, debug tools, CMS buttons, and health checks no longer depend on them.

## Phase 5 Gate

Before backend deletion, confirm:

- [ ] No deployed Edge Function uses `supplier_products_raw`.
- [ ] No deployed Edge Function uses `products_search`.
- [ ] No deployed Edge Function uses `catalog_tire_variants`.
- [ ] No deployed Edge Function uses `catalog_rim_variants`.
- [ ] No cron job calls old raw-to-store or debug functions.
- [ ] No CMS Apply Sync button calls old functions.
- [ ] No health check depends on old mixed catalog objects.

