# Catalog Legacy Cleanup Phase 5 Sync Path Audit

## Status

Phase 5 audit is complete. Current scheduled tire/rim lifecycle jobs are on the refactored raw-to-selected-to-webshop path.

At the end of Phase 5, backend deletion was not cleared because old deployed Edge Functions were still active in Supabase, even though current cron jobs no longer called them.

Update after Phase 10: this blocker is historical. The legacy deployed Edge Functions were deleted after the final dependency report returned zero blockers and the legacy DB objects were dropped from the live project.

## Current Scheduled Pipeline

Live cron jobs use the current raw supplier functions:

```txt
catalog_sync_raw_rd_tires
catalog_sync_raw_vt_tires
catalog_sync_raw_rd_rims
catalog_sync_raw_vt_rims
```

Selected rebuild jobs:

```txt
catalog_selected_tires_after_raw_daily -> catalog_rebuild_selected_tires_v1()
catalog_selected_rims_after_raw_daily  -> catalog_rebuild_selected_rims_v1()
```

Webshop publish jobs:

```txt
webshop_tire_items_after_selected_daily -> start/refresh/finalize_webshop_tire_items_sync_v1
webshop_rim_items_after_selected_daily  -> start/refresh/finalize_webshop_rim_items_sync_v1
```

Image jobs:

```txt
catalog_fetch_rd_tire_images_100_3min
catalog_fetch_vt_tire_images_100_3min
```

No active catalog cron job currently calls:

```txt
catalog_sync_rd_tires
catalog_sync_rd_rims
supplier_products_raw
```

## Latest Live Run Evidence

Checked at:

```txt
2026-05-16 01:21 UTC
```

### Tires

Latest raw runs:

```txt
RD tires: success, latest page finished 2026-05-16 00:30:40 UTC
VT tires: success, finished 2026-05-16 00:50:05 UTC
```

Latest selected run:

```txt
tire selected rebuild: success
selected_count: 14476
resolved_count: 14318
finished: 2026-05-16 01:05:00 UTC
```

Latest webshop publish:

```txt
tire webshop sync: completed
processed: 14476 / 14476
finished: 2026-05-16 01:15:00 UTC
```

Current `webshop_items` tire totals:

```txt
total tire rows: 15361
published visible: 14324
blocked: 152
hidden: 885
latest refreshed_at: 2026-05-16 01:15:00 UTC
```

### Rims

At audit time, the 2026-05-16 RD rim raw sequence had just started, so the latest fully completed rim cycle was 2026-05-15.

Latest raw runs observed:

```txt
RD rims: success, current 2026-05-16 page 1 finished 2026-05-16 01:20:52 UTC
VT rims: success, latest completed 2026-05-15 01:50:02 UTC
```

Latest selected run:

```txt
rim selected rebuild: success
selected_count: 42523
resolved_count: 42523
finished: 2026-05-15 02:05:00 UTC
```

Latest webshop publish:

```txt
rim webshop sync: completed
processed: 42523 / 42523
failed: 0
finished: 2026-05-15 14:40:09 UTC
```

Current `webshop_items` rim totals:

```txt
total rim rows: 42559
published visible: 40404
blocked: 2119
hidden: 36
latest refreshed_at: 2026-05-15 14:40:09 UTC
```

## CMS Apply Sync Paths

Active CMS calls are current:

```txt
Tire selected rebuild: catalog_rebuild_selected_tires_admin_v1
Rim selected rebuild: catalog_rebuild_selected_rims_admin_v1
Tire publish: start_webshop_tire_items_sync_v1 -> refresh_webshop_tire_items_batch_v1 -> finalize_webshop_tire_items_sync_v1
Rim publish: start_webshop_rim_items_sync_v1 -> refresh_webshop_rim_items_batch_v1 -> finalize_webshop_rim_items_sync_v1
Catalog health: catalog_get_health_summary_v1
Stale run cleanup: catalog_close_stale_zero_progress_sync_runs_admin_v1
```

## Admin/Super Admin Access

Confirmed live function access pattern:

```txt
catalog_get_health_summary_v1: admin/super_admin pattern
start_webshop_tire_items_sync_v1: admin/super_admin pattern
refresh_webshop_tire_items_batch_v1: admin/super_admin pattern
finalize_webshop_tire_items_sync_v1: admin/super_admin pattern
start_webshop_rim_items_sync_v1: admin/super_admin pattern
refresh_webshop_rim_items_batch_v1: admin/super_admin pattern
finalize_webshop_rim_items_sync_v1: admin/super_admin pattern
catalog_rebuild_selected_tires_admin_v1: admin/super_admin pattern
catalog_rebuild_selected_rims_admin_v1: permission-based via cms_has_permission('catalog_rims', 'write')
```

`cms_has_permission`, `cms_is_super_admin`, and `cms_get_current_access` all include super-admin-aware access behavior.

## Still Active Legacy Edge Functions

Supabase still has these active deployed functions from older catalog generations:

```txt
catalog_sync_rd_tires
catalog_sync_rd_rims
catalog_sync_vt_tires
catalog_sync_vt_rims
debug_rd_sync_state
make-server-bdaaf773
catalog_normalize_batch
```

Current cron does not call the old RD functions, but they are still deployed and some local legacy/debug source still references old objects:

```txt
supplier_products_raw
products_search
catalog_tire_variants
catalog_rim_variants
```

Do not drop those database objects until the old deployed functions are explicitly retired or proven unused outside cron.

## Phase 6 Gate

Backend cleanup may proceed only after:

- [ ] Decide whether to delete or archive old deployed catalog Edge Functions.
- [ ] Confirm no external/manual caller still invokes old Edge Function URLs.
- [ ] Remove or quarantine local legacy function source.
- [ ] Re-run cron inventory after old functions are retired.
- [ ] Re-run object dependency report before dropping tables/views/functions.
