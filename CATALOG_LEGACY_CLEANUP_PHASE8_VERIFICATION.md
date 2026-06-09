# Catalog Legacy Cleanup Phase 8 Verification

## Status

Phase 8 verification is complete.

Authenticated CMS browser QA was completed after the local browser session was signed in.

## Local Checks

Passed:

```txt
git diff --check
npm run i18n:audit
npm run build
```

## Browser QA

Target:

```txt
http://127.0.0.1:5173
```

Dev server:

```txt
npm run dev -- --host 127.0.0.1 --port 5173
```

### CMS

- [x] `/cms#catalog` route loads.
- [x] CMS Catalog authenticated view verified in browser.
- [x] Tire tab verified in browser.
- [x] Rim tab verified in browser.
- [x] Tire page 2 pagination renders rows.
- [x] Tire far-page jump to page 574 renders rows.
- [x] Rim page 2 pagination renders rows.
- [x] Rim far-page jump to page 426 renders rows.
- [x] No false empty state appeared during tire/rim page jumps.
- [x] Tire View Settings drawer opens.
- [x] Rim View Settings drawer opens.
- [x] Tire Apply Sync button is visible.
- [x] Rim Apply Sync button is visible.

Mutation note:

```txt
Apply Sync buttons were not clicked during browser QA because they start live publish mutations.
Function existence, access, and latest run health were verified through live database/RPC evidence in Phase 5 and Phase 8.
```

### Storefront Catalog

- [x] `/catalog` tire catalog loads.
- [x] Tire products render on page 1.
- [x] Tire pagination to page 2 renders products.
- [x] Rim tab opens.
- [x] Rim manual/dimension search loads products.
- [x] Rim products render with count and product cards.
- [x] Switching from Rims back to Tires reloads tire products.

Issue found and patched during Phase 8:

```txt
After loading rim results and switching back to Tires, the tire grid disappeared while stale pagination stayed visible.
```

Patch:

```txt
src/components/catalog/CatalogPage.tsx
```

The Tires tab now resets to default tire filters, marks the tire tab as searched, clears stale count state, and reloads tire products immediately. The Rims tab also clears stale total count when switching modes.

Retest passed:

```txt
initial tire products loaded: true
rim results loaded: true
tire products loaded after switching back from rims: true
no false "No tires found" state: true
```

### Booking Smoke

- [x] Home page loads.
- [x] Quick Booking modal opens.
- [x] License plate field accepts `TST-123`.
- [x] English UI date picker renders in English.

Observed date picker labels in English:

```txt
May 2026
Su Mo Tu We Th Fr Sa
```

Full order creation/payment/email was not executed in this cleanup phase.

## Live RPC / Data Verification

Verified public RPCs:

```txt
catalog_count_tires_v1 -> 12629
catalog_list_tires_v1 page 1 -> 24 rows
catalog_list_tires_v1 page 2 -> 24 rows
catalog_count_rims_v1 -> 19353
catalog_list_rims_v1 page 1 -> 24 rows
```

Verified CMS admin RPCs using CMS user claim:

```txt
cms_count_tires_admin_v1 -> 14344
cms_list_tires_admin_v1 page 1 -> 26 rows
cms_list_tires_admin_v1 page 80 -> 26 rows
cms_count_rims_admin_v1 -> 42523
cms_list_rims_admin_v1 page 1 -> 26 rows
cms_list_rims_admin_v1 page 80 -> 26 rows
```

This confirms fast count and random-page server reads are available for both tire and rim CMS lists.

## Phase 8 Browser Result

Authenticated browser QA result:

- [x] `/cms#catalog` authenticated Catalog view.
- [x] Tire tab browser pagination.
- [x] Rim tab browser pagination.
- [x] Fast CMS page jumping does not flash empty state.
- [x] Apply Sync button visibility.
- [x] View Settings drawer behavior.

No active indexing/preload text was visible during the final pass; page data returned directly from indexed/cached server reads.
