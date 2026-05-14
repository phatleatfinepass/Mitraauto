# Rim Catalog Refactor Checklist

Goal: make rims product-ready like tires by moving them to the same lifecycle:

```txt
supplier_raw_rd_rims / supplier_raw_vt_rims
-> selected rim winner layer
-> CMS/admin overlay layer
-> webshop_items publish snapshot
-> public webshop rim RPCs
```

Tires are the model. The active tire path is already fixed and healthy:

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
-> catalog_selected_items
-> catalog_selected_tires_cms_admin_v1 + product_cms overlays
-> webshop_items publish snapshot
-> public webshop tire RPCs
```

Important: CMS is not the source of supplier truth. CMS sits after selected
supplier normalization and before publish, where it contributes content,
visibility, spec overrides, images, SEO, badges, and pricing overrides.

## Current Findings

- [x] Do not use `supplier_products_raw` as the current tire source of truth.
- [x] Confirm tire raw source of truth is `supplier_raw_rd_tires` and `supplier_raw_vt_tires`.
- [x] Confirm tires now publish through selected catalog and `webshop_items`.
- [x] Confirm tire publish auth now allows both `admin` and `super_admin`.
- [ ] Confirm current public visible rim count before each phase.
- [ ] Confirm current RD rim raw sync still uses the old mixed `supplier_products_raw` path.
- [ ] Confirm current VT rim raw sync is missing or stale.
- [ ] Confirm current public rim RPCs still read from the interim product/search layer.
- [ ] Confirm current rim CMS writes through `product_cms` and does not overwrite supplier feed fields.

## Phase 1: Rim Lifecycle Contract

- [x] Create clean raw supplier table migration:
  - [x] `supplier_raw_rim_sync_runs`
  - [x] `supplier_raw_rd_rims`
  - [x] `supplier_raw_vt_rims`
- [x] Create clean RD raw rim sync function:
  - [x] `catalog_sync_raw_rd_rims`
- [x] Create clean VT raw rim sync function:
  - [x] `catalog_sync_raw_vt_rims`
- [x] Keep old `catalog_sync_rd_rims` untouched until the new path is proven.
- [x] Add run logging equivalent to tire raw sync.
- [x] Add stale/unavailable marking only after successful full/feed runs.
- [x] Apply/deploy raw rim migration after review.
- [x] Deploy new raw rim sync edge functions after review.
- [x] Add health checks for raw freshness:
  - [x] RD latest successful rim raw run
  - [x] VT latest successful rim raw run
  - [x] RD latest seen rim row
  - [x] VT latest seen rim row

## Phase 2: Raw Rim Field Contract

- [x] Define required raw-normalized rim fields:
  - [x] `external_id`
  - [x] `source_sku`
  - [x] `ean`
  - [x] `brand`
  - [x] `model`
  - [x] `article_text` / `description`
  - [x] `size_text`
  - [x] `width_in`
  - [x] `rim_diameter_in`
  - [x] `bolt_count`
  - [x] `bolt_circle`
  - [x] `bolt_pattern`
  - [x] `et_offset_mm`
  - [x] `center_bore_mm`
  - [x] `color`
  - [x] `finish`
  - [x] `material`
  - [x] `seat_type`
  - [x] `bolts_included`
  - [x] `wheel_load_kg`
  - [x] `winter_approved`
  - [x] `stock_qty`
  - [x] `wholesale_price_eur`
  - [x] `consumer_price_eur`
  - [x] `retail_price_eur`
  - [x] `image_url`
  - [x] `gallery`
  - [x] `raw_payload`
  - [x] `raw_checksum`
  - [x] `last_seen_at`
  - [x] `is_available`
- [x] Add raw table indexes for likely selected rebuild queries:
  - [x] availability
  - [x] brand/model
  - [x] diameter
  - [x] width
  - [x] PCD
  - [x] ET
  - [x] center bore
  - [x] EAN

## Phase 3: RD Rim Normalization

- [x] Map `ArticleId` to supplier external id.
- [x] Map `ManufacturerArticleId` to supplier SKU.
- [x] Map `EAN` to EAN.
- [x] Map `BrandName` to brand.
- [x] Map `PatternModelText` or parsed `ArticleText` to model.
- [x] Map `ArticleText` to supplier fallback title/description only.
- [x] Map `Width` to `width_in`.
- [x] Map `Diameter` to `rim_diameter_in`.
- [x] Map `NumberOfBolts` + `BoltCircle` to normalized `bolt_pattern`.
- [x] Normalize PCD to ASCII storage, for example `5x112` and `5x114,3`.
- [x] Map `Offset` to `et_offset_mm`.
- [x] Map `CenterBore` to `center_bore_mm`.
- [x] Map `MaximumLoad` to `wheel_load_kg`.
- [x] Map `SeatType` to supplier metadata or `seat_type`.
- [x] Map `MainGroupName` to material candidate:
  - [x] alloy / kevytmetalli
  - [x] steel / pelti / teräs
- [x] Map `Color` when present.
- [x] Map `NetPrice`, `Price`, and `RetailPrice` to supplier pricing metadata.
- [x] Decide selected-layer storefront base price source for RD.
  - [x] Use `coalesce(wholesale_price_eur, consumer_price_eur, retail_price_eur)` as the selected-layer base until margin/pricing rules are applied.
- [x] Map `QuantityAvailable` and `QuantityExternal` to stock fields.
- [x] Map `ExternalDeliveryTime` to delivery estimate.
- [x] Map `ImageId` to RD image URL.
- [x] Store full RD raw payload for debugging.
- [x] Verify RD completeness after normalization.
  - [x] Sample run `68caba2c-aecc-4302-8acb-1cc7d4a01440`: 100/100 rows had brand, model, width, diameter, PCD, ET, CB, price, and image.

## Phase 4: VT Rim Sync And Normalization

- [x] Create or restore a VT rim sync function.
- [x] Use the VT wheels XML endpoint, expected shape from baseline: `wholesale_wheels.php?id=...`.
- [x] Parse XML with the same safe parser pattern used by VT tires.
- [x] Upsert VT rim rows into `supplier_raw_vt_rims`.
- [x] Mark unavailable VT rim rows when not seen in the latest successful run.
- [x] Add sync run logging for VT rims.
- [x] Add cron/job wiring only after manual sync succeeds.
- [x] Map `Product_id` to supplier external id.
- [x] Map `Code` to SKU.
- [x] Map `Brand` to brand.
- [x] Map `Model` to model.
- [x] Map `Description` to supplier description fallback.
- [x] Map `EAN` to EAN.
- [x] Map `Size` to size string.
- [x] Map `Rim_width` to `width_in`.
- [x] Map `Rim_diameter` to `rim_diameter_in`.
- [x] Map `PCD` to normalized `bolt_pattern`.
- [x] Map `ET` to `et_offset_mm`.
- [x] Map `CB` to `center_bore_mm`.
- [x] Map `Bolts_included` to boolean `bolts_included`.
- [x] Map `Wheel_load` to `wheel_load_kg`.
- [x] Map `Winter` to `winter_approved`.
- [x] Map `Image_Url` to supplier image URL.
- [x] Map `ExtraImages` to supplier gallery fallback.
- [x] Map `Wholesale_price_eur` and `Consumer_price_eur` to supplier pricing metadata.
- [x] Decide selected-layer storefront base price source for VT.
  - [x] Use `coalesce(wholesale_price_eur, consumer_price_eur)` as the selected-layer base until margin/pricing rules are applied.
- [x] Map `Available_pcs` and `Availability.Warehouse.Quantity` to stock fields.
- [x] Verify VT completeness after normalization.
  - [x] Run `afccb211-6a34-43ea-ab1d-d58bc2d23a95`: 373/373 rows had brand, width, diameter, PCD, ET, CB, price, bolts flag, and winter flag.
  - [x] Supplier omissions tracked: 4/373 missing model/image, 5/373 missing wheel load after parser fix.

## Phase 5: Selected Rim Winner Layer

- [x] Decide whether rims reuse `catalog_selected_items` or get `catalog_selected_rims`.
- [x] Reuse `catalog_selected_items`, extending it for rim fields.
- [x] Build selected rim identity rules:
  - [x] supplier priority
  - [x] EAN match
  - [x] SKU fallback
  - [x] brand/model/spec fallback
- [x] Merge RD and VT candidates into one selected winner per sellable rim.
- [x] Preserve supplier alternates for diagnostics.
- [x] Apply CMS overlays after supplier winner selection.
- [x] Apply Phase 5 migration and run selected rim rebuild.
  - [x] Initial validation run `07da8bc8-7100-4c42-94ed-67ac1f162e1f`: 10,000 RD raw rows + 373 VT raw rows produced 9,513 selected rim winners.
  - [x] Full RD raw batch loaded after this validation: 43,368 RD rows across pages 1-5, final page run `4741be18-326f-494e-bec4-fd879a83f298`.
  - [x] Full rebuild run `f5ac73d0-8e56-44b1-b8a4-11e5ecedf6b5`: 43,368 RD raw rows + 373 VT raw rows produced 42,481 selected rim winners.
  - [x] Winner distribution verified: 42,154 RD winners and 327 VT winners.
  - [x] Match confidence verified: 28,227 high, 14,234 medium, 20 low.
- [x] Generate normalized selected/public candidate fields:
  - [x] `variant_id`
  - [x] `product_type`
  - [x] `brand`
  - [x] `model`
  - [x] `size_string`
  - [x] `width_in`
  - [x] `rim_diameter_in`
  - [x] `bolt_pattern`
  - [x] `et_offset_mm`
  - [x] `center_bore_mm`
  - [x] `material`
  - [x] `color`
  - [x] `finish`
  - [x] `bolts_included`
  - [x] `wheel_load_kg`
  - [x] `winter_approved`
  - [x] `best_image_url`
  - [x] `gallery`
  - [x] `final_price_eur`
  - [x] `stock_qty`
  - [x] `supplier_code_best`
  - [x] `supplier_external_id_best`
- [x] Add incomplete-item protection:
  - [x] hide public rims with no active supplier
  - [x] hide public rims with no price
  - [x] hide public rims with no image unless CMS explicitly provides one
  - [x] keep CMS/admin visibility for incomplete rims

## Phase 6: Webshop Publish

- [x] Add rim CMS/admin overlay view before publish:
  - [x] direct `product_cms.variant_id = selected_rim.id`
  - [x] legacy fallback only when needed, for example EAN/SKU/spec match
  - [x] `cms_data` JSON matching tire CMS shape
  - [x] `spec_overrides`
  - [x] `price_override_eur`
  - [x] promo pricing
  - [x] `is_hidden`
  - [x] SEO fields
  - [x] hero/gallery image overrides
  - [x] manual badges
    - Applied migration: `20260510021929_rim_cms_overlay_badges_phase6.sql`.
    - `product_cms.badges` now flows into `catalog_selected_rims_cms_admin_v1.cms_data.badges`.
- [x] Add selected-rim plus CMS overlay to `webshop_items` publish function.
  - Applied migration: `20260510013806_rim_cms_overlay_webshop_publish_phase6.sql`.
  - Manual publish result on 2026-05-10: `42,481` rim rows upserted into `webshop_items`.
  - Published storefront-ready rims: `40,367`.
  - Blocked rims: `2,114`, all blocked for `missing_image`.
  - Price coverage after publish: `42,481 / 42,481`.
  - CMS overlay coverage at publish time: `0 / 42,481`; current rim CMS content still needs to be authored or migrated onto selected rim IDs.
- [x] Batch publish like tires.
  - Applied migration: `20260510015411_rim_webshop_batch_sync_phase6.sql`.
  - Added `webshop_rim_sync_runs`.
  - Added `start_webshop_rim_items_sync_v1()`.
  - Added `refresh_webshop_rim_items_batch_v1(uuid, integer)`.
  - Added `finalize_webshop_rim_items_sync_v1(uuid)`.
  - Added `webshop_items.last_rim_sync_run_id` and `webshop_items.last_rim_synced_at`.
- [x] Allow both `admin` and `super_admin` roles for manual CMS apply sync.
- [x] Add rim publish run log and counts:
  - [x] processed
  - [x] inserted
  - [x] updated
  - [x] skipped/incomplete
  - [x] failed
- [x] Add tire-style manual rim exclusion:
  - [x] helper: `catalog_is_rim_manual_not_sellable(jsonb)`
  - [x] supported override keys: `classification.not_sellable_manual`, `classification.exclude_from_storefront`, `classification.manual_not_sellable`, `classification.rim_not_product_ready`
  - [x] publish block reason: `manual_not_sellable`
  - [x] batch publish respects manual exclusion
  - [x] full-refresh fallback respects manual exclusion
  - Applied fallback patch migration: `20260510015713_rim_full_refresh_manual_exclusion_phase6.sql`.
- [x] Add cron health check:
  - [x] raw refresh status
  - [x] selected rebuild status
  - [x] webshop publish status
  - [x] freshness threshold/pass-fail policy
  - Applied migration: `20260510020100_rim_phase6_cron_health_policy.sql`.
  - Scheduled selected rebuild: `catalog_selected_rims_after_raw_daily` at `02:05 UTC`.
  - Scheduled batched publish: `webshop_rim_items_after_selected_daily` at `02:15 UTC`.
  - Applied timeout patch: `20260510020524_rim_publish_cron_timeout_phase6.sql`.
  - Applied cron command timeout patch: `20260510022056_rim_publish_cron_set_timeout_before_do_phase6.sql`.
  - Health policy thresholds: raw `36h`, selected `36h`, webshop `36h`.
  - Health policy also requires selected newer than latest raw and webshop newer than selected.
  - Manual verification run on 2026-05-10:
    - selected run: `f880e5c3-52e9-41b7-b04e-55702afd33a5`
    - webshop run: `08d4d27f-d644-4cf2-aeee-85e57f5f0f43`
    - processed: `42,481 / 42,481`
    - published: `40,367`
    - blocked/skipped incomplete: `2,114`
    - failed: `0`
    - lifecycle health: `healthy`
- [x] Make public storefront rim RPCs read from `webshop_items`.
  - Applied migration: `20260510020137_rim_public_rpc_from_webshop_items_phase6.sql`.
  - Smoke test result: `catalog_count_rims_v1 = 40,367`, list RPC returned rows, detail lookup by `variant_id` worked, brand list returned `23` brands.

## Phase 7: Storefront Filters

- [x] Hide broken filters until data is populated:
  - [x] color
  - [x] finish
  - [x] material
  - [x] bolts included
  - [x] winter approved
  - [x] load rating
- [x] Keep reliable filters:
  - [x] diameter
  - [x] width
  - [x] PCD
  - [x] ET
  - [x] center bore minimum
  - [x] in stock
  - [x] sort
- [x] Add missing reliable filters:
  - [x] free text search
  - [x] brand
- [x] Add `catalog_list_rim_brands_v1` or equivalent DB-backed brand list.
- [x] Make brand options dynamic, like tire filters.
- [x] Add dynamic published-catalog option source for diameter, width, PCD, and brand.
  - Applied migration: `20260510022630_rim_dynamic_filter_options_phase7.sql`.
  - `catalog_list_rim_filter_options_v1()` returns `23` diameters, `26` widths, `65` PCDs, and `23` brands.
- [x] Normalize customer PCD display to `5x112` / `5x114,3` consistently.
  - Verified `5x114,3` option returns `5,739` published rims.
- [x] Use center bore minimum logic, not exact-only logic.
- [x] Keep license plate rim search, but do not claim full fitment until mounting data exists.
  - CTA changed from full compatibility wording to rim-size wording.
- [x] Verify visible brand and search filters affect the RPC result count correctly.
- [x] Verify filters produce non-empty results for common examples:
  - [x] `5x112`: `13,359`
  - [x] `5x114,3`: `5,739`
  - [x] `5x120`: `2,995`
  - [x] `18"`: `7,752`
  - [x] `8J`: `6,632`

