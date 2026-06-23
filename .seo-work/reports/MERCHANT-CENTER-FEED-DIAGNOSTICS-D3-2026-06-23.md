# D-3 - Merchant Center Feed Diagnostics And Product Policy Approval

Status: Complete with blockers carried

Recorded: 2026-06-23

## Purpose

D-3 records whether Mitra Auto has enough Merchant Center, feed, and product-policy evidence to call product visibility ready.

It does not. Local feed and commerce-source gates pass, but Merchant Center readback is unavailable, the live production feed URL returns the Figma HTML shell instead of XML, and product-policy facts still need owner/legal approval.

## Evidence State

| Evidence mode | State | Meaning |
| --- | --- | --- |
| `REPO` | `EXECUTED_WITH_FINDINGS` | Feed generator, feed checker, product-commerce contract, product page, cart, checkout, and policy copy exist. |
| `LOCAL_GATE` | `EXECUTED` | Local Merchant feed, static asset, and product-commerce checks passed. |
| `LIVE` | `EXECUTED_WITH_FINDINGS` | Production `merchant-products.xml` returns `200 text/html` with the Figma shell, not XML. |
| `PLATFORM` | `UNAVAILABLE` | No Merchant Center account, website claim, data source, diagnostics, item status, issue, shipping/return, or performance readback was available. |
| `OWNER_POLICY` | `UNAVAILABLE` | Shipping, pickup, installation, returns, warranty, stock, delivery, condition, and fitment policies are not owner/legal approved. |
| `OFFICIAL_DOCS` | `REVIEWED_2026_06_23` | Google Merchant Center and Merchant listing docs were reviewed for D-3 evidence requirements. |

## Local Feed Result

| Check | Result |
| --- | --- |
| `npm run feed:check` | Passed. `31528` items in `merchant-products.xml`. |
| `npm run commerce:check` | Passed. Product UI, Product/Offer schema, Merchant feed shipping, cart, checkout, and product mapping use the shared commerce contract. |
| `npm run static-assets:check` | Passed. Source static assets include `merchant-products.xml`, `_headers`, `_redirects`, robots, and sitemap files. |
| Feed summary | `31528` items, `31528` GTINs, `31528` in-stock offers, `0` out-of-stock offers, `31528` new-condition offers, and `31528` FI shipping entries at `50.00 EUR`. |

Local feed file:

| Field | Value |
| --- | --- |
| Path | `src/public/merchant-products.xml` |
| Size | `36405465` bytes |
| Currency | `EUR` |
| VAT policy | Generator multiplies ex-VAT source price by `1.255` and emits VAT-inclusive EUR prices. |
| First link sample | `https://www.mitra-auto.fi/catalog/rim/rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10` |

## Source Contract

| Surface | Current source behavior | D-3 state |
| --- | --- | --- |
| Feed generator | `scripts/generate_merchant_feed.mjs` emits canonical slug URLs, title, description, image, availability, `new` condition, VAT-inclusive price, FI shipping, brand, GTIN, MPN, Google product category, and product type. | Source passes local checks. |
| Feed checker | `scripts/check_merchant_feed.mjs` validates required tags, item count, canonical URLs, price format, availability values, FI shipping, and XML headers. | Source passes local checks. |
| Product commerce contract | `src/utils/productCommerce.ts` centralizes product price, VAT, GTIN, SKU, stock, stock quantity, availability, image, and delivery-day fields. | Source passes local checks. |
| Product page/schema | `src/components/catalog/ProductDetailPage.tsx` emits Product/Offer schema with price, availability, shippingDetails, merchant return policy, GTIN/SKU/MPN, and inventory level. | Source passes local checks; provider/readback unavailable. |
| Checkout | `src/components/site/checkout/CheckoutPage.tsx` sends client unit price cents, SKU, GTIN, stock quantity, line totals, and delivery day range for server-side revalidation. | Source passes local checks; live provider outcome not part of D-3. |
| Policy copy | `src/i18n/dictionaries/catalog.ts` and `src/i18n/dictionaries/legal.ts` contain shipping, return, delivery, warranty, supplier-stock, installation, and fitment statements. | Owner/legal approval required. |

