export type CatalogProductRouteType = 'tire' | 'rim';
export type CatalogRouteLanguage = 'fi' | 'en';

export type CatalogSeoProduct = {
  id?: string | null;
  seo_slug?: string | null;
  type?: CatalogProductRouteType | null;
  product_type?: CatalogProductRouteType | null;
  brand?: string | null;
  model?: string | null;
  size_text?: string | null;
  season?: string | null;
  rim_width?: number | null;
  rim_diameter?: number | null;
  pcd?: string | null;
  et_offset?: number | null;
  cb?: number | null;
  color?: string | null;
};

export type ParsedCatalogProductPath = {
  language: CatalogRouteLanguage;
  productType: CatalogProductRouteType;
  identifier: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID_PATTERN = /^[0-9a-f]{16,}$/i;
const GTIN_PATTERN = /^\d{8,14}$/;
const SUPPLIER_CODE_PATTERN = /^(rd|vt|ean|sku|id)[-_]?[a-z0-9]*\d+[a-z0-9-]*$/i;

function normalizeAppPath(path: string) {
  if (!path) return '/';
  if (path.length > 1 && path.endsWith('/')) return path.replace(/\/+$/, '') || '/';
  return path;
}

export function normalizeCatalogSlug(value?: string | null) {
  const normalized = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || null;
}

export function isOpaqueCatalogIdentifier(identifier?: string | null) {
  const value = String(identifier ?? '').trim();
  if (!value) return false;

  return (
    UUID_PATTERN.test(value) ||
    HEX_ID_PATTERN.test(value) ||
    GTIN_PATTERN.test(value) ||
    SUPPLIER_CODE_PATTERN.test(value)
  );
}

export function getCatalogProductRouteType(product: CatalogSeoProduct): CatalogProductRouteType {
  return (product.product_type ?? product.type ?? 'tire') === 'rim' ? 'rim' : 'tire';
}

export function buildCatalogProductSeoSlug(product: CatalogSeoProduct) {
  const productType = getCatalogProductRouteType(product);
  const commonParts = [product.brand, product.model];
  const routeParts =
    productType === 'tire'
      ? [
          ...commonParts,
          product.size_text,
          product.season && product.season !== 'all_season' ? product.season : null,
        ]
      : [
          ...commonParts,
          product.size_text ||
            [
              product.rim_width,
              product.rim_diameter ? `${product.rim_diameter}in` : null,
            ].filter(Boolean).join('x'),
          product.pcd,
          product.et_offset !== undefined && product.et_offset !== null ? `et-${product.et_offset}` : null,
          product.cb !== undefined && product.cb !== null ? `cb-${product.cb}` : null,
          product.color,
        ];

  return normalizeCatalogSlug(routeParts.filter(Boolean).join(' '));
}

export function getCatalogProductSeoIdentifier(
  product: CatalogSeoProduct,
  preferredSlug?: string | null,
) {
  const preferred = normalizeCatalogSlug(preferredSlug);
  if (preferred && !isOpaqueCatalogIdentifier(preferred)) return preferred;

  const stored = normalizeCatalogSlug(product.seo_slug);
  if (stored && !isOpaqueCatalogIdentifier(stored)) return stored;

  const generated = buildCatalogProductSeoSlug(product);
  if (generated) return generated;

  return normalizeCatalogSlug(product.id) ?? '';
}

export function getCatalogProductDetailPath(
  productType: CatalogProductRouteType,
  identifier: string,
  language: CatalogRouteLanguage = 'fi',
) {
  const normalizedIdentifier = normalizeCatalogSlug(identifier) || encodeURIComponent(identifier);
  const base = language === 'en' ? '/en/catalog' : '/catalog';
  return `${base}/${productType}/${normalizedIdentifier}`;
}

export function parseCatalogProductPath(path: string): ParsedCatalogProductPath | null {
  const normalizedPath = normalizeAppPath(path);
  const match = normalizedPath.match(/^\/(?:(en)\/)?catalog\/(tire|rim)\/([^/]+)$/);
  if (!match) return null;

  return {
    language: match[1] === 'en' ? 'en' : 'fi',
    productType: match[2] as CatalogProductRouteType,
    identifier: decodeURIComponent(match[3]),
  };
}
