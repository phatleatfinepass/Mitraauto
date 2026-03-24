export type ParsedCheckoutReference = {
  original: string | null;
  normalizedOrderId: string | null;
};

function maybeUuid(value: string): string | null {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value) ? value : null;
}

export function parseCheckoutReference(reference: string | null | undefined): ParsedCheckoutReference {
  const original = reference ? String(reference).trim() : null;
  if (!original) {
    return { original: null, normalizedOrderId: null };
  }

  const directUuid = maybeUuid(original);
  if (directUuid) {
    return { original, normalizedOrderId: directUuid };
  }

  const parts = original.split(/[-_/:\s]+/).filter(Boolean);
  for (const part of parts) {
    const maybe = maybeUuid(part);
    if (maybe) {
      return { original, normalizedOrderId: maybe };
    }
  }

  return { original, normalizedOrderId: null };
}

