/**
 * Pure precedence for Delivery / Marketplace cross-ecosystem affiliate resolution.
 * Keep in sync with Growth `lib/affiliates/cross-ecosystem-attribution-precedence.ts`.
 */

export type AttributionSourceKind =
  | "ECOSYSTEM"
  | "MARKETPLACE_ATTRIBUTION"
  | "NONE";

export type SideAttributionCandidate = {
  side: "BUYER" | "SELLER";
  ecosystemAffiliateCentralUserId: string | null;
  ecosystemAttributionId: string | null;
  referralOriginPlatform: string | null;
  marketplaceAffiliateId: string | null;
};

export type ResolvedSideAffiliate = {
  side: "BUYER" | "SELLER";
  affiliateKey: string | null;
  source: AttributionSourceKind;
  ecosystemAttributionId: string | null;
  referralOriginPlatform: string | null;
};

export function resolveSideAffiliatePrecedence(
  candidate: SideAttributionCandidate,
): ResolvedSideAffiliate {
  if (candidate.ecosystemAffiliateCentralUserId?.trim()) {
    return {
      side: candidate.side,
      affiliateKey: candidate.ecosystemAffiliateCentralUserId.trim(),
      source: "ECOSYSTEM",
      ecosystemAttributionId: candidate.ecosystemAttributionId,
      referralOriginPlatform: candidate.referralOriginPlatform,
    };
  }
  if (candidate.marketplaceAffiliateId?.trim()) {
    return {
      side: candidate.side,
      affiliateKey: candidate.marketplaceAffiliateId.trim(),
      source: "MARKETPLACE_ATTRIBUTION",
      ecosystemAttributionId: null,
      referralOriginPlatform: null,
    };
  }
  return {
    side: candidate.side,
    affiliateKey: null,
    source: "NONE",
    ecosystemAttributionId: null,
    referralOriginPlatform: null,
  };
}

/**
 * Delivery fee: buyer is primary referred identity.
 * Buyer ecosystem/local wins full pool; provider only if buyer has none — never both.
 */
export function resolveDeliveryFeeAffiliateSides(input: {
  buyer: SideAttributionCandidate;
  provider: SideAttributionCandidate;
}): {
  buyerAffiliateKey: string | null;
  providerAffiliateKey: string | null;
  buyerSource: AttributionSourceKind;
  providerSource: AttributionSourceKind;
  useBuyerOnlyFullPool: boolean;
  ecosystemAttributionId: string | null;
  referralOriginPlatform: string | null;
} {
  const buyer = resolveSideAffiliatePrecedence(input.buyer);
  if (buyer.affiliateKey) {
    return {
      buyerAffiliateKey: buyer.affiliateKey,
      providerAffiliateKey: null,
      buyerSource: buyer.source,
      providerSource: "NONE",
      useBuyerOnlyFullPool: true,
      ecosystemAttributionId: buyer.ecosystemAttributionId,
      referralOriginPlatform: buyer.referralOriginPlatform,
    };
  }
  const provider = resolveSideAffiliatePrecedence(input.provider);
  return {
    buyerAffiliateKey: null,
    providerAffiliateKey: provider.affiliateKey,
    buyerSource: "NONE",
    providerSource: provider.source,
    useBuyerOnlyFullPool: false,
    ecosystemAttributionId: provider.ecosystemAttributionId,
    referralOriginPlatform: provider.referralOriginPlatform,
  };
}
