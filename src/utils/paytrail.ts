export interface ParsedCheckoutReference {
  raw: string | null;
  normalizedOrderId: string | null;
}

/**
 * Extracts the order UUID from the Paytrail `checkout-reference` value.
 *
 * Paytrail sends a reference in the format `ORDER-{uuid}` which maps directly
 * to `orders.id`. This helper safely strips the prefix and returns the UUID
 * when available.
 */
export function parseCheckoutReference(reference: string | null): ParsedCheckoutReference {
  const prefix = 'ORDER-';

  if (!reference) {
    return { raw: reference, normalizedOrderId: null };
  }

  if (reference.startsWith(prefix)) {
    return { raw: reference, normalizedOrderId: reference.slice(prefix.length) };
  }

  return { raw: reference, normalizedOrderId: null };
}