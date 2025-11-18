# Checkout Success Page - Audit Report

## Problem

After completing payment, user is redirected to:
```
https://www.mitra-auto.fi/checkout/success?checkout-reference=ORDER-462ad2b4-c9b4-4c77-b709-e0b9bc8a42d0&checkout-status=ok&...
```

But sees: **"Order not found"** error.

## Root Cause Analysis

### 1. URL Parameters Received
- `checkout-reference`: `ORDER-462ad2b4-c9b4-4c77-b709-e0b9bc8a42d0`
- `checkout-status`: `ok`
- `checkout-transaction-id`: `4f99c471-ae52-4064-a4b4-7b245dc0071f`

### 2. Parsing Flow (Current)

**Step 1**: Parse checkout-reference
```typescript
const parsedReference = parseCheckoutReference(checkoutReference);
// Input: "ORDER-462ad2b4-c9b4-4c77-b709-e0b9bc8a42d0"
```

**Step 2**: Extract and normalize
```typescript
const referenceWithoutPrefix = "462ad2b4-c9b4-4c77-b709-e0b9bc8a42d0"
const normalizedOrderId = referenceWithoutPrefix.toLowerCase()
// Result: "462ad2b4-c9b4-4c77-b709-e0b9bc8a42d0" (already lowercase)
```

**Step 3**: Query database
```typescript
await supabase
  .from('orders')
  .select('*')
  .eq('id', '462ad2b4-c9b4-4c77-b709-e0b9bc8a42d0')
  .maybeSingle();
```

### 3. Potential Issues

#### Issue A: Database might not have this order
- Backend may have failed to create the order
- Order might be in a different table
- Order ID in database might be different

#### Issue B: UUID Format Mismatch
- PostgreSQL UUID type is case-insensitive for storage
- Supabase JS client might have case-sensitivity issues
- UUIDs should be compared case-insensitively

#### Issue C: Timing Issue
- Order might not be created yet when success page loads
- Webhook might still be processing
- There could be a race condition

#### Issue D: Wrong Field Query
- We're querying by `orders.id`
- But the backend might be storing it in a different field
- Or using a different UUID altogether

## Diagnostic Steps Needed

### 1. Add Comprehensive Logging

```typescript
console.log('=== CHECKOUT SUCCESS DEBUG ===');
console.log('Raw checkout-reference:', checkoutReference);
console.log('Parsed reference:', parsedReference);
console.log('Order ID to query:', orderId);
console.log('Is likely UUID?', parsedReference.isLikelyUuid);
```

### 2. Try Multiple Query Strategies

```typescript
// Strategy 1: Query by ID (current)
const byId = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .maybeSingle();

console.log('Query by ID result:', byId);

// Strategy 2: Query by transaction ID
const byTransaction = await supabase
  .from('orders')
  .select('*')
  .eq('paytrail_transaction_id', checkoutTransactionId)
  .maybeSingle();

console.log('Query by transaction ID result:', byTransaction);

// Strategy 3: Query by stamp
const checkoutStamp = params.get('checkout-stamp');
const byStamp = await supabase
  .from('orders')
  .select('*')
  .eq('paytrail_stamp', checkoutStamp)
  .maybeSingle();

console.log('Query by stamp result:', byStamp);

// Strategy 4: List recent orders
const recentOrders = await supabase
  .from('orders')
  .select('id, paytrail_transaction_id, paytrail_stamp, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Recent orders:', recentOrders);
```

### 3. Check Database Schema

Verify these fields exist:
- `orders.id` (UUID, primary key)
- `orders.paytrail_transaction_id` (UUID)
- `orders.paytrail_stamp` (UUID)
- `orders.paytrail_status` (text)
- `orders.status` (text)

## Recommended Fix

Since the `checkout-transaction-id` is unique and always present in the Paytrail redirect, we should:

1. **Primary strategy**: Query by `paytrail_transaction_id`
2. **Fallback strategy**: Query by `paytrail_stamp`
3. **Last resort**: Query by extracted order ID from reference

This is more robust because:
- Transaction ID is guaranteed by Paytrail
- It's unique per transaction
- It doesn't rely on reference parsing

## Implementation

```typescript
// 1. Extract all identifiers
const checkoutTransactionId = params.get('checkout-transaction-id');
const checkoutStamp = params.get('checkout-stamp');
const checkoutReference = params.get('checkout-reference');

// 2. Try transaction ID first (most reliable)
let order = null;

if (checkoutTransactionId) {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('paytrail_transaction_id', checkoutTransactionId)
    .maybeSingle();
  
  order = data;
  console.log('Found by transaction ID:', !!order);
}

// 3. Fallback to stamp
if (!order && checkoutStamp) {
  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('paytrail_stamp', checkoutStamp)
    .maybeSingle();
  
  order = data;
  console.log('Found by stamp:', !!order);
}

// 4. Last resort: reference-based lookup
if (!order) {
  const parsedReference = parseCheckoutReference(checkoutReference);
  const orderId = parsedReference.normalizedOrderId;
  
  if (orderId) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    
    order = data;
    console.log('Found by ID from reference:', !!order);
  }
}
```

## Testing Checklist

- [ ] Can find order by transaction ID
- [ ] Can find order by stamp
- [ ] Can find order by reference-derived ID
- [ ] Shows appropriate error if truly not found
- [ ] Clears cart only when order is confirmed paid
- [ ] Works for both paid and pending statuses

## Next Steps

1. Apply the multi-strategy lookup fix
2. Add comprehensive error logging
3. Test with a real Paytrail redirect
4. Verify cart clearing behavior
5. Document which lookup strategy works in production
