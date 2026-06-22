# Phase D - Measurement, Revenue, Conversion, And Platform QA Pre-Analysis

Status: Analysis complete before implementation

Recorded: 2026-06-22

## Decision

Phase D can start as a measurement and conversion contract phase, but implementation should not proceed until D-1 defines an approved KPI tree, event dictionary, consent behavior, and business outcome owners.

D-1, D-2, and D-3 remain blocked for closeout because analytics/platform access, platform owners, and business outcome definitions are not recorded. D-4 and D-5 can proceed locally as journey, accessibility, experiment, and monitoring specifications, but they cannot claim live conversion quality, revenue, or platform health without readback evidence.

## Lifecycle Mode

`@Growth` mode: `AUDIT` plus `PLAN`

Archetype coverage:

- Local service business
- Booking/reservation
- Ecommerce/catalog checkout
- Retention/customer account support
- Multilingual FI/EN SPA

## Evidence Used

Verified source evidence:

- `src/lib/clarity.ts` initializes Microsoft Clarity only for the public site runtime, excludes CMS/PWA paths, gates analytics storage through consent, and sends event/page-view calls through helper functions.
- `src/components/site/analytics/AnalyticsConsentBanner.tsx` exposes accept and decline choices for analytics consent.
- `src/SiteApp.tsx` records Clarity page views and selected journey events: `spa_page_view`, `booking_modal_opened`, `cart_item_added`, `checkout_success_viewed`, and `checkout_cancel_viewed`.
- `src/components/site/booking/BookingModal.tsx` records `booking_completed` after booking confirmation succeeds and upgrades the Clarity session.
- `src/components/site/booking/BookingStep3.tsx` persists bookings to Supabase `bookings` or `order_install_booking`, then optionally sends push and email confirmation.
- `src/components/site/checkout/CheckoutPage.tsx` records `checkout_payment_started`, sends Paytrail payment creation payloads, and preserves checkout draft state on recoverable errors.
- `supabase/functions/payments_create_paytrail/index.ts` creates `orders`, records pending payment state, validates cart products server-side, and returns Paytrail redirect details.
- `supabase/functions/payments_paytrail_webhook/index.ts` updates order/invoice payment status and writes `payment_events` or `invoice_events`.
- `src/components/site/pages/ContactPage.tsx` and `src/components/site/sections/ContactSection.tsx` expose map, phone, email, and booking/contact actions from `businessProfile`.
- Phase B and Phase C wrap-ups explicitly defer platform, analytics, business outcome, GBP, Merchant Center, and production evidence to Phase D/E.

Unavailable evidence:

- GA4/GTM or alternate analytics property ownership and property IDs.
- Search Console, GBP, Merchant Center, CrUX, PageSpeed field data, server logs, and production analytics readback.
- Booking/order/customer operational exports with real periods, statuses, cancellations, completions, returns, refunds, no-shows, margins, and repeat behavior.
- Business-approved primary outcome, revenue recognition, margin basis, taxes/fees treatment, capacity constraints, and acquisition-cost definitions.
- Consent/legal owner approval for analytics categories, retention, deletion, vendor scope, and cross-platform measurement.
- Live production browser evidence for analytics firing, consent behavior, and order/booking reconciliation.

## Current Source Assessment

