# R-7 - Business/Local/Content Owner Evidence Package

Recorded: 2026-06-22

Status: Complete as owner evidence package with business evidence blockers

Progress: `[██████████████████░░] 88%`

## Decision

R-7 converts the remaining owner-side growth-readiness gaps into a concrete evidence package.

The repo now has a centralized business fact source, improved service content fields, product decision-support copy, and safer schema policy. That is not enough to call Mitra local/content growth-ready. The business owner still needs to provide Google Business Profile, citation, service, product, review, media, customer-research, and legal/policy proof, or approve removing unsupported claims.

## Evidence State Matrix

| Evidence | State | R-7 finding |
| --- | --- | --- |
| Repo business facts | `EXECUTED_WITH_FINDINGS` | `src/config/businessProfile.ts` centralizes NAP, legal name, business ID, hours, service area, phone, email, and schema source. Owner confirmation is still required. |
| Prior Phase C reports | `SUPPLIED_REVIEW_REQUIRED` | C-1 through C-5 define the local/content/schema gaps but do not supply owner proof. |
| Google Business Profile | `UNAVAILABLE` | No owner/dashboard evidence for ownership, verification, category, hours, services, photos, reviews, duplicate status, or appointment URL. |
| Citations/directories | `UNAVAILABLE` | C-1 found public snippet conflicts; owner correction evidence is not supplied. |
| Service owner review | `UNAVAILABLE` | P1 pages include review caveats, but no named reviewer or owner approval is supplied. |
| Product/policy owner review | `UNAVAILABLE` | Shipping, pickup, installation, return, warranty, used-condition, fitment, and category-promotion policies need owner/legal approval. |
| Review/testimonial provenance | `UNAVAILABLE` | Product review schema is disabled, but visible review/rating/trust strings still need provenance or cleanup. |
| Original media proof | `UNAVAILABLE` | Workshop, team, process, tire hotel, product, and location media evidence is not owner-governed. |
| Customer/search research | `UNAVAILABLE` | Search Console, GBP interactions, customer calls, bookings, support, and site-search evidence are unavailable. |

## Current Source Truth

| Fact | Current source value | Source |
| --- | --- | --- |
| Public name | `Mitra Auto` | `src/config/businessProfile.ts` |
| Legal name | `Mitra Auto Oy` | `src/config/businessProfile.ts` |
| Business ID | `3408833-8` | `src/config/businessProfile.ts` |
| Domain | `https://www.mitra-auto.fi` | `src/config/businessProfile.ts` |
| Email | `contact@mitra-auto.fi` | `src/config/businessProfile.ts` |
| Phone | `+358 40 777 7163` | `src/config/businessProfile.ts` |
| Address | `Hankasuontie 5, 00390 Helsinki, Finland` | `src/config/businessProfile.ts` |
| Hours | Mon-Fri 09:00-18:00, Sat 10:00-17:00, Sun closed | `src/config/businessProfile.ts` |
| Service area | Helsinki | `src/config/businessProfile.ts` |

Owner confirmation is still required because C-1 found public citation conflicts around email and hours, and R-6 confirmed GBP/authenticated platform evidence remains unavailable.

## Owner Evidence Packets

| Packet | Owner | Required evidence | Acceptance |
| --- | --- | --- | --- |
| Business identity and NAP | Business owner | Owner-approved record for name, legal name, Y-tunnus, address, phone, email, website, booking URL, service area, regular hours, and special-hour process. | Website, schema, GBP, footer, contact page, and citations match approved facts or documented platform formatting differences. |
| GBP and citations | Local SEO/business owner | GBP ownership, verification, categories, address/pin, phone, website, hours, services/products, attributes, booking URL, messaging, photos, reviews, duplicate/suspension status, and citation correction proof. | C-1 blocked items are reconciled; no keyword-stuffed name, fake location, copied review, or stale contact data remains. |
| Service content review | Business/service owner plus subject-matter reviewer | Named reviewer, service availability, prices, duration ranges, inclusions/exclusions, safety limits, aftercare, warranty terms, and original process media. | Every P1 service page has approved proof, reviewer, update trigger, and no unsupported safety/warranty/roadworthiness/refrigerant/emissions claim. |
| Product and category policy | Product/ecommerce/legal owner | Shipping, pickup, installation, returns, warranty, used-condition, supplier-stock, delivery-time, fitment authority, and category-promotion decisions. | Product page, Product/Offer schema, Merchant feed, cart, checkout, and policy pages agree before richer product schema or indexable category pages are expanded. |
| Reviews and trust claims | Business/content/legal owner | Review source, permission, moderation, date, rating basis, customer count proof, certification/equipment proof, insurance proof, and review-request SOP. | Unsupported visible reviews, ratings, customer-count, insurance, and certification claims are either proven and compliant or removed/rewritten. |
| Original media | Business/content owner | Rights/consent-governed workshop, exterior, interior, team, equipment, tire hotel, product, and service-process images/videos. | Pages use real representative media where proof is claimed; stock-like or generic media is not treated as first-party evidence. |
| Customer/search research | SEO/content/business owner | Search Console queries, GBP calls/directions/clicks, booking/support/site-search questions, review themes, and owner-approved guide/category priorities. | New guides, category pages, and local/service expansions are based on distinct user need and business capacity, not keyword permutations. |

