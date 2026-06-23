# D-1 - Search Console And Indexing Evidence Readback

Status: Complete with blockers carried

Recorded: 2026-06-23

## Purpose

D-1 records Search Console and indexing evidence for Mitra Auto before later platform, local, Merchant, analytics, and owner-proof tasks.

This task does not claim crawling, indexing, selected canonicals, rankings, rich results, traffic, or revenue. Search Console access was unavailable, so authenticated platform evidence remains blocked rather than passed.

## Evidence State

| Evidence mode | State | Meaning |
| --- | --- | --- |
| `REPO` | `EXECUTED_WITH_FINDINGS` | Local source contains robots and sitemap files, plus prior route/indexability contracts. |
| `LOCAL_GATE` | `EXECUTED` | Static asset and product sitemap checks passed locally. |
| `LIVE` | `EXECUTED_WITH_FINDINGS` | Production `www` still does not serve robots/sitemap assets correctly and returns SPA shell behavior for invalid/private paths. |
| `PLATFORM` | `UNAVAILABLE` | No Search Console property, owner, URL Inspection, sitemap report, indexing report, enhancement, manual action, security, or performance readback was available. |
| `OFFICIAL_DOCS` | `REVIEWED_2026_06_23` | Google Search Console URL Inspection, Sitemaps, Page indexing, and setup docs were reviewed for the D-1 evidence contract. |

## Main Result

D-1 can close as a Search Console evidence gate because the evidence class is now explicit.

D-1 cannot close as Search Console-ready or indexing-ready because:

- authenticated Search Console access is unavailable;
- the project wrapper has no Search Console property metadata or credential status;
- live `robots.txt` and `sitemap.xml` fail;
- live product sitemap URLs return Figma Make HTML instead of XML;
- invalid and private live routes return `200 text/html`.

## Search Console Readback

| Required readback | Status | Evidence |
| --- | --- | --- |
| Property ownership and owner | Blocked | No `GSC_PROPERTY_URL`, `SEARCH_CONSOLE_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_PROPERTY`, or Google application credential status was available through the project wrapper. |
| Sitemap submission | Blocked | Search Console access unavailable; live sitemap assets currently fail public fetch checks. |
| URL Inspection samples | Blocked | No verified owner/full-user/API access available. |
| Google-selected canonical | Blocked | URL Inspection unavailable. |
| Page indexing diagnostics | Blocked | Search Console Page indexing report unavailable. |
| Enhancement reports | Blocked | Search Console enhancement reports unavailable. |
| Manual actions | Blocked | Search Console manual action report unavailable. |
| Security issues | Blocked | Search Console security issue report unavailable. |
| Performance | Blocked | Search Console performance reports unavailable. |

Minimum Search Console access required:

- verified owner or full user with URL Inspection access;
- property scope covering `https://www.mitra-auto.fi`;
- domain property preferred, URL-prefix acceptable as secondary;
- owner and backup owner recorded;
- sanitized exports or API evidence envelopes that do not include secrets or personal data.

## Local Evidence

| Check | Result |
| --- | --- |
| `npm run static-assets:check` | Passed. Source static assets checked: `robots.txt`, `sitemap.xml`, `sitemap-products.xml`, `merchant-products.xml`, `_headers`, `_redirects`. |
| `npm run sitemap:check` | Passed. Product sitemap contains `60918` URLs across `2` product sitemap files. |
| Local file existence | Passed. `src/public/robots.txt`, `sitemap.xml`, `sitemap-products.xml`, `sitemap-products-1.xml`, and `sitemap-products-2.xml` exist with non-zero sizes. |

Local static file sizes:

| File | Size |
| --- | ---: |
| `src/public/robots.txt` | 274 B |
| `src/public/sitemap.xml` | 6,379 B |
| `src/public/sitemap-products.xml` | 368 B |
| `src/public/sitemap-products-1.xml` | 10,829,537 B |
| `src/public/sitemap-products-2.xml` | 3,645,325 B |

## Live Public Fetch Evidence

| URL | Expected | Observed on 2026-06-23 | Severity |
| --- | --- | --- | --- |
| `https://www.mitra-auto.fi/robots.txt` | `200 text/plain` | `404 text/plain;charset=UTF-8` | Blocker |
| `https://www.mitra-auto.fi/sitemap.xml` | `200 application/xml` or `text/xml` | `404 text/plain;charset=UTF-8` | Blocker |
| `https://www.mitra-auto.fi/sitemap-products.xml` | `200 application/xml` or `text/xml` | `200 text/html`; body starts with Figma Make HTML | Blocker |
| `https://www.mitra-auto.fi/sitemap-products-1.xml` | `200 application/xml` or `text/xml` | `200 text/html`; body starts with Figma Make HTML | Blocker |
| `https://www.mitra-auto.fi/sitemap-products-2.xml` | `200 application/xml` or `text/xml` | `200 text/html` | Blocker |

Representative URL fallback checks:

