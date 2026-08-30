/**
 * Client-side Stripe Connect onboarding — zelfde flow als StripeConnectPaymentsBanner.
 * Generates a seller-specific Stripe Account Link via POST /api/stripe/connect/onboard.
 */

import { rememberStripeConnectReturnPath } from '@/lib/stripe/stripe-connect-return-path';

export async function startStripeConnectOnboarding(options?: {
  /** HomeCheff path to resume after Stripe (e.g. /sell/new) — draft must already be persisted. */
  returnPath?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  redirected?: boolean;
}> {
  try {
    if (options?.returnPath) {
      rememberStripeConnectReturnPath(options.returnPath);
    } else if (typeof window !== 'undefined') {
      const path = `${window.location.pathname}${window.location.search}`;
      if (path.startsWith('/sell')) {
        rememberStripeConnectReturnPath(path);
      }
    }

    const res = await fetch('/api/stripe/connect/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = (await res.json().catch(() => ({}))) as {
      onboardingUrl?: string;
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof data.error === 'string' &&
          !/^[A-Z][A-Z0-9_]{2,}$/.test(data.error.trim())
            ? data.error
            : 'Er ging iets mis. Probeer het opnieuw.',
      };
    }
    if (data.onboardingUrl) {
      window.location.href = data.onboardingUrl;
      return { ok: true, redirected: true };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Er ging iets mis. Probeer het opnieuw.' };
  }
}
