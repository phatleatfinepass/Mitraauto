# CMS Catalog Finalization Checklist

**Overall weighted progress:** `100%` product-ready completion

```txt
[####################] 100%
```

Progress is weighted by implementation size, not phase count. Phase 0 is complete, Phase 1 shell work is complete, Phase 2 tire finalization is complete, Phase 3 has rim CMS and storefront readiness parity, Phase 4 has tire/rim precomputed search indexes with public RPCs reading from those indexes, Phase 5 has the shared Catalog health/operations panel, Phase 6 has latency verification plus bounded/approximate pagination hardening, Phase 7 has non-destructive CMS/storefront QA plus controlled authenticated CMS mutation evidence, Phase 8 data acceptance is healthy including count consistency and CMS rim readiness queues, and Phase 9 handoff docs are written. Tire and rim publish jobs complete against the live project. Product image storage policies allow `super_admin`, and browser-authenticated file-byte upload/read/delete QA passed for tire and rim image paths.

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
- [x] `npm run fitment:check` passes.
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
- [x] The Catalog shell now has shared health, sync status, and readiness counters.
- [x] Rim CMS table and drawer now show readiness/warning state from the published readiness contract.
- [x] The final read-model tables are created:
  - `webshop_tire_search_index`
  - `webshop_rim_search_index`
  - `webshop_rim_filter_options`
- [x] Tire storefront filter options are precomputed in `webshop_tire_filter_options`.
- [x] Phase 0 Supabase acceptance checks passed after the readiness-contract migration.
- [x] Live Supabase acceptance checks passed after the tire filter options patch.

## Phase 0 Remote Verification

Verified against linked Supabase project `rcmmbwdebnmicrweoiyz` using the shared transaction pooler on port `6543`.

- [x] Migration `20260514120000_catalog_product_readiness_contract_phase0` is applied remotely.
- [x] `webshop_items` has readiness columns:
  - `product_ready`
  - `readiness_reasons`
  - `primary_readiness_reason`
  - `readiness_checked_at`
- [x] Readiness functions exist:
  - `catalog_is_rim_manual_not_sellable`
  - `catalog_is_tire_manual_not_sellable`
  - `catalog_product_primary_readiness_reason`
  - `catalog_product_readiness_reasons`
  - `webshop_items_apply_readiness_contract`
- [x] Trigger exists:
  - `trg_webshop_items_apply_readiness_contract`
- [x] Current ready counts:
  - Tires ready: `12703`
  - Rims ready: `19340`
- [x] Current primary not-ready reasons observed:
  - Tires: `missing_image`, `not_in_selected_catalog`, `duplicate_ean_conflict`, `missing_ean`, `missing_size`
  - Rims: `missing_ean`, `missing_stock`, `missing_mounting_specs`, `missing_image`, `not_in_selected_catalog`

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
- [x] Tire public RPC timeout is resolved by the read-model RPC path.
- [x] Tire and rim CMS are mounted in one shared CMS Catalog experience.
- [x] Tire and rim CMS are aligned in shared Catalog workflow depth.
- [x] Rims have tire-parity warning states, readiness queues, drawer layout, and workflow polish for the current acceptance scope.
- [x] Tires and rims have final dedicated precomputed catalog search/read models.

## Target Architecture

### Shared Data Flow

- [x] Supplier raw tables are append/update-only feed snapshots.
- [x] Selected winner layer chooses the sellable product identity and supplier winner.
- [x] CMS layer stores only editorial/override data, not supplier truth.
- [x] Webshop layer stores the published product snapshot for storefront.
- [x] Search/read model stores fast, precomputed list/filter fields for storefront and CMS list views.
- [x] Public RPCs read only from the published/read-model layer.
- [x] CMS list views use admin RPCs/fallback published reads instead of direct raw feed reads.
- [x] Sync jobs are resumable, observable, and do not create duplicate running jobs.
- [x] Health checks show raw freshness, selected freshness, publish freshness, counts, failures, and stale jobs.

### Supabase Data API Grant Policy

Supabase will stop exposing new `public` tables to the Data API by default. Every new table that must be reachable from `supabase-js`, PostgREST, or GraphQL must include explicit grants, RLS, and policies in the same migration that creates the table.

- [x] Treat explicit grants as mandatory for every new `public` table.
- [x] Treat RLS as mandatory for every new `public` table.
- [x] Add policies immediately after `alter table ... enable row level security`.
- [x] Do not rely on default `public` schema grants.
- [x] For public storefront read-model tables, grant only the minimum required access:
  - [x] `grant select on public.<table> to anon`
  - [x] `grant select on public.<table> to authenticated`
  - [x] `grant select, insert, update, delete on public.<table> to service_role` only if service functions write directly
- [x] For CMS/admin tables, do not grant `anon`.
- [x] For CMS/admin tables, grant `authenticated` only as needed.
- [x] For service-only tables, grant only to `service_role` unless the CMS reads them directly.
- [x] Add read policy for public read-model rows that are safe for storefront display.
- [x] Add admin read/write policies using CMS account permissions for CMS-maintained tables.
- [x] Add comments in migrations explaining why each role receives access.
- [x] Add migration review step: every `create table public.*` must be followed by:
  - [x] `alter table ... enable row level security`
  - [x] explicit `grant ... to ...`
  - [x] at least one matching `create policy`
- [x] Add a schema audit query before release to find public tables missing grants or RLS.

### Read Models

- [x] `webshop_tire_search_index`
- [x] `webshop_rim_search_index`
- [x] `webshop_tire_filter_options`
- [x] `webshop_rim_filter_options`
- [x] Optional shared health/readiness view:
  - [x] `catalog_product_readiness_summary_v1`
  - [x] `catalog_sync_health_summary_v1`