## Phase 8: Generated Tags

- [x] Add `generated_tags` to public rim output.
  - Applied migration: `20260510023323_rim_generated_tags_phase8.sql`.
  - `catalog_rims_public_v1` now returns `generated_tags`.
- [x] Generate reliable technical tags:
  - [x] diameter, for example `18"`
  - [x] width, for example `8J`
  - [x] PCD, for example `5x112`
  - [x] ET, for example `ET35`
  - [x] CB, for example `CB66.6`
  - [x] in stock
- [x] After selected normalization, add tags for:
  - [x] alloy
  - [x] steel
  - [x] bolts included
  - [x] winter approved
  - [x] wheel load, for example `Load 800 kg`
  - [x] color
  - [x] finish
- [x] Merge generated tags with `product_cms.badges`.
  - Public `tags` are generated tags first, then CMS badges.
- [x] Do not write generated tags into CMS rows.
  - Generated tags are computed at public output time.
- [x] Make duplicate tag handling deterministic.
  - Case-insensitive duplicates keep the first generated/CMS order. Example merge: `["18\"", "Alloy"] + ["alloy", "Sale", "18\""] -> ["18\"", "Alloy", "Sale"]`.
- [x] Verify tags on rim cards and product detail page.
  - `RimCard` displays generated tag chips.
  - `ProductDetailPage` displays rim generated/CMS tags as badges.
  - Public sample: `18"`, `8J`, `5x112`, `ET31`, `CB66.6`, `Alloy`, `Load 750 kg`, `Musta`.

