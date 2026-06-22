import { readFileSync } from 'node:fs';

const files = {
  helper: 'src/utils/productCommerce.ts',
  productDetail: 'src/components/catalog/ProductDetailPage.tsx',
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

const helper = read(files.helper);
assertIncludes(files.helper, helper, 'export function getProductCommerceSnapshot');
assertIncludes(files.helper, helper, 'sku: productId');
assertIncludes(files.helper, helper, 'gtin: normalizeGtin(product.ean)');
assertIncludes(files.helper, helper, 'unitPriceInclVatCents');
assertIncludes(files.helper, helper, 'schemaAvailability');

const productDetail = read(files.productDetail);
assertIncludes(files.productDetail, productDetail, "import { getProductCommerceSnapshot } from '../../utils/productCommerce';");
assertIncludes(files.productDetail, productDetail, 'sku: commerceSchema.sku');
assertIncludes(files.productDetail, productDetail, 'gtin: commerceSchema.gtin');
assertIncludes(files.productDetail, productDetail, 'price: commerceSchema.unitPriceInclVatEur.toFixed(2)');
assertIncludes(files.productDetail, productDetail, 'availability: commerceSchema.schemaAvailability');

const cartDrawer = read(files.cartDrawer);
assertIncludes(files.cartDrawer, cartDrawer, "import { getProductCommerceSnapshot } from '../../../utils/productCommerce';");
assertIncludes(files.cartDrawer, cartDrawer, 'commerce.lineTotalInclVatEur.toFixed(2)');
assertIncludes(files.cartDrawer, cartDrawer, 'commerce.unitPriceInclVatEur.toFixed(2)');

const checkout = read(files.checkout);
assertIncludes(files.checkout, checkout, "import { getProductCommerceSnapshot } from '../../../utils/productCommerce';");
assertIncludes(files.checkout, checkout, 'client_unit_price_cents: commerce.unitPriceInclVatCents');
assertIncludes(files.checkout, checkout, 'sku: commerce.sku');
assertIncludes(files.checkout, checkout, 'gtin: commerce.gtin');
assertIncludes(files.checkout, checkout, 'line_total_cents: commerce.lineTotalInclVatCents');

const siteApp = read(files.siteApp);
assertIncludes(files.siteApp, siteApp, 'ean: product.ean');

console.log('Product commerce contract check passed: schema, cart, checkout, and product mapping use the shared commerce snapshot.');
