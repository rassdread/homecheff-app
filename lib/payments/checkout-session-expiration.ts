import {
  planCheckoutSessionExpiration,
  stripeExpireMode,
  stripeSecretAllowsSessionExpire,
  type SessionExpirePlan,
} from '@/lib/products/checkout-reservation-policy';

export type CheckoutSessionSnapshot = {
  id?: string;
  status?: string | null;
  payment_status?: string | null;
};

export type StripeSessionExpireClient = {
  checkout: {
    sessions: {
      retrieve: (id: string) => Promise<CheckoutSessionSnapshot>;
      expire: (id: string) => Promise<unknown>;
    };
  };
};

/**
 * Retrieve the session, then expire it only when Stripe still shows it open and unpaid.
 * A second call sees status expired and does not expire again.
 * Paid and completed sessions are left alone.
 */
export async function expireOpenCheckoutSessions(
  sessionIds: string[],
  stripe: StripeSessionExpireClient,
) {
  const results: Array<{ id: string; plan: SessionExpirePlan | 'EXPIRED' | 'ERROR' }> = [];
  for (const id of [...new Set(sessionIds)]) {
    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      const plan = planCheckoutSessionExpiration(session);
      if (plan !== 'EXPIRE') {
        results.push({ id, plan });
        continue;
      }
      await stripe.checkout.sessions.expire(id);
      results.push({ id, plan: 'EXPIRED' });
    } catch (error) {
      console.warn('[reservation] checkout session expire failed', id, error);
      results.push({ id, plan: 'ERROR' });
    }
  }
  return results;
}

/**
 * Production cron may expire a live session after retrieve.
 * A local process with a live key loaded does not call Stripe.
 * Test keys are allowed. This function is not invoked by the local tests.
 */
export async function expireCheckoutSessionsWithConfiguredStripe(sessionIds: string[]) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (sessionIds.length === 0 || !stripeSecretAllowsSessionExpire(secret, process.env)) {
    return {
      called: false as const,
      reason: stripeExpireMode(secret) === 'live' ? 'LIVE_STRIPE_BLOCKED_OUTSIDE_PRODUCTION' : 'UNCONFIGURED',
    };
  }
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(secret as string, { apiVersion: '2025-08-27.basil' });
  const results = await expireOpenCheckoutSessions(sessionIds, stripe);
  return { called: true as const, results };
}