## Phase 0: Freeze Product-Ready Field Contract

Phase 0 defines the contract every later phase must preserve. The published layer and future read-model layer may contain extra fields, but product readiness is judged by the fields below.

Field groups:

- **Required for storefront publish**: if missing or blocked, the item must not be public-visible.
- **Required for filters/search**: needed for expected storefront discovery. Missing values may keep the product visible only if the product type can still be safely sold and the missing value is not part of the active filter contract.
- **Enrichment/merchandising**: improves cards/details but must not block sale unless explicitly listed in readiness rules.
- **CMS-only overlay**: editorial or override data stored in `product_cms`; supplier truth remains in raw/selected layers.

### Tires

- [x] Define required public tire fields.

Required for storefront publish:

- [x] `variant_id`
- [x] `product_type = 'tire'`
- [x] `selected_supplier`
- [x] `selected_external_id`
- [x] `supplier_code_best`
- [x] `brand`
- [x] `model`
- [x] `size_string`
- [x] `width_mm`
- [x] `aspect_ratio`
- [x] `diameter_in`
- [x] `season`
- [x] `ean` or `derived_ean`
- [x] `final_price_eur` or fallback `price`
- [x] `currency`
- [x] `in_stock`
- [x] `stock_qty`
- [x] `hero_image_url` or first valid `gallery` image
- [x] `is_visible = true`
- [x] `publish_status = 'published'`
- [x] `publish_block_reason is null`

Required for tire filters/search:

- [x] `brand`
- [x] `brand_display_name`
- [x] `model`
- [x] `size_string`
- [x] `width_mm`
- [x] `aspect_ratio`
- [x] `diameter_in`
- [x] `season`
- [x] `runflat`
- [x] `xl_reinforced`
- [x] `studded`
- [x] `ev_ready`
- [x] `sound_absorber`
- [x] `in_stock`
- [x] `final_price_eur`
- [x] `eu_wet`
- [x] `eu_noise`

Enrichment/merchandising fields:

- [x] `load_index`
- [x] `speed_rating` / `speed_index`
- [x] `threepmsf`
- [x] `winter_approved`
- [x] `ice_approved`
- [x] `eu_fuel`
- [x] `eu_wet`
- [x] `eu_noise`
- [x] `eu_label_json`
- [x] `eprel_registration_number`
- [x] `eprel_qr_url`
- [x] `eprel_sheet_url`
- [x] `manufacture_year`
- [x] `delivery_days_min`
- [x] `delivery_days_max`
- [x] `gallery`
- [x] `generated_tags` / storefront tags where available

SEO/content fields:

- [x] `card_title`
- [x] `card_subtitle`
- [x] `short_description`
- [x] `long_description`
- [x] `seo_slug`
- [x] `seo_title`
- [x] `seo_description`

CMS overlay fields allowed to override tire presentation:

- [x] `product_cms.title`
- [x] `product_cms.subtitle`
- [x] `product_cms.short_description`
- [x] `product_cms.long_description`
- [x] `product_cms.hero_image_url`
- [x] `product_cms.gallery`
- [x] `product_cms.seo_slug`
- [x] `product_cms.seo_title`
- [x] `product_cms.seo_description`
- [x] `product_cms.is_hidden`
- [x] `product_cms.price_override_eur`
- [x] `product_cms.promo_enabled`
- [x] `product_cms.promo_price_eur`
- [x] `product_cms.spec_overrides.identity`
- [x] `product_cms.spec_overrides.features`
- [x] `product_cms.spec_overrides.eu`
- [x] `product_cms.spec_overrides.tyre_label_section`

Tire product-ready blockers:

- [x] missing active selected winner
- [x] missing normalized brand/model/size
- [x] missing EAN/derived EAN
- [x] duplicate EAN with unresolved multi-spec conflict
- [x] missing sellable price
- [x] missing storefront image
- [x] CMS hidden
- [x] manual non-passenger/not-sellable classification
- [x] no longer present in selected catalog
- [x] publish job failure or stale unpublished CMS change

### Rims

- [x] Define required public rim fields.

Required for storefront publish:

- [x] `variant_id`
- [x] `product_type = 'rim'`
- [x] `selected_supplier`
- [x] `selected_external_id`
- [x] `supplier_code_best`
- [x] `brand`
- [x] `model`
- [x] `size_string`
- [x] `width_in`
- [x] `rim_diameter_in`
- [x] `bolt_pattern`
- [x] `et_offset_mm`
- [x] `center_bore_mm` or `cb_mm`
- [x] `ean` or `derived_ean`
- [x] `final_price_eur` or fallback `price`
- [x] `currency`
- [x] `in_stock`
- [x] `stock_qty`
- [x] `hero_image_url` or first valid `gallery` image
- [x] `is_visible = true`
- [x] `publish_status = 'published'`
- [x] `publish_block_reason is null`

Required for rim filters/search:

- [x] `brand`
- [x] `brand_display_name`
- [x] `model`
- [x] `size_string`
- [x] `width_in`
- [x] `rim_diameter_in`
- [x] normalized `bolt_pattern`
- [x] `et_offset_mm`
- [x] `center_bore_mm` / `cb_mm`
- [x] `color`
- [x] `material`
- [x] `bolts_included`
- [x] `in_stock`
- [x] `final_price_eur`

Enrichment/merchandising fields:

- [x] `finish`
- [x] `wheel_load_kg`
- [x] `winter_approved`
- [x] `delivery_days_min`
- [x] `delivery_days_max`
- [x] `gallery`
- [x] `generated_tags`
- [x] `tags`
- [x] `supplier_image_url` / image source metadata where available

SEO/content fields:

