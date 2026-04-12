export const deployTarget = import.meta.env.VITE_DEPLOY_TARGET === 'pwa' ? 'pwa' : 'site';

export const isStandalonePwaDeploy = deployTarget === 'pwa';

export const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://www.mitra-auto.fi').replace(/\/+$/, '');

export function pwaPath(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (isStandalonePwaDeploy) {
    if (normalized === '/') {
      return '/cms';
    }
    return normalized.startsWith('/cms') ? normalized : `/cms${normalized}`;
  }

  if (normalized === '/') {
    return '/pwa/cms';
  }
  return normalized.startsWith('/pwa/cms') ? normalized : `/pwa/cms${normalized}`;
}
