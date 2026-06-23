# E-3 - Live Crawl And Browser Smoke Evidence

Recorded: 2026-06-22

Status: Complete with live release blockers

## Decision

E-3 can close as an evidence task. Mitra cannot be release-ready or growth-ready from live evidence because production still has blocking access, migration, sitemap/feed, soft-404, and private-route exposure issues.

## Scope

Mode: public unauthenticated HTTP and browser smoke.

No destructive actions were run. No booking, checkout, payment, customer-data entry, cancellation, account action, or provider write was submitted.

## Release Blockers

| Severity | Finding | Evidence | Owner / next verification |
| --- | --- | --- | --- |
| `BLOCKER` | Public `/cms` exposes an unauthenticated CMS control center with apparent private records. | Browser rendered CMS control center at `https://www.mitra-auto.fi/cms`; sanitized pattern counts: phone-like `14`, plate-like `8`, email-like `1`. Raw values intentionally omitted. | Engineering/security: block public access at route/edge/app auth, rotate/clean exposed data if real, verify unauthenticated request returns `401`, `403`, or safe `404`. |
| `BLOCKER` | SEO static assets are not deployed correctly. | `robots.txt` and `sitemap.xml` return `404`; `sitemap-products.xml` and `merchant-products.xml` return `text/html` instead of XML. | Hosting/engineering: deploy static assets and verify exact public URLs return expected text/XML. |
| `CRITICAL` | Legacy redirects are not active on the `www` host. | `/shop`, `/services`, `/tire-hotel`, `/helsinki/autohuolto`, and `/palvelut/dpf-pesu` returned `200` HTML with `0` redirects. | Hosting/engineering: deploy redirect rules or edge function and verify one-hop permanent redirects. |
| `CRITICAL` | Opaque product identifier URL does not redirect to slug URL. | `/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697` returned `200` HTML, `0` redirects. | Hosting/engineering: deploy product redirect resolver and verify permanent redirect to slug. |
| `CRITICAL` | Invalid routes are soft-404s at HTTP level. | Random invalid URL returned HTTP `200`; browser rendered noindex 404 UI. | Engineering: return `404`/`410` from edge/server for unknown public routes. |
| `CRITICAL` | Checkout content can render on a product URL after cart action. | After `Lisää ostoskoriin` -> `Siirry kassalle`, checkout UI rendered while URL stayed on product detail path; canonical removed and robots changed to `noindex,nofollow`. | Frontend: make checkout navigation update URL to `/checkout`; verify route, title, canonical/noindex state. |

## Browser Positives

- Homepage rendered Finnish title, H1, canonical, `index,follow`, and service/catalog/contact actions.
- Finnish service page rendered route-specific title, H1, canonical, `index,follow`, service content, price/process sections, and booking actions.
- Product detail rendered product title, canonical, `index,follow`, stock/delivery/price content, and add-to-cart control.
- Booking modal opened from service page with license plate/date fields; no booking submitted.
- Product add-to-cart worked and exposed checkout start; no payment submitted.
- English mobile service page rendered English `lang`, H1, canonical, `index,follow`, and booking actions.
- English contact page rendered H1, canonical, `index,follow`, address, phone, and email.

## Additional Findings

Raw direct HTML responses have a generic pre-hydration title/description, no canonical, and an H1 indicating JavaScript is required. Browser hydration fixes many sampled indexable page heads, but the production site remains fragile for crawlers and non-JavaScript contexts.

Direct `/contact` rendered a noindex 404 UI in-browser but returned HTTP `200`. If `/contact` is intended, redirect it to `/en/contact`; otherwise return a real `404`.

Direct `/customer-account` rendered a noindex 404 UI in-browser but returned HTTP `200`. Keep private/account routes out of the public index and return a deliberate status.

## Verification

```text
command -v npx >/dev/null 2>&1 && echo 'npx=present' || echo 'npx=missing'; node -e "try{require.resolve('playwright'); console.log('playwright=present')}catch(e){console.log('playwright=missing')}": passed, npx present and local playwright package missing
source ~/.config/projects/bin/project && project mitraauto >/dev/null && psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -F $'\t' -Atc "select product_type, variant_id::text, coalesce(nullif(seo_slug_fi,''), generated_slug), coalesce(nullif(seo_slug_en,''), generated_slug), final_price_eur::text from public.catalog_list_product_sitemap_rows_v1(10,0) where coalesce(nullif(seo_slug_fi,''), generated_slug) is not null limit 4;": passed
for url in https://mitra-auto.fi/ https://www.mitra-auto.fi/ https://www.mitra-auto.fi/en https://www.mitra-auto.fi/en/services https://www.mitra-auto.fi/palvelut/autohuolto https://www.mitra-auto.fi/en/services/car-service https://www.mitra-auto.fi/catalog https://www.mitra-auto.fi/en/catalog https://www.mitra-auto.fi/catalog/rim/rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10 https://www.mitra-auto.fi/catalog/rim/00024bb0-2f88-dc51-fca7-b0c7bb8ed697 https://www.mitra-auto.fi/shop https://www.mitra-auto.fi/services https://www.mitra-auto.fi/tire-hotel https://www.mitra-auto.fi/helsinki/autohuolto https://www.mitra-auto.fi/palvelut/dpf-pesu https://www.mitra-auto.fi/checkout https://www.mitra-auto.fi/checkout/success https://www.mitra-auto.fi/customer-account https://www.mitra-auto.fi/cms https://www.mitra-auto.fi/pwa https://www.mitra-auto.fi/this-route-should-not-exist-e3 https://www.mitra-auto.fi/robots.txt https://www.mitra-auto.fi/sitemap.xml https://www.mitra-auto.fi/sitemap-products.xml https://www.mitra-auto.fi/merchant-products.xml; do curl -sSIL -o /dev/null --max-time 20 -w '%{url_effective}|http=%{http_code}|content_type=%{content_type}|redirects=%{num_redirects}|time=%{time_total}\n' "$url"; done: passed with findings
mcp__playwright browser smoke on homepage, service, product detail, add-to-cart, checkout start, booking modal, English mobile service page, contact, invalid route, /customer-account, /cms, and /pwa: passed with findings
```

## Cleanup

Generated Playwright snapshot and console files from the E-3 browser run were removed because `/cms` rendered sensitive-looking private route evidence. The durable evidence above is sanitized. E-3 websocket noise appended to the pre-existing `.playwright-mcp/console-2026-06-22T14-39-17-906Z.log` file was trimmed.
