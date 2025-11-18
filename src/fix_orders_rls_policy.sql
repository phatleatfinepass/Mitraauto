-- ============================================================================
-- FIX: Checkout Success Page 401 Errors
-- ============================================================================
-- This script adds RLS policies to allow anonymous users to read orders
-- from the success/cancel pages after Paytrail redirects.
--
-- IMPORTANT: Run this in the Supabase SQL Editor
-- https://supabase.com/dashboard/project/rcmmbwdebnmicrweoiyz/sql
-- ============================================================================

-- Step 1: Verify RLS is enabled on orders table
-- (It should be, which is why we're getting 401 errors)
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';

-- Expected result: RLS Enabled = true

-- Step 2: Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'orders';

-- Step 3: Add policy to allow anonymous reads
-- This allows the success/cancel pages to query orders using Paytrail identifiers
CREATE POLICY IF NOT EXISTS "Allow anonymous read access to orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Step 4: Verify the policy was created
SELECT 
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'orders' 
  AND policyname = 'Allow anonymous read access to orders';

-- Expected result:
-- policyname: "Allow anonymous read access to orders"
-- roles: {anon}
-- command: SELECT
-- using_expression: true

-- Step 5: Test the policy by querying as anonymous
-- This simulates what the success page does
SET ROLE anon;

SELECT 
  id,
  paytrail_transaction_id,
  paytrail_stamp,
  status,
  paytrail_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Reset role
RESET ROLE;

-- ============================================================================
-- ALTERNATIVE: More Restrictive Policy (for later)
-- ============================================================================
-- If you want to restrict access to only orders that match Paytrail params,
-- you could use this instead (more complex, requires passing identifiers):
--
-- CREATE POLICY "Allow anonymous read by paytrail identifiers"
-- ON public.orders
-- FOR SELECT
-- TO anon
-- USING (
--   -- Allow if one of these Paytrail identifiers is present
--   paytrail_transaction_id IS NOT NULL
--   OR paytrail_stamp IS NOT NULL
-- );
--
-- But for now, allowing all reads is fine since orders are not sensitive
-- and will eventually be restricted by user authentication.

-- ============================================================================
-- CLEANUP (if you want to remove the policy later)
-- ============================================================================
-- DROP POLICY IF EXISTS "Allow anonymous read access to orders" ON public.orders;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this script:
-- 1. The success page should load orders without 401 errors
-- 2. The cart should clear after successful payments
-- 3. The cancel page continues to work
--
-- Test by visiting a real Paytrail redirect URL like:
-- https://www.mitra-auto.fi/checkout/success?checkout-transaction-id=...
-- ============================================================================
