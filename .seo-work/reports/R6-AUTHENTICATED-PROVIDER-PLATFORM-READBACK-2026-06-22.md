# R-6 - Authenticated Provider And Platform Readback

Recorded: 2026-06-22

Status: Complete with platform access blockers

Progress: `[███████████████░░░░░] 75%`

## Decision

R-6 completed authenticated readback where access exists.

Supabase database, function inventory, function source download, and remote secret-name readback succeeded against project `rcmmbwdebnmicrweoiyz`.

Cloudflare, Search Console, GA4/GTM, Merchant Center, Google Business Profile, server logs, and authenticated field-performance platforms remain unavailable because target IDs, provider metadata, credentials, or owner access were not available. Public production checks still show deployment blockers.

## Evidence State Matrix

| Evidence | State | Finding |
| --- | --- | --- |
| Project wrapper | `EXECUTED` | `project mitraauto` confirms project dir, slug, Supabase ref, and Supabase URL. |
| Supabase MCP config | `EXECUTED` | `supabase-mitra` points to `project_ref=rcmmbwdebnmicrweoiyz`; generic Supabase MCP was not used. |
| Supabase database | `EXECUTED` | DB readback succeeded as `postgres`, server version `17.6`, timezone `UTC`. |
| Supabase functions | `EXECUTED_WITH_FINDINGS` | Function inventory succeeded; `payments_create_paytrail` is active but source parity fails against local R-5. |
| Supabase remote secret names | `EXECUTED_WITH_FINDINGS` | Relevant secret names exist for Supabase and Paytrail; values are hidden and were not recorded. `FRONTEND_ALLOWED_ORIGINS` is missing. |
| Cloudflare authenticated readback | `UNAVAILABLE` | Token, account ID, zone ID/name, Pages project, and public base URL are missing from the wrapper. |
| Public hosting readback | `EXECUTED_WITH_FINDINGS` | Live `www` still fails static asset, redirect, private-route, and soft-404 behavior. |
| Search Console | `UNAVAILABLE` | No property ID/env/access; Google CLI has zero active accounts. |
| Google Business Profile | `UNAVAILABLE` | No GBP account/location ID/access. |
| Merchant Center | `UNAVAILABLE` | No account ID/access; public feed URL serves HTML shell. |
| Analytics | `UNAVAILABLE` | Clarity source exists, but no authenticated dashboard/API; no GA4/GTM/dataLayer found. |
| CrUX/PageSpeed | `FAILED` | Public PageSpeed API returned `429 RESOURCE_EXHAUSTED` for mobile and desktop. |
| Server logs | `UNAVAILABLE` | No authorized log source or Logpush/export target was available. |

## Secret-Safe Status

Local project wrapper:

```text
DATABASE_URL=set
SUPABASE_TRANSACTION_POOLER_URL=set
SUPABASE_SESSION_POOLER_URL=set
SUPABASE_ACCESS_TOKEN=missing
CLOUDFLARE_API_TOKEN=missing
CLOUDFLARE_ACCOUNT_ID=missing
CLOUDFLARE_ZONE_ID=missing
CLOUDFLARE_ZONE_NAME=missing
CLOUDFLARE_PAGES_PROJECT=missing
PUBLIC_BASE_URL=missing
GOOGLE_APPLICATION_CREDENTIALS=missing
GA4_PROPERTY_ID=missing
MERCHANT_CENTER_ACCOUNT_ID=missing
GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID=missing
PAGESPEED_API_KEY=missing
CRUX_API_KEY=missing
PAYTRAIL_MERCHANT_ID=missing
PAYTRAIL_MERCHANT_SECRET=missing
FRONTEND_ALLOWED_ORIGINS=missing
```

Remote Supabase secret-name readback:

```text
SUPABASE_URL=set
SUPABASE_ANON_KEY=set
SUPABASE_SERVICE_ROLE_KEY=set
SUPABASE_DB_URL=set
PAYTRAIL_API_BASE=set
PAYTRAIL_MERCHANT_ID=set
PAYTRAIL_SECRET_KEY=missing
PAYTRAIL_MERCHANT_SECRET=set
PAYTRAIL_WEBHOOK_URL=set
FRONTEND_SUCCESS_URL=set
FRONTEND_CANCEL_URL=set
FRONTEND_ALLOWED_ORIGINS=missing
PUBLIC_SITE_URL=set
SITE_URL=set
BOOKING_SITE_URL=set
GOOGLE_SEARCH_CONSOLE_SITE_URL=missing
GA4_PROPERTY_ID=missing
MERCHANT_CENTER_ACCOUNT_ID=missing
GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID=missing
CLOUDFLARE_API_TOKEN=missing
CLOUDFLARE_ACCOUNT_ID=missing
CLOUDFLARE_ZONE_ID=missing
```

No secret values or hashes are recorded in this report.

## Supabase Readback

Database:

```text
db_read=ok
database=postgres
user=postgres
server_version=17.6
timezone=UTC
```

Target migrations applied:

```text
20260621090000
20260621204946
20260621205611
```

Target public RPC signatures:

```text
catalog_get_rim_by_identifier_v1(p_identifier text)
catalog_get_tire_by_identifier_v1(p_identifier text)
catalog_list_product_sitemap_rows_v1(p_limit integer, p_offset integer)
catalog_public_product_slug(...)
catalog_slugify_public_path_segment(p_value text)
```

Paytrail function parity:

```text
payments_create_paytrail: ACTIVE
verify_jwt: true
version: 23
updated_at: 2026-05-02 05:35:57 EEST
source_parity: different
remote_has_www_default: no
remote_has_allowlist: no
```

## Public Host Readback

| URL | Observed |
| --- | --- |
| `https://mitra-auto.fi/` | Final `https://www.mitra-auto.fi/`, HTTP 200, redirects 1 |
| `https://www.mitra-auto.fi/robots.txt` | HTTP 404 |
| `https://www.mitra-auto.fi/sitemap.xml` | HTTP 404 |
| `https://www.mitra-auto.fi/sitemap-products.xml` | HTTP 200 `text/html` |
| `https://www.mitra-auto.fi/merchant-products.xml` | HTTP 200 `text/html` |
| `https://www.mitra-auto.fi/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697` | HTTP 200, redirects 0 |
| `https://www.mitra-auto.fi/this-route-should-not-exist-r6` | HTTP 200, redirects 0 |
| `https://www.mitra-auto.fi/cms` | HTTP 200, redirects 0 |

The public host still reflects the R-3/R-4 deployment blocker: static SEO assets and route policy are not deployed correctly.

## Platform Findings

- Search Console: unavailable; no property ID or authenticated access.
- GBP: unavailable; C-1 owner proof remains required.
- Merchant Center: unavailable; public feed URL is not XML, so feed submission is not ready.
- Analytics: Clarity is present in source, consent-gated; GA4/GTM/dataLayer was not found.
- CrUX/PageSpeed: public PageSpeed API returned quota/rate limit, so no field or lab data was recorded.
- Server logs: unavailable; no authorized Cloudflare Logpush, hosting log, or server-log export source.
- Vercel: local artifacts exist under `.vercel/`, including ignored preview env, but current public host evidence is Cloudflare and Vercel readback was not used as launch evidence.

## Blockers

| Blocker | Owner | Required resolution |
| --- | --- | --- |
| Cloudflare authenticated account/zone/Pages readback remains unavailable. | Hosting/provider owner | Add non-secret Cloudflare metadata to the project wrapper, load token through Keychain only, and run harmless zone/Pages reads. |
| Production static assets and route policies still fail public readback. | Hosting/frontend owner | Deploy the current app build and Pages function, then rerun R-3/R-4/R-6 public host checks. |
| Deployed Paytrail function source still differs from local R-5 source. | Supabase/commerce owner | Deploy the updated function and verify source parity; add `FRONTEND_ALLOWED_ORIGINS` if noncanonical origins are intentionally allowed. |
| Search Console, GA4/GTM, Merchant Center, GBP, server logs, and authenticated field-performance evidence are unavailable. | SEO/analytics/business/ecommerce owners | Provide property/account IDs plus least-privilege access and rerun dataset envelopes. |

## Verification

```text
source ~/.config/projects/bin/project && project mitraauto: passed
security find-generic-password -s mitraauto.supabase.db -a postgres: passed, set
codex mcp get supabase-mitra: passed
psql "$DATABASE_URL" safe DB identity read: passed
psql migration readback: passed
psql RPC signature readback: passed
supabase functions list --project-ref "$SUPABASE_PROJECT_REF" -o json: passed
supabase secrets list --project-ref "$SUPABASE_PROJECT_REF" -o json: passed, names only used
supabase functions download payments_create_paytrail --project-ref "$SUPABASE_PROJECT_REF" --use-api: passed with source parity finding
gcloud auth/config status check without account output: passed, no active account/project
rg platform source markers: passed with findings
curl public host matrix: passed with findings
PageSpeed API mobile/desktop: failed with 429 RESOURCE_EXHAUSTED
```

## Closeout

R-6 closes the authenticated readback attempt.

Only Supabase is materially authenticated and target-confirmed today. Growth-ready platform evidence remains blocked until Cloudflare, Search Console, GBP, Merchant Center, analytics, logs, and field-performance access are supplied and the current production deployment is fixed.

Next:

```text
Continue with R-7 - Business/local/content owner evidence package.
```