- [x] `card_title`
- [x] `card_subtitle`
- [x] `short_description`
- [x] `long_description`
- [x] `seo_slug`
- [x] `seo_title`
- [x] `seo_description`

CMS overlay fields allowed to override rim presentation:

- [x] `product_cms.title`
- [x] `product_cms.subtitle`
- [x] `product_cms.short_description`
- [x] `product_cms.long_description`
- [x] `product_cms.hero_image_url`
- [x] `product_cms.gallery`
- [x] `product_cms.badges`
- [x] `product_cms.seo_slug`
- [x] `product_cms.seo_title`
- [x] `product_cms.seo_description`
- [x] `product_cms.is_hidden`
- [x] `product_cms.price_override_eur`
- [x] `product_cms.promo_enabled`
- [x] `product_cms.promo_price_eur`
- [x] `product_cms.stock_override`
- [x] `product_cms.force_out_of_stock`
- [x] `product_cms.spec_overrides.identity`
- [x] `product_cms.spec_overrides.rim`
- [x] `product_cms.spec_overrides.classification.manual_not_sellable`

Rim product-ready blockers:

- [x] missing active selected winner
- [x] missing normalized brand/model/size
- [x] missing width/diameter/PCD/ET/CB mounting specs
- [x] missing EAN/derived EAN
- [x] missing sellable price
- [x] missing storefront image
- [x] CMS hidden
- [x] manual not-sellable classification
- [x] force out of stock when stock is required for the storefront view
- [x] no longer present in selected catalog
- [x] publish job failure or stale unpublished CMS change

### Shared Readiness Rules

- [x] Public item must have active selected supplier.
- [x] Public item must have normalized identity.
- [x] Public item must have sellable price.
- [x] Public item must have image or approved CMS image override.
- [x] Public item must not be manually marked not sellable.
- [x] Public item must not be CMS hidden.
- [x] CMS must still show incomplete items for correction.
- [x] Storefront must exclude incomplete/blocked items.
- [x] Missing-data reasons must be explicit and queryable.

Shared readiness reason contract for future read models:

- [x] `ready`
- [x] `missing_selected_winner`
- [x] `missing_identity`
- [x] `missing_ean`
- [x] `duplicate_ean_conflict`
- [x] `missing_size`
- [x] `missing_mounting_specs`
- [x] `missing_price`
- [x] `missing_stock`
- [x] `missing_image`
- [x] `cms_hidden`
- [x] `manual_not_sellable`
- [x] `force_out_of_stock`
- [x] `not_in_selected_catalog`
- [x] `unpublished_cms_changes`
- [x] `sync_failed`

Phase 0 acceptance criteria:

- [x] Field contracts are defined for Tires.
- [x] Field contracts are defined for Rims.
- [x] CMS overlay fields are separated from supplier truth fields.
- [x] Product-ready blockers are explicit for Tires.
- [x] Product-ready blockers are explicit for Rims.
- [x] Shared readiness reasons are named for future read-model tables and health counters.
- [x] Implement the readiness reason contract in a Phase 0 migration for the published layer.
- [x] Backfill readiness reasons for existing published tire rows in the Phase 0 migration.
- [x] Backfill readiness reasons for existing published rim rows in the Phase 0 migration.
- [x] Reuse the same readiness functions in the read-model migrations.

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
- [x] Add shared Catalog header with health summary.
- [x] Add shared Catalog sync status panel.
- [x] Add shared Catalog readiness counters.
- [x] Add shared empty/error/loading pattern for both tracks.
- [x] Remove duplicate standalone rim CMS V2 route/file from active local repo structure.
- [x] Remove any remaining duplicate standalone CMS Catalog routes after the new shell is accepted.

## Phase 2: Tire Catalog Finalization

### Tire Sync And Health

- [x] Confirm latest tire webshop sync completes.
- [x] Confirm no stuck tire sync jobs.
- [x] Add visible tire sync health card in CMS Catalog.
- [x] Show latest tire raw RD timestamp.
- [x] Show latest tire raw VT timestamp.
- [x] Show latest selected tire rebuild timestamp.
- [x] Show latest tire webshop publish timestamp.
- [x] Show processed/total from latest tire publish run.
- [x] Show tire publish error if any.
- [x] Add admin action to re-run selected tire rebuild if safe.
- [x] Add admin action to apply tire webshop publish if safe.
- [x] Prevent duplicate tire publish runs.
- [x] Make tire publish resumable if not already fully protected.

### Tire Public RPC Timeout Fix

- [x] Audit `catalog_list_tires_v1`.
- [x] Identify why tire RPC times out while direct `webshop_items` reads are fast.
- [x] Replace heavy tire RPC path with direct published/read-model query.
- [x] Remove live joins to selected/admin views from public tire listing.
- [x] Use whitelisted dynamic sort instead of `ORDER BY CASE`.
- [x] Add indexes for active tire storefront sorts:
  - [x] price ascending
  - [x] price descending
  - [x] brand/model
  - [x] size filters
  - [x] season
  - [x] stock
  - [x] EU wet/noise sorts if kept
- [x] Keep count query separate and timeout-tolerant.
- [x] Add storefront fallback if tire RPC fails.
- [x] Verify public tire RPC:
  - [x] no filters
  - [x] exact size filter
  - [x] season filter
  - [x] brand filter
  - [x] vehicle type filter
  - [x] price sort
  - [x] wet grip sort
  - [x] noise sort
  - [x] in-stock filter

### Tire CMS Readiness Workflow

- [x] Confirm tire CMS list uses active tire pipeline only:
  - [x] `supplier_raw_rd_tires` / `supplier_raw_vt_tires`
  - [x] `catalog_selected_items`
  - [x] `product_cms`
  - [x] `webshop_items`
