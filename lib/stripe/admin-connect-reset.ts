/**
 * Admin “Stripe-koppeling opnieuw instellen” — non-destructive.
 * Preserves old Connect account as LEGACY via AuditLog; clears CURRENT mapping only.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { hasHomecheffSettlementExposure } from '@/lib/stripe/connect-migration';
import { evaluateConnectAccountReplacement } from '@/lib/stripe/connect-account-replacement';
import { parseConnectTrack } from '@/lib/stripe/connect-tracks';
import { getCurrentStripeConnectAccount } from '@/lib/stripe/current-connect-account';

export const STRIPE_CONNECT_ADMIN_RESET_AUDIT = 'STRIPE_CONNECT_ADMIN_RESET';

export type AdminConnectResetSafety =
  | { safe: true; blockers: [] }
  | { safe: false; blockers: string[]; decision: 'MANUAL_REVIEW' };

export type AdminConnectResetPreview = {
  userId: string;
  email: string | null;
  currentAccountId: string | null;
  legacyOldAccountId: string | null;
  track: string | null;
  onboardingCompleted: boolean;
  safety: AdminConnectResetSafety;
  alreadyCleared: boolean;
};

async function stripeFinancialBlockers(
  accountId: string,
): Promise<string[]> {
  const blockers: string[] = [];
  if (!stripe) {
    blockers.push('STRIPE_UNAVAILABLE');
    return blockers;
  }
  try {
    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    let total = 0;
    for (const b of balance.available ?? []) total += b.amount;
    for (const b of balance.pending ?? []) total += b.amount;
    if (total > 0) blockers.push('HAS_BALANCE');
  } catch {
    blockers.push('BALANCE_CHECK_FAILED');
  }
  try {
    const payouts = await stripe.payouts.list(
      { limit: 10 },
      { stripeAccount: accountId },
    );
    if (
      payouts.data.some(
        (p) => p.status === 'pending' || p.status === 'in_transit',
      )
    ) {
      blockers.push('HAS_PENDING_PAYOUTS');
    }
  } catch {
    blockers.push('PAYOUTS_CHECK_FAILED');
  }
  try {
    const disputes = await stripe.disputes.list(
      { limit: 5 },
      { stripeAccount: accountId },
    );
    if (
      disputes.data.some(
        (d) =>
          d.status === 'needs_response' ||
          d.status === 'warning_needs_response',
      )
    ) {
      blockers.push('HAS_OPEN_DISPUTE');
    }
  } catch {
    blockers.push('DISPUTES_CHECK_FAILED');
  }
  return blockers;
}

export async function previewAdminConnectReset(
  userId: string,
): Promise<AdminConnectResetPreview | { error: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      stripeConnectAccountId: true,
      stripeConnectTrack: true,
      stripeConnectOnboardingCompleted: true,
    },
  });
  if (!user) return { error: 'USER_NOT_FOUND' };

  const current = await getCurrentStripeConnectAccount(userId);
  const accountId = current.stripeConnectAccountId;

  if (!accountId) {
    return {
      userId: user.id,
      email: user.email,
      currentAccountId: null,
      legacyOldAccountId: current.legacyOldStripeAccountId,
      track: current.stripeConnectTrack,
      onboardingCompleted: false,
      safety: { safe: true, blockers: [] },
      alreadyCleared: true,
    };
  }

  const blockers: string[] = [];
  const replace = await evaluateConnectAccountReplacement({
    existingAccountId: accountId,
    requestedTrack: parseConnectTrack(user.stripeConnectTrack) ?? 'PARTICULAR',
    existingTrack: parseConnectTrack(user.stripeConnectTrack),
    userId: user.id,
  });
  // Admin reset is intentional even for ACTIVE_WORKING — still require financial safety.
  if (
    !replace.allowed &&
    (replace.reason === 'HAS_BALANCE' ||
      replace.reason === 'HAS_PENDING_PAYOUTS' ||
      replace.reason === 'HAS_OPEN_DISPUTE' ||
      replace.reason === 'HAS_HC_SETTLEMENT_EXPOSURE' ||
      replace.reason === 'STRIPE_UNAVAILABLE')
  ) {
    blockers.push(replace.reason);
  }

  const fin = await stripeFinancialBlockers(accountId);
  blockers.push(...fin);

  const exposure = await hasHomecheffSettlementExposure({
    userId: user.id,
    oldAccountId: accountId,
  });
  if (exposure.blocked) {
    blockers.push(exposure.reason || 'HC_SETTLEMENT_EXPOSURE');
  }

  const unique = [...new Set(blockers)];
  const safety: AdminConnectResetSafety =
    unique.length === 0
      ? { safe: true, blockers: [] }
      : { safe: false, blockers: unique, decision: 'MANUAL_REVIEW' };

  return {
    userId: user.id,
    email: user.email,
    currentAccountId: accountId,
    legacyOldAccountId: current.legacyOldStripeAccountId,
    track: current.stripeConnectTrack,
    onboardingCompleted: current.stripeConnectOnboardingCompleted,
    safety,
    alreadyCleared: false,
  };
}

export async function executeAdminConnectReset(params: {
  adminId: string;
  userId: string;
  reason: string;
  confirm: boolean;
  idempotencyKey?: string;
}): Promise<
  | {
      ok: true;
      alreadyCleared?: boolean;
      oldStripeAccountId: string | null;
      auditId: string;
    }
  | { ok: false; code: string; blockers?: string[] }
> {
  if (!params.confirm) {
    return { ok: false, code: 'CONFIRMATION_REQUIRED' };
  }
  const reason = params.reason?.trim();
  if (!reason || reason.length < 8) {
    return { ok: false, code: 'REASON_REQUIRED' };
  }

  const idem = params.idempotencyKey?.trim();
  if (idem) {
    const rows = await prisma.auditLog.findMany({
      where: {
        action: STRIPE_CONNECT_ADMIN_RESET_AUDIT,
        userId: params.userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, meta: true },
    });
    for (const row of rows) {
      const meta = row.meta as {
        idempotencyKey?: string;
        oldStripeAccountId?: string;
      } | null;
      if (meta?.idempotencyKey === idem) {
        return {
          ok: true,
          alreadyCleared: true,
          oldStripeAccountId: meta?.oldStripeAccountId ?? null,
          auditId: row.id,
        };
      }
    }
  }

  const preview = await previewAdminConnectReset(params.userId);
  if ('error' in preview) {
    return { ok: false, code: preview.error };
  }

  if (preview.alreadyCleared) {
    const auditId = randomUUID();
    await prisma.auditLog.create({
      data: {
        id: auditId,
        userId: params.userId,
        action: STRIPE_CONNECT_ADMIN_RESET_AUDIT,
        meta: {
          adminId: params.adminId,
          reason,
          oldStripeAccountId: null,
          newStripeAccountId: null,
          alreadyCleared: true,
          idempotencyKey: idem ?? null,
          safety: 'ALREADY_CLEARED',
        },
      },
    });
    return {
      ok: true,
      alreadyCleared: true,
      oldStripeAccountId: null,
      auditId,
    };
  }

  if (!preview.safety.safe) {
    return {
      ok: false,
      code: 'MANUAL_REVIEW',
      blockers: preview.safety.blockers,
    };
  }

  const oldId = preview.currentAccountId!;

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      stripeConnectAccountId: null,
      stripeConnectTrack: null,
      stripeConnectOnboardingCompleted: false,
    },
  });

  const auditId = randomUUID();
  await prisma.auditLog.create({
    data: {
      id: auditId,
      userId: params.userId,
      action: STRIPE_CONNECT_ADMIN_RESET_AUDIT,
      meta: {
        adminId: params.adminId,
        reason,
        oldStripeAccountId: oldId,
        newStripeAccountId: null,
        preserved: true,
        role: 'LEGACY_OLD',
        idempotencyKey: idem ?? null,
        safety: 'SAFE',
        previousTrack: preview.track,
      },
    },
  });

  // Also mirror migrate-style audit so webhook resolver treats old id as LEGACY_OLD
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId: params.userId,
      action: 'STRIPE_CONNECT_PARTICULAR_MIGRATE',
      meta: {
        oldStripeAccountId: oldId,
        newStripeAccountId: '',
        adminReset: true,
        adminId: params.adminId,
        reason,
      },
    },
  });

  return { ok: true, oldStripeAccountId: oldId, auditId };
}
