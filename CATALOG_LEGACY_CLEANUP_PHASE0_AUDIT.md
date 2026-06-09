# Catalog Legacy Cleanup Phase 0 Audit

Last updated: 2026-05-16

## Phase 0 Status

Progress: 100% for audit and snapshot. No destructive database changes were made.

```txt
[####################] 100%
Snapshot: complete
MCP project verification: complete
Live lifecycle audit: complete
Security/performance advisor pass: complete
Cleanup gates: documented
```

## Verified Project Context

- Workspace: `/Users/chandler/code/Mitraauto-main`
- Supabase MCP: `supabase-mitra`
- Project ref: `rcmmbwdebnmicrweoiyz`
- Supabase URL: `https://rcmmbwdebnmicrweoiyz.supabase.co`
- Database connection used for dump: project env session pooler, with `DATABASE_URL` fallback

Required command before future backend work:

```bash
source ~/.config/projects/bin/project
project mitraauto
codex mcp get supabase-mitra
```

## Snapshot

The safety snapshot is outside the repo and should not be committed.

Snapshot root:

```txt
/Users/chandler/code/mitraauto-db-snapshots/phase0-catalog-cleanup-20260516T002112Z
```

Snapshot files:

- `full-db.dump` - full custom-format database dump, 170 MB
- `schema-only.sql` - schema-only dump, 1.2 MB
- `catalog-critical-tables.dump` - data-only custom-format dump for critical catalog tables, 29 MB
- `full-db.restore-list.txt`
- `catalog-critical-tables.restore-list.txt`
- `SHA256SUMS.txt`
- `connection-check.txt`
- `README.txt`
- `db-objects.csv`
- `rls-policies.csv`
- `functions.csv`
- `triggers.csv`
- `table-grants.csv`
- `cron-jobs.csv`
- `catalog-table-summary.csv`

Critical data tables included in the smaller catalog dump:

- `public.product_cms`
- `public.webshop_items`
- `public.catalog_selected_items`
- `public.supplier_raw_rd_tires`
- `public.supplier_raw_vt_tires`
- `public.supplier_raw_rd_rims`
- `public.supplier_raw_vt_rims`

## Current Active Lifecycle

This is the lifecycle to preserve:

```txt
supplier_raw_rd_tires / supplier_raw_vt_tires
supplier_raw_rd_rims / supplier_raw_vt_rims
-> catalog_selected_items
-> CMS Catalog
-> webshop_items
-> webshop_tire_search_index / webshop_rim_search_index
-> public webshop tire/rim RPCs
```

## Live Row Counts

| Layer | Rows | Latest timestamp |
| --- | ---: | --- |
| `supplier_raw_rd_tires` | 26,184 | 2026-05-16 00:20:22 UTC |
| `supplier_raw_vt_tires` | 1,975 | 2026-05-15 00:50:02 UTC |
| `supplier_raw_rd_rims` | 43,446 | 2026-05-15 01:40:33 UTC |
| `supplier_raw_vt_rims` | 373 | 2026-05-15 01:50:01 UTC |
| `catalog_selected_items` tires | 25,201 | 2026-05-15 01:05:00 UTC |
| `catalog_selected_items` rims | 42,559 | 2026-05-15 02:05:00 UTC |
| `webshop_items` tires | 15,342 | 2026-05-15 14:39:21 UTC |
| `webshop_items` rims | 42,559 | 2026-05-15 14:40:09 UTC |
| `webshop_tire_search_index` | 14,389 | 2026-05-15 14:39:21 UTC |
| `webshop_rim_search_index` | 40,404 | 2026-05-15 14:40:37 UTC |

## Latest Sync Health

### Selected Winner Layer

- Latest tire selected rebuild: `success`, 14,542 selected, 14,383 resolved, 159 needs review, finished 2026-05-15 01:05 UTC.
- Latest rim selected rebuild: `success`, 42,523 selected, 42,523 resolved, 0 needs review, finished 2026-05-15 02:05 UTC.

### Webshop Publish

- Latest tire webshop publish: `completed`, 14,542 / 14,542 processed, finished 2026-05-15 14:39 UTC.
- Latest rim webshop publish: `completed`, 42,523 / 42,523 processed, 2,119 skipped incomplete, 0 failed, finished 2026-05-15 14:40 UTC.

### Raw Sync Notes

- Latest VT tire raw sync: `success`, 1,901 fetched, finished 2026-05-15 00:50 UTC.
- Latest VT rim raw sync: `success`, 368 fetched, finished 2026-05-15 01:50 UTC.
- Latest RD rim page sync sequence is healthy across 5 pages, latest page finished 2026-05-15 01:40 UTC.
- RD tire raw rows are fresh through 2026-05-16 00:20 UTC, but there is a zero-progress `running` row started at 2026-05-16 00:25 UTC. Before cleanup, close or reconcile stale zero-progress runs through the existing admin/stale-run path.

## Active Cron Jobs To Preserve

Active catalog cron jobs found in `cron-jobs.csv`:

- Tire raw:
  - `catalog_raw_rd_tires_p1_daily`
  - `catalog_raw_rd_tires_p2_daily`
  - `catalog_raw_rd_tires_p3_daily`
  - `catalog_raw_vt_tires_daily`
  - `catalog_raw_rd_token_daily`
- Tire enrichment/publish:
  - `catalog_fetch_rd_tire_images_100_3min`
  - `catalog_fetch_vt_tire_images_100_3min`
  - `catalog_selected_tires_after_raw_daily`
  - `webshop_tire_items_after_selected_daily`
