export const APP_URL = (() => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace('mitra-auto.fi', 'www.mitra-auto.fi');
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env as { VITE_APP_URL?: string } | undefined;
    if (env?.VITE_APP_URL) {
      return env.VITE_APP_URL;
    }
  } catch {
    // ignore when import.meta isn't available
  }

  return 'https://www.mitra-auto.fi';
})();

export const CHECKOUT_SUCCESS_URL = `${APP_URL}/checkout/success`;
export const CHECKOUT_CANCEL_URL = `${APP_URL}/checkout/cancel`;