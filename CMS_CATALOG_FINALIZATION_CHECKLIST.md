# CMS Catalog Finalization Checklist

Goal: prepare one production-ready CMS Catalog workspace with two tracks:

```txt
CMS Catalog
-> Finalize Tires Catalog
-> Full Refactoring Rims Catalog
```

Both product families must end with the same lifecycle:

```txt
supplier raw feeds
-> selected winner layer
-> CMS overlay/editing layer
-> webshop published layer
-> precomputed search/filter read model
-> public storefront RPCs
-> CMS health and sync controls
```

Tires are the functional blueprint, but tires still need final hardening. Rims must be refactored to match the tire CMS architecture and then receive the same read-model hardening.

## Current Snapshot After Folder/i18n Refactor

Last local verification:

- [x] `npm run i18n:audit` passes.
- [x] `npm run build` passes.
- [x] CMS/site folder organization is in place:
  - `src/components/cms/...`
  - `src/components/cms/tires/...`
  - `src/components/cms/rims/...`
  - `src/components/cms/core/...`
  - `src/components/site/...`
  - `src/i18n/...`
  - `src/theme/...`
- [x] UI i18n cleanup is complete for the current refactor scope.
- [x] One canonical rim CMS page exists at `src/components/cms/rims/RimsCMSPage.tsx`.
- [x] Old local `RimsCMSPageV2` has been removed from the active repo structure.
- [x] Tire CMS list has cached page/stale refresh behavior.
- [x] Rim CMS list now has cached page/stale refresh behavior.
- [x] Tire and rim CMS are mounted through one CMS Catalog shell.
- [ ] The Catalog shell still needs shared health, sync status, and readiness counters.
- [ ] The final read-model tables are not created yet:
  - `webshop_tire_search_index`
  - `webshop_rim_search_index`
  - `webshop_tire_filter_options`
  - `webshop_rim_filter_options`
- [ ] Live Supabase acceptance checks still need to be run after the next backend/read-model patch.

## Product-Ready Work Order

1. Finish Tires as product-ready.
   - Resolve/replace the public tire RPC timeout path.
   - Add the tire read model and filter options.
   - Add tire health/readiness visibility in CMS Catalog.
   - Run the tire QA and data acceptance matrix.
2. Finish Rims to tire parity.
   - Keep the tire lifecycle as the blueprint.
   - Add missing rim readiness warnings/queues.
   - Add rim read model and filter options.
   - Finalize rim storefront filters.
   - Run the rim QA and data acceptance matrix.
3. Finalize shared Catalog operations.
   - Shared health panel.
   - Shared sync status.
   - Shared readiness counters.
   - Operator runbook and recovery docs.

## Current Known State

- [x] Tire raw source of truth is `supplier_raw_rd_tires` and `supplier_raw_vt_tires`.
- [x] Tire selected layer feeds `catalog_selected_items`.
- [x] Tire webshop publish runs through `webshop_items`.
- [x] Tire sync jobs currently complete successfully.
- [x] Tire CMS is folderized under `src/components/cms/tires`.
- [x] Tire CMS list is resilient to CMS fetch failures through session cached pages.
- [x] Rim raw source of truth is `supplier_raw_rd_rims` and `supplier_raw_vt_rims`.
- [x] Rim selected layer feeds `catalog_selected_items`.
- [x] Rim webshop publish runs through `webshop_items`.
- [x] Rim sync jobs currently complete successfully.
- [x] Rim public RPC is currently fast after direct `webshop_items`/dynamic sort fixes.
- [x] Rim CMS is folderized under `src/components/cms/rims`.
- [x] Rim CMS list is resilient to CMS fetch failures through session cached pages.
- [x] Rim View Settings drawer exists.
- [x] Rim Apply Sync button has no icon.
- [ ] Tire public RPC timeout is still unresolved.
- [x] Tire and rim CMS are mounted in one shared CMS Catalog experience.
- [ ] Tire and rim CMS are not yet fully aligned in workflow depth.
- [ ] Rims still need CMS parity with tires for warning states, readiness queues, drawer layout, and workflow polish.
- [ ] Neither tires nor rims have the final dedicated precomputed catalog search/read model.

## Target Architecture

### Shared Data Flow