- Rim raw:
  - `catalog_raw_rd_rims_p1_daily`
  - `catalog_raw_rd_rims_p2_daily`
  - `catalog_raw_rd_rims_p3_daily`
  - `catalog_raw_rd_rims_p4_daily`
  - `catalog_raw_rd_rims_p5_daily`
  - `catalog_raw_vt_rims_daily`
- Rim publish:
  - `catalog_selected_rims_after_raw_daily`
  - `webshop_rim_items_after_selected_daily`

## Active Frontend Data Paths

Current frontend references found:

- CMS shell imports:
  - `src/components/cms/layout/CmsControlCenter.tsx`
  - `src/components/cms/tires/TiresCMSPage.tsx`
  - `src/components/cms/rims/RimsCMSPage.tsx`
- CMS tire list:
  - `cms_list_tires_admin_v1`
  - `cms_count_tires_admin_v1`
- CMS rim list:
  - `cms_list_rims_admin_v1`
  - `cms_count_rims_admin_v1`
- CMS apply sync:
  - `start_webshop_tire_items_sync_v1`
  - `refresh_webshop_tire_items_batch_v1`
  - `finalize_webshop_tire_items_sync_v1`
  - `start_webshop_rim_items_sync_v1`
  - `refresh_webshop_rim_items_batch_v1`
  - `finalize_webshop_rim_items_sync_v1`
- CMS health:
  - `catalog_get_health_summary_v1`
  - raw table freshness checks for RD/VT tire and rim tables

## Backend Objects That Are Not Safe To Drop Yet

Do not drop these during cleanup:

- `supplier_raw_rd_tires`
- `supplier_raw_vt_tires`
- `supplier_raw_rd_rims`
- `supplier_raw_vt_rims`
- `catalog_selected_items`
- `catalog_selected_item_runs`
- `product_cms`
- `webshop_items`
- `webshop_tire_search_index`
- `webshop_rim_search_index`
- `webshop_tire_filter_options`
- `webshop_rim_filter_options`
- `webshop_tire_sync_runs`
- `webshop_rim_sync_runs`
- current CMS list/count RPCs
- current selected rebuild RPCs
- current batched webshop publish RPCs
- current public webshop tire/rim RPCs

## Cleanup Candidates Requiring Dependency Proof

These are candidates only. Do not drop them until frontend, cron, Edge Function, and DB dependency checks all pass.

- `supplier_products_raw`
- `backup_supplier_products_raw`
- `raw_supplier_items_v2`
- `catalog_products_v2`
- `product_cms_v2`
- old `catalog_*_v3` wholesale/import/reconcile objects that are not referenced by current flows
- old Edge Functions:
  - `catalog_sync_rd_tires`
  - `catalog_sync_vt_tires`
  - `catalog_sync_rd_rims`
  - `catalog_sync_vt_rims`
  - `catalog_normalize_batch`
- old full-refresh functions where current batched equivalents are proven active:
  - `refresh_webshop_tire_items_v1`
  - `refresh_webshop_rim_items_v1`

## Security Findings

Supabase security advisor and direct catalog checks found issues to handle in a separate security phase, not during blind cleanup.

- 32 `public` tables have RLS disabled.
- Several catalog/admin/security-definer functions are executable by `authenticated`.
- `auth_leaked_password_protection` is disabled.
- Important Supabase platform change: new public tables require explicit grants for Data API access. Future migrations must include explicit grants plus RLS policies for any table exposed to `anon` or `authenticated`.

RLS-disabled tables include:

- `catalog_conflicts_v3`
- `catalog_hostile_eans`
- `catalog_products_v2`
- `catalog_rim_reconcile`
- `catalog_supplier_offers_v2`
- `catalog_tire_eu_labels`
- `catalog_tire_reconcile`
- `catalog_variant_offers_v3`
- `product_cms_ean`
- `product_cms_v2`
- `raw_supplier_items_v2`
- `supplier_tire_type_rules`
- `booking_email_threads`
- `booking_email_messages`
- `gmail_sync_state`
- `gmail_oauth_states`
- `order_install_tokens`
- `order_email_threads`
- `order_email_messages`
- `pwa_push_subscriptions`
- `wholesale_*_v3`

Do not enable RLS in bulk without policies. That can break CMS, email, order, and catalog flows.

## Performance Findings

Supabase performance advisor found several non-blocking cleanup candidates:

- Unindexed FK on `catalog_selected_items.last_rebuild_run_id`.
- Duplicate indexes on current/old catalog objects, including:
  - `webshop_items_tire_ready_segment_idx`
  - `webshop_items_tire_ready_segment_sort_idx`
  - `catalog_rim_reconcile` open/status index pair
  - `catalog_tire_reconcile` open/status index pair
  - `supplier_products_raw` duplicate supplier/external indexes
  - `product_cms` duplicate variant/slug indexes
- Many unrelated duplicate indexes exist on cart/order/payment tables.

Do not drop duplicate indexes during Phase 0. Index cleanup should be a separate migration with query plan checks.

## Phase 0 Exit Gates

- [x] Confirm project env and `supabase-mitra` target.
- [x] Create full DB snapshot.
- [x] Create schema-only dump.
- [x] Create catalog-critical table dump.
- [x] Export DB object, policy, function, trigger, grants, cron inventories.
- [x] Verify current tire/rim lifecycle row counts.
- [x] Verify selected rebuild and webshop publish health.
- [x] Run security advisor.
- [x] Run performance advisor.
- [x] Document cleanup candidates without dropping anything.

## Next Phase

Phase 1 should start with dependency proof:

- Confirm no current frontend code calls old Edge Functions or old raw tables.
- Confirm no active cron calls old Edge Functions.
- Confirm `supplier_products_raw` is not used by current tire/rim CMS or storefront paths.
- Mark candidates as deprecated first; remove only after one stable deployment cycle.
