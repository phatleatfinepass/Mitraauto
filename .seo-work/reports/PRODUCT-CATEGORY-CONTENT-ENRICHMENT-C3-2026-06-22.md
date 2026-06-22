# Product And Category Content Enrichment - C-3

Date: 2026-06-22

Scope: product detail content modules, catalog category guidance, trust-copy cleanup, and category landing policy. Live Search Console, Merchant Center diagnostics, competitor/SERP evidence, customer-call evidence, and product-owner review were unavailable.

## Gate Decision

C-3 is source-complete with category-research and owner-policy exceptions.

Product pages now give users more decision support without inventing policies or fitment guarantees. Category landing pages are not promoted yet because demand, inventory, and owner evidence have not been supplied.

## Implementation Summary

| Area | Result |
| --- | --- |
| Tire product module | Added a visible buying-guide module covering fitment verification, season/use case, installation support, and lifecycle/data confidence. |
| Rim product module | Added a visible buying-guide module covering PCD/ET/CB fitment, material/finish considerations, installation support, and lifecycle/data confidence. |
| Catalog category guidance | Added mode-specific tire/rim guidance cards on the catalog hub without creating indexable filter URLs. |
| Trust copy | Replaced unverified 30-day return wording with source-safe order-term confirmation wording. |
| Category landing policy | Recorded that arbitrary filter/search states remain non-indexable until validated. |

## Product Content Modules Added

| Product type | Module | Purpose |
| --- | --- | --- |
| Tire | Fitment verification | Reminds users to verify approved size, load index, speed rating, and vehicle data. |
| Tire | Use case and limits | Explains season, EU label, studs, XL/RunFlat, comfort, and missing-data support path. |
| Tire | Installation/pickup/support | Connects product choice to tire change, mounting, balancing, and support. |
| Tire | Lifecycle/data confidence | Explains that price, stock, and delivery can change and are revalidated before payment. |
| Rim | Fitment verification | Explains size, PCD, ET, center bore, load, and brake-clearance dependency. |
| Rim | Use case and limits | Frames material, finish, style, and vehicle requirement checks. |
| Rim | Installation/pickup/support | Connects rim purchase to installation and fitment support. |
| Rim | Lifecycle/data confidence | Explains catalog/supplier-data update risk and checkout revalidation. |

## Category Policy

Current indexable category URLs:

- `/catalog`
- `/en/catalog`

Current policy:

- Do not index arbitrary filter, sort, search, plate, fitment, or pagination states.
- Do not create static landing URLs for every size, brand, season, or vehicle combination.
- Do not add Product markup to catalog/category result pages as if they were a single product.
- Product sitemap/feed remain the discovery path for individual product URLs.

Future category landing candidates can be promoted only after evidence review:

| Candidate | Required evidence before indexable URL |
| --- | --- |
| Winter tires Helsinki | Search demand, current inventory, unique local guidance, internal links, owner review. |
| Summer tires Helsinki | Search demand, current inventory, unique local guidance, internal links, owner review. |
| Alloy rims Helsinki | Search demand, rim inventory depth, fitment guidance, owner review. |
| Common tire-size pages | Search demand, sufficient matching inventory, stable URL design, no empty/duplicate result risk. |
| Used tires/rims | Real used inventory fields: condition, quantity, age/date-code policy, tread/defects/photos, availability, terms. |

## Source Governance

Current source-backed inputs:

- Product technical fields in `ProductDetailPage.tsx`.
- Product pricing/stock revalidation contract from Phase B.
- Catalog route/canonical policy from Phase B.
- Local seller identity from `src/config/businessProfile.ts`.
- Existing catalog UI and translation dictionary.

Unavailable inputs:

- Merchant Center diagnostics.
- Search Console query and landing-page evidence.
- Owner-approved shipping/return/install terms.
- Product owner review of category candidates.
- Original used-item or workshop media.

## Figma Make Sync

Files that must be synced to Figma Make:

- `/Figma/src/i18n/dictionaries/catalog.ts`
- `/Figma/src/components/catalog/ProductDetailPage.tsx`
- `/Figma/src/components/catalog/CatalogPage.tsx`

Do not sync `.seo-work` reports, board files, build outputs, migrations, scripts, or provider artifacts to Figma Make.

## Verification

| Check | Result |
| --- | --- |
| `npm run i18n:audit` | Passed |
| `npm run build` | Passed |
| `rg categoryGuide/buyingGuide/fitmentCheck/returnsDesc/30-day/30 päivän` | Passed; no 30-day return claim remains in checked catalog files |
| `git diff --check` | Passed |

## Next Action

Continue with C-4 - Schema Visible-Content Validation.
