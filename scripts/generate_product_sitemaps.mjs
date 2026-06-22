import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_DIR = 'src/public';
const SITE_URL = 'https://www.mitra-auto.fi';
const MAX_URLS_PER_SITEMAP = 45_000;
const TODAY = new Date().toISOString().slice(0, 10);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_ID_PATTERN = /^[0-9a-f]{16,}$/i;
const GTIN_PATTERN = /^\d{8,14}$/;
const SUPPLIER_CODE_PATTERN = /^(rd|vt|ean|sku|id)[-_]?[a-z0-9]*\d+[a-z0-9-]*$/i;

function normalizeSlug(value) {
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

function isOpaqueIdentifier(value) {
  const identifier = String(value ?? '').trim();
  if (!identifier) return false;

  return (
    UUID_PATTERN.test(identifier) ||
    HEX_ID_PATTERN.test(identifier) ||
    GTIN_PATTERN.test(identifier) ||
    SUPPLIER_CODE_PATTERN.test(identifier)
  );
}

function getCanonicalIdentifier(row, language) {
  const localized = normalizeSlug(language === 'fi' ? row.seo_slug_fi : row.seo_slug_en);
  if (localized && !isOpaqueIdentifier(localized)) return localized;

  const stored = normalizeSlug(row.seo_slug_fi);
  if (stored && !isOpaqueIdentifier(stored)) return stored;

  const generated = normalizeSlug(row.generated_slug);
  if (generated) return generated;

  return null;
}

function buildProductPath(language, productType, identifier) {
  const base = language === 'en' ? '/en/catalog' : '/catalog';
  return `${base}/${productType}/${identifier}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isSellablePublicProduct(row) {
  const price = Number(row.final_price_eur ?? row.price ?? 0);
  return (
    row.variant_id &&
    (row.product_type === 'tire' || row.product_type === 'rim') &&
    Number.isFinite(price) &&
    price > 0
  );
}

async function fetchProducts() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Run through the Mitra project wrapper: source ~/.config/projects/bin/project && project mitraauto && npm run sitemap:products');
  }

  return fetchProductsFromDatabase();
}

function fetchProductsFromDatabase() {
  const rows = [];
  const databaseEnv = getPostgresEnvironment(process.env.DATABASE_URL);

  for (let offset = 0; ; offset += 5000) {
    const query = `
      select coalesce(jsonb_agg(to_jsonb(sitemap_rows)), '[]'::jsonb)::text
      from public.catalog_list_product_sitemap_rows_v1(5000, ${offset}) as sitemap_rows;
    `;

    const result = spawnSync('psql', [
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-q',
      '-t',
      '-A',
      '-c',
      query,
    ], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50,
      env: {
        ...process.env,
        ...databaseEnv,
      },
    });

    if (result.status !== 0) {
      throw new Error(`Product sitemap database fetch failed: ${result.stderr.trim() || result.stdout.trim()}`);
    }

    const page = JSON.parse(result.stdout.trim() || '[]');
    if (!Array.isArray(page) || page.length === 0) break;

    rows.push(...page);
    if (page.length < 5000) break;
  }

  return {
    tireRows: rows.filter((row) => row.product_type === 'tire').filter(isSellablePublicProduct),
    rimRows: rows.filter((row) => row.product_type === 'rim').filter(isSellablePublicProduct),
  };
}

function getPostgresEnvironment(databaseUrl) {
  const url = new URL(databaseUrl);

  return {
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, '')),
    PGSSLMODE: url.searchParams.get('sslmode') ?? 'require',
  };
}

function buildSitemapEntries(products) {
  const entriesByUrl = new Map();
  const stats = {
    eligibleProducts: products.length,
    skippedMissingSlug: 0,
    duplicateUrlRows: 0,
  };

  for (const row of products) {
    const productType = row.product_type === 'rim' ? 'rim' : 'tire';

    for (const language of ['fi', 'en']) {
      const identifier = getCanonicalIdentifier(row, language);
      if (!identifier) {
        stats.skippedMissingSlug += 1;
        continue;
      }

      const path = buildProductPath(language, productType, identifier);
      const loc = `${SITE_URL}${path}`;

      if (entriesByUrl.has(loc)) {
        stats.duplicateUrlRows += 1;
        continue;
      }

      entriesByUrl.set(loc, {
        loc,
        lastmod: TODAY,
        changefreq: 'daily',
        priority: productType === 'tire' ? '0.6' : '0.6',
      });
    }
  }

  return {
    entries: [...entriesByUrl.values()].sort((a, b) => a.loc.localeCompare(b.loc)),
    stats,
  };
}

function writeUrlset(filename, entries) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      `    <lastmod>${entry.lastmod}</lastmod>`,
      `    <changefreq>${entry.changefreq}</changefreq>`,
      `    <priority>${entry.priority}</priority>`,
      '  </url>',
    ].join('\n')),
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(join(PUBLIC_DIR, filename), xml);
}

function writeIndex(filenames) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...filenames.map((filename) => [
      '  <sitemap>',
      `    <loc>${SITE_URL}/${escapeXml(filename)}</loc>`,
      `    <lastmod>${TODAY}</lastmod>`,
      '  </sitemap>',
    ].join('\n')),
    '</sitemapindex>',
    '',
  ].join('\n');

  writeFileSync(join(PUBLIC_DIR, 'sitemap-products.xml'), xml);
}

function removeOldProductSitemaps() {
  for (let index = 1; index <= 20; index += 1) {
    rmSync(join(PUBLIC_DIR, `sitemap-products-${index}.xml`), { force: true });
  }
  rmSync(join(PUBLIC_DIR, 'sitemap-products.xml'), { force: true });
}

function chunkEntries(entries) {
  const chunks = [];
  for (let index = 0; index < entries.length; index += MAX_URLS_PER_SITEMAP) {
    chunks.push(entries.slice(index, index + MAX_URLS_PER_SITEMAP));
  }
  return chunks;
}

async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const { tireRows, rimRows } = await fetchProducts();
  const { entries, stats } = buildSitemapEntries([...tireRows, ...rimRows]);
  const chunks = chunkEntries(entries);
  const filenames = chunks.map((_, index) => `sitemap-products-${index + 1}.xml`);

  removeOldProductSitemaps();
  chunks.forEach((chunk, index) => writeUrlset(filenames[index], chunk));
  writeIndex(filenames);

  console.log(JSON.stringify({
    generatedAt: TODAY,
    tireRows: tireRows.length,
    rimRows: rimRows.length,
    eligibleProducts: stats.eligibleProducts,
    sitemapUrls: entries.length,
    sitemapFiles: filenames,
    skippedMissingSlug: stats.skippedMissingSlug,
    duplicateUrlRows: stats.duplicateUrlRows,
    maxUrlsPerSitemap: MAX_URLS_PER_SITEMAP,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