- [x] Supplier raw tables are append/update-only feed snapshots.
- [x] Selected winner layer chooses the sellable product identity and supplier winner.
- [x] CMS layer stores only editorial/override data, not supplier truth.
- [x] Webshop layer stores the published product snapshot for storefront.
- [ ] Search/read model stores fast, precomputed list/filter fields for storefront and CMS list views.
- [ ] Public RPCs read only from the published/read-model layer.
- [x] CMS list views use admin RPCs/fallback published reads instead of direct raw feed reads.
- [ ] Sync jobs are resumable, observable, and do not create duplicate running jobs.
- [ ] Health checks show raw freshness, selected freshness, publish freshness, counts, failures, and stale jobs.

### Supabase Data API Grant Policy

Supabase will stop exposing new `public` tables to the Data API by default. Every new table that must be reachable from `supabase-js`, PostgREST, or GraphQL must include explicit grants, RLS, and policies in the same migration that creates the table.

- [ ] Treat explicit grants as mandatory for every new `public` table.
- [ ] Treat RLS as mandatory for every new `public` table.
- [ ] Add policies immediately after `alter table ... enable row level security`.
- [ ] Do not rely on default `public` schema grants.
- [ ] For public storefront read-model tables, grant only the minimum required access:
  - [ ] `grant select on public.<table> to anon`
  - [ ] `grant select on public.<table> to authenticated`
  - [ ] `grant select, insert, update, delete on public.<table> to service_role` only if service functions write directly
- [ ] For CMS/admin tables, do not grant `anon`.
- [ ] For CMS/admin tables, grant `authenticated` only as needed.
- [ ] For service-only tables, grant only to `service_role` unless the CMS reads them directly.
- [ ] Add read policy for public read-model rows that are safe for storefront display.
- [ ] Add admin read/write policies using CMS account permissions for CMS-maintained tables.
- [ ] Add comments in migrations explaining why each role receives access.
- [ ] Add migration review step: every `create table public.*` must be followed by:
  - [ ] `alter table ... enable row level security`
  - [ ] explicit `grant ... to ...`
  - [ ] at least one matching `create policy`
- [ ] Add a schema audit query before release to find public tables missing grants or RLS.

### Proposed Read Models

- [ ] `webshop_tire_search_index`
- [ ] `webshop_rim_search_index`
- [ ] `webshop_tire_filter_options`
- [ ] `webshop_rim_filter_options`
- [ ] Optional shared health/readiness view:
  - [ ] `catalog_product_readiness_summary_v1`
  - [ ] `catalog_sync_health_summary_v1`

## Phase 0: Freeze Product-Ready Field Contract

### Tires

- [ ] Define required public tire fields:
  - [ ] `variant_id`
  - [ ] `brand`
  - [ ] `model`
  - [ ] `size_string`
  - [ ] `width_mm`
  - [ ] `aspect_ratio`
  - [ ] `diameter_in`
  - [ ] `season`
  - [ ] `load_index`
  - [ ] `speed_rating`
  - [ ] `ean` / `derived_ean`
  - [ ] `final_price_eur`
  - [ ] `stock_qty`
  - [ ] `in_stock`
  - [ ] `hero_image_url`
  - [ ] `gallery`
  - [ ] `eu_fuel`
  - [ ] `eu_wet`
  - [ ] `eu_noise`
  - [ ] `eu_label_json`
  - [ ] `threepmsf`
  - [ ] `ice_approved`
  - [ ] `ev_ready`
  - [ ] `sound_absorber`
  - [ ] `runflat`
  - [ ] `xl_reinforced`
  - [ ] `seo_slug`
  - [ ] `seo_title`
  - [ ] `seo_description`
  - [ ] generated/storefront tags

### Rims

- [ ] Define required public rim fields:
  - [ ] `variant_id`
  - [ ] `brand`
  - [ ] `model`
  - [ ] `size_string`
  - [ ] `width_in`
  - [ ] `rim_diameter_in`
  - [ ] `bolt_pattern`
  - [ ] `et_offset_mm`
  - [ ] `center_bore_mm`
  - [ ] `cb_mm`
  - [ ] `color`
  - [ ] `finish`
  - [ ] `material`
  - [ ] `bolts_included`
  - [ ] `wheel_load_kg`
  - [ ] `winter_approved`
  - [ ] `ean` / `derived_ean`
  - [ ] `final_price_eur`
  - [ ] `stock_qty`
  - [ ] `in_stock`
  - [ ] `hero_image_url`
  - [ ] `gallery`
  - [ ] `seo_slug`
  - [ ] `seo_title`
  - [ ] `seo_description`
  - [ ] generated/storefront tags

