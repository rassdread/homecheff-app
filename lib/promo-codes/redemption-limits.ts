/**
 * Pure redemption-limit policy (Prisma-free).
 * Used by reservePromoRedemption and automated concurrency validators.
 */

export type PromoRedemptionStatus = 'RESERVED' | 'CONFIRMED' | 'RELEASED';

export type PromoRedemptionPath = 'FREE' | 'PAID';

export type PromoLimitSnapshot = {
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number | null;
  /** Global active (RESERVED + CONFIRMED) count before this attempt. */
  globalActiveCount: number;
  /** This user's active (RESERVED + CONFIRMED) count before this attempt. */
  userActiveCount: number;
};

export type PromoLimitDecision =
  | { ok: true }
  | {
      ok: false;
      reason: 'max_redemptions' | 'max_redemptions_per_user';
      error: string;
      errorNl: string;
    };

/** Active statuses consume a redemption slot (RELEASED does not). */
export function isActiveRedemptionStatus(status: string): boolean {
  return status === 'RESERVED' || status === 'CONFIRMED';
}

export function evaluatePromoRedemptionLimits(
  snap: PromoLimitSnapshot,
): PromoLimitDecision {
  const {
    maxRedemptions,
    maxRedemptionsPerUser,
    globalActiveCount,
    userActiveCount,
  } = snap;

  if (
    maxRedemptionsPerUser != null &&
    maxRedemptionsPerUser > 0 &&
    userActiveCount >= maxRedemptionsPerUser
  ) {
    return {
      ok: false,
      reason: 'max_redemptions_per_user',
      error: 'This promotion has already been used by this account.',
      errorNl: 'Deze promotie is al gebruikt door dit account.',
    };
  }

  if (
    maxRedemptions != null &&
    maxRedemptions > 0 &&
    globalActiveCount >= maxRedemptions
  ) {
    return {
      ok: false,
      reason: 'max_redemptions',
      error: 'Promo code has reached maximum redemptions',
      errorNl: 'Deze promocode heeft het maximum aantal gebruikers bereikt.',
    };
  }

  return { ok: true };
}

/**
 * Simulate N concurrent attempts against shared counters (single-threaded interleaving).
 * Models: lock → read → decide → increment (serialized), matching FOR UPDATE behaviour.
 */
export function simulateConcurrentRedemptions(params: {
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number | null;
  /** Parallel attempts as { userId }[] */
  attempts: Array<{ userId: string }>;
  /** Prior confirmed counts by userId */
  priorByUser?: Record<string, number>;
}): { succeeded: number; failed: number; byUser: Record<string, number> } {
  const prior = { ...(params.priorByUser ?? {}) };
  let global = Object.values(prior).reduce((a, b) => a + b, 0);
  let succeeded = 0;
  let failed = 0;
  const byUser: Record<string, number> = { ...prior };

  for (const attempt of params.attempts) {
    const userCount = byUser[attempt.userId] ?? 0;
    const decision = evaluatePromoRedemptionLimits({
      maxRedemptions: params.maxRedemptions,
      maxRedemptionsPerUser: params.maxRedemptionsPerUser,
      globalActiveCount: global,
      userActiveCount: userCount,
    });
    if (!decision.ok) {
      failed += 1;
      continue;
    }
    byUser[attempt.userId] = userCount + 1;
    global += 1;
    succeeded += 1;
  }

  return { succeeded, failed, byUser };
}
