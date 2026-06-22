# D-1 Measurement Spec - KPI Tree And Event Dictionary

Status: Draft ready for owner approval

Recorded: 2026-06-22

## Purpose

D-1 defines the measurement contract before implementation. It does not install analytics tags, create platform properties, or claim business performance.

The contract separates:

- discovery and traffic signals,
- intent and diagnostic events,
- server-accepted bookings/orders,
- operationally qualified outcomes,
- fulfilled value,
- revenue and margin quality,
- retention/repeat behavior,
- guardrails.

## Decision

Use `fulfilled_profitable_customer_outcome` as the proposed primary outcome until the business owner approves a more precise name.

This means Mitra should not optimize only for clicks, page views, booking modal opens, add-to-cart, checkout starts, or `/checkout/success` page views. Those are useful diagnostics, but growth-ready measurement must reconcile to booking/order/payment/fulfillment/customer systems.

## Artifact Set

| Artifact | Purpose |
| --- | --- |
| `.growth-work/measurement/kpi-tree.json` | Machine-readable KPI tree, formulas, source systems, owner gaps, cadence, and data-quality status. |
| `.growth-work/measurement/event-dictionary.json` | Machine-readable event dictionary, key-event policy, common parameters, PII exclusions, and source state. |
| `.growth-work/measurement/MEASUREMENT-SPEC-D1.md` | Reader-facing measurement contract and approval checklist. |
| `.seo-work/reports/KPI-TREE-EVENT-DICTIONARY-D1-2026-06-22.md` | Task closeout report. |

## KPI Tree Summary

| Layer | KPI purpose | Current status |
| --- | --- | --- |
| Acquisition | Connect Search Console, GBP, Merchant Center, and analytics landing evidence to qualified visits. | Blocked on D-3 platform access. |
| Activation | Measure booking starts, checkout starts, local contact actions, account setup, and decision support use. | Event dictionary defined; implementation pending. |
| Server accepted | Count server-recorded bookings, install bookings, orders, payment creation, and invoice/payment events. | Source systems exist; D-2 reconciliation pending. |
| Qualified outcome | Separate submitted bookings/orders from accepted bookings, paid orders, and non-duplicate/valid outcomes. | Owner status definitions missing. |
| Fulfilled value | Track completed service, fulfilled order, pickup/delivery, and retention service milestones. | Operational definitions missing. |
| Revenue quality | Track revenue, contribution/margin, refunds, returns, failed payments, and support burden. | Finance definitions unavailable. |
| Retention | Track repeat customer, repeat booking/order, account/Tire Hotel/storage milestones. | Business lifecycle definitions missing. |
| Guardrails | Track privacy, accessibility, cancellation, refund, no-show, stock/price mismatch, performance, platform incidents. | Defined; D-4/D-5 QA pending. |

## Primary Outcome Approval Needed

Business owner must approve:

- whether the primary outcome is completed service, paid order, fulfilled order, repeat customer, contribution profit, or a blended system;
- which booking statuses count as accepted, completed, cancelled, no-show, duplicate, or invalid;
- which order/payment statuses count as paid, fulfilled, refunded, returned, failed, or cancelled;
- whether revenue is reported gross, net of VAT, net of refunds, or contribution-based;
- which costs are included for margin and CAC analysis;
- which retention window matters for automotive service, tire/rim purchase, Tire Hotel/storage, and account customers.

## Event Dictionary Summary

Current source events:

- `spa_page_view`
- `analytics_consent_granted`
- `booking_modal_opened`
- `booking_completed` with current semantic risk: it currently means submitted booking success, not completed service
- `cart_item_added`
- `checkout_payment_started`
- `checkout_success_viewed`
- `checkout_cancel_viewed`

Recommended canonical events:

- `booking_start`
- `booking_step_view`
- `booking_submitted`
- `booking_accepted`
- `booking_completed`
- `booking_cancelled`
- `contact_call_click`
- `contact_email_click`
- `directions_click`
- `view_item`
- `add_to_cart`
- `begin_checkout`
- `payment_created`
- `purchase`
- `payment_failed`
- `order_fulfilled`
- `account_setup_completed`
- `retention_service_scheduled`

## Key Event Policy

Treat these as candidate key events only after D-2 reconciliation:

- `booking_submitted`
- `booking_accepted`
- `booking_completed`
- `purchase`
- `order_fulfilled`
- `retention_service_scheduled`

Do not mark every diagnostic event as a key event. `page_view`, `booking_start`, `view_item`, `add_to_cart`, `begin_checkout`, call click, email click, directions click, and checkout cancel are useful diagnostics unless the business owner explicitly approves a lead-quality proxy.

## Consent And Privacy Rules

Analytics events must not include:

- names,
- emails,
- phone numbers,
- license plates,
- addresses,
- raw notes,
- payment details,
- private manage URLs,
- auth/session identifiers,
- tokens,
- free-text customer messages.

Use `event_id`, `event_version`, `occurred_at`, `consent_state`, `route`, `page_type`, and `language` as common non-PII parameters. Use non-secret order/booking event IDs only if privacy and analytics owners approve them for the destination platform.

## Platform Data Envelope Required In D-3

Every external platform dataset must record:

- provider and report/API name,
- property/account/origin/URL scope,
- market, country, device, search type, locale, and filters,
- date range, timezone, aggregation, and comparison period,
- retrieval time,
- credential/access limitation,
- sampling/privacy thresholds/quota/freshness limitations.

Unavailable platform data must remain `UNAVAILABLE`, not zero.

## D-2 Handoff

D-2 must decide how analytics events reconcile to:

- `bookings`,
- `orders`,
- `payment_events`,
- `invoice_events`,
- customer/account history,
- operations status definitions,
- approved discrepancy thresholds.

Until D-2 closes, Phase D must not claim purchase, completed service, revenue, margin, retention, or conversion quality.