### Shared Readiness Rules

- [ ] Public item must have active selected supplier.
- [ ] Public item must have normalized identity.
- [ ] Public item must have sellable price.
- [ ] Public item must have image or approved CMS image override.
- [ ] Public item must not be manually marked not sellable.
- [ ] Public item must not be CMS hidden.
- [ ] CMS must still show incomplete items for correction.
- [ ] Storefront must exclude incomplete/blocked items.
- [ ] Missing-data reasons must be explicit and queryable.

## Phase 1: CMS Catalog Shell

- [x] Add one main CMS tab: `Catalog`.
- [x] Add internal Catalog sub-tab: `Finalize Tires Catalog`.
- [x] Add internal Catalog sub-tab: `Full Refactoring Rims Catalog`.
- [x] Keep tire/rim sub-tabs lazy in behavior by mounting only the active sub-tab.
- [x] Preserve old `#catalog-tires` and `#catalog-rims` hash compatibility.
- [x] Add persistent Catalog sub-tab state through URL hash replacement.
- [x] Add deep links:
  - [x] `#catalog/tires`
  - [x] `#catalog/rims`
- [ ] Add shared Catalog header with health summary.
- [ ] Add shared Catalog sync status panel.
- [ ] Add shared Catalog readiness counters.
- [ ] Add shared empty/error/loading pattern for both tracks.
- [x] Remove duplicate standalone rim CMS V2 route/file from active local repo structure.
- [ ] Remove any remaining duplicate standalone CMS Catalog routes only after the new shell is accepted.

## Phase 2: Tire Catalog Finalization

### Tire Sync And Health

- [x] Confirm latest tire webshop sync completes.
- [x] Confirm no stuck tire sync jobs.
- [ ] Add visible tire sync health card in CMS Catalog.
- [ ] Show latest tire raw RD timestamp.
- [ ] Show latest tire raw VT timestamp.
- [ ] Show latest selected tire rebuild timestamp.
- [ ] Show latest tire webshop publish timestamp.
- [ ] Show processed/total from latest tire publish run.
- [ ] Show tire publish error if any.
- [ ] Add admin action to re-run selected tire rebuild if safe.
- [ ] Add admin action to apply tire webshop publish if safe.
- [ ] Prevent duplicate tire publish runs.
- [ ] Make tire publish resumable if not already fully protected.

### Tire Public RPC Timeout Fix

- [ ] Audit `catalog_list_tires_v1`.
- [ ] Identify why tire RPC times out while direct `webshop_items` reads are fast.
- [ ] Replace heavy tire RPC path with direct published/read-model query.
- [ ] Remove live joins to selected/admin views from public tire listing.
- [ ] Use whitelisted dynamic sort instead of `ORDER BY CASE`.
- [ ] Add indexes for active tire storefront sorts:
  - [ ] price ascending
  - [ ] price descending
  - [ ] brand/model
  - [ ] size filters
  - [ ] season
  - [ ] stock
  - [ ] EU wet/noise sorts if kept
- [ ] Keep count query separate and timeout-tolerant.
- [ ] Add storefront fallback if tire RPC fails.
- [ ] Verify public tire RPC:
  - [ ] no filters
  - [ ] exact size filter
  - [ ] season filter
  - [ ] brand filter
  - [ ] price sort
  - [ ] wet grip sort
  - [ ] noise sort

### Tire CMS Readiness Workflow

- [x] Confirm tire CMS list uses active tire pipeline only:
  - [x] `supplier_raw_rd_tires` / `supplier_raw_vt_tires`
  - [x] `catalog_selected_items`
  - [x] `product_cms`
  - [x] `webshop_items`
- [x] Confirm tire CMS never depends on old `supplier_products_raw`.
- [ ] Add/verify missing-data queues:
  - [x] missing EAN
  - [x] duplicate EAN
  - [x] missing brand/model/size
  - [ ] missing price
  - [x] missing image
  - [ ] missing EU label
  - [x] missing SEO
  - [x] non-passenger/blocked
- [ ] Add readiness badge per row:
  - [ ] product ready
  - [ ] missing required data
  - [x] blocked
  - [x] CMS hidden
  - [x] conflict