- [x] Confirm tire CMS never depends on old `supplier_products_raw`.
- [x] Add/verify missing-data queues:
  - [x] missing EAN
  - [x] duplicate EAN
  - [x] missing brand/model/size
  - [x] missing price
  - [x] missing image
  - [x] missing EU label
  - [x] missing SEO
  - [x] non-passenger/blocked
- [x] Add readiness badge per row:
  - [x] product ready
  - [x] missing required data
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
- [x] Add CMS tire vehicle type / segment filter in View Settings.
- [x] Make CMS tire vehicle type / segment filtering server-side through admin RPCs.
- [x] Verify CMS tire vehicle type / segment counts and filtered page output.

### Tire Storefront Filters

- [x] Define final tire storefront filter set:
  - [x] width
  - [x] aspect ratio
  - [x] diameter
  - [x] season
  - [x] brand
  - [x] vehicle type / tire segment
  - [x] runflat
  - [x] XL
  - [x] studded
  - [x] EV
  - [x] sound absorber
  - [x] in stock
  - [x] EU wet grip
  - [x] noise
- [x] Remove filters that are not available or not reliably populated.
- [x] Make storefront option lists come from precomputed tire options table.
- [x] Cache tire filter options client-side.
- [x] Verify filters return only published product-ready items.

Filter coverage verified on live product-ready tire rows:

- [x] Size fields are populated for all ready tires.
- [x] Season, brand, and vehicle type are populated for all ready tires.
- [x] RunFlat, XL, studded, EV, sound absorber, retreaded, and stock buckets have live counts.
- [x] EU wet grip and noise buckets are populated enough for sorting/filtering.
- [x] EV filter is retained as a derived detector through `webshop_tire_is_ev_ready`, not the raw `ev_ready` column.
- [x] `webshop_tire_filter_options` has RLS enabled.
- [x] `anon` and `authenticated` have explicit `select` grants on `webshop_tire_filter_options`.
- [x] Public RPC `catalog_list_tire_filter_options_v1()` returns precomputed tire filter options.
- [x] Public tire RPC feature filters return only visible, published, product-ready rows:
  - [x] RunFlat
  - [x] XL
  - [x] studded
  - [x] EV
  - [x] sound absorber
  - [x] in stock

## Phase 3: Rim Catalog Refactor To Tire Parity

### Rim CMS Structure

- [x] Compare `RimsCMSPageV2` structure against `TiresCMSPage`.
- [x] Align rim CMS toolbar behavior with tires.
- [x] Align rim table layout with tires at the basic list/edit/action level.
- [x] Align rim drawer layout with tires at the basic section level.
- [x] Align rim pagination with tires.
- [x] Align rim cache/stale refresh behavior with tires.
- [x] Align rim Apply Sync messaging/progress with tires.
- [x] Align rim warning/readiness badges with tires.
- [x] Remove old `RimsCMSPageV2` once the canonical rim page is accepted.
- [x] Consolidate duplicate rim CMS files in active local repo structure.

### Rim Readiness Workflow

- [x] Add missing-data queues:
  - [x] missing EAN
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
  - [x] missing material/finish warning, not readiness-blocking
  - [x] blocked/manual not sellable
- [x] Add readiness badge per row:
  - [x] product ready
  - [x] missing required data
  - [x] blocked
  - [x] CMS hidden
  - [x] supplier conflict
- [x] Add rim row warnings:
  - [x] incomplete mounting specs
  - [x] no storefront image
  - [x] no price
  - [x] no stock
  - [x] suspect PCD normalization
  - [x] suspect ET/CB values
- [x] Add rim drawer sections:
  - [x] identity
  - [x] images
  - [x] content
  - [x] SEO
  - [x] rim specs
  - [x] pricing
  - [x] visibility
  - [x] warnings
- [x] Confirm Save only writes CMS overlay fields.
- [x] Confirm Apply Sync publishes CMS changes to `webshop_items`.
- [x] Confirm reset CMS overlay behavior.
- [x] Patch `cms_list_rims_admin_v1` so the active CMS list RPC returns readiness fields:
  - `is_visible`
  - `product_ready`
  - `readiness_reasons`
  - `primary_readiness_reason`
  - `publish_status`
  - `publish_block_reason`
  - `conflict_status`
  - `conflict_reason`
- [x] Reload PostgREST schema cache after the rim CMS list RPC contract patch.
- [x] Live readiness distribution query completed against `webshop_items` for rims:
  - ready: `19353`
  - missing EAN: `12823`
  - missing stock: `7777`
  - missing mounting specs: `1532`
  - missing image: `1038`
  - not in selected catalog: `36`

### Rim Public Read Path

- [x] Public rim RPC reads fast for first page.
- [x] Public rim RPC reads fast for brand/diameter filtered page.
- [x] Confirm currently exposed rim public filters are backed by direct `webshop_items` indexes.
- [x] Confirm count behavior has direct `webshop_items` timeout-hardening path.
- [x] Add precomputed rim search index.
- [x] Move rim public RPC from `webshop_items` direct query to read model.
- [x] Verify no current public rim RPC touches raw/selected/admin views in the final timeout-fix migration.
- [x] Verify storefront excludes blocked/incomplete rims with `product_ready = true`.
- [x] Patch public rim list RPC, count RPC, filter options RPC, and direct fallback to require `product_ready = true`.
- [x] Add product-ready rim storefront indexes for price, brand, and fitment paths.
- [x] Live public rim verification:
  - first page returns `24`
  - product-ready public count: `19353`
  - blocked/incomplete published-visible rows excluded: `21051`
  - filter option buckets: `12` diameters, `17` widths, `40` PCDs, `14` brands
  - diameter `16` page returns `24`
  - PCD `5x112` page returns `24`

### Rim Storefront Filters