## Phase 9: Rim CMS Refactor

- [x] Create `src/components/cms/rims/types.ts`.
- [x] Create `src/components/cms/rims/useRimsCmsList.ts`.
  - Reads `cms_list_rims_admin_v1` / `cms_count_rims_admin_v1`, backed by `catalog_selected_rims_cms_admin_v1`.
- [x] Create `src/components/cms/rims/useRimsCmsEditor.ts`.
- [x] Create `src/components/cms/rims/useRimsCmsMutations.ts`.
  - Saves CMS overrides, queues webshop publish, and exposes rim Apply Sync.
- [x] Create `src/components/cms/rims/useRimsCmsImages.ts`.
- [x] Create `src/components/cms/rims/RimsCmsToolbar.tsx`.
- [x] Create `src/components/cms/rims/RimsCmsTableSection.tsx`.
- [x] Create `src/components/cms/rims/RimsContentSection.tsx`.
- [x] Create `src/components/cms/rims/RimsSpecsSection.tsx`.
- [x] Create `src/components/cms/rims/RimsPricingSection.tsx`.
- [x] Create `src/components/cms/rims/RimsVisibilitySection.tsx`.
- [x] Keep existing CMS behavior working during the split.
  - Active `RimsCMSPageV2` now composes the rim modules instead of owning data fetch/save logic.
