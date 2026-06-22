# B-4 Product Schema, Feed, Cart, And Checkout Reconciliation

Recorded: 2026-06-22

Status: source contract, Merchant feed export, and server-side price/stock revalidation implemented. Production verification remains B-5/E-3.

## Scope

This B-4 pass reconciles product-facing commerce fields across the product detail page, Product JSON-LD, cart drawer, checkout payload, and Merchant Center feed policy.

It does not submit the feed to Merchant Center and does not prove deployed Edge Function behavior.

## Live Source Samples

Samples were selected from `public.catalog_list_product_sitemap_rows_v1`, the same source used for the product sitemap.

| Type | Variant ID | Canonical slug | Net price source | Stock |
| --- | --- | --- | --- | --- |
| Tire | `0e17c454-f24b-9caa-1320-ad16baff95b1` | `michelin-crossclimate-3-sport-255-45-r19-104-y-summer` | `211.08` EUR excl. VAT | In stock |
| Rim | `00024bb0-2f88-dc51-fca7-b0c7bb8ed697` | `rautamo-netto-brock-rc32-titanium-full-pol-7x17-5x110-et40-5x110-et-40-00-cb-65-10` | `139.03` EUR excl. VAT | In stock |

VAT policy: Mitra public UI, Product schema, cart, checkout, and Merchant feed price should expose consumer-facing EUR prices including Finnish VAT at 25.5%.

## Shared Product Commerce Contract

`src/utils/productCommerce.ts` is now the shared source for:

| Field | Contract |
| --- | --- |
| `sku` | Internal product `id` / variant UUID. |
| `gtin` | Normalized 8-14 digit EAN when available. |
| `mpn` | Product model when available. |
| `price` | VAT-inclusive consumer price derived from the net catalog price and pricing rules. |
| `availability` | `InStock` only when `in_stock=true` and stock is not zero. |
| `image` | First available product image from image URL, hero image, best image, gallery, or images. |
| `product_type` | `tire` or `rim`. |
| `line_total` | Quantity-adjusted VAT-inclusive line total after pricing rules. |

## Reconciliation Result

| Surface | Result | Evidence |
| --- | --- | --- |
| Product page visible price | Aligned | Uses the shared commerce snapshot for VAT-inclusive unit and line totals. |
| Product JSON-LD | Aligned | `sku`, `gtin`, `mpn`, `price`, `availability`, and `inventoryLevel` now derive from the shared commerce snapshot. |
| Cart drawer | Aligned | Uses shared commerce snapshot for product image, VAT-inclusive unit price, and VAT-inclusive line total. |
| Checkout UI summary | Aligned | Uses shared commerce snapshot for displayed unit and line totals. |
| Checkout Paytrail payload | Aligned | Uses shared commerce snapshot for `sku`, `gtin`, `mpn`, VAT-inclusive unit cents, line cents, stock, image, brand, model, and product type. |
| Merchant feed | Implemented at source/build level | `npm run feed:merchant` generates `src/public/merchant-products.xml` from the live public catalog source. |
| Backend checkout trust | Implemented at source level | `supabase/functions/payments_create_paytrail/index.ts` revalidates each product by `product_type` and variant SKU through the public catalog lookup RPCs before Paytrail creation. |

## Merchant Feed Draft Policy

The implemented feed export uses:

| Feed field | Source |
| --- | --- |
| `id` | Product `id` / variant UUID. |
| `title` | Localized catalog title or brand/model/size fallback. |
| `description` | Localized short/long catalog description. |
| `link` | Canonical slug URL from `catalogSeo`. |
| `image_link` | Shared commerce primary image. |
| `availability` | `in stock` only when shared commerce snapshot `inStock=true`; otherwise `out of stock` or excluded by lifecycle policy. |
| `price` | VAT-inclusive EUR price from shared commerce snapshot. |
| `brand` | Catalog brand. |
| `gtin` | Shared commerce normalized GTIN/EAN when available. |
| `mpn` | Product model or supplier/manufacturer code if owner approves. |
| `condition` | `new`, unless catalog owner introduces used/refurbished status. |
| `product_type` | Tire/rim taxonomy path. |
| `google_product_category` | Tire/rim vehicle-parts taxonomy path. |

## Implemented Blocker Resolution

- Added `scripts/generate_merchant_feed.mjs`.
- Added `scripts/check_merchant_feed.mjs`.
- Added `npm run feed:merchant` and `npm run feed:check`.
- Added `/merchant-products.xml` XML headers in `src/public/_headers`.
- Generated `src/public/merchant-products.xml` with 31,575 product items.
- Updated Paytrail payment creation to reject missing product identity, unavailable products, out-of-stock rows, over-stock quantities, missing catalog prices, and stale/tampered client unit prices.

## Remaining Release Risks

- Merchant Center submission and diagnostics are not verified.
- Deployed Edge Function behavior is not verified.
- Product URL collisions are deduped in the sitemap but still need catalog cleanup before feed scale.
- Production rendered schema validation remains B-5 because current schema is client-managed.

## Figma Make Boundary

Figma Make-relevant B-4 source files are under `src/` only.

Repo-only files such as scripts, Supabase functions, migrations, sitemap artifacts, and reports must not be listed as Figma Make patch files.
