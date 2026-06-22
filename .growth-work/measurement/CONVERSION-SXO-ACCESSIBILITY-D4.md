# D-4 Conversion, SXO, And Accessibility QA

Status: Local browser/source QA complete with exceptions

Recorded: 2026-06-22

## Purpose

D-4 verifies whether search and local/product visitors can move from page promise to useful outcome without misleading actions, inaccessible controls, hidden terms, or vanity measurement.

This is not a live conversion-rate, revenue, ranking, or accessibility conformance claim.

## Browser Smoke Coverage

| Journey | Evidence | Result |
| --- | --- | --- |
| Service booking | `/palvelut/autohuolto`, `/en/services/car-service`, booking modal | Pass with measurement/owner exceptions. |
| Product purchase | Product detail, cart, checkout | Pass with accessibility warnings. |
| Install booking | Order email/install booking source path | Source pass; runtime token unavailable. |
| Contact/local action | `/yhteystiedot` mobile | Pass with trust warning. |
| Tire Hotel retention | `/palvelut/rengashotelli` mobile | Pass with owner-review exception. |

## Findings

### Critical - Static conversion auditor cannot see SPA routes

Evidence: `python3 .../conversion_audit.py --site-dir build --journeys .seo-work/conversion/conversion-journeys.json --output-dir .seo-work/reports` produced 12 `entry-page-missing` findings because the Vite build emits one static `index.html` and does not prerender `/palvelut/autohuolto`, `/catalog`, `/yhteystiedot`, or other journey routes as separate HTML files.

Impact: the bundled static auditor cannot prove route-level conversion readiness from the build directory. Playwright route smoke was used for D-4 journey evidence. This is also a reminder that production direct-route behavior remains an E-3 launch evidence item.

Fix: either add a prerender/static route artifact for public SEO journeys or keep a browser-based route audit as the required evidence path for SPA journeys.

### Warning - Duplicate checkout submit controls

Evidence: strict Playwright locator for `Vahvista tilaus` resolved to two submit buttons, one mobile and one desktop.

Impact: browser agents and assistive tech can encounter ambiguous high-impact actions if hidden responsive controls are exposed. Payment remained gated, but the action model should be cleaner.

Fix: use one submit control where possible, or ensure hidden responsive duplicates are excluded from the accessibility tree and strict automation selectors.

### Warning - Checkout validation recovery is toast-only

Evidence: submitting checkout after accepting terms with empty required fields showed `Täytä etu- ja sukunimi` as a toast.

Impact: users relying on screen readers or keyboard navigation may not get field-level recovery guidance.

Fix: add field-associated errors with `aria-invalid`, `aria-describedby`, and focus movement or an accessible error summary.

### Warning - Footer social links are placeholders

Evidence: footer social links point to generic platform homepages such as `https://facebook.com` and `https://instagram.com`.

Impact: this weakens local trust and can send users away from Mitra-owned profiles.

Fix: replace with verified Mitra profiles or remove the links until owner-approved profile URLs exist.

## Journey Notes

Service booking:

- Page promise, H1, decision support, price/process sections, related services, and CTA are aligned.
- Booking dialog has role, heading, progress, labelled plate field, date picker, cancel, close, and disabled Continue until required input exists.
- Real booking submission was not performed.

Product purchase:

- Product page exposes exact variant, price, VAT, stock, delivery, quantity, EAN/specs, fitment caveat, and Add to cart.
- Cart exposes item identity, quantity controls, remove, subtotal, VAT note, checkout, and recovery actions.
- Checkout exposes contact fields, delivery choice, terms/privacy link, order summary, VAT, total, and payment gating.

Install booking:

- Source path supports paid-order install URL and single-use token booking.
- No paid-order install token was available for browser smoke.

Contact/local:

- Mobile contact page exposes NAP, phone, email, hours, map, FAQ, and booking CTA.
- GBP/citation readback remains a D-3 platform exception.

Tire Hotel:

- Page exposes storage price, process, inclusions, exclusions, suitability, safety limits, related services, and booking CTA.
- Owner review remains visible and unresolved.

## D-4 Gate Result

D-4 is complete locally with warnings. It supports continuing to D-5, but growth-ready classification remains blocked by:

- static auditor route coverage limitation for the Vite SPA;
- D-3 authenticated platform readback and production static asset mismatch;
- D-1/D-2 measurement implementation gaps;
- D-4 checkout accessibility warnings;
- missing owner/finance/lifecycle definitions;
- D-5 experiment and monitoring closeout.

Next task: `D-5 - Experiment And Monitoring QA Closeout`.
