/**
 * Splits a certified charge into contractual shares and known costs.
 * Affiliate commission is a liability on the platform share. It does not
 * reduce the courier or seller transfer. A pending Stripe fee is not profit.
 */

export type PlatformContributionInput = {
  grossCents: number;
  productCents: number;
  deliveryFeeCents: number;
  buyerSurchargeCents: number;
  sellerTransferCents: number;
  courierTransferCents: number;
  platformProductFeeCents: number;
  platformDeliveryShareCents: number;
  affiliateProductCommissionCents: number;
  affiliateDeliveryCommissionCents: number;
  stripeFeeCents: number | null;
  stripeFeeFinal: boolean;
  stripeFeeSource?: 'stripe_balance_transaction' | 'buyer_surcharge_estimate' | 'unavailable';
  affiliateLiabilitySettled?: boolean;
};

export type PlatformContribution = {
  grossCents: number;
  transfersCents: number;
  platformRetainedBeforeStripeFeeCents: number;
  affiliateLiabilityCents: number;
  stripeFeeCents: number | null;
  stripeFeeFinal: boolean;
  stripeFeeSource: 'stripe_balance_transaction' | 'buyer_surcharge_estimate' | 'unavailable';
  netAfterKnownCostsCents: number | null;
  realizedProfitCents: number | null;
  courierShareReducedByAffiliate: boolean;
  sellerShareReducedByAffiliate: boolean;
};

export function platformContribution(input: PlatformContributionInput): PlatformContribution {
  const transfersCents = input.sellerTransferCents + input.courierTransferCents;
  const affiliateLiabilityCents =
    input.affiliateProductCommissionCents + input.affiliateDeliveryCommissionCents;
  const platformRetainedBeforeStripeFeeCents = input.grossCents - transfersCents;
  const stripeFeeSource =
    input.stripeFeeSource ??
    (input.stripeFeeCents == null ? 'unavailable' : 'stripe_balance_transaction');
  const confirmedFee =
    stripeFeeSource === 'stripe_balance_transaction' ? input.stripeFeeCents : null;
  const netAfterKnownCostsCents =
    confirmedFee == null
      ? null
      : platformRetainedBeforeStripeFeeCents - confirmedFee - affiliateLiabilityCents;
  const realizedProfitCents =
    confirmedFee != null && input.stripeFeeFinal && input.affiliateLiabilitySettled === true
      ? netAfterKnownCostsCents
      : null;
  return {
    grossCents: input.grossCents,
    transfersCents,
    platformRetainedBeforeStripeFeeCents,
    affiliateLiabilityCents,
    stripeFeeCents: confirmedFee,
    stripeFeeFinal: stripeFeeSource === 'stripe_balance_transaction' ? input.stripeFeeFinal : false,
    stripeFeeSource,
    netAfterKnownCostsCents,
    realizedProfitCents,
    courierShareReducedByAffiliate: false,
    sellerShareReducedByAffiliate: false,
  };
}
