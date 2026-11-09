/**
 * Persist where to return after Stripe Connect onboarding (listing draft flow).
 * Draft data itself lives in px4a-item-form-draft / draft-ecosphere — this only
 * stores the path so /seller/stripe/success can send the user back.
 */

export const STRIPE_CONNECT_RETURN_PATH_KEY = 'hc-stripe-connect-return-path';

const ALLOWED_PREFIXES = ['/sell', '/product/', '/verkoper', '/delivery', '/profile', '/mijn-homecheff', '/settings'];

/**
 * `/sell` is a listing path. `/seller/...` is the Stripe return screen and must
 * not replace the screen the person started from.
 */
export function isAllowedStripeReturnPath(path: string): boolean {
  if (path === '/sell' || path.startsWith('/sell/') || path.startsWith('/sell?')) return true;
  return ALLOWED_PREFIXES.some((prefix) => {
    if (prefix === '/sell') return false;
    return path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`);
  });
}

export function rememberStripeConnectReturnPath(path: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = path.trim();
  if (!isAllowedStripeReturnPath(trimmed)) return;
  try {
    sessionStorage.setItem(STRIPE_CONNECT_RETURN_PATH_KEY, trimmed);
  } catch {
    /* ignore quota / private mode */
  }
}

function storedReturnPath(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(STRIPE_CONNECT_RETURN_PATH_KEY);
    if (!isAllowedStripeReturnPath(raw)) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}

/** Read the return path without removing it, so a refresh is not a new onboarding. */
export function readStripeConnectReturnPath(fallback = '/mijn-homecheff'): string {
  return storedReturnPath(fallback);
}

export function clearStripeConnectReturnPath(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STRIPE_CONNECT_RETURN_PATH_KEY);
  } catch {
    /* ignore */
  }
}

export function consumeStripeConnectReturnPath(fallback = '/sell/new'): string {
  const path = storedReturnPath(fallback);
  clearStripeConnectReturnPath();
  return path;
}
