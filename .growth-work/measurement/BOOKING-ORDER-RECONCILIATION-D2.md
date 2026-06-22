# D-2 Booking And Order Reconciliation

Status: Source contract complete; implementation, owner approval, and platform readback pending

Recorded: 2026-06-22

## Purpose

D-2 defines how Mitra Auto should reconcile analytics events to real booking, order, payment, invoice, fulfillment, and retention records.

This is a measurement contract, not a revenue claim. Analytics can describe behavior, but it must not become the source of truth for submitted bookings, paid orders, completed services, fulfilled orders, invoice payments, revenue, or retention.

## Source Truth

| Outcome | Truth source | Evidence in local source | Measurement policy |
| --- | --- | --- | --- |
| Booking submitted | `bookings` insert or `order_install_booking` booking response | `BookingStep3.tsx`, `order_install_booking`, `_shared/order_email.ts` | Count only after server booking id exists. |
| Booking accepted | Operations status on booking | Admin and booking management source exists, but accepted policy is not approved | Block key-event use until owner defines accepted/invalid/duplicate/no-show rules. |
| Booking completed | Operations marks service as fulfilled | Current public event name conflicts with this meaning | Do not use current `booking_completed` for service completion. |
| Payment created | `orders` row plus Paytrail redirect metadata | `payments_create_paytrail` | Checkout start is diagnostic only. |
| Purchase | Signed Paytrail callback and paid order state | `payments_paytrail_webhook`, `payment_events`, `orders` | Count purchase only from callback/server state, not success page view alone. |
| Payment failed/cancelled | Signed Paytrail callback or unresolved order rule | `payments_paytrail_webhook`, checkout cancel page | Cancel page view is diagnostic only. |
| Order fulfilled | CMS order status flow | `OrdersCMSPage.tsx` | Count only after approved fulfillment status, not at payment time. |
| Invoice paid | Invoice payment documents, links, details, events | invoice migrations, invoice functions, invoice CMS | Separate ecommerce order revenue from invoice/AR collection until finance approves. |
| Retention | Customer/account history, repeat bookings/orders, Tire Hotel/storage | customer/account migrations and panels | Candidate only until lifecycle windows are approved. |

## Critical Semantic Fix

The current public source fires `booking_completed` after booking submission succeeds. That is not a completed service.

Required policy:

- Rename or alias the current client event to `booking_submitted`.
- Reserve `booking_completed` for fulfilled service only.
- Do not mark `booking_completed` as a key event until operations has a distinct completed-service source.

## Correlation Gap

Current reviewed source does not persist a durable non-PII measurement id from client analytics into booking or order rows.

Required future state:

- Generate `event_id` for client events.
- Store a server-safe correlation id or mapping for server-reconciled key events.
- Do not send names, emails, phones, license plates, addresses, notes, payment details, tokens, private manage URLs, auth identifiers, or free text to analytics.
- Prefer server-side reconciliation tables or exports when third-party analytics destinations should not receive raw server ids.

## Event Rules

| Canonical event | Key event allowed now | Required reconciliation |
| --- | --- | --- |
| `booking_submitted` | Candidate only | Booking id exists from `bookings` or install booking function. |
| `booking_accepted` | No | Owner-approved operational accepted status. |
| `booking_completed` | No | Fulfilled-service status, not booking form submit. |
| `payment_created` | No | `orders` row and Paytrail redirect metadata. |
| `purchase` | Candidate only | Signed `payment_ok` callback plus paid order state. |
| `payment_failed` | No | Signed failed callback or unresolved-order SLA. |
| `order_fulfilled` | No | Approved `delivered`/`done` status policy. |
| `invoice_paid` | Candidate only | Invoice payment event/detail/link/document paid state. |
| `retention_service_scheduled` | No | Customer/account lifecycle source and retention window. |

## Discrepancy Thresholds

| Check | Warning | Critical |
| --- | --- | --- |
| Booking submitted daily | More than 5 percent or 5 events mismatch after consent/server-only exclusions | More than 10 percent or 10 events mismatch, or duplicate key event ids |
| Purchase daily | More than 3 percent or 3 events mismatch after exclusions | Any analytics purchase without matching paid order, or more than 5 percent/5 event mismatch |
| Payment callback to order | Callback unmatched for more than 1 hour | Signed `payment_ok` fails to produce paid order state |
| Fulfillment | Paid order missing fulfillment status past approved SLA | Fulfilled without paid/cash-approved payment or explicit exception |
| Privacy | Unexpected unapproved optional parameter | Any PII, payment detail, token, or private URL in analytics |

## Implementation Requirements

Future implementation should add:

- event name migration from current `booking_completed` submit event to `booking_submitted`;
- non-PII event id generation and server correlation;
- server-side event emission or export for purchase, invoice paid, and fulfillment events;
- daily reconciliation query/report for analytics vs server truth;
- owner-approved booking and order status dictionary;
- finance-approved revenue treatment for VAT, refunds, returns, Paytrail fees, invoice payments, manual/cash orders, and margin;
- privacy/legal approval for analytics destinations, identifiers, retention, consent, and offline conversion uploads.

## D-2 Gate Result

D-2 can close locally as a source-backed reconciliation contract.

Growth-ready measurement remains blocked because:

- analytics platform readback is not available;
- owner-approved operational status definitions are missing;
- finance revenue definitions are missing;
- durable analytics-to-server correlation is not implemented;
- live Supabase schema was not read back in this task.

Next task: `D-3 - Search Console, GBP, Merchant Center, And Analytics Readback`.