## Proof-Sensitive Source Findings

| Severity | Finding | Evidence | Owner |
| --- | --- | --- | --- |
| `CRITICAL` | Visible review/rating/customer-count claims need provenance or removal before growth-ready classification. | `src/i18n/dictionaries/site.ts` contains `reviews.rating` and `Over 500 satisfied customers`; `src/i18n/dictionaries/common.ts` contains testimonial-like review strings. | Business/content/legal owner |
| `CRITICAL` | Tire hotel insurance/liability claims conflict and need owner/legal proof before publication as trust evidence. | `src/i18n/dictionaries/site.ts` claims comprehensive included coverage, while `src/i18n/dictionaries/legal.ts` also contains optional/customer-risk style wording. | Business/legal owner |
| `WARNING` | P1 service pages correctly show owner-review caveats, but the owner review is not supplied. | `src/i18n/dictionaries/serviceSeo.ts` contains 14 `Business/service owner review required` markers. | Business/service owner |
| `WARNING` | Warranty, waiting-room, certified-technician, modern-equipment, and similar trust claims need proof or softer copy. | `src/i18n/dictionaries/site.ts`, `CarServicePage.tsx`, `FAQPage.tsx`, and `ServicesPage.tsx`. | Business/content owner |
| `WARNING` | Product review schema remains disabled correctly, but visible product reviews can still render when product data includes review fields. | C-4 report and `src/components/catalog/ProductDetailPage.tsx` review UI references. | Product/content owner |

## Implementation Files After Owner Evidence

Only change these when owner evidence confirms a fact or decides to remove unsupported copy:

| Evidence packet | Likely files |
| --- | --- |
| Business/NAP/GBP/citations | `src/config/businessProfile.ts`, `src/i18n/dictionaries/site.ts`, `src/components/site/pages/ContactPage.tsx`, `src/components/site/pages/HelsinkiPage.tsx`, `src/components/site/sections/ContactSection.tsx`, `src/components/site/layout/Footer.tsx`, `src/utils/localSeo.ts` |
| Service review/proof | `src/i18n/dictionaries/serviceSeo.ts`, `src/components/site/pages/ServiceDetailPage.tsx`, `src/components/site/pages/CarServicePage.tsx`, `src/components/site/pages/TireHotelPage.tsx`, `src/components/site/pages/FAQPage.tsx` |
| Product/category/policy | `src/i18n/dictionaries/catalog.ts`, `src/components/catalog/ProductDetailPage.tsx`, `src/components/catalog/CatalogPage.tsx`, `src/i18n/dictionaries/legal.ts`, `src/components/legal/TermsVersions.tsx` |
| Reviews/trust/media | `src/i18n/dictionaries/common.ts`, `src/i18n/dictionaries/site.ts`, relevant page components, and owned asset/media references |

## Blockers

| Blocker | Owner | Required resolution |
| --- | --- | --- |
| GBP and citation owner evidence remains unavailable. | Business/local SEO owner | Provide the C-1 GBP/citation packet and reconcile source, profile, and directory facts. |
| Service-owner and subject-matter review remains unavailable. | Business/service owner | Approve or revise P1 service content, provide reviewer identity/update trigger, and supply original proof or remove unsupported claims. |
| Product, policy, review, and trust-claim proof remains unavailable. | Product/legal/business owner | Approve commerce policies, review provenance, insurance/warranty/customer-count claims, and product/category evidence before richer schema or growth claims. |
| Search Console, GBP, Merchant Center, analytics, and customer-research evidence remains unavailable. | SEO/platform/business owners | Provide authenticated readback or sanitized exports so content priorities are evidence-led rather than assumed. |

## Acceptance Checklist

- GBP ownership, verification, categories, hours, services/products, photos, reviews, duplicate/suspension status, and appointment URL are captured in a sanitized evidence record.
- Public citations are corrected or documented with owner-approved formatting differences.
- P1 service pages have a named reviewer, approved service facts, original proof media, update trigger, and no unsupported safety/legal claims.
- Product/category policy fields are approved before shipping/returns/review schema or indexable category landings are expanded.
- Visible reviews, testimonials, ratings, customer counts, certifications, equipment, waiting-room, insurance, and warranty claims are either proven or removed.
- Customer/search evidence is available before guide/category/local expansion.
- No raw credentials, private customer data, license plates, unredacted review screenshots, or private GBP/analytics data are committed to the repo.

## Verification

```text
rg businessProfile/localSeo/serviceSeoEvidence/serviceCatalog source review: passed
rg owner-review/proof-sensitive trust and policy claims: passed with findings
rg C-1/C-2/C-3/C-4/C-5 report blockers: passed with findings
node serviceSeo owner-review marker count: passed, 14 markers found
```

## Closeout

R-7 closes as an evidence-package task. It does not close local/content growth readiness.

Next:

```text
Continue with R-8 - Post-remediation live crawl, browser smoke, and drift rerun.
```
