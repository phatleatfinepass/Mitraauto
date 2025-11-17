# Mitra Auto Checkout Flow - Visual Diagram

## Payment Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MITRA AUTO FRONTEND                         │
│                    (React + Tailwind + Next.js)                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌──────────────────┐          ┌──────────────────┐
         │   Cart Context   │          │  Local Storage   │
         │                  │          │                  │
         │  - items[]       │◄────────►│ mitra-auto-cart  │
         │  - totalPrice    │          │                  │
         │  - addToCart()   │          └──────────────────┘
         │  - clearCart()   │
         └────────┬─────────┘
                  │
                  │ User clicks "Checkout"
                  │
                  ▼
         ┌──────────────────┐
         │  CartDrawer      │
         │                  │
         │ [Checkout] ──────┼──► navigate('/checkout')
         └──────────────────┘
                  │
                  ▼
         ┌──────────────────────────────────────────────┐
         │           CheckoutPage                       │
         │  /checkout                                   │
         │                                              │
         │  Form:                                       │
         │  ├─ Contact Info (name, email, phone)       │
         │  ├─ Shipping Address                        │
         │  ├─ Billing Address                         │
         │  └─ Terms Acceptance ✓                      │
         │                                              │
         │  [Proceed to Payment] ──────────────────────┼──┐
         └──────────────────────────────────────────────┘  │
                                                            │
                                                            │ API Call
                                                            │
                  ┌─────────────────────────────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────────────────────────┐
    │      POST /payments_create_paytrail                     │
    │      https://rcmmbwdebnmicrweoiyz.functions.supabase.co │
    │                                                          │
    │  Request:                                               │
    │  {                                                      │
    │    items: [{                                            │
    │      unitPrice: 10000,    // cents                      │
    │      units: 4,                                          │
    │      productCode: "TIRE-001",                           │
    │      vatPercentage: 25.5,                               │
    │      description: "Nokian Hakkapeliitta R5"             │
    │    }],                                                  │
    │    customer: { email, phone, firstName, lastName },     │
    │    return_url: "/checkout/success",                     │
    │    cancel_url: "/checkout/cancel"                       │
    │  }                                                      │
    └────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼ Success                 ▼ Error
    ┌───────────────┐         ┌──────────────┐
    │  { ok: true } │         │ { ok: false }│
    │  order_id     │         │  error       │
    │  redirect_url │         │  message     │
    └───────┬───────┘         └──────┬───────┘
            │                        │
            │ Store order_id         │ Show error toast
            │ in sessionStorage      │ Stay on /checkout
            │                        │ Allow retry
            ▼                        │
    window.location.href =           │
    response.redirect_url            │
            │                        │
            ▼                        ▼
    ┌────────────────────────────────────────┐
    │         PAYTRAIL PAYMENT PAGE          │
    │     (External - payment.paytrail.com)  │
    │                                        │
    │  User selects payment method:          │
    │  ├─ Credit Card (Visa, Mastercard)     │
    │  ├─ Online Banking                     │
    │  ├─ Mobile Payment                     │
    │  └─ Invoice (for businesses)           │
    │                                        │
    │  [Complete Payment] or [Cancel]        │
    └────────┬──────────────────┬────────────┘
             │                  │
             │ Success          │ Cancel
             │                  │
             ▼                  ▼
    ┌────────────────┐   ┌────────────────┐
    │ Redirect to:   │   │ Redirect to:   │
    │ /checkout/     │   │ /checkout/     │
    │   success      │   │   cancel       │
    │                │   │                │
    │ + Query params │   │ + Query params │
    │   from Paytrail│   │   from Paytrail│
    └────────┬───────┘   └────────┬───────┘
             │                    │
             ▼                    ▼
    ┌────────────────────┐ ┌──────────────────────┐
    │ CheckoutSuccessPage│ │ CheckoutCancelPage   │
    │                    │ │                      │
    │ ✓ Order Received!  │ │ ⚠ Payment Cancelled  │
    │                    │ │                      │
    │ Display:           │ │ Display:             │
    │ - Order ID         │ │ - What happened      │
    │ - Payment method   │ │ - Next steps         │
    │ - Delivery time    │ │ - Retry option       │
    │ - Next steps       │ │ - Cart preserved     │
    │                    │ │                      │
    │ localStorage:      │ │ localStorage:        │
    │ CLEAR cart ✓       │ │ KEEP cart ✓          │
    │                    │ │                      │
    │ [Return Home]      │ │ [Return to Cart]     │
    └────────────────────┘ │ [Return Home]        │
                           └──────────────────────┘
