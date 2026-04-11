const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export function parseCheckoutReference(reference: string | null | undefined): {
  raw: string | null;
  normalizedOrderId: string | null;
} {
  const raw = reference ? String(reference).trim() : null;
  if (!raw) {
    return { raw: null, normalizedOrderId: null };
  }

  if (raw.startsWith('ORDER-')) {
    return {
      raw,
      normalizedOrderId: raw.slice('ORDER-'.length).trim() || null,
    };
  }

  const uuidMatch = raw.match(UUID_RE);
  return {
    raw,
    normalizedOrderId: uuidMatch ? uuidMatch[0] : raw,
  };
}
