import { readFileSync } from 'node:fs';

const redirects = readFileSync('src/public/_redirects', 'utf8');
const headers = readFileSync('src/public/_headers', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');
const siteApp = readFileSync('src/SiteApp.tsx', 'utf8');
const policy = readFileSync('src/utils/privateRoutePolicy.ts', 'utf8');
const notFound = readFileSync('src/public/404.html', 'utf8');

const protectedRedirectRules = [
  ['/admin', '/404.html', '404'],
  ['/admin/*', '/404.html', '404'],
  ['/cms', '/404.html', '404'],
  ['/cms/*', '/404.html', '404'],
  ['/pwa', '/404.html', '404'],
  ['/pwa/*', '/404.html', '404'],
  ['/account', '/404.html', '404'],
  ['/account/*', '/404.html', '404'],
  ['/customer', '/404.html', '404'],
  ['/customer/*', '/404.html', '404'],
  ['/customer-account', '/404.html', '404'],
  ['/booking/manage', '/404.html', '404'],
  ['/booking/manage/*', '/404.html', '404'],
  ['/en/account', '/404.html', '404'],
  ['/en/account/*', '/404.html', '404'],
  ['/en/customer', '/404.html', '404'],
  ['/en/customer/*', '/404.html', '404'],
  ['/en/booking/manage', '/404.html', '404'],
  ['/en/booking/manage/*', '/404.html', '404'],
];

const requiredHeaderPatterns = [
  '/404.html',
  '/admin*',
  '/cms*',
  '/pwa*',
  '/account*',
  '/customer*',
  '/booking/manage*',
  '/en/account*',
  '/en/customer*',
  '/en/booking/manage*',
];

function fail(message, detail = {}) {
  console.error(JSON.stringify({ error: message, ...detail }, null, 2));
  process.exit(1);
}

const lines = redirects
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

const fallbackIndex = lines.findIndex((line) => line === '/* /index.html 200');
if (fallbackIndex === -1) {
  fail('SPA fallback is missing from _redirects');
}

const missingRedirects = [];
const misplacedRedirects = [];
for (const [from, to, status] of protectedRedirectRules) {
  const expected = `${from} ${to} ${status}`;
  const index = lines.indexOf(expected);
  if (index === -1) {
    missingRedirects.push(expected);
  } else if (index > fallbackIndex) {
    misplacedRedirects.push(expected);
  }
}

if (missingRedirects.length > 0 || misplacedRedirects.length > 0) {
  fail('Protected route redirect rules are missing or placed after the SPA fallback', {
    missingRedirects,
    misplacedRedirects,
  });
}

const unsafeCmsRewrites = lines.filter((line) => /^\/(?:cms|admin|pwa)(?:\/\*)?\s+\/\s+200$/.test(line));
if (unsafeCmsRewrites.length > 0) {
  fail('Unsafe private route SPA rewrites remain', { unsafeCmsRewrites });
}

const missingHeaderPatterns = requiredHeaderPatterns.filter((pattern) => !headers.includes(`${pattern}\n`));
if (missingHeaderPatterns.length > 0) {
  fail('Protected route noindex header patterns are missing', { missingHeaderPatterns });
}

for (const pattern of requiredHeaderPatterns) {
  const blockStart = headers.indexOf(`${pattern}\n`);
  const nextBlock = headers.indexOf('\n/', blockStart + pattern.length + 1);
  const block = headers.slice(blockStart, nextBlock === -1 ? undefined : nextBlock);
  if (!block.includes('X-Robots-Tag: noindex, nofollow, noarchive')) {
    fail('Protected route header block is missing X-Robots-Tag', { pattern });
  }
  if (!block.includes('Cache-Control: no-store')) {
    fail('Protected route header block is missing no-store', { pattern });
  }
}

if (!notFound.includes('name="robots" content="noindex, nofollow, noarchive"')) {
  fail('Static 404 page is missing noindex robots metadata');
}

if (!policy.includes('VITE_ENABLE_PRIVATE_APP_ROUTES')) {
  fail('Private route policy is missing the explicit internal opt-in flag');
}

if (!policy.includes('isStandalonePwaDeploy')) {
  fail('Private route policy is missing standalone PWA allowance');
}

if (!siteApp.includes('shouldBlockPrivateAppRoute(normalizedPath)')) {
  fail('SiteApp route dispatch does not check the private route boundary');
}

if (!siteApp.includes("transitionNavigationState('not-found');")) {
  fail('SiteApp private route boundary does not route to the safe not-found state');
}

if (!main.includes('canServePrivateAppRoutes()')) {
  fail('main.tsx CMS PWA bootstrap path does not check the private route boundary');
}

console.log(`Private route boundary check passed: ${protectedRedirectRules.length} protected redirect rules and ${requiredHeaderPatterns.length} header blocks verified.`);
