# R-1 - Public/Private Boundary And CMS Route Protection

Recorded: 2026-06-22

Status:

```text
Complete locally. Production deployment verification is still required.
```

## Security Invariant

Public-site builds must not mount CMS, admin, PWA, account, customer, or booking-management private interfaces for unauthenticated public routes.

Protected routes must resolve to a safe not-found state or host-level `404` before private UI renders.

## What Changed

| Area | File | Change |
| --- | --- | --- |
| Private route policy | `src/utils/privateRoutePolicy.ts` | Added a central private-route detector and public-site blocking policy. Dev, standalone PWA deploys, and explicit `VITE_ENABLE_PRIVATE_APP_ROUTES=true` builds can still serve private routes. |
| SPA route dispatch | `src/SiteApp.tsx` | Blocks private route families before CMS/PWA/account/customer components can mount. |
| App bootstrap | `src/main.tsx` | Prevents `/pwa` and installed-PWA CMS bootstrap from mounting the CMS PWA runtime unless private routes are allowed. |
| Host route rules | `src/public/_redirects` | Replaced unsafe `/cms` SPA rewrites with protected route safe-404 rules before the SPA fallback. |
| Host headers | `src/public/_headers` | Added `no-store` and `X-Robots-Tag: noindex, nofollow, noarchive` for protected route families and the static 404 page. |
| Static 404 | `src/public/404.html` | Added a noindex static 404 page for host-level protected-route handling. |
| Regression check | `scripts/check_private_route_boundary.mjs` | Added a focused check for protected redirects, headers, static 404 metadata, SPA dispatch guard, and PWA bootstrap guard. |
| Package script | `package.json` | Added `npm run private-routes:check`. |

## Protected Route Families

```text
/admin
/cms
/pwa
/account
/customer
/customer-account
/booking/manage
/en/account
/en/customer
/en/booking/manage
```

## Local Browser Smoke

| Route | Result | Evidence |
| --- | --- | --- |
| `http://127.0.0.1:4173/cms` | Passed | Rendered the public not-found page; no CMS login/admin/PWA text detected. |
| `http://127.0.0.1:4173/pwa` | Passed | Rendered the public not-found page; no CMS PWA login text detected after bootstrap guard. |
| `http://127.0.0.1:4173/customer-account` | Passed | Rendered the public not-found page; no private customer/account UI detected. |
| `http://127.0.0.1:4173/palvelut/autohuolto` | Passed | Public service route still rendered with the expected service title. |

Browser console check:

```text
No browser console errors were returned for the final sampled public route.
```

## Verification

| Command | Result |
| --- | --- |
| `npm run private-routes:check` | Passed. |
| `node scripts/check_seo_redirects.mjs` | Passed. |
| `npm run i18n:audit` | Passed. |
| `npm run build` | Passed with the existing large-chunk warning. |
| `npm run sitemap:check` | Passed: `60918` URLs across `2` product sitemap files. |
| `npm run feed:check` | Passed: `31575` Merchant feed items. |
| `npm run commerce:check` | Passed. |
| `test -f build/404.html && test -f build/_redirects && test -f build/_headers && rg -n "^/cms /404\\.html 404|^/pwa /404\\.html 404|^/customer-account /404\\.html 404|X-Robots-Tag: noindex, nofollow, noarchive" build/_redirects build/_headers build/404.html` | Passed. |
| `npx vite preview --host 127.0.0.1 --port 4173` plus Playwright browser smoke | Passed. |

## Remaining Proof Gap

This closes R-1 in local source and built preview.

It does not prove live production behavior until the patched source is deployed and `www` is crawled again. The production host must honor the protected-route rules or enforce equivalent Cloudflare Access, Worker, or provider routing before the SPA fallback.

## Next

```text
Continue with R-2 - Figma Make source sync and preview verification.
Then R-3 should verify production robots, sitemaps, Merchant feed, and protected-route status on the live host.
```
