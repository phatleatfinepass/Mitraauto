# Technical SEO Audit - 2026-06-21

Scope: local repository and local build evidence for Mitra Auto. This is not a production crawl or Search Console audit.

## Executive Findings

1. Product detail URLs were the critical SEO risk. The route system now supports human-readable catalog product slugs while still resolving old UUID/EAN/supplier-code identifiers through `catalog_get_tire_by_identifier_v1` and `catalog_get_rim_by_identifier_v1`.
2. Generated service detail pages still use raw service IDs such as `/palvelut/tire-change-suv`. They are routable for users, but they are now `noindex, follow` because the copy is generated and near-duplicate.
3. Product pages now emit Product JSON-LD with offer, stock, price, brand, image, EAN when available, and real aggregate rating only when review data exists.
4. Bespoke service pages now emit a structured `@graph` with LocalBusiness, Service, and BreadcrumbList. They also own canonical and `hreflang` tags while mounted.
5. Utility and protected app screens now get `noindex, nofollow`, with canonical and alternate links removed while those routes are active.
6. The sitemap now submits canonical commercial URLs only. Non-canonical service aliases remain routable, but are no longer submitted as preferred sitemap URLs.

## Implemented In This Pass

- `src/components/site/pages/ServiceDetailPage.tsx`
  - Added generated-service `noindex, follow`.
  - Added service `hreflang` alternates.
  - Replaced single AutoRepair JSON-LD with an `@graph` containing LocalBusiness, Service, and BreadcrumbList.
  - Restores head state on SPA route changes.

- `src/components/catalog/ProductDetailPage.tsx`
  - Added Product JSON-LD.
  - Added cleanup for product canonical and alternate links.
  - Keeps slug canonical URLs aligned with localized product slugs.

- `src/components/site/pages/NotFoundPage.tsx`
  - Added `noindex, follow`.
  - Removes stale canonical and alternate links while the 404 view is active.

- `src/SiteApp.tsx`
  - Added a route-level `noindex, nofollow` guard for checkout, account, booking-management, CMS, and PWA app screens.

- `src/public/sitemap.xml`
  - Removed non-canonical service alias URLs such as `/helsinki/autohuolto`, `/en/helsinki/car-service`, `/palvelut/dpf-pesu`, and `/en/services/dpf-cleaning`.

## Route Policy Matrix

