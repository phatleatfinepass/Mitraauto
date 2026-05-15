# Catalog CMS Operator Runbook

This runbook is the handoff document for the CMS Catalog workspace after the tire finalization and rim refactor work.

## Scope

The CMS Catalog has two tracks:

- `Finalize Tires Catalog`
- `Full Refactoring Rims Catalog`

Both tracks follow the same product lifecycle:

```txt
supplier raw feeds
-> selected winner layer
-> CMS overlay/editing layer
-> webshop published layer
-> precomputed search/filter read model
-> public storefront RPCs
-> CMS health and sync controls
```

The CMS overlay must not become supplier truth. Supplier feed data stays in raw/selected/webshop rows. CMS edits store editorial copy, images, visibility, pricing overrides, badges, and spec overrides.

## Tire Lifecycle

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
-> catalog_selected_items
-> product_cms CMS overlay
-> webshop_items
-> webshop_tire_search_index
-> webshop_tire_filter_options
-> catalog_list_tires_v1 / catalog_count_tires_v1
```

Main operator actions:

- Use `Finalize Tires Catalog` for review, filtering, content edits, image edits, visibility, and sync.
- Use readiness queues for missing image, missing SEO, missing metadata/EU label, missing EAN, and non-passenger segmentation.
- Use `Apply Sync` only after CMS edits that must publish to `webshop_items`.
- Public storefront reads from `webshop_tire_search_index`, not raw supplier tables.

Current default storefront behavior:

- Retreaded tires are excluded by default.
- Retreaded tires are included only when the storefront sends `includeRetreaded`.
- Tire vehicle type filter supports `passenger`, `van_c`, and `suv_4x4`.

## Rim Lifecycle

```txt
supplier_raw_rd_rims / supplier_raw_vt_rims
-> catalog_selected_items
-> product_cms CMS overlay
-> webshop_items
-> webshop_rim_search_index
-> webshop_rim_filter_options
-> catalog_list_rims_v1 / catalog_count_rims_v1
-> catalog_get_rim_by_identifier_v1
```

Main operator actions:

- Use `Full Refactoring Rims Catalog` for review, filtering, content edits, specs override, image edits, visibility, and sync.
- Use readiness queues for missing image, missing specs, missing SEO, missing price, and not-sellable/manual-blocked items.
- Use `Apply Sync` only after CMS edits that must publish to `webshop_items`.
- Public storefront reads from `webshop_rim_search_index` and rim detail uses the optimized identifier RPC.

## Product-Ready Rules

An item is public-ready only when `webshop_items.product_ready = true`, `is_visible = true`, and `publish_status = 'published'`.

The canonical reason list is stored in:

- `webshop_items.readiness_reasons`
- `webshop_items.primary_readiness_reason`

Common tire blocking reasons:

- `missing_image`
- `not_in_selected_catalog`
- `duplicate_ean_conflict`
- `missing_ean`
- `missing_size`

Common rim blocking reasons:

- `missing_ean`
- `missing_stock`
- `missing_mounting_specs`
- `missing_image`
- `not_in_selected_catalog`

Do not make storefront visibility decisions from raw supplier tables or old selected-view flags when a published readiness reason exists.

## Storefront Filters

Tire storefront filters:

- Brand
- Vehicle type
- Width
- Aspect ratio
- Diameter
- Season
- Sort
- EAN
- RunFlat
- XL
- Studded
- In stock
- Include retreaded
- Electric car
- Sound absorber
- EU wet grip
- EU noise

Rim storefront filters:

- Brand
- Diameter
- Width
- PCD
- ET offset
- Center bore
- Color
- Material
- Bolts included
- In stock
- Sort

Public list/count RPCs must stay bounded. The frontend currently limits public page size to `100` and public offset to `2400`.

## CMS Overlay Versus Supplier Truth

Supplier truth:

- Raw supplier availability, supplier IDs, prices, stock, EAN, tire/rim dimensions, supplier images, and feed timestamps.
- Selected winner identity and matching/conflict result.
- Published snapshot in `webshop_items`.

CMS overlay:

- Title, subtitle, short and long descriptions.
- SEO slug, SEO title, SEO description.
- Hero image, gallery, badges.
- Visibility/hidden status.
- Price and stock overrides where supported.
- Rim spec overrides.
- Manual not-sellable flags through spec override rules.

When supplier data changes, rebuild selected and publish again. When editorial data changes, save CMS overlay and apply sync.

## Health Checks

Use the CMS Catalog health panel first. It should show:

- RD and VT raw freshness.
- Selected rebuild freshness.
- Webshop publish freshness.
- Latest run status and processed/total counts.
- Stale running jobs.
- Public RPC latency.
- Readiness queues and counts.

Direct SQL health query:

```sql
select product_type, max(last_selected_at) as latest_selected_at, count(*) filter (where is_available) as available
from public.catalog_selected_items
where product_type in ('tire', 'rim')
group by product_type;

