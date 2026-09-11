/**
 * Safe replacement of stuck Express accounts for PARTICULAR track.
 * Never deletes Stripe accounts with balance/pending money.
 */

import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import {
  classifyStuckExpressCandidate,
  type ConnectTrack,
} from '@/lib/stripe/connect-tracks';

export type ConnectReplaceDecision =
  | {
      allowed: true;
      reason:
        | 'NO_EXISTING_ACCOUNT'
        | 'EMPTY_INCOMPLETE_STUCK_EXPRESS'
        | 'SAME_TRACK_REUSE';
    }
  | {
      allowed: false;
      reason:
        | 'ACTIVE_WORKING'
        | 'HAS_BALANCE'
        | 'HAS_PENDING_PAYOUTS'
        | 'HAS_PENDING_TRANSFERS'
        | 'MANUAL_REVIEW'
        | 'STRIPE_UNAVAILABLE'
        | 'TRACK_MISMATCH_KEEP';
      classification?: string;
    };

async function sumBalance(balance: Stripe.Balance): Promise<number> {
  let total = 0;
  for (const b of balance.available ?? []) total += b.amount;
  for (const b of balance.pending ?? []) total += b.amount;
  return total;
}

export async function evaluateConnectAccountReplacement(params: {
  existingAccountId: string | null | undefined;
  requestedTrack: ConnectTrack;
  existingTrack?: ConnectTrack | null;
}): Promise<ConnectReplaceDecision> {
  if (!params.existingAccountId) {
    return { allowed: true, reason: 'NO_EXISTING_ACCOUNT' };
  }
  if (!stripe) {
    return { allowed: false, reason: 'STRIPE_UNAVAILABLE' };
  }

  // Same track + existing id → reuse (idempotent onboard link).
  if (params.existingTrack && params.existingTrack === params.requestedTrack) {
    return { allowed: true, reason: 'SAME_TRACK_REUSE' };
  }

  let account: Stripe.Account;
  try {
    account = await stripe.accounts.retrieve(params.existingAccountId);
  } catch {
    // Missing/invalid remote account → allow create new.
    return { allowed: true, reason: 'NO_EXISTING_ACCOUNT' };
  }

  const classification = classifyStuckExpressCandidate(account);
  if (
    classification === 'ACTIVE_WORKING_EXPRESS' ||
    classification === 'LEGACY_INDIVIDUAL_EXPRESS_ACTIVE'
  ) {
    return {
      allowed: false,
      reason: 'ACTIVE_WORKING',
      classification,
    };
  }

  if (params.requestedTrack === 'PARTICULAR') {
    const stuck =
      classification === 'STUCK_PRIVATE_EXPRESS' ||
      classification === 'WRONG_NONPROFIT_OR_COMPANY_CHOICE';
    if (!stuck) {
      return {
        allowed: false,
        reason: 'MANUAL_REVIEW',
        classification,
      };
    }
  } else {
    // Business requested while Express already exists incomplete → reuse Express.
    if (account.type === 'express') {
      return { allowed: true, reason: 'SAME_TRACK_REUSE' };
    }
  }

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: params.existingAccountId,
    });
    if ((await sumBalance(balance)) > 0) {
      return { allowed: false, reason: 'HAS_BALANCE', classification };
    }
  } catch {
    return { allowed: false, reason: 'MANUAL_REVIEW', classification };
  }

  try {
    const payouts = await stripe.payouts.list(
      { limit: 5 },
      { stripeAccount: params.existingAccountId },
    );
    if (payouts.data.some((p) => p.status === 'pending' || p.status === 'in_transit')) {
      return { allowed: false, reason: 'HAS_PENDING_PAYOUTS', classification };
    }
  } catch {
    return { allowed: false, reason: 'MANUAL_REVIEW', classification };
  }

  // Transfers are on the platform account; check metadata destination if needed.
  // Conservative: only auto-replace when charges+payouts disabled and details incomplete/restricted.
  if (account.charges_enabled || account.payouts_enabled) {
    return { allowed: false, reason: 'MANUAL_REVIEW', classification };
  }

  return { allowed: true, reason: 'EMPTY_INCOMPLETE_STUCK_EXPRESS' };
}
