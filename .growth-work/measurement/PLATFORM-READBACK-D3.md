# D-3 Search Console, GBP, Merchant Center, And Analytics Readback

Status: Local readback protocol complete; authenticated platform readback blocked

Recorded: 2026-06-22

## Purpose

D-3 records the platform data contract for Search Console, Google Business Profile, Merchant Center, analytics, and public production discovery surfaces.

This task does not claim ranking, traffic, local-pack, product listing, conversion, or revenue performance. Missing platform access remains unavailable evidence, not zero performance.

## Main Result

D-3 can close locally as a readback protocol and public unauthenticated fetch check.

It cannot close as platform-ready because authenticated owners, properties, diagnostics, and data exports were not available.

## Critical Public Readback Finding

Local source contains `src/public/robots.txt`, sitemap files, and `src/public/merchant-products.xml`, but the deployed Figma Make site is not serving those static artifacts correctly.

| URL | Expected | Observed on 2026-06-22 | Severity |
| --- | --- | --- | --- |
| `https://www.mitra-auto.fi/robots.txt` | `200 text/plain` robots rules | `404 text/plain` | Critical |
| `https://www.mitra-auto.fi/sitemap.xml` | `200 XML` sitemap | `200 text/html` Figma Make shell on HEAD; one body fetch returned 404 | Critical |
| `https://www.mitra-auto.fi/sitemap-products.xml` | `200 XML` product sitemap index | `200 text/html` Figma Make shell | Critical |
| `https://www.mitra-auto.fi/sitemap-products-1.xml` | `200 XML` child product sitemap | `200 text/html` Figma Make shell | Critical |
| `https://www.mitra-auto.fi/merchant-products.xml` | `200 RSS/XML` Merchant feed | `200 text/html` Figma Make shell | Critical |

Impact:

- Search Console sitemap submission will not prove the intended sitemap state.
- Google crawler discovery of product URLs through the deployed product sitemap is broken.
- Merchant Center feed fetch will fail or ingest HTML instead of product XML.
- The local Phase B source implementation remains useful, but production deployment behavior is not aligned with local source.

## Platform Envelopes Required

| Platform | Required readback | Current status |
| --- | --- | --- |
| Search Console | Verified property, owner, sitemap submission, URL Inspection samples, indexing, enhancement, manual action, security, performance by page/query/device/country/search appearance | Blocked by missing access. |
| Google Business Profile | Owner/manager, primary/additional categories, NAP, hours/special hours, services/products, photos, website/booking URL, reviews, calls, directions, edits, suspensions/duplicates | Blocked by missing access. |
| Merchant Center | Account owner, feed source, fetch status, item diagnostics, price/availability mismatch, policy issues, destination status, product visibility | Blocked by missing access and deployed feed URL serving HTML. |
| Analytics | Property owner, consent mode, events, key-event candidates, route/session/event QA, attribution/channel definitions, retention and filters | Blocked by missing dashboard/API access; source has Clarity only. |
| CrUX/PageSpeed | Origin and representative URL field/lab data, mobile/desktop, sample availability | Not run in D-3. |

## Source Evidence

Verified local source:

- `src/lib/clarity.ts` has consent-gated Microsoft Clarity with default project id `xaxi6o0t5o`.
- `.env.example` exposes `VITE_CLARITY_PROJECT_ID` and `VITE_CLARITY_ENABLE_IN_DEV`.
- No GA4/GTM/dataLayer implementation was found in reviewed source.
- `src/config/businessProfile.ts` records Mitra Auto Oy NAP facts used by local schema/content.
- `src/public/robots.txt`, `src/public/sitemap.xml`, product sitemap files, and `src/public/merchant-products.xml` exist locally.
- `package.json` has `sitemap:products`, `sitemap:check`, `feed:merchant`, and `feed:check` scripts.

Public web observation:

- Search results show the live Mitra Auto domain and third-party citation/profile pages, but public search results do not prove GBP ownership, diagnostics, category correctness, review health, or local action metrics.

## Owner Register Required

| Platform | Required owner | Backup | Minimum access | Cadence |
| --- | --- | --- | --- | --- |
| Search Console | SEO/Platform owner | Business/Engineering backup | Verified owner or full user with URL Inspection/API access | Weekly until launch, monthly after launch, plus release/incident checks |
| Google Business Profile | Business/local owner | SEO/Operations backup | Profile manager with edit and diagnostics access | Weekly during fact cleanup, monthly after |
| Merchant Center | Ecommerce/catalog owner | Engineering/SEO backup | Feed, diagnostics, products, destinations, account issue access | Daily during feed launch, then weekly/monthly |
| Analytics | Analytics owner | Engineering/Business backup | Admin/editor for property configuration and debug readback | Release QA, weekly during launch, monthly governance |

## D-3 Gate Result

D-3 is complete as a local protocol and public readback checkpoint.

Remaining blockers:

- Search Console authenticated readback unavailable.
- Google Business Profile authenticated readback unavailable.
- Merchant Center authenticated diagnostics unavailable.
- Analytics dashboard/API readback unavailable.
- Public production static XML/robots/feed artifacts are not being served correctly.

Next task: `D-4 - Conversion, SXO, And Accessibility QA`.
