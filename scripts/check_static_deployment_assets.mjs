import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_DIR = 'src/public';
const SITE_URL = 'https://www.mitra-auto.fi';
const REQUIRED_ASSETS = [
  'robots.txt',
  'sitemap.xml',
  'sitemap-products.xml',
  'merchant-products.xml',
  '_headers',
  '_redirects',
];
const LIVE_EXPECTATIONS = [
  { path: '/robots.txt', contentTypes: ['text/plain'] },
  { path: '/sitemap.xml', contentTypes: ['application/xml', 'text/xml'] },
  { path: '/sitemap-products.xml', contentTypes: ['application/xml', 'text/xml'] },
  { path: '/merchant-products.xml', contentTypes: ['application/xml', 'text/xml', 'application/rss+xml'] },
];

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function fail(message, detail = {}) {
  console.error(JSON.stringify({ error: message, ...detail }, null, 2));
  process.exit(1);
}

function readText(root, file) {
  return readFileSync(join(root, file), 'utf8');
}

function assertFile(root, file) {
  const path = join(root, file);
  if (!existsSync(path)) {
    fail('Required static deployment asset is missing', { root, file });
  }

  const stats = statSync(path);
  if (!stats.isFile() || stats.size === 0) {
    fail('Required static deployment asset is empty or not a file', { root, file, size: stats.size });
  }

  return stats.size;
}

function getLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function assertProductionUrl(loc, context) {
  let url;
  try {
    url = new URL(loc);
  } catch {
    fail('Static SEO asset contains an invalid URL', { context, loc });
  }

  if (url.origin !== SITE_URL) {
    fail('Static SEO asset URL is not on the canonical production host', { context, loc });
  }

  return url;
}

function isPrivatePath(pathname) {
  return [
    '/admin',
    '/cms',
    '/pwa',
    '/account',
    '/customer',
    '/customer-account',
    '/booking/manage',
    '/checkout',
    '/en/account',
    '/en/customer',
    '/en/booking/manage',
  ].some((privatePath) => pathname === privatePath || pathname.startsWith(`${privatePath}/`));
}

function assertHeaders(root) {
  const headers = readText(root, '_headers');
  const requiredRules = [
    ['/robots.txt', 'Content-Type: text/plain'],
    ['/sitemap.xml', 'Content-Type: application/xml'],
    ['/sitemap-products*', 'Content-Type: application/xml'],
    ['/merchant-products.xml', 'Content-Type: application/xml'],
  ];

  for (const [path, contentType] of requiredRules) {
    if (!headers.includes(path) || !headers.includes(contentType)) {
      fail('Static asset header rule is missing', { root, path, contentType });
    }
  }
}

function assertRobots(root) {
  const robots = readText(root, 'robots.txt');
  if (/Disallow:\s*\/\s*$/m.test(robots)) {
    fail('robots.txt contains a global production disallow', { root });
  }

  for (const sitemap of ['/sitemap.xml', '/sitemap-products.xml']) {
    const declaration = `Sitemap: ${SITE_URL}${sitemap}`;
    if (!robots.includes(declaration)) {
      fail('robots.txt is missing a sitemap declaration', { root, declaration });
    }
  }
}

function assertStaticSitemap(root) {
  const xml = readText(root, 'sitemap.xml');
  if (!xml.includes('<urlset') || !xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9')) {
    fail('sitemap.xml is not a sitemap urlset', { root });
  }

  const locs = getLocs(xml);
  if (locs.length === 0) {
    fail('sitemap.xml has no URLs', { root });
  }

  for (const loc of locs) {
    const url = assertProductionUrl(loc, 'sitemap.xml');
    if (isPrivatePath(url.pathname)) {
      fail('sitemap.xml includes a private or non-indexable path', { loc });
    }
  }
}

