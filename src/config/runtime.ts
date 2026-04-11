export const deployTarget = import.meta.env.VITE_DEPLOY_TARGET === 'pwa' ? 'pwa' : 'site';

export const isStandalonePwaDeploy = deployTarget === 'pwa';

export const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://www.mitra-auto.fi').replace(/\/+$/, '');

export function pwaPath(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (isStandalonePwaDeploy) {
    return normalized === '/rescue' ? '/' : normalized;
  }

  if (normalized === '/' || normalized === '/rescue') {
    return '/pwa/cms';
  }

  return `/pwa/cms${normalized}`;
}
