/**
 * Client-side Stripe Connect onboarding — zelfde flow als StripeConnectPaymentsBanner.
 */
export async function startStripeConnectOnboarding(): Promise<{
  ok: boolean;
  error?: string;
  redirected?: boolean;
}> {
  try {
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
          typeof data.error === 'string'
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
