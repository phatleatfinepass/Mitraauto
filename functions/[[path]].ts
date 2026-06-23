const PRODUCT_PATH_PATTERN = /^\/(?:(en)\/)?catalog\/(tire|rim)\/([^/]+)$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID_PATTERN = /^[0-9a-f]{16,}$/i;
const GTIN_PATTERN = /^\d{8,14}$/;
const SUPPLIER_CODE_PATTERN = /^(rd|vt|ean|sku|id)[-_]?[a-z0-9]*\d+[a-z0-9-]*$/i;
const PRODUCT_SITEMAP_PATTERN = /^\/sitemap-products-\d+\.xml$/;

const LEGACY_REDIRECTS: Record<string, string> = {
  '/shop': '/catalog',
  '/en/shop': '/en/catalog',
  '/services': '/en/services',
  '/tire-hotel': '/en/services/tire-hotel',
  '/about': '/en/about',
  '/legal/privacy': '/privacy',
  '/legal/terms': '/terms',
  '/helsinki/autohuolto': '/palvelut/autohuolto',
  '/en/helsinki/car-service': '/en/services/car-service',
  '/helsinki/renkaanvaihto': '/palvelut/renkaanvaihto',
  '/en/helsinki/tire-change': '/en/services/tire-change',
  '/helsinki/rengashotelli': '/palvelut/rengashotelli',
  '/en/helsinki/tire-hotel': '/en/services/tire-hotel',
  '/palvelut/dpf-pesu': '/palvelut/dpf-huolto',
  '/en/services/dpf-cleaning': '/en/services/dpf-service',
};

const PUBLIC_SPA_PATHS = new Set([
  '/',
  '/en',
  '/palvelut',
  '/en/services',
  '/helsinki',
  '/en/helsinki',
  '/yhteystiedot',
  '/en/contact',
  '/ukk',
  '/en/faq',
  '/meista',
  '/en/about',
  '/catalog',
  '/en/catalog',
  '/privacy',
  '/cookies',
  '/cookie-policy',
  '/terms',
  '/legal',
  '/checkout',
  '/checkout/success',
  '/checkout/cancel',
  '/palvelut/autohuolto',
  '/en/services/car-service',
  '/palvelut/renkaanvaihto',
  '/en/services/tire-change',
  '/palvelut/rengashotelli',
  '/en/services/tire-hotel',
  '/palvelut/vikadiagnostiikka',
  '/en/services/diagnostics',
  '/palvelut/autopesu',
  '/en/services/car-wash',
  '/palvelut/ilmastointihuolto',
  '/en/services/ac-service',
  '/palvelut/dpf-huolto',
  '/en/services/dpf-service',
  '/palvelut/oljynvaihto',
  '/en/services/oil-change',
  '/palvelut/tasapainotus',
  '/en/services/wheel-balancing',
  '/palvelut/rengaspaikkaus',
  '/en/services/tire-repair',
]);

const STATIC_ASSET_PATHS = new Set([
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap-products.xml',
  '/merchant-products.xml',
  '/manifest.webmanifest',
  '/sw.js',
  '/404.html',
]);

const PRIVATE_ROUTE_PREFIXES = [
  '/admin',
  '/cms',
  '/pwa',
  '/account',
  '/customer',
  '/customer-account',
  '/booking/manage',
  '/en/account',
  '/en/customer',
  '/en/booking/manage',
];

const GENERATED_SERVICE_IDS = new Set([
  'basic-hand-wash-car',
  'basic-hand-wash-suv',
  'quick-wax-car',
  'quick-wax-suv',
  'interior-cleaning-car',
  'interior-cleaning-suv',
  'super-exterior-wash-car',
  'super-exterior-wash-suv',
  'hard-wax-car',
  'hard-wax-suv',
  'engine-wash',
  'wheel-wash-set',
  'tire-change-car',
  'tire-change-suv',
  'tire-change-van',
  'wheel-balancing',
  'tire-repair-outside',
  'tire-repair-inside',
  'tire-work-up-to-17',
  'tire-work-18-19',
  'tire-work-20-21',
  'tire-hotel-storage',
  'error-code-reading',
  'troubleshooting',
  'engine-oil-change',
  'seasonal-maintenance',
  'annual-maintenance',
  'manual-gearbox-oil',
  'automatic-gearbox-oil',
  'automatic-gearbox-flush',
  'brake-fluid',
  'pedal-installation',
  'rust-repair',
  'ac-service-r134a',
  'ac-extra-refrigerant',
  'ac-hybrid-extra-r134a',
  'ac-service-r1234yf',
  'ac-hybrid-extra-r1234yf',
  'ac-service-electric',
  'ac-diagnostics',
  'dpf-diagnosis',
  'dpf-forced-regeneration',
  'dpf-cleaning-2002-2008',
  'dpf-cleaning-2009-2013',
  'dpf-cleaning-2014-newer',
  'dpf-removal-installation-estimate',
  'other',
]);

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

