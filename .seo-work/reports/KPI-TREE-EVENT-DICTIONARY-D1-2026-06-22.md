# D-1 - KPI Tree And Event Dictionary

Status: Complete as draft contract with owner/platform exceptions

Recorded: 2026-06-22

## Decision

D-1 is complete as a local measurement contract. It defines a KPI tree, event dictionary, key-event policy, consent/PII rules, metric source map, and D-2/D-3 handoff.

It is not an implementation pass. No tracking tags, GA4/GTM properties, server events, or platform integrations were added.

## Evidence Used

Verified source evidence:

- Existing Clarity helper and consent banner.
- Current Clarity event calls for page view, consent grant, booking modal, booking success, add-to-cart, checkout start, checkout success, and checkout cancel.
- Existing booking insert/function flow.
- Existing Paytrail order creation, webhook update, `orders`, `payment_events`, and invoice/payment event paths.
- Existing contact/local links and customer account/retention surfaces.
- Phase D pre-analysis, Phase B wrap-up, and Phase C wrap-up.

Unavailable evidence:

- Business-owner approval of primary outcome.
- Analytics platform ownership and property IDs.
- Search Console, GBP, Merchant Center, CrUX, PageSpeed, server logs, and production readback.
- Real booking/order/customer outcome exports.
- Finance-approved revenue, VAT, refund, fee, CAC, margin, and contribution definitions.
- Legal/privacy approval of destination analytics vendor, retention, and consent model.

## Files Created

| File | Purpose |
| --- | --- |
| `.growth-work/measurement/kpi-tree.json` | KPI tree with formulas, grains, owners, cadence, source systems, status, and guardrails. |
| `.growth-work/measurement/event-dictionary.json` | Event dictionary with current source state, canonical names, key-event policy, privacy rules, and reconciliation targets. |
| `.growth-work/measurement/MEASUREMENT-SPEC-D1.md` | Reader-facing measurement contract for owner approval and D-2/D-3 handoff. |

## KPI Tree Outcome

Proposed primary outcome:

```text
fulfilled_profitable_customer_outcome
```

Meaning:

```text
A customer outcome that is accepted by operations, fulfilled, and eligible for revenue or contribution analysis after cancellations, failed payments, refunds, returns, no-shows, and support issues are accounted for.
```

Approval status: pending business owner.

## Event Dictionary Outcome

Current event issue:

- Existing `booking_completed` is emitted after successful booking submission, not after operational service completion.

Required D-2 resolution:

- Either rename/alias current submit-success behavior to `booking_submitted`, or explicitly document the semantic difference before using it in reports.

Candidate key events after reconciliation:

- `booking_submitted`
- `booking_accepted`
- `booking_completed`
- `purchase`
- `order_fulfilled`
- `retention_service_scheduled`

Diagnostic events:

- `spa_page_view`
- `analytics_consent_granted`
- `booking_start`
- `booking_step_view`
- `contact_call_click`
- `contact_email_click`
- `directions_click`
- `view_item`
- `add_to_cart`
- `begin_checkout`
- `payment_created`
- `payment_failed`
- `account_setup_completed`

## Data Quality And Privacy

The event dictionary forbids sending names, emails, phone numbers, license plates, addresses, raw notes, payment details, private manage URLs, auth identifiers, tokens, and free-text customer messages to analytics.

Common required non-PII parameters:

- `event_id`
- `event_version`
- `occurred_at`
- `consent_state`
- `route`
- `page_type`
- `language`

## D-1 Gate Result

| Exit item | Result |
| --- | --- |
| Confirm primary business outcome | Drafted as `fulfilled_profitable_customer_outcome`; owner approval pending. |
| Define acquisition, activation, quality, retention, and guardrail metrics | Complete in KPI tree. |
| Define event names and parameters | Complete in event dictionary. |
| Define key events | Complete as candidate policy pending D-2 reconciliation. |
| Define consent and data-quality limits | Complete in event dictionary and measurement spec. |

## Remaining Blockers

| Blocker | Owner | Next task |
| --- | --- | --- |
| Booking/order reconciliation and status definitions missing. | Analytics/Engineering/Operations | D-2 |
| Analytics/Search Console/GBP/Merchant Center platform readback missing. | SEO/Analytics/Business | D-3 |
| Legal/privacy approval of analytics vendor/retention/consent missing. | Legal/Privacy | D-1/D-3 approval dependency |
| Finance definitions for revenue, VAT, refunds, fees, CAC, margin, and contribution missing. | Finance/Business | D-2/D-5 dependency |

## Verification

```text
node -e "for (const f of ['.growth-work/measurement/kpi-tree.json','.growth-work/measurement/event-dictionary.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')": passed
rg -n "trackClarityEvent|upgradeClaritySession|trackClarityPageView|AnalyticsConsentBanner|initClarityForCurrentRuntime|Clarity\\." src supabase/functions -g '!node_modules': passed
rg -n "from\\(['\\\"](bookings|orders|payment_events|invoice_events|customer_events)['\\\"]\\)|status: 'confirmed'|status: \\\"paid\\\"|payment_status|fulfillment_status|marketing_consent|contact_consent" src supabase/functions supabase/migrations -g '!node_modules': passed
git diff --check -- .growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md .growth-work/measurement/kpi-tree.json .growth-work/measurement/event-dictionary.json .growth-work/measurement/MEASUREMENT-SPEC-D1.md .seo-work/reports/KPI-TREE-EVENT-DICTIONARY-D1-2026-06-22.md: passed
```

## Next

Continue with `D-2 - Booking And Order Reconciliation`.
