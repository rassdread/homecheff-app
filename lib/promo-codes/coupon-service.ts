/**
 * Admin / marketplace Coupon helpers (Prisma Coupon — fixed or percent).
 * Affiliate PromoCode commission-share limits are unchanged.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { ADMIN_MAX_DISCOUNT_PCT } from '@/lib/promo-codes/discount-policy';

export type AdminCouponInput = {
  code: string;
  description?: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive?: boolean;
};

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validateAdminCouponInput(
  input: AdminCouponInput,
): { ok: true; code: string; discountCents: number | null; discountPercent: number | null } | { ok: false; error: string } {
  const code = normalizeCouponCode(input.code);
  if (!code) {
    return { ok: false, error: 'Code is required' };
  }

  if (input.discountType === 'percent') {
    const pct = Math.round(Number(input.discountValue));
    if (!Number.isFinite(pct) || pct < 0 || pct > ADMIN_MAX_DISCOUNT_PCT) {
      return { ok: false, error: `discountPercent must be between 0 and ${ADMIN_MAX_DISCOUNT_PCT}` };
    }
    return { ok: true, code, discountCents: null, discountPercent: pct };
  }

  const cents = Math.round(Number(input.discountValue));
  if (!Number.isFinite(cents) || cents < 0) {
    return { ok: false, error: 'discountCents must be a non-negative integer' };
  }
  return { ok: true, code, discountCents: cents, discountPercent: null };
}

export async function createAdminCoupon(input: AdminCouponInput) {
  const validated = validateAdminCouponInput(input);
  if (!validated.ok) {
    return { ok: false as const, error: validated.error };
  }

  const existing = await prisma.coupon.findUnique({
    where: { code: validated.code },
  });
  if (existing) {
    return { ok: false as const, error: 'Coupon code already exists', status: 409 as const };
  }

  const now = new Date();
  const coupon = await prisma.coupon.create({
    data: {
      id: randomUUID(),
      code: validated.code,
      description: input.description ?? null,
      discountCents: validated.discountCents,
      discountPercent: validated.discountPercent,
      validFrom: input.validFrom ?? now,
      validUntil: input.validUntil ?? null,
      isActive: input.isActive ?? true,
      updatedAt: now,
    },
  });

  return { ok: true as const, coupon };
}

export async function findActiveCouponByCode(code: string) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });
  if (!coupon || !coupon.isActive) return null;

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) return null;
  if (coupon.validUntil && coupon.validUntil < now) return null;

  return coupon;
}
