import { readFileSync } from 'node:fs';

const files = {
  siteApp: 'src/SiteApp.tsx',
  checkout: 'src/components/site/checkout/CheckoutPage.tsx',
  checkoutSuccess: 'src/components/site/checkout/CheckoutSuccessPage.tsx',
  checkoutCancel: 'src/components/site/checkout/CheckoutCancelPage.tsx',
  emergencyModal: 'src/components/site/modals/EmergencyTowModal.tsx',
  edgeFunction: 'supabase/functions/payments_create_paytrail/index.ts',
  pagesFunction: 'functions/[[path]].ts',
};

function read(path) {
  return readFileSync(path, 'utf8');
}

function assertIncludes(path, source, expected) {
  if (!source.includes(expected)) {
    throw new Error(`${path} is missing checkout runtime contract: ${expected}`);
  }
}

function assertNotIncludes(path, source, unexpected) {
  if (source.includes(unexpected)) {
    throw new Error(`${path} contains blocked checkout runtime pattern: ${unexpected}`);
  }
}

const siteApp = read(files.siteApp);
assertIncludes(files.siteApp, siteApp, "onCheckout={() => navigate('/checkout')}");
assertIncludes(files.siteApp, siteApp, "'checkout',");
assertIncludes(files.siteApp, siteApp, "'checkout-cancel',");
assertIncludes(files.siteApp, siteApp, "'checkout-success',");
assertIncludes(files.siteApp, siteApp, "robots.content = 'noindex, nofollow';");
assertIncludes(files.siteApp, siteApp, 'canonical?.remove();');
assertIncludes(files.siteApp, siteApp, "normalizedPath === '/checkout/success'");
assertIncludes(files.siteApp, siteApp, "normalizedPath === '/checkout/cancel'");
assertIncludes(files.siteApp, siteApp, "normalizedPath === '/checkout'");
assertNotIncludes(files.siteApp, siteApp, "setCurrentPage('checkout');");
assertNotIncludes(files.siteApp, siteApp, "console.log('Auth state changed:");
assertNotIncludes(files.siteApp, siteApp, "Emergency Modal State Changed");
assertNotIncludes(files.siteApp, siteApp, "console.log('Logout initiated");
assertNotIncludes(files.siteApp, siteApp, "console.log('Supabase signOut successful");
assertNotIncludes(files.siteApp, siteApp, "console.log('Logout complete");
assertNotIncludes(files.siteApp, siteApp, "Emergency button clicked");
assertNotIncludes(files.siteApp, siteApp, "console.error('Failed to load catalog detail from URL:', error)");
assertNotIncludes(files.siteApp, siteApp, "console.error('Logout error:', error)");
assertNotIncludes(files.siteApp, siteApp, "console.error('Fallback logout error:', fallbackError)");
assertNotIncludes(files.siteApp, siteApp, "console.error('Failed to logout:', error)");

const checkout = read(files.checkout);
assertIncludes(files.checkout, checkout, "import { publicSiteUrl } from '../../../config/runtime';");
assertIncludes(files.checkout, checkout, 'success_url: `${publicSiteUrl}/checkout/success`');
assertIncludes(files.checkout, checkout, 'cancel_url: `${publicSiteUrl}/checkout/cancel`');
assertIncludes(files.checkout, checkout, "supabase.functions.invoke(\n        'payments_create_paytrail'");
assertNotIncludes(files.checkout, checkout, "console.log('Submitting Paytrail payload:");
assertNotIncludes(files.checkout, checkout, "console.log('Paytrail response:");
assertNotIncludes(files.checkout, checkout, "console.log('Payment initiated successfully");
assertNotIncludes(files.checkout, checkout, "console.error('Backend error:', data)");
assertNotIncludes(files.checkout, checkout, "console.error('Invalid payment response - no redirect_url:', data)");
assertNotIncludes(files.checkout, checkout, "console.error('Checkout error:', error)");
assertNotIncludes(files.checkout, checkout, "console.warn('Failed to restore checkout draft:', error)");
assertNotIncludes(files.checkout, checkout, "console.warn('Failed to save checkout draft:', error)");

const checkoutSuccess = read(files.checkoutSuccess);
assertNotIncludes(files.checkoutSuccess, checkoutSuccess, 'CHECKOUT SUCCESS DEBUG');
assertNotIncludes(files.checkoutSuccess, checkoutSuccess, "console.log('Paytrail redirect params:");
assertNotIncludes(files.checkoutSuccess, checkoutSuccess, "console.log('Paytrail finalize response:");
assertNotIncludes(files.checkoutSuccess, checkoutSuccess, "console.error('Failed to finalize Paytrail payment on success page', payload)");
assertNotIncludes(files.checkoutSuccess, checkoutSuccess, "console.error('Paytrail success finalization failed:', error)");
assertNotIncludes(files.checkoutSuccess, checkoutSuccess, "console.error('Error fetching order:', error)");
assertNotIncludes(files.checkoutSuccess, checkoutSuccess, "console.error('Error fetching order:', err)");

