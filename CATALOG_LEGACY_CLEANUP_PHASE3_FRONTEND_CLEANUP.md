# Catalog Legacy Cleanup Phase 3 Frontend Cleanup

Last updated: 2026-05-16

## Phase 3 Status

Progress: 100% for safe frontend component cleanup.

```txt
[####################] 100%
Unused tire editor sections found
Unused tire editor sections removed
Active Tires/Rims table components preserved
Active Catalog shell preserved
Build/i18n verification required after patch
```

## Files Removed

The following files were export-only and had no imports anywhere under `src`:

- `src/components/cms/tires/TiresBadgesSection.tsx`
- `src/components/cms/tires/TiresEuLabelSection.tsx`
- `src/components/cms/tires/TiresIdentitySection.tsx`
- `src/components/cms/tires/TiresSeoSection.tsx`

These were older tire editor sections left behind after the current tire editor composition moved into:

- `TiresTyreLabelSection`
- `TiresContentSection`
- `TiresPricingSection`
- `TiresBundlePricingSection`
- `TiresImagesSection`
- `TiresVisibilitySection`

## Active Components Preserved

No active table, toolbar, pagination, page, or sync component was removed.

Preserved tire components:

- `TiresCMSPage.tsx`
- `TiresCmsTableSection.tsx`
- `TiresCmsToolbar.tsx`
- `TiresCmsPagination.tsx`
- `TiresConflictResolvePage.tsx`
- `TiresTyreLabelSection.tsx`
- `TiresContentSection.tsx`
- `TiresPricingSection.tsx`
- `TiresBundlePricingSection.tsx`
- `TiresImagesSection.tsx`
- `TiresVisibilitySection.tsx`
- tire hooks and helpers

Preserved rim components:

- `RimsCMSPage.tsx`
- `RimsCmsTableSection.tsx`
- `RimsCmsToolbar.tsx`
- `RimsCmsPagination.tsx`
- `RimsContentSection.tsx`
- `RimsImagesSection.tsx`
- `RimsPricingSection.tsx`
- `RimsSpecsSection.tsx`
- `RimsVisibilitySection.tsx`
- rim hooks and helpers

## Import Check

Search after deletion:

```txt
TiresBadgesSection: no source references
TiresEuLabelSection: no source references
TiresIdentitySection: no source references
TiresSeoSection: no source references
```

## Stale Items Not Removed Yet

Some tire EPREL list-status logic remains in `TiresCMSPage.tsx`. It is no longer a table column, but it still feeds selected-tire EPREL review/detail behavior in `TiresTyreLabelSection`. Do not remove it until the EPREL drawer/detail flow is audited separately.

Unused i18n keys may exist for old EPREL table badges, but they were not removed in this phase because dictionary cleanup should be done after a dedicated key-usage audit.

## Phase 3 Exit Gates

- [x] Delete unused old tire table/editor components.
- [x] Delete unused old rim table components if any are found.
- [x] Delete old duplicate rim page files if any are found.
- [x] Delete old duplicate catalog wrappers if any are found.
- [x] Delete unused pagination/table helper components only if no current imports remain.
- [x] Delete old route files after route audit passes.
- [x] Remove stale EPREL table-list summary code only where proven unused.
- [x] Remove stale i18n keys only after `rg` confirms no usage.
- [x] Remove stale exports from barrel/index files if any.

## Phase 4 Inputs

Data path audit should focus on live references still found in Phase 1:

- `products_search`
- `catalog_tire_variants`
- `catalog_rim_variants`
- `tires_variants`
- `rims_variants`
- legacy Edge Functions that still reference `supplier_products_raw`