## Live Production Result

| URL | Expected | Observed | Severity |
| --- | --- | --- | --- |
| `https://www.mitra-auto.fi/merchant-products.xml` | `200 application/xml` or `text/xml` with Merchant RSS feed body | `200 text/html`; body starts with `<!doctype html> <!-- Created in Figma Make -->` | Blocker |
| `https://www.mitra-auto.fi/sitemap-products.xml` | `200 application/xml` or `text/xml` | `200 text/html` | Blocker |

This means the production host still does not serve the repo feed asset before SPA fallback. A Merchant Center data source pointed at the public URL would not ingest the local XML body.

## Merchant Center Readback

| Required readback | Status | Evidence |
| --- | --- | --- |
| Account ID and owner/access role | Blocked | Project wrapper has no Merchant Center account metadata or credential status. |
| Website claim for `https://www.mitra-auto.fi` | Blocked | Merchant Center access/export unavailable. |
| Feed/data source URL and schedule | Blocked | Merchant Center access/export unavailable. |
| Last fetch, HTTP status, processing state | Blocked | Merchant Center access/export unavailable. |
| Item count and status | Blocked | Merchant Center access/export unavailable. |
| Needs attention/account issues | Blocked | Merchant Center access/export unavailable. |
| Product disapprovals/warnings | Blocked | Merchant Center access/export unavailable. |
| Free listings, Shopping ads, local inventory eligibility | Blocked | Merchant Center access/export unavailable. |
| Shipping and return settings | Blocked | Merchant Center access/export unavailable. |
| Automatic item updates and price/availability mismatch diagnostics | Blocked | Merchant Center access/export unavailable. |
| Performance | Blocked | Merchant Center access/export unavailable. |

## Findings

### BLOCKER - Merchant Center Authenticated Diagnostics Unavailable

- Evidence: no Merchant Center account ID, merchant ID, website claim, data source, diagnostics, item status, account issue, or shipping/return settings evidence was available.
- Impact: D-3 cannot confirm product approval, disapprovals, warning counts, website claim, feed ingestion, program eligibility, or Merchant product visibility.
- Owner: Ecommerce/Platform owner.
- Required resolution: provide account access or sanitized Merchant Center export/API evidence.

### BLOCKER - Production Merchant Feed URL Returns HTML

- Evidence: `https://www.mitra-auto.fi/merchant-products.xml` returns `200 text/html` and the body begins with the Figma shell marker.
- Impact: Merchant Center cannot reliably fetch the local XML feed from production.
- Owner: Deployment/Cloudflare owner.
- Required resolution: deploy repo static asset routing or equivalent provider rule so the live feed returns `200 application/xml` and the expected RSS body.

### CRITICAL - Product Policy Approval Unavailable

- Evidence: local source defines FI home delivery at `50.00 EUR`, a `14` day return window, checkout price/stock revalidation, fitment caveats, and legal warranty/delivery language, but no owner/legal/product approval is recorded.
- Impact: feed/schema/cart/checkout parity cannot be called Merchant-ready until the business confirms shipping, pickup, installation, return, warranty, used-condition, stock, delivery, and fitment rules.
- Owner: Product/Ecommerce/Legal owner.
- Required resolution: approve the product-policy source of truth and update feed/schema/cart/checkout/legal copy if any value changes.

### CRITICAL - All Feed Offers Are In Stock And New Condition

- Evidence: local feed summary found `31528` in-stock items, `0` out-of-stock items, and `31528` new-condition items.
- Impact: this is acceptable only if supplier/CMS data and checkout revalidation prove those products are genuinely purchasable as new. False stock or wrong condition can trigger Merchant issues and customer harm.
- Owner: Catalog/Product owner.
- Required resolution: confirm inventory source freshness, supplier-stock semantics, reservation behavior, and used/unique-item exclusion or separate lifecycle policy.

