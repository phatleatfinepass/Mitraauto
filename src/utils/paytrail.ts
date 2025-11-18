const ORDER_REFERENCE_PREFIX = 'ORDER-';
const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type ParsedCheckoutReference = {
  rawReference: string | null;
  referenceWithoutPrefix: string | null;
  normalizedOrderId: string | null;
  isLikelyUuid: boolean;
};

export function parseCheckoutReference(reference: string | null): ParsedCheckoutReference {
  if (!reference) {
    return {
      rawReference: null,
      referenceWithoutPrefix: null,
      normalizedOrderId: null,
      isLikelyUuid: false,
    };
  }

  const trimmed = reference.trim();
  const referenceWithoutPrefix = trimmed.startsWith(ORDER_REFERENCE_PREFIX)
    ? trimmed.slice(ORDER_REFERENCE_PREFIX.length)
    : trimmed;

  const normalizedOrderId = referenceWithoutPrefix.length > 0
    ? referenceWithoutPrefix.toLowerCase()
    : null;

  return {
    rawReference: reference,
    referenceWithoutPrefix,
    normalizedOrderId,
    isLikelyUuid: normalizedOrderId ? UUID_PATTERN.test(normalizedOrderId) : false,
  };
}