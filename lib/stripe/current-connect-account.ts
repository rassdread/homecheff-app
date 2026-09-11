/**
 * Canonical CURRENT Stripe Connect account resolver.
 *
 * Source of truth: User.stripeConnectAccountId (+ track).
 * Migrated/legacy Express accounts remain in AuditLog only and must never
 * be selected as "latest" / "oldest" / first-match without this pointer.
 */

import { prisma } from '@/lib/prisma';
import { parseConnectTrack, type ConnectTrack } from '@/lib/stripe/connect-tracks';
import { findMigrationByOldOrNewAccount } from '@/lib/stripe/connect-migration';

export type CurrentStripeConnectAccount = {
  userId: string;
  stripeConnectAccountId: string | null;
  stripeConnectTrack: ConnectTrack | null;
  stripeConnectOnboardingCompleted: boolean;
  /** Prior Express id from migrate audit, if any — never use for readiness. */
  legacyOldStripeAccountId: string | null;
};

export async function getCurrentStripeConnectAccount(
  userId: string,
): Promise<CurrentStripeConnectAccount> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      stripeConnectAccountId: true,
      stripeConnectTrack: true,
      stripeConnectOnboardingCompleted: true,
    },
  });

  if (!user) {
    return {
      userId,
      stripeConnectAccountId: null,
      stripeConnectTrack: null,
      stripeConnectOnboardingCompleted: false,
      legacyOldStripeAccountId: null,
    };
  }

  let legacyOldStripeAccountId: string | null = null;
  const currentId = user.stripeConnectAccountId;
  if (currentId) {
    const mig = await findMigrationByOldOrNewAccount(currentId);
    if (
      mig &&
      mig.userId === userId &&
      mig.newStripeAccountId === currentId &&
      mig.oldStripeAccountId
    ) {
      legacyOldStripeAccountId = mig.oldStripeAccountId;
    }
  } else {
    // No current pointer — still surface migrate audit for diagnostics only.
    const migRows = await prisma.auditLog.findMany({
      where: {
        userId,
        action: 'STRIPE_CONNECT_PARTICULAR_MIGRATE',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { meta: true },
    });
    const meta = migRows[0]?.meta as
      | { oldStripeAccountId?: string; newStripeAccountId?: string }
      | null;
    if (meta?.oldStripeAccountId) {
      legacyOldStripeAccountId = meta.oldStripeAccountId;
    }
  }

  return {
    userId: user.id,
    stripeConnectAccountId: user.stripeConnectAccountId,
    stripeConnectTrack: parseConnectTrack(user.stripeConnectTrack),
    stripeConnectOnboardingCompleted: Boolean(
      user.stripeConnectOnboardingCompleted,
    ),
    legacyOldStripeAccountId,
  };
}

/** True when accountId is the user's CURRENT pointer (not a preserved legacy id). */
export function isCurrentConnectAccountId(
  current: CurrentStripeConnectAccount,
  accountId: string | null | undefined,
): boolean {
  if (!accountId || !current.stripeConnectAccountId) return false;
  return current.stripeConnectAccountId === accountId;
}
