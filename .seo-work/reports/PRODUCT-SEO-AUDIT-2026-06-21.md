# Product SEO Audit - Mitra Auto

Date: 2026-06-21

Scope: product/catalog route architecture, catalog collection pages, product detail templates, Product structured data, internal links, price/availability consistency, and product sitemap policy. This was a repository-level audit plus implementation pass. Production crawl, Search Console, Merchant Center, and live Supabase data sampling were not run.

Primary references:

- Google Search Central: Product structured data overview - https://developers.google.com/search/docs/appearance/structured-data/product
- Google Search Central: Product snippet structured data - https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Google Search Central: Breadcrumb structured data - https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Google Search Central: Ecommerce URL structure - https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites
- Google Search Central: Ecommerce pagination and incremental loading - https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- Google Search Central: Product variant structured data - https://developers.google.com/search/docs/appearance/structured-data/product-variants

## Executive Findings

1. Critical issue from the original audit was opaque product URLs. The codebase now generates slug-first product URLs and preserves old UUID/EAN/supplier-code identifiers through lookup, but HTTP-level 301/308 redirects still require host or edge middleware.
2. Product pages now have stronger Product SEO: canonical slug URLs, localized alternates, visible breadcrumbs, BreadcrumbList JSON-LD, Product JSON-LD, seller organization definition, GTIN normalization, and Offer markup only when a valid visible price exists.
3. Catalog collection pages now own their SEO head: `/catalog` and `/en/catalog` have self-canonicals, hreflang alternates, CollectionPage JSON-LD, WebSite JSON-LD, LocalBusiness JSON-LD, and breadcrumb JSON-LD.
4. Product cards now avoid displaying `0.00` prices when data is missing and prevent zero-price add-to-cart actions. Missing prices show a request-price state instead of producing false commerce signals.
5. Product discovery is still incomplete for scale. Product cards have crawlable anchor links, but pagination is state/button-driven and product URLs are not yet emitted in a dynamic sitemap.
6. Product content quality remains the largest ranking lever after the technical fixes. The template supports descriptions and attributes, but many product rows likely depend on supplier text or sparse fields. Product/category copy needs a planned enrichment pass.

## Implemented In This Pass

- `src/components/catalog/ProductDetailPage.tsx`
  - Added visible breadcrumbs with crawlable Home and Catalog links.
  - Added BreadcrumbList JSON-LD on product pages.
  - Made Product JSON-LD self-contained by including the seller LocalBusiness/organization node.
  - Added `url`, `category`, normalized `gtin`, existing `sku`, `mpn`, brand, image, product properties, and optional real aggregate rating.
  - Emits `Offer` only when `best_price_eur` is a finite positive number.
  - Adds `inventoryLevel` when stock quantity is available.
  - Uses the production canonical base URL from `businessProfile.websiteUrl`.
  - Links related product cards with canonical slug URLs when related products are supplied.
  - Fixed missing `ExternalLink` import already used by EPREL links.

- `src/components/catalog/CatalogPage.tsx`
  - Added catalog CollectionPage metadata for `/catalog` and `/en/catalog`.
  - Added canonical, FI/EN/x-default alternates, WebSite, LocalBusiness, CollectionPage, and BreadcrumbList JSON-LD.
  - Keeps catalog product card `href`s on canonical slug URL builders.
  - Guards add-to-cart against missing prices.

- `src/components/catalog/TireCard.tsx` and `src/components/catalog/RimCard.tsx`
  - Replaced `0.00` fallback prices with `Price on request` / `Kysy hinta`.
  - Disabled add-to-cart when a product is in stock but has no valid sellable price.
  - Aligned card prices with the VAT-inclusive product detail and Product schema price basis.

- `src/i18n/dictionaries/catalog.ts`
  - Added catalog SEO title/description keys.
  - Added missing-price and breadcrumb labels.

- `src/utils/pricing.ts`
  - Added shared product VAT constants so cards, product detail, and schema can use the same multiplier.

## Product Route Policy

