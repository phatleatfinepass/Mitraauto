const PRODUCT_PATH_PATTERN = /^\/(?:(en)\/)?catalog\/(tire|rim)\/([^/]+)$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID_PATTERN = /^[0-9a-f]{16,}$/i;
const GTIN_PATTERN = /^\d{8,14}$/;
const SUPPLIER_CODE_PATTERN = /^(rd|vt|ean|sku|id)[-_]?[a-z0-9]*\d+[a-z0-9-]*$/i;

type ProductType = 'tire' | 'rim';

type CatalogRow = {
  variant_id?: string | null;
  product_type?: string | null;
  seo_slug?: string | null;
  brand?: string | null;
  brand_display_name?: string | null;
  model?: string | null;
  size_string?: string | null;
  season?: string | null;
  width_in?: number | null;
  rim_diameter_in?: number | null;
  bolt_pattern?: string | null;
  et_offset_mm?: number | null;
  center_bore_mm?: number | null;
  cb_mm?: number | null;
  color?: string | null;
};

type RedirectEnv = {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '') || '/';
  }

  return pathname || '/';
}

function normalizeSlug(value?: string | null) {
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

function isOpaqueIdentifier(value?: string | null) {
  const identifier = String(value ?? '').trim();
  if (!identifier) return false;

  return (
    UUID_PATTERN.test(identifier) ||
    HEX_ID_PATTERN.test(identifier) ||
    GTIN_PATTERN.test(identifier) ||
    SUPPLIER_CODE_PATTERN.test(identifier)
  );
}

function formatRimMetricForPublicSlug(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) {
    return null;
  }

  return Number(value).toFixed(2);
}

function buildGeneratedSlug(productType: ProductType, row: CatalogRow) {
  const commonParts = [row.brand_display_name || row.brand, row.model];
  const routeParts =
    productType === 'tire'
      ? [
          ...commonParts,
          row.size_string,
          row.season && row.season !== 'all_season' ? row.season : null,
        ]
      : [
          ...commonParts,
          row.size_string ||
            [
              row.width_in,
              row.rim_diameter_in ? `${row.rim_diameter_in}in` : null,
          ].filter(Boolean).join('x'),
          row.bolt_pattern,
          formatRimMetricForPublicSlug(row.et_offset_mm)
            ? `et-${formatRimMetricForPublicSlug(row.et_offset_mm)}`
            : null,
          formatRimMetricForPublicSlug(row.center_bore_mm ?? row.cb_mm)
            ? `cb-${formatRimMetricForPublicSlug(row.center_bore_mm ?? row.cb_mm)}`
            : null,
          row.color,
        ];

  return normalizeSlug(routeParts.filter(Boolean).join(' '));
}

function getCanonicalIdentifier(productType: ProductType, row: CatalogRow) {
  const stored = normalizeSlug(row.seo_slug);
  if (stored && !isOpaqueIdentifier(stored)) return stored;

  const generated = buildGeneratedSlug(productType, row);
  if (generated) return generated;

  return normalizeSlug(row.variant_id) ?? '';
}

function buildCatalogPath(language: 'fi' | 'en', productType: ProductType, identifier: string) {
  const base = language === 'en' ? '/en/catalog' : '/catalog';
  return `${base}/${productType}/${identifier}`;
}

async function fetchCatalogRow(env: RedirectEnv, productType: ProductType, identifier: string) {
  const supabaseUrl = String(env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
  const anonKey = String(env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '');
  if (!supabaseUrl || !anonKey) return undefined;

  const rpcName = productType === 'rim'
    ? 'catalog_get_rim_by_identifier_v1'
    : 'catalog_get_tire_by_identifier_v1';
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ p_identifier: identifier }),
  });

  if (!response.ok) return undefined;

  const rows = await response.json().catch(() => null);
  return Array.isArray(rows) && rows[0] ? rows[0] as CatalogRow : null;
}

async function productNotFoundResponse(request: Request, env: RedirectEnv) {
  if (!env.ASSETS) {
    return new Response('Product not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex, follow',
      },
    });
  }

  const shellUrl = new URL(request.url);
  shellUrl.pathname = '/';
  shellUrl.search = '';
  shellUrl.hash = '';

  const shellResponse = await env.ASSETS.fetch(new Request(shellUrl.toString(), request));
  const headers = new Headers(shellResponse.headers);
  headers.set('x-robots-tag', 'noindex, follow');

  return new Response(shellResponse.body, {
    status: 404,
    statusText: 'Not Found',
    headers,
  });
}

async function resolveProductRequest(request: Request, env: RedirectEnv) {
  const url = new URL(request.url);
  const normalizedPath = normalizePath(url.pathname);
  const match = normalizedPath.match(PRODUCT_PATH_PATTERN);
  if (!match) return null;

  const language = match[1] === 'en' ? 'en' : 'fi';
  const productType = match[2] as ProductType;
  const identifier = decodeURIComponent(match[3]);

  const row = await fetchCatalogRow(env, productType, identifier);
  if (row === undefined) return null;
  if (row === null) return productNotFoundResponse(request, env);
  if (!isOpaqueIdentifier(identifier)) return null;

  const canonicalIdentifier = getCanonicalIdentifier(productType, row);
  if (!canonicalIdentifier) return null;

  const canonicalPath = buildCatalogPath(language, productType, canonicalIdentifier);
  if (canonicalPath === normalizedPath) return null;

  url.pathname = canonicalPath;
  url.search = '';
  url.hash = '';

  return Response.redirect(url.toString(), 308);
}

export async function onRequest(context: { request: Request; env: RedirectEnv }) {
  const productResponse = await resolveProductRequest(context.request, context.env);
  if (productResponse) return productResponse;

  if (context.env.ASSETS) {
    return context.env.ASSETS.fetch(context.request);
  }

  return fetch(context.request);
}
