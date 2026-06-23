# R-4 - HTTP Redirect, Product ID Migration, And Soft-404 Remediation

Recorded: 2026-06-22

Status: Complete locally with production deployment blocker

Progress: `[██████████░░░░░░░░░░] 50%`

## Decision

R-4 HTTP route policy is implemented in the Pages function surface and verified locally.

Live production still serves the old SPA fallback behavior, so production release remains blocked until the updated function/build is deployed and verified.

## Implemented

| File | Purpose |
| --- | --- |
| `functions/[[path]].ts` | Adds HTTP-level route policy for legacy redirects, trailing-slash redirects, product identifier redirects, protected-route 404s, generated service allowlisting, and unknown-route 404s. |
| `scripts/check_http_route_migration.mjs` | Adds regression coverage for legacy redirects, product UUID/GTIN redirects, canonical product routes, generated service routes, invalid routes, protected routes, and soft-404 candidates. |
| `package.json` | Adds `npm run route-migration:check`. |

## Route Policy

Legacy redirects:

```text
/shop -> /catalog: 301
/palvelut/dpf-pesu -> /palvelut/dpf-huolto: 301
/en/services/dpf-cleaning -> /en/services/dpf-service: 301
```

Product identifier redirects:

```text
Opaque product identifiers such as UUID, GTIN/EAN, long hex ID, and supplier-code-like IDs redirect to canonical slug URLs with 308.
Noncanonical product identifiers that resolve to a product also redirect when the canonical path differs.
```

Verified product sample:

```text
/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697
-> /catalog/rim/rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10
```

Soft-404 remediation:

```text
Unknown routes: 404 with X-Robots-Tag: noindex, follow
Unknown service routes: 404 with X-Robots-Tag: noindex, follow
Unknown product routes: 404 with X-Robots-Tag: noindex, follow
Protected routes: 404 with X-Robots-Tag: noindex, nofollow, noarchive and Cache-Control: no-store
```

Valid public route handling:

```text
The function allows known public SPA routes, canonical product routes, canonical service pages, generated service IDs from SERVICE_CATALOG, checkout utility routes, and static assets.
It does not allow arbitrary /palvelut/*, /en/services/*, or random SPA paths.
```

## Database Evidence

Project wrapper readback:

```text
PROJECT_SLUG=mitraauto
PROJECT_DIR=/Users/chandler/code/Mitraauto-main
SUPABASE_PROJECT_REF=rcmmbwdebnmicrweoiyz
DATABASE_URL=set
SUPABASE_ANON_KEY=missing
CLOUDFLARE_ZONE_ID=missing
CLOUDFLARE_ACCOUNT_ID=missing
```

Sample database row:

```text
product_type=rim
variant_id=00024bb0-2f88-dc51-fca7-b0c7bb8ed697
canonical_slug=rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10
```

Provider note:

```text
No hosting/provider write was attempted. Cloudflare metadata and token status are unavailable in the project wrapper, and the current shell does not expose the public Supabase anon key needed for live edge-function REST verification.
```

## Live Production Evidence

Live `www` still fails R-4:

| URL | Expected | Observed |
| --- | --- | --- |
| `https://www.mitra-auto.fi/shop` | `301` to `/catalog` | `200 text/html`, `0` redirects |
| `https://www.mitra-auto.fi/palvelut/dpf-pesu` | `301` to `/palvelut/dpf-huolto` | `200 text/html`, `0` redirects |
| `https://www.mitra-auto.fi/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697` | `308` to canonical slug | `200 text/html`, `0` redirects |
| `https://www.mitra-auto.fi/catalog/rim/does-not-exist-product` | `404` | `200 text/html` |
| `https://www.mitra-auto.fi/contact` | `404` | `200 text/html` |
| `https://www.mitra-auto.fi/this-route-should-not-exist-r4` | `404` | `200 text/html` |
| `https://www.mitra-auto.fi/cms` | `404` or equivalent protected-route denial | `200 text/html` |

Live conclusion:

```text
Production has not picked up the R-4 function behavior. Release remains blocked by deployment/provider parity.
```

## Verification

```text
npm run route-migration:check: passed
node scripts/check_seo_redirects.mjs: passed
npm run private-routes:check: passed
npm run build through distill wrapper: passed with existing large-chunk warning
node scripts/check_static_deployment_assets.mjs --build-dir build: passed
npm run i18n:audit: passed
npm run sitemap:check: passed
npm run feed:check: passed
npm run commerce:check: passed
live R-4 curl matrix: failed, production still returns old SPA fallback behavior
```

## Required Owner Actions

| Owner | Action | Verification |
| --- | --- | --- |
| Hosting/deployment owner | Deploy the updated `functions/[[path]].ts` and current `build` output to the production `www` host. | R-4 live curl matrix returns expected 301/308/404/200 statuses. |
| Provider owner | Add non-secret Cloudflare zone/account/public URL metadata to the Mitra project wrapper and load secrets only via Keychain-backed helpers. | Provider readback can prove the correct project before write. |
| Supabase/provider owner | Ensure production edge/function env has `SUPABASE_URL` and public anon key under accepted env names. | Product UUID URL redirects to the canonical slug on live `www`. |

## Closeout

R-4 closes local implementation and regression coverage.

Release remains blocked until the function/build is deployed and production proves the new HTTP behavior.

Next:

```text
Continue with R-5 - Checkout URL, canonical, and deployed Paytrail parity.
```
