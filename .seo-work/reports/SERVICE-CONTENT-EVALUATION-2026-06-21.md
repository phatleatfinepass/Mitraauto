# Service Content Evaluation - Mitra Auto

Date: 2026-06-21

Scope: repository-only evaluation of service-page writing and SEO content quality. Sources inspected: `src/i18n/dictionaries/serviceSeo.ts`, `src/components/site/pages/ServiceDetailPage.tsx`, `src/components/site/pages/ServicesPage.tsx`, `src/utils/serviceCatalog.ts`, and the Growth SEO content/service-page contracts. Live SERP, Search Console, competitor, customer-call, review, and Google Business Profile data were not used.

## Summary

The site has the right starting structure for service SEO: service hub, individual service pages, prices, process, FAQ-style user answers, CTAs, related services, and localized Finnish/English copy. The writing is clear and practical, but it is still too generic to compete strongly in local automotive search.

The biggest ranking opportunity is not longer copy. It is adding verified first-party evidence:

- exact workshop/location facts
- real process photos or short videos
- price conditions and what is excluded
- typical duration ranges
- safety limitations
- warranty/aftercare
- vehicle eligibility
- reviewer/service owner
- stronger internal links to related products, services, and guides

The biggest risk is the generated service URL system. There are 46 service catalog entries. Ten have bespoke SEO pages. The remaining 36 can resolve as generated detail pages with shared category copy. These generated pages are thin and near-duplicate by design; they should be noindexed, blocked from internal SEO discovery, or consolidated until they have distinct copy and evidence.

## Current Content Architecture

### Bespoke SEO Service Pages

These 10 pages are intentionally written and should be the priority pages:

| Page | Canonical FI/EN patterns | Current writing status |
|---|---|---|
| Autohuolto / Car service | `/palvelut/autohuolto`, `/en/services/car-service` | Useful foundation, too broad |
| Renkaanvaihto / Tire change | `/palvelut/renkaanvaihto`, `/en/services/tire-change` | Good local transactional page, needs stronger safety/evidence |
| Rengashotelli / Tire hotel | `/palvelut/rengashotelli`, `/en/services/tire-hotel` | Useful, but terms/process proof are thin |
| Vikadiagnostiikka / Diagnostics | `/palvelut/vikadiagnostiikka`, `/en/services/diagnostics` | Good intent fit, needs clearer code-reading vs diagnosis distinction |
| Autopesu / Car wash | `/palvelut/autopesu`, `/en/services/car-wash` | Thin/commodity |
| Ilmastointihuolto / AC service | `/palvelut/ilmastointihuolto`, `/en/services/ac-service` | Useful refrigerant split, needs leak/legal/scope clarity |
| DPF service | `/palvelut/dpf-huolto`, `/en/services/dpf-service` | Strongest page, needs compliance and contraindication detail |
| Öljynvaihto / Oil change | `/palvelut/oljynvaihto`, `/en/services/oil-change` | Clear but generic |
| Tasapainotus / Wheel balancing | `/palvelut/tasapainotus`, `/en/services/wheel-balancing` | Thin and should explain diagnosis/alternatives |
| Rengaspaikkaus / Tire repair | `/palvelut/rengaspaikkaus`, `/en/services/tire-repair` | Good safety framing, needs more repair eligibility detail |

### Generated Service Pages

Generated route pattern:

- `/palvelut/{serviceId}`
- `/en/services/{serviceId}`

Examples:

- `/palvelut/basic-hand-wash-suv`
- `/palvelut/tire-change-suv`
- `/palvelut/troubleshooting`
- `/palvelut/ac-service-electric`
- `/palvelut/dpf-forced-regeneration`

Finding: these pages reuse category-level copy and only swap service name, price, and category. They do not yet satisfy the individual service page contract for indexable SEO pages.

Recommendation: treat generated pages as `noindex` or route them to their parent bespoke page with anchors until each has unique content and verified evidence.

## Global Writing Findings

### What Works