function permanentRedirect(request: Request, pathname: string, status = 301) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.hash = '';

  return Response.redirect(url.toString(), status);
}

function isPrivateRoute(pathname: string) {
  return PRIVATE_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isStaticAssetPath(pathname: string) {
  return (
    STATIC_ASSET_PATHS.has(pathname) ||
    PRODUCT_SITEMAP_PATTERN.test(pathname) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/')
  );
}

function isPublicSpaPath(pathname: string) {
  if (PUBLIC_SPA_PATHS.has(pathname) || PRODUCT_PATH_PATTERN.test(pathname)) return true;

  const generatedServiceMatch = pathname.match(/^\/(?:palvelut|en\/services)\/([^/]+)$/);
  return generatedServiceMatch ? GENERATED_SERVICE_IDS.has(decodeURIComponent(generatedServiceMatch[1])) : false;
}

function applyRobotsHeaders(headers: Headers, directive: string, noStore = false) {
  headers.set('x-robots-tag', directive);
  if (noStore) {
    headers.set('cache-control', 'no-store');
  }
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

async function fetchShell(request: Request, env: RedirectEnv, pathname = '/') {
  if (!env.ASSETS) {
    return null;
  }

  const shellUrl = new URL(request.url);
  shellUrl.pathname = pathname;
  shellUrl.search = '';
  shellUrl.hash = '';

  return env.ASSETS.fetch(new Request(shellUrl.toString(), request));
}

async function notFoundResponse(
  request: Request,
  env: RedirectEnv,
  options: { body?: string; robots?: string; noStore?: boolean } = {},
) {
  const shellResponse = await fetchShell(request, env, '/404.html') ?? await fetchShell(request, env, '/');
  if (!shellResponse) {
    return new Response(options.body ?? 'Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': options.robots ?? 'noindex, follow',
        ...(options.noStore ? { 'cache-control': 'no-store' } : {}),
      },
    });
  }

  const headers = new Headers(shellResponse.headers);
  applyRobotsHeaders(headers, options.robots ?? 'noindex, follow', options.noStore);

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
  if (row === undefined) {
    return isOpaqueIdentifier(identifier)
      ? notFoundResponse(request, env, { body: 'Product redirect lookup is unavailable' })
      : null;
  }
  if (row === null) return notFoundResponse(request, env, { body: 'Product not found' });

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
  const url = new URL(context.request.url);
  const normalizedPath = normalizePath(url.pathname);

  if (url.pathname !== normalizedPath) {
    return permanentRedirect(context.request, normalizedPath);
  }

  if (isStaticAssetPath(normalizedPath) && context.env.ASSETS) {
    return context.env.ASSETS.fetch(context.request);
  }

  if (isPrivateRoute(normalizedPath)) {
    return notFoundResponse(context.request, context.env, {
      body: 'Not found',
      robots: 'noindex, nofollow, noarchive',
      noStore: true,
    });
  }

  const legacyTarget = LEGACY_REDIRECTS[normalizedPath];
  if (legacyTarget) {
    return permanentRedirect(context.request, legacyTarget);
  }

  const productResponse = await resolveProductRequest(context.request, context.env);
  if (productResponse) return productResponse;

  if (!isPublicSpaPath(normalizedPath)) {
    return notFoundResponse(context.request, context.env);
  }

  if (context.env.ASSETS) {
    const shellResponse = await fetchShell(context.request, context.env, '/');
    if (shellResponse) return shellResponse;
  }

  return fetch(context.request);
}
