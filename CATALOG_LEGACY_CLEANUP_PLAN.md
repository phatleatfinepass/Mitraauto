# Catalog Legacy Cleanup Plan

## Phase 0: Safety Snapshot And Live Audit

- [x] Verify project env loads `PROJECT_SLUG=mitraauto`.
- [x] Verify Supabase MCP uses `supabase-mitra` and project ref `rcmmbwdebnmicrweoiyz`.
- [x] Create a full DB snapshot outside the repo.
- [x] Create a schema-only dump.
- [x] Create a catalog-critical table dump.
- [x] Export object, policy, function, trigger, grant, cron, and catalog table inventories.
- [x] Run current lifecycle row-count checks for tires and rims.
- [x] Run selected-layer and webshop publish health checks.
- [x] Run Supabase security advisors.
- [x] Run Supabase performance advisors.
- [x] Document cleanup gates and unsafe-to-drop objects.

Phase 0 audit report:

```txt
CATALOG_LEGACY_CLEANUP_PHASE0_AUDIT.md
```

Snapshot root:

```txt
/Users/chandler/code/mitraauto-db-snapshots/phase0-catalog-cleanup-20260516T002112Z
```

## Goal

Keep only the current Tires/Rims product lifecycle:

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
supplier_raw_rd_rims / supplier_raw_vt_rims
-> selected winner layer
-> CMS Catalog
-> webshop_items
-> public webshop RPCs
```

Cleanup must be controlled. Frontend cleanup can happen first. Backend/table/function cleanup must wait until cron, RPC, Edge Function, and CMS button dependencies are confirmed.

## Phase 1: Inventory

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

Phase 1 inventory report:

```txt
CATALOG_LEGACY_CLEANUP_PHASE1_INVENTORY.md
```

Phase 1 summary:

- No `RimsCMSPageV2` file/import remains.
- Active CMS Catalog is `CmsControlCenter` -> `TiresCMSPage` / `RimsCMSPage`.
- Compatibility redirects still exist for `/cms/tires`, `/cms-tires`, `/cms/rims`, and `/cms-rims`.
- No active frontend source path reads `supplier_products_raw`.
- Legacy deployed Edge Functions still exist and must be retired before dropping `supplier_products_raw`.
- `products_search`, `catalog_tire_variants`, `catalog_rim_variants`, `tires_variants`, and `rims_variants` still have source references and need Phase 4 review before backend cleanup.

Suggested commands:

```bash
rg -n "RimsCMSPage|RimsCMSPageV2|TiresCMSPage|Catalog|catalog|rims|tires" src
rg -n "supplier_products_raw|supplier_raw_|catalog_selected|webshop_items" src supabase
rg -n "cms_list_.*tires|cms_list_.*rims|webshop_.*tire|webshop_.*rim|sync" src supabase
```

## Phase 2: Route Audit

- [x] Confirm active CMS entry route.
- [x] Confirm active Catalog tab route.
- [x] Confirm tire/rim toggle points to the current components.
- [x] Remove unused route aliases.
- [x] Remove imports for deleted route targets.
- [x] Confirm no old `/cms/tires`, `/cms/rims`, `#tires`, or `#rims` paths are still required unless intentionally supported.

Phase 2 route audit:

```txt
CATALOG_LEGACY_CLEANUP_PHASE2_ROUTE_AUDIT.md
```

Phase 2 implementation:

- Updated `src/components/cms/tires/TiresConflictResolvePage.tsx` so the back button navigates directly to `/cms#catalog/tires` instead of the old `/cms/tires` alias.
- Kept compatibility redirects for one stable deployment cycle:
  - `/cms/tires`
  - `/cms-tires`
  - `/cms/rims`
  - `/cms-rims`
  - `#catalog-tires`
  - `#catalog-rims`

Expected active entry points:

```txt
/cms
/cms#catalog
Catalog tab -> Tires/Rims current UI
```

## Phase 3: Frontend Component Cleanup

- [x] Delete unused old tire table components.
- [x] Delete unused old rim table components.
- [x] Delete old duplicate rim page files.
- [x] Delete old duplicate catalog wrappers.
- [x] Delete unused pagination/table helper components only if no current imports remain.
- [x] Delete old route files after route audit passes.
- [x] Remove stale EPREL table-list summary code that no longer renders in the active table.
- [x] Remove stale i18n keys only after `rg` confirms no usage.
- [x] Remove stale exports from barrel/index files if any.

