import { isStandalonePwaDeploy } from '../config/runtime';

const PRIVATE_ROUTE_PREFIXES = [
  '/admin',
  '/cms',
  '/pwa',
  '/account',
  '/customer',
  '/customer-account',
  '/booking/manage',
  '/en/account',
  '/en/customer',
  '/en/customer/account',
  '/en/booking/manage',
];

function normalizePathname(pathname: string) {
  if (!pathname) return '/';
  const pathOnly = pathname.split(/[?#]/)[0] || '/';
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
    return pathOnly.replace(/\/+$/, '') || '/';
  }
  return pathOnly;
}

export function isPrivateAppRoute(pathname: string) {
  const normalizedPath = normalizePathname(pathname);

  return PRIVATE_ROUTE_PREFIXES.some((prefix) => (
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  ));
}

export function canServePrivateAppRoutes() {
  return (
    import.meta.env.DEV ||
    isStandalonePwaDeploy ||
    import.meta.env.VITE_ENABLE_PRIVATE_APP_ROUTES === 'true'
  );
}

export function shouldBlockPrivateAppRoute(pathname: string) {
  return isPrivateAppRoute(pathname) && !canServePrivateAppRoutes();
}

export const privateRoutePrefixes = [...PRIVATE_ROUTE_PREFIXES];
