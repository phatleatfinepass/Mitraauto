# Paytrail Integration - Testing Guide

## Quick Start Testing

### Prerequisites
- Frontend running on localhost or deployed
- Paytrail backend deployed at `https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1`
- Environment variables configured (if needed)

---

## 🧪 Test Scenarios

### 1. Happy Path - Successful Payment

**Steps:**
1. Navigate to `/catalog` (Tires or Rims catalog)
2. Click on any product
3. On product detail page, select quantity (default: 4)
4. Click "Add to Cart"
5. Click shopping cart icon in navbar
6. Cart drawer opens - verify items displayed
7. Click "Proceed to Payment" button
8. Checkout page loads at `/checkout`
9. Fill in the form:
   ```
   Contact Information:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: +358401234567
   
   Shipping Address:
   - Address: Teollisuustie 1
   - City: Helsinki
   - Postal Code: 00510
   
   Billing Address:
   - [x] Same as shipping address
   
   Terms:
   - [x] I accept the terms and conditions
   ```
10. Click "Proceed to Payment" (Finnish: "Siirry maksamaan")
11. **Verify**:
    - Button shows "Processing..." (Finnish: "Käsitellään...")
    - Toast notification appears: "Redirecting to payment service..."
    - Page redirects to Paytrail payment page
12. On Paytrail page:
    - Select any payment method (test card, bank, etc.)
    - Complete payment
13. **Verify redirect** to `/checkout/success`
14. **Verify success page**:
    - ✓ Green checkmark icon
    - "Order Received!" title
    - Order number displayed
    - Payment method: "Paytrail Payment"
    - Estimated delivery: "1-3 business days"
    - Next steps listed
    - Email confirmation notice
    - Support contact info
15. **Verify cart cleared**:
    - Click shopping cart icon
    - Cart should be empty
16. Click "Return to Homepage"
17. **Verify** navigation to `/` (homepage)

**Expected Result:** ✅ Complete payment flow with order confirmation

---

### 2. Cancel Payment Flow

**Steps:**
1. Add product to cart (same as above, steps 1-4)
2. Open cart and click "Proceed to Payment"
3. Fill checkout form (step 9 above)
4. Click "Proceed to Payment"
5. On Paytrail page, click "Cancel" or "Back" button
6. **Verify redirect** to `/checkout/cancel`
7. **Verify cancel page**:
    - ⚠️ Orange warning icon
    - "Payment Cancelled" title
    - Explanation of what happened
    - Possible reasons listed
    - Next steps provided
    - Support contact info
8. Click "Return to Cart" button
9. **Verify**:
    - Cart drawer opens
    - Items still in cart (not cleared)
10. Try checkout again if desired

**Expected Result:** ✅ Payment cancelled, cart preserved, user can retry

---

### 3. Validation Errors

**Steps:**
1. Add product to cart
2. Open cart and click "Proceed to Payment"
3. On checkout page, **do not fill any fields**
4. Try to click "Proceed to Payment"
5. **Verify**:
    - Button is disabled (grayed out)
    - No API call made
6. Fill in some fields but leave required ones empty
7. Try to submit
8. **Verify**:
    - HTML5 validation kicks in
    - Browser shows "Please fill out this field"
9. Fill all fields but **do not check terms**
10. Click "Proceed to Payment"
11. **Verify**:
    - Error toast appears
    - Message: "You must accept the terms and conditions to continue"
    - User stays on checkout page
    - No API call made

**Expected Result:** ✅ Proper validation before API call

---

### 4. Network Error Simulation

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Enable "Offline" mode
4. Add product to cart and proceed to checkout
5. Fill form completely
6. Click "Proceed to Payment"
7. **Verify**:
    - Error toast appears
    - Message: "Connection error to payment service. Please try again."
    - Button re-enabled
    - User stays on checkout page
8. Disable offline mode
9. Click "Proceed to Payment" again
10. **Verify**: Payment proceeds normally