```

---

## Error Handling Flow

```
┌────────────────────────────────────────────┐
│         Payment Creation Errors            │
└────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │Network │  │Paytrail│  │Backend │
   │ Error  │  │ Error  │  │ Error  │
   └────┬───┘  └────┬───┘  └────┬───┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Show error toast    │
         │  Keep user on        │
         │  /checkout page      │
         │  Button re-enabled   │
         │  Allow retry         │
         └──────────────────────┘

┌────────────────────────────────────────────┐
│         Fatal System Errors                │
└────────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Redirect to:        │
         │  /checkout/error     │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ CheckoutErrorPage    │
         │                      │
         │ ❌ Something Went    │
         │    Wrong             │
         │                      │
         │ Display:             │
         │ - Possible reasons   │
         │ - Troubleshooting    │
         │ - Support contact    │
         │                      │
         │ [Retry Checkout]     │
         │ [Return Home]        │
         └──────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   CART ITEM STRUCTURE                    │
└──────────────────────────────────────────────────────────┘
         │
         │ CartItem {
         │   id: string
         │   product: { brand, model, price, ... }
         │   quantity: number
         │   price: number  // EUR as float
         │ }
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              CONVERSION TO PAYTRAIL FORMAT               │
│  lib/paytrailClient.ts → CheckoutPage.tsx                │
└──────────────────────────────────────────────────────────┘
         │
         │ PaytrailCreateItem {
         │   unitPrice: number        // CENTS as integer
         │   units: number
         │   productCode: string
         │   vatPercentage: 25.5
         │   description: string
         │ }
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                    API REQUEST BODY                      │
└──────────────────────────────────────────────────────────┘
         │
         │ {
         │   items: PaytrailCreateItem[]
         │   customer: { email, phone, firstName, lastName }
         │   return_url: string
         │   cancel_url: string
         │   metadata: { shipping, language, notes, ... }
         │ }
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                EXTERNAL PAYTRAIL BACKEND                 │
│         (Supabase Edge Function + Postgres)              │
└──────────────────────────────────────────────────────────┘
         │
         │ Creates:
         │ - orders row (public.orders)
         │ - payment_events row
         │ - Paytrail payment via API
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                     API RESPONSE                         │
└──────────────────────────────────────────────────────────┘
         │
         │ {
         │   ok: true,
         │   order_id: "uuid",
         │   transaction_id: "paytrail-id",
         │   redirect_url: "https://payment.paytrail.com/...",
         │   stamp: "internal-stamp",
         │   reference: "ORDER-xxx",
         │   total_cents: 10000,
         │   currency: "EUR"
         │ }
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND HANDLING                      │
└──────────────────────────────────────────────────────────┘
         │
         │ sessionStorage.setItem('mitra_last_order_id', order_id)
         │ window.location.href = redirect_url
         │
         └─► Redirect to Paytrail
```

---

## Session Storage Usage

```
┌─────────────────────────────────────────────┐
│          SESSION STORAGE KEYS               │
└─────────────────────────────────────────────┘

Key: 'mitra_last_order_id'
├─ Set: When payment created successfully
├─ Value: UUID of order (e.g., "a1b2c3d4-...")
├─ Used by: CheckoutSuccessPage to display order number
└─ Cleared: On new checkout or browser close

Purpose:
- Persist order ID across Paytrail redirect
- Display on success page
- No sensitive data (just ID reference)
- Temporary storage (session only)
```

---

## Local Storage Usage

```
┌─────────────────────────────────────────────┐
│           LOCAL STORAGE KEYS                │
└─────────────────────────────────────────────┘

Key: 'mitra-auto-cart'
├─ Set: Whenever cart changes
├─ Value: JSON array of CartItem[]
├─ Managed by: CartContext
├─ Cleared: Only on successful payment
└─ Preserved: On cancel or error

Purpose:
- Persist cart across page refreshes
- Preserve cart during payment flow
- Allow recovery after cancel/error
- Clear only on confirmed purchase
```

---

## Routing Configuration

```
┌─────────────────────────────────────────────────────────┐
│                   APP.TSX ROUTING                       │
└─────────────────────────────────────────────────────────┘

Route: /checkout
├─ Component: CheckoutPage
├─ Purpose: Collect customer info, create payment
├─ Access: From CartDrawer "Checkout" button
└─ Next: Redirect to Paytrail or show error

Route: /checkout/success
├─ Component: CheckoutSuccessPage
├─ Purpose: Confirm successful payment
├─ Access: Redirect from Paytrail after payment
└─ Actions: Clear cart, show order details

Route: /checkout/cancel
├─ Component: CheckoutCancelPage
├─ Purpose: Handle payment cancellation
├─ Access: Redirect from Paytrail if cancelled
└─ Actions: Preserve cart, offer retry

Route: /checkout/error
├─ Component: CheckoutErrorPage
├─ Purpose: Handle fatal errors
├─ Access: Navigate on system errors
└─ Actions: Show support info, retry option
```

---

## Component Hierarchy

```
App.tsx
├─── ThemeProvider
│    └─── LanguageProvider
│         └─── CartProvider
│              ├─── Navbar
│              ├─── CartDrawer
│              │    └─── [Checkout Button]
│              │         └─── navigate('/checkout')
│              │
│              ├─── CheckoutPage (/checkout)
│              │    ├─── Contact Info Form
│              │    ├─── Shipping Address Form
│              │    ├─── Billing Address Form
│              │    ├─── Terms Checkbox
│              │    └─── [Proceed to Payment]
│              │         └─── createPaytrailPayment()
│              │              ├─── Success → redirect
│              │              └─── Error → toast
│              │
│              ├─── CheckoutSuccessPage (/checkout/success)
│              │    ├─── Success Icon
│              │    ├─── Order Details
│              │    ├─── Next Steps
│              │    └─── [Return Home]
│              │
│              ├─── CheckoutCancelPage (/checkout/cancel)
│              │    ├─── Cancel Icon
│              │    ├─── Explanation
│              │    ├─── Options
│              │    └─── [Return to Cart] | [Return Home]
│              │
│              └─── CheckoutErrorPage (/checkout/error)
│                   ├─── Error Icon
│                   ├─── Troubleshooting
│                   ├─── Support Info
│                   └─── [Retry] | [Return Home]
│
└─── Footer
```

---

## State Management

```
┌──────────────────────────────────────────────────────────┐
│                   CART CONTEXT STATE                     │
└──────────────────────────────────────────────────────────┘

State:
├─ items: CartItem[]
├─ totalItems: number (computed)
├─ totalPrice: number (computed)
└─ isCartOpen: boolean

Actions:
├─ addToCart(product, quantity)
├─ removeFromCart(itemId)
├─ updateQuantity(itemId, quantity)
├─ clearCart()
└─ setIsCartOpen(open)

Persistence:
├─ Load: From localStorage on mount
├─ Save: To localStorage on every change
└─ Clear: On successful payment only

┌──────────────────────────────────────────────────────────┐
│                  APP.TSX LOCAL STATE                     │
└──────────────────────────────────────────────────────────┘

State:
├─ currentPage: string
│  ├─ 'home'
│  ├─ 'checkout'
│  ├─ 'checkout-success'
│  ├─ 'checkout-cancel'
│  └─ 'checkout-error'
│
└─ Navigation controlled by:
   ├─ URL path changes
   ├─ Browser back/forward
   └─ Programmatic navigate() calls
```

This comprehensive flow documentation should help any developer understand the complete payment integration architecture! 🚀