select product_type, count(*) filter (where is_visible and publish_status = 'published' and product_ready) as ready_published
from public.webshop_items
where product_type in ('tire', 'rim')
group by product_type;

select status, total_items, processed_items, error_message, started_at, finished_at
from public.webshop_tire_sync_runs
order by started_at desc
limit 3;

select status, total_items, processed_items, error_message, started_at, finished_at
from public.webshop_rim_sync_runs
order by started_at desc
limit 3;
```

Public RPC latency smoke checks:

```sql
select count(*) from public.catalog_list_tires_v1(null,null,null,null,null,null,null,false,false,false,false,false,false,false,null,'brand_asc',24,0);
select public.catalog_count_tires_v1(null,null,null,null,null,null,null,false,false,false,false,false,false,false,null);

select count(*) from public.catalog_list_rims_v1(null,null,null,null,null,null,null,null,null,null,null,false,'price_asc',24,0);
select public.catalog_count_rims_v1(null,null,null,null,null,null,null,null,null,null,null,false);
```

Rim detail smoke check:

```sql
with picked as (
  select variant_id
  from public.webshop_rim_search_index
  where is_visible and publish_status = 'published' and product_ready
  limit 1
)
select count(*)
from picked p, public.catalog_get_rim_by_identifier_v1(p.variant_id::text);
```

## Manual Recovery For Stuck Sync Jobs

1. Check the latest run row in `webshop_tire_sync_runs` or `webshop_rim_sync_runs`.
2. If a run is `running` with `processed_items = 0` and older than the expected threshold, use the CMS health panel stale-job close action.
3. If the health panel is unavailable, use the admin helper:

```sql
select public.catalog_close_stale_zero_progress_sync_runs_admin_v1('tire', 30);
select public.catalog_close_stale_zero_progress_sync_runs_admin_v1('rim', 30);
```

4. Re-run publish from the CMS `Apply Sync` button.
5. Confirm the new latest run is `completed` and `processed_items = total_items`.
6. Confirm search indexes and public RPC counts match the expected published layer.

Do not manually update `webshop_items` rows to force visibility. Fix the source reason, rerun publish, and let the readiness contract compute state.

## Rollback Strategy

For a failed read-model migration:

1. Keep `webshop_items` intact. It is the published product snapshot and the fallback source.
2. Revert public RPCs to the previous known-good version that reads directly from `webshop_items`.
3. Disable or skip read-model refresh only after confirming storefront fallback works.
4. Rebuild search indexes after the corrected migration is applied.
5. Run public list/count/detail smoke checks before reopening traffic.

For a failed CMS queue migration:

1. Keep the readiness contract in `webshop_items`.
2. Revert only the CMS list/count queue functions.
3. Avoid changing readiness reasons manually unless the readiness function itself is wrong.
4. Re-run CMS queue counts with an authenticated CMS account.

## Release Checklist

- [x] Controlled authenticated tire CMS edit/save/apply-sync QA passed; temporary overlay was restored.
- [x] Controlled authenticated rim CMS edit/save/apply-sync QA passed; temporary overlay was restored.
- [x] Product image storage policy accepts CMS `super_admin`; RLS insert/update smoke check passed and rolled back.
- [x] Browser file-byte storage upload/read/delete QA passed for tire/rim QA images; no QA objects remain.
- [x] Authenticated rollback-only tire CMS overlay save smoke check passed.
- [x] Authenticated rollback-only rim CMS overlay/spec save smoke check passed.
- [x] Latest tire Apply Sync completed: `f7d1c342-753e-4a0f-a103-e4c678df70fa`, `14542 / 14542`.
- [x] Latest rim Apply Sync completed: `952e7330-4645-4d73-9d66-a669fbfe1c3c`, `42523 / 42523`.
- [x] Rim search index bulk refresh completed after publish; current set-based refresh returns `40404` rows in `36.448s`.
- [x] Tire storefront list/count/detail checks passed.
- [x] Rim storefront list/count/detail checks passed.
- [x] Tire and rim cart add checks passed.
- [x] Rim vehicle fitment lookup checked with a known non-PII profile.
- [x] Plate-based rim vehicle lookup checked with approved plate `XJZ-140`; provider returned tyre size and rim profile worked, but provider did not return rim mounting enrichment.
- [x] `npm run i18n:audit` passed.
- [x] `npm run build` passed.
- [x] `npm run fitment:check` passed.
