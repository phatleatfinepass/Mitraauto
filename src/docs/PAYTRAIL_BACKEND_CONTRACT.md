# Paytrail Backend Contract (External Supabase Project)

The real payment backend for Mitra Auto **does not live in this repo**.

It is implemented as Supabase Edge Functions and Postgres tables in the
Supabase project:

- **Project ref:** `rcmmbwdebnmicrweoiyz`
- **Environment:** Production / Sandbox Paytrail, depending on secrets

For the frontend (Next.js, React, Figma Make, Codex, etc.), you must treat
this backend as an **external HTTP API** and call it over HTTPS.

---

## Base URL

All Paytrail-related Edge Functions are exposed under:

```text
https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1

The primary function used by the frontend checkout flow is:
POST /payments_create_paytrail

So the full URL is:
https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/payments_create_paytrail

Note: This base URL MUST be configurable in the frontend via
NEXT_PUBLIC_PAYTRAIL_FUNCTIONS_BASE so that we can switch environments
later if needed.

1. Create Paytrail Payment

Endpoint
	•	Method: POST
	•	URL: ${PAYTRAIL_FUNCTIONS_BASE}/payments_create_paytrail
	•	Auth: Public (no Authorization header required from the storefront)

The frontend calls this endpoint when the user clicks “Proceed to payment”
on the checkout page.

Request JSON

The backend is designed to be cart-aware and server-driven. It can:
	•	derive items from the current server-side cart, and/or
	•	accept explicit items and customer details from the frontend for test /
isolated flows.

To keep the contract flexible (and safe for tools like Figma Make), we use
this request shape:

{
  "session_id": "uuid-string (optional, if your FE tracks cart by session)",
  "email": "customer@example.com or null",
  "phone": "+358401234567 or null",
  "items": [
    {
      "unitPrice": 5000,
      "units": 2,
      "productCode": "TEST-TIRE-001",
      "vatPercentage": 24,
      "description": "Test Tire"
    }
  ],
  "return_url": "https://www.mitra-auto.fi/checkout/success",
  "cancel_url": "https://www.mitra-auto.fi/checkout/cancel",
  "metadata": {
    "source": "web_checkout",
    "test_label": "optional free-form metadata"
  }
}

Field notes:
	•	session_id
	•	Optional. If present, backend may use it to find the current cart
(public.carts / public.cart_items) and derive an order.
	•	email, phone
	•	Optional; if not provided, backend may use stored order/contact data.
	•	items
	•	Optional; when provided, they must use Paytrail’s item schema style:
	•	unitPrice: integer cents (e.g. 10000 for €100.00)
	•	units: number of units
	•	productCode: SKU / internal code
	•	vatPercentage: e.g. 24
	•	description: human-readable line description
	•	return_url / cancel_url
	•	Where Paytrail should send the user back after payment completed/canceled.
	•	Typically:
	•	https://www.mitra-auto.fi/checkout/success
	•	https://www.mitra-auto.fi/checkout/cancel
	•	metadata
	•	Free-form JSON passed through into logs or DB; safe to omit.

Response JSON (Success)

On success, the backend:
	•	creates/updates an orders row
	•	logs a payment_events row
	•	creates a Paytrail payment
	•	returns the redirect URL and identifiers to the frontend

The canonical success shape is:

{
  "ok": true,
  "order_id": "uuid-string",
  "transaction_id": "paytrail-uuid-or-id",
  "redirect_url": "https://payment.paytrail.com/...",
  "stamp": "internal-stamp-string",
  "reference": "ORDER-<uuid-or-human-id>",
  "total_cents": 10000,
  "currency": "EUR",
  "version": "create_v3_2025-11-15+paytrail-docs-aligned"
}

Frontend usage:
	•	The frontend should:
	•	trust redirect_url and window.location.href = redirect_url
	•	optionally store order_id in sessionStorage to re-find it after
returning from Paytrail

Example:
if (res.ok) {
  sessionStorage.setItem("mitra_last_order_id", res.order_id);
  window.location.href = res.redirect_url;
}

Response JSON (Error)

If the Paytrail create call or validation fails, the backend responds with:

{
  "ok": false,
  "error": "paytrail_error" /* or "validation_error", "network_error", etc. */,
  "message": "Human-readable error message",
  "details": {
    "status": "error",
    "meta": [
      "Optional list of Paytrail error details, e.g. schema validation failures"
    ]
  },
  "version": "create_v3_2025-11-15+paytrail-docs-aligned"
}

Frontend behaviour:
	•	Do not retry automatically on ok: false.
	•	Show a friendly error message on the checkout page.
	•	Optionally log the error to your own tracking if needed.

Network Errors

If the Edge Function cannot reach Paytrail (DNS, timeout, etc.), it still
attempts to return a structured error with ok: false, but the frontend
must also be prepared for:
	•	Non-JSON responses
	•	HTTP 5xx codes
	•	Network exceptions at the fetch layer

The recommended frontend pattern is:
	1.	Check HTTP response.ok.
	2.	Try await response.json() in a try/catch.
	3.	If parsing fails, fall back to a generic error state.

⸻

2. Paytrail Redirect & Webhook

The Paytrail payment flow sends the user back to the shop and also calls a
server-side webhook.

Redirect URLs (Frontend)

The user is redirected to:
	•	return_url after successful payment
	•	cancel_url if the payment is cancelled or fails

Paytrail appends query parameters like:
	•	checkout-account
	•	checkout-algorithm
	•	checkout-amount
	•	checkout-provider
	•	checkout-reference
	•	checkout-stamp
	•	checkout-status
	•	checkout-transaction-id
	•	signature

Important: The frontend should not try to validate these HMAC
signatures. That is already handled in the backend webhook.

Instead, the frontend should:
	1.	Treat /checkout/success and /checkout/cancel as display pages.
	2.	Use sessionStorage or a URL param (e.g. order_id) to know which order
to show.
	3.	Call a backend endpoint (order summary) to display final order & payment
status.

Webhook (Backend-only)

The actual Paytrail webhook goes to an Edge Function such as:

POST ${PAYTRAIL_FUNCTIONS_BASE}/payments_paytrail_webhook

This function:
	•	validates the HMAC signature from Paytrail
	•	finds the matching order by stamp / reference
	•	updates orders.paytrail_status, orders.paytrail_transaction_id
	•	appends a row to payment_events

The frontend never calls this webhook directly. It is documented here only
to explain why the frontend should rely on the backend order summary instead of
trying to “trust” URL params.

⸻

3. Status Poller (Backend-only)

A separate Edge Function polls Paytrail to reconcile payment statuses:

POST ${PAYTRAIL_FUNCTIONS_BASE}/payments_status_poller

This function:
	•	finds orders with paytrail_status in pending states
	•	calls Paytrail /payments/{transactionId}
	•	updates orders row
	•	appends payment_events rows

The frontend does not call this directly. It benefits from it indirectly via
the order summary/status endpoint.

⸻

4. Database Tables (Read-only Concept for FE)

public.orders

Key fields the frontend should be aware of conceptually:
	•	id (uuid): internal order identifier
	•	status (enum): e.g. draft, submitted, confirmed
	•	subtotal_cents, total_cents, grand_total_cents
	•	paytrail_stamp (text, unique)
	•	paytrail_reference (text, unique)
	•	paytrail_transaction_id (text, unique, nullable)
	•	paytrail_status (enum): e.g. new, pending, paid, failed, cancelled
	•	paytrail_provider (text)
	•	currency (enum, default EUR)
	•	cart_snapshot (jsonb): snapshot of items at the time of order creation

The frontend may receive a summary of these via an order summary endpoint
(e.g. /api/orders/:id/summary), not by direct DB queries.

public.payment_events

Used for audit and timelines:
	•	order_id (uuid)
	•	source (text, usually "paytrail")
	•	event_type (text)
	•	ext_transaction_id (text)
	•	ext_stamp (text)
	•	ext_status (text)
	•	signature_valid (boolean)
	•	payload (jsonb)
	•	created_at (timestamp)

The frontend may receive a simplified list of events for display on the
success page, if implemented.

⸻

5. Frontend Integration Guidelines

Routes

Recommended routes that the frontend should implement:
	•	/checkout
	•	Shows cart items & totals
	•	Has “Proceed to payment” button that calls payments_create_paytrail
	•	/checkout/success
	•	Shown after Paytrail success redirect
	•	Reads order_id (from sessionStorage or URL)
	•	Calls an order summary endpoint to show final status & details
	•	/checkout/cancel
	•	Shown after user cancels or payment fails
	•	/checkout/error
	•	Generic fatal error page (missing order, failing API, etc.)

Idempotency

The backend is designed to be idempotent on its side (e.g. based on stamp /
reference), but the frontend should still avoid spamming the create endpoint.

Best practices:
	•	Disable “Proceed to payment” button while a call is in-flight.
	•	Only re-enable on an explicit error state.

Error Handling

On ok: false or network failure:
	•	Show an inline error message on /checkout.
	•	Do not redirect to Paytrail.
	•	Log to console or external logger if needed.
	•	Allow user to try again, but don’t auto-retry in background.

⸻
```