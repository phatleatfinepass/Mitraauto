-- ============================================================================
-- SAFE RPC FOR CHECKOUT SUCCESS PAGE
-- ============================================================================
-- Run this SQL in the Supabase SQL editor for project rcmmbwdebnmicrweoiyz.
-- It creates a lean view type plus a SECURITY DEFINER function that allows the
-- frontend checkout success page to fetch a single order by Paytrail params
-- without relaxing RLS policies on the orders table.
-- ============================================================================

-- 1) Create a narrow composite type that exposes only the fields needed by the
--    checkout confirmation UI.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'order_public_view'
  ) THEN
    CREATE TYPE public.order_public_view AS (
      id uuid,
      status order_status,
      paytrail_status paytrail_status,
      paytrail_stamp text,
      paytrail_reference text,
      paytrail_transaction_id text,
      total_cents integer,
      grand_total_cents integer,
      currency currency_code,
      cart_snapshot jsonb,
      customer_first_name text,
      customer_last_name text,
      customer_email text,
      customer_phone text,
      created_at timestamptz,
      updated_at timestamptz
    );
  END IF;
END $$;

-- 2) SECURITY DEFINER function that looks up the order by any of the Paytrail
--    identifiers or the direct order ID derived from checkout-reference.
CREATE OR REPLACE FUNCTION public.get_order_for_checkout_result(
  p_checkout_stamp text DEFAULT NULL,
  p_transaction_id text DEFAULT NULL,
  p_order_id uuid DEFAULT NULL
)
RETURNS public.order_public_view
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.order_public_view;
BEGIN
  SELECT
    o.id,
    o.status,
    o.paytrail_status,
    o.paytrail_stamp,
    o.paytrail_reference,
    o.paytrail_transaction_id,
    o.total_cents,
    o.grand_total_cents,
    o.currency,
    o.cart_snapshot,
    o.customer_first_name,
    o.customer_last_name,
    o.customer_email,
    o.customer_phone,
    o.created_at,
    o.updated_at
  INTO v_row
  FROM public.orders o
  WHERE
        (p_transaction_id IS NOT NULL AND o.paytrail_transaction_id = p_transaction_id)
     OR (p_checkout_stamp  IS NOT NULL AND o.paytrail_stamp            = p_checkout_stamp)
     OR (p_order_id        IS NOT NULL AND o.id                        = p_order_id)
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found'
      USING ERRCODE = 'NO_DATA_FOUND';
  END IF;

  RETURN v_row;
END;
$$;

-- 3) Allow the anon role (used by the browser) to execute this RPC while
--    keeping direct table access locked down by RLS policies.
GRANT EXECUTE ON FUNCTION public.get_order_for_checkout_result(text, text, uuid)
TO anon;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
-- Frontend should call:
--   supabase.rpc('get_order_for_checkout_result', {
--     p_checkout_stamp: '<stamp>'
--     p_transaction_id: '<transaction_id>'
--     p_order_id: '<order_uuid>'
--   })
-- Any of the parameters can be null. The function attempts matches in a single
-- query and raises NO_DATA_FOUND if nothing matches. The client can show a
-- dedicated "Order not found" UI for that case, and surface a generic database
-- error for everything else.
-- ============================================================================
