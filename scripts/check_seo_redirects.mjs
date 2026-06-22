import { readFileSync } from 'node:fs';

const redirects = readFileSync('src/public/_redirects', 'utf8');
const expectedRedirects = [
  ['/shop', '/catalog', '301'],
  ['/en/shop', '/en/catalog', '301'],
  ['/services', '/en/services', '301'],
  ['/tire-hotel', '/en/services/tire-hotel', '301'],
  ['/about', '/en/about', '301'],
  ['/legal/privacy', '/privacy', '301'],
  ['/legal/terms', '/terms', '301'],
  ['/helsinki/autohuolto', '/palvelut/autohuolto', '301'],
  ['/en/helsinki/car-service', '/en/services/car-service', '301'],
  ['/helsinki/renkaanvaihto', '/palvelut/renkaanvaihto', '301'],
  ['/en/helsinki/tire-change', '/en/services/tire-change', '301'],
  ['/helsinki/rengashotelli', '/palvelut/rengashotelli', '301'],
  ['/en/helsinki/tire-hotel', '/en/services/tire-hotel', '301'],
  ['/palvelut/dpf-pesu', '/palvelut/dpf-huolto', '301'],
  ['/en/services/dpf-cleaning', '/en/services/dpf-service', '301'],
];

const lines = redirects
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

const missing = expectedRedirects.filter(([from, to, status]) => (
  !lines.includes(`${from} ${to} ${status}`)
));

const fallbackIndex = lines.findIndex((line) => line === '/* /index.html 200');
const misplaced = expectedRedirects.filter(([from]) => {
  const index = lines.findIndex((line) => line.startsWith(`${from} `));
  return index === -1 || fallbackIndex === -1 || index > fallbackIndex;
});

if (missing.length > 0 || misplaced.length > 0) {
  console.error(JSON.stringify({ missing, misplaced }, null, 2));
  process.exit(1);
}

console.log(`SEO static redirect check passed: ${expectedRedirects.length} permanent redirects before SPA fallback.`);
