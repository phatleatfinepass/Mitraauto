# Experiment And Monitoring QA Closeout - D-5

Date: 2026-06-22

Project: Mitra Auto

Status: Complete locally with platform and owner exceptions

## Executive Decision

D-5 closes as a local experiment and monitoring contract. It does not make Mitra Auto growth-ready because the live platform evidence, owner approvals, production asset behavior, and checkout accessibility fixes remain open.

```text
Do not launch conversion experiments or report growth impact until instrumentation, platform readback, reconciliation, and guardrails are verified.
```

## What Was Created

- `.growth-work/experiments/experiment-registry.json`
- `.growth-work/measurement/experiment-monitoring-d5.json`
- `.growth-work/measurement/EXPERIMENT-MONITORING-D5.md`
- `.seo-work/reports/EXPERIMENT-MONITORING-QA-D5-2026-06-22.md`

The bundled experiment guard also writes:

- `.growth-work/reports/experiment-guard.json`
- `.growth-work/reports/EXPERIMENT-GUARD.md`

## Findings

### [Critical] No experiment is launch-ready

- Evidence: all registry entries are `draft`; instrumentation is `unverified` or `partial`.
- Affected surface: service pages, product pages, checkout, contact/local actions.
- Impact: running tests now would create unreliable results and risk optimizing clicks instead of accepted, fulfilled, profitable outcomes.
- Owner/dependency: Growth, Analytics, Engineering, Business, Operations, Ecommerce, Privacy.
- Verification: `experiment_guard.py` validates registry structure and flags unverified instrumentation as advisory for draft experiments.

### [Critical] Production monitoring cannot pass until deployed assets are fixed

- Evidence: D-3 recorded production `robots.txt`, `sitemap.xml`, product sitemaps, and merchant feed serving 404/HTML instead of expected text/XML.
- Affected surface: Search Console, Merchant Center, product discovery, launch monitoring.
- Impact: sitemap/feed monitoring and product experiments cannot be trusted until public URLs serve expected assets.
- Owner/dependency: Engineering/SEO/Figma Make deployment.
- Verification: D-3 public fetch readback remains the controlling evidence.

### [Critical] Platform readback and business-system reconciliation remain unavailable

- Evidence: D-1 through D-3 record unavailable Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, server logs, and live booking/order exports.
- Affected surface: KPI tree, experiment metrics, monitoring thresholds, incident diagnosis.
- Impact: no reliable growth, revenue, or conversion-readiness claim can be made from local artifacts alone.
- Owner/dependency: Platform, Analytics, Business, Finance, Operations.
- Verification: D-5 monitoring contract records these as blockers, not zeros.

### [Warning] Checkout accessibility warnings block checkout-impacting tests

- Evidence: D-4 found duplicate responsive submit targets and toast-level validation recovery.
- Affected surface: checkout, product purchase journey, browser-agent operability.
- Impact: checkout experiments could amplify a known accessibility/recovery problem.
- Owner/dependency: Frontend/Accessibility/QA.
- Verification: D-4 remains source of truth until fixed and re-smoked.

## Monitoring Contract

Required monitors:

- production robots/sitemap/feed availability;
- Search Console manual actions, security issues, indexing, sitemap, enhancements, and performance;
- Merchant Center feed fetch, item diagnostics, price/availability mismatch, and product URL errors;
- GBP ownership, NAP, categories, hours, website/booking URL, reviews, calls, directions, duplicates, and suspension;
- analytics event integrity, consent behavior, duplicate key events, and prohibited PII;
- booking/order/payment/fulfillment reconciliation;
- critical journey accessibility;
- CWV and runtime performance.

## Phase D Closeout

Phase D is complete locally:

- D-1 KPI tree and event dictionary: complete with owner/platform exceptions.
- D-2 booking and order reconciliation: complete with owner/platform exceptions.
- D-3 platform readback: complete with critical platform exceptions.
- D-4 conversion/SXO/accessibility QA: complete with warnings.
- D-5 experiment and monitoring QA: complete with platform and owner exceptions.

Phase E should now package production evidence, Figma Make sync, Supabase/provider ledgers, live crawl/browser QA, drift baseline, and final readiness classification.

## Verification

```text
python3 /Users/chandler/.codex/plugins/cache/growth/growth/4.1.4/skills/seo-aeo-geo/scripts/experiment_guard.py .growth-work/experiments/experiment-registry.json --output-dir .growth-work/reports: passed with advisory instrumentation-unverified findings for draft experiments
node -e "for (const f of ['.growth-work/experiments/experiment-registry.json','.growth-work/measurement/experiment-monitoring-d5.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/experiments/experiment-registry.json .growth-work/measurement/experiment-monitoring-d5.json .growth-work/measurement/EXPERIMENT-MONITORING-D5.md .seo-work/reports/EXPERIMENT-MONITORING-QA-D5-2026-06-22.md .growth-work/reports/experiment-guard.json .growth-work/reports/EXPERIMENT-GUARD.md: passed
```
