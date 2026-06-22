# D-3 - Search Console, GBP, Merchant Center, And Analytics Readback

Status: Complete locally as platform-readback protocol; authenticated platform proof blocked

Recorded: 2026-06-22

## Summary

D-3 created a platform evidence envelope for Search Console, Google Business Profile, Merchant Center, analytics, and CrUX/PageSpeed. It also ran unauthenticated public production fetch checks against the live Mitra Auto domain.

The key outcome is not a pass. Authenticated platform readback is unavailable, and public production fetches show that robots, sitemap, product sitemap, and Merchant feed artifacts are not aligned with the local source implementation.

## Critical Findings

| Finding | Evidence | Impact | Owner |
| --- | --- | --- | --- |
| Live `robots.txt` missing | `curl -I https://www.mitra-auto.fi/robots.txt` returned `HTTP/2 404` | Search engines and Search Console cannot discover sitemap declarations from robots. | Deployment/Figma Make |
| Live sitemap paths serve HTML or fail | `sitemap.xml`, `sitemap-products.xml`, and `sitemap-products-1.xml` returned Figma Make HTML behavior instead of XML | Search Console sitemap submission and product discovery are not reliable. | Deployment/Figma Make |
| Live Merchant feed path serves HTML | `https://www.mitra-auto.fi/merchant-products.xml` returned `text/html` Figma Make shell | Merchant Center feed fetch will fail or ingest invalid content. | Deployment/Figma Make |
| Authenticated platform access unavailable | No Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, or logs access was supplied | Platform health cannot be marked ready. | Platform owners |

## Artifacts

| Artifact | Purpose |
| --- | --- |
| `.growth-work/measurement/platform-readback-d3.json` | Machine-readable platform envelope, failure semantics, public fetch results, owner register, and gate result. |
| `.growth-work/measurement/PLATFORM-READBACK-D3.md` | Reader-facing platform readback protocol and blocker summary. |
| `.seo-work/reports/SEARCH-CONSOLE-GBP-MERCHANT-ANALYTICS-READBACK-D3-2026-06-22.md` | D-3 closeout report. |
| `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md` | Board updated for D-3 completion and D-4 next task. |

## Platform Status

| Platform | Current D-3 status | Next verification |
| --- | --- | --- |
| Search Console | Blocked by missing authenticated access and deployed sitemap/robots mismatch | Confirm property owner, submit fixed sitemaps, inspect representative URLs, read indexing/enhancement/manual-action/security/performance reports. |
| Google Business Profile | Blocked by missing owner/diagnostics access | Confirm owner/manager, categories, NAP, hours/special hours, website/booking URLs, services/products, photos, reviews, calls/directions, duplicate/suspension status. |
| Merchant Center | Blocked by missing account access and live feed URL serving HTML | Serve XML feed publicly, confirm account/feed source, read item diagnostics, destination status, policy and price/availability mismatches. |
| Analytics | Blocked by missing dashboard/API access | Confirm analytics owner, property, consent model, event debug stream, key-event setup, attribution/channel definitions, retention and filters. |
| CrUX/PageSpeed | Not run in D-3 | Run origin and representative URL checks; separate field and lab data. |

## Source Notes

- Local source has a Clarity helper and consent banner.
- Local source does not show GA4/GTM/dataLayer.
- Local source has generated sitemap and Merchant feed files.
- Public deployment does not currently serve those XML/text artifacts at expected top-level URLs.

## Figma Make Sync

None.

D-3 changed only docs/board artifacts. No Figma Make source files were changed.

## Gate Result

D-3 can close as a local protocol and readback checkpoint with critical deployment/platform blockers.

Growth-ready classification remains blocked until:

- deployed `robots.txt`, sitemap, product sitemap, and Merchant feed URLs serve the correct content types and bodies;
- Search Console property/readback is available;
- GBP owner/diagnostics readback is available;
- Merchant Center account/feed diagnostics readback is available;
- analytics dashboard/debug readback is available;
- D-1/D-2 event and reconciliation contracts are implemented and verified.

Next: `D-4 - Conversion, SXO, And Accessibility QA`.