**Expected Result:** ✅ Graceful error handling with retry option

---

### 5. Empty Cart Protection

**Steps:**
1. Navigate to `/checkout` directly (URL bar)
2. **Verify**:
    - If cart is empty, API call should not proceed
    - Error toast: "Cart is empty"
3. Or manually clear localStorage:
   ```javascript
   localStorage.removeItem('mitra-auto-cart')
   ```
4. Try to checkout
5. **Verify**: Proper error handling

**Expected Result:** ✅ Cannot checkout with empty cart

---

### 6. Back Button / Browser Navigation

**Steps:**
1. Complete steps to reach checkout page
2. Click browser back button
3. **Verify**:
    - Returns to previous page (cart or catalog)
    - Cart still has items
4. Navigate forward
5. **Verify**:
    - Returns to checkout page
    - Form data may be cleared (expected)
6. After successful payment on success page
7. Click browser back button
8. **Verify**:
    - Can navigate back
    - Cart should already be cleared

**Expected Result:** ✅ Proper browser history handling

---

### 7. Mobile Responsiveness

**Test on different viewports:**

**Mobile (375px)**
1. Open DevTools → Device Toolbar (Ctrl+Shift+M)
2. Select iPhone 12 Pro or similar
3. Go through complete checkout flow
4. **Verify**:
    - All buttons accessible
    - Form fields properly sized
    - No horizontal scroll
    - Touch targets ≥44px
    - Cart drawer slides in from right
    - Order summary stacks on top

**Tablet (768px)**
1. Select iPad or similar
2. Repeat checkout flow
3. **Verify**:
    - Layout adapts properly
    - Two-column form where appropriate
    - Sidebar visible

**Desktop (1920px)**
1. Full screen
2. Repeat checkout flow
3. **Verify**:
    - Max-width containers
    - Order summary sticky sidebar
    - Optimal reading width

**Expected Result:** ✅ Fully responsive on all devices

---

### 8. Bilingual Support

**Finnish Language:**
1. Click language toggle (FI)
2. Navigate to checkout
3. **Verify all labels in Finnish**:
    - "Kassa"
    - "Yhteystiedot"
    - "Toimitusosoite"
    - "Siirry maksamaan"
4. Complete checkout
5. **Verify success page in Finnish**:
    - "Tilaus vastaanotettu!"
    - "Kiitos tilauksestasi"

**English Language:**
1. Click language toggle (EN)
2. Navigate to checkout
3. **Verify all labels in English**:
    - "Checkout"
    - "Contact Information"
    - "Shipping Address"
    - "Proceed to Payment"
4. Complete checkout
5. **Verify success page in English**:
    - "Order Received!"
    - "Thank you for your order"

**Expected Result:** ✅ Complete bilingual support

---

### 9. Theme Switching

**Dark Theme:**
1. Click theme toggle (moon icon)
2. Navigate to checkout
3. **Verify**:
    - Dark background (#11141A)
    - Light text
    - Proper contrast
    - Form inputs with dark styling
    - Hover states visible

**Light Theme:**
1. Click theme toggle (sun icon)
2. Navigate to checkout
3. **Verify**:
    - White background
    - Dark text
    - Proper contrast
    - Clean, minimal design

**Expected Result:** ✅ Theme consistency across all pages

---

### 10. Error Page Testing

**Simulate Fatal Error:**
1. Modify `/lib/paytrailClient.ts` temporarily to always throw:
   ```typescript
   throw new Error('Simulated fatal error');
   ```
2. Try to checkout
3. **Verify**:
    - Error handling catches it
    - Error toast shown
    - User stays on checkout
4. Navigate manually to `/checkout/error`
5. **Verify error page**:
    - ❌ Red alert icon
    - "Something Went Wrong" title
    - Troubleshooting steps
    - Support information
    - Retry and return buttons
6. Click "Try Again"
7. **Verify**: Returns to `/checkout`
8. Revert code changes

**Expected Result:** ✅ Proper error page display

---

## 🔍 Browser DevTools Checks

### Console Logs
Open Console and look for:
```
✓ "Paytrail payment created successfully: { order_id: ..., transaction_id: ... }"
✓ No errors in console
✓ No 404s for missing files
✓ No CORS errors
```

### Network Tab
Check the API call:
```
Request:
POST /payments_create_paytrail
Status: 200 OK

Request Headers:
Content-Type: application/json

Request Body:
{
  "items": [...],
  "customer": {...},
  "return_url": "...",
  "cancel_url": "..."
}

Response:
{
  "ok": true,
  "order_id": "...",
  "redirect_url": "..."
}
```

### Application Tab
Check Storage:

**Session Storage:**
```
mitra_last_order_id: "a1b2c3d4-e5f6-7890-..."
```

**Local Storage:**
```
mitra-auto-cart: "[{...}]"  // Before success
mitra-auto-cart: (empty)     // After success
```

---

## 📊 Test Coverage Checklist

- [ ] Happy path - complete purchase
- [ ] Cancel payment
- [ ] Form validation errors
- [ ] Network errors
- [ ] Empty cart protection
- [ ] Browser navigation (back/forward)
- [ ] Mobile responsiveness (320px, 375px, 414px)
- [ ] Tablet responsiveness (768px, 1024px)
- [ ] Desktop responsiveness (1920px+)
- [ ] Finnish language
- [ ] English language
- [ ] Dark theme
- [ ] Light theme
- [ ] Error page
- [ ] Success page content
- [ ] Cancel page content
- [ ] Cart preservation on cancel
- [ ] Cart clearing on success
- [ ] Order ID display
- [ ] Support contact info
- [ ] Return navigation
- [ ] Toast notifications
- [ ] Loading states
- [ ] Button disabled states
- [ ] API request format
- [ ] API response handling

---

## 🐛 Known Issues / Edge Cases

### Edge Case 1: Double Click Prevention
**Issue**: User rapidly clicks "Proceed to Payment"
**Solution**: Button disabled during API call
**Test**: Try clicking button multiple times quickly

### Edge Case 2: Session Timeout
**Issue**: Long time on Paytrail page
**Solution**: Order ID stored in sessionStorage (persists)
**Test**: Leave Paytrail page open for 30+ minutes

### Edge Case 3: Direct URL Access
**Issue**: User navigates directly to `/checkout/success`
**Solution**: Order ID from sessionStorage displayed if available
**Test**: Navigate to `/checkout/success` manually

### Edge Case 4: Browser Refresh
**Issue**: User refreshes page during checkout
**Solution**: Form data cleared, cart preserved
**Test**: Refresh checkout page with F5

---

## 📞 Support & Debugging

If you encounter issues:

1. **Check Console Logs**: Open DevTools Console for error messages
2. **Check Network Tab**: Verify API request/response
3. **Check Application Storage**: Verify sessionStorage and localStorage
4. **Try Different Browser**: Test in Chrome, Firefox, Safari
5. **Clear Cache**: Ctrl+Shift+Delete or Cmd+Shift+Delete
6. **Disable Extensions**: Test in Incognito/Private mode

**Contact Support:**
- Email: info@mitraauto.fi
- Phone: +358 40 123 4567

---

## ✅ Success Criteria

A successful test means:
- ✓ User can complete purchase
- ✓ Order ID is generated and stored
- ✓ Redirect to Paytrail works
- ✓ Redirect back to success page works
- ✓ Cart is cleared on success
- ✓ Cart is preserved on cancel
- ✓ All error cases handled gracefully
- ✓ Mobile and desktop responsive
- ✓ Both languages work
- ✓ Both themes work
- ✓ No console errors
- ✓ Proper user feedback at each step

---

**Happy Testing! 🚀**