- [x] Confirm tire drawer sections:
  - [x] identity
  - [x] images
  - [x] content
  - [x] SEO
  - [x] specs
  - [x] EU label / EPREL
  - [x] pricing
  - [x] visibility
  - [x] warnings
- [x] Confirm Save only writes CMS overlay fields.
- [x] Confirm Apply Sync publishes CMS changes to `webshop_items`.
- [x] Confirm reset CMS overlay behavior.

### Tire Storefront Filters

- [ ] Define final tire storefront filter set:
  - [ ] width
  - [ ] aspect ratio
  - [ ] diameter
  - [ ] season
  - [ ] brand
  - [ ] runflat
  - [ ] XL
  - [ ] studded
  - [ ] EV
  - [ ] sound absorber
  - [ ] in stock
  - [ ] EU wet grip
  - [ ] noise
- [ ] Remove filters that are not available or not reliably populated.
- [ ] Make all filter options come from precomputed options table.
- [ ] Cache filter options client-side.
- [ ] Verify filters return only published product-ready items.

## Phase 3: Rim Catalog Refactor To Tire Parity

### Rim CMS Structure

- [x] Compare `RimsCMSPageV2` structure against `TiresCMSPage`.
- [ ] Align rim CMS toolbar behavior with tires.
- [x] Align rim table layout with tires at the basic list/edit/action level.
- [x] Align rim drawer layout with tires at the basic section level.
- [x] Align rim pagination with tires.
- [x] Align rim cache/stale refresh behavior with tires.
- [ ] Align rim Apply Sync messaging/progress with tires.
- [ ] Align rim warning/readiness badges with tires.
- [x] Remove old `RimsCMSPageV2` once the canonical rim page is accepted.
- [x] Consolidate duplicate rim CMS files in active local repo structure.

### Rim Readiness Workflow

- [ ] Add missing-data queues:
  - [ ] missing EAN
  - [x] missing brand
  - [x] missing model
  - [x] missing size
  - [x] missing width
  - [x] missing diameter
  - [x] missing PCD
  - [x] missing ET
  - [x] missing CB
  - [x] missing price
  - [x] missing image
  - [x] missing SEO
  - [ ] missing material/finish if required
  - [x] blocked/manual not sellable
- [ ] Add readiness badge per row:
  - [ ] product ready
  - [ ] missing required data
  - [ ] blocked
  - [ ] CMS hidden
  - [ ] supplier conflict
- [ ] Add rim row warnings:
  - [ ] incomplete mounting specs
  - [ ] no storefront image
  - [ ] no price
  - [ ] no stock
  - [ ] suspect PCD normalization
  - [ ] suspect ET/CB values
- [ ] Add rim drawer sections:
  - [x] identity
  - [x] images
  - [x] content
  - [x] SEO
  - [x] rim specs
  - [x] pricing
  - [x] visibility
  - [ ] warnings
- [x] Confirm Save only writes CMS overlay fields.
- [x] Confirm Apply Sync publishes CMS changes to `webshop_items`.
- [x] Confirm reset CMS overlay behavior.

### Rim Public Read Path

- [x] Public rim RPC reads fast for first page.
- [x] Public rim RPC reads fast for brand/diameter filtered page.
- [ ] Confirm all rim public filters are backed by indexes/read model.
- [x] Confirm count behavior has direct `webshop_items` timeout-hardening path.
- [ ] Add precomputed rim search index.
- [ ] Move rim public RPC from `webshop_items` direct query to read model when ready.
- [x] Verify no current public rim RPC touches raw/selected/admin views in the final timeout-fix migration.
- [ ] Verify storefront excludes blocked/incomplete rims.

### Rim Storefront Filters

- [ ] Define final rim storefront filter set:
  - [ ] diameter
  - [ ] width
  - [ ] PCD
  - [ ] ET
  - [ ] CB minimum
  - [ ] brand
  - [ ] color/finish
  - [ ] material
  - [ ] bolts included
  - [ ] winter approved
  - [ ] in stock
  - [ ] price sort
  - [ ] brand sort
- [ ] Remove filters that are not reliably available.
- [ ] Make all filter options come from precomputed options table.
- [ ] Cache filter options client-side.
- [ ] Verify filters return only published product-ready items.

## Phase 4: Precomputed Search And Filter Read Model

### Shared Requirements

