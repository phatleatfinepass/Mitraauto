import {
  calculateLinePricing,
  PRODUCT_VAT_MULTIPLIER,
  type ProductPricingRules,
} from './pricing';

export type CommerceProductType = 'tire' | 'rim';

export const PRODUCT_HOME_DELIVERY_FEE_INCL_VAT_EUR = 50;
export const PRODUCT_RETURN_WINDOW_DAYS = 14;
export const PRODUCT_POLICY_COUNTRY = 'FI';

export interface ProductCommerceInput {
  id?: string | null;
  type?: CommerceProductType | null;
  product_type?: CommerceProductType | null;
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  name?: string | null;
  ean?: string | null;
  best_price_eur?: number | null;
  final_price_eur?: number | null;
  price_eur?: number | null;
  price?: number | null;
  pricing_rules?: ProductPricingRules | null;
  in_stock?: boolean | null;
  stock_quantity?: number | null;
  stock_qty?: number | null;
  available_quantity?: number | null;
  best_image_url?: string | null;
  hero_image_url?: string | null;
  image_url?: string | null;
  images?: Array<string | null | undefined> | null;
  gallery_images?: Array<string | null | undefined> | null;
  gallery?: Array<string | null | undefined> | null;
  delivery_days_min?: number | null;
  delivery_days_max?: number | null;
}

export interface ProductCommerceSnapshot {
  productId: string;
  productType: CommerceProductType;
  name: string;
  brand: string | null;
  model: string | null;
  sku: string;
  mpn: string | null;
  gtin: string | null;
  baseUnitPriceExVatEur: number;
  unitPriceExVatEur: number;
  unitPriceInclVatEur: number;
  unitPriceInclVatCents: number;
  lineTotalExVatEur: number;
  lineTotalInclVatEur: number;
  lineTotalInclVatCents: number;
  quantity: number;
  hasSellablePrice: boolean;
  inStock: boolean;
  canPurchase: boolean;
  stockQuantity: number | null;
  schemaAvailability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
  primaryImageUrl: string;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function positivePrice(product: ProductCommerceInput) {
  const candidates = [
    product.best_price_eur,
    product.final_price_eur,
    product.price_eur,
    product.price,
  ];

  for (const candidate of candidates) {
    const value = numberOrNull(candidate);
    if (value !== null && value > 0) return value;
  }

  return 0;
}

function positiveIntegerOrNull(value: unknown) {
  const numberValue = numberOrNull(value);
  if (numberValue === null || numberValue <= 0) return null;
  return Math.floor(numberValue);
}

function normalizeGtin(value?: string | null) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14 ? digits : null;
}

function firstImage(product: ProductCommerceInput) {
  const candidates = [
    product.image_url,
    product.hero_image_url,
    product.best_image_url,
    product.gallery_images?.[0],
    product.images?.[0],
    product.gallery?.[0],
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (value) return value;
  }

  return '';
}

export function getProductCommerceSnapshot(
  product: ProductCommerceInput,
  options: { quantity?: number; displayName?: string | null } = {},
): ProductCommerceSnapshot {
  const quantity = Math.max(1, Math.floor(Number(options.quantity ?? 1) || 1));
  const baseUnitPriceExVatEur = positivePrice(product);
  const pricing = calculateLinePricing(baseUnitPriceExVatEur, quantity, product.pricing_rules ?? null);
  const unitPriceInclVatEur = pricing.effectiveUnitPriceEur * PRODUCT_VAT_MULTIPLIER;
  const lineTotalInclVatEur = pricing.lineTotalEur * PRODUCT_VAT_MULTIPLIER;
  const stockQuantity =
    positiveIntegerOrNull(product.stock_quantity) ??
    positiveIntegerOrNull(product.stock_qty) ??
    positiveIntegerOrNull(product.available_quantity);
  const inStock = product.in_stock === true && (stockQuantity === null || stockQuantity > 0);
  const productId = String(product.id ?? '').trim();

  return {
    productId,
    productType: (product.product_type ?? product.type) === 'rim' ? 'rim' : 'tire',
    name: String(
      options.displayName ??
      product.title ??
      product.name ??
      [product.brand, product.model].filter(Boolean).join(' ') ??
      'Product',
    ).trim(),
    brand: product.brand ? String(product.brand).trim() : null,
    model: product.model ? String(product.model).trim() : null,
    sku: productId,
    mpn: product.model ? String(product.model).trim() : null,
    gtin: normalizeGtin(product.ean),
    baseUnitPriceExVatEur,
    unitPriceExVatEur: pricing.effectiveUnitPriceEur,
    unitPriceInclVatEur,
    unitPriceInclVatCents: Math.round(unitPriceInclVatEur * 100),
    lineTotalExVatEur: pricing.lineTotalEur,
    lineTotalInclVatEur,
    lineTotalInclVatCents: Math.round(lineTotalInclVatEur * 100),
    quantity,
    hasSellablePrice: baseUnitPriceExVatEur > 0,
    inStock,
    canPurchase: inStock && baseUnitPriceExVatEur > 0,
    stockQuantity,
    schemaAvailability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    primaryImageUrl: firstImage(product),
    deliveryDaysMin: positiveIntegerOrNull(product.delivery_days_min),
    deliveryDaysMax: positiveIntegerOrNull(product.delivery_days_max),
  };
}