- Copy is concise, readable, and action-oriented.
- Every bespoke service page has title, meta title, meta description, H1, summary, included items, process, pricing, FAQ, CTA, and related services.
- DPF, tire repair, diagnostics, and tire change already include some safety-sensitive caveats.
- Finnish and English pages are localized enough to understand the service; they are not purely machine-translated shells.
- The service hub has a useful price list and direct booking actions.

### What Holds Rankings Back

- Pages lack original proof. Most copy could fit any garage in Helsinki.
- The page template displays `durationLabel` but does not show actual duration values.
- There is no visible "not included" section, which matters for repair/service trust.
- There is no visible warranty/aftercare section on service detail pages.
- There is no named reviewer or service owner for safety-sensitive automotive content.
- Images are generic service assets, not clearly original proof of Mitra Auto process/facility.
- Internal links mostly point to related service rows, not supporting guides, product categories, booking terms, or trust pages.
- Generated pages use English service IDs in Finnish URLs, which is weak for Finnish SEO and readability.
- FAQ content is useful for users, but should not be treated as a Google FAQ rich-result strategy.

## Page-by-Page Evaluation

Scoring: 1 = weak, 5 = strong. Scores are prioritization signals, not ranking predictions.

| Service page | Intent fit | Completeness | Unique evidence | Safety/trust | Conversion | Priority |
|---|---:|---:|---:|---:|---:|---|
| DPF service | 5 | 4 | 2 | 4 | 4 | P1 |
| Car service | 4 | 3 | 1 | 3 | 4 | P1 |
| Tire change | 5 | 3 | 1 | 3 | 5 | P1 |
| Tire hotel | 4 | 3 | 1 | 2 | 4 | P1 |
| Diagnostics | 5 | 3 | 1 | 4 | 4 | P1 |
| AC service | 4 | 3 | 1 | 3 | 4 | P1 |
| Tire repair | 5 | 3 | 1 | 4 | 4 | P1 |
| Oil change | 4 | 2 | 1 | 3 | 4 | P2 |
| Wheel balancing | 4 | 2 | 1 | 3 | 4 | P2 |
| Car wash | 3 | 2 | 1 | 2 | 4 | P2 |
| Generated service pages | 2 | 1 | 1 | 2 | 3 | P0 control/noindex |

## Service-Specific Findings And Revision Plan

### Autohuolto / Car Service

Current strengths:

- Good broad intent coverage for scheduled maintenance, seasonal checks, oil change, fault finding, and brakes.
- Good expectation-setting around approving extra work.

Gaps:

- Too broad to be the only "autohuolto" authority page.
- No supported vehicle/make scope.
- No clear what-is-not-included section.
- No warranty/aftercare statement.
- No proof of technician process, tools, parts, or facility.

Revision plan:

- Add "When to book car service" with symptoms and service interval examples.
- Add "What is included / what is quoted separately".
- Add duration ranges for oil change, seasonal maintenance, and scheduled maintenance.
- Add aftercare: service summary, fluid/part notes, warning-light follow-up, warranty terms if verified.
- Add original workshop photo and a short "how we approve extra work" trust block.

### Renkaanvaihto / Tire Change

Current strengths:

- Strong transactional intent.
- Clear prices for passenger car, SUV, and van.
- Good relation to tire hotel and wheel balancing.

Gaps:

- Needs stronger safety rules: tread depth, age/date code, damage, torque re-check guidance.
- Does not explain what is included versus balancing/tire work.
- No season/legal context for Finland.

Revision plan:

- Add "Before we install" checklist: tread, visible damage, pressure, fitment, direction/rotation if applicable.
- Add "Renkaanvaihto vs rengastyö vs tasapainotus" comparison.
- Add Finnish season guidance with source review.
- Add aftercare: retightening/torque guidance only if business confirms exact recommendation.

### Rengashotelli / Tire Hotel

Current strengths:

- Clear service purpose and bundled relationship with seasonal tire change.
- Price is visible.

Gaps:

- Storage conditions are not specific.
- No customer workflow for labeling, retrieval, reminders, damage/condition records, or liability.
- No terms link despite tire storage being contract-sensitive.

Revision plan:

- Add "How we identify and store your tire set".
- Add "Before storage we record..." with verified fields.
- Add storage period, retrieval timing, pickup process, and terms.
- Add what happens if tires are worn/damaged before next season.
- Add original storage-area photo if available.

### Vikadiagnostiikka / Diagnostics

Current strengths:

- Correctly says clearing codes usually does not fix the problem.
- Good warning against driving with severe symptoms or red warning light.

Gaps:

- Does not clearly distinguish error-code reading from deeper troubleshooting.
- No examples of diagnostic outputs.
- No vehicle-system scope or equipment/process proof.

Revision plan:

- Add comparison table: vikakoodien luku vs vianetsintä.
- Add common symptoms: check engine, ABS, battery/charging, emissions, limp mode.
- Add limitation: codes guide diagnosis; parts are not replaced without confirmation.
- Add sample customer handoff: findings, estimate, next steps.

### Autopesu / Car Wash

Current strengths:

- Clear basic service options and visible prices.

Gaps:

- Most commodity page. It does not explain why Mitra Auto's hand wash is different.
- No product/material/process details.
- No exclusions or condition caveats.
- No before/after media.

Revision plan:

- Add service comparison: basic hand wash, premium exterior wash, interior cleaning, hard wax.
- Add what is not included: heavy stains, paint correction, odor removal, deep detailing, engine wash risks unless verified.
- Add original before/after images and specific cleaning process.
- Add suitability guidance for winter salt, wheels, interior dirt, and wax protection.

### Ilmastointihuolto / AC Service

Current strengths:

- Good separation of R134a, R1234yf, electric vehicle, and extra refrigerant pricing.
- Good symptom coverage for weak cooling.

Gaps:

- Needs clearer environmental/legal handling for refrigerant and leaks.
- Does not say whether leak check is included.
- Does not explain extra refrigerant pricing in the service page copy deeply enough.

Revision plan:

- Add "What is included in AC service" and "When diagnostics is required".
- Add refrigerant table: R134a, R1234yf, EV/hybrid surcharge, included grams, extra price.
- Add leak/pressure test caveat if verified.
- Add safety/environment note: do not knowingly refill a leaking system without diagnosis.

### DPF Service

Current strengths:

- Best page in the current set.
- Good symptoms, prices, process, limitations, and vehicle-specific quote logic.
- Uses diagnosis-first framing.

Gaps:

- Needs stronger compliance language: no DPF delete/removal-for-road-use claim unless lawfully framed.
- Needs contraindications: when forced regeneration is unsafe or not recommended.
- Needs clearer difference between forced regeneration, off-car cleaning, and removal/install labor.
- Needs evidence or photos.

Revision plan:

- Add "Which DPF solution fits which situation" table.
- Add "When we do not force regeneration".
- Add "Removal/install is separate because..." with examples.
- Add legal/safety note about emissions systems and roadworthiness.
- Add original DPF/process image or technician-reviewed explanation.

### Öljynvaihto / Oil Change

Current strengths:

- Clear purpose and pricing.
- Good mention that oil/filter depend on vehicle.

Gaps:

- Very generic.
- Does not mention oil specification, filter, service reset, disposal, underbody/leak checks, or manufacturer schedule.
- No duration or aftercare.

Revision plan:

- Add vehicle-specific oil selection explanation.
- Add "What we check during oil change" with fluids/leaks/filter.
- Add "Price depends on oil volume, oil spec, and filter".
- Add warning signs: oil warning light, burning smell, leaks, overdue service.
- Add aftercare: service record/update if offered.

### Renkaiden Tasapainotus / Wheel Balancing

Current strengths:

- Good symptom framing around vibration and steering wheel shake.
- Good relation to tire work.

Gaps:

- Thin page.
- Does not distinguish balancing from alignment, bent rim, tire damage, or suspension issues.
- No equipment/process proof.

Revision plan:

- Add "Balancing vs wheel alignment" section.
- Add "When balancing may not solve vibration".
- Add process detail: remove wheel, inspect rim/tire, machine balance, weights, verify.
- Add related links to tire change, tire repair, and tire work.

### Rengaspaikkaus / Tire Repair