- [ ] Build read model during publish, not during storefront browsing.
- [ ] Store one row per published product variant.
- [ ] Store normalized search text.
- [ ] Store normalized sort keys.
- [ ] Store filter buckets.
- [ ] Store generated tags.
- [ ] Store readiness/block reason.
- [ ] Store image-ready flag.
- [ ] Store stock-ready flag.
- [ ] Store SEO-ready flag.
- [ ] Add indexes for every public list path.
- [ ] Add rebuild function per product type.
- [ ] Add incremental refresh path during publish.
- [ ] Add fallback rebuild all function for admin maintenance.

### Tire Search Index

- [ ] Create `webshop_tire_search_index`.
- [ ] Enable RLS on `webshop_tire_search_index`.
- [ ] Grant `select` on `webshop_tire_search_index` to `anon` and `authenticated`.
- [ ] Grant write access on `webshop_tire_search_index` only to `service_role` or trusted sync function role.
- [ ] Add public read policy for published, visible tire index rows.
- [ ] Add service/admin write policy if direct table writes are needed.
- [ ] Populate from `webshop_items`.
- [ ] Include tire-specific searchable fields.
- [ ] Include tire-specific filter columns.
- [ ] Include EU label sort/filter columns.
- [ ] Create `webshop_tire_filter_options`.
- [ ] Enable RLS on `webshop_tire_filter_options`.
- [ ] Grant `select` on `webshop_tire_filter_options` to `anon` and `authenticated`.
- [ ] Grant write access on `webshop_tire_filter_options` only to `service_role` or trusted sync function role.
- [ ] Add public read policy for storefront-safe filter option rows.
- [ ] Rewrite public tire RPC to read index.
- [ ] Verify list query under API timeout.
- [ ] Verify count query under API timeout or use precomputed count.

### Rim Search Index

- [ ] Create `webshop_rim_search_index`.
- [ ] Enable RLS on `webshop_rim_search_index`.
- [ ] Grant `select` on `webshop_rim_search_index` to `anon` and `authenticated`.
- [ ] Grant write access on `webshop_rim_search_index` only to `service_role` or trusted sync function role.
- [ ] Add public read policy for published, visible rim index rows.
- [ ] Add service/admin write policy if direct table writes are needed.
- [ ] Populate from `webshop_items`.
- [ ] Include rim-specific searchable fields.
- [ ] Include rim-specific filter columns.
- [ ] Include PCD/ET/CB normalized columns.
- [ ] Create `webshop_rim_filter_options`.
- [ ] Enable RLS on `webshop_rim_filter_options`.
- [ ] Grant `select` on `webshop_rim_filter_options` to `anon` and `authenticated`.
- [ ] Grant write access on `webshop_rim_filter_options` only to `service_role` or trusted sync function role.
- [ ] Add public read policy for storefront-safe filter option rows.
- [ ] Rewrite public rim RPC to read index.
- [ ] Verify list query under API timeout.
- [ ] Verify count query under API timeout or use precomputed count.

## Phase 5: CMS Health And Operations Panel

- [ ] Add shared Catalog health panel.
- [ ] Show tire health:
  - [ ] RD raw latest
  - [ ] VT raw latest
  - [ ] selected latest
  - [ ] webshop latest
  - [ ] latest publish run
  - [ ] running/stuck jobs
  - [ ] public RPC latency
- [ ] Show rim health:
  - [ ] RD raw latest
  - [ ] VT raw latest
  - [ ] selected latest
  - [ ] webshop latest
  - [ ] latest publish run
  - [ ] running/stuck jobs
  - [ ] public RPC latency
- [ ] Add visual health statuses:
  - [ ] healthy
  - [ ] stale
  - [ ] warning
  - [ ] failed
  - [ ] running
- [ ] Add safe admin actions:
  - [ ] refresh health
  - [ ] apply tire publish
  - [ ] apply rim publish
  - [ ] resume stuck publish
  - [ ] close stale zero-progress duplicate run
- [ ] Add clear confirmation for heavy publish actions.

## Phase 6: Performance And Resilience

- [ ] Storefront first page loads under 1 second for tires.
- [ ] Storefront first page loads under 1 second for rims.
- [ ] Filtered storefront queries load under 1.5 seconds.
- [ ] CMS list first page loads under 2 seconds.
- [ ] CMS search/filter list loads under 3 seconds.
- [ ] No public catalog query times out with `57014`.
- [x] No CMS list query hard-fails on `TypeError: Failed to fetch` when a cached/current page exists.
- [x] CMS uses stale-while-revalidate:
  - [x] show cached page immediately
  - [x] refresh in background
  - [x] keep cache if refresh fails
