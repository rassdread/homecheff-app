/**
 * Expire abandoned RESERVED promo redemptions after configurable TTL.
 * Idempotent: only RESERVED rows older than cutoff are released once.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { releasePromoRedemption } from '@/lib/promo-codes/redeem-promo';
import {
  resolvePromoReservationTtlMinutes,
} from '@/lib/promo-codes/promo-reservation-ttl';

export {
  DEFAULT_PROMO_RESERVATION_TTL_MINUTES,
  resolvePromoReservationTtlMinutes,
} from '@/lib/promo-codes/promo-reservation-ttl';

export type ExpireReservedRedemptionsResult = {
  ttlMinutes: number;
  cutoffIso: string;
  scanned: number;
  released: number;
  skipped: number;
  errors: number;
  releasedIds: string[];
};

/**
 * Find RESERVED redemptions older than TTL and release them (restores counts).
 * Safe to run repeatedly.
 */
export async function expireReservedPromoRedemptions(options?: {
  ttlMinutes?: number;
  limit?: number;
  now?: Date;
}): Promise<ExpireReservedRedemptionsResult> {
  const ttlMinutes = options?.ttlMinutes ?? resolvePromoReservationTtlMinutes();
  const limit = Math.min(Math.max(options?.limit ?? 100, 1), 500);
  const now = options?.now ?? new Date();
  const cutoff = new Date(now.getTime() - ttlMinutes * 60 * 1000);

  const candidates = await prisma.promoCodeRedemption.findMany({
    where: {
      status: 'RESERVED',
      createdAt: { lt: cutoff },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: {
      id: true,
      promoCodeId: true,
      userId: true,
      path: true,
      stripeCheckoutSessionId: true,
      createdAt: true,
    },
  });

  const releasedIds: string[] = [];
  let skipped = 0;
  let errors = 0;

  for (const row of candidates) {
    try {
      // Re-check status inside release (idempotent if already RELEASED/CONFIRMED).
      const fresh = await prisma.promoCodeRedemption.findUnique({
        where: { id: row.id },
        select: { status: true },
      });
      if (!fresh || fresh.status !== 'RESERVED') {
        skipped += 1;
        continue;
      }

      await releasePromoRedemption({ redemptionId: row.id });

      const after = await prisma.promoCodeRedemption.findUnique({
        where: { id: row.id },
        select: { status: true },
      });
      if (after?.status === 'RELEASED') {
        releasedIds.push(row.id);
        await prisma.auditLog.create({
          data: {
            id: randomUUID(),
            userId: row.userId,
            action: 'PROMO_RESERVATION_EXPIRED',
            meta: {
              redemptionId: row.id,
              promoCodeId: row.promoCodeId,
              path: row.path,
              stripeCheckoutSessionId: row.stripeCheckoutSessionId,
              reservedAt: row.createdAt.toISOString(),
              ttlMinutes,
              reason: 'ttl_expired',
            },
          },
        });
      } else {
        skipped += 1;
      }
    } catch (err) {
      errors += 1;
      console.error('[expireReservedPromoRedemptions]', row.id, err);
    }
  }

  return {
    ttlMinutes,
    cutoffIso: cutoff.toISOString(),
    scanned: candidates.length,
    released: releasedIds.length,
    skipped,
    errors,
    releasedIds,
  };
}