| Template | URL | Observed | Expected concern |
| --- | --- | --- | --- |
| Homepage | `https://www.mitra-auto.fi/` | `200 text/html` | Search Console URL Inspection unavailable. |
| FI service | `https://www.mitra-auto.fi/palvelut/dpf-huolto` | `200 text/html` | Search Console URL Inspection unavailable. |
| EN service | `https://www.mitra-auto.fi/en/services/dpf-service` | `200 text/html` | Search Console URL Inspection unavailable. |
| Product canonical | `https://www.mitra-auto.fi/catalog/rim/rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10` | `200 text/html` | Search Console URL Inspection unavailable. |
| Checkout utility | `https://www.mitra-auto.fi/checkout` | `200 text/html` | Should remain noindex utility surface. |
| Private CMS | `https://www.mitra-auto.fi/cms` | `200 text/html` | Should be safe denial/noindex, not public SPA shell. |
| Unknown route | `https://www.mitra-auto.fi/this-route-should-not-exist-d1` | `200 text/html` | Should be `404` or `410` with noindex. |

## Findings

### BLOCKER - Search Console Authenticated Readback Unavailable

- Evidence: project wrapper has no Search Console property URL, site URL, Google Search Console property metadata, or Google application credentials.
- Affected scope: `https://www.mitra-auto.fi` production Search Console evidence.
- Impact: D-1 cannot confirm property ownership, submitted sitemaps, URL Inspection, Google-selected canonicals, indexing reports, enhancement reports, manual actions, security issues, or performance data.
- Root cause: platform access and metadata were not supplied.
- Remediation: platform owner supplies verified owner/full-user access or sanitized exports/API evidence envelope.
- Verification: record property, owner, date/time, sitemap status, URL Inspection samples, manual/security/enhancement/index/performance reports.
- Owner/dependency: SEO/Platform owner.
- Confidence: High.

### BLOCKER - Production Robots And Sitemaps Are Not Search Console-Ready

- Evidence: live `robots.txt` and `sitemap.xml` return `404`; product sitemap URLs return `200 text/html` Figma Make shell.
- Affected scope: root discovery assets and product sitemap discovery on `www.mitra-auto.fi`.
- Impact: Search Console sitemap submission and product URL discovery cannot be trusted.
- Root cause: production host still does not serve the repo static assets before SPA/Figma Make fallback.
- Remediation: deploy the repo build and route/static asset policy to the canonical production host, or configure equivalent provider routing.
- Verification: live curl returns correct status/MIME/body and Search Console Sitemaps report shows successful fetch.
- Owner/dependency: Deployment/Cloudflare owner.
- Confidence: High.

### CRITICAL - Invalid And Private Live Routes Return Public SPA Shell

- Evidence: `/cms` and `/this-route-should-not-exist-d1` return `200 text/html`.
- Affected scope: private route boundary and invalid URL indexing policy.
- Impact: Search Console may surface soft-404, duplicate, or unintended indexability signals until live edge routing is corrected.
- Root cause: production fallback behavior does not match the repo route policy.
- Remediation: serve real `404`/`410` or safe denial/noindex headers for invalid/private routes through the production edge layer.
- Verification: live HTTP and Search Console URL Inspection samples show correct status/indexability.
- Owner/dependency: Deployment/Engineering owner.
- Confidence: High.

## Required Search Console Sample Set

When access is available, inspect at minimum:

- `https://www.mitra-auto.fi/`
- `https://www.mitra-auto.fi/palvelut/dpf-huolto`
- `https://www.mitra-auto.fi/en/services/dpf-service`
- one canonical tire product URL
- one canonical rim product URL
- one legacy product identifier URL expected to redirect
- `https://www.mitra-auto.fi/checkout`
- `https://www.mitra-auto.fi/cms`
- one random invalid route
- `https://www.mitra-auto.fi/sitemap.xml`
- `https://www.mitra-auto.fi/sitemap-products.xml`

For each sample, record:

- live test status;
- indexed status and last crawl date;
- Google-selected canonical;
- user-declared canonical;
- crawl allowed/page fetch result;
- indexing reason;
- mobile usability/page experience where available;
- enhancement/schema status where applicable;
- screenshot/rendered HTML availability where available;
- report date/time and property scope.

## Official Source Notes

- Google Search Console URL Inspection is sample-level evidence and does not guarantee indexing or appearance in Search results.
- Google Sitemaps report can show fetch failures for missing, blocked, or wrong-format sitemaps.
- Google Page indexing diagnostics can differ from a live URL Inspection result because they reflect Google’s last indexed/crawled state and broader indexing conditions.

Reviewed official docs:

- `https://support.google.com/webmasters/answer/9012289`
- `https://support.google.com/webmasters/answer/7451001`
- `https://support.google.com/webmasters/answer/7440203`
- `https://developers.google.com/search/docs/monitor-debug/search-console-start`

## Decision

```text
D-1 is complete as an evidence/readback gate.
D-1 is not a Search Console pass.
Indexing readiness is blocked by unavailable Search Console access and live production robots/sitemap/soft-404 failures.
Next task is D-2 - Google Business Profile, Citations, And Business Fact Approval.
```

