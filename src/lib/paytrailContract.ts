// src/lib/paytrailContract.ts
//
// Frontend-facing contract for the external Paytrail backend that lives in
// Supabase project `rcmmbwdebnmicrweoiyz`.
//
// This file is intentionally LIMITED to types + constants so tools like
// Figma Make / Codex can treat it as the single source of truth when
// generating/wiring frontend code. HTTP implementation can live elsewhere.

export const PAYTRAIL_FUNCTIONS_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PAYTRAIL_FUNCTIONS_BASE) ??
  "https://rcmmbwdebnmicrweoiyz.supabase.co/functions/v1";

export const PAYTRAIL_CREATE_PATH = "/payments_create_paytrail";

export const PAYTRAIL_CREATE_URL =
  PAYTRAIL_FUNCTIONS_BASE + PAYTRAIL_CREATE_PATH;

/**
 * Single Paytrail line item.
 * Mirrors the structure we send to Paytrail itself.
 */
export interface PaytrailCreateItem {
  /** Price in integer cents (e.g. 10000 = €100.00) */
  unitPrice: number;
  /** Number of units */
  units: number;
  /** Product / SKU code */
  productCode: string;
  /** VAT percentage, e.g. 24 */
  vatPercentage: number;
  /** Human-readable description */
  description: string;
}

/**
 * Optional customer information we may send with the payment.
 * Backend may also derive these from existing order data.
 */
export interface PaytrailCustomer {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Request body for POST /payments_create_paytrail
 *
 * NOTE:
 * - Most fields are optional to keep this contract compatible with
 *   server-driven/cart-driven flows and test flows.
 * - The backend may ignore or override some fields based on its own logic.
 */
export interface PaytrailCreateRequest {
  /**
   * Cart/session identifier, if frontend tracks carts explicitly.
   * Optional: backend may also infer the cart from cookies or other context.
   */
  session_id?: string;

  /**
   * Optional explicit items to use for this payment.
   * If omitted, backend may derive items from the current cart or order.
   */
  items?: PaytrailCreateItem[];

  /**
   * Optional customer details. If omitted, backend may use stored order data.
   */
  customer?: PaytrailCustomer;

  /**
   * URL to redirect to on success (what Paytrail will use).
   * Example: "https://mitra-auto.fi/checkout/success"
   */
  return_url?: string;

  /**
   * URL to redirect to on cancel/failure.
   * Example: "https://mitra-auto.fi/checkout/cancel"
   */
  cancel_url?: string;

  /**
   * Optional free-form metadata. Passed through to logs / DB.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Successful response payload from /payments_create_paytrail
 */
export interface PaytrailCreateSuccessPayload {
  ok: true;

  /** Internal order ID in our DB */
  order_id: string;

  /** Paytrail transaction ID returned from Paytrail */
  transaction_id: string;

  /** URL where the frontend should redirect the user to complete payment */
  redirect_url: string;

  /** Internal stamp associated with this payment (for matching webhooks) */
  stamp: string;

  /** Human-readable reference such as "ORDER-<uuid>" */
  reference: string;

  /** Total amount of the payment in cents */
  total_cents: number;

  /** Currency code, typically "EUR" */
  currency: string;

  /** Backend build/version marker, useful for debugging */
  version: string;
}

/**
 * Error response payload from /payments_create_paytrail
 *
 * The backend attempts to always respond with this shape on logical errors
 * or Paytrail API errors. Network-level failures may still result in the
 * frontend seeing a non-JSON/5xx response, so callers must handle that.
 */
export interface PaytrailCreateErrorDetails {
  /** Raw status from Paytrail or internal error categorisation */
  status?: string;
  /** Optional list of messages from Paytrail schema validation etc. */
  meta?: string[] | Record<string, unknown>[];
}

export interface PaytrailCreateErrorPayload {
  ok: false;

  /**
   * High-level error category, e.g.:
   * - "paytrail_error"
   * - "validation_error"
   * - "network_error"
   */
  error: string;

  /** Human-readable error message safe to show to users */
  message: string;

  /** Optional machine-readable error details */
  details?: PaytrailCreateErrorDetails;

  /** Backend build/version marker */
  version?: string;
}

/**
 * Union type for the create payment response.
 */
export type PaytrailCreateResponsePayload =
  | PaytrailCreateSuccessPayload
  | PaytrailCreateErrorPayload;

/**
 * Helper type guard to check if the response is successful.
 */
export function isPaytrailCreateSuccess(
  payload: PaytrailCreateResponsePayload
): payload is PaytrailCreateSuccessPayload {
  return payload.ok === true;
}

/**
 * Optional convenience type for an order summary that a separate
 * endpoint may return (not strictly part of the Paytrail create
 * function, but useful for success/cancel pages).
 *
 * This is intentionally minimal; the actual summary endpoint can extend it.
 */
export interface OrderSummary {
  order_id: string;
  status: "draft" | "submitted" | "paid" | "cancelled" | "failed" | string;
  paytrail_status?: string | null;
  paytrail_transaction_id?: string | null;
  total_cents: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Example shape for a future order summary response.
 * (Documented here so frontend code generators have a starting point.)
 */
export interface OrderSummaryResponse {
  ok: boolean;
  order?: OrderSummary;
  error?: string;
  message?: string;
}