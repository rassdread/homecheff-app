/** Configurable TTL for abandoned RESERVED promo redemptions (Prisma-free). */

export const DEFAULT_PROMO_RESERVATION_TTL_MINUTES = 60;

export function resolvePromoReservationTtlMinutes(
  envValue: string | undefined = process.env.PROMO_RESERVATION_TTL_MINUTES,
): number {
  if (envValue == null || envValue.trim() === '') {
    return DEFAULT_PROMO_RESERVATION_TTL_MINUTES;
  }
  const n = Number(envValue);
  if (!Number.isFinite(n) || n < 5 || n > 24 * 60) {
    return DEFAULT_PROMO_RESERVATION_TTL_MINUTES;
  }
  return Math.round(n);
}
