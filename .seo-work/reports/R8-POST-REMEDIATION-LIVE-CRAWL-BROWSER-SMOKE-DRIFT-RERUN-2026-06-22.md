# R-8 - Post-remediation Live Crawl, Browser Smoke, And Drift Rerun

Recorded: 2026-06-22

Status: Complete with live release blockers unchanged

Progress: `[████████████████████] 100%`

## Decision

R-8 is complete as a verification rerun.

Mitra is still not release-ready or growth-ready. Browser-rendered public pages hydrate with correct route-specific SEO markers, but production still fails the HTTP/static/redirect/private-boundary layer. The live host is still serving old SPA fallback behavior for critical release surfaces.

## Evidence Coverage

| Evidence | State | Result |
| --- | --- | --- |
| Live HTTP matrix | `EXECUTED_WITH_FINDINGS` | 26 representative URLs rerun against `https://www.mitra-auto.fi`. |
| Live static asset parity | `EXECUTED_WITH_FINDINGS` | Static SEO assets still fail on production. |
| Local static asset parity | `EXECUTED` | Source and rebuilt `build` assets pass. |
| Local route migration gate | `EXECUTED` | Local edge route policy passes. |
| Local checkout gate | `EXECUTED` | Checkout URL/noindex/callback policy passes locally. |
| Raw HTML metadata | `EXECUTED_WITH_FINDINGS` | Direct HTML remains a generic JavaScript shell. |
| Browser smoke | `EXECUTED_WITH_FINDINGS` | Public rendered pages pass sampled head/content/schema checks; invalid route renders noindex 404 UI but HTTP status remains `200`. |
| Drift comparison | `EXECUTED_WITH_FINDINGS` | No material production improvement from E-4 at HTTP/static/redirect/private-boundary layer. |
| Platform readback | `UNAVAILABLE` | Search Console, GBP, Merchant Center, analytics, Cloudflare, logs, and field data remain unavailable. |

## Artifacts

| Artifact | Path |
| --- | --- |
| R-8 crawl/drift rerun | `.seo-work/crawl/r8-live-drift-rerun-2026-06-22.json` |
| R-8 machine ledger | `.growth-work/reports/r8-post-remediation-live-crawl-browser-smoke-drift-rerun-2026-06-22.json` |

## Live HTTP Result

Production still fails the same release blockers:

| Surface | Expected | Observed |
| --- | --- | --- |
| `robots.txt` | `200 text/plain` | `404 text/plain;charset=UTF-8` |
| `sitemap.xml` | `200 XML` | `404 text/plain;charset=UTF-8` |
| `sitemap-products.xml` | XML sitemap/index | `200 text/html` |
| `merchant-products.xml` | XML/RSS Merchant feed | `200 text/html` |
| Product UUID URL | `308` to slug | `200 text/html`, `0` redirects |
| `/shop`, `/services`, `/tire-hotel`, `/helsinki/autohuolto`, `/palvelut/dpf-pesu` | one-hop permanent redirects | `200 text/html`, `0` redirects |
| `/cms`, `/customer-account` | auth boundary or safe `401`/`403`/`404` | `200 text/html` |
| `/contact`, random invalid route | redirect or real `404`/`410` | `200 text/html` |

## Browser Smoke

Rendered positives:

- Homepage rendered Finnish title, `lang=fi`, H1, self-canonical, `index,follow`, crawlable anchors, and LocalBusiness/WebSite/WebPage/Breadcrumb JSON-LD.
- Finnish service page rendered route-specific title, H1, self-canonical, `index,follow`, service content, and Service/Breadcrumb JSON-LD.
- Product slug page rendered product title, canonical slug URL, `index,follow`, price, stock, Product JSON-LD, and Breadcrumb JSON-LD.
- Checkout rendered at `/checkout` with no canonical and `noindex,nofollow`.
- English mobile service page rendered `lang=en`, English H1/title, self-canonical, and Service/Breadcrumb JSON-LD.
- English contact page rendered address, phone, email, self-canonical, `index,follow`, ContactPage/Breadcrumb JSON-LD.
- Invalid route rendered a noindex 404 UI, but HTTP still returned `200`.

Private-route note:

```text
R-8 did not render /cms in browser because E-3 already indicated possible private-looking data exposure. R-8 used HTTP/status evidence only for /cms and /customer-account.
```

## Raw HTML Drift

