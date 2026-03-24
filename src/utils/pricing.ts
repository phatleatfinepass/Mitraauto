export type BundlePricingMode = 'none' | 'percent' | 'fixed_total';

export interface BundlePricingTier {
  mode: BundlePricingMode;
  percent_off: number | null;
  fixed_total_eur: number | null;
}

export interface ProductPricingRules {
  qty2: BundlePricingTier | null;
  qty4: BundlePricingTier | null;
}

export interface LinePricingResult {
  quantity: number;
  baseUnitPriceEur: number;
  effectiveUnitPriceEur: number;
  baseLineTotalEur: number;
  lineTotalEur: number;
  savingsEur: number;
  appliedTierQty: 2 | 4 | null;
  appliedMode: BundlePricingMode | null;
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sanitizePercent(value: unknown): number | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return null;
  if (numeric <= 0) return null;
  if (numeric >= 100) return 100;
  return Math.round(numeric * 100) / 100;
}

function sanitizeMoney(value: unknown): number | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null || numeric <= 0) return null;
  return Math.round(numeric * 100) / 100;
}

function normalizeTierLike(input: any): BundlePricingTier | null {
  if (!input || typeof input !== 'object') return null;

  const rawMode = String(input.mode ?? input.type ?? input.rule_type ?? '').trim().toLowerCase();
  const percentOff = sanitizePercent(input.percent_off ?? input.discount_percent ?? input.percent ?? input.value_percent);
  const fixedTotalEur = sanitizeMoney(input.fixed_total_eur ?? input.fixed_price_eur ?? input.bundle_total_eur ?? input.total_eur);

  const inferredMode: BundlePricingMode = (() => {
    if (rawMode === 'percent' || rawMode === 'percentage') return 'percent';
    if (rawMode === 'fixed' || rawMode === 'fixed_total' || rawMode === 'fixedtotal') return 'fixed_total';
    if (rawMode === 'none' || rawMode === 'off' || rawMode === '') {
      if (percentOff !== null) return 'percent';
      if (fixedTotalEur !== null) return 'fixed_total';
      return 'none';
    }
    if (percentOff !== null) return 'percent';
    if (fixedTotalEur !== null) return 'fixed_total';
    return 'none';
  })();

  if (inferredMode === 'none' && percentOff === null && fixedTotalEur === null) {
    return null;
  }

  return {
    mode: inferredMode,
    percent_off: percentOff,
    fixed_total_eur: fixedTotalEur,
  };
}

export function normalizePricingRules(input: any): ProductPricingRules | null {
  if (!input || typeof input !== 'object') return null;

  const qty2 = normalizeTierLike(input.qty2 ?? input.qty_2 ?? input.two_items ?? input.twoItems ?? input['2']);
  const qty4 = normalizeTierLike(input.qty4 ?? input.qty_4 ?? input.four_items ?? input.fourItems ?? input['4']);

  if (!qty2 && !qty4) return null;

  return { qty2, qty4 };
}

export function getPricingRulesFromSpecOverrides(specOverrides: any): ProductPricingRules | null {
  if (!specOverrides || typeof specOverrides !== 'object') return null;
  return normalizePricingRules(specOverrides.pricing ?? null);
}

export function setPricingRulesToSpecOverrides(
  specOverrides: any,
  rules: ProductPricingRules | null,
): Record<string, any> | null {
  const base = (specOverrides && typeof specOverrides === 'object') ? { ...specOverrides } : {};
  const normalized = normalizePricingRules(rules);

  if (!normalized) {
    delete base.pricing;
    return Object.keys(base).length > 0 ? base : null;
  }

  const packTier = (tier: BundlePricingTier | null) => {
    if (!tier) return null;
    if (tier.mode === 'none') {
      return { mode: 'none' as const };
    }
    if (tier.mode === 'percent') {
      return {
        mode: 'percent' as const,
        percent_off: sanitizePercent(tier.percent_off) ?? 0,
      };
    }
    return {
      mode: 'fixed_total' as const,
      fixed_total_eur: sanitizeMoney(tier.fixed_total_eur) ?? 0,
    };
  };

  base.pricing = {
    qty2: packTier(normalized.qty2),
    qty4: packTier(normalized.qty4),
  };

  return base;
}

export function isFixedBundleTotalCompatible(fixedTotalEur: number | null | undefined, quantity: number): boolean {
  const qty = Math.max(1, Math.trunc(quantity || 1));
  const amount = sanitizeMoney(fixedTotalEur);
  if (amount === null) return false;
  const cents = Math.round(amount * 100);
  return cents % qty === 0;
}

export function calculateLinePricing(
  baseUnitPriceEur: number | null | undefined,
  quantity: number,
  rules: ProductPricingRules | null | undefined,
): LinePricingResult {
  const qty = Math.max(1, Math.trunc(quantity || 1));
  const safeBase = Math.max(0, toFiniteNumber(baseUnitPriceEur) ?? 0);

  const baseUnitCents = Math.round(safeBase * 100);
  const baseLineCents = baseUnitCents * qty;

  const normalizedRules = normalizePricingRules(rules);
  const tier = qty === 2 ? normalizedRules?.qty2 ?? null : qty === 4 ? normalizedRules?.qty4 ?? null : null;

  let effectiveUnitCents = baseUnitCents;
  let appliedMode: BundlePricingMode | null = null;
  let appliedTierQty: 2 | 4 | null = null;

  if (tier && tier.mode === 'percent') {
    const percent = sanitizePercent(tier.percent_off);
    if (percent !== null && percent > 0) {
      effectiveUnitCents = Math.max(0, Math.round(baseUnitCents * ((100 - percent) / 100)));
      appliedMode = 'percent';
      appliedTierQty = qty === 2 ? 2 : 4;
    }
  } else if (tier && tier.mode === 'fixed_total') {
    const fixedTotal = sanitizeMoney(tier.fixed_total_eur);
    if (fixedTotal !== null) {
      const fixedTotalCents = Math.round(fixedTotal * 100);
      effectiveUnitCents = Math.max(0, Math.round(fixedTotalCents / qty));
      appliedMode = 'fixed_total';
      appliedTierQty = qty === 2 ? 2 : 4;
    }
  }

  const lineTotalCents = effectiveUnitCents * qty;
  const savingsCents = Math.max(0, baseLineCents - lineTotalCents);

  return {
    quantity: qty,
    baseUnitPriceEur: baseUnitCents / 100,
    effectiveUnitPriceEur: effectiveUnitCents / 100,
    baseLineTotalEur: baseLineCents / 100,
    lineTotalEur: lineTotalCents / 100,
    savingsEur: savingsCents / 100,
    appliedTierQty,
    appliedMode,
  };
}

