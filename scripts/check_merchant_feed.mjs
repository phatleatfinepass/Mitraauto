import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_DIR = 'src/public';
const FEED_FILE = 'merchant-products.xml';
const PRODUCT_LINK_PATTERN = /^https:\/\/www\.mitra-auto\.fi\/catalog\/(?:tire|rim)\/[a-z0-9-]+$/;

function read(path) {
  return readFileSync(path, 'utf8');
}

function fail(message, detail = {}) {
  console.error(JSON.stringify({ error: message, ...detail }, null, 2));
  process.exit(1);
}

function values(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`, 'g'))].map((match) => match[1]);
}

const headers = read(join(PUBLIC_DIR, '_headers'));
if (!headers.includes('/merchant-products.xml')) {
  fail('_headers does not include merchant feed XML headers');
}

const xml = read(join(PUBLIC_DIR, FEED_FILE));
if (!xml.includes('xmlns:g="http://base.google.com/ns/1.0"')) {
  fail('Merchant feed is missing Google namespace');
}

const itemCount = (xml.match(/<item>/g) ?? []).length;
if (itemCount === 0 || itemCount > 50000) {
  fail('Merchant feed item count is invalid', { itemCount });
}

const requiredTags = [
  'g:id',
  'g:title',
  'g:description',
  'g:link',
  'g:image_link',
  'g:availability',
  'g:condition',
  'g:price',
  'g:brand',
  'g:mpn',
];

for (const tag of requiredTags) {
  const count = values(xml, tag).length;
  if (count !== itemCount) {
    fail('Merchant feed required tag count mismatch', { tag, count, itemCount });
  }
}

for (const link of values(xml, 'g:link')) {
  if (!PRODUCT_LINK_PATTERN.test(link)) {
    fail('Merchant feed link is not a canonical product URL', { link });
  }
}

for (const price of values(xml, 'g:price')) {
  if (!/^\d+\.\d{2} EUR$/.test(price)) {
    fail('Merchant feed price is not a VAT-inclusive EUR value', { price });
  }
}

for (const availability of values(xml, 'g:availability')) {
  if (availability !== 'in stock' && availability !== 'out of stock') {
    fail('Merchant feed availability is invalid', { availability });
  }
}

console.log(`Merchant feed check passed: ${itemCount} items in ${FEED_FILE}.`);