Direct HTML still repeats the shell:

```text
title: Mitra Auto | Full-Service Garage in Helsinki — Tires, Maintenance & Repairs
canonical: empty
robots: index,follow
h1: This site requires JavaScript
anchors: 0
schema count: 0
```

Rendered output compensates after hydration, but raw HTML remains weak for crawler resilience and non-JavaScript contexts.

## Blockers

| Severity | Finding | Evidence | Owner |
| --- | --- | --- | --- |
| `BLOCKER` | Production static SEO assets and Merchant feed are still not deployed or routed correctly. | `robots.txt` and `sitemap.xml` return `404`; product sitemap and Merchant feed return `text/html`. | Hosting/deployment owner |
| `BLOCKER` | Private/admin routes still return public HTTP `200` at the edge. | `/cms` and `/customer-account` return `200 text/html`. | Engineering/security plus hosting/provider owner |
| `CRITICAL` | Legacy redirects and product identifier redirects remain inactive on production. | Legacy route and product UUID samples return `200` with zero redirects. | Hosting/edge routing owner |
| `CRITICAL` | Invalid and noncanonical routes remain HTTP soft-404s. | `/this-route-should-not-exist-r8` and `/contact` return `200`. | Hosting/edge routing owner |
| `WARNING` | Raw HTML remains a generic JavaScript shell. | Sampled direct HTML has no canonical, no JSON-LD, zero anchors, and H1 `This site requires JavaScript`. | Frontend/SEO architecture owner |

## Release Decision

```text
NO-GO.
```

Do not call the site growth-ready. Resolve the production deployment/provider parity blockers from R-3, R-4, R-5, and R-6, then rerun R-8.

## Verification

```text
while IFS= read -r url; do curl -sSIL -o /dev/null --max-time 20 -w '%{url_effective}|http=%{http_code}|content_type=%{content_type}|redirects=%{num_redirects}|time=%{time_total}\n' "$url"; done < <(node -e "const b=JSON.parse(require('fs').readFileSync('.seo-work/crawl/e4-drift-baseline-2026-06-22.json','utf8')); for (const r of b.representativeUrls) console.log(r.url)"): passed with findings
/Users/chandler/.codex/skills/distill-heavy-output/scripts/distill_cmd.sh "Run the Mitra Auto Vite production build for R-8 verification. Return exactly: status passed/failed, output directory, key warnings grouped by source, fatal errors, and whether public static assets were copied. Do not include routine transform progress." -- npm run build: passed
node scripts/check_static_deployment_assets.mjs --build-dir build: passed
node scripts/check_static_deployment_assets.mjs --build-dir build --live https://www.mitra-auto.fi: failed, live static asset parity not met
npm run route-migration:check: passed
npm run checkout:check: passed
node raw HTML metadata snapshot for homepage, service detail, product slug, and invalid route: passed with findings
mcp__playwright browser smoke for homepage, service detail, product slug, checkout, English mobile service, English contact, invalid route: passed with findings
```

## Cleanup

Generated verification artifacts removed:

```text
build
.playwright-mcp/console-2026-06-22T18-29-42-528Z.log
.playwright-mcp/console-2026-06-22T18-29-54-931Z.log
.playwright-mcp/console-2026-06-22T18-30-08-192Z.log
.playwright-mcp/console-2026-06-22T18-30-23-872Z.log
.playwright-mcp/console-2026-06-22T18-30-41-254Z.log
.playwright-mcp/console-2026-06-22T18-30-54-106Z.log
.playwright-mcp/console-2026-06-22T18-31-08-159Z.log
.playwright-mcp/page-2026-06-22T18-29-42-903Z.yml
.playwright-mcp/page-2026-06-22T18-29-56-332Z.yml
.playwright-mcp/page-2026-06-22T18-30-09-504Z.yml
.playwright-mcp/page-2026-06-22T18-30-24-826Z.yml
.playwright-mcp/page-2026-06-22T18-30-42-162Z.yml
.playwright-mcp/page-2026-06-22T18-30-55-428Z.yml
.playwright-mcp/page-2026-06-22T18-31-09-039Z.yml
```

## Figma Make Sync

None.

R-8 changed only docs/evidence artifacts and the Growth Readiness Board. No Figma Make source files were changed.

## Next

```text
Resolve production deployment/provider parity blockers from R-3, R-4, R-5, and R-6 before another growth-readiness rerun.
```
