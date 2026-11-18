/**
 * Logged-out header entry and the return path that belongs to that click.
 * A plain login from the feed must not keep an older "place something" return.
 */

import { deliveryGuestAuthHrefs } from '@/lib/auth/delivery-guest-auth';
import { sanitizePostAuthRelativeUrl } from '@/lib/auth/post-auth-redirect';
import {
  clearPendingIntent,
  getPendingIntent,
  isPendingIntentExpired,
  type PendingIntent,
} from '@/lib/onboarding/pending-intent';

function withSearch(pathname: string, search: string | null | undefined): string {
  if (!search) return pathname;
  const q = search.startsWith('?') ? search : `?${search}`;
  if (q === '?') return pathname;
  return `${pathname}${q}`;
}

/** Current page, including feed place and filters. Auth pages themselves return to the feed. */
export function guestReturnPath(
  pathname: string | null | undefined,
  search?: string | null,
): string {
  const path = pathname && pathname.startsWith('/') ? pathname.split('?')[0] : '/';
  if (path.startsWith('/login') || path.startsWith('/register')) {
    const params = new URLSearchParams((search || '').replace(/^\?/, ''));
    const existing = params.get('callbackUrl') || params.get('returnUrl');
    return sanitizePostAuthRelativeUrl(existing) || '/';
  }
  return sanitizePostAuthRelativeUrl(withSearch(path, search)) || '/';
}

/**
 * Header Inloggen / Aanmelden. Delivery onboarding keeps its own wizard links.
 * Otherwise the return is the page the visitor is already on.
 */
export function guestAuthEntryHrefs(
  pathname: string | null | undefined,
  search?: string | null,
): { login: string; register: string } {
  const delivery = deliveryGuestAuthHrefs(pathname, search);
  if (delivery) return delivery;
  const back = guestReturnPath(pathname, search);
  const encoded = encodeURIComponent(back);
  return {
    login: `/login?callbackUrl=${encoded}`,
    register: `/register?callbackUrl=${encoded}`,
  };
}

export function pendingIntentMatchesReturn(
  intent: PendingIntent | null,
  returnPath: string | null | undefined,
): boolean {
  if (!intent || isPendingIntentExpired(intent)) return false;
  const wanted = sanitizePostAuthRelativeUrl(returnPath);
  const stored = sanitizePostAuthRelativeUrl(intent.returnPath);
  if (!wanted || !stored) return false;
  return wanted.split('?')[0] === stored.split('?')[0];
}

/**
 * Drop a stored task that does not belong to this login attempt.
 * No explicit return leaves the stored task alone.
 */
export function keepOnlyMatchingPendingIntent(returnPath: string | null | undefined): void {
  const wanted = sanitizePostAuthRelativeUrl(returnPath);
  if (!wanted) return;
  const intent = getPendingIntent();
  if (!intent) return;
  if (!pendingIntentMatchesReturn(intent, wanted)) clearPendingIntent();
}

/**
 * An explicit page (feed with filters, checkout, placement) wins.
 * A stored task is used only when it is the same page, or when the return is the bare feed.
 */
export function destinationAfterAuth(
  callbackUrl: string | null | undefined,
  intentUrl: string | null | undefined,
): string {
  const callback = sanitizePostAuthRelativeUrl(callbackUrl) || '/';
  const intent = sanitizePostAuthRelativeUrl(intentUrl);
  if (intent && callback.split('?')[0] === intent.split('?')[0]) return intent;
  if (callback !== '/') return callback;
  return intent || callback;
}