const checkoutCancel = read(files.checkoutCancel);
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.log('Paytrail cancel params:");
assertNotIncludes(files.checkoutCancel, checkoutCancel, 'CHECKOUT CANCEL DEBUG');
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.log('checkout-reference:");
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.log('checkout-transaction-id:");
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.log('checkout-stamp:");
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.log('Found order");
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.log('Loaded order for cancel page:");
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.log('Payment cancelled - cart preserved for retry");
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.error('Error in fetchOrderInfo:', err)");
assertNotIncludes(files.checkoutCancel, checkoutCancel, "console.warn('Could not find order on cancel page");

const emergencyModal = read(files.emergencyModal);
assertNotIncludes(files.emergencyModal, emergencyModal, 'EmergencyTowModal state changed');
assertNotIncludes(files.emergencyModal, emergencyModal, "console.log('SUPABASE URL:");
assertNotIncludes(files.emergencyModal, emergencyModal, "console.log('ANON KEY prefix:");
assertNotIncludes(files.emergencyModal, emergencyModal, "console.log('RPC payload keys:");
assertNotIncludes(files.emergencyModal, emergencyModal, "console.log('📞 Calling emergency_roadside_create RPC with payload:");
assertNotIncludes(files.emergencyModal, emergencyModal, "console.error('❌ RPC Error:', rpcError)");
assertNotIncludes(files.emergencyModal, emergencyModal, "console.log('✅ Emergency request created:");
assertNotIncludes(files.emergencyModal, emergencyModal, "console.error('❌ Submit error:', err)");

const edgeFunction = read(files.edgeFunction);
assertIncludes(files.edgeFunction, edgeFunction, 'const FRONTEND_SUCCESS_URL = Deno.env.get("FRONTEND_SUCCESS_URL") ?? "https://www.mitra-auto.fi/checkout/success";');
assertIncludes(files.edgeFunction, edgeFunction, 'const FRONTEND_CANCEL_URL = Deno.env.get("FRONTEND_CANCEL_URL") ?? "https://www.mitra-auto.fi/checkout/cancel";');
assertIncludes(files.edgeFunction, edgeFunction, 'const FRONTEND_ALLOWED_ORIGINS = buildFrontendAllowedOrigins();');
assertIncludes(files.edgeFunction, edgeFunction, 'function normalizeFrontendRedirectUrl');
assertIncludes(files.edgeFunction, edgeFunction, 'const successUrl = resolveSuccessUrl(input, legacyReturnUrl);');
assertIncludes(files.edgeFunction, edgeFunction, 'const cancelUrl = normalizeFrontendRedirectUrl(input.cancel_url, FRONTEND_CANCEL_URL, CHECKOUT_CANCEL_PATHS);');
assertIncludes(files.edgeFunction, edgeFunction, 'redirectUrls:');
assertIncludes(files.edgeFunction, edgeFunction, 'success: successUrl');
assertIncludes(files.edgeFunction, edgeFunction, 'cancel: cancelUrl');
assertIncludes(files.edgeFunction, edgeFunction, 'return_url: successUrl');
assertIncludes(files.edgeFunction, edgeFunction, 'catalog_get_rim_by_identifier_v1');
assertIncludes(files.edgeFunction, edgeFunction, 'catalog_get_tire_by_identifier_v1');
assertIncludes(files.edgeFunction, edgeFunction, 'clientUnitPrice !== authoritativeUnitPrice');
assertIncludes(files.edgeFunction, edgeFunction, 'units > stockQty');
assertNotIncludes(files.edgeFunction, edgeFunction, 'cleanString(input.success_url, 300) ||');
assertNotIncludes(files.edgeFunction, edgeFunction, 'cleanString(input.cancel_url, 300) || FRONTEND_CANCEL_URL');

const pagesFunction = read(files.pagesFunction);
assertIncludes(files.pagesFunction, pagesFunction, "'/checkout',");
assertIncludes(files.pagesFunction, pagesFunction, "'/checkout/success',");
assertIncludes(files.pagesFunction, pagesFunction, "'/checkout/cancel',");

console.log('Checkout runtime parity check passed: checkout uses URL navigation, utility pages are noindex/no-canonical, Paytrail callbacks are canonical and allowlisted, callback pages avoid sensitive console logging, and checkout routes are allowed at the edge.');
