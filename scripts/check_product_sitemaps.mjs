import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const PUBLIC_DIR = 'src/public';
const MAX_URLS_PER_SITEMAP = 50_000;
const PRODUCT_LOC_PATTERN = /^https:\/\/www\.mitra-auto\.fi\/(?:en\/)?catalog\/(?:tire|rim)\/[a-z0-9-]+$/;

function read(path) {
  return readFileSync(path, 'utf8');
}

function getLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function fail(message, detail = {}) {
  console.error(JSON.stringify({ error: message, ...detail }, null, 2));
  process.exit(1);
}

const robots = read(join(PUBLIC_DIR, 'robots.txt'));
if (!robots.includes('Sitemap: https://www.mitra-auto.fi/sitemap-products.xml')) {
  fail('robots.txt does not reference sitemap-products.xml');
}

const headers = read(join(PUBLIC_DIR, '_headers'));
if (!headers.includes('/sitemap-products*')) {
  fail('_headers does not include product sitemap XML headers');
}

const indexXml = read(join(PUBLIC_DIR, 'sitemap-products.xml'));
const sitemapFiles = getLocs(indexXml).map((loc) => loc.replace('https://www.mitra-auto.fi/', ''));
if (sitemapFiles.length === 0) {
  fail('sitemap-products.xml has no child sitemaps');
}

const publicFiles = new Set(await readdir(PUBLIC_DIR));
const seen = new Set();
let totalUrls = 0;

for (const filename of sitemapFiles) {
  if (!publicFiles.has(filename)) {
    fail('Product sitemap child file is missing', { filename });
  }

  const xml = read(join(PUBLIC_DIR, filename));
  const urls = getLocs(xml);
  if (urls.length === 0 || urls.length > MAX_URLS_PER_SITEMAP) {
    fail('Product sitemap child URL count is invalid', { filename, count: urls.length });
  }

  for (const loc of urls) {
    if (!PRODUCT_LOC_PATTERN.test(loc)) {
      fail('Product sitemap URL is not a canonical product URL', { filename, loc });
    }
    if (seen.has(loc)) {
      fail('Duplicate product sitemap URL', { filename, loc });
    }
    seen.add(loc);
  }

  totalUrls += urls.length;
}

console.log(`Product sitemap check passed: ${totalUrls} URLs across ${sitemapFiles.length} file(s).`);
