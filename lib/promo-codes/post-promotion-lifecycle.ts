/**
 * Resolve how a redeemed promo should behave at lifecycle boundaries.
 * Prisma-free — used by subscribe + validators.
 */

import {
  normalizePostPromotionAction,
  type PostPromotionAction,
} from '@/lib/promo-codes/post-promotion-action';

export type PromoLifecyclePlan = {
  postPromotionAction: PostPromotionAction;
  /** Free entitlement without Stripe (END 100%, or untimed). */
  useFreeEntitlement: boolean;
  /** Stripe checkout with trial then list price (CONTINUE 100% timed). */
  useStripeTrialThenPaid: boolean;
  /** Stripe repeating coupon then list price (CONTINUE paid %). */
  useRepeatingCouponThenPaid: boolean;
  /** Stripe cancel_at after promo window (END + Stripe path). */
  scheduleCancelAtPromoEnd: boolean;
};

export function planPromoLifecycle(params: {
  finalPriceCents: number;
  isPlatform: boolean;
  discountDurationCycles: number | null | undefined;
  postPromotionAction?: unknown;
}): PromoLifecyclePlan {
  const action = normalizePostPromotionAction(params.postPromotionAction);
  const timed =
    params.discountDurationCycles != null &&
    Number(params.discountDurationCycles) > 0;
  const free = params.finalPriceCents <= 0;

  if (free && params.isPlatform && action === 'CONTINUE' && timed) {
    return {
      postPromotionAction: action,
      useFreeEntitlement: false,
      useStripeTrialThenPaid: true,
      useRepeatingCouponThenPaid: false,
      scheduleCancelAtPromoEnd: false,
    };
  }

  if (free) {
    return {
      postPromotionAction: action,
      useFreeEntitlement: true,
      useStripeTrialThenPaid: false,
      useRepeatingCouponThenPaid: false,
      scheduleCancelAtPromoEnd: false,
    };
  }

  if (params.isPlatform && timed) {
    return {
      postPromotionAction: action,
      useFreeEntitlement: false,
      useStripeTrialThenPaid: false,
      useRepeatingCouponThenPaid: true,
      scheduleCancelAtPromoEnd: action === 'END',
    };
  }

  return {
    postPromotionAction: action,
    useFreeEntitlement: false,
    useStripeTrialThenPaid: false,
    useRepeatingCouponThenPaid: false,
    scheduleCancelAtPromoEnd: false,
  };
}