### WARNING - GTIN Authority Is Not Proven By Format Alone

- Evidence: the feed has `31528` GTIN values and source normalizes 8-14 digit values, but D-3 does not prove GS1 correctness or supplier authority.
- Impact: invalid identifiers can limit visibility or trigger item issues even when XML parsing passes.
- Owner: Catalog/Product owner.
- Required resolution: verify GTIN provenance from supplier/CMS data and use Merchant Center item diagnostics to catch invalid identifiers.

## Product Policy Packet Required

- Merchant Center account ID, account owner, access role, and website claim status for `https://www.mitra-auto.fi`.
- Data source/feed URL, schedule, last fetch time, fetch HTTP status, processing status, and item count.
- Needs attention/account issues, product disapproval counts, warning counts, and issue examples by product ID.
- Program eligibility by Free listings, Shopping ads, Free local listings, Local inventory ads, and YouTube Shopping where applicable.
- Shipping and return settings, including FI delivery cost/speed, pickup/garage option, return window, return fees, and product-condition eligibility.
- Automatic item update settings and price/availability mismatch diagnostics.
- Representative item diagnostics for tire and rim canonical URLs, including landing page crawl, price, availability, GTIN, condition, image, shipping, and return state.
- Owner/legal approval for shipping, pickup, installation, returns, warranty, used condition, supplier-stock, stock freshness, delivery time, and fitment authority.

## Implementation Policy

No source code was changed in D-3. Local source checks pass, and the remaining work is provider/live deployment/owner-policy evidence.

Files likely to change after evidence:

- `scripts/generate_merchant_feed.mjs`
- `scripts/check_merchant_feed.mjs`
- `src/utils/productCommerce.ts`
- `src/components/catalog/ProductDetailPage.tsx`
- `src/components/site/checkout/CheckoutPage.tsx`
- `src/i18n/dictionaries/catalog.ts`
- `src/i18n/dictionaries/legal.ts`
- `src/public/merchant-products.xml`
- `src/public/_headers`
- `src/public/_redirects`

Non-repo work likely required:

- Merchant Center website claim.
- Merchant Center data source/feed scheduling.
- Merchant Center shipping and return settings.
- Merchant Center diagnostics export.
- Owner/legal product policy approval.

## Official Source Notes

Reviewed official Google docs:

- `https://support.google.com/merchants/answer/7052112?hl=en`
- `https://support.google.com/merchants/answer/6324448?hl=en`
- `https://support.google.com/merchants/answer/6324461?hl=en`
- `https://developers.google.com/search/docs/appearance/structured-data/merchant-listing`
- `https://support.google.com/merchants/answer/6150127?hl=en`
- `https://support.google.com/merchants/answer/15624943?hl=en-IE`
- `https://support.google.com/merchants/answer/15620708?hl=en-GB`

Operational rules applied:

- Product price must match landing page, structured data, and checkout, and include VAT for Finland.
- Availability must reflect actual purchasability and be current on the landing page and checkout.
- Shipping and return information should be accurate and visible enough for shoppers to make a decision.
- GTINs should be submitted only when correct; do not guess identifiers.
- Merchant offers must not omit material pricing, shipping, return, identity, or availability information.

## Verification

```text
npm run feed:check: passed
npm run commerce:check: passed
npm run static-assets:check: passed
project wrapper Merchant Center metadata check: passed with Merchant metadata missing
live merchant feed curl: passed with blocker finding; production returns text/html Figma shell
local merchant feed summary: passed
```

## Decision

```text
D-3 is complete as a Merchant Center/feed/product-policy evidence gate.
D-3 is not a Merchant Center or product-SEO readiness pass.
Local source checks pass, but Merchant readiness remains blocked by missing Merchant Center readback, live production feed serving HTML, and missing owner/legal approval for shipping, pickup, installation, returns, warranty, stock, delivery, condition, and fitment policies.
Next task is D-4 - Analytics, Events, Booking/Order Reconciliation, And Consent Gate.
```