- [x] Public storefront uses fallback path if RPC times out.
- [ ] Count queries are approximate/precomputed where exact count is too expensive.
- [ ] Deep pagination uses cursor pagination or bounded offset strategy.

## Phase 7: QA Matrix

### Tires

- [ ] Open CMS Catalog -> Finalize Tires Catalog.
- [ ] Search by brand.
- [ ] Search by model.
- [ ] Search by EAN.
- [ ] Filter missing image.
- [ ] Filter missing SEO.
- [ ] Filter missing EU label.
- [ ] Edit tire content.
- [ ] Upload/replace tire image.
- [ ] Save tire CMS overlay.
- [ ] Apply tire sync.
- [ ] Confirm `webshop_items` updated.
- [ ] Confirm storefront detail page reflects update.
- [ ] Confirm public tire RPC no longer times out.

### Rims

- [ ] Open CMS Catalog -> Full Refactoring Rims Catalog.
- [ ] Search by brand.
- [ ] Search by model.
- [ ] Search by EAN.
- [ ] Search by PCD.
- [ ] Filter missing image.
- [ ] Filter missing specs.
- [ ] Filter missing SEO.
- [ ] Edit rim content.
- [ ] Edit rim specs override.
- [ ] Upload/replace rim image.
- [ ] Save rim CMS overlay.
- [ ] Apply rim sync.
- [ ] Confirm `webshop_items` updated.
- [ ] Confirm storefront detail page reflects update.
- [ ] Confirm public rim RPC remains fast.

### Storefront

- [ ] Tire catalog first page.
- [ ] Tire exact size search.
- [ ] Tire season filter.
- [ ] Tire brand filter.
- [ ] Tire product detail.
- [ ] Rim catalog first page.
- [ ] Rim diameter filter.
- [ ] Rim PCD filter.
- [ ] Rim vehicle fitment lookup.
- [ ] Rim product detail.
- [ ] Cart add for tire.
- [ ] Cart add for rim.

## Phase 8: Data Acceptance Criteria

### Tires

- [ ] Latest RD raw tire run is fresh.
- [ ] Latest VT raw tire run is fresh.
- [ ] Selected tire rebuild is fresh.
- [ ] Latest tire webshop publish is fresh.
- [ ] No running tire publish job older than expected.
- [ ] No failed latest tire publish job.
- [ ] Public visible tire count matches expected published layer.
- [ ] Blocked/hidden tire counts are explainable.

### Rims

- [ ] Latest RD raw rim run is fresh.
- [ ] Latest VT raw rim run is fresh.
- [ ] Selected rim rebuild is fresh.
- [ ] Latest rim webshop publish is fresh.
- [ ] No running rim publish job older than expected.
- [ ] No failed latest rim publish job.
- [ ] Public visible rim count matches expected published layer.
- [ ] Blocked/hidden rim counts are explainable.
- [ ] Missing image/spec counts are shown in CMS queues.

## Phase 9: Documentation And Handoff

- [ ] Update CMS operator runbook.
- [ ] Document tire sync lifecycle.
- [ ] Document rim sync lifecycle.
- [ ] Document product-ready rules.
- [ ] Document filters shown on storefront.
- [ ] Document CMS overlay fields versus supplier truth fields.
- [ ] Document manual recovery for stuck sync jobs.
- [ ] Document public RPC health checks.
- [ ] Document rollback strategy for read-model migrations.

## Final Completion Definition

The CMS Catalog work is complete when:

- [x] One CMS `Catalog` tab is the accepted entry point in local code.
- [ ] `Finalize Tires Catalog` is product-ready and no public tire RPC timeout remains.
- [ ] `Full Refactoring Rims Catalog` has tire-parity CMS workflow.
- [x] Tires and rims both use the same lifecycle pattern through raw -> selected -> CMS overlay -> webshop publish -> public read.
- [ ] Storefront reads only published/read-model data.
- [x] CMS list views are resilient with cached pages and background refresh.
- [ ] Sync jobs are healthy, resumable, and visible.
- [ ] Product readiness queues are actionable.
- [ ] All QA matrix checks pass.
- [x] `npm run build` passes.
