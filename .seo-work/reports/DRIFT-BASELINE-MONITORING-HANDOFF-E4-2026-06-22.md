# E-4 - Drift Baseline And Monitoring Handoff

Recorded: 2026-06-22

Status: Complete with release blockers

## Decision

E-4 can close as a drift-baseline and monitoring handoff. It does not make Mitra release-ready or growth-ready. The live blockers from E-3 are now part of the release drift gate and must be fixed before launch approval.

## Evidence Coverage

| Evidence mode | State | Notes |
| --- | --- | --- |
| Live HTTP | `EXECUTED_WITH_FINDINGS` | 26 representative URLs checked with unauthenticated `curl -I`. |
| Raw HTML metadata | `EXECUTED_WITH_FINDINGS` | Sampled direct HTML has generic title/description, no canonical, no schema, no crawlable links, and the H1 `This site requires JavaScript`. |
| Rendered browser | `SUPPLIED_REVIEW_REQUIRED_FROM_E3` | E-3 rendered evidence is linked and sanitized; browser was not rerun in E-4 to avoid storing private route artifacts. |
| Platform | `UNAVAILABLE` | Search Console, GBP, Merchant Center, analytics, Cloudflare, and server logs remain unavailable. |
| Sitemap membership | `FAILED_PUBLIC_ASSET_DEPLOYMENT` | Public sitemap assets are missing or HTML, so membership cannot be trusted. |

## Representative URL Set

| URL / pattern | Current observed state | Target release policy | Drift severity |
| --- | --- | --- | --- |
| `https://mitra-auto.fi/` | `200` final `https://www.mitra-auto.fi/`, redirects `1` | Permanent one-hop redirect to canonical `www` host | `CRITICAL` |
| `/` | `200 text/html` | Indexable homepage, self-canonical, rendered Finnish content, crawlable navigation | `BLOCKER` if inaccessible/noindex/wrong canonical |
| `/en` | `200 text/html` | Indexable English entry if canonical, localized metadata/content | `CRITICAL` |
| `/en/services` | `200 text/html` | Indexable English service hub, links to service details | `CRITICAL` |
| `/palvelut/autohuolto` | `200 text/html` | Indexable Finnish service detail, self-canonical, booking path | `CRITICAL` |
| `/en/services/car-service` | `200 text/html` | Indexable English service detail | `CRITICAL` |
| `/catalog`, `/en/catalog` | `200 text/html` | Indexable catalog hubs if populated, crawlable product/category links | `CRITICAL` |
| Product slug URL | `200 text/html` | Indexable slug URL with price, stock, identifiers, Product/Offer agreement | `CRITICAL` |
| Product UUID URL | `200 text/html`, redirects `0` | Permanent one-hop redirect to slug URL | `CRITICAL` |
| `/shop`, `/services`, `/tire-hotel`, `/helsinki/autohuolto`, `/palvelut/dpf-pesu` | `200 text/html`, redirects `0` | Permanent one-hop redirects to the closest current catalog/service URL | `CRITICAL` |
| `/checkout`, `/checkout/success` | `200 text/html` | Noindex utility/confirmation states, excluded from sitemaps | `CRITICAL` if indexable/canonicalized incorrectly |
| `/customer-account` | `200 text/html` | Authenticated or safe `401`/`403`/`404`, noindex, excluded | `BLOCKER` if private data renders |
| `/cms` | `200 text/html` | Must not render unauthenticated admin/private content; expected `401`, `403`, or safe `404` | `BLOCKER` |
| `/en/contact` | `200 text/html` | Indexable contact page with visible NAP/contact facts | `CRITICAL` |
| `/contact` | `200 text/html` | Redirect to `/en/contact` if intended, otherwise real `404`/`410` | `CRITICAL` |
| Random invalid route | `200 text/html` | Real `404`/`410` with safe noindex content | `CRITICAL` |
| `/robots.txt` | `404` | `200 text/plain`, no accidental global block, sitemap declarations | `BLOCKER` |
| `/sitemap.xml` | `404` | `200 XML`, canonical indexable URLs only | `BLOCKER` |
| `/sitemap-products.xml` | `200 text/html` | `200 XML`, product sitemap/index, no HTML shell | `BLOCKER` |
| `/merchant-products.xml` | `200 text/html` | `200 XML`, feed matches product pages/schema/checkout | `BLOCKER` |

## Raw vs Rendered Baseline

Raw direct HTML currently repeats the same shell across sampled public routes:

```text
title: Mitra Auto | Full-Service Garage in Helsinki - Tires, Maintenance & Repairs
canonical: empty
robots: index,follow
h1: This site requires JavaScript
schema types: none
nav links: 0
anchors: 0
```

