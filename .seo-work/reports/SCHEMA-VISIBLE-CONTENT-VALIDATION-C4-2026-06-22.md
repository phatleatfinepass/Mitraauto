# C-4 Schema Visible-Content Validation

Status: Source-complete with owner/tool exceptions

Recorded: 2026-06-22

## Decision

C-4 validates the current Mitra Auto schema layer against visible page content and source-governed facts. The source implementation is safe to continue into C-5 browser verification after one policy hardening change: product `AggregateRating` markup is disabled until real review provenance, consent, eligibility, and visible review evidence are available.

This closeout does not claim Google rich-result eligibility in production. Rich Results Test, Schema Markup Validator, Search Console enhancement reports, and live rendered URL inspection remain C-5/E-3 work.

## Official Policy Sources Reviewed

- Google Search structured data gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Google LocalBusiness structured data: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Google Product structured data introduction: https://developers.google.com/search/docs/appearance/structured-data/product
- Google Merchant listing Product/Offer structured data: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Google Product snippet structured data: https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Google Review snippet structured data: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- Google Breadcrumb structured data: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Google structured data general guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies

## Schema Surface Matrix

| Surface | Current emitter | Classification | Visible-content result | Policy |
| --- | --- | --- | --- | --- |
| `AutoRepair` / `AutomotiveBusiness` / `LocalBusiness` | `src/config/businessProfile.ts`, used by local SEO, service, catalog, product pages | Google-supported | Matches centralized visible NAP source, address, phone, email, area, and opening-hour source text. GBP/category/special-hours proof is still owner/platform blocked. | Keep. Do not add reviews, geo, department, logo, sameAs, priceRange, or extra locations until evidence exists. |
| `WebSite` | `src/utils/localSeo.ts`, `src/components/catalog/CatalogPage.tsx` | Semantic/search identity | Uses visible site/business identity and canonical website URL. | Keep. No sitelinks search action until a real site-search URL contract exists. |
| `WebPage` / `ContactPage` / `CollectionPage` | `src/utils/localSeo.ts`, `src/components/catalog/CatalogPage.tsx` | Semantic-only or page identity | Title, description, URL, language, and business relation match page metadata and rendered content. | Keep as identity markup. Do not claim unsupported rich results. |
| `BreadcrumbList` | `src/utils/localSeo.ts`, `src/components/site/pages/ServiceDetailPage.tsx`, `src/components/catalog/ProductDetailPage.tsx`, `src/components/catalog/CatalogPage.tsx` | Google-supported | Breadcrumb labels and URLs match visible navigation path and canonical URLs. | Keep. Re-check after C-5 browser route validation. |
| `Service` | `src/components/site/pages/ServiceDetailPage.tsx` | Semantic-only for this site | Service title, description, provider, area, and URL match rendered service content. Generated service pages remain `noindex, follow`. | Keep. Do not add Offer, aggregateRating, FAQ, HowTo, or medical/safety claims unless visible and eligible. |
| `Product` | `src/components/catalog/ProductDetailPage.tsx` | Google-supported | Name, description, brand, image, SKU/GTIN/MPN, category, and additional properties are derived from rendered product detail data. | Keep. Product pages must remain canonical slug URLs. Category pages must not emit item-level Product schema. |
| `Offer` | `src/components/catalog/ProductDetailPage.tsx` | Google-supported / merchant listing eligible | Emitted only when `commerceSchema.hasSellablePrice` is true. Price, currency, availability, inventory level, and seller use the same commerce snapshot as cart/checkout. | Keep. Shipping and return policy markup stays absent until policy text and owner/legal approval are verified. |
| `AggregateRating` / `Review` | Previously `src/components/catalog/ProductDetailPage.tsx` when product rating fields existed | Google-supported but high-risk | Disabled in schema. Visible review UI may still show product fields, but markup is not emitted because review provenance and eligibility are not audited. | Do not re-enable until authentic, eligible, permissioned, visible, source-governed review data exists. |
| `FAQPage` | None | Not applicable for growth markup | FAQ content may be visible, but no FAQ rich-result schema is emitted. | Keep absent. |
| `MerchantReturnPolicy` / `shippingDetails` | None | Not applicable until policy proof | Terms copy exists, but product-level shipping/return schema needs owner/legal-approved policy fields. | Keep absent until product policy contract is approved. |

## Source Findings

- `src/config/businessProfile.ts` is the LocalBusiness fact source and currently avoids fake review/rating claims.
- `src/utils/localSeo.ts` emits LocalBusiness, WebSite, page identity, hreflang/canonical, and optional BreadcrumbList from visible route metadata.
- `src/components/site/pages/ServiceDetailPage.tsx` emits LocalBusiness, Service, and BreadcrumbList from the rendered service page contract. The graph does not mark up visible FAQ sections as FAQPage and does not invent Service offers.
- `src/components/catalog/CatalogPage.tsx` keeps catalog/category pages as collection surfaces and does not mark the category as a Product.
- `src/components/catalog/ProductDetailPage.tsx` emits Product/Offer/Breadcrumb markup from the same visible detail and commerce snapshot used by the page. C-4 removed `AggregateRating` emission because review governance is not proven.

## Implementation Change

`src/components/catalog/ProductDetailPage.tsx`

- Removed product `aggregateRating` schema output.
- Preserved Product, Offer, additionalProperty, inventory, seller, and breadcrumb markup.
- Preserved visible page content; only the schema claim was narrowed.

## Remaining Exceptions

- Business/Local SEO owner must still provide GBP ownership, category, special hours, photo, service/product, appointment URL, and citation evidence from C-1.
- Product/category owner must still approve shipping, pickup, installation, returns, warranty, used-condition, and review policies before richer Product/Offer schema is added.
- Real review source, consent, moderation, visible review details, and Google eligibility are not available; rating/review schema remains blocked.
- Rich Results Test, Schema Markup Validator, Search Console enhancement reports, and URL Inspection were not run in C-4 and remain C-5/E-3 verification.

## Verification

```text
rg -n "aggregateRating" src/components/catalog/ProductDetailPage.tsx: passed, no product AggregateRating schema remains
rg -n "'@type': 'FAQPage'|\"@type\": \"FAQPage\"|AggregateRating|MerchantReturnPolicy|shippingDetails" src/components src/utils src/config: passed, no unsafe public schema emitters found
npm run i18n:audit: passed
/Users/chandler/.codex/skills/distill-heavy-output/scripts/distill_cmd.sh "Return only whether npm run build passed or failed, plus the first error if it failed. Format: status line, then error line or 'no errors'." -- npm run build: passed
git diff --check: passed
```

## Figma Make Sync

```text
/Figma/src/components/catalog/ProductDetailPage.tsx
```

## Next

Continue with `C-5 - Local And Content Browser Verification`.
