# Independent SEO Score - Mitra Auto

Recorded: 2026-06-22

Score boundary:

```text
Internal implementation score. Not a Google score and not a ranking prediction.
```

## Score

| Score | Value | Decision |
| --- | ---: | --- |
| Live production SEO score | `38/100` | `NO_GO` |
| Raw weighted live score before blocker cap | `46/100` | P0/P1 blockers cap the usable score. |
| Local/source SEO foundation score | `74/100` | Strong source progress, not release-ready. |
| Growth readiness score | `31/100` | Platform, owner, monitoring, and live evidence gaps remain. |

Plain answer:

```text
Mitra Auto is not SEO-ready on production today.
The local source foundation is much better than the live site, but the public deployment is release-blocked.
```

## Why The Live Score Is 38

The source now has meaningful SEO architecture: slug helpers reject opaque product identifiers, generated product sitemaps exist, Merchant feed generation exists, local i18n passes, and commerce/schema/cart/checkout mapping uses a shared contract.

The live site still fails the release-level SEO gates:

- `robots.txt` returns `404`.
- `sitemap.xml` returns `404`.
- `sitemap-products.xml` returns `text/html`, not XML.
- `merchant-products.xml` returns `text/html`, not XML.
- an opaque product identifier URL returns `200` with no HTTP redirect to a slug URL.
- an invalid route returns `200`, creating a soft-404 risk.
- `/cms` returns `200`; private/admin-style routes need HTTP/runtime protection, not only robots.txt.
- checkout URL state and deployed Paytrail revalidation parity remain unverified.
- Search Console, GBP, Merchant Center, analytics, logs, field CWV, and provider readbacks remain unavailable.

## Scorecard

| Dimension | Weight | Live score | Local/source score | Evaluation |
| --- | ---: | ---: | ---: | --- |
| Access, indexability, canonicalization | 20 | 3 | 13 | Live robots/sitemaps/feed/redirect/private-route behavior is blocking. Local files and slug helpers exist. |
| Rendering and architecture | 15 | 7 | 11 | SPA renders after hydration, but raw crawler view is a JavaScript shell and HTTP status policy is weak. |
| Content quality and evidence | 20 | 12 | 15 | Service/product systems improved; owner-confirmed GBP/citation/business proof remains missing. |
| Metadata and search appearance | 10 | 5 | 8 | Local head logic exists; production plain view and deployment issues reduce confidence. |
| Structured data | 10 | 6 | 8 | Schema policy exists locally; live/platform validation remains unavailable. |
| Experience, accessibility, and SXO | 10 | 5 | 7 | Core journeys exist; checkout URL-state issue and prior SXO/accessibility findings remain open. |
| Local, ecommerce, international | 10 | 6 | 8 | Local i18n, product sitemap, feed, and commerce checks pass; live feed/GBP/Merchant evidence blocks readiness. |
| Monitoring and governance | 5 | 2 | 4 | Board discipline is strong; authenticated platform/provider evidence remains unavailable. |

Raw live total: `46/100`.

Blocker-capped live score: `38/100`.

## Current Live Evidence

Command:

```bash
for url in \
  https://www.mitra-auto.fi/ \
  https://mitra-auto.fi/ \
  https://www.mitra-auto.fi/en \
  https://www.mitra-auto.fi/palvelut/autohuolto \
  https://www.mitra-auto.fi/catalog \
  https://www.mitra-auto.fi/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697 \
  https://www.mitra-auto.fi/this-route-should-not-exist-score \
  https://www.mitra-auto.fi/cms \
  https://www.mitra-auto.fi/customer-account \
  https://www.mitra-auto.fi/robots.txt \
  https://www.mitra-auto.fi/sitemap.xml \
  https://www.mitra-auto.fi/sitemap-products.xml \
  https://www.mitra-auto.fi/merchant-products.xml
 do
   curl -sSIL -o /dev/null --max-time 20 -w '%{url_effective}|http=%{http_code}|content_type=%{content_type}|redirects=%{num_redirects}|time=%{time_total}\n' "$url"
 done
```

| URL | Result | SEO interpretation |
| --- | --- | --- |
| `https://www.mitra-auto.fi/` | `200 text/html`, redirects `0` | Reachable homepage, but plain crawler view requires JavaScript. |
| `https://mitra-auto.fi/` | final `https://www.mitra-auto.fi/`, redirects `1` | Apex to `www` redirect works. |
| `/en` | `200 text/html` | English entry exists. |
| `/palvelut/autohuolto` | `200 text/html` | Service URL exists. |
| `/catalog` | `200 text/html` | Catalog hub exists. |
| `/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697` | `200 text/html`, redirects `0` | Opaque item-code/ID URL is not redirected to an SEO slug. |
| `/this-route-should-not-exist-score` | `200 text/html`, redirects `0` | Invalid route soft-404 risk. |
| `/cms` | `200 text/html`, redirects `0` | Private/admin-style route is publicly reachable. |
| `/customer-account` | `200 text/html`, redirects `0` | Private/unknown route class needs stricter status policy. |
| `/robots.txt` | `404 text/plain` | Production robots asset missing. |
| `/sitemap.xml` | `404 text/plain` | Production primary sitemap missing. |
| `/sitemap-products.xml` | `200 text/html` | Product sitemap is serving HTML instead of XML. |
| `/merchant-products.xml` | `200 text/html` | Merchant feed is serving HTML instead of XML. |

## Current Local Evidence

| Check | Result |
| --- | --- |
| `npm run build` | Passed with one large-chunk warning. |
| `npm run i18n:audit` | Passed. |
| `npm run sitemap:check` | Passed: `60918` URLs across `2` product sitemap files. |
| `npm run feed:check` | Passed: `31575` Merchant feed items. |
| `npm run commerce:check` | Passed: schema, cart, checkout, and product mapping use the shared commerce snapshot. |
| `source ~/.config/projects/bin/project && project mitraauto` | Passed with non-secret project metadata confirmed. |
| `codex mcp get supabase-mitra` | Passed; project ref is `rcmmbwdebnmicrweoiyz`. |

## Highest-Leverage Fix Order

| Order | Work | Expected score lift | Acceptance gate |
| ---: | --- | --- | --- |
| 1 | `R-1` Public/private boundary and CMS route protection | 10-15 points | Unauthenticated private/admin/account routes return `401`, `403`, or safe `404`; no private interface renders. |
| 2 | `R-3` Production static SEO assets and Merchant feed deployment parity | 12-18 points | `robots.txt` is `200 text/plain`; sitemaps and Merchant feed are `200 XML`. |
| 3 | `R-4` HTTP redirect, product ID migration, and soft-404 remediation | 8-12 points | Legacy routes and product identifiers permanently redirect one hop to canonical slug URLs; invalid routes return `404`/`410`. |
| 4 | `R-5` Checkout URL, canonical, and deployed Paytrail parity | 4-8 points | Checkout navigation uses `/checkout`; Paytrail function deployment is read back and revalidation verified. |
| 5 | `R-6` Authenticated provider and platform readback | 8-12 points | Search Console, GBP, Merchant Center, analytics, logs, field CWV, Cloudflare, and provider evidence are captured. |

## Final Classification

```text
SEO score: 38/100 live production, blocker-capped.
Source foundation: 74/100.
Release decision: NO-GO.
Next work: R-1 - Public/private boundary and CMS route protection.
```

This evaluation does not guarantee crawling, indexing, selected canonicals, rankings, rich results, local-pack visibility, Merchant Center approval, traffic, conversions, revenue, or AI inclusion.
