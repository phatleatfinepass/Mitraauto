# B-5 Technical Runtime QA Closeout

Date: 2026-06-22

Status: Complete locally. Production evidence remains assigned to E-3.

## Scope

B-5 tested the Phase B technical/product SEO runtime after slug migration, redirects, sitemap generation, Product schema/feed/cart/checkout reconciliation, and server-side checkout validation.

Primary surfaces checked:

- public home, local, service, catalog, product, checkout, and not-found routes
- product slug canonical behavior for tire and rim samples from `sitemap-products-1.xml`
- invalid product URL behavior
- product sitemap, merchant feed, XML validity, build, i18n, commerce, and Edge Function behavior

## Fixes Made During B-5

| Finding | Runtime risk | Fix |
| --- | --- | --- |
| `/` could render English metadata from stored/browser language and canonicalize to `/en`. | Wrong canonical and hreflang for Finnish root. | Forced `/` to resolve as Finnish in `LanguageContext`. |
| Home SEO head ran from the app shell on every route. | Local/contact/product routes could inherit home title, description, and canonical. | Added an `enabled` gate to `useLocalSeoHead` and enabled home metadata only for `currentPage === 'home'`. |
| Product pages with empty CMS SEO fields emitted empty meta descriptions. | Thin product snippets and incomplete Product schema descriptions. | Added deterministic localized Product SEO fallback title/description. |
| Tire runtime slug format differed from sitemap slug format. | Sitemap URL and canonical URL could disagree. | Matched tire runtime size formatting to sitemap slug format. |
| Rim runtime slug numeric scale differed from database-generated sitemap slug. | Rim sitemap URLs canonicalized to a different frontend-generated slug. | Matched rim ET/center-bore decimal formatting to the database slug contract. |
| Invalid product slugs rendered the indexable catalog page with canonical `/catalog`. | Critical soft-404 and duplicate/canonical pollution. | Routed unresolved product slugs to the explicit noindex not-found page. |
| Cloudflare Pages Function only handled opaque product redirects. | Confirmed missing product URLs would not receive HTTP 404 at edge. | Added confirmed-empty product lookup handling that returns SPA shell with HTTP 404 and `x-robots-tag: noindex, follow`. |
| Vite build emitted mixed static/dynamic Supabase import warning. | Chunking ambiguity and noisy build output. | Removed dynamic Supabase client imports where the static client was already loaded. |

## Rendered Route Evidence

| Route | Result |
| --- | --- |
| `/` | Finnish title, description, canonical `https://www.mitra-auto.fi/`, hreflang, LocalBusiness/WebPage/Breadcrumb JSON-LD. |
| `/en` | English title, description, canonical `https://www.mitra-auto.fi/en`, LocalBusiness/WebPage/Breadcrumb JSON-LD. |
| `/helsinki` | Helsinki-specific title, description, canonical `https://www.mitra-auto.fi/helsinki`, hreflang, LocalBusiness/WebPage/Breadcrumb JSON-LD. |
| `/catalog` | Catalog title, description, canonical `https://www.mitra-auto.fi/catalog`, CollectionPage/Breadcrumb JSON-LD. |
| `/catalog/tire/accelera-651-sport-265-30-r19-93-w-summer` | Product title/description, canonical matches sitemap URL, Product/Breadcrumb JSON-LD. |
| `/catalog/rim/885-classic-rs-gold-7-5x17-5x108-et35-5x108-et-35-00-cb-71-60` | Product title/description, canonical matches sitemap URL, Product/Breadcrumb JSON-LD. |
| `/checkout` | `noindex, nofollow`, no canonical, no alternates, no JSON-LD. |
| `/catalog/tire/not-a-real-product-for-b5` | Renders not-found page with `noindex, follow`, no canonical, no alternates. Edge function smoke test returns HTTP 404. |
| `/definitely-missing-b5` | Renders not-found page with `noindex, follow`, no canonical, no alternates. Local Vite preview HTTP status remains 200 because it bypasses host routing. |

## Verification

| Command or check | Result | Evidence |
| --- | --- | --- |
| `npm run i18n:audit` | Passed | `i18n audit passed.` |
| `npm run commerce:check` | Passed | Shared commerce snapshot check passed. |
| `deno check 'functions/[[path]].ts'` | Passed | Cloudflare Pages Function type check passed. |
| `deno check supabase/functions/payments_create_paytrail/index.ts` | Passed | Paytrail function type check passed. |
| `git diff --check --` | Passed | No whitespace errors. |
| `xmllint --noout src/public/sitemap.xml src/public/sitemap-products.xml src/public/sitemap-products-1.xml src/public/sitemap-products-2.xml src/public/merchant-products.xml` | Passed | XML parse clean. |
| `source ~/.config/projects/bin/project && project mitraauto >/dev/null && npm run sitemap:products && npm run sitemap:check && npm run feed:merchant && npm run feed:check && npm run build` | Passed | 31,575 eligible products, 60,918 product sitemap URLs, 31,575 merchant feed items. |
| `deno eval ... functions/[[path]].ts smoke test` | Passed | Missing product returned 404 with `x-robots-tag: noindex, follow`; opaque legacy product ID returned 308. |
| MCP browser rendered route checks | Passed with noted local-host limitation | No browser console errors; rendered heads/schema matched expected policy. |
| Local Vite HTTP status matrix with Node `fetch` | Expected limitation | Known SPA preview returns 200 for missing routes; deployed Pages Function must be tested in E-3. |

Build warning remaining:

```text
Some chunks are larger than 500 kB after minification.
Main JS asset observed: ~2.62 MB, gzip ~662 kB.
```

This is not a Phase B correctness blocker, but it should be handled in a performance/code-splitting task before paid acquisition or broad launch.

## Remaining Production Evidence

Assigned to E-3:

- deployed `https://www.mitra-auto.fi` redirect verification for opaque product identifiers
- deployed invalid product URL HTTP 404 verification through Pages Function
- deployed sitemap index and product child sitemap fetch/header verification
- deployed Merchant feed fetch/header verification
- deployed rendered Product JSON-LD validation through browser/crawler
- deployed checkout Paytrail revalidation smoke with provider-safe test path

Assigned to later performance work:

- route-level code splitting or chunk strategy for the current ~2.62 MB entry JS bundle

## Decision

Phase B source/runtime QA is complete locally.

Phase B can close as a source implementation phase because product slug routing, sitemap/feed generation, Product schema, invalid product handling, commerce contract checks, and edge function behavior have deterministic local evidence.

Production execution remains a release evidence gate in E-3 and must not be represented as live-verified until the deployed host is tested.
