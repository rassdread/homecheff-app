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

function pathOnly(href: string | null | undefined): string {
  const raw = (href || '').split('?')[0]?.split('#')[0] || '';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed || '/';
}

/** Courier workspaces. A stored signup return path must not pull the user back here. */
const DELIVERY_WORKSPACE_PATHS = [
  '/delivery/dashboard',
  '/delivery/company/dashboard',
  '/delivery/driver',
  '/delivery/settings',
] as const;

export function isDeliveryWorkspacePath(href: string | null | undefined): boolean {
  const path = pathOnly(href);
  return DELIVERY_WORKSPACE_PATHS.some(
    (workspace) => path === workspace || path.startsWith(`${workspace}/`),
  );
}

/**
 * A stored signup URL is a return path for someone who left the wizard to log in.
 * It is not a destination once the courier is already on that wizard or on a
 * delivery workspace. Login callbackUrl still returns guests who opened /login.
 */
export function shouldResumeDeliveryRegistrationIntent(
  currentHref: string | null | undefined,
  intentHref: string | null | undefined,
): boolean {
  if (!intentHref || !deliveryRegistrationReturnPath(pathOnly(intentHref))) return true;
  const current = pathOnly(currentHref);
  if (deliveryRegistrationReturnPath(current)) return false;
  if (isDeliveryWorkspacePath(current)) return false;
  return true;
}
