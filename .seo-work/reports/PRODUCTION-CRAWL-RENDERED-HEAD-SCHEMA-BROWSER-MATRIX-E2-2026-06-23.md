# E-2 - Production Crawl, Rendered Head, Schema, And Browser Matrix

Recorded: 2026-06-23

Status: Complete with blockers carried

Production URL: https://www.mitra-auto.fi

## Decision

E-2 is complete as an evidence task. It does not approve release.

The production host still behaves like the Figma Make generic SPA shell at the HTTP layer. Browser hydration improves sampled pages after JavaScript runs, but Gate D remains blocked because direct HTTP status, static assets, redirects, raw head data, schema timing, private route policy, and error status behavior do not match the repo contract.

## Evidence

| Evidence mode | State | Result |
| --- | --- | --- |
| LIVE HTTP | `EXECUTED_WITH_FINDINGS` | 22 sampled URLs checked; 0 passed the E-2 release policy. |
| BROWSER | `EXECUTED_WITH_FINDINGS` | Rendered homepage, service page, product page, CMS route, and unknown route inspected. No console errors; repeated preload warning. |
| SCHEMA | `EXECUTED_WITH_FINDINGS` | Rendered JSON-LD exists on sampled public pages, but raw HTML does not expose page-specific JSON-LD. |
| MIGRATION | `EXECUTED_WITH_FINDINGS` | Legacy route and product identifier redirects are inactive on production. |
| PLATFORM | `UNAVAILABLE` | Search Console, Merchant Center, logs, field performance, and Cloudflare provider readback were not available in E-2. |

## Main Findings

### BLOCKER - Static SEO assets and Merchant feed are not live correctly

Evidence:

- `/robots.txt` returns `404 text/plain`.
- `/sitemap.xml` returns `404 text/plain`.
- `/sitemap-products.xml` returns `200 text/html`.
- `/sitemap-products-1.xml` returns `200 text/html`.
- `/merchant-products.xml` returns `200 text/html`.

Required resolution:

Deploy the repo build/static output and ensure static files are served before SPA fallback. Verify status, MIME type, and XML/RSS body roots.

### BLOCKER - Public raw HTML is still a generic JavaScript shell

Sampled public pages return generic raw HTML with no route-specific canonical and a JavaScript-required noscript state.

Affected samples:

- `/`
- `/en`
- `/palvelut`
- `/palvelut/dpf-huolto`
- `/en/services/dpf-service`
- `/helsinki`
- `/yhteystiedot`
- `/catalog`
- `/catalog/rim/{slug}`

Required resolution:

Add prerender or edge head/schema injection for launch-critical public routes, or deploy a runtime that emits correct title, meta description, canonical, hreflang, robots, visible anchors, and JSON-LD before hydration.

### BLOCKER - Private, checkout, and error routes fail HTTP/indexability policy

Evidence:

- `/cms` returns HTTP `200` raw shell with `index,follow`; rendered browser later shows a noindex 404 UI.
- `/checkout` returns HTTP `200` raw shell with `index,follow`; checkout should be noindex.
- `/this-route-should-not-exist-e2` returns HTTP `200`; rendered browser later shows a noindex 404 UI.
- `/catalog/rim/does-not-exist-product-e2` returns HTTP `200`.

Required resolution:

Deploy edge/server route classification so private and invalid routes return safe `401`/`403`/`404`/`410` or correct `X-Robots-Tag`, not just client-side noindex after hydration.

### CRITICAL - Legacy redirects and product identifier redirects are inactive

Evidence:

- `/shop` returns `200` instead of redirecting to `/catalog`.
- `/palvelut/dpf-pesu` returns `200` instead of redirecting to `/palvelut/dpf-huolto`.
- `/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697` returns `200` instead of redirecting to the canonical slug.
- `/catalog/rim/4250996326059` returns `200` instead of redirecting to the canonical slug.

Required resolution:

Deploy the edge redirect policy and product identifier resolver. Verify one-hop permanent redirects with redirects disabled.

## Rendered Browser Positives

Rendered homepage:

- route-specific title, description, canonical, `index,follow`, H1, crawlable anchors, and LocalBusiness/WebPage/Breadcrumb JSON-LD are present after hydration.

Rendered DPF service page:

- route-specific title, description, canonical, `index,follow`, H1, LocalBusiness/Service/Breadcrumb JSON-LD are present.
- Internal review blocker strings were not present in rendered body.

Rendered product page:

- route-specific product title, description, canonical, `index,follow`, H1, Product/Breadcrumb JSON-LD are present.
- Product JSON-LD exposed SKU, GTIN, price `174.48`, currency `EUR`, and `InStock` availability.

Rendered CMS and unknown route:

- Browser UI shows noindex 404 state, but HTTP status remains `200`. This is a soft-404 blocker, not a pass.

## Local Gate Comparison

The corresponding local source gates pass:

```text
npm run static-assets:check: passed
npm run route-migration:check: passed
npm run private-routes:check: passed
```

Interpretation:

The repo source contract exists locally. Production does not appear to be serving the repo build plus Cloudflare/edge route policy.

## Drift Comparison

Compared with the prior R-8 and live browser smoke evidence, the same production classes remain open:

- missing `robots.txt` and `sitemap.xml`,
- product sitemaps and Merchant feed serving HTML,
- inactive legacy/product ID redirects,
- private and invalid routes returning HTTP `200`,
- raw public HTML serving a generic SPA shell.

## Verification

```text
node --input-type=module <<'NODE' ... E-2 live HTTP matrix ... NODE: passed with findings
mcp__playwright browser smoke for homepage, DPF service, canonical product, /cms, and unknown route: passed with findings
mcp__playwright browser_console_messages level=warning all=true: passed with findings
npm run static-assets:check: passed
npm run route-migration:check: passed
npm run private-routes:check: passed
```

## Closeout

E-2 can close only as `complete with blockers carried`.

Mitra Auto remains not release-ready and not growth-ready until production serves:

- repo static SEO assets and Merchant feed,
- server/edge redirects,
- private route boundary,
- real `404`/`410` for invalid routes and unknown products,
- noindex policy for checkout/utility routes,
- raw route-specific metadata and JSON-LD for public SEO routes.
