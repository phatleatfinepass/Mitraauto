export type BundlePricingMode = 'none' | 'percent_off' | 'fixed_total';

export const PRODUCT_VAT_RATE = 0.255;
export const PRODUCT_VAT_MULTIPLIER = 1 + PRODUCT_VAT_RATE;

export interface ProductPricingTier {
  mode?: BundlePricingMode | null;
  percent_off?: number | null;
  fixed_total_eur?: number | null;
}

export interface ProductPricingRules {
  qty2?: ProductPricingTier | null;
  qty4?: ProductPricingTier | null;
}

export interface CalculatedLinePricing {
  quantity: number;
  baseUnitPriceEur: number;
  effectiveUnitPriceEur: number;
  lineTotalEur: number;
  baseLineTotalEur: number;
  savingsEur: number;
  appliedTier: ProductPricingTier | null;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTier(tier: unknown): ProductPricingTier | null {
  if (!tier || typeof tier !== 'object') return null;

  const raw = tier as Record<string, unknown>;
  const mode = raw.mode === 'percent_off' || raw.mode === 'fixed_total' ? raw.mode : 'none';
  const percentOff = normalizeNumber(raw.percent_off);
  const fixedTotal = normalizeNumber(raw.fixed_total_eur);

  if (mode === 'percent_off' && percentOff !== null && percentOff > 0) {
    return {
      mode,
      percent_off: percentOff,
      fixed_total_eur: null,
    };
  }

  if (mode === 'fixed_total' && fixedTotal !== null && fixedTotal >= 0) {
    return {
      mode,
      percent_off: null,
      fixed_total_eur: roundCurrency(fixedTotal),
    };
  }

  return null;
}

export function normalizePricingRules(value: unknown): ProductPricingRules | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  const qty2 = normalizeTier(raw.qty2);
  const qty4 = normalizeTier(raw.qty4);

  if (!qty2 && !qty4) return null;
  return { qty2, qty4 };
}

export function getPricingRulesFromSpecOverrides(specOverrides: unknown): ProductPricingRules | null {
  if (!specOverrides || typeof specOverrides !== 'object') return null;

  const raw = specOverrides as Record<string, unknown>;
  return (
    normalizePricingRules(raw.pricing_rules) ||
    normalizePricingRules(raw.bundle_pricing) ||
    normalizePricingRules(raw.pricing) ||
    normalizePricingRules(raw)
  );
}

export function isFixedBundleTotalCompatible(
  fixedTotalEur: number | null | undefined,
  quantity: number,
): boolean {
  if (fixedTotalEur === null || fixedTotalEur === undefined) return false;
  if (!Number.isFinite(fixedTotalEur) || quantity <= 0) return false;
  const cents = Math.round(fixedTotalEur * 100);
  return cents % quantity === 0;
}

export function setPricingRulesToSpecOverrides(
  specOverrides: Record<string, any> | null | undefined,
  pricingRules: ProductPricingRules | null,
): Record<string, any> | null {
  const current = specOverrides && typeof specOverrides === 'object' ? { ...specOverrides } : {};

  if (!pricingRules || (!normalizeTier(pricingRules.qty2) && !normalizeTier(pricingRules.qty4))) {
    const { pricing_rules, bundle_pricing, pricing, ...rest } = current;
    return Object.keys(rest).length > 0 ? rest : null;
  }

  return {
    ...current,
    pricing_rules: normalizePricingRules(pricingRules),
  };
}

function getTierForQuantity(quantity: number, rules: ProductPricingRules | null | undefined): ProductPricingTier | null {
  if (!rules) return null;
  if (quantity === 2) return normalizeTier(rules.qty2);
  if (quantity === 4) return normalizeTier(rules.qty4);
  return null;
}

export function calculateLinePricing(
  baseUnitPriceEur: number,
  quantity: number,
  rules: ProductPricingRules | null | undefined,
): CalculatedLinePricing {
  const safeQuantity = Math.max(1, Math.trunc(quantity || 1));
  const safeBaseUnit = roundCurrency(Number.isFinite(baseUnitPriceEur) ? Math.max(0, baseUnitPriceEur) : 0);
  const baseLineTotal = roundCurrency(safeBaseUnit * safeQuantity);
  const tier = getTierForQuantity(safeQuantity, rules);

  let lineTotal = baseLineTotal;
  let effectiveUnit = safeBaseUnit;

  if (tier?.mode === 'percent_off' && tier.percent_off !== null) {
    const discountFactor = Math.max(0, Math.min(100, tier.percent_off)) / 100;
    lineTotal = roundCurrency(baseLineTotal * (1 - discountFactor));
    effectiveUnit = roundCurrency(lineTotal / safeQuantity);
  } else if (tier?.mode === 'fixed_total' && tier.fixed_total_eur !== null) {
    lineTotal = roundCurrency(Math.max(0, tier.fixed_total_eur));
    effectiveUnit = roundCurrency(lineTotal / safeQuantity);
  }

  const savings = roundCurrency(Math.max(0, baseLineTotal - lineTotal));

  return {
    quantity: safeQuantity,
    baseUnitPriceEur: safeBaseUnit,
    effectiveUnitPriceEur: effectiveUnit,
    lineTotalEur: lineTotal,
    baseLineTotalEur: baseLineTotal,
    savingsEur: savings,
    appliedTier: tier,
  };
}
