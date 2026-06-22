# Phase B Technical And Product SEO Runtime Audit Wrap-Up

Date: 2026-06-22

Status: Phase B is complete locally as a source/runtime implementation phase.

Growth mode: `AUDIT`, `VERIFY`, `MIGRATE`, `MONITOR`

Website archetypes: local service business, ecommerce/catalog, booking/checkout, multilingual SPA.

## Executive Decision

Phase B can close locally because the source/runtime system now has:

- slug-first product URLs with legacy identifier redirect handling,
- Supabase slug/identifier lookup support,
- generated canonical product sitemaps,
- Product schema, Merchant feed, cart, checkout, and Paytrail revalidation tied to one product-commerce contract,
- rendered-route QA for representative public, utility, product, checkout, and not-found routes,
- invalid product URL noindex handling and edge-function 404 behavior verified by smoke test.

Phase B is not the same as production launch readiness. E-3 must still verify deployed host execution, Search Console/platform evidence, Merchant Center diagnostics, live rendered schema, and provider-safe checkout behavior.

## Extra Layer - Runtime Assurance Model

This layer is added to keep Phase B work auditable after implementation.

| Layer | Purpose | Phase B status | Release owner |
| --- | --- | --- | --- |
| L0 Source contract | Files, migrations, route policy, scripts, and data contracts exist in repo. | Passed locally | Engineering |
| L1 Deterministic local runtime | Build, i18n, XML, sitemap, feed, commerce, function type checks, and browser-rendered head/schema pass locally. | Passed locally with one performance warning | Engineering/SEO QA |
| L2 Edge and host behavior | Cloudflare Pages Function logic supports product redirects and product 404 behavior. | Smoke-tested locally with mocked provider responses | Hosting/Engineering |
| L3 Production evidence | Deployed redirects, sitemap/feed fetches, HTTP status, rendered schema, and checkout behavior are tested on `https://www.mitra-auto.fi`. | Not executed in Phase B | E-3 Release QA |
| L4 Platform and outcome evidence | Search Console, Merchant Center, Business Profile, analytics, booking/order outcomes, and field performance prove external system health. | Unavailable in Phase B | Phase C/D/E owners |
| L5 Drift monitoring | Future changes compare status, canonicals, metadata, schema, feeds, and product lifecycle states against baselines. | Specified, not automated | E-4/Growth Ops |

## Evidence Coverage

| Evidence mode | State | Evidence |
| --- | --- | --- |
| `REPO` | `EXECUTED_WITH_FINDINGS` | Board, migrations, scripts, source files, redirect function, and reports inspected. Findings fixed during B-5. |
| `BUILD` | `EXECUTED_WITH_FINDINGS` | `npm run build` passed. Remaining warning: main JS chunk around 2.62 MB, gzip around 662 kB. |
| `LIVE` | `UNAVAILABLE` | Production host was not crawled in this Phase B wrap-up. Assigned to E-3. |
| `BROWSER` | `EXECUTED_WITH_FINDINGS` | MCP browser checks covered home, EN home, Helsinki, catalog, tire product, rim product, checkout, invalid product, and missing route. Findings fixed during B-5. |
| `PLATFORM` | `UNAVAILABLE` | Search Console, Merchant Center, Business Profile, analytics, CrUX, and provider dashboards were not accessed. |
| `MARKET` | `UNAVAILABLE` | No SERP, competitor, or demand research was run in Phase B. |
| `CONTENT` | `SUPPLIED_REVIEW_REQUIRED` | Earlier content reports exist, but Phase B was runtime-focused. Service/local content moves to Phase C. |
| `CONVERSION` | `EXECUTED_WITH_FINDINGS` | Cart/checkout/product commerce contract and Paytrail type checks passed. Live provider-safe checkout is E-3. |
| `MIGRATION` | `EXECUTED_WITH_FINDINGS` | Slug migration, legacy identifier redirect logic, and sitemap-canonical alignment were implemented and smoke-tested. |
| `INCIDENT` | `UNAVAILABLE` | No production incident or time-series performance loss was investigated. |

## Control Gate Assessment

