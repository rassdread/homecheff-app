/**
 * Safe replacement of stuck Express accounts for PARTICULAR track.
 * Historical closed transfers/payouts are NOT automatic blockers —
 * only current financial dependence (balance, pending payouts, disputes,
 * open HomeCheff settlements) blocks SAFE_REPLACE.
 */

import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import {
  classifyStuckExpressCandidate,
  type ConnectTrack,
} from '@/lib/stripe/connect-tracks';
import { hasHomecheffSettlementExposure } from '@/lib/stripe/connect-migration';

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
        | 'HAS_OPEN_DISPUTE'
        | 'HAS_HC_SETTLEMENT_EXPOSURE'
        | 'MANUAL_REVIEW'
        | 'STRIPE_UNAVAILABLE'
        | 'TRACK_MISMATCH_KEEP';
      classification?: string;
      safetyBlocker?: string;
    };

async function sumBalance(balance: Stripe.Balance): Promise<{
  available: number;
  pending: number;
  total: number;
}> {
  let available = 0;
  let pending = 0;
  for (const b of balance.available ?? []) available += b.amount;
  for (const b of balance.pending ?? []) pending += b.amount;
  return { available, pending, total: available + pending };
}

export async function evaluateConnectAccountReplacement(params: {
  existingAccountId: string | null | undefined;
  requestedTrack: ConnectTrack;
  existingTrack?: ConnectTrack | null;
  /** Required for HomeCheff settlement exposure checks on PARTICULAR replace */
  userId?: string | null;
}): Promise<ConnectReplaceDecision> {
  if (!params.existingAccountId) {
    return { allowed: true, reason: 'NO_EXISTING_ACCOUNT' };
  }
  if (!stripe) {
    return { allowed: false, reason: 'STRIPE_UNAVAILABLE' };
  }

  // Same track + existing id → reuse (idempotent onboard link).
  // PARTICULAR + PARTICULAR: always reuse (cancel/return must not create another).
  if (params.existingTrack && params.existingTrack === params.requestedTrack) {
    return { allowed: true, reason: 'SAME_TRACK_REUSE' };
  }

  let account: Stripe.Account;
  try {
    account = await stripe.accounts.retrieve(params.existingAccountId);
  } catch {
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

  if (params.requestedTrack === 'BUSINESS') {
    // Resume existing Express when present.
    if (account.type === 'express') {
      return { allowed: true, reason: 'SAME_TRACK_REUSE' };
    }
    return {
      allowed: false,
      reason: 'MANUAL_REVIEW',
      classification,
    };
  }

  // PARTICULAR replace path
  const stuck =
    classification === 'STUCK_PRIVATE_EXPRESS' ||
    classification === 'WRONG_NONPROFIT_OR_COMPANY_CHOICE' ||
    // Allow BUSINESS→PARTICULAR flip when Express is incomplete/wrong
    (params.existingTrack === 'BUSINESS' &&
      !account.charges_enabled &&
      !account.payouts_enabled);

  if (!stuck && classification !== 'OTHER') {
    // OTHER may be non-express incomplete — still allow if financially empty
    if (account.type === 'express' && !account.charges_enabled && !account.payouts_enabled) {
      // fall through to safety
    } else if (!stuck) {
      return {
        allowed: false,
        reason: 'MANUAL_REVIEW',
        classification,
      };
    }
  }

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: params.existingAccountId,
    });
    const sums = await sumBalance(balance);
    if (sums.total > 0) {
      return {
        allowed: false,
        reason: 'HAS_BALANCE',
        classification,
        safetyBlocker: `available=${sums.available},pending=${sums.pending}`,
      };
    }
  } catch {
    return { allowed: false, reason: 'MANUAL_REVIEW', classification };
  }

  try {
    const payouts = await stripe.payouts.list(
      { limit: 10 },
      { stripeAccount: params.existingAccountId },
    );
    if (
      payouts.data.some(
        (p) => p.status === 'pending' || p.status === 'in_transit',
      )
    ) {
      return {
        allowed: false,
        reason: 'HAS_PENDING_PAYOUTS',
        classification,
        safetyBlocker: 'pending_or_in_transit_payout',
      };
    }
    // Historical paid/failed payouts are OK (closed).
  } catch {
    return { allowed: false, reason: 'MANUAL_REVIEW', classification };
  }

  try {
    const disputes = await stripe.disputes.list(
      { limit: 5 },
      { stripeAccount: params.existingAccountId },
    );
    const open = disputes.data.filter(
      (d) => d.status === 'needs_response' || d.status === 'warning_needs_response',
    );
    if (open.length > 0) {
      return {
        allowed: false,
        reason: 'HAS_OPEN_DISPUTE',
        classification,
        safetyBlocker: 'open_dispute',
      };
    }
  } catch {
    // Connected may not expose disputes — continue if charges/payouts off.
  }

  // Active platform→connected transfers still reversing/pending reverse?
  try {
    const transfers = await stripe.transfers.list({
      destination: params.existingAccountId,
      limit: 10,
    });
    const active = transfers.data.filter(
      (t) =>
        Boolean((t as any).reversed === false) &&
        ((t as any).amount_reversed ?? 0) < (t.amount ?? 0) &&
        // Transfer exists but connected still has unsettled obligation —
        // only block if transfer is very recent AND balance already checked 0.
        // Closed historical transfers with zero balance are allowed.
        false,
    );
    void active;
    // Per product rule: historical transfers alone are NOT blockers when balance=0.
  } catch {
    // ignore — balance/payouts already checked
  }

  if (params.userId) {
    const exposure = await hasHomecheffSettlementExposure({
      userId: params.userId,
      oldAccountId: params.existingAccountId,
    });
    if (exposure.blocked) {
      return {
        allowed: false,
        reason: 'HAS_HC_SETTLEMENT_EXPOSURE',
        classification,
        safetyBlocker: exposure.reason,
      };
    }
  }

  if (account.charges_enabled || account.payouts_enabled) {
    return {
      allowed: false,
      reason: 'MANUAL_REVIEW',
      classification,
      safetyBlocker: 'charges_or_payouts_still_enabled',
    };
  }

  return { allowed: true, reason: 'EMPTY_INCOMPLETE_STUCK_EXPRESS' };
}
