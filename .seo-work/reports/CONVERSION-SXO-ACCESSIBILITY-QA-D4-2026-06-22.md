# D-4 - Conversion, SXO, And Accessibility QA

Status: Complete locally with warnings

Recorded: 2026-06-22

## Summary

D-4 mapped and smoke-tested the five required journeys: service booking, tire/rim product purchase, install booking, contact/local action, and Tire Hotel retention.

Local browser smoke supports continuing to D-5, but the site is not growth-ready yet. Checkout has accessibility/agent warnings, footer social links are placeholders, install booking could only be source-verified without a real paid-order token, and D-3 platform/deployment blockers remain open.

## Artifacts

| Artifact | Purpose |
| --- | --- |
| `.seo-work/conversion/conversion-journeys.json` | D-4 search-to-outcome journey contract. |
| `.growth-work/measurement/conversion-sxo-accessibility-d4.json` | Machine-readable QA summary, findings, and gate result. |
| `.growth-work/measurement/CONVERSION-SXO-ACCESSIBILITY-D4.md` | Reader-facing D-4 QA report. |
| `.seo-work/reports/CONVERSION-SXO-ACCESSIBILITY-QA-D4-2026-06-22.md` | Task closeout report. |
| `.seo-work/reports/conversion-audit.json` | Bundled static conversion auditor output. |
| `.seo-work/reports/CONVERSION-AUDIT.md` | Bundled static conversion auditor Markdown output. |
| `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md` | Board advanced to D-5. |

## Browser Evidence

| Route/path | Viewport | Result |
| --- | --- | --- |
| `/palvelut/autohuolto` -> `/en/services/car-service` | 1280x900 | Service page and booking modal rendered. |
| Product detail -> cart -> checkout | 1280x900 | Product, cart, checkout, terms gate, and validation path rendered. |
| `/yhteystiedot` | 390x844 | Contact/local action page rendered with phone, email, hours, map, FAQ, booking CTA. |
| `/palvelut/rengashotelli` | 390x844 | Tire Hotel page rendered with price, process, exclusions, related services, booking CTA. |
| Install booking | Source only | Paid-order install booking path verified in Edge Function source; no token available for browser smoke. |

## Findings

| Severity | Finding | Owner |
| --- | --- | --- |
| Critical | Static conversion auditor cannot see SPA client routes because build emits one `index.html`; Playwright route smoke is required for current route evidence. | Engineering/SEO |
| Warning | Checkout exposes duplicate responsive submit controls to strict browser-agent locators. | Frontend/QA |
| Warning | Checkout required-field validation appears as toast-level recovery instead of field-associated errors. | Frontend/Accessibility |
| Warning | Footer social links point to generic platform homepages instead of verified Mitra profiles. | Business/Frontend |

## Figma Make Sync

None.

D-4 changed docs and QA artifacts only. No Figma Make source files were changed.

## Gate Result

D-4 is complete locally with warnings.

Growth-ready remains blocked until D-5 and the earlier open blockers are resolved:

- D-3 production robots/sitemap/feed mismatch;
- missing authenticated Search Console, GBP, Merchant Center, analytics readback;
- static conversion auditor route coverage limitation for the Vite SPA;
- D-1/D-2 event/reconciliation implementation gaps;
- D-4 checkout accessibility warnings;
- owner-approved operational and finance definitions.

Next: `D-5 - Experiment And Monitoring QA Closeout`.
