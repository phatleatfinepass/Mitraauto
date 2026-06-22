# SEO Architecture Audit - Mitra Auto

Date: 2026-06-21

Evidence used: repository route/code inspection, Growth SEO architecture rules, local implementation pass. Live crawl, Google Search Console, analytics, production Supabase data sampling, and provider-level redirect checks were not run.

Validation: `npm run build` passed locally. `xmllint --noout src/public/sitemap.xml` passed. `git diff --check` passed.

## Executive Findings

1. Critical: product detail URLs could fall back to opaque variant IDs. The old public pattern was `/catalog/{tire|rim}/{seo_slug || variant_id}`. This is now changed to slug-first URL generation through `src/utils/catalogSeo.ts`, but production needs the new Supabase migration applied before generated-slug direct loads work remotely.
2. Critical: English product canonicals pointed to `/en/catalog/...`, but the SPA router only recognized `/catalog/...`. The router now supports `/en/catalog/{tire|rim}/{identifier}` and `/en/catalog`.
3. Critical: legacy identifier URLs can still resolve by UUID, EAN, derived EAN, or supplier code, but the browser is normalized to the slug URL after product lookup. This is a client-side compatibility redirect. A true 301/308 needs host or edge middleware because static `_redirects` cannot look up product identifiers in Supabase.
4. High: this is still a client-rendered SPA. Route-specific titles, canonicals, and schema are inserted after JavaScript runs. Search engines can process this eventually, but SEO-critical pages should move to SSR, prerendering, or edge-rendered HTML for reliable crawl and sharing behavior.
5. High: unknown SPA routes likely return HTTP 200 through the hosting fallback and then render a client-side 404. Public invalid URLs should return an actual 404 response.
6. High: the sitemap is static and does not include product URLs. A product sitemap must be generated from published, visible, product-ready rows using only canonical slug URLs.
7. High: product schema is missing. Add `Product`, `Offer`, image, brand, SKU/GTIN, and availability only after visible page price/availability and inventory rules are made consistent.

## Implemented In This Pass

- Added `src/utils/catalogSeo.ts` for slug normalization, opaque identifier detection, product slug construction, canonical detail path construction, and catalog detail path parsing.
- Updated catalog cards and product-click navigation to use slug-first URL generation.
- Updated product detail canonical and `hreflang` URLs to use the same canonical URL builder.
- Added `/en/catalog` and `/en/catalog/{tire|rim}/{identifier}` route support.
- Preserved legacy UUID, EAN, derived EAN, and supplier-code URLs through lookup, then normalizes the address bar to the canonical slug path.
- Added a Supabase migration for slug helper functions, tire detail lookup RPC, generated-slug lookup, and rim detail RPC generated-slug support.
- Switched header, footer, and homepage links from legacy paths to language-aware canonical paths.
- Added `/en/catalog` to the static sitemap.

## Public Route Matrix