| Route type | Current pattern | Indexable | Ideal pattern | Canonical policy | Redirect policy | Sitemap policy | Schema policy | Internal-link policy | Files |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Catalog hub | `/catalog`, `/en/catalog`; legacy `/shop`, `/en/shop` | Yes | `/catalog`, `/en/catalog` | Self-canonical per locale with hreflang | 301 `/shop` to `/catalog`, `/en/shop` to `/en/catalog` at host/edge | Include both hubs in static sitemap | CollectionPage + BreadcrumbList, no Product markup on listing pages | Nav/home/footer should link to localized canonical catalog hubs | `src/components/catalog/CatalogPage.tsx`, `src/SiteApp.tsx`, `src/public/sitemap.xml` |
| Tire product | `/catalog/tire/{slug}`, `/en/catalog/tire/{slug}`; legacy identifiers still resolve | Yes when published, visible, product-ready | `/catalog/tire/{brand-model-size-season}` and EN equivalent | Self-canonical to readable slug; FI/EN alternates | Dynamic 301/308 from UUID/EAN/derived-EAN/supplier-code to slug still needed | Generate product sitemap from canonical slug rows only | Product + Offer only with real price; GTIN/EAN; Brand; BreadcrumbList; seller organization | Product cards and related products link with readable slug hrefs | `src/utils/catalogSeo.ts`, `src/utils/productsSearch.ts`, `src/components/catalog/*`, `src/SiteApp.tsx` |
| Rim product | `/catalog/rim/{slug}`, `/en/catalog/rim/{slug}`; legacy identifiers still resolve | Yes when published, visible, product-ready | `/catalog/rim/{brand-model-size-pcd-et-cb-color}` and EN equivalent | Self-canonical to readable slug; FI/EN alternates | Same as tire products | Same as tire products | Product + Offer only with real price; rim fitment properties as visible attributes | Same as tire products | Same as tire products |
| Filter/search states | Currently component state, not stable URLs | No by default | Only create indexable static landing URLs for proven demand, e.g. `/catalog/winter-tires` later | Canonical dynamic filters to catalog hub unless approved | Do not redirect user-selected filters unless URL design changes | Exclude filter/sort/search URLs | No Product/ItemList rich-result targeting for volatile lists | Use crawlable links only for curated category landings | `src/components/catalog/CatalogPage.tsx`, future route layer |
| Paginated catalog results | Current buttons mutate state without page URLs | Partially discoverable only from first page | `/catalog?page=2` or static category pagination if indexable | If paginated pages are created, each page should self-canonical | Do not canonical all pages to page 1 if pages are indexable | Include only important category pages or rely on product sitemap/feed | No Product schema on paginated listing pages | Sequential `<a href>` links for next/previous pages if pagination becomes URL-based | Future `CatalogPage` routing work |

## Data And Ownership Map

| SEO field | Current source | Owner needed | Policy |
| --- | --- | --- | --- |
| Product slug | `seo_slug`, localized locale content, or generated from visible attributes | Catalog/CMS | Must be readable, lowercase, stable, non-opaque. UUID/EAN/supplier code can resolve but must not be preferred internal links. |
| Product title | localized content, CMS title, or model fallback | Catalog merchandising | Unique enough to include brand, model, size/fitment where possible. |
| Meta title/description | localized product SEO fields, then product descriptions | Catalog merchandising/SEO | Add hand-authored templates for top brands/sizes; avoid supplier boilerplate. |
| Price | `best_price_eur` plus VAT display | Commerce/catalog | Offer schema only when valid positive price is visible and purchasable. No `0.00` fallback. |
| Availability | `in_stock`, `stock_quantity` | Catalog/inventory | Use InStock/OutOfStock. Keep temporarily out-of-stock pages indexable if useful; noindex or 410 permanently discontinued products. |
| GTIN/EAN | `ean` / derived identifiers | Catalog data | Use normalized 8-14 digit GTIN in Product schema where available. |
| Images | CMS/gallery/best image/fallback | Catalog merchandising | Main product image should be accurate, crawlable, high-resolution, and not a generic placeholder for priority products. |
| Reviews | `rating`, `review_count` | Customer/review system | Mark up only real first-party/allowed review data. Do not fabricate aggregateRating. |
| Return/shipping policy | Not verified in repo | Business/legal | Do not add MerchantReturnPolicy or shipping schema until policy text is confirmed. |

