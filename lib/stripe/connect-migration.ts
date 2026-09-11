/**
 * Dual-track Connect migration classifier + helpers.
 * Source of truth for KEEP / USER_CONFIRMATION / MANUAL_REVIEW.
 */

import { prisma } from '@/lib/prisma';
import {
  classifyStuckExpressCandidate,
  isHomecheffPaymentReady,
  parseConnectTrack,
  type ConnectTrack,
} from '@/lib/stripe/connect-tracks';

export const CONNECT_MIGRATION_CLASSES = [
  'KEEP_LEGACY',
  'KEEP_BUSINESS',
  'KEEP_PARTICULAR',
  'USER_CONFIRMATION_REQUIRED',
  'MIGRATION_IN_PROGRESS',
  'MANUAL_REVIEW',
  'NEW_ACCOUNT_CHOICE',
] as const;

export type ConnectMigrationClass = (typeof CONNECT_MIGRATION_CLASSES)[number];

export const STRIPE_CONNECT_MIGRATE_AUDIT = 'STRIPE_CONNECT_PARTICULAR_MIGRATE';
export const STRIPE_CONNECT_TRACK_CHOICE_AUDIT = 'STRIPE_CONNECT_TRACK_CHOICE';

export type MigrationClassifyInput = {
  stripeConnectAccountId: string | null | undefined;
  stripeConnectTrack: string | null | undefined;
  paymentReady: boolean;
  /** Live Stripe account when available */
  stripeAccount?: {
    type?: string | null;
    business_type?: string | null;
    charges_enabled?: boolean | null;
    payouts_enabled?: boolean | null;
    controller?: { stripe_dashboard?: { type?: string | null } } | null;
    capabilities?: { transfers?: string | null } | null;
    requirements?: { disabled_reason?: string | null } | null;
  } | null;
};

/**
 * Pure classifier — no Stripe/DB side effects.
 * Call with live Stripe snapshot when available.
 */
export function classifyConnectMigration(
  input: MigrationClassifyInput,
): ConnectMigrationClass {
  const track = parseConnectTrack(input.stripeConnectTrack);
  const accountId = input.stripeConnectAccountId;
  const acct = input.stripeAccount;

  if (!accountId) {
    return 'NEW_ACCOUNT_CHOICE';
  }

  const dashboard = acct?.controller?.stripe_dashboard?.type ?? null;
  const stuckClass = acct ? classifyStuckExpressCandidate(acct) : null;

  // Already on PARTICULAR dashboard=none (migrated or new particular).
  if (track === 'PARTICULAR' || dashboard === 'none') {
    if (track === 'PARTICULAR' && dashboard === 'none') {
      return 'KEEP_PARTICULAR';
    }
    if (track === 'PARTICULAR' && dashboard !== 'none' && dashboard != null) {
      // Track says PARTICULAR but Stripe still Express → confirmation/replace path.
      return 'USER_CONFIRMATION_REQUIRED';
    }
    if (!track && dashboard === 'none') {
      return 'KEEP_PARTICULAR';
    }
  }

  if (input.paymentReady) {
    if (
      stuckClass === 'LEGACY_INDIVIDUAL_EXPRESS_ACTIVE' ||
      (acct?.business_type === 'individual' &&
        acct?.charges_enabled &&
        acct?.payouts_enabled)
    ) {
      return 'KEEP_LEGACY';
    }
    if (track === 'BUSINESS' || stuckClass === 'ACTIVE_WORKING_EXPRESS') {
      return 'KEEP_BUSINESS';
    }
    return 'KEEP_BUSINESS';
  }

  // Explicit BUSINESS track + incomplete Express → resume Express (no force choice
  // unless wrong-type stuck that user may want to flip to PARTICULAR).
  if (track === 'BUSINESS') {
    if (
      stuckClass === 'WRONG_NONPROFIT_OR_COMPANY_CHOICE' ||
      stuckClass === 'STUCK_PRIVATE_EXPRESS'
    ) {
      // Allow explicit flip to PARTICULAR; still show confirmation.
      return 'USER_CONFIRMATION_REQUIRED';
    }
    return 'KEEP_BUSINESS';
  }

  if (
    stuckClass === 'LEGACY_INDIVIDUAL_EXPRESS_ACTIVE' ||
    stuckClass === 'ACTIVE_WORKING_EXPRESS'
  ) {
    // Working but paymentReady false due to sync lag — keep, do not prompt.
    if (acct?.charges_enabled && acct?.payouts_enabled) {
      return 'KEEP_LEGACY';
    }
  }

  if (
    stuckClass === 'STUCK_PRIVATE_EXPRESS' ||
    stuckClass === 'WRONG_NONPROFIT_OR_COMPANY_CHOICE' ||
    stuckClass === 'OTHER' ||
    stuckClass == null
  ) {
    return 'USER_CONFIRMATION_REQUIRED';
  }

  if (!track) {
    return 'USER_CONFIRMATION_REQUIRED';
  }

  return 'MANUAL_REVIEW';
}

export function migrationNeedsUserConfirmation(
  migrationClass: ConnectMigrationClass,
): boolean {
  return (
    migrationClass === 'USER_CONFIRMATION_REQUIRED' ||
    migrationClass === 'NEW_ACCOUNT_CHOICE'
  );
}

export function migrationIsRecoveryMode(
  migrationClass: ConnectMigrationClass,
): boolean {
  return migrationClass === 'USER_CONFIRMATION_REQUIRED';
}

