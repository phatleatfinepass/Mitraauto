# Content, Claims, Reviews, Media, And Local/Service Owner Approval - D-5

Date: 2026-06-23

Status: complete with blockers carried.

D-5 is a public-content safety pass. It removes internal governance copy from public service pages, softens unsupported proof claims, gates product reviews, and adds a repeatable content-claim guard.

## Source Changes

| Surface | D-5 action |
| --- | --- |
| Service detail pages | Removed public rendering of internal evidence, source notes, and owner-review/growth-ready text. |
| Service SEO source | Removed internal governance fields from the imported public service evidence object. |
| Service navigation | Added a promoted-route helper and service route registry so generated noindex service pages are not promoted from public navigation. |
| Legacy service pages | Replaced `[TBD]` price/duration placeholders with verified catalog prices where available or booking-confirmed language. |
| Reviews and ratings | Replaced generic review/rating strings with review-policy copy and gated product review display on `review_source = owner_verified`. |
| Trust and proof copy | Softened certification, equipment, warranty, waiting-room, customer-count, tire-hotel insurance/liability, and premium-delivery claims. |
| Guardrail | Added `npm run content:claims:check`. |

## Claim Register

| Claim class | Previous risk | D-5 state | Owner evidence still required |
| --- | --- | --- | --- |
| Internal governance text | `Content review`, `Business/service owner review required`, and `growth-ready` blocker copy appeared in public service content. | Removed from public rendering and public service evidence objects. | Keep governance only in board/reports. |
| Reviews/ratings | Generic 4.8/4.9 and sample testimonial strings could read as fake proof. | Replaced with review-policy copy; product reviews require approved source. | Approved review source, permission, display policy, platform terms. |
| Customer count | `500+` customer claim lacked owner proof. | Removed. | Approved source and calculation window. |
| Certifications | Certified technician claims lacked proof. | Replaced with service-team language. | Named certificates, issuer, dates, scope. |
| Equipment | Latest/modern diagnostic equipment claims lacked proof. | Softened to service-need-specific process language. | Equipment list, photos, scope, owner approval. |
| Warranty | FAQ implied warranty always remains valid. | Replaced with warranty-depends-on-terms copy. | Warranty/legal/service policy. |
| Waiting room | FAQ claimed Wi-Fi, coffee, entertainment. | Replaced with confirm-before-visit copy. | Facility proof and owner approval. |
| Tire hotel insurance/liability | Copy claimed comprehensive/full insurance and full replacement coverage. | Replaced with service-terms and written-confirmation language. | Storage terms, liability/insurance policy, legal approval. |
| Placeholder copy | `[TBD]` prices/durations were visible in legacy pages/FAQ. | Removed. | Final service-owner price/duration approval. |
| Generated service pages | Generated fallback pages were publicly promoted. | Not promoted from service hub/related links; remain noindex fallback. | Unique owner-approved content before promotion/sitemap inclusion. |

## Route Promotion Policy

```text
Promoted service detail URL = bespoke service page with owner-ready content.
Generated service detail URL = direct fallback, noindex follow, not promoted from public service navigation.
Service hub and related-service links must use getPromotedServiceDetailPathForServiceId.
Booking buttons may still open booking for catalog services.
```

## Remaining Blockers

- Owner proof for reviews, ratings, customer counts, facility amenities, certifications, equipment, warranty, tire-hotel insurance/liability, original media, and named service reviewers is unavailable.
- GBP/citation conflicts from D-2 remain unresolved.
- Product policy approvals from D-3 remain unresolved.
- Live production raw HTML/static asset blockers from Phase B/D-1 remain unresolved.
- Guide/category expansion remains backlog until source evidence, reviewer, purpose, internal links, update trigger, and safety classification exist.

## Verification

```text
npm run content:claims:check: passed.
npm run i18n:audit: passed.
node --check scripts/check_public_content_claims.mjs: passed.
Forbidden internal governance and [TBD] source scan: passed.
```

## Decision

```text
D-5 closes as public content source hardening plus claim governance.
Phase D closes as complete with blockers carried.
Do not classify Mitra Auto as growth-ready until owner proof, platform readback, live production verification, and Phase E evidence pass.
Next task is E-1 - Figma Make Preview Verification And Patch-State Ledger.
```
