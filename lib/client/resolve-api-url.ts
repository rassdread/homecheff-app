/**
 * Client-side API URL resolution for Capacitor / localhost shells.
 * Uses getPublicAppUrl() — never hardcodes a second production URL.
 */

import { getPublicAppUrl } from '@/lib/public-app-url';
import { isNativeApp } from '@/lib/native/capacitor';

const TRUSTED_ORIGIN_RE =
  /^https:\/\/([a-z0-9-]+\.)?homecheff\.(eu|nl)(:\d+)?$/i;

function isTrustedAppOrigin(origin: string): boolean {
  return Boolean(origin && TRUSTED_ORIGIN_RE.test(origin));
}

/**
 * True when relative `/api/...` may resolve to the wrong host (Capacitor shell).
 */
export function shouldUseAbsoluteApiBase(): boolean {
  if (typeof window === 'undefined') return false;
  const origin = window.location.origin;
  if (!origin || origin === 'null') return true;
  if (/^capacitor:/i.test(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
    return true;
  }
  if (isNativeApp() && !isTrustedAppOrigin(origin)) return true;
  return false;
}

/** Prefix `/api/...` with canonical origin when the WebView origin is untrusted. */
export function resolveClientApiUrl(apiPath: string): string {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (!shouldUseAbsoluteApiBase()) return path;
  return `${getPublicAppUrl()}${path}`;
}