/** Lookup AuditLog migration meta for old→new account mapping. */
export async function findMigrationByOldOrNewAccount(accountId: string): Promise<{
  userId: string;
  oldStripeAccountId: string;
  newStripeAccountId: string;
  trackAfter?: string | null;
} | null> {
  const rows = await prisma.auditLog.findMany({
    where: {
      action: STRIPE_CONNECT_MIGRATE_AUDIT,
      userId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { userId: true, meta: true },
  });

  for (const row of rows) {
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const oldId = typeof meta.oldStripeAccountId === 'string' ? meta.oldStripeAccountId : null;
    const newId = typeof meta.newStripeAccountId === 'string' ? meta.newStripeAccountId : null;
    if (!row.userId || (!oldId && !newId)) continue;
    if (oldId === accountId || newId === accountId) {
      return {
        userId: row.userId,
        oldStripeAccountId: oldId || '',
        newStripeAccountId: newId || '',
        trackAfter:
          typeof meta.trackAfter === 'string' ? meta.trackAfter : null,
      };
    }
  }
  return null;
}

/**
 * Resolve webhook account → user.
 * CURRENT = active stripeConnectAccountId match.
 * LEGACY_OLD = migrated-away Express; must not overwrite new readiness.
 */
export async function resolveConnectWebhookTarget(accountId: string): Promise<
  | {
      role: 'CURRENT';
      userId: string;
      stripeConnectTrack: string | null;
      stripeConnectAccountId: string | null;
    }
  | {
      role: 'LEGACY_OLD';
      userId: string;
      stripeConnectTrack: string | null;
      stripeConnectAccountId: string | null;
      oldStripeAccountId: string;
      newStripeAccountId: string;
    }
  | null
> {
  const current = await prisma.user.findFirst({
    where: { stripeConnectAccountId: accountId },
    select: {
      id: true,
      stripeConnectTrack: true,
      stripeConnectAccountId: true,
    },
  });
  if (current) {
    return {
      role: 'CURRENT',
      userId: current.id,
      stripeConnectTrack: current.stripeConnectTrack,
      stripeConnectAccountId: current.stripeConnectAccountId,
    };
  }

  const mig = await findMigrationByOldOrNewAccount(accountId);
  if (!mig) return null;

  const user = await prisma.user.findUnique({
    where: { id: mig.userId },
    select: {
      id: true,
      stripeConnectTrack: true,
      stripeConnectAccountId: true,
    },
  });
  if (!user) return null;

  if (mig.oldStripeAccountId === accountId) {
    return {
      role: 'LEGACY_OLD',
      userId: user.id,
      stripeConnectTrack: user.stripeConnectTrack,
      stripeConnectAccountId: user.stripeConnectAccountId,
      oldStripeAccountId: mig.oldStripeAccountId,
      newStripeAccountId: mig.newStripeAccountId,
    };
  }

  // new account id in audit but User.stripeConnectAccountId drifted — treat as CURRENT-like
  return {
    role: 'CURRENT',
    userId: user.id,
    stripeConnectTrack: user.stripeConnectTrack,
    stripeConnectAccountId: user.stripeConnectAccountId,
  };
}

/**
 * HomeCheff financial exposure that still depends on the old Connect account.
 */
export async function hasHomecheffSettlementExposure(params: {
  userId: string;
  oldAccountId: string;
}): Promise<{ blocked: boolean; reason?: string }> {
  const openHc = await prisma.marketplaceHcSettlementExposure.count({
    where: {
      sellerUserId: params.userId,
      status: {
        in: [
          'PENDING',
          'EARNED',
          'PAYOUT_PENDING',
          'PAYOUT_FAILED_RETRYABLE',
          'PAYOUT_BLOCKED',
        ],
      },
    },
  });
  if (openHc > 0) {
    return { blocked: true, reason: 'OPEN_HC_SETTLEMENT' };
  }

  const pendingAttempt = await prisma.marketplaceHcSellerPayoutAttempt.count({
    where: {
      destinationAccountId: params.oldAccountId,
      status: 'PENDING',
    },
  });
  if (pendingAttempt > 0) {
    return { blocked: true, reason: 'PENDING_HC_PAYOUT_ATTEMPT' };
  }

  // Seller products → open paid orders still held / payout scheduled
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: params.userId },
    select: { id: true },
  });
  if (sellerProfile) {
    const heldOrders = await prisma.order.count({
      where: {
        OR: [{ paymentHeld: true }, { payoutScheduled: true }],
        status: {
          in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        stripeSessionId: { not: null },
        items: {
          some: {
            Product: { sellerId: sellerProfile.id },
          },
        },
      },
    });
    if (heldOrders > 0) {
      return { blocked: true, reason: 'OPEN_ORDER_SETTLEMENT' };
    }
  }

  return { blocked: false };
}

export function computePaymentReadyFromAccount(
  account: MigrationClassifyInput['stripeAccount'],
  track: ConnectTrack | null,
): boolean {
  if (!account) return false;
  return isHomecheffPaymentReady({
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    transfersCapability: account.capabilities?.transfers ?? null,
    disabledReason: account.requirements?.disabled_reason ?? null,
    connectTrack: track,
    accountType: account.type ?? null,
    dashboardType: account.controller?.stripe_dashboard?.type ?? null,
  });
}
