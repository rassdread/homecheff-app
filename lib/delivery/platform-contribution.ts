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
};

export type PlatformContribution = {
  grossCents: number;
  transfersCents: number;
  platformRetainedBeforeStripeFeeCents: number;
  affiliateLiabilityCents: number;
  stripeFeeCents: number | null;
  stripeFeeFinal: boolean;
  netAfterKnownCostsCents: number | null;
  courierShareReducedByAffiliate: boolean;
  sellerShareReducedByAffiliate: boolean;
};

export function platformContribution(input: PlatformContributionInput): PlatformContribution {
  const transfersCents = input.sellerTransferCents + input.courierTransferCents;
  const affiliateLiabilityCents =
    input.affiliateProductCommissionCents + input.affiliateDeliveryCommissionCents;
  const platformRetainedBeforeStripeFeeCents = input.grossCents - transfersCents;
  const netAfterKnownCostsCents =
    input.stripeFeeCents == null
      ? null
      : platformRetainedBeforeStripeFeeCents - input.stripeFeeCents - affiliateLiabilityCents;
  return {
    grossCents: input.grossCents,
    transfersCents,
    platformRetainedBeforeStripeFeeCents,
    affiliateLiabilityCents,
    stripeFeeCents: input.stripeFeeCents,
    stripeFeeFinal: input.stripeFeeFinal,
    netAfterKnownCostsCents,
    courierShareReducedByAffiliate: false,
    sellerShareReducedByAffiliate: false,
  };
}
