'use client';

import AccountCompletionPanel from '@/components/account/AccountCompletionPanel';

/**
 * Inline account completion where the seller chooses HomeCheff Checkout.
 * Same account state as Settings. Stripe still starts through /api/stripe/connect/onboard.
 */
export default function SettlementConnectGuidance({
  active,
  onBeforeStripe,
}: {
  active: boolean;
  onBeforeStripe?: () => boolean | void;
}) {
  if (!active) return null;
  return (
    <AccountCompletionPanel variant="listing" onBeforeStripe={onBeforeStripe} />
  );
}
