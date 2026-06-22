# D-2 - Booking And Order Reconciliation

Status: Complete locally as source contract; growth-ready outcome proof remains blocked

Recorded: 2026-06-22

## Summary

D-2 reviewed local booking, checkout, Paytrail, invoice, order CMS, booking management, and customer/account source paths and created a reconciliation contract for measurement.

The main finding is semantic and critical for product/service SEO measurement: the current client event `booking_completed` actually means booking submission succeeded. It must be renamed or aliased to `booking_submitted`; true `booking_completed` must be reserved for fulfilled service.

## Artifacts

| Artifact | Purpose |
| --- | --- |
| `.growth-work/measurement/booking-order-reconciliation.json` | Machine-readable D-2 reconciliation policy, source map, thresholds, and blockers. |
| `.growth-work/measurement/BOOKING-ORDER-RECONCILIATION-D2.md` | Reader-facing D-2 contract and implementation handoff. |
| `.seo-work/reports/BOOKING-ORDER-RECONCILIATION-D2-2026-06-22.md` | Closeout report. |
| `.growth-work/boards/MITRA-GROWTH-READY-BOARD-2026-06-21.md` | Board state updated for D-2 completion and D-3 next task. |

## Source Evidence

| Area | Local source evidence | Result |
| --- | --- | --- |
| Booking submit | `BookingStep3.tsx` inserts into `bookings` or invokes `order_install_booking`; `BookingModal.tsx` fires `booking_completed` after success | Event rename required. |
| Install booking | `order_install_booking` delegates to `_shared/order_email.ts` and creates confirmed booking | Must reconcile to returned booking id. |
| Checkout start | `CheckoutPage.tsx` fires `checkout_payment_started` before Paytrail function | Diagnostic only. |
| Order creation | `payments_create_paytrail` inserts `orders`, validates stock/prices server-side, and creates Paytrail request | Server truth for payment creation. |
| Purchase | `payments_paytrail_webhook` verifies signature, updates `orders`, and inserts `payment_events` | Purchase must come from signed callback/server state. |
| Cancel/failure | Cancel page is a page view; webhook/order state proves failure | Cancel page view is diagnostic only. |
| Fulfillment | `OrdersCMSPage.tsx` tracks fulfillment in `cart_snapshot.fulfillment_status` with status fallback | Owner must approve which statuses count as fulfilled. |
| Invoice paid | Invoice document/detail/link/event structures exist | Finance must approve revenue treatment. |

## Gate Result

| Gate | Result |
| --- | --- |
| Identify booking/order truth sources | Complete locally. |
| Define event timing | Complete as policy. |
| Define deduplication/correlation | Gap recorded; implementation pending. |
| Define discrepancy thresholds | Complete as draft thresholds. |
| Approve business status definitions | Blocked on owner/operations. |
| Verify analytics platform data | Deferred to D-3. |
| Prove live revenue/conversion quality | Blocked until implementation and platform readback. |

## Figma Make Sync

None.

No Figma Make source files were changed in D-2. The work is docs and measurement contract only.

## Next

Continue with `D-3 - Search Console, GBP, Merchant Center, And Analytics Readback`.