- [x] Define final rim storefront filter set for the current product-ready release:
  - [x] diameter
  - [x] width
  - [x] PCD
  - [x] ET
  - [x] CB minimum
  - [x] brand
  - [x] in stock
  - [x] price sort
  - [x] brand sort
- [x] Remove filters that are not reliably available from the visible storefront release set:
  - [x] color/finish
  - [x] material
  - [x] bolts included
  - [x] winter approved
- [x] Make visible rim filter options come from published product-ready option RPC.
- [x] Cache rim filter options client-side.
- [x] Verify filters return only published product-ready items.

## Phase 4: Precomputed Search And Filter Read Model

### Shared Requirements

- [x] Build read model during publish, not during storefront browsing.
- [x] Store one row per published product variant.
- [x] Store normalized search text.
- [x] Store normalized sort keys.
- [x] Store filter buckets.
- [x] Store generated tags.
- [x] Store readiness/block reason.
- [x] Store image-ready flag.
- [x] Store stock-ready flag.
- [x] Store SEO-ready flag.
- [x] Add indexes for every public list path.
- [x] Add rebuild function per product type.
- [x] Add incremental refresh path during publish.
- [x] Add fallback rebuild all function for admin maintenance.

### Tire Search Index

- [x] Create `webshop_tire_search_index`.
- [x] Enable RLS on `webshop_tire_search_index`.
- [x] Grant `select` on `webshop_tire_search_index` to `anon` and `authenticated`.
- [x] Grant write access on `webshop_tire_search_index` only to `service_role` or trusted sync function role.
- [x] Add public read policy for published, visible tire index rows.
- [x] Add service/admin write policy if direct table writes are needed.
- [x] Populate from `webshop_items`.
- [x] Include tire-specific searchable fields.
- [x] Include tire-specific filter columns.
- [x] Include EU label sort/filter columns.
- [x] Create `webshop_tire_filter_options`.
- [x] Enable RLS on `webshop_tire_filter_options`.
- [x] Grant `select` on `webshop_tire_filter_options` to `anon` and `authenticated`.
- [x] Grant write access on `webshop_tire_filter_options` only to `service_role` or trusted sync function role.
- [x] Add public read policy for storefront-safe filter option rows.
- [x] Rewrite public tire RPC to read index.
- [x] Verify list query under API timeout.
- [x] Verify count query under API timeout or use precomputed count.

### Rim Search Index

- [x] Create `webshop_rim_search_index`.
- [x] Enable RLS on `webshop_rim_search_index`.
- [x] Grant `select` on `webshop_rim_search_index` to `anon` and `authenticated`.
- [x] Grant write access on `webshop_rim_search_index` only to `service_role` or trusted sync function role.
- [x] Add public read policy for published, visible rim index rows.
- [x] Add service/admin write policy if direct table writes are needed.
- [x] Populate from `webshop_items`.
- [x] Include rim-specific searchable fields.
- [x] Include rim-specific filter columns.
- [x] Include PCD/ET/CB normalized columns.
- [x] Create `webshop_rim_filter_options`.
- [x] Enable RLS on `webshop_rim_filter_options`.
- [x] Grant `select` on `webshop_rim_filter_options` to `anon` and `authenticated`.
- [x] Grant write access on `webshop_rim_filter_options` only to `service_role` or trusted sync function role.
- [x] Add public read policy for storefront-safe filter option rows.
- [x] Rewrite public rim RPC to read index.
- [x] Verify list query under API timeout.
- [x] Verify count query under API timeout or use precomputed count.

### Phase 4 Live Verification

- [x] Full search-index rebuild completed:
  - tire index rows: `14389`
  - rim index rows: `40404`
- [x] Public tire index RPC checks under `8000ms`:
  - first page: `24`
  - default count, excluding retreaded by default: `12686`
  - size `205/55R16`: `24`
- [x] Public rim index RPC checks under `8000ms`:
  - first page: `24`
  - product-ready count: `19353`
  - PCD `5x112`: `24`
- [x] Rim filter options now read from `webshop_rim_filter_options`:
  - diameters: `12`
  - widths: `17`
  - PCDs: `40`
  - brands: `14`

## Phase 5: CMS Health And Operations Panel

- [x] Add shared Catalog health panel.
- [x] Show tire health:
  - [x] RD raw latest
  - [x] VT raw latest
  - [x] selected latest
  - [x] webshop latest
  - [x] latest publish run
  - [x] running/stuck jobs
  - [x] public RPC latency
- [x] Show rim health:
  - [x] RD raw latest
  - [x] VT raw latest
  - [x] selected latest
  - [x] webshop latest
  - [x] latest publish run
  - [x] running/stuck jobs
  - [x] public RPC latency
- [x] Add visual health statuses:
  - [x] healthy
  - [x] stale
  - [x] warning
  - [x] failed
  - [x] running
- [x] Add safe admin actions:
  - [x] refresh health
  - [x] apply tire publish
  - [x] apply rim publish
  - [x] resume stuck publish through protected start/apply publish flow
  - [x] close stale zero-progress duplicate run
- [x] Add clear confirmation for heavy publish actions.
- [x] Add admin-checked rim selected rebuild wrapper.
- [x] Add admin-checked stale zero-progress sync-run close helper.
- [x] Live Phase 5 DB verification:
  - admin helper functions present: `2`
  - tire running/stuck runs: `0 / 0`
  - rim running/stuck runs: `0 / 0`

## Phase 6: Performance And Resilience