Phase 3 cleanup report:

```txt
CATALOG_LEGACY_CLEANUP_PHASE3_FRONTEND_CLEANUP.md
```

Phase 3 implementation:

- Removed unused old tire editor section files:
  - `src/components/cms/tires/TiresBadgesSection.tsx`
  - `src/components/cms/tires/TiresEuLabelSection.tsx`
  - `src/components/cms/tires/TiresIdentitySection.tsx`
  - `src/components/cms/tires/TiresSeoSection.tsx`
- No active Tires/Rims table, pagination, toolbar, page, editor hook, or sync hook was removed.
- No rim files were removed because all current rim files are imported by the active rim page/table flow.

Verification:

```bash
rg -n "DeletedComponentName|oldRouteName|oldI18nKey" src
npm run i18n:audit
npm run build
git diff --check
```

## Phase 4: Data Path Audit

- [x] Confirm Tire CMS list reads only current tire CMS RPC/view path.
- [x] Confirm Rim CMS list reads only current rim CMS RPC/view path.
- [x] Confirm Tires no longer use `supplier_products_raw` as source of truth.
- [x] Confirm Rims no longer read old mixed raw/catalog tables.
- [x] Confirm webshop product reads come from `webshop_items` or public webshop RPCs.
- [x] Keep timeout-safe fallback reads only if they use the current published layer.

Phase 4 data path audit:

```txt
CATALOG_LEGACY_CLEANUP_PHASE4_DATA_PATH_AUDIT.md
```

Phase 4 implementation:

- Removed old public storefront fallback reads from `products_search` and `catalog_tire_variants`.
- Removed old CMS order EAN lookup fallbacks through `products_search`, `catalog_tire_variants`, and `catalog_rim_variants`.
- Repointed CMS order EAN lookup to current published `webshop_items`.
- Removed unused local label helper files that wrote to old variant tables.
- Updated catalog README to document public catalog RPCs plus `webshop_items` fallback.

Remaining legacy references are isolated to legacy/debug Edge Function source and server introspection files. They are intentionally deferred to Phase 5/6 because deployed cron/function dependencies must be proven before backend objects are removed.

Expected frontend data paths:

```txt
CMS Tires -> cms_list_tires_admin_v1 / cms_count_tires_admin_v1
CMS Rims  -> cms_list_rims_admin_v1 / cms_count_rims_admin_v1
Storefront -> public webshop tire/rim RPCs or webshop_items-backed helpers
```

## Phase 5: Sync Path Audit

- [x] Confirm tire raw refresh jobs still target active RD/VT raw tire tables.
- [x] Confirm rim raw refresh jobs still target active RD/VT raw rim tables.
- [x] Confirm selected winner rebuild jobs are still active.
- [x] Confirm CMS Apply Sync calls current publish functions.
- [x] Confirm cron calls current functions.
- [x] Confirm admin role checks allow both `admin` and `super_admin`.

Phase 5 sync path audit:

```txt
CATALOG_LEGACY_CLEANUP_PHASE5_SYNC_PATH_AUDIT.md
```

Phase 5 summary:

- Active cron uses `catalog_sync_raw_rd_tires`, `catalog_sync_raw_vt_tires`, `catalog_sync_raw_rd_rims`, and `catalog_sync_raw_vt_rims`.
- Active cron rebuilds selected tires/rims and publishes both product types to `webshop_items`.
- CMS Apply Sync calls current selected rebuild and batched webshop publish functions.
- Tire and rim publish functions accept the admin/super_admin access pattern.
- `catalog_rebuild_selected_rims_admin_v1` delegates access to `cms_has_permission('catalog_rims', 'write')`, which is super-admin-aware.
- Live run evidence shows tire raw, selected, and webshop publish healthy on 2026-05-16.
- The 2026-05-16 RD rim raw sequence had just started during the audit; the latest fully completed rim selected/publish cycle was 2026-05-15.

Old SQL functions were kept during Phase 5 until all of these were confirmed:

- [x] No cron references.
- [x] No frontend references.
- [x] No Edge Function references after Phase 10 deployed legacy function deletion.
- [x] No manual CMS button references.
- [x] No scheduled health checks references.

