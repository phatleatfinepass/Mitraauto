# E-1 - Figma Make Patch-State Ledger

Recorded: 2026-06-22

Status: Complete with blockers

## Decision

E-1 can close as a ledger task. Figma Make itself is still blocked until the listed `/Figma/src` files are manually patched and previewed in Figma Make.

GitHub source observation: `origin/codex/pwa-cloudflare` is at `168db5deeadf4cbe224250f181d5b2be0b292ed2`, matching local `HEAD` before the current uncommitted Phase B-D work. That means local source is ahead of both GitHub and Figma Make until committed/pushed and mirrored.

## Figma Make Sync Scope

Only these source files need Figma Make patch handling. Static public assets, Supabase files, scripts, generated reports, and build output are not Figma Make source files for this ledger.

### Must Patch In Figma Make

```text
/Figma/src/SiteApp.tsx
/Figma/src/main.tsx
/Figma/src/components/catalog/CatalogPage.tsx
/Figma/src/components/catalog/ProductDetailPage.tsx
/Figma/src/components/catalog/RimCard.tsx
/Figma/src/components/catalog/TireCard.tsx
/Figma/src/components/legal/PrivacyPolicyVersions.tsx
/Figma/src/components/legal/legalContent.ts
/Figma/src/components/site/analytics/AnalyticsConsentBanner.tsx
/Figma/src/components/site/booking/BookingModal.tsx
/Figma/src/components/site/cart/CartDrawer.tsx
/Figma/src/components/site/checkout/CheckoutPage.tsx
/Figma/src/components/site/layout/Footer.tsx
/Figma/src/components/site/layout/Navbar.tsx
/Figma/src/components/site/modals/AuthModal.tsx
/Figma/src/components/site/pages/AboutPage.tsx
/Figma/src/components/site/pages/ContactPage.tsx
/Figma/src/components/site/pages/HelsinkiPage.tsx
/Figma/src/components/site/pages/LegalPage.tsx
/Figma/src/components/site/pages/NotFoundPage.tsx
/Figma/src/components/site/pages/ServiceDetailPage.tsx
/Figma/src/components/site/pages/ServicesPage.tsx
/Figma/src/components/site/pages/TireHotelPage.tsx
/Figma/src/components/site/sections/ContactSection.tsx
/Figma/src/config/businessProfile.ts
/Figma/src/i18n/LanguageContext.tsx
/Figma/src/i18n/dictionaries/catalog.ts
/Figma/src/i18n/dictionaries/common.ts
/Figma/src/i18n/dictionaries/legal.ts
/Figma/src/i18n/dictionaries/serviceSeo.ts
/Figma/src/i18n/dictionaries/site.ts
/Figma/src/lib/clarity.ts
/Figma/src/utils/catalogSeo.ts
/Figma/src/utils/localSeo.ts
/Figma/src/utils/openingHours.ts
/Figma/src/utils/pricing.ts
/Figma/src/utils/productCommerce.ts
/Figma/src/utils/productsSearch.ts
```

### Presence Gate In Figma Make

These files did not require local content changes in this E-1 task, but the Figma Make copy must contain them because local imports depend on them:

```text
/Figma/src/components/shared/Toaster.tsx
/Figma/src/theme/ThemeContext.tsx
/Figma/src/utils/etrtoFitment.ts
/Figma/src/utils/etrtoFitmentClient.ts
```

## Specific Stale-Source Findings

| Finding | Local state | Figma Make action |
| --- | --- | --- |
| `CONTACT_INFO` runtime error | `CONTACT_INFO` is absent from local `src`; `ContactSection.tsx` uses `businessProfile`. | Patch `/Figma/src/components/site/sections/ContactSection.tsx` and add `/Figma/src/config/businessProfile.ts`. |
| `components/Toaster` stale import risk | Local `SiteApp.tsx` imports `./components/shared/Toaster`. | Ensure Figma Make uses `/Figma/src/components/shared/Toaster.tsx` and has no stale `/Figma/src/components/Toaster.tsx` import. |
| `LanguageContext` drift risk | Local `LanguageContext.tsx` and dictionaries are present and changed. | Patch the i18n files listed above together. |
| `ThemeContext` missing-file risk | Local `src/theme/ThemeContext.tsx` is present. | Keep `/Figma/src/theme/ThemeContext.tsx` in Figma Make. |
| `etrtoFitment` missing-file risk | Local `etrtoFitment.ts` and `etrtoFitmentClient.ts` are present. | Keep both `/Figma/src/utils` files in Figma Make. |

## Explicitly Not Figma Make Files

Do not list these as Figma Make patch files:

```text
src/public/_headers
src/public/_redirects
src/public/robots.txt
src/public/sitemap.xml
src/public/merchant-products.xml
src/public/sitemap-products.xml
src/public/sitemap-products-1.xml
src/public/sitemap-products-2.xml
supabase/functions/payments_create_paytrail/index.ts
supabase/migrations/20260621090000_catalog_slug_identifier_routes.sql
supabase/migrations/20260621204946_catalog_product_sitemap_source.sql
supabase/migrations/20260621205611_catalog_product_sitemap_pagination.sql
scripts/check_merchant_feed.mjs
scripts/check_product_commerce_contract.mjs
scripts/check_product_sitemaps.mjs
scripts/check_seo_redirects.mjs
scripts/generate_merchant_feed.mjs
scripts/generate_product_sitemaps.mjs
```

## Verification

```text
git ls-remote --heads origin codex/pwa-cloudflare main master: passed
rg -n "from ['\"].*Toaster|components/Toaster|CONTACT_INFO|etrtoFitmentClient|from ['\"].*/etrtoFitment['\"]" src/SiteApp.tsx src/main.tsx src/components src/i18n src/theme src/utils src/config src/lib package.json: passed with expected presence hits
/Users/chandler/.codex/skills/distill-heavy-output/scripts/distill_cmd.sh "Run the Mitra Auto production build. Return only: pass/fail, warnings/errors grouped by file, and whether dist was generated. Do not include routine Vite transform progress." -- npm run build: passed with Vite large-chunk warning
```

Generated `dist` was removed after verification.

## Remaining Blocker

Figma Make preview was not directly executed in this environment. The owner must patch the listed `/Figma/src` files, remove stale Figma copies if present, and verify the preview no longer throws `ReferenceError: CONTACT_INFO is not defined`.