- [x] Storefront first page loads under 1 second for tires.
- [x] Storefront first page loads under 1 second for rims.
- [x] Filtered storefront queries load under 1.5 seconds.
- [x] CMS list first page loads under 2 seconds.
- [x] CMS search/filter list loads under 3 seconds.
- [x] No public catalog query times out with `57014`.
- [x] No CMS list query hard-fails on `TypeError: Failed to fetch` when a cached/current page exists.
- [x] CMS uses stale-while-revalidate:
  - [x] show cached page immediately
  - [x] refresh in background
  - [x] keep cache if refresh fails
- [x] Public storefront uses fallback path if RPC times out.
- [x] Count queries are approximate/precomputed where exact count is too expensive.
- [x] Deep pagination uses cursor pagination or bounded offset strategy.
- [x] Client storefront requests are bounded:
  - max limit: `100`
  - max public offset: `2400`
- [x] CMS tire/rim exact count calls are time-boxed to `1200ms` and fall back to approximate next-page totals.
- [x] Live Phase 6 latency verification:
  - tire storefront first page: `18.677ms`
  - tire default count from read model: `38.356ms`
  - tire filtered `205/55R16` in-stock page: `16.235ms`
  - rim storefront first page: `17.688ms`
  - rim default count from read model: `157.500ms`
  - rim filtered `5x112` page: `18.858ms`
  - CMS tire first-page list RPC: `15.225ms`
  - CMS tire search list RPC: `45.686ms`
  - CMS rim first-page list RPC: `20.820ms`

## Phase 7: QA Matrix

### Tires

- [x] Open CMS Catalog -> Finalize Tires Catalog.
- [x] Search by brand.
- [x] Search by model.
- [x] Search by EAN.
- [x] Filter missing image.
- [x] Filter missing SEO.
- [x] Filter missing EU label.
- [x] Edit tire content.
- [x] Upload/replace tire image policy accepts CMS `super_admin`.
- [x] Replace tire image URL through controlled CMS overlay QA.
- [x] Save tire CMS overlay.
- [x] Apply tire sync.
- [x] Confirm `webshop_items` updated.
- [x] Confirm storefront detail page reflects update.
- [x] Confirm public tire RPC no longer times out.

### Rims

- [x] Open CMS Catalog -> Full Refactoring Rims Catalog.
- [x] Search by brand.
- [x] Search by model.
- [x] Search by EAN.
- [x] Search by PCD.
- [x] Filter missing image.
- [x] Filter missing specs.
- [x] Filter missing SEO.
- [x] Edit rim content.
- [x] Edit rim specs override.
- [x] Upload/replace rim image policy accepts CMS `super_admin`.
- [x] Replace rim image URL through controlled CMS overlay QA.
- [x] Save rim CMS overlay.
- [x] Apply rim sync.
- [x] Confirm `webshop_items` updated.
- [x] Confirm storefront detail page reflects update.
- [x] Confirm public rim RPC remains fast.

Phase 7 browser storage upload checks remain open. Controlled authenticated CMS overlay mutation was completed through the same database policies and publish functions, but a real browser file upload still requires an operator session and a supplied test image file.

Phase 7 authenticated CMS read QA evidence:

- [x] CMS `catalog_tires` read permission with active `super_admin`: `true`.
- [x] CMS `catalog_rims` read permission with active `super_admin`: `true`.
- [x] Tire CMS default page returns `25` rows.
- [x] Tire CMS brand search returns `25` rows.
- [x] Tire CMS model search returns `15` rows.
- [x] Tire CMS EAN search returns `1` row.
- [x] Tire CMS missing image count returns `14196`.
- [x] Tire CMS missing SEO count returns `14540`.
- [x] Tire CMS missing EU label count returns `0`.
- [x] Rim CMS default page returns `25` rows.
- [x] Rim CMS brand search returns `2` rows.
- [x] Rim CMS model search returns `6` rows.
- [x] Rim CMS EAN search returns `1` row.
- [x] Rim CMS PCD search returns `25` rows.
- [x] Rim CMS missing image count returns `2119`.
- [x] Rim CMS missing specs count returns `1532`.
- [x] Rim CMS missing SEO count returns `42523`.
- [x] Product CMS write policy is patched by `20260515141517_phase9_product_cms_rim_write_policy_fix.sql`.
- [x] Tire content overlay rollback-upsert succeeds as authenticated `aal2`.
- [x] Rim content/spec overlay rollback-upsert succeeds as authenticated `aal2`.

### Storefront

- [x] Tire catalog first page.
- [x] Tire exact size search.
- [x] Tire season filter.
- [x] Tire brand filter.
- [x] Tire vehicle type filter.
- [x] Tire product detail.
- [x] Rim catalog first page.
- [x] Rim diameter filter.
- [x] Rim PCD filter.
- [x] Rim vehicle fitment lookup by known profile.
- [x] Rim product detail.
- [x] Cart add for tire.
- [x] Cart add for rim.

Phase 7 non-destructive live QA evidence:

- [x] Tire storefront first page returns `24` rows in `17.806ms`.
- [x] Tire exact size `205/55R16` returns `24` rows in `17.456ms`.
- [x] Tire seasons are present in the read model:
  - `summer`: `8335`
  - `winter`: `4027`
  - `all_season`: `345`
- [x] Tire summer filter returns `24` rows in `16.928ms`.
- [x] Tire Michelin brand filter returns `24` rows in `102.134ms`.
- [x] Tire vehicle segments are present:
  - `passenger`: `11532`
  - `van_c`: `950`
  - `suv_4x4`: `225`