| Control | Phase B assessment | Status |
| --- | --- | --- |
| `TECH-005` canonical consistency | Product sitemap and rendered product canonicals now align for sampled tire and rim URLs. | Passed locally |
| `TECH-007` server-side redirects | Static redirects and product edge redirect function exist. Production host execution remains E-3. | Source passed, live pending |
| `TECH-008` missing content 404/410 | Invalid product slug returns noindex not-found in browser and 404 in Pages Function smoke test. Generic missing route still needs deployed host policy validation. | Partial, E-3 |
| `TECH-009` sitemap canonical URLs | Product sitemap validates and emits 60,918 canonical product URLs from 31,575 eligible products. | Passed locally |
| `JS-004` deterministic client-route head | Root, local, catalog, product, checkout, and not-found head behavior was fixed and spot-verified. | Passed locally |
| `JS-005` client-side error status | Pages Function product 404 behavior is implemented. Vite preview cannot prove deployed generic 404 status. | Partial, E-3 |
| `SCHEMA-011` Product/Offer consistency | Page, Product JSON-LD, Merchant feed, cart, checkout, and Paytrail revalidation share commerce source logic. | Passed locally |
| `COM-002` price/availability consistency | Shared commerce snapshot governs visible/page/schema/cart/checkout/feed values. | Passed locally |
| `COM-004` Merchant feed complement | Merchant feed export and feed check passed with 31,575 items. Merchant Center diagnostics unavailable. | Source passed, platform pending |
| `COM-012` utility noindex | Checkout renders noindex/no canonical/no JSON-LD in browser check. | Passed locally |
| `INTL-001` distinct locale URLs | `/` and `/en` now resolve deterministic locale metadata. | Passed locally |
| `META-006` localized lang/metadata | Root language drift was fixed; representative routes passed rendered checks. | Passed locally |
| `OPS-003` audit modes declared | Coverage matrix added in this report. | Passed |
| `OPS-006` drift baseline | Baseline categories are defined, but no automated drift artifact is versioned yet. | Recommended follow-up |

## Findings Closed In Phase B

| Severity | Finding | Root cause | Closure |
| --- | --- | --- | --- |
| Critical | Product URLs used/accepted opaque identifiers without source-level redirect proof. | Product detail lookup supported identifiers, but migration policy needed edge redirect support. | Supabase lookup RPCs and Pages Function redirect logic implemented. |
| Critical | Product sitemap was missing at catalog scale. | Static sitemap only covered core routes. | Product sitemap generator, source RPC, checks, and public XML artifacts added. |
| Critical | Product page/schema/feed/cart/checkout price identity could drift. | Multiple surfaces built product values separately. | Shared commerce snapshot and server-side Paytrail revalidation added. |
| Critical | Invalid product slugs rendered indexable catalog content. | Product detail direct-load fell back to catalog when lookup returned no row. | Unresolved product route now transitions to not-found and edge smoke returns HTTP 404. |
| Warning | Root route could canonicalize to English from stored/browser language. | `/` did not force Finnish route language. | `/` now resolves as Finnish route. |
| Warning | App-shell home SEO head leaked onto child routes. | Home SEO hook ran while app shell rendered all pages. | Home SEO head is gated to `currentPage === 'home'`. |
| Warning | Product descriptions could be empty when CMS SEO fields were blank. | Nullish fallback treated empty strings as valid. | First non-empty fallback and localized product meta template added. |
| Warning | Tire/rim runtime slug generation disagreed with sitemap contract. | Frontend and database slug formatting diverged. | Runtime slug helpers now match sitemap/database format for sampled products. |

## Residual Risk Register

| Risk | State | Owner | Verification trigger |
| --- | --- | --- | --- |
| Deployed host may not execute `_redirects` or `functions/[[path]].ts` as expected. | Open | E-3 Release QA | After deployment, crawl fixed legacy paths, opaque product IDs, missing products, and random missing routes. |
| Product sitemap/feed may deploy with wrong headers or stale content. | Open | E-3 Release QA | Fetch live sitemap/feed URLs and inspect status, content type, cache headers, and sampled canonical URLs. |
| Merchant Center approval and feed diagnostics are unknown. | Open | Merchant/platform owner | Submit or fetch feed in Merchant Center and record item diagnostics. |
| Paytrail server-side revalidation is not live provider-tested. | Open | Engineering/Payments | Run provider-safe test transaction path after deployment. |
| Main JS bundle remains large. | Open warning | Engineering/performance | Add route-level code splitting or manual chunks and rerun build/browser performance checks. |
| Search Console, Analytics, GBP, and CrUX evidence unavailable. | Open | Phase C/D/E owners | Connect platform properties and record evidence envelopes without secrets. |
| Product canonical URL collisions are deduped in sitemap but not fully cleaned in catalog source. | Open warning | Catalog/data owner | Collision report and catalog cleanup pass. |

## Drift Baseline To Preserve

For future releases, preserve or compare these representative URLs:

```text
/
/en
/helsinki
/yhteystiedot
/catalog
/catalog/tire/accelera-651-sport-265-30-r19-93-w-summer
/catalog/rim/885-classic-rs-gold-7-5x17-5x108-et35-5x108-et-35-00-cb-71-60
/checkout
/catalog/tire/not-a-real-product-for-b5
/definitely-missing-b5
```

Baseline fields:

- HTTP status and redirect chain
- final URL
- indexability and X-Robots behavior
- canonical and hreflang
- title, description, H1, language
- JSON-LD types and key Product/Offer fields
- sitemap/feed membership for products
- checkout noindex behavior
- missing product and missing route behavior
- browser console errors

## Phase B Recommendation

Close Phase B locally and move to Phase C.

Do not claim production SEO readiness until E-3 verifies deployed behavior and platform data. Do not claim ranking, indexing, rich result, Merchant Center approval, traffic, conversion, revenue, or AI visibility outcomes from Phase B implementation alone.