| Public route type | Current URL pattern | Indexable | Ideal SEO URL pattern | Canonical policy | Redirect policy | Sitemap policy | Schema policy | Internal-link policy | Files |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/`, `/en` | Yes | `/`, `/en` | Self canonical per locale | `/en/` should normalize to `/en` | Include both | Add WebSite + Organization later | Link to services and catalog from primary nav and homepage | `src/SiteApp.tsx`, `index.html`, `src/index.html` |
| Local landing | `/helsinki`, `/en/helsinki` | Yes | Same | Self canonical per locale | Legacy local aliases should 301 to canonical when hosting allows | Include both | LocalBusiness/AutoRepair with verified NAP only | Link from nav/footer and service pages | `src/SiteApp.tsx`, `src/components/site/pages/HelsinkiPage.tsx` |
| Service hub | `/palvelut`, `/en/services`, legacy `/services` | Yes for FI/EN canonical routes | `/palvelut`, `/en/services` | Self canonical; `hreflang` FI/EN recommended | Legacy `/services` should 301 to `/en/services` or `/palvelut` by locale policy | Include canonical FI/EN only | ItemList/ServiceCatalog later | Link only to indexable bespoke service pages from hub blocks | `src/SiteApp.tsx`, `src/components/site/pages/ServicesPage.tsx` |
| Bespoke service detail | `/palvelut/autohuolto`, `/en/services/car-service`, etc. | Yes | Human-language service slug by locale | Canonical to the localized primary path from `serviceSeoPages.paths` | Alias paths such as `/helsinki/autohuolto` should 301 to canonical when hosting allows; current SPA canonicalizes in head | Include canonical service URLs only | LocalBusiness + Service + BreadcrumbList implemented | Home, hub, related service cards should link to canonical paths | `src/i18n/dictionaries/serviceSeo.ts`, `src/components/site/pages/ServiceDetailPage.tsx`, `src/public/sitemap.xml` |
| Generated service detail | `/palvelut/{serviceId}`, `/en/services/{serviceId}` | No | Replace with bespoke pages only when unique content exists | Self canonical while `noindex, follow` | Future: redirect low-value generated routes to closest bespoke service when safe | Exclude | No rich-result targeting; current schema is semantic only | Keep links limited; prefer bespoke pages for commercial anchor text | `src/i18n/dictionaries/serviceSeo.ts`, `src/components/site/pages/ServiceDetailPage.tsx` |
| Catalog listing | `/catalog`, `/en/catalog`, legacy `/shop`, `/en/shop` | Yes | `/catalog`, `/en/catalog`; filtered states should not become indexable without static landing pages | Self canonical for listing | `/shop` aliases should 301 to `/catalog` when hosting allows | Include listing roots only | ItemList/BreadcrumbList later | Nav/home CTAs link to catalog roots | `src/SiteApp.tsx`, `src/components/catalog/CatalogPage.tsx` |
| Product detail | `/catalog/tire/{slug}`, `/catalog/rim/{slug}`, `/en/catalog/tire/{slug}`, `/en/catalog/rim/{slug}` | Yes when published/ready | Human-readable brand-model-size slugs | Canonical to locale-specific slug URL; old ID/EAN/supplier-code URL resolves then client-replaces to canonical | Current: client-side replace after DB lookup. Future: edge 301/308 for old opaque identifiers if hosting adds lookup middleware | Do not list dynamic products in static sitemap until a generated product sitemap exists | Product JSON-LD implemented | Product cards use slug routes; related modules should avoid UUID/EAN URLs | `src/utils/catalogSeo.ts`, `src/utils/productsSearch.ts`, `src/components/catalog/ProductDetailPage.tsx`, `supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql` |
| Legal | `/privacy`, `/terms`, `/legal/privacy`, `/legal/terms`, `/legal` | Optional | `/privacy`, `/terms` | Canonical to primary legal paths | Legacy `/legal/*` should 301 to primary paths | Include only if business wants them discoverable | WebPage only if needed | Footer links only | `src/SiteApp.tsx`, `src/components/site/pages/LegalPage.tsx` |
| Checkout/account/booking utility | `/checkout`, `/checkout/success`, `/checkout/cancel`, `/account`, `/customer/*`, `/booking/manage` | No | Keep as utility routes | No canonical while active | No public redirect needed except obsolete aliases | Exclude | No schema | Do not link from SEO body copy except transactional flows | `src/SiteApp.tsx`, `src/public/robots.txt` |
| CMS/PWA/admin | `/cms`, `/cms/*`, `/pwa`, `/pwa/*` | No | Keep private app routes | No canonical while active | Preserve auth rewrites only | Exclude | No schema | Do not expose in public nav | `src/SiteApp.tsx`, `src/public/_redirects`, `src/public/robots.txt` |
| 404/unknown | any unmatched path | No | Real server 404 preferred | No canonical while active | Hosting should serve SPA fallback, but crawler status should ideally be 404/410 for invalid URLs | Exclude | No schema | Link back to home/contact only | `src/components/site/pages/NotFoundPage.tsx`, `src/public/_redirects` |

## Remaining Technical SEO Work

1. Add server/edge redirects for canonicalization. The repo has `_redirects` for SPA rewrites, but dynamic product ID-to-slug redirects require a host function or edge middleware with catalog lookup access.
2. Generate a dynamic product sitemap from published, ready catalog products. Include only canonical slug URLs and split into sitemap indexes when the catalog grows.
3. Add static landing pages for high-intent catalog facets before making filtered URLs indexable, for example winter tires, summer tires, alloy rims, and common tire sizes.
4. Add a shared head manager or route metadata layer. Current head ownership is improved, but still distributed across components.
5. Add Organization/WebSite/LocalBusiness schema for home and local landing pages once NAP, opening hours, logo, sameAs, and contact data are verified.
6. Configure hosting to return true 404/410 status for invalid non-SPA assets and known removed public URLs where possible.

## Validation

- `npm run build`: passed.
- `git diff --check`: passed.
- `xmllint --noout src/public/sitemap.xml`: passed.
