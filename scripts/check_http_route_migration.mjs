const module = await import('../functions/[[path]].ts');

const canonicalRimSlug = 'rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10';
const legacyRimId = '00024bb0-2f88-dc51-fca7-b0c7bb8ed697';
const legacyRimGtin = '4250996326059';
const legacySupplierCode = 'rd-4250996326059';

const assetBodies = new Map([
  ['/', ['<!doctype html><title>Mitra Auto</title>', 'text/html; charset=utf-8']],
  [
    '/404.html',
    [
      '<!doctype html><meta name="robots" content="noindex, nofollow, noarchive"><title>Page not found</title><main><h1>404</h1><a href="/">Go to homepage</a></main>',
      'text/html; charset=utf-8',
    ],
  ],
  ['/robots.txt', ['User-agent: *\nAllow: /', 'text/plain; charset=utf-8']],
  ['/sitemap.xml', ['<?xml version="1.0"?><urlset></urlset>', 'application/xml; charset=utf-8']],
  ['/sitemap-products.xml', ['<?xml version="1.0"?><sitemapindex></sitemapindex>', 'application/xml; charset=utf-8']],
  ['/sitemap-products-1.xml', ['<?xml version="1.0"?><urlset></urlset>', 'application/xml; charset=utf-8']],
  ['/merchant-products.xml', ['<?xml version="1.0"?><rss></rss>', 'application/xml; charset=utf-8']],
]);

function assert(condition, message, detail = {}) {
  if (!condition) {
    console.error(JSON.stringify({ error: message, ...detail }, null, 2));
    process.exit(1);
  }
}

function makeAssets() {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      const asset = assetBodies.get(url.pathname);
      if (!asset) {
        return new Response('asset not found', {
          status: 404,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }

      return new Response(asset[0], {
        status: 200,
        headers: { 'content-type': asset[1] },
      });
    },
  };
}

function productRow() {
  return {
    variant_id: legacyRimId,
    product_type: 'rim',
    brand: 'Rautamo Netto',
    brand_display_name: 'Rautamo Netto',
    model: 'BROCK RC32 Titanium Full Pol',
    size_string: '7x17',
    bolt_pattern: '5x110',
    et_offset_mm: 40,
    center_bore_mm: 65.1,
    color: null,
    seo_slug: canonicalRimSlug,
  };
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  if (!url.pathname.includes('/rest/v1/rpc/catalog_get_rim_by_identifier_v1')) {
    return new Response('unexpected fetch', { status: 500 });
  }

  const body = JSON.parse(String(init?.body ?? '{}'));
  const identifier = body.p_identifier;
  const rows = [legacyRimId, canonicalRimSlug, legacyRimGtin, legacySupplierCode].includes(identifier)
    ? [productRow()]
    : [];

  return Response.json(rows);
};

const env = {
  ASSETS: makeAssets(),
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
};

async function request(path) {
  return module.onRequest({
    request: new Request(`https://www.mitra-auto.fi${path}`, { method: 'GET' }),
    env,
  });
}

async function assertRedirect(path, status, locationPath) {
  const response = await request(path);
  const location = response.headers.get('location') ?? '';
  assert(response.status === status, 'Unexpected redirect status', { path, expected: status, actual: response.status });
  assert(new URL(location).pathname === locationPath, 'Unexpected redirect location', { path, expected: locationPath, actual: location });
}

async function assertStatus(path, status, headerChecks = {}) {
  const response = await request(path);
  assert(response.status === status, 'Unexpected status', { path, expected: status, actual: response.status });

  for (const [header, expected] of Object.entries(headerChecks)) {
    const actual = response.headers.get(header);
    assert(actual === expected, 'Unexpected header', { path, header, expected, actual });
  }
}

async function assertNotFoundBody(path) {
  const response = await request(path);
  const body = await response.text();
  assert(response.status === 404, 'Unexpected not-found status', { path, expected: 404, actual: response.status });
  assert(body.includes('name="robots"') && body.includes('noindex'), 'Missing not-found robots metadata', { path });
  assert(body.includes('href="/"') && body.includes('Go to homepage'), 'Missing not-found recovery link', { path });
}

await assertRedirect('/shop', 301, '/catalog');
await assertRedirect('/palvelut/dpf-pesu', 301, '/palvelut/dpf-huolto');
await assertRedirect('/palvelut/autohuolto/', 301, '/palvelut/autohuolto');
await assertRedirect(`/catalog/rim/${legacyRimId}`, 308, `/catalog/rim/${canonicalRimSlug}`);
await assertRedirect(`/catalog/rim/${legacyRimGtin}`, 308, `/catalog/rim/${canonicalRimSlug}`);
await assertRedirect(`/catalog/rim/${legacySupplierCode}`, 308, `/catalog/rim/${canonicalRimSlug}`);

await assertStatus('/robots.txt', 200);
await assertStatus('/sitemap-products-1.xml', 200);
await assertStatus('/', 200);
await assertStatus('/en/services/car-service', 200);
await assertStatus('/palvelut/basic-hand-wash-car', 200);
await assertStatus(`/catalog/rim/${canonicalRimSlug}`, 200);
await assertStatus('/palvelut/not-a-real-service', 404, { 'x-robots-tag': 'noindex, follow' });
await assertStatus('/catalog/rim/does-not-exist-product', 404, { 'x-robots-tag': 'noindex, follow' });
await assertStatus('/this-route-should-not-exist-r4', 404, { 'x-robots-tag': 'noindex, follow' });
await assertStatus('/contact', 404, { 'x-robots-tag': 'noindex, follow' });
await assertNotFoundBody('/this-route-should-not-exist-r4');
await assertStatus('/cms', 404, {
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'cache-control': 'no-store',
});

globalThis.fetch = originalFetch;

console.log('HTTP route migration check passed: legacy redirects, product identifier redirects, static assets, generated service routes, protected routes, and soft-404 candidates verified.');
