import { getPublicAppUrl } from '@/lib/public-app-url';
import { isNativeApp } from '@/lib/native/capacitor';
import {
  isPublicNativeGoogleClientConfigured,
  resolvePublicNativeGoogleClientId,
} from '@/lib/auth/google-oauth-clients';

/**
 * Capgo SocialLogin `webClientId` — Firebase/Web client used as Android
 * serverClientId when requesting an ID token.
 *
 * This is NOT HomeCheff NextAuth `GOOGLE_CLIENT_ID` (web OAuth / 6156…).
 * Prefer NEXT_PUBLIC_GOOGLE_NATIVE_CLIENT_ID; legacy NEXT_PUBLIC_GOOGLE_CLIENT_ID
 * is accepted as the same native/Firebase audience.
 */
export const CAPGO_GOOGLE_SERVER_CLIENT_ID =
  typeof process !== 'undefined' ? resolvePublicNativeGoogleClientId() : '';

/**
 * @deprecated Capgo historically named this webClientId. Prefer
 * CAPGO_GOOGLE_SERVER_CLIENT_ID for clarity (Firebase web client ≠ NextAuth web).
 */
export const GOOGLE_WEB_CLIENT_ID = CAPGO_GOOGLE_SERVER_CLIENT_ID;

/** @deprecated Alias — prefer CAPGO_GOOGLE_SERVER_CLIENT_ID. */
export const GOOGLE_NATIVE_CLIENT_ID_PUBLIC = CAPGO_GOOGLE_SERVER_CLIENT_ID;

export function isNativeGooglePublicClientConfigured(): boolean {
  return isPublicNativeGoogleClientConfigured();
}

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