E-3 browser evidence showed that hydrated public pages can render route-specific titles, H1s, canonicals, language, content, and actions. Drift monitoring must therefore compare both layers:

- raw HTTP layer for status, redirects, content type, static assets, and crawler resilience;
- rendered layer for route-specific head, primary content, links, schema, actions, and accessibility markers.

## Release Drift Rules

Block deployment or rollback when:

- `/cms` or any private/admin route renders unauthenticated private content;
- homepage or core indexable templates become non-200, blocked, noindex, or canonicalized to the wrong host;
- `robots.txt`, `sitemap.xml`, product sitemap, or Merchant feed is missing, HTML, redirected, or wrong content type;
- checkout, account, order, or CMS routes become indexable or enter sitemaps;
- product price, availability, identifier, schema, feed, cart, and checkout values diverge.

Require critical review when:

- legacy product ID/SKU/UUID URLs fail to permanently redirect to slug URLs;
- removed or invalid routes return HTTP `200`;
- route-specific title, canonical, robots, language, H1, schema, or primary content disappears in rendered output;
- locale canonicals, hreflang policy, or internal links conflict;
- internal links point to redirects, HTML feeds, soft-404s, private routes, or legacy IDs at scale.

Warnings should create review artifacts, not automatically fail deployment, when optional metadata, recommended schema fields, response time, or non-blocking accessibility markers regress.

## Monitoring Cadence

Each release:

- run the bounded HTTP matrix from `.seo-work/crawl/e4-drift-baseline-2026-06-22.json`;
- run rendered browser smoke for homepage, service detail, catalog/product, checkout start, booking start, contact, invalid route, and private boundary status;
- validate robots, sitemap, product sitemap, Merchant feed, legacy redirects, and product ID redirects;
- annotate release date, changed templates, static assets, redirects, provider deployments, and exceptions.

Weekly:

- check critical public assets and redirect samples;
- review Search Console manual actions, security, indexing, sitemap, and enhancement diagnostics when access is available;
- review Merchant Center, GBP, booking, order, checkout, and private-route alerts.

Monthly:

- segment Search Console and analytics by page type, locale, device, query intent, product/service family, and qualified outcome;
- review content freshness, product/feed stock drift, local facts, field Core Web Vitals, and conversion quality;
- update the representative URL set when new page types or lifecycle states ship.

Quarterly:

- recheck schema feature status, AI/crawler policy, Merchant Center policy, GBP policy, and source documentation;
- review architecture/content portfolio, stale redirects, route exceptions, and experiment decisions.

## Incident Handoff

| Trigger | Severity | Owner | First response |
| --- | --- | --- | --- |
| Public `/cms` or private content exposure | `BLOCKER` | Engineering/security | Disable or protect route, preserve sanitized evidence, rotate/clean exposed data if confirmed, verify unauthenticated `401`/`403`/safe `404`. |
| Robots/sitemap/feed regression | `BLOCKER` | Hosting/engineering | Verify deployment target, asset routing, content type, cache, Search Console sitemap status, and Merchant Center fetch state. |
| Material drop in organic traffic, indexed pages, product approvals, bookings, or orders | `CRITICAL` | SEO/analytics/commerce owner | Diagnose measurement first, then outage, access/index/canonical/rendering, platform messages, demand/SERP, content, and competition. |

## Limitations

Authenticated Search Console, GBP, Merchant Center, analytics, Cloudflare, and server-log evidence is still unavailable. Sitemap membership cannot be validated while public sitemap URLs are missing or serving HTML. This baseline improves regression detection; it does not guarantee crawling, indexing, rankings, rich results, AI inclusion, traffic, conversions, or revenue.

## Verification

```text
while IFS= read -r url; do curl -sSIL -o /dev/null --max-time 20 -w '%{url_effective}|http=%{http_code}|content_type=%{content_type}|redirects=%{num_redirects}|time=%{time_total}\n' "$url"; done < <(node -e "const b=JSON.parse(require('fs').readFileSync('.seo-work/crawl/e4-drift-baseline-2026-06-22.json','utf8')); for (const r of b.representativeUrls) console.log(r.url)"): passed with findings
node raw HTML metadata snapshot for 12 representative routes: passed with findings
node -e "for (const f of ['.seo-work/crawl/e4-drift-baseline-2026-06-22.json','.growth-work/release/e4-drift-baseline-monitoring-handoff.json','.growth-work/release/e3-live-crawl-browser-smoke-evidence.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .seo-work/crawl/e4-drift-baseline-2026-06-22.json .growth-work/release/e4-drift-baseline-monitoring-handoff.json .seo-work/reports/DRIFT-BASELINE-MONITORING-HANDOFF-E4-2026-06-22.md: passed
```

## Figma Make Sync

None.

E-4 changed only docs/evidence artifacts. No Figma Make source files were changed.
