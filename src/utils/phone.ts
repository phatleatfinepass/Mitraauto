export const FINNISH_PHONE_PREFIX = '+358';

export function normalizeFinnishPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const compact = trimmed.replace(/[\s()-]+/g, '');

  if (compact.startsWith('+')) {
    return compact;
  }

  if (compact.startsWith('00')) {
    return `+${compact.slice(2)}`;
  }

  if (compact.startsWith('358')) {
    return `+${compact}`;
  }

  if (compact.startsWith('0')) {
    return `+358${compact.slice(1)}`;
  }

  if (/^\d{7,10}$/.test(compact)) {
    return `+358${compact}`;
  }

  return compact;
}

export function normalizeFinnishPhoneInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const compact = trimmed.replace(/[\s()-]+/g, '');
  const normalized = normalizeFinnishPhone(compact);

  if (!normalized || normalized === '+') {
    return '';
  }

  return normalized;
}

export function hasFinnishPhoneValue(value: string) {
  const normalized = normalizeFinnishPhone(value);
  return Boolean(normalized) && normalized !== FINNISH_PHONE_PREFIX;
}
