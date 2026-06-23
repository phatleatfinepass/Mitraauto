# Analytics, Events, Booking/Order Reconciliation, And Consent Gate - D-4

Date: 2026-06-23

Status: complete with blockers carried.

D-4 hardens the source measurement contract but does not make analytics, revenue, or growth reporting ready.

## What Changed

- Booking form success now emits `booking_submitted`, not `booking_completed`.
- `booking_completed` is reserved for fulfilled service work only.
- Clarity events now attach non-PII common tags: `event_id`, `event_version`, `occurred_at`, `consent_state`, and `route`.
- The event dictionary and booking/order reconciliation contract now match the source event rename.

## Current Runtime State

| Surface | State | D-4 result |
| --- | --- | --- |
| Analytics runtime | Microsoft Clarity source exists; GA4/GTM/dataLayer was not found. | Source present, platform readback blocked. |
| Consent runtime | Clarity Consent API v2 is called with ad storage denied and analytics storage set from the user choice. | Source present, legal/privacy approval blocked. |
| Booking submit | `booking_submitted` fires after booking success. | Source semantic conflict fixed. |
| Fulfilled service | `booking_completed` no longer fires from the booking form. | Reserved for operations/server source. |
| Checkout start | `checkout_payment_started` remains diagnostic. | Must not count as payment or purchase. |
| Purchase | No client purchase event was added. | Must come from signed Paytrail/server paid state. |
| Contact/local actions | Defined in the event dictionary but not implemented. | Backlog until owner/platform approval. |

## Dataset Envelopes

| Provider | Scope | State | Limitation |
| --- | --- | --- | --- |
| Local repo source | Clarity, consent banner, booking modal, checkout pages, event dictionary, reconciliation contract | Executed with source fix | No live analytics dashboard, server export, or finance ledger was available. |
| Project wrapper | Redacted analytics/platform metadata status | Executed with missing metadata | Secrets were not printed; analytics property metadata was unavailable. |
| Official platform docs | GA4 recommended events, Google consent mode, Microsoft Clarity Consent API v2, GTM consent mode reference | Reviewed | Documentation does not prove this property collects correctly. |

## Reconciliation Policy

| Event | Count only when | Must not count from |
| --- | --- | --- |
| `booking_submitted` | Booking insert or install-booking function succeeds and a server booking record exists. | Modal open, step view, failed validation, or timestamp-only inference. |
| `booking_completed` | Operations marks the booked service fulfilled under owner-approved status rules. | Booking form success. |
| `purchase` | Signed Paytrail callback/server state confirms paid order. | Checkout success page view, redirect return, click, or pending order. |
| `order_fulfilled` | Operations marks delivery/pickup/fulfillment under approved status rules. | Paid state alone. |
| `refund` or negative revenue | Finance-approved refund/return state exists. | Manual notes or analytics-only adjustments. |

## Remaining Blockers

- Analytics destination ownership and dashboard/API/debug readback are unavailable.
- GA4/GTM or equivalent reporting property IDs and implementation decision are unavailable.
- Clarity dashboard readback is unavailable.
- Server outcome exports for bookings, paid orders, fulfilled services, invoices, refunds, returns, no-shows, and retention are unavailable.
- Finance-approved VAT, fee, refund, margin, contribution, CAC, and revenue-window definitions are unavailable.
- Owner-approved booking/order/customer lifecycle status dictionary is unavailable.
- Privacy/legal approval for analytics scope, consent text, retention, identifiers, deletion, and vendor use is unavailable.

## Official References Reviewed

- Google Analytics recommended events: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Google consent mode website setup: https://developers.google.com/tag-platform/security/guides/consent
- Google Tag Manager consent mode reference: https://support.google.com/tagmanager/answer/13802165
- Microsoft Clarity Consent API v2: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2

## Decision

```text
D-4 closes as source measurement hardening plus evidence readback.
The booking submit/completed semantic conflict is fixed in source.
Analytics, revenue, finance, server reconciliation, and privacy readiness remain blocked until platform readback, owner definitions, and server outcome exports exist.
Next task is D-5 - Content, Claims, Reviews, Media, And Local/Service Owner Approval.
```