| Area | Observation | Phase D meaning |
| --- | --- | --- |
| Analytics runtime | Source contains Microsoft Clarity helpers and a consent banner; no GA4/GTM/dataLayer implementation was found in the inspected public source. | Clarity can support qualitative UX/session diagnostics, but it is not a full revenue/search KPI system by itself. |
| Consent | Clarity starts with analytics storage denied unless consent is granted, and CMS/PWA paths are excluded. | Consent behavior exists at source level, but legal owner, retention, and platform reporting limits are not documented. |
| Events | Current events cover page view, consent grant, booking modal open, booking completed, cart item added, checkout payment started, checkout success view, and checkout cancel view. | Event set is useful but not yet a governed dictionary with IDs, deduplication, owners, key-event policy, or downstream reconciliation. |
| Booking | Public booking writes confirmed bookings to `bookings` or via `order_install_booking`, then sends notifications. | A booking submit can be tracked, but accepted/completed/cancelled/no-show outcomes need operational reconciliation. |
| Checkout | Checkout creates pending Paytrail orders and webhook updates payment/order state. | `/checkout/success` is not a purchase proof by itself; paid order requires webhook/order state and payment event reconciliation. |
| Contact/local actions | Phone, email, directions, and booking CTAs are visible. | Local actions need privacy-safe click events and platform readback from GBP/analytics before they can be reported. |
| Retention | Customer account, preferences, service book, order pickup, and Tire Hotel backend surfaces exist. | Retention can be modeled, but repeat booking/order and service-value definitions are not yet approved. |
| Platform evidence | Search Console, GBP, Merchant Center, analytics, CrUX, and server logs were not accessed. | Platform health remains unavailable, not passed or failed. |

## Extra Layer - Phase D Measurement Assurance Model

| Layer | Purpose | Current state | Owner |
| --- | --- | --- | --- |
| D0 Data Contract Gate | Approved primary outcome, owners, consent model, source systems, IDs, and source periods. | Blocked | Business/Analytics/Legal |
| D1 KPI Tree | Connect search/local/product traffic to qualified booking, paid order, fulfilled service, retention, revenue, and guardrails. | Not implemented | Analytics/Business |
| D2 Event Contract | Version event names, parameters, consent behavior, identity/deduplication, key-event policy, and QA checks. | Source events exist, dictionary missing | Analytics/Engineering |
| D3 Reconciliation | Match analytics events to `bookings`, `orders`, `payment_events`, invoice events, statuses, and operational outcomes. | Source targets identified, data proof missing | Analytics/Engineering |
| D4 Platform Readback | Record dataset envelopes for Search Console, GBP, Merchant Center, analytics, CrUX, PageSpeed, and logs. | Blocked by access | Platform owners |
| D5 Journey QA | Smoke-test service booking, product purchase, install booking, contact/local, account/retention, errors, accessibility, and mobile behavior. | Ready for local QA spec | Product/QA |
| D6 Experiment And Monitoring | Define experiment registry, launch annotations, alert thresholds, incident runbook, and rollback rules. | Ready for spec, not live | Growth/Analytics |

## Proposed KPI Tree Direction

Primary outcome should not be a click, page view, form start, or generic conversion rate. The likely candidate is a fulfilled profitable customer outcome, split by model:

- Local service: confirmed booking -> operationally accepted booking -> completed service -> repeat/retained customer.
- Ecommerce: product view -> add to cart -> checkout started -> Paytrail order created -> paid order -> fulfilled order -> return/refund/stock issue guardrails.
- Local actions: call/email/directions/book intent -> accepted customer outcome where operationally knowable.
- Tire Hotel/account retention: account setup -> pickup/storage/service milestone -> retained/repeat customer.

This remains an assumption until the business owner approves exact definitions.

## Proposed Event Contract Before Implementation

The project should keep Clarity UX events if useful, but add a measurement contract that can later support GA4/GTM or an equivalent analytics platform without sending PII.

Candidate journey events:

- `page_view` or `spa_page_view`
- `analytics_consent_granted`
- `booking_start`
- `booking_step_view`
- `booking_slot_selected`
- `booking_service_selected`
- `booking_submitted`
- `booking_accepted`
- `booking_completed`
- `booking_cancelled`
- `booking_no_show`
- `contact_call_click`
- `contact_email_click`
- `directions_click`
- `view_item`
- `add_to_cart`
- `begin_checkout`
- `payment_start`
- `payment_failed`
- `purchase`
- `order_fulfilled`
- `refund_or_return`
- `install_booking_started`
- `install_booking_submitted`
- `account_setup_started`
- `retention_service_scheduled`

Required parameter classes:

- Event identity: `event_id`, `event_version`, `occurred_at`, `consent_state`.
- Page context: `page_type`, `route`, `language`, `canonical_path`.
- Product context: `product_type`, `sku_or_variant_id`, `brand`, `currency`, `value`, `quantity`, `availability_state`.
- Booking context: `service_id`, `service_count`, `booking_source`, `slot_date_bucket`, `install_prefill`.
- Commerce context: `order_id` only where safe and non-secret, `payment_provider`, `payment_status`, `shipping_method`, `item_count`.
- Local action context: `action_type`, `location_id`, `destination_type`.

Do not send names, emails, phone numbers, license plates, addresses, raw notes, payment details, tokens, or private order-access URLs to analytics.

## Blockers And Owner Inputs

| Blocker | Why it blocks closeout | Owner |
| --- | --- | --- |
| Primary business outcome not approved | KPI tree cannot decide key events or guardrails. | Business owner |
| Analytics platform ownership missing | D-1 cannot define actual property, tag mechanism, consent mode, or reporting behavior. | Analytics owner |
| Booking status definitions missing | Booking submit, accepted booking, completed service, cancellation, and no-show cannot be reconciled. | Operations/Booking owner |
| Order/payment lifecycle definitions missing | Purchase, paid order, fulfillment, refund, return, and failed payment cannot be treated as revenue truth. | Ecommerce/Payments owner |
| Margin and revenue definitions missing | Revenue and contribution reporting cannot be safely modeled. | Finance/Business owner |
| Platform access missing | D-3 cannot record Search Console, GBP, Merchant Center, analytics, CrUX, or log dataset envelopes. | SEO/Platform owner |
| Consent/legal owner missing | Analytics event collection, retention, and vendor use cannot be called compliant. | Legal/Privacy owner |

## Implementation Sequence

1. D-1: Create a KPI tree and event dictionary with explicit unknowns, owners, formulas, source systems, consent behavior, and key-event policy.
2. D-2: Build a reconciliation spec that joins analytics events to `bookings`, `orders`, `payment_events`, invoice events, and operational status transitions without PII in analytics.
3. D-3: Record platform dataset envelopes for Search Console, GBP, Merchant Center, analytics, CrUX/PageSpeed, and any authorized logs.
4. D-4: Run local browser/SXO/accessibility QA for booking, checkout, contact/local actions, install booking, customer account, and failure recovery.
5. D-5: Define experiment registry, launch annotations, alert thresholds, monitoring cadence, and incident runbooks.

## Figma Make Sync

No Figma Make source files were changed in this pre-analysis. The next Figma Make sync list should only include source files if D-1 or later tasks implement tracking or journey UI changes under `src/`.

## Validation

Commands used for source evidence:

```text
rg -n "gtag|dataLayer|analytics|GA4|GTM|track|event|conversion|utm|Search Console|merchant|business profile|booking|checkout|order|payment|paytrail|cart|quote|contact|tel:|mailto:|consent|cookie|privacy|revenue|purchase" src functions supabase scripts package.json .seo-work .growth-work -g '!node_modules'
find src -maxdepth 4 -type f \( -name '*Booking*' -o -name '*Checkout*' -o -name '*Cart*' -o -name '*Contact*' -o -name '*Product*' -o -name '*Privacy*' \) | sort
find supabase functions scripts -maxdepth 4 -type f
rg -n "trackClarityEvent|upgradeClaritySession|trackClarityPageView|AnalyticsConsentBanner|initClarityForCurrentRuntime|Clarity\\." src supabase/functions -g '!node_modules'
rg -n "from\\(['\\\"](bookings|orders|payment_events|invoice_events|customer_events)['\\\"]\\)|status: 'confirmed'|status: \\\"paid\\\"|payment_status|fulfillment_status|marketing_consent|contact_consent" src supabase/functions supabase/migrations -g '!node_modules'
```

Validation still needed:

- Live analytics event QA after the destination platform is chosen.
- Platform API/readback evidence with dataset envelopes.
- Business-owner approval of KPI/event definitions.
- Legal/privacy approval of consent and data minimization.
- Browser journey and accessibility smoke for D-4.

## Next

Continue with `D-1 - KPI Tree And Event Dictionary`.
