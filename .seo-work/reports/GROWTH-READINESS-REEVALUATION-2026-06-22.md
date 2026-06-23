# Growth Readiness Re-evaluation - Mitra Auto

Recorded: 2026-06-22

Status: Complete, no-go with live blockers unchanged

Score boundary:

```text
Internal implementation score. Not a Google score and not a ranking prediction.
```

## Decision

Mitra Auto remains `NO-GO`.

Local/source quality improved and the compact local gates pass. Production still fails release-level HTTP/static/redirect/private-boundary checks, so live SEO and growth readiness remain capped.

## Scores

| Score | Value | Decision |
| --- | ---: | --- |
| Live production SEO score | `38/100` | `NO-GO` |
| Raw weighted live score before blocker cap | `49/100` | Live blockers cap the usable score. |
| Local/source foundation score | `78/100` | Improved, but not release-ready. |
| Growth readiness score | `34/100` | Still blocked by production, platform, owner, and measurement evidence gaps. |

Plain answer:

```text
The local repo is close to a workable SEO foundation.
The public production site is still not SEO-ready or growth-ready.
```

## Evidence Coverage

| Evidence mode | State | Notes |
| --- | --- | --- |
| Repository/source | `EXECUTED_WITH_FINDINGS` | Local source gates pass, but source and production are not aligned. |
| Build | `EXECUTED` | Vite production build passed. |
| Live HTTP | `EXECUTED_WITH_FINDINGS` | Live blockers unchanged from R-8. |
| Browser | `SUPPLIED_FROM_R8_EXECUTED_WITH_FINDINGS` | R-8 browser smoke showed rendered public pages hydrate correctly. |
| Platform | `UNAVAILABLE` | Search Console, Cloudflare, GBP, Merchant Center, analytics, logs, and field data unavailable. |
| Content | `EXECUTED_WITH_OWNER_EXCEPTIONS` | Service/product content improved; owner proof still missing. |
| Conversion | `EXECUTED_LOCAL_PROTOCOL_ONLY` | Checkout/local protocol checks pass; production provider parity remains blocked. |
| Migration | `EXECUTED_WITH_FINDINGS` | Live redirects and soft-404 handling still fail. |

## Scorecard

| Dimension | Weight | Live | Local/source | Evaluation |
| --- | ---: | ---: | ---: | --- |
| Access, indexability, canonicalization | 20 | 3 | 15 | Live robots, sitemap, feed, redirects, private routes, and soft-404s are blocking. |
| Rendering and architecture | 15 | 8 | 12 | Rendered samples work; raw HTML is still a JavaScript shell. |
| Content quality and evidence | 20 | 12 | 15 | Content scaffolding improved; owner evidence remains unavailable. |
| Metadata and search appearance | 10 | 5 | 8 | Rendered head works on samples; raw direct HTML and static assets reduce confidence. |
| Structured data | 10 | 6 | 8 | Rendered JSON-LD appears on samples; platform validation unavailable. |
| Experience, accessibility, and SXO | 10 | 6 | 8 | Checkout utility policy improved; full accessibility and production payment evidence remain incomplete. |
| Local, ecommerce, international | 10 | 6 | 8 | Local i18n/feed/sitemap checks pass; live feed and GBP/Merchant evidence block readiness. |
| Monitoring and governance | 5 | 3 | 4 | Board discipline is strong; authenticated platform evidence is still missing. |

## Fresh Live Evidence

| URL / Surface | Observed | Interpretation |
| --- | --- | --- |
| `https://www.mitra-auto.fi/` | `200 text/html` | Homepage reachable. |
| `https://mitra-auto.fi/` | final `https://www.mitra-auto.fi/`, redirects `1` | Apex-to-www redirect works. |
| `/en`, `/palvelut/autohuolto`, `/catalog` | `200 text/html` | Public routes reachable through SPA. |
| Product UUID URL | `200 text/html`, redirects `0` | Opaque product URL still does not redirect to slug. |
| Random invalid route | `200 text/html`, redirects `0` | HTTP soft-404 remains. |
| `/cms`, `/customer-account` | `200 text/html`, redirects `0` | Private/admin/account boundary still fails at HTTP layer. |
| `robots.txt` | `404 text/plain;charset=UTF-8` | Production robots asset missing. |
| `sitemap.xml` | `404 text/plain;charset=UTF-8` | Production primary sitemap missing. |
| `sitemap-products.xml` | `200 text/html` | Product sitemap is still HTML shell, not XML. |
| `merchant-products.xml` | `200 text/html` | Merchant feed is still HTML shell, not XML/RSS. |

## Local Positives

- Local source gates passed: i18n, sitemap, feed, commerce, route migration, checkout, and private route checks.
- Vite production build passed.
- Local source/build static SEO assets passed.
- Merchant feed has `31575` items in local source/build static checks.
- R-8 browser evidence confirmed homepage, service page, product slug page, checkout, English mobile service, English contact, and invalid-route UI render expected SEO markers after hydration.

## Blockers

| Priority | Finding | Owner | Verification |
| --- | --- | --- | --- |
| `P0` | Production static SEO assets and Merchant feed are not deployed correctly. | Hosting/deployment owner | `node scripts/check_static_deployment_assets.mjs --build-dir build --live https://www.mitra-auto.fi` passes. |
| `P0` | Public/private boundary remains unsafe at HTTP level. | Engineering/security plus hosting/provider owner | `/cms`, account, customer, and admin routes return `401`, `403`, or safe `404`; no private interface renders. |
| `P1` | Legacy redirects and product identifier redirects are inactive on production. | Hosting/edge routing owner | Legacy route and opaque product URL samples permanently redirect one hop to canonical destinations. |
| `P1` | Invalid and noncanonical routes remain HTTP soft-404s. | Hosting/edge routing owner | Unknown routes return `404`/`410`; intended variants redirect to canonical equivalents. |
| `P1` | Authenticated platform, provider, and owner evidence remains unavailable. | Provider/SEO/analytics/business owners | Search Console, Cloudflare, GBP, Merchant Center, analytics, logs, field performance, Paytrail, and owner proof are captured with secret-safe envelopes. |

## Next Action Lock

```text
Resolve production deployment/provider parity blockers before rerunning live evaluation or starting growth scaling.
```

Do not start broad content scaling, paid acquisition scaling, or AI visibility experiments yet. The site is still blocked at the launch-readiness layer.

## Verification

```text
live curl matrix: passed with findings, production blockers unchanged
local source gates through distill wrapper: passed
Vite production build through distill wrapper: passed
node scripts/check_static_deployment_assets.mjs --build-dir build: passed
node scripts/check_static_deployment_assets.mjs --build-dir build --live https://www.mitra-auto.fi: failed, live static asset parity not met
R-7/R-8 JSON integrity check: passed
```

## Cleanup

Generated verification artifacts removed:

```text
build
```

## Figma Make Sync

None.

This re-evaluation changed only docs/evidence artifacts and the Growth Readiness Board.

## No-guarantee Boundary

This evaluation does not guarantee crawling, indexing, selected canonicals, rankings, rich results, local-pack visibility, Merchant Center approval, traffic, conversions, revenue, or AI inclusion.
