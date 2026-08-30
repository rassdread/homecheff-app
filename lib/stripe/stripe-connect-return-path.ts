/**
 * Persist where to return after Stripe Connect onboarding (listing draft flow).
 * Draft data itself lives in px4a-item-form-draft / draft-ecosphere — this only
 * stores the path so /seller/stripe/success can send the user back.
 */

export const STRIPE_CONNECT_RETURN_PATH_KEY = 'hc-stripe-connect-return-path';

const ALLOWED_PREFIXES = ['/sell', '/product/', '/verkoper', '/profile', '/mijn-homecheff'];

export function rememberStripeConnectReturnPath(path: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) return;
  if (!ALLOWED_PREFIXES.some((p) => trimmed === p || trimmed.startsWith(p))) return;
  try {
    sessionStorage.setItem(STRIPE_CONNECT_RETURN_PATH_KEY, trimmed);
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeStripeConnectReturnPath(fallback = '/sell/new'): string {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(STRIPE_CONNECT_RETURN_PATH_KEY);
    sessionStorage.removeItem(STRIPE_CONNECT_RETURN_PATH_KEY);
    if (!raw || !raw.startsWith('/')) return fallback;
    if (!ALLOWED_PREFIXES.some((p) => raw === p || raw.startsWith(p))) return fallback;
    return raw;
  } catch {
    return fallback;
  }
}
