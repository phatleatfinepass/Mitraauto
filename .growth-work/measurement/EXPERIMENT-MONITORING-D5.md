# D-5 - Experiment And Monitoring QA Closeout

Recorded: 2026-06-22

Status: Complete locally with platform and owner exceptions

## Scope

D-5 closes the local Phase D measurement system by defining:

- experiment registry shape and initial draft experiment set;
- search-facing test guardrails;
- monitoring thresholds for SEO, GBP, Merchant Center, analytics, booking/order events, performance, and accessibility;
- incident runbook and release annotation requirements;
- Phase D gate result.

No production experiments, tracking tags, analytics destinations, provider changes, or live platform writes were implemented.

## Evidence Used

- `.growth-work/measurement/kpi-tree.json`
- `.growth-work/measurement/event-dictionary.json`
- `.growth-work/measurement/booking-order-reconciliation.json`
- `.growth-work/measurement/platform-readback-d3.json`
- `.growth-work/measurement/conversion-sxo-accessibility-d4.json`
- `.seo-work/conversion/conversion-journeys.json`
- `.seo-work/reports/conversion-audit.json`
- `.seo-work/reports/CONVERSION-SXO-ACCESSIBILITY-QA-D4-2026-06-22.md`

## Experiment Registry

Created:

```text
.growth-work/experiments/experiment-registry.json
```

Initial draft experiments:

| ID | Status | Purpose | Launch posture |
| --- | --- | --- | --- |
| `service_booking_decision_support` | Draft | Improve service-page decision support and booking quality. | Blocked until instrumentation, status definitions, Search Console/analytics readback, and owner approvals exist. |
| `product_fitment_purchase_clarity` | Draft | Improve product fitment, availability, delivery, and purchase clarity. | Blocked until production feed/sitemap, product data reconciliation, payment/order readback, and checkout accessibility warnings are resolved. |
| `checkout_recovery_accessibility` | Draft | Fix checkout duplicate submit target and field-associated error recovery. | Treat as remediation, not an A/B test. Ship only after accessibility/payment safety QA passes. |
| `local_contact_action_quality` | Draft | Improve verified local contact actions and trust cleanup. | Blocked until GBP owner readback, verified profile links, local facts, and contact-action events are approved. |

Policy:

```text
No experiment is launch-ready.
All listed experiments are preregistered drafts only.
```

## Search-Facing Test Guardrails

- No cloaking or user-agent-specific content.
- Variants must preserve stable canonical, indexability, robots, sitemap, hreflang, schema, and visible-content truth unless a search owner explicitly approves an architecture test.
- Product and local facts must match visible page content, schema, feeds, checkout, and owner-approved sources.
- Release annotations must record tested page groups, deployment time, affected templates, experiment IDs, known exceptions, owner, rollback condition, and next readback.
- A conversion lift cannot override privacy, accessibility, payment safety, local fact accuracy, stock/price truth, or booking/order reconciliation.

## Monitoring Thresholds

| Monitor | Blocker/Critical threshold | Current status |
| --- | --- | --- |
| `robots_sitemap_asset_availability` | Blocker if production robots, sitemap, product sitemap, or merchant feed serves 404/HTML instead of expected text/XML. | Blocked by D-3 public fetch mismatch. |
| `search_console_health` | Blocker for manual action/security issue; critical for sitemap/index/enhancement/performance anomaly. | Platform access unavailable. |
| `merchant_center_feed_health` | Blocker if feed cannot fetch or serves non-XML; critical for material disapproval or price/availability mismatch. | Blocked by D-3 feed mismatch and access. |
| `google_business_profile_health` | Critical for owner loss, suspension, wrong NAP/hours/category, website mismatch, duplicate issue. | Platform access unavailable. |
| `analytics_event_integrity` | Blocker for PII, consent violation, duplicate key event, or key event without server source. | Destination/readback unavailable. |
| `booking_order_reconciliation` | Blocker if purchase is inferred from checkout-success; critical for key-event/server discrepancy or payment mismatch. | Status definitions and readback unavailable. |
| `critical_journey_accessibility` | Blocker for inaccessible booking/checkout/contact; critical for duplicate high-impact controls or missing field errors. | D-4 checkout warnings open. |
| `core_web_vitals_and_runtime` | Critical for material journey performance regression after release. | Field data unavailable. |

## Incident Runbook

1. Verify tracking, consent, platform delays, filters, timezones, bot/internal traffic, and source-system exports.
2. Scope by route type, language, page group, device, market, platform, source, funnel stage, and exact date/time.
3. Check production access, status, robots, noindex, canonical, redirects, sitemap/feed, schema, rendered content, and deployment changes.
4. Check Search Console, Merchant Center, GBP, analytics, CrUX/PageSpeed, payment/order/booking systems, and known platform incidents.
5. Separate technical regression, tracking defect, inventory/capacity change, demand/seasonality, market/SERP change, and content/trust issue before assigning cause.
6. Apply the smallest reversible fix, verify through the affected source, annotate the incident, update the board, and add a regression check.

## Phase D Gate

Decision:

```text
Phase D is complete locally as a measurement, revenue, conversion, platform-readback, experiment, and monitoring contract.
Growth-ready classification remains blocked until Phase E verifies production/source/provider/platform evidence.
```

Open owner/platform blockers:

- Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, server logs, and live business-system readback are unavailable.
- Production robots/sitemap/product sitemap/merchant feed mismatch remains open from D-3.
- Owner-approved business, finance, booking/order status, privacy, analytics, and reconciliation policies are unavailable.
- D-4 checkout accessibility warnings remain open.

## Verification

```text
python3 /Users/chandler/.codex/plugins/cache/growth/growth/4.1.4/skills/seo-aeo-geo/scripts/experiment_guard.py .growth-work/experiments/experiment-registry.json --output-dir .growth-work/reports: passed with advisory instrumentation-unverified findings for draft experiments
node -e "for (const f of ['.growth-work/experiments/experiment-registry.json','.growth-work/measurement/experiment-monitoring-d5.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/experiments/experiment-registry.json .growth-work/measurement/experiment-monitoring-d5.json .growth-work/measurement/EXPERIMENT-MONITORING-D5.md .seo-work/reports/EXPERIMENT-MONITORING-QA-D5-2026-06-22.md .growth-work/reports/experiment-guard.json .growth-work/reports/EXPERIMENT-GUARD.md: passed
```
