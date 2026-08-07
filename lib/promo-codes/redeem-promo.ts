/**
 * Atomic platform/affiliate promo redemption reserve + confirm.
 * Locks PromoCode row (FOR UPDATE), evaluates global + per-user limits,
 * inserts PromoCodeRedemption, increments redemptionCount.
 */

import { prisma } from '@/lib/prisma';
import {
  evaluatePromoRedemptionLimits,
  type PromoRedemptionPath,
  type PromoRedemptionStatus,
} from '@/lib/promo-codes/redemption-limits';

export type ReservePromoRedemptionInput = {
  promoCodeId: string;
  userId: string;
  planKey: string;
  path: PromoRedemptionPath;
  /** FREE path confirms immediately; PAID starts RESERVED until webhook. */
  initialStatus?: PromoRedemptionStatus;
  discountSharePct: number;
  discountDurationCycles: number | null;
  basePriceCents: number;
  finalPriceCents: number;
  businessSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
};

export type ReservePromoRedemptionResult =
  | {
      ok: true;
      redemptionId: string;
      status: PromoRedemptionStatus;
      redemptionCount: number;
    }
  | {
      ok: false;
      reason:
        | 'not_found'
        | 'disabled'
        | 'not_started'
        | 'expired'
        | 'max_redemptions'
        | 'max_redemptions_per_user';
      error: string;
      errorNl: string;
    };

type LockedPromoRow = {
  id: string;
  status: string;
  startsAt: Date;
  endsAt: Date | null;
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number | null;
  redemptionCount: number;
};

export async function countUserActiveRedemptions(
  promoCodeId: string,
  userId: string,
  tx: { promoCodeRedemption: { count: (args: unknown) => Promise<number> } } = prisma,
): Promise<number> {
  return tx.promoCodeRedemption.count({
    where: {
      promoCodeId,
      userId,
      status: { in: ['RESERVED', 'CONFIRMED'] },
    },
  });
}

export async function reservePromoRedemption(
  input: ReservePromoRedemptionInput,
): Promise<ReservePromoRedemptionResult> {
  const initialStatus: PromoRedemptionStatus =
    input.initialStatus ?? (input.path === 'FREE' ? 'CONFIRMED' : 'RESERVED');

  try {
    return await prisma.$transaction(async (tx) => {
      // Row lock — serializes concurrent subscribe double-clicks.
      const locked = await tx.$queryRaw<LockedPromoRow[]>`
        SELECT id, status, "startsAt", "endsAt", "maxRedemptions",
               "maxRedemptionsPerUser", "redemptionCount"
        FROM "PromoCode"
        WHERE id = ${input.promoCodeId}
        FOR UPDATE
      `;

      const promo = locked[0];
      if (!promo) {
        return {
          ok: false as const,
          reason: 'not_found' as const,
          error: 'Promo code not found',
          errorNl: 'Promocode niet gevonden.',
        };
      }

      const now = new Date();
      if (promo.status !== 'ACTIVE') {
        return {
          ok: false as const,
          reason: 'disabled' as const,
          error: 'Promo code is disabled',
          errorNl: 'Deze promocode is uitgeschakeld.',
        };
      }
      if (promo.startsAt > now) {
        return {
          ok: false as const,
          reason: 'not_started' as const,
          error: 'Promo code is not yet active',
          errorNl: 'Deze promocode is nog niet actief.',
        };
      }
      if (promo.endsAt && promo.endsAt < now) {
        return {
          ok: false as const,
          reason: 'expired' as const,
          error: 'Promo code has expired',
          errorNl: 'Deze promocode is verlopen.',
        };
      }

      const userActiveCount = await tx.promoCodeRedemption.count({
        where: {
          promoCodeId: promo.id,
          userId: input.userId,
          status: { in: ['RESERVED', 'CONFIRMED'] },
        },
      });

      // Prefer live active row count for global (includes RESERVED); fall back to counter.
      const globalFromRows = await tx.promoCodeRedemption.count({
        where: {
          promoCodeId: promo.id,
          status: { in: ['RESERVED', 'CONFIRMED'] },
        },
      });
      const globalActiveCount = Math.max(globalFromRows, promo.redemptionCount);

      const decision = evaluatePromoRedemptionLimits({
        maxRedemptions: promo.maxRedemptions,
        maxRedemptionsPerUser: promo.maxRedemptionsPerUser,
        globalActiveCount,
        userActiveCount,
      });

      if (!decision.ok) {
        return {
          ok: false as const,
          reason: decision.reason,
          error: decision.error,
          errorNl: decision.errorNl,
        };
      }

      const redemption = await tx.promoCodeRedemption.create({
        data: {
          promoCodeId: promo.id,
          userId: input.userId,
          businessSubscriptionId: input.businessSubscriptionId ?? null,
          planKey: input.planKey.toUpperCase(),
          path: input.path,
          status: initialStatus,
          discountSharePct: input.discountSharePct,
          discountDurationCycles: input.discountDurationCycles,
          basePriceCents: input.basePriceCents,
          finalPriceCents: input.finalPriceCents,
          stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
          confirmedAt: initialStatus === 'CONFIRMED' ? now : null,
        },
      });

      const updated = await tx.promoCode.update({
        where: { id: promo.id },
        data: { redemptionCount: { increment: 1 } },
        select: { redemptionCount: true },
      });

      return {
        ok: true as const,
        redemptionId: redemption.id,
        status: initialStatus,
        redemptionCount: updated.redemptionCount,
      };
    });
  } catch (error) {
    console.error('[reservePromoRedemption]', error);
    throw error;
  }
}

