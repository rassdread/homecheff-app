import { getPublicAppUrl } from '@/lib/public-app-url';
import { isNativeApp } from '@/lib/native/capacitor';
import { resolvePublicNativeGoogleClientId } from '@/lib/auth/google-oauth-clients';

/**
 * Capgo SocialLogin webClientId — native/Firebase audience (public).
 * Phase 2: independent from server web NextAuth GOOGLE_WEB_CLIENT_ID / GOOGLE_CLIENT_ID.
 */
export const GOOGLE_WEB_CLIENT_ID =
  typeof process !== 'undefined' ? resolvePublicNativeGoogleClientId() : '';

/** @deprecated Alias — prefer GOOGLE_WEB_CLIENT_ID (Capgo name) or resolvePublicNativeGoogleClientId. */
export const GOOGLE_NATIVE_CLIENT_ID_PUBLIC = GOOGLE_WEB_CLIENT_ID;

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
