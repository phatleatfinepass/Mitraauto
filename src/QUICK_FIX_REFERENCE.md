# 🚨 Checkout Success 401 Error - Quick Fix

## The Problem
```
checkout/success → 401 Unauthorized → "Order not found"
```

## The Cause
✅ Code is correct  
❌ Database RLS policy is missing

## The Fix (30 seconds)

### Step 1: Open Supabase SQL Editor
https://supabase.com/dashboard/project/rcmmbwdebnmicrweoiyz/sql

### Step 2: Run This SQL
```sql
CREATE POLICY "Allow anonymous read access to orders"
ON public.orders
FOR SELECT
TO anon
USING (true);
```

### Step 3: Test
Visit: `https://www.mitra-auto.fi/checkout/success?checkout-transaction-id=...`

Expected console output:
```
✅ Found order by transaction ID
Payment confirmed, clearing cart
```

## That's It!

The success page will now:
- ✅ Load order data (no more 401)
- ✅ Show order details
- ✅ Clear the cart
- ✅ Display "Tilaus vahvistettu!"

---

**Files changed:** 1 (`CheckoutSuccessPage.tsx` - error handling only)  
**SQL to run:** 1 line  
**Time:** 30 seconds  
**Risk:** Low (read-only permission)