Phase 5 backend deletion blocker, now resolved in Phase 10:

Supabase still has active deployed legacy/debug Edge Functions including `catalog_sync_rd_tires`, `catalog_sync_rd_rims`, `catalog_sync_vt_tires`, `catalog_sync_vt_rims`, `debug_rd_sync_state`, `make-server-bdaaf773`, and `catalog_normalize_batch`. Do not drop old backend objects until those functions are deleted, archived, or proven unused outside cron.

## Phase 6: Backend Cleanup Plan

Backend cleanup should be separate from frontend deletion.

- [x] Create dependency report for old tables/functions/views.
- [x] Mark cleanup candidates as deprecated first.
- [x] Add DB comments where useful:
  - [x] `deprecated`
  - [x] replacement object
  - [x] planned removal date
- [x] Remove only after one deployment cycle with no references.

Phase 6 backend cleanup plan:

```txt
CATALOG_LEGACY_CLEANUP_PHASE6_BACKEND_CLEANUP_PLAN.md
```

Phase 6 implementation:

- Added non-destructive DB comments through:

```txt
supabase/migrations/20260516012633_catalog_legacy_deprecation_comments.sql
```

- Applied the migration to the live database.
- Verified comments on legacy tables/views/materialized views/functions.
- Confirmed backend deletion is still blocked because live database views/functions depend on old compatibility objects.

Potential cleanup candidates:

- [x] Old tire raw paths based on `supplier_products_raw`.
- [x] Old rim mixed catalog views.
- [x] Old direct raw-to-store functions.
- [x] Old non-batched publish functions.
- [x] Old duplicate health functions.

Phase 6 blocker:

`products_search`, `catalog_tire_variants`, `catalog_rim_variants`, `supplier_products_raw`, `tires_variants`, and `rims_variants` were documented as cleanup candidates and were not safe to drop during Phase 6. Phase 10 later removed the remaining live dependencies, took a fresh snapshot, and dropped them.

## Phase 7: Docs Update

- [x] Update `CMS_CATALOG_FINALIZATION_CHECKLIST.md`.
- [x] Add a “Current Active Lifecycle” section.
- [x] Add a “Removed Legacy Code” section.
- [x] Add a “Kept Intentionally” section for fallbacks and migrations.
- [x] Add “Do Not Reintroduce” notes:
  - [x] No direct `supplier_products_raw` tire source.
  - [x] No storefront direct raw reads.
  - [x] No duplicate Rims CMS page versions.
  - [x] No duplicate Tires/Rims table ownership split.

Phase 7 docs update:

```txt
CATALOG_LEGACY_CLEANUP_PHASE7_DOCS_UPDATE.md
```

Phase 7 implementation:

- Added current active lifecycle to `CMS_CATALOG_FINALIZATION_CHECKLIST.md`.
- Added removed legacy code list.
- Added intentionally kept compatibility/fallback list.
- Added explicit “Do Not Reintroduce” guardrails.
- Kept old DB objects documented as cleanup candidates, not removed objects, because Phase 6 found live DB dependencies.

## Phase 8: Verification

Run:

```bash
npm run build
npm run i18n:audit
git diff --check
```

Phase 8 verification report:

```txt
CATALOG_LEGACY_CLEANUP_PHASE8_VERIFICATION.md
```

Browser QA:

- [x] `/cms#catalog` loads.
- [x] Tire tab loads in authenticated browser session.
- [x] Rim tab loads in authenticated browser session.
- [x] Tire pagination works in authenticated browser session.
- [x] Rim pagination works in authenticated browser session.
- [x] Fast page jumping does not flash empty state in authenticated browser session.
- [x] Nearby preload/indexing path does not block page renders in authenticated browser session.
- [x] Apply Sync control is visible for Tires in authenticated browser session.
- [x] Apply Sync control is visible for Rims in authenticated browser session.
- [x] Storefront tire catalog still loads.
- [x] Storefront rim catalog still loads.
- [x] Booking flow smoke works.

Phase 8 implementation:

- Found and patched a public catalog tab-switch regression in `src/components/catalog/CatalogPage.tsx`.
- Verified tire products reload after switching Rims -> Tires.
- Verified public tire and rim catalog RPCs return counts and page rows.
- Verified CMS tire/rim admin list/count RPCs return page 1 and page 80 rows using the CMS user claim.
- Verified authenticated CMS tire and rim browser pagination.
- Verified authenticated CMS tire far-page jump to page 574 and rim far-page jump to page 426.