| Route type | Current URL pattern | Indexable? | Ideal SEO URL pattern | Canonical policy | Redirect policy | Sitemap policy | Schema policy | Internal-link policy | Implementation files |
|---|---|---:|---|---|---|---|---|---|---|
| Homepage | `/`, `/en` | Yes | `/`, `/en` | Self-canonical per language, `hreflang` FI/EN, x-default to `/` | Keep `/en/` trailing slash normalized by host if possible | Include both | `AutoRepair`/`LocalBusiness`, `WebSite`, `Organization` | Link brand/logo to current language homepage | `src/SiteApp.tsx`, `src/components/site/layout/Navbar.tsx`, `src/public/sitemap.xml` |
| Service hub | `/palvelut`, `/en/services`; legacy `/services` | Yes for canonical only | `/palvelut`, `/en/services` | Canonical to localized hub | 301 `/services` to `/en/services` or chosen default; avoid indexing legacy | Include canonical FI/EN hubs only | `Service`, `AutoRepair`, `BreadcrumbList`; no FAQ rich-result dependency | Header/footer/homepage should use localized canonical paths | `src/SiteApp.tsx`, `src/i18n/dictionaries/serviceSeo.ts`, `src/components/site/pages/ServicesPage.tsx`, `src/public/sitemap.xml` |
| Service detail | `/palvelut/{slug}`, `/helsinki/{slug}`, `/en/services/{slug}`, `/en/helsinki/{slug}`; legacy component pages such as `/car-service` are not public-routed | Yes for canonical service pages | Keep localized service slugs; choose one canonical per intent and use city variants only when content is meaningfully local | Self-canonical for each intentionally indexable page; use alternates across FI/EN equivalents | 301 old English or ID-based service URLs to localized slug URLs | Include only canonical service URLs; exclude duplicate thin variants if content is not distinct | `Service`/`AutoRepair` with visible offer area, `BreadcrumbList`; avoid stale FAQ schema | Link service CTAs to canonical localized service URLs | `src/i18n/dictionaries/serviceSeo.ts`, `src/components/site/pages/ServiceDetailPage.tsx`, `src/public/sitemap.xml` |
| Location page | `/helsinki`, `/en/helsinki` | Yes | `/helsinki`, `/en/helsinki` | Self-canonical with language alternates | 301 equivalent legacy location URLs if created later | Include both | `AutoRepair`, `LocalBusiness`, `PostalAddress`, `OpeningHoursSpecification`, `BreadcrumbList` | Link from nav/footer/service pages using localized path | `src/SiteApp.tsx`, `src/components/site/pages/HelsinkiPage.tsx`, `src/public/sitemap.xml` |
| Contact page | `/yhteystiedot`, `/en/contact` | Yes | `/yhteystiedot`, `/en/contact` | Self-canonical with alternates | Avoid old homepage-section anchors as canonical contact URLs | Include both | `LocalBusiness`, `ContactPoint`, `BreadcrumbList` | Footer contact now links to full contact page, not a homepage anchor | `src/components/site/pages/ContactPage.tsx`, `src/components/site/layout/Footer.tsx`, `src/public/sitemap.xml` |
| FAQ page | `/ukk`, `/en/faq` | Yes, if content is useful | `/ukk`, `/en/faq` | Self-canonical with alternates | Redirect old FAQ variants if any | Include both if maintained | On-page FAQ content; do not rely on FAQ rich-result eligibility | Link from support/contact contexts | `src/components/site/pages/FAQPage.tsx`, `src/public/sitemap.xml` |
| About page | `/meista`, `/en/about`; legacy `/about` | Yes for canonical only | `/meista`, `/en/about` | Canonical localized page | 301 `/about` to `/en/about` or localized default | Include canonical FI/EN only | `AboutPage`, `Organization`, `BreadcrumbList` | Header/footer now use localized canonical paths | `src/SiteApp.tsx`, `src/components/site/pages/AboutPage.tsx`, `src/components/site/layout/Navbar.tsx`, `src/components/site/layout/Footer.tsx` |
| Catalog hub | `/catalog`, `/en/catalog`; legacy `/shop`, `/en/shop` | Yes, but with controlled faceting | `/catalog`, `/en/catalog` | Self-canonical; strip query params unless a facet is explicitly approved as indexable | 301 `/shop` to `/catalog` and `/en/shop` to `/en/catalog` | Include both hubs | `CollectionPage`, `BreadcrumbList`; no product list item schema unless stable and visible | Header/footer/homepage now use localized canonical catalog hubs | `src/SiteApp.tsx`, `src/components/catalog/CatalogPage.tsx`, `src/public/sitemap.xml` |
| Tire product detail | Before: `/catalog/tire/{seo_slug || variant_id}`. Now: `/catalog/tire/{readable-slug}`, `/en/catalog/tire/{readable-slug}` with legacy identifier lookup | Yes for published, visible, product-ready canonical slug URLs only | `/catalog/tire/{brand-model-size-season}` and `/en/catalog/tire/{localized-or-generated-slug}` | Canonical to slug URL; FI/EN alternates; never canonicalize to UUID, EAN, or supplier code | Legacy UUID/EAN/derived-EAN/supplier-code URLs resolve and client-normalize to slug; add server/edge 301 when possible | Generate dynamic product sitemap from database; include only canonical product slug URLs | Add `Product`, `Offer`, `Brand`, image, GTIN/EAN, availability, price currency, and `BreadcrumbList` after visible data consistency audit | Product cards and click navigation now use slug-first helpers | `src/utils/catalogSeo.ts`, `src/components/catalog/CatalogPage.tsx`, `src/SiteApp.tsx`, `src/components/catalog/ProductDetailPage.tsx`, `src/utils/productsSearch.ts`, `supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql` |
| Rim product detail | Before: `/catalog/rim/{seo_slug || variant_id}`. Now: `/catalog/rim/{readable-slug}`, `/en/catalog/rim/{readable-slug}` with legacy identifier lookup | Yes for published, visible, product-ready canonical slug URLs only | `/catalog/rim/{brand-model-size-pcd-et-cb-color}` and `/en/catalog/rim/{localized-or-generated-slug}` | Canonical to slug URL; FI/EN alternates; never canonicalize to UUID, EAN, or supplier code | Same as tire detail; server/edge 301 still required for HTTP-level redirects | Same as tire product sitemap | Same as tire product schema, with rim-specific properties visible on-page | Product cards and click navigation now use slug-first helpers | Same as tire product detail |
| Checkout | `/checkout`, `/checkout/success`, `/checkout/cancel` | No | Keep utility URLs; avoid discoverable marketing URLs | `noindex, nofollow`; no canonical needed beyond self if rendered | Do not redirect success/cancel if payment provider needs them; expire sensitive state | Exclude | No SEO schema | Do not link from crawlable nav except cart/checkout action controls | `src/SiteApp.tsx`, `src/components/site/checkout/*`, `src/public/robots.txt` |
| Booking management | `/booking/manage`, `/en/booking/manage` | No | Tokenized/account utility URL | `noindex, nofollow`; require token/session checks | Invalid/expired tokens should return real 404 or 410 equivalent, not indexable SPA content | Exclude | None | Link only from transactional emails/account context | `src/SiteApp.tsx`, `src/components/site/pages/CustomerBookingManagePage.tsx`, `src/public/robots.txt` |
| Customer account | `/account`, `/customer`, `/customer/account`, `/en/account`, `/en/customer/account` | No | One canonical account route per language if needed | `noindex, nofollow`; auth-gated | 301 duplicate account aliases to one route after auth-safe design | Exclude | None | Header account control only, not crawl-oriented links | `src/SiteApp.tsx`, `src/components/site/pages/CustomerAccountPage.tsx`, `src/public/robots.txt` |
| Legal pages | `/privacy`, `/terms`, `/legal`; legacy `/legal/privacy`, `/legal/terms` | Yes for privacy/terms; maybe no for generic `/legal` if thin | `/privacy`, `/terms`; optional `/en/privacy`, `/en/terms` if translated | Canonical to `/privacy` and `/terms`; generic `/legal` should be an indexable hub only if substantial | 301 `/legal/privacy` to `/privacy`; `/legal/terms` to `/terms` | Include canonical legal pages if business wants them discoverable | `WebPage`, `BreadcrumbList` | Footer now links to `/privacy` and `/terms` | `src/SiteApp.tsx`, `src/components/site/pages/LegalPage.tsx`, `src/components/site/layout/Footer.tsx` |
| CMS/admin/PWA | `/cms`, `/cms/**`, `/dashboard`, `/admin/schedule`, `/pwa/**` | No | Keep private app URLs | `noindex, nofollow`; auth required | Legacy admin aliases can redirect to `/cms#...`; never expose in sitemap | Exclude | None | Do not link from public footer/nav except authenticated dashboard control | `src/SiteApp.tsx`, `src/components/cms/**`, `src/CmsPwaApp.tsx`, `src/public/robots.txt` |
| 404/unknown | Any unmatched route | No | Real HTTP 404 with localized not-found page | No canonical; `noindex` | Host should return 404 for unknown static routes or edge-render the SPA 404 with 404 status | Exclude | None | Avoid internal broken links; monitor crawl errors | `src/SiteApp.tsx`, `src/components/site/pages/NotFoundPage.tsx`, hosting config |