export async function confirmPromoRedemption(params: {
  redemptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  businessSubscriptionId?: string | null;
}): Promise<{ ok: boolean; redemptionId?: string }> {
  if (!params.redemptionId && !params.stripeCheckoutSessionId) {
    return { ok: false };
  }

  const where = params.redemptionId
    ? { id: params.redemptionId }
    : { stripeCheckoutSessionId: params.stripeCheckoutSessionId! };

  const existing = await prisma.promoCodeRedemption.findFirst({ where });
  if (!existing) return { ok: false };
  if (existing.status === 'CONFIRMED') {
    return { ok: true, redemptionId: existing.id };
  }
  if (existing.status === 'RELEASED') {
    return { ok: false, redemptionId: existing.id };
  }

  await prisma.promoCodeRedemption.update({
    where: { id: existing.id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      businessSubscriptionId:
        params.businessSubscriptionId ?? existing.businessSubscriptionId,
    },
  });

  return { ok: true, redemptionId: existing.id };
}

export async function attachCheckoutSessionToRedemption(params: {
  redemptionId: string;
  stripeCheckoutSessionId: string;
}): Promise<void> {
  await prisma.promoCodeRedemption.update({
    where: { id: params.redemptionId },
    data: { stripeCheckoutSessionId: params.stripeCheckoutSessionId },
  });
}

export async function releasePromoRedemption(params: {
  redemptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
}): Promise<void> {
  const where = params.redemptionId
    ? { id: params.redemptionId }
    : params.stripeCheckoutSessionId
      ? { stripeCheckoutSessionId: params.stripeCheckoutSessionId }
      : null;
  if (!where) return;

  await prisma.$transaction(async (tx) => {
    const row = await tx.promoCodeRedemption.findFirst({ where });
    if (!row || row.status !== 'RESERVED') return;

    await tx.promoCodeRedemption.update({
      where: { id: row.id },
      data: { status: 'RELEASED' },
    });

    await tx.$queryRaw`
      SELECT id FROM "PromoCode" WHERE id = ${row.promoCodeId} FOR UPDATE
    `;
    await tx.promoCode.update({
      where: { id: row.promoCodeId },
      data: {
        redemptionCount: {
          decrement: 1,
        },
      },
    });
    // Clamp at 0 if somehow negative (defensive).
    await tx.$executeRaw`
      UPDATE "PromoCode"
      SET "redemptionCount" = GREATEST("redemptionCount", 0)
      WHERE id = ${row.promoCodeId}
    `;
  });
}