function assertProductSitemapIndex(root) {
  const xml = readText(root, 'sitemap-products.xml');
  if (!xml.includes('<sitemapindex') || !xml.includes('http://www.sitemaps.org/schemas/sitemap/0.9')) {
    fail('sitemap-products.xml is not a sitemap index', { root });
  }

  const locs = getLocs(xml);
  if (locs.length === 0) {
    fail('sitemap-products.xml has no child sitemap entries', { root });
  }

  for (const loc of locs) {
    const url = assertProductionUrl(loc, 'sitemap-products.xml');
    const filename = url.pathname.replace(/^\//, '');
    if (!/^sitemap-products-\d+\.xml$/.test(filename)) {
      fail('Product sitemap index points to an unexpected file', { loc });
    }
    assertFile(root, filename);
  }
}

function assertMerchantFeed(root) {
  const xml = readText(root, 'merchant-products.xml');
  if (!xml.includes('<rss') || !xml.includes('xmlns:g="http://base.google.com/ns/1.0"')) {
    fail('merchant-products.xml is not a Google Merchant RSS feed', { root });
  }

  const itemCount = (xml.match(/<item>/g) ?? []).length;
  if (itemCount === 0 || itemCount > 50_000) {
    fail('merchant-products.xml has an invalid item count', { root, itemCount });
  }

  for (const loc of [...xml.matchAll(/<g:link>([^<]+)<\/g:link>/g)].map((match) => match[1])) {
    const url = assertProductionUrl(loc, 'merchant-products.xml');
    if (!/^\/catalog\/(?:tire|rim)\/[a-z0-9-]+$/.test(url.pathname)) {
      fail('Merchant feed link is not a canonical product URL', { loc });
    }
  }

  return itemCount;
}

function assertNoPublicMacMetadata(root) {
  if (existsSync(join(root, '.DS_Store'))) {
    fail('Public deployment directory contains .DS_Store', { root });
  }
}

function checkAssetRoot(root, label) {
  if (!existsSync(root)) {
    fail('Static asset root is missing', { root, label });
  }

  const sizes = Object.fromEntries(REQUIRED_ASSETS.map((file) => [file, assertFile(root, file)]));
  assertNoPublicMacMetadata(root);
  assertHeaders(root);
  assertRobots(root);
  assertStaticSitemap(root);
  assertProductSitemapIndex(root);
  const merchantItems = assertMerchantFeed(root);

  return {
    label,
    root,
    checkedFiles: REQUIRED_ASSETS.length,
    sizes,
    merchantItems,
  };
}

function assertLiveBaseIsSafe(baseUrl) {
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    fail('Live URL is invalid', { baseUrl });
  }

  if (url.username || url.password) {
    fail('Live URL must not contain credentials', { baseUrl });
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    fail('Live URL must use http or https', { baseUrl });
  }

  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.local') ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    fail('Live URL points at a local or private host', { baseUrl });
  }

  return url;
}

async function fetchHead(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    return await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkLive(baseUrl) {
  const base = assertLiveBaseIsSafe(baseUrl);
  const results = [];
  const failures = [];

  for (const expectation of LIVE_EXPECTATIONS) {
    const url = new URL(expectation.path, base);
    let response;
    let contentType = '';

    try {
      response = await fetchHead(url);
      contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    } catch (error) {
      failures.push({
        url: url.toString(),
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    if (response.status !== 200) {
      failures.push({
        url: url.toString(),
        failure: 'status',
        status: response.status,
        contentType,
      });
      continue;
    }

    if (!expectation.contentTypes.some((expected) => contentType.startsWith(expected))) {
      failures.push({
        url: url.toString(),
        failure: 'content-type',
        status: response.status,
        contentType,
        expected: expectation.contentTypes,
      });
      continue;
    }

    results.push({
      url: url.toString(),
      status: response.status,
      contentType,
      contentLength: response.headers.get('content-length') ?? null,
    });
  }

  if (failures.length > 0) {
    fail('Live static SEO asset parity failed', { failures });
  }

  return results;
}

async function main() {
  const source = checkAssetRoot(SOURCE_DIR, 'source');
  const buildDir = getArg('--build-dir');
  const build = buildDir ? checkAssetRoot(buildDir, 'build') : null;
  const liveUrl = getArg('--live');
  const live = liveUrl ? await checkLive(liveUrl) : null;

  console.log(JSON.stringify({
    status: 'passed',
    source,
    build,
    live,
  }, null, 2));
}

main().catch((error) => {
  fail('Static deployment asset check failed', {
    message: error instanceof Error ? error.message : String(error),
  });
});