## Canonical And Redirect Policy

- Canonical product URL is always the slug route for the active locale.
- Old UUID, EAN, derived EAN, and supplier-code product URLs should continue to resolve.
- Current compatibility is client-side normalization after lookup. That is useful for users but not equivalent to a crawler-visible 301.
- Required next step: edge/server middleware that looks up the identifier, computes the canonical slug, and sends a 301 or 308 before serving the SPA.
- Do not canonicalize product pages to `/catalog`; each indexable product needs its own canonical product URL.
- Do not link internally to opaque identifiers.

## Sitemap Policy

Static sitemap status:

- Catalog hubs are included.
- Dynamic product URLs are not included yet.

Required product sitemap generator:

- Query only published, visible, product-ready product rows.
- Emit only canonical slug URLs for FI and EN if English pages are indexable.
- Exclude hidden, draft, unavailable-permanent, duplicate, and no-price products if they are not purchasable or useful.
- Use product `updated_at` or catalog publish timestamp for `lastmod`.
- Split at sitemap protocol limits and use a sitemap index if needed.
- Keep sitemap URL, internal card URL, and canonical tag identical.

## Schema Policy

Implemented:

- Product pages: LocalBusiness/organization, Product, Offer when valid, BreadcrumbList.
- Catalog pages: LocalBusiness, WebSite, CollectionPage, BreadcrumbList.

Do not add yet:

- Merchant return policy until return terms are verified.
- Shipping policy until delivery rules are confirmed per product/source.
- Review markup without real review source and policy compliance.
- ProductGroup/variant markup until variant grouping has distinct URLs and direct preselection.
- ItemList/Product schema on volatile catalog result pages.

## Internal-Link Policy

Implemented:

- Product cards use crawlable `<a href>` links to slug URLs.
- Product pages include breadcrumb links to Home and Catalog.
- Related product cards now support slug `href`s when related products are supplied.

Still needed:

- Supply actual related products to `ProductDetailPage`.
- Add curated category links from service/location pages to high-intent catalog landings, for example winter tires, summer tires, alloy rims, common Helsinki tire sizes.
- Replace pagination buttons with URL-backed anchors only if paginated catalog pages become indexable. Otherwise rely on product sitemap and curated category links.

## Product Content SEO

Current risk:

- Many product pages may have thin or supplier-sourced descriptions.
- Tire and rim pages need commercial context, not only specifications.

Priority content modules:

1. Tire pages: brand/model summary, size explanation, season/use case, EU label explanation, vehicle suitability warning, delivery/pickup CTA, related services such as installation and tire hotel.
2. Rim pages: fitment summary, PCD/ET/CB explanation, material/finish, vehicle compatibility disclaimer, installation CTA.
3. Category landings: winter tires Helsinki, summer tires Helsinki, alloy rims, tire sizes by common dimensions. Build these as stable indexable pages, not arbitrary filters.

## Remaining Product SEO Backlog

1. Build dynamic product sitemap generation.
2. Add edge/server 301 redirects for old identifiers.
3. Make catalog pagination URL-addressable or explicitly rely on product sitemap/feed for deep product discovery.
4. Add curated, indexable category landing pages for high-demand tire/rim queries.
5. Enrich product descriptions and meta templates by product type.
6. Add Merchant Center product feed and keep feed URL, canonical URL, price, GTIN, image, and availability consistent.
7. Validate Product and Breadcrumb JSON-LD with Rich Results Test on live URLs after deployment.
8. Decide lifecycle handling: temporarily out of stock stays indexable; discontinued returns 410/redirect/noindex based on replacement availability.

## Validation

- `npm run build`: passed. Existing Vite chunk-size and dynamic/static import warnings remain.
- `git diff --check`: passed.
- `xmllint --noout src/public/sitemap.xml`: passed.
- `npm run i18n:audit`: still fails with 34 existing non-product findings in layout/site pages; rerun confirmed no findings from `src/components/catalog` or `src/i18n/dictionaries/catalog.ts`.
