/**
 * Return path after a logged-in user finishes the required profile step
 * and came from delivery registration. Only the delivery signup routes
 * and standard UTM keys are kept. Affiliate cookies are not involved.
 */
import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';

const DELIVERY_REGISTRATION_PATHS = [
  '/delivery/start',
  '/delivery/signup',
  '/delivery/company/signup',
] as const;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

function cleanUtmSearch(search: string | null | undefined): string {
  const params = new URLSearchParams((search || '').replace(/^\?/, ''));
  const clean = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (!value) continue;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 120) continue;
    if (trimmed.includes('@') || /[<>"`\\]/.test(trimmed)) continue;
    clean.set(key, trimmed);
  }
  return clean.toString();
}

export function deliveryRegistrationReturnPath(
  pathname: string | null | undefined,
  search?: string | null,
): string | null {
  if (!pathname) return null;
  const path = pathname.split('?')[0]?.replace(/\/+$/, '') || '';
  if (!DELIVERY_REGISTRATION_PATHS.includes(path as (typeof DELIVERY_REGISTRATION_PATHS)[number])) {
    return null;
  }
  const query = cleanUtmSearch(search ?? pathname.split('?')[1]);
  const href = query ? `${path}?${query}` : path;
  return sanitizePostAuthRelativeUrl(href);
}

export function deliveryRegistrationReturnFromCallback(
  callbackUrl: string | null | undefined,
): string | null {
  const safe = sanitizePostAuthRelativeUrl(callbackUrl);
  if (!safe) return null;
  const [path, search] = safe.split('?');
  return deliveryRegistrationReturnPath(path, search);
}
