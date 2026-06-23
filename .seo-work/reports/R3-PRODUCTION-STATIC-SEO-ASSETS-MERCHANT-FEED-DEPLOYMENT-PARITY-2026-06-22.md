# R-3 - Production Static SEO Assets And Merchant Feed Deployment Parity

Recorded: 2026-06-22

Status: Complete locally with production deployment blocker

Progress: `[████████░░░░░░░░░░░░] 38%`

## Decision

R-3 is complete for local source, build output, and local preview parity.

Production `www` is still blocked. The live host does not serve the static SEO assets and Merchant feed from the current build output.

## Implemented

| File | Purpose |
| --- | --- |
| `scripts/check_static_deployment_assets.mjs` | Adds a deterministic R-3 gate for static SEO assets, Merchant feed, build output, and optional live host parity. |
| `package.json` | Adds `npm run static-assets:check`. |

Removed generated public metadata:

```text
src/public/.DS_Store
```

## Local Source And Build Evidence

| Asset | Source | Build |
| --- | ---: | ---: |
| `robots.txt` | `274 B` | `274 B` |
| `sitemap.xml` | `6,379 B` | `6,379 B` |
| `sitemap-products.xml` | `368 B` | `368 B` |
| `sitemap-products-1.xml` | present | `10,829,537 B` |
| `sitemap-products-2.xml` | present | `3,645,325 B` |
| `merchant-products.xml` | `32,988,117 B` | `32,988,117 B` |
| `_headers` | `1,589 B` | `1,589 B` |
| `_redirects` | `1,233 B` | `1,233 B` |

Product sitemap:

```text
60,918 canonical product URLs across 2 child sitemap files.
```

Merchant feed:

```text
31,575 items in merchant-products.xml.
```

Build output:

```text
Vite output directory is build.
The distilled build line reported dist, but filesystem verification confirmed build is the actual output directory from vite.config.ts.
```

## Local Preview Evidence

`npx vite preview --host 127.0.0.1 --port 4174` served:

| URL | Status | Content-Type |
| --- | ---: | --- |
| `http://127.0.0.1:4174/robots.txt` | `200` | `text/plain` |
| `http://127.0.0.1:4174/sitemap.xml` | `200` | `text/xml` |
| `http://127.0.0.1:4174/sitemap-products.xml` | `200` | `text/xml` |
| `http://127.0.0.1:4174/merchant-products.xml` | `200` | `text/xml` |

Local conclusion:

```text
The deployable build artifact contains and serves the required static SEO assets correctly in local preview.
```

## Live Production Evidence

Live `www` failures:

| URL | Expected | Observed |
| --- | --- | --- |
| `https://www.mitra-auto.fi/robots.txt` | `200 text/plain` | `404 text/plain;charset=utf-8` |
| `https://www.mitra-auto.fi/sitemap.xml` | `200 application/xml` or `text/xml` | `404 text/plain;charset=utf-8` |
| `https://www.mitra-auto.fi/sitemap-products.xml` | `200 application/xml` or `text/xml` | `200 text/html` |
| `https://www.mitra-auto.fi/merchant-products.xml` | `200 application/xml`, `text/xml`, or `application/rss+xml` | `200 text/html` |

Non-`www` redirects to `www` and reaches the same failures after redirect.

Root cause classification:

```text
Confirmed deployment parity failure.
Local source/build is correct; production is not serving the current build static assets before the SPA fallback.
```

## Provider Evidence

Project wrapper readback:

```text
PROJECT_SLUG=mitraauto
PROJECT_DIR=/Users/chandler/code/Mitraauto-main
SUPABASE_PROJECT_REF=rcmmbwdebnmicrweoiyz
SUPABASE_URL=https://rcmmbwdebnmicrweoiyz.supabase.co
CLOUDFLARE_ZONE_ID=missing
CLOUDFLARE_ACCOUNT_ID=missing
PUBLIC_BASE_URL=missing
CF_TOKEN_STATUS=missing
```

Provider write decision:

```text
No hosting/provider write was attempted. The project wrapper does not currently expose non-secret Cloudflare zone/account/public URL metadata or a token status needed for the required harmless readback and smallest-write workflow.
```

## Required Owner Actions

| Owner | Action | Verification |
| --- | --- | --- |
| Hosting/deployment owner | Deploy the current `build` directory to the production `www` host. | `node scripts/check_static_deployment_assets.mjs --build-dir build --live https://www.mitra-auto.fi` passes. |
| Hosting/deployment owner | Ensure static files win before the SPA fallback for `robots.txt`, `sitemap.xml`, `sitemap-products.xml`, `sitemap-products-*.xml`, and `merchant-products.xml`. | Live asset URLs return `200` with XML/text MIME types. |
| Hosting/deployment owner | Honor `_headers` or equivalent provider MIME rules for XML/text assets. | Live headers match expected content types. |
| Provider owner | Add non-secret Cloudflare zone/account/public URL metadata to the Mitra project wrapper and load secrets only via Keychain-backed helpers. | Wrapper readback shows non-secret resource IDs and token status as `set` without printing secrets. |

## Verification

```text
npm run static-assets:check: passed
npm run sitemap:check: passed
npm run feed:check: passed
/Users/chandler/.codex/skills/distill-heavy-output/scripts/distill_cmd.sh "Run the Mitra Auto production build for R-3. Return exactly: status passed/failed, generated output directory, whether static public assets were copied if reported, warnings grouped by tool/file, and fatal errors. Do not include routine Vite transform progress." -- npm run build: passed; filesystem confirmed output directory build
node scripts/check_static_deployment_assets.mjs --build-dir build: passed
node scripts/check_static_deployment_assets.mjs --build-dir build --live https://www.mitra-auto.fi: failed, live www static asset parity not met
local Vite preview static asset curl matrix: passed
npm run private-routes:check: passed
npm run i18n:audit: passed
npm run commerce:check: passed
```

## Closeout

R-3 closes local implementation and verification.

Release remains blocked until the production host serves the static SEO assets and Merchant feed from the current build output.

Next:

```text
Continue with R-4 - HTTP redirect, product ID migration, and soft-404 remediation.
```
