import { getPublicAppUrl } from '@/lib/public-app-url';
import { isNativeApp } from '@/lib/native/capacitor';

/** Web OAuth client id — same value as server GOOGLE_CLIENT_ID (public). */
export const GOOGLE_WEB_CLIENT_ID =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || ''
    : '';

const TRUSTED_ORIGIN_RE =
  /^https:\/\/([a-z0-9-]+\.)?homecheff\.(eu|nl)(:\d+)?$/i;

function isTrustedAppOrigin(origin: string): boolean {
  return Boolean(origin && TRUSTED_ORIGIN_RE.test(origin));
}

/** Prefix `/api/...` with canonical origin when WebView origin is untrusted. */
export function resolveNativeAuthApiUrl(apiPath: string): string {
  if (typeof window === 'undefined') {
    return apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  }
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const origin = window.location.origin;
  const needsAbsolute =
    !origin ||
    origin === 'null' ||
    /^capacitor:/i.test(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
    (isNativeApp() && !isTrustedAppOrigin(origin));
  if (!needsAbsolute) return path;
  return `${getPublicAppUrl()}${path}`;
}