- [x] Add CMS filters:
  - [x] supplier
  - [x] missing price
  - [x] missing image
  - [x] missing SEO
  - [x] missing normalized specs
  - [x] hidden/public status
- [x] Add rim spec override editor:
  - [x] brand
  - [x] model
  - [x] size string
  - [x] width
  - [x] diameter
  - [x] PCD
  - [x] ET
  - [x] CB
  - [x] material
  - [x] color
  - [x] finish
  - [x] bolts included
  - [x] wheel load
  - [x] winter approved
  - [x] manual no-no / not sellable classification
- [x] Add rim content editor:
  - [x] title
  - [x] subtitle
  - [x] short description
  - [x] long description
  - [x] SEO slug
  - [x] SEO title
  - [x] SEO description
  - [x] manual badges
- [x] Add rim image editor:
  - [x] hero image
  - [x] gallery
  - [x] supplier image fallback preview
- [x] Add rim pricing editor:
  - [x] price override
  - [x] promo price
  - [x] promo dates
  - [x] stock override / force out of stock if supported
- [x] Refresh selected and webshop snapshots after CMS save when snapshots are used.
  - CMS save refreshes the selected admin list and queues Apply Sync for webshop publish, matching the tire CMS publish pattern.

## Phase 10: Vehicle Rim Fitment

Do not treat ETRTO as complete rim compatibility.

- [x] Keep ETRTO for tyre-to-rim compatibility:
  - [x] rim diameter from tyre size
  - [x] approved rim width range
  - [x] preferred rim width
  - [x] alternative tyre/rim diameter recommendations
  - Existing `rim_fitment_profile` returns these from the ETRTO tyre-size table and keeps warnings that final wheel fitment still needs vehicle mounting checks.
- [x] Add or source vehicle mounting data:
  - [x] PCD
  - [x] center bore
  - [x] factory ET
  - [x] ET min/max
  - [x] bolt thread
  - [x] bolt seat
  - [x] brake clearance notes if available
  - `vehicle_lookup` now parses these from CarsXE/provider payload aliases when present, repairs old cached rows when provider payload has the fields, and includes development fixture mounting data.
  - Live sample `XJZ-140` is still cached without provider mounting fields, so it correctly returns `rimMounting: null` instead of inventing compatibility.
- [x] Update `vehicle_lookup` response type to include mounting data.
  - Browser type `VehicleTyreLookupResult.rimMounting` added.
  - Rim license-plate search now passes `vehicle.rimMounting` into `requestFitmentRecommendations`.
  - `rim_fitment_profile` preserves `boltThread`, `boltSeat`, and `brakeClearanceNotes` in the returned mounting profile.
