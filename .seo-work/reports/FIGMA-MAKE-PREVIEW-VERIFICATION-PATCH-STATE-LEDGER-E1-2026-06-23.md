# E-1 - Figma Make Preview Verification And Patch-State Ledger

Recorded: 2026-06-23

Status: Complete with blockers carried

## Decision

E-1 is complete as a source-sync and patch-state ledger, not as a clean Figma Make preview pass.

The pushed Figma Make source was verified at:

```text
origin/main 621aaac Update files from Figma Make
```

The current implementation checkout remains:

```text
codex/pwa-cloudflare 89587c5 Refactor project files and remove obsolete code
```

This is a source-shape mismatch. `origin/main` is a Figma Make source tree under `src/app/**`; the current implementation branch carries production/readiness work under the local repo shape. Do not merge or report provider/runtime files as Figma Make files from this task.

## Figma Make Patch Scope

Only these are in Figma Make scope for this E-1 ledger:

```text
origin/main:src/app/**
```

Not in Figma Make patch scope:

```text
functions/**
scripts/**
supabase/**
src/public/**
.growth-work/**
.seo-work/**
generated static SEO assets
provider credentials or provider readback files
```

## Verified Present

- `CONTACT_INFO` is absent from the pushed Figma Make source, so the prior crash source is no longer present in `origin/main`.
- Checked internal audit/public blocker strings returned no hits for `CONTACT_INFO`, `Content review`, `Business/service owner review required`, `growth-ready`, and `booking_completed`.
- Service route promotion and route registry code is present in `origin/main`.
- Product owner-verified review gating is present in `origin/main`.

## Open Mismatches

Critical: Figma Make source still contains public `[TBD]` price and duration placeholders in four service pages.

Patch these Figma Make files:

```text
/Figma/src/app/components/site/pages/CarServicePage.tsx
/Figma/src/app/components/site/pages/TireChangePage.tsx
/Figma/src/app/components/site/pages/CarWashPage.tsx
/Figma/src/app/components/site/pages/DiagnosticsPage.tsx
```

Use the local readiness branch as the reference:

```text
src/components/site/pages/CarServicePage.tsx
src/components/site/pages/TireChangePage.tsx
src/components/site/pages/CarWashPage.tsx
src/components/site/pages/DiagnosticsPage.tsx
```

Required replacement policy:

- `CarServicePage.tsx`: use `t('service.vehicleSpecificQuote')` for price and `t('service.durationConfirmedInBooking')` for duration.
- `TireChangePage.tsx`: use `30 €` for passenger, `35 €` for SUV, `t('service.vehicleSpecificQuote')` for van, and `t('service.durationConfirmedInBooking')` for duration.
- `CarWashPage.tsx`: use `t('service.vehicleSpecificQuote')` for price.
- `DiagnosticsPage.tsx`: use `t('service.vehicleSpecificQuote')` for price.

Blocker: Figma Make browser preview smoke was not run because no current preview URL was available in this task. Git source sync is verified, but runtime import state and console cleanliness are not.

Warning: the pushed Figma Make source is on `origin/main`, while this checkout is on `codex/pwa-cloudflare`. Treat branch/source policy as unresolved until a release owner records the merge/deployment path.

## Verification

```text
git fetch --all --prune: passed
git show --name-status --oneline --decorate -1 origin/main: passed
git grep -n "CONTACT_INFO" origin/main -- src package.json || true: passed, no hits
git grep -n -E "CONTACT_INFO|Content review|Business/service owner review required|growth-ready|booking_completed" origin/main -- src/app || true: passed, no hits
git grep -n "\[TBD\]" origin/main -- src/app/components/site/pages/CarServicePage.tsx src/app/components/site/pages/CarWashPage.tsx src/app/components/site/pages/DiagnosticsPage.tsx src/app/components/site/pages/TireChangePage.tsx || true: passed with findings
git grep -n "\[TBD\]" -- src/components/site/pages/CarServicePage.tsx src/components/site/pages/CarWashPage.tsx src/components/site/pages/DiagnosticsPage.tsx src/components/site/pages/TireChangePage.tsx || true: passed, no local hits
```

## Closeout

E-1 can close with blockers carried because the ledger is complete and the remaining work is explicit:

1. Patch the four Figma Make service files listed above.
2. Run Figma Make preview smoke with console capture.
3. Keep E-2 production crawl separate from Figma Make source syncing.
