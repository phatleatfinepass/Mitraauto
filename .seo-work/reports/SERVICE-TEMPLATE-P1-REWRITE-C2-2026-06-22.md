# Service Template Fields And P1 Rewrite - C-2

Date: 2026-06-22

Scope: repository implementation for P1 service-page content depth. Live SERP, Search Console, GBP, customer-call evidence, original photos, and business-owner review were unavailable.

## Gate Decision

C-2 is source-complete with owner/media exceptions.

The P1 service pages now have visible fields for:

- duration or duration variability
- exclusions / what is quoted separately
- eligibility / service fit
- safety limits
- aftercare / next steps
- evidence/source basis
- reviewer requirement
- last review date
- source/update notes

Service SEO is not final growth-ready until the business owner approves the safety-sensitive copy and supplies original operational proof media.

## Implementation Summary

| Area | Result |
| --- | --- |
| Service copy model | Added `ServiceSeoEvidence` and `serviceSeoEvidenceByPageId`. |
| P1 pages covered | car service, tire change, tire hotel, diagnostics, AC service, DPF service, tire repair. |
| Languages covered | Finnish and English. |
| Template rendering | P1 service pages render exclusions, eligibility, safety limits, aftercare, evidence/source notes, review status, and duration values. |
| Generated pages | Unchanged; they remain noindex through existing generated-page route behavior. |
| Claims policy | Exact unverified durations, warranties, standards, road-law claims, and photo proof were not invented. |

## P1 Rewrite Coverage

| Service page | Added source-safe improvements | Remaining owner evidence |
| --- | --- | --- |
| Car service | Scope, exclusions, service fit, red-warning safety limit, approval-before-extra-work, aftercare summary. | Named service owner, workshop/process photos, confirmed warranty terms. |
| Tire change | Basic-change exclusions, vehicle-class fit, unsafe tire caveats, pressure/condition follow-up. | Exact retightening instruction, tire condition policy, original process media. |
| Tire hotel | Storage fit, excluded add-ons, worn/damaged tire caveats, retrieval workflow. | Storage terms, liability policy, storage-area media, owner-approved customer workflow. |
| Diagnostics | Error-code reading vs troubleshooting distinction, drive-risk caveats, follow-up estimate policy. | Diagnostic equipment/process media, example report, named reviewer. |
| AC service | Refrigerant/service fit, leak/diagnostics caveat, EV/hybrid distinction, environmental caution. | Confirmed leak-test process, refrigerant handling proof, source-reviewed environmental language. |
| DPF service | Diagnosis-first model, contraindications, no DPF delete/bypass framing, aftercare for underlying faults. | Mechanic review, emissions/roadworthiness source review, DPF process media. |
| Tire repair | Repairable/not-repairable caveats, sidewall/driven-flat limits, replacement fallback. | Exact repair standard, internal/external repair policy, process media. |

## Source Governance

Current source-backed inputs:

- `src/utils/serviceCatalog.ts` for service IDs and prices.
- Existing service-page copy in `src/i18n/dictionaries/serviceSeo.ts`.
- Local business facts from `src/config/businessProfile.ts`.
- C-1 fact gate exceptions for GBP/citation/business-owner data.

Blocked or exception inputs:

- Owner-reviewed exact duration ranges for most services.
- Original workshop/service/photos/videos.
- Named technician/service owner.
- Warranty wording and storage liability terms.
- Legal/source-reviewed roadworthiness, tire-standard, refrigerant, and emissions claims.

## Figma Make Sync

Files that must be synced to Figma Make:

- `/Figma/src/i18n/dictionaries/serviceSeo.ts`
- `/Figma/src/components/site/pages/ServiceDetailPage.tsx`

Do not sync `.seo-work` reports, board files, build outputs, migrations, scripts, or provider artifacts to Figma Make.

## Verification

| Check | Result |
| --- | --- |
| `npm run i18n:audit` | Passed |
| `npm run build` | Passed |
| `rg serviceSeoEvidenceByPageId/durationValue/notIncludedTitle/reviewedBy` | Passed |

## Next Action

Continue with C-3 - Product And Category Content Enrichment.
