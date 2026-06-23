import { readFileSync } from 'node:fs';

const files = {
  helper: 'src/utils/productCommerce.ts',
  productDetail: 'src/components/catalog/ProductDetailPage.tsx',
  catalogTranslations: 'src/i18n/dictionaries/catalog.ts',
  feedGenerator: 'scripts/generate_merchant_feed.mjs',
  feedCheck: 'scripts/check_merchant_feed.mjs',
  cartContext: 'src/components/site/cart/CartContext.tsx',
  cartDrawer: 'src/components/site/cart/CartDrawer.tsx',
  checkout: 'src/components/site/checkout/CheckoutPage.tsx',
  siteApp: 'src/SiteApp.tsx',
};

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertIncludes(path, source, expected) {
  if (!source.includes(expected)) {
    throw new Error(`${path} is missing expected product commerce contract: ${expected}`);
  }
}

function assertNotIncludes(path, source, unexpected) {
  if (source.includes(unexpected)) {
    throw new Error(`${path} contains blocked product commerce pattern: ${unexpected}`);
  }
}

const helper = read(files.helper);
assertIncludes(files.helper, helper, 'export function getProductCommerceSnapshot');
assertIncludes(files.helper, helper, 'export const PRODUCT_HOME_DELIVERY_FEE_INCL_VAT_EUR = 50;');
assertIncludes(files.helper, helper, 'export const PRODUCT_RETURN_WINDOW_DAYS = 14;');
assertIncludes(files.helper, helper, "export const PRODUCT_POLICY_COUNTRY = 'FI';");
assertIncludes(files.helper, helper, 'sku: productId');
assertIncludes(files.helper, helper, 'gtin: normalizeGtin(product.ean)');
assertIncludes(files.helper, helper, 'unitPriceInclVatCents');
assertIncludes(files.helper, helper, 'schemaAvailability');

const productDetail = read(files.productDetail);
assertIncludes(files.productDetail, productDetail, "PRODUCT_HOME_DELIVERY_FEE_INCL_VAT_EUR");
assertIncludes(files.productDetail, productDetail, "PRODUCT_POLICY_COUNTRY");
assertIncludes(files.productDetail, productDetail, "PRODUCT_RETURN_WINDOW_DAYS");
assertIncludes(files.productDetail, productDetail, 'const hasSellablePrice = commerce.hasSellablePrice;');
assertIncludes(files.productDetail, productDetail, 'const productInStock = commerce.inStock;');
assertIncludes(files.productDetail, productDetail, 'const productCanPurchase = commerce.canPurchase;');
assertIncludes(files.productDetail, productDetail, 'sku: commerceSchema.sku');
assertIncludes(files.productDetail, productDetail, 'gtin: commerceSchema.gtin');
assertIncludes(files.productDetail, productDetail, 'price: commerceSchema.unitPriceInclVatEur.toFixed(2)');
assertIncludes(files.productDetail, productDetail, 'availability: commerceSchema.schemaAvailability');
assertIncludes(files.productDetail, productDetail, "shippingDetails");
assertIncludes(files.productDetail, productDetail, "hasMerchantReturnPolicy: merchantReturnPolicy");
assertIncludes(files.productDetail, productDetail, "merchantReturnDays: PRODUCT_RETURN_WINDOW_DAYS");
assertIncludes(files.productDetail, productDetail, "returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility'");
assertIncludes(files.productDetail, productDetail, "merchantReturnLink: policyUrl");
assertIncludes(files.productDetail, productDetail, "disabled={!productCanPurchase}");
assertNotIncludes(files.productDetail, productDetail, 'aggregateRating');

const catalogTranslations = read(files.catalogTranslations);
assertIncludes(files.catalogTranslations, catalogTranslations, 'Home delivery in Finland is €{{homeDeliveryFee}}');
assertIncludes(files.catalogTranslations, catalogTranslations, '{{returnDays}}-day return right');

const feedGenerator = read(files.feedGenerator);
assertIncludes(files.feedGenerator, feedGenerator, 'const VAT_MULTIPLIER = 1.255;');
assertIncludes(files.feedGenerator, feedGenerator, 'const HOME_DELIVERY_FEE_INCL_VAT_EUR = 50;');
assertIncludes(files.feedGenerator, feedGenerator, "const SHIPPING_COUNTRY = 'FI';");
assertIncludes(files.feedGenerator, feedGenerator, '<g:shipping>');
assertIncludes(files.feedGenerator, feedGenerator, '<g:country>${SHIPPING_COUNTRY}</g:country>');
assertIncludes(files.feedGenerator, feedGenerator, '<g:price>${HOME_DELIVERY_FEE_INCL_VAT_EUR.toFixed(2)} EUR</g:price>');
assertIncludes(files.feedGenerator, feedGenerator, "const availability = row.in_stock ? 'in stock' : 'out of stock';");

const feedCheck = read(files.feedCheck);
assertIncludes(files.feedCheck, feedCheck, '<g:shipping>');
assertIncludes(files.feedCheck, feedCheck, '<g:country>FI<\\/g:country>');
assertIncludes(files.feedCheck, feedCheck, '<g:price>50\\.00 EUR<\\/g:price>');

const cartContext = read(files.cartContext);
assertIncludes(files.cartContext, cartContext, "import { getProductCommerceSnapshot } from '../../../utils/productCommerce';");
assertIncludes(files.cartContext, cartContext, 'return getProductCommerceSnapshot(item?.product ?? item).baseUnitPriceExVatEur;');
assertIncludes(files.cartContext, cartContext, "console.error('Failed to load cart from localStorage');");
assertNotIncludes(files.cartContext, cartContext, "console.error('Failed to load cart from localStorage:', error)");

const cartDrawer = read(files.cartDrawer);
assertIncludes(files.cartDrawer, cartDrawer, "import { getProductCommerceSnapshot } from '../../../utils/productCommerce';");
assertIncludes(files.cartDrawer, cartDrawer, 'commerce.lineTotalInclVatEur.toFixed(2)');
assertIncludes(files.cartDrawer, cartDrawer, 'commerce.unitPriceInclVatEur.toFixed(2)');

const checkout = read(files.checkout);
assertIncludes(files.checkout, checkout, "PRODUCT_HOME_DELIVERY_FEE_INCL_VAT_EUR");
assertIncludes(files.checkout, checkout, 'const HOME_DELIVERY_FEE_EUR = PRODUCT_HOME_DELIVERY_FEE_INCL_VAT_EUR;');
assertIncludes(files.checkout, checkout, 'getProductCommerceSnapshot');
assertIncludes(files.checkout, checkout, 'client_unit_price_cents: commerce.unitPriceInclVatCents');
assertIncludes(files.checkout, checkout, 'sku: commerce.sku');
assertIncludes(files.checkout, checkout, 'gtin: commerce.gtin');
assertIncludes(files.checkout, checkout, 'line_total_cents: commerce.lineTotalInclVatCents');

const siteApp = read(files.siteApp);
assertIncludes(files.siteApp, siteApp, 'ean: product.ean');

console.log('Product commerce contract check passed: product UI, Product/Offer schema, Merchant feed shipping, cart, checkout, and product mapping use the shared commerce contract.');