Apply Sync note:

The Apply Sync buttons were verified as visible in the authenticated CMS browser. They were not clicked during Phase 8 browser QA because clicking them starts live publish mutations; function access and recent successful runs were already verified in Phase 5 and through live Phase 8 RPC checks.

## Phase 9: Final Safety Review

- [x] Confirm no deleted file is imported.
- [x] Confirm no dead route appears in navigation.
- [x] Confirm Supabase RPCs used by frontend exist.
- [x] Confirm old backend objects are only documented for future removal, not removed prematurely.
- [x] Confirm deploy build passes.

Phase 9 final safety review:

```txt
CATALOG_LEGACY_CLEANUP_PHASE9_FINAL_SAFETY_REVIEW.md
```

Phase 9 summary:

- Deleted file import check is clean.
- Old CMS tire/rim routes remain only as compatibility redirects.
- Current frontend/CMS catalog RPCs exist in the live Supabase project.
- Legacy DB objects are documented with comments and were not dropped.
- The backend deprecation migration is non-destructive.
- Local deploy build passes.

Historical Phase 9 drop safety verdict, superseded by Phase 10:

- At that point, the legacy cleanup candidates were **not safe to drop yet**.
- Active catalog cron jobs are clean and use the new raw sync, selected rebuild, and batched webshop publish paths.
- No trigger action references were found for the six cleanup candidates.
- Live deployed Edge Functions still include active legacy/debug functions.
- Live DB functions and views still reference the old objects.
- Stale local source for old deployed/debug Edge Functions has been removed so it cannot be accidentally redeployed.

Blocked cleanup candidates:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
```

Drop gate:

- [x] Retire active legacy Edge Functions.
- [x] Remove stale local legacy/debug Edge Function source.
- [x] Revoke `PUBLIC`/`anon` execute from old public catalog RPCs as a canary.
- [x] Revoke `authenticated` execute from old public catalog RPCs as a second canary.
- [x] Drop old public catalog RPC entry points after canary verification.
- [x] Revoke client execution from unused old internal legacy helpers.
- [x] Drop old tire CMS compatibility overloads.
- [x] Remove `PUBLIC`/`anon` execution from current legacy-dependent CMS helpers.
- [x] Replace or remove DB functions that reference cleanup candidates.
- [x] Replace or remove DB views that reference cleanup candidates.
- [x] Re-run dependency report until function/view/trigger blockers are zero.
- [x] Take a fresh DB snapshot.
- [x] Apply a separate reviewed destructive migration.

Phase 10 final backend cleanup:

```txt
CATALOG_LEGACY_CLEANUP_PHASE10_BACKEND_RETIREMENT.md
```

Final snapshot before destructive drop:

```txt
/Users/chandler/code/mitraauto-db-snapshots/phase10-pre-legacy-drop-20260516T095857Z
```

Dropped legacy DB objects:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
tires_variants
rims_variants
```

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

Current raw-sync Edge Functions remain active:

```txt
catalog_sync_raw_rd_tires
catalog_sync_raw_vt_tires
catalog_sync_raw_rd_rims
catalog_sync_raw_vt_rims
```

Final dependency report:

```txt
Function references to retired objects: 0
View references to retired objects: 0
Cron references to retired legacy function names: 0
```

## Recommended Execution Split

### Cleanup 1: Frontend

- [x] Old pages.
- [x] Old routes.
- [x] Old unused components.
- [x] Stale i18n keys.
- [x] Active Catalog tab remains stable.

### Cleanup 2: Backend

- [x] DB function/table dependency audit.
- [x] Deprecated object comments.
- [x] Remove stale local source for old deployed/debug Edge Functions.
- [x] Remove deployed legacy/debug Edge Functions.
- [x] Remove public legacy catalog RPCs.
- [x] Remove legacy helper functions and compatibility views.
- [x] Rebuild current selected CMS views without `products_search`.
- [x] Take pre-drop snapshot.
- [x] Apply reviewed destructive legacy object drop migration.

Phase 10 backend retirement:

```txt
CATALOG_LEGACY_CLEANUP_PHASE10_BACKEND_RETIREMENT.md
```
