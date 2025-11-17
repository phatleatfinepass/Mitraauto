# Paytrail 404 Error - Debugging Guide

## Current Issue

The frontend is getting a **404 Not Found** error when calling the Paytrail backend endpoint.

```
Error: Failed to parse response from payment service (HTTP 404)
URL: https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/payments_create_paytrail
```

---

## What's Been Fixed

✅ **URL Format Corrected**
- Changed from: `https://rcmmbwdebnmicrweoiyz.functions.supabase.co/payments_create_paytrail`
- Changed to: `https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/payments_create_paytrail`

✅ **Better Error Logging**
- Console now shows the exact URL being called
- Raw response text is logged for debugging
- Specific error message for 404 responses

✅ **Improved Error Handling**
- Specific error type for endpoint not found
- User-friendly error messages in both languages
- Developer console shows helpful debugging info

---

## Root Cause

The 404 error means **one of these is true**:

### 1. ❌ The Backend Edge Function Doesn't Exist
The Supabase Edge Function `payments_create_paytrail` has not been deployed to the project `rcmmbwdebnmicrweoiyz`.

**How to verify:**
- Log into Supabase dashboard for project `rcmmbwdebnmicrweoiyz`
- Navigate to Edge Functions
- Check if `payments_create_paytrail` exists

**How to fix:**
- Deploy the Edge Function to the Supabase project
- Ensure it's published and active

### 2. ❌ The Function Name is Wrong
The actual function name might be different from what we're calling.

**Possible actual names:**
- `payments-create-paytrail` (with hyphens instead of underscores)
- `create-paytrail-payment`
- `paytrail`
- Something else entirely

**How to verify:**
- Check the Supabase Edge Functions list in the dashboard
- Look for any function related to payments/paytrail

**How to fix:**
- Update `/lib/paytrailContract.ts`:
  ```typescript
  export const PAYTRAIL_CREATE_PATH = "/actual-function-name";
  ```

### 3. ❌ The Project Reference is Wrong
The project reference `rcmmbwdebnmicrweoiyz` might be incorrect.

**How to verify:**
- Check the Supabase project URL in the dashboard
- The project ref is in the URL: `https://supabase.com/dashboard/project/{PROJECT_REF}`

**How to fix:**
- Update `/lib/paytrailContract.ts`:
  ```typescript
  export const PAYTRAIL_FUNCTIONS_BASE =
    "https://CORRECT_PROJECT_REF.supabase.co/functions/v1";
  ```

### 4. ❌ The Backend is in a Different Supabase Project
The payment backend might be deployed to a completely different Supabase project.

**How to verify:**
- Check where the backend code is actually deployed
- Look for deployment logs or configuration

**How to fix:**
- Get the correct Supabase project URL from the backend team
- Update the URL in `/lib/paytrailContract.ts`

---

## Quick Testing Steps

### Test 1: Check if the Endpoint Exists

Open your browser console and run:

```javascript
fetch('https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/payments_create_paytrail', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
  .then(res => {
    console.log('Status:', res.status);
    return res.text();
  })
  .then(text => console.log('Response:', text))
  .catch(err => console.error('Error:', err));
```

**Expected results:**
- ✅ **If endpoint exists**: Status 200/400/500 (anything except 404)
- ❌ **If endpoint doesn't exist**: Status 404

### Test 2: Check Other Common Function Names

Try these variations:

```javascript
const possibleNames = [
  'payments_create_paytrail',
  'payments-create-paytrail',
  'create-paytrail-payment',
  'create_paytrail_payment',
  'paytrail',
  'payment'
];

for (const name of possibleNames) {
  const url = `https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/${name}`;
  fetch(url, { method: 'POST' })
    .then(res => console.log(`${name}: ${res.status}`))
    .catch(err => console.log(`${name}: error`));
}
```

### Test 3: List All Edge Functions

If you have Supabase CLI:

```bash
supabase functions list --project-ref rcmmbwdebnmicrweoiyz
```

---

## Temporary Mock Solution

Until the backend is deployed, you can use a mock response for testing:

### Option 1: Mock in Client Code

Update `/lib/paytrailClient.ts`:

```typescript
export async function createPaytrailPayment(
  request: PaytrailCreateRequest
): Promise<PaytrailCreateResponsePayload> {
  // TEMPORARY: Mock response for testing
  const USE_MOCK = true; // Set to false when backend is ready
  
  if (USE_MOCK) {
    console.warn('⚠️ Using MOCK payment response (backend not available)');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock success response
    return {
      ok: true,
      order_id: crypto.randomUUID(),
      transaction_id: `MOCK-${Date.now()}`,
      redirect_url: 'https://payment.paytrail.com/mock-payment-page',
      stamp: `stamp-${Date.now()}`,
      reference: `ORDER-${Date.now()}`,
      total_cents: request.items?.reduce((sum, item) => sum + (item.unitPrice * item.units), 0) || 0,
      currency: 'EUR',
      version: 'mock_v1'
    };
  }
  
  // ... rest of the actual implementation
}
```

### Option 2: Use a Demo Backend

If there's a demo/staging Supabase project, update the URL:

```typescript
export const PAYTRAIL_FUNCTIONS_BASE =
  "https://DEMO_PROJECT_REF.supabase.co/functions/v1";
```

---

## What You Should See in Console

When you try to checkout now, you'll see:

```
🔵 Calling Paytrail API: https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/payments_create_paytrail
📤 Request payload: { items: [...], customer: {...}, ... }
📥 Response status: 404 Not Found
📥 Response headers: { ... }
📄 Raw response: "Not Found"
❌ Backend endpoint not found at: https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1/payments_create_paytrail
💡 The Paytrail backend may not be deployed or the URL is incorrect.
💡 Expected URL format: https://{project-ref}.supabase.co/functions/v1/{function-name}
```

This tells you exactly what URL is being called and what the response is.

---

## Next Steps

### Immediate Actions:

1. **Check the Supabase Dashboard**
   - Go to https://supabase.com/dashboard/project/rcmmbwdebnmicrweoiyz
   - Look at Edge Functions section
   - Note the actual function names

2. **Contact Backend Team**
   - Ask for the correct Supabase project reference
   - Ask for the correct Edge Function name
   - Ask if the function is deployed and active

3. **Update Configuration**
   - Once you have the correct info, update `/lib/paytrailContract.ts`
   - Test again

### For Testing Without Backend:

1. **Enable Mock Mode** (see "Temporary Mock Solution" above)
2. **Test the checkout flow** with mock responses
3. **Disable mock** when backend is ready

---

## Environment Variables (Optional)

To make this configurable without code changes, you can use:

```bash
# .env.local
NEXT_PUBLIC_PAYTRAIL_FUNCTIONS_BASE=https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1
```

Then the code will automatically use this URL if set.

---

## Contact Information

If you need help:
- Check the backend repository for deployment status
- Contact the backend developer who set up the Paytrail integration
- Check Supabase project logs for any deployment errors

---

## Summary

The **404 error is expected** if:
- ✅ The backend Edge Function hasn't been deployed yet
- ✅ The function name or project reference is incorrect

The **frontend code is correct** and ready to work once:
- ✅ The backend is deployed
- ✅ The correct URL is configured

The error handling has been improved to:
- ✅ Show clear error messages to users
- ✅ Log helpful debugging info to console
- ✅ Provide guidance on what's wrong