- [x] Tire passenger vehicle filter returns `24` rows in `16.830ms`.
- [x] Tire detail published-layer lookup returns `1` row in `18.605ms`.
- [x] Rim storefront first page returns `24` rows in `17.288ms`.
- [x] Rim diameter `16` filter returns `24` rows in `16.690ms`.
- [x] Rim PCD `5x112` filter returns `24` rows in `18.133ms`.
- [x] Rim detail RPC was found timing out before the Phase 7 patch.
- [x] Rim detail RPC is patched by `20260515121651_phase7_fast_rim_detail_rpc.sql`.
- [x] Rim detail by `variant_id` returns `1` row in `21.190ms`.
- [x] Rim detail by public identifier returns `1` row in `19.112ms`.
- [x] Browser cart add for tire:
  - local `/catalog` page rendered `24` tire add buttons.
  - clicking the first tire add button wrote one `product_type = tire` item to `mitra-auto-cart`.
- [x] Browser cart add for rim:
  - local `/catalog` rim dimension search rendered `24` rim cards with add buttons.
  - clicking the first rim add button added a `product_type = rim` item with quantity `4`.

Phase 7 live publish/detail QA evidence:

- [x] Latest tire publish run `f7d1c342-753e-4a0f-a103-e4c678df70fa` completed with `14542 / 14542` processed.
- [x] Latest rim publish run `952e7330-4645-4d73-9d66-a669fbfe1c3c` completed with `42523 / 42523` processed.
- [x] Rim publish batch now avoids per-row search-index trigger timeout and refreshes the rim search index in bulk.
- [x] Rim CMS Apply Sync calls `refresh_webshop_rim_search_index_v1` after finalize, so the storefront read model is refreshed after publish.
- [x] Set-based rim search index bulk refresh returned `40404` indexed rows in `36.448s`.
- [x] Published-ready storefront counts match read models:
  - tire search index visible/ready: `12707`
  - rim search index visible/ready: `19353`
  - rim public count RPC: `19353`
- [x] Public tire detail smoke check returned a visible published ready item: `Triangle AdvanteX SUV TR259`.
- [x] Public rim detail RPC smoke check returned in `62.295ms`: `Rautamo Netto BROCK RC32 Titanium Full Pol`.
- [x] Controlled tire CMS overlay publish QA:
  - temporary title `QA Tire CMS Overlay 2026-05-15` and image URL override were saved to `product_cms`.
  - tire publish run `5f68ae34-9606-4bec-9bc7-68908d54f6c6` completed `14542 / 14542`.
  - `webshop_items` detail reflected the temporary title, description, and published ready state.
  - temporary overlay was removed and restore publish run `4580f49a-c2d9-422b-8750-05d397147d18` completed `14542 / 14542`.
  - restored detail returned `Bridgestone Blizzak ICE`; temporary overlay rows remaining: `0`.
- [x] Controlled rim CMS overlay publish QA:
  - temporary title `QA Rim CMS Overlay 2026-05-15` and image URL override were saved to `product_cms`.
  - rim publish run `973f7841-a0a9-441f-864d-4b56aa6beae2` completed `42523 / 42523`.
  - public rim detail RPC reflected the temporary title, description, and image URL override.
  - temporary overlay was removed and restore publish run `383a6dd2-c781-4333-8009-1abc2ce45afa` completed `42523 / 42523`.
  - restored detail returned `Rautamo Netto BROCK RC32 Titanium Full Pol`; temporary overlay rows remaining: `0`.
- [x] Rim fitment profile lookup passed without PII:
  - endpoint: `rim_fitment_profile`
  - factory tyre size: `205/55R16`
  - mounting profile: `5x112`, center bore `57.1`, ET input `45`
  - response returned rim diameter `16`, approved widths `5.5J, 6J, 6.5J, 7J, 7.5J`, and ETRTO-derived alternatives.
- [x] Plate-based vehicle lookup passed with approved fixture/provider plate `XJZ-140`:
  - endpoint: `vehicle_lookup`
  - returned `Hyundai i30 Kombi`
  - factory tyre size: `195/65 R15 91H`
  - follow-up `rim_fitment_profile` returned rim diameter `15`, approved widths `5.5J, 6J, 6.5J, 7J`, and `12` alternatives.
  - provider response did not include rim mounting data, so this verifies the plate -> tyre size -> rim profile path but not PCD/CB/ET enrichment from the provider.
- [x] Product image storage policy now accepts CMS `super_admin`:
  - migration `20260515144505_phase9_product_images_super_admin_policy.sql` applied.
  - `product-images` storage policies now allow `role in ('admin', 'super_admin')`.
  - RLS smoke check inserted and updated a QA object metadata row as `super_admin`.
  - direct SQL delete is blocked by Supabase storage protection as expected; the smoke transaction rolled back and left `0` QA rows.

## Phase 8: Data Acceptance Criteria

### Tires

- [x] Latest RD raw tire run is fresh.
- [x] Latest VT raw tire run is fresh.
- [x] Selected tire rebuild is fresh.
- [x] Latest tire webshop publish is fresh.
- [x] No running tire publish job older than expected.
- [x] No failed latest tire publish job.
- [x] Public visible tire count matches expected published layer.
- [x] Blocked/hidden tire counts are explainable.

### Rims

- [x] Latest RD raw rim run is fresh.
- [x] Latest VT raw rim run is fresh.
- [x] Selected rim rebuild is fresh.
- [x] Latest rim webshop publish is fresh.
- [x] No running rim publish job older than expected.
- [x] No failed latest rim publish job.
- [x] Public visible rim count matches expected published layer.
- [x] Blocked/hidden rim counts are explainable.
- [x] Missing image/spec counts are shown in CMS queues.

Phase 8 live data acceptance evidence:

- [x] RD tire raw latest: `2026-05-15 00:30:33 UTC`, available `25504 / 26184`.
- [x] VT tire raw latest: `2026-05-15 00:50:02 UTC`, available `1901 / 1975`.
- [x] Tire selected latest: `2026-05-15 01:05:00 UTC`, available `14542 / 25201`.
- [x] Tire webshop publish latest: `2026-05-15 01:15:00 UTC`, ready published `12707 / 15342`.
- [x] Latest tire publish run `5c33ed49-4f57-4fd4-b4c3-f9f34efdb4ea` completed `14542 / 14542` with no error.
- [x] RD rim raw latest: `2026-05-15 01:40:33 UTC`, available `43411 / 43446`.
- [x] VT rim raw latest: `2026-05-15 01:50:01 UTC`, available `368 / 373`.
- [x] Rim selected latest: `2026-05-15 02:05:00 UTC`, available `42523 / 42559`.
- [x] Rim webshop publish latest: `2026-05-15 02:15:00 UTC`, ready published `19353 / 42559`.
- [x] Latest rim publish run `39f459e0-a3b5-4176-845d-d8fb6550d962` completed `42523 / 42523` with no error.
- [x] Stale running publish jobs older than 30 minutes: tires `0`, rims `0`.
- [x] Tire blocked/not-ready reasons are explainable:
  - `missing_image`: `1558`
  - `not_in_selected_catalog`: `800`
  - `duplicate_ean_conflict`: `153`
  - `missing_ean`: `86`
  - `missing_size`: `38`
- [x] Rim blocked/not-ready reasons are explainable:
  - `missing_ean`: `12823`
  - `missing_stock`: `7777`
  - `missing_mounting_specs`: `1532`
  - `missing_image`: `1038`
  - `not_in_selected_catalog`: `36`
- [x] Tire public default count matches expected storefront behavior:
  - public count RPC: `12686`
  - expected non-retreaded ready count: `12686`
  - ready retreaded tires excluded by default: `21`
- [x] Tire public count with retreaded included matches ready published count:
  - public count RPC with `includeRetreaded`: `12707`
  - ready tire search index count: `12707`
- [x] Rim public default count matches ready published count:
  - public count RPC: `19353`
  - ready rim search index count: `19353`
- [x] Tire filter options are populated from the read model:
  - `brand`, `width`, `aspect_ratio`, `diameter`, `season`, `stock`, `vehicle_type`, `feature`, `eu_wet`, `eu_noise`
- [x] Rim filter options are populated from the read model:
  - `brands`, `diameters`, `widths`, `pcds`, `et_offsets`, `center_bores`
- [x] Rim CMS readiness queue filters are patched by `20260515122303_phase8_rim_cms_readiness_queue_filters.sql`.
- [x] Rim CMS missing image queue uses published readiness reasons:
  - authenticated CMS count: `2119`
  - first status page returns `25` rows
- [x] Rim CMS missing specs queue uses published readiness reasons:
  - authenticated CMS count: `1532`
  - first status page returns `25` rows

## Phase 9: Documentation And Handoff

- [x] Update CMS operator runbook.
- [x] Document tire sync lifecycle.
- [x] Document rim sync lifecycle.
- [x] Document product-ready rules.
- [x] Document filters shown on storefront.
- [x] Document CMS overlay fields versus supplier truth fields.
- [x] Document manual recovery for stuck sync jobs.
- [x] Document public RPC health checks.
- [x] Document rollback strategy for read-model migrations.

Phase 9 handoff artifact:

- [x] `CATALOG_CMS_OPERATOR_RUNBOOK.md`

Phase 9 grant/view hardening evidence:

- [x] Migration `20260515123908_phase9_catalog_grants_and_summary_views.sql` applied.
- [x] Public read-model tables have RLS enabled:
  - `webshop_tire_search_index`
  - `webshop_rim_search_index`
  - `webshop_tire_filter_options`
  - `webshop_rim_filter_options`
- [x] Public read-model tables grant only `SELECT` to `anon` and `authenticated`.
- [x] Public read-model tables grant `SELECT`, `INSERT`, `UPDATE`, and `DELETE` to `service_role`.
- [x] Public read-model tables have RLS policies for public reads and service refresh writes.
- [x] Shared readiness summary view returns tire/rim readiness counts.
- [x] Shared sync health summary view returns tire/rim raw, selected, publish, and stale-job health.

Final acceptance items:

- Browser file-byte upload QA passed from the local authenticated browser session:
  - uploaded `qa/catalog-upload-policy-smoke/tire-20260515.png` to `product-images`
  - uploaded `qa/catalog-upload-policy-smoke/rim-20260515.png` to `product-images`
  - public reads returned `200`, `image/png`, `68` bytes for both files
  - Storage API delete returned `200`
  - direct storage metadata check confirms `0` QA objects remain
- Plate-based rim fitment lookup passed with approved plate `XJZ-140`, but the provider response did not include rim mounting enrichment. The tyre-size-to-rim-profile path is verified.
- Storefront cart add QA is complete for both tires and rims against the local running app.
- Controlled authenticated CMS overlay mutation and publish QA is complete for both tires and rims, and both test overlays were restored.
- Local non-mutating verification is complete:
  - `npm run i18n:audit`
  - `npm run build`
  - `npm run fitment:check`

## Final Completion Definition

The CMS Catalog work is complete when:

- [x] One CMS `Catalog` tab is the accepted entry point in local code.
- [x] `Finalize Tires Catalog` is product-ready after controlled authenticated CMS mutation QA; public tire RPC timeout is resolved.
- [x] `Full Refactoring Rims Catalog` has tire-parity CMS workflow after controlled authenticated CMS mutation QA.
- [x] Tires and rims both use the same lifecycle pattern through raw -> selected -> CMS overlay -> webshop publish -> public read.
- [x] Storefront reads only published/read-model data.
- [x] CMS list views are resilient with cached pages and background refresh.
- [x] Sync jobs are healthy, resumable, and visible.
- [x] Product readiness queues are actionable.
- [x] All QA matrix checks pass.
- [x] `npm run build` passes.