## Product URL Migration Policy

Canonical product URLs must be readable and stable. The route identifier should be:

1. CMS/localized SEO slug if non-opaque.
2. Stored `seo_slug` if non-opaque.
3. Generated slug from visible product attributes.
4. UUID only as a last-resort internal fallback, never as the preferred public link.

Legacy identifiers preserved for lookup:

- `variant_id` UUID
- `ean`
- `derived_ean`
- `supplier_code_best`
- Existing stored slugs
- Generated slug from canonical product attributes

Current implementation normalizes the browser URL after lookup. Production-grade migration still needs edge/server redirects:

- `/catalog/tire/{uuid|ean|supplier-code}` -> `/catalog/tire/{canonical-slug}`
- `/catalog/rim/{uuid|ean|supplier-code}` -> `/catalog/rim/{canonical-slug}`
- Equivalent `/en/catalog/...` routes should redirect to English canonical slugs where available.

## Remaining Architecture Work

1. Apply and verify the Supabase migration on `supabase-mitra` after confirming project ref `rcmmbwdebnmicrweoiyz`.
2. Add a product sitemap generator backed by `webshop_tire_search_index` and `webshop_items`/rim read models. Emit only canonical slug URLs.
3. Add host or edge dynamic redirects for legacy product identifiers; static redirect files cannot resolve product IDs to slugs.
4. Move SEO-critical pages to SSR/prerendering or generate static HTML snapshots for public routes.
5. Add real 404 HTTP handling for unmatched routes.
6. Add Product schema only after price, availability, GTIN, image, and stock display rules are verified against schema output.
7. Define an indexable facet policy for catalog filters. Default all search/filter/sort query combinations to canonical hub unless explicitly approved.
8. Add canonical redirects for legacy content paths: `/services`, `/about`, `/tire-hotel`, `/shop`, `/legal/privacy`, and `/legal/terms`.
