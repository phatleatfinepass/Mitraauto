# Catalog Legacy Cleanup Phase 2 Route Audit

Last updated: 2026-05-16

## Phase 2 Status

Progress: 100% for route audit. One low-risk canonical route patch was applied.

```txt
[####################] 100%
CMS entry route confirmed
Catalog hash route confirmed
Tire/rim toggle route confirmed
Compatibility aliases reviewed
Internal old-route usage removed
```

## Canonical CMS Routes

Canonical routes to keep:

- `/cms`
- `/cms#catalog`
- `/cms#catalog/tires`
- `/cms#catalog/rims`
- `/cms/tires/conflicts`

The tire conflict route is still intentionally separate because it is a workflow page, not a duplicate tire catalog page.

## Active Route Owners

- `src/SiteApp.tsx`
- `src/components/cms/layout/CmsControlCenter.tsx`

## Route Resolution

`src/SiteApp.tsx` resolves the top-level CMS route:

- `/cms` -> CMS shell
- `/dashboard` -> redirects to `/cms`
- `/cms#catalog`, `/cms#catalog/tires`, `/cms#catalog/rims` -> CMS Catalog tab
- `/cms/tires/conflicts` -> tire conflict resolution page

`src/components/cms/layout/CmsControlCenter.tsx` resolves the catalog subtab:

- `#catalog/tires` -> tire catalog
- `#catalog/rims` -> rim catalog

When the admin changes the Tires/Rims toggle, the hash is replaced with:

- Tire tab: `#catalog/tires`
- Rim tab: `#catalog/rims`

## Compatibility Routes Kept For Now

These route aliases still exist:

- `/cms/tires` -> `/cms#catalog/tires`
- `/cms-tires` -> `/cms#catalog/tires`
- `/cms/rims` -> `/cms#catalog/rims`
- `/cms-rims` -> `/cms#catalog/rims`
- `#catalog-tires` -> catalog tab
- `#catalog-rims` -> rim catalog subtab

Decision: keep these through one stable deployment cycle. They are redirects/aliases, not duplicate page implementations. Removing them now could break staff bookmarks or old Figma/deployed links without reducing runtime complexity much.

## Patch Applied

Internal old-route usage was removed from the tire conflict page.

Changed:

- `src/components/cms/tires/TiresConflictResolvePage.tsx`

Old behavior:

```txt
Back button -> /cms/tires -> redirect -> /cms#catalog/tires
```

New behavior:

```txt
Back button -> /cms#catalog/tires
```

This removes an internal dependency on the old `/cms/tires` alias while preserving external compatibility.

## Search Results

Remaining old route alias references are only in the central router:

- `src/SiteApp.tsx`
  - `/cms/tires`
  - `/cms-tires`
  - `/cms/rims`
  - `/cms-rims`

Remaining catalog hash compatibility is only in:

- `src/SiteApp.tsx`
- `src/components/cms/layout/CmsControlCenter.tsx`

No direct `#tires` or `#rims` route references were found in source.

## Phase 2 Exit Gates

- [x] Confirm active CMS entry route.
- [x] Confirm active Catalog tab route.
- [x] Confirm tire/rim toggle points to the current components.
- [x] Remove internal use of old `/cms/tires` route.
- [x] Preserve compatibility aliases intentionally for one stable deployment cycle.
- [x] Confirm no old `/cms/tires`, `/cms/rims`, `#tires`, or `#rims` paths are required except documented compatibility redirects.

## Phase 3 Inputs

Frontend cleanup can now focus on components, not route uncertainty.

Do not delete:

- `TiresCMSPage`
- `RimsCMSPage`
- `TiresConflictResolvePage`
- `CmsControlCenter`

Potential future route cleanup after one stable deployment cycle:

- Remove `/cms-tires`
- Remove `/cms-rims`
- Remove `/cms/tires` redirect
- Remove `/cms/rims` redirect
- Remove `#catalog-tires`
- Remove `#catalog-rims`
