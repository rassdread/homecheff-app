'use strict';

export const STRIPE_FEE_PERCENTAGE = 0.014; // 1.4%
export const STRIPE_FIXED_FEE_CENTS = 25; // €0.25
export const DEFAULT_PLATFORM_FEE_PERCENT = 12; // 12% for individual sellers

export function calculateStripeFeeForBuyer(subtotalCents: number) {
  if (subtotalCents <= 0) {
    return {
      buyerTotalCents: 0,
      stripeFeeCents: 0,
    };
  }

  const buyerTotal = Math.ceil(
    (subtotalCents + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_FEE_PERCENTAGE)
  );

  const stripeFeeCents = buyerTotal - subtotalCents;

  return {
    buyerTotalCents: buyerTotal,
    stripeFeeCents,
  };
}

export function calculatePlatformFeeCents(
  amountCents: number,
  platformFeePercent: number = DEFAULT_PLATFORM_FEE_PERCENT
) {
  if (amountCents <= 0 || platformFeePercent <= 0) {
    return 0;
  }

  return Math.round((amountCents * platformFeePercent) / 100);
}