Current strengths:

- Good safety framing: not all damage can be repaired; do not drive flat.
- Clear prices for external/internal repair.

Gaps:

- Needs exact repair eligibility criteria if business can verify them.
- Does not explain internal vs external repair decision.
- No TPMS/valve/leak check details.

Revision plan:

- Add "Repairable vs not repairable" table.
- Add puncture location, sidewall, tread depth, run-flat damage, and driven-flat caveats.
- Add internal vs external repair comparison.
- Add what happens if repair is unsafe: replacement/tire change options.

## Generated Service Page Policy

Current generated pages should not be treated as full SEO landing pages because they reuse category-level copy. Recommended policy:

1. Keep generated pages available for users who click service rows.
2. Add `noindex, follow` to generated pages until each has unique value.
3. Exclude generated pages from XML sitemap.
4. Link prominent service-table rows to bespoke parent pages when they are only variants.
5. Create new bespoke pages only for high-value services with distinct intent and evidence.

Priority generated pages worth promoting into bespoke pages:

- `troubleshooting` -> if separate from diagnostics
- `ac-service-electric` -> EV/hybrid AC page if enough unique process/safety detail exists
- `dpf-forced-regeneration` -> only if distinct from DPF main page
- `brake-fluid` -> safety-sensitive maintenance page
- `automatic-gearbox-flush` -> high-value service with distinct decision criteria
- `hard-wax-car` / `interior-cleaning-car` -> only if car-care has original media/process proof

Generated pages that should consolidate into parent pages:

- vehicle-class variants such as `tire-change-suv`, `tire-change-van`
- small add-ons such as `ac-extra-refrigerant`, hybrid surcharge, wheel wash
- size variants such as tire work 17/18/20 inch unless each has distinct content and demand

## Template Improvements Needed

Update `ServiceDetailPage.tsx` and service copy model to support these fields:

- `durationValue`: visible time estimate, not only the label "Typical duration"
- `notIncluded`: what is quoted separately
- `eligibility`: vehicle/service fit
- `safetyLimitations`: when not to drive or when service cannot proceed
- `aftercare`: warranty, retightening, documentation, next service reminder, or care instructions
- `evidence`: real photo/video/process proof
- `reviewedBy`: service owner or qualified reviewer
- `lastReviewed`: meaningful service content review date
- `sourceNotes`: official or internal sources for safety/legal claims

## Internal-Link Improvements

Add contextual links from service pages to:

- service hub
- related services
- contact/location page
- booking page or booking modal
- terms/cancellation policy where relevant
- catalog tire/rim pages from tire services
- tire hotel from tire change and tire storage content
- future guides/articles once created

Recommended future guides:

- "Milloin renkaat pitää vaihtaa Suomessa?"
- "Miksi auto täristää ajossa?"
- "Vikavalo palaa: saako autolla ajaa?"
- "DPF-valo palaa: regenerointi vai pesu?"
- "Ilmastointi ei kylmennä: yleisimmät syyt"
- "Öljynvaihto: mitä öljylaatu tarkoittaa?"

## Acceptance Checklist For A Strong Service Page

A service page should not be considered SEO-ready until:

- it has one clear primary service intent
- it has a canonical localized URL
- it explains symptoms/use cases
- it explains what is included and excluded
- it has visible price or price method
- it has visible duration or duration variability
- it has safety limitations where relevant
- it has warranty/aftercare or next-step expectations
- it has original evidence or verified operational detail
- it links to related services and next action
- it has breadcrumb markup
- any `Service` schema matches visible content and is treated as semantic-only
- a real owner/reviewer has approved safety-sensitive content

## Recommended Next Implementation Order

1. Add `noindex` support for generated service detail pages.
2. Add the missing service-page content fields to the copy model and template.
3. Rewrite P1 pages first: car service, tire change, tire hotel, diagnostics, AC service, DPF service, tire repair.
4. Add original media/proof blocks for workshop, tire hotel, diagnostics, DPF, AC, tire repair.
5. Add service breadcrumbs and improve structured data to align with visible content.
6. Create guide content only after service pages contain the core commercial answers.
