/**
 * Marketplace affiliate pool: max 50% of actual platform fee, distributed by cases A–E.
 *
 * A neither → 0
 * B buyer only → buyer affiliate gets full 50% pool
 * C seller only → seller affiliate gets full 50% pool
 * D both different → 25% + 25% of fee
 * E both same affiliate → that affiliate gets full 50% pool
 */
export const MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE = 50;

export type MarketplacePoolCase =
  | "A_NEITHER"
  | "B_BUYER_ONLY"
  | "C_SELLER_ONLY"
  | "D_BOTH_DIFFERENT"
  | "E_BOTH_SAME";

export type MarketplacePoolAllocation = {
  case: MarketplacePoolCase;
  platformFeeCents: number;
  poolCents: number;
  lines: Array<{
    side: "BUYER" | "SELLER" | "BOTH";
    affiliateId: string;
    commissionCents: number;
  }>;
};

export function allocateMarketplaceAffiliatePool(input: {
  platformFeeCents: number;
  buyerAffiliateId: string | null;
  sellerAffiliateId: string | null;
}): MarketplacePoolAllocation {
  const fee = Math.max(0, Math.floor(input.platformFeeCents));
  const pool = Math.floor((fee * MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE) / 100);
  const buyer = input.buyerAffiliateId?.trim() || null;
  const seller = input.sellerAffiliateId?.trim() || null;

  if (!buyer && !seller) {
    return { case: "A_NEITHER", platformFeeCents: fee, poolCents: pool, lines: [] };
  }
  if (buyer && !seller) {
    return {
      case: "B_BUYER_ONLY",
      platformFeeCents: fee,
      poolCents: pool,
      lines: [{ side: "BUYER", affiliateId: buyer, commissionCents: pool }],
    };
  }
  if (!buyer && seller) {
    return {
      case: "C_SELLER_ONLY",
      platformFeeCents: fee,
      poolCents: pool,
      lines: [{ side: "SELLER", affiliateId: seller, commissionCents: pool }],
    };
  }
  if (buyer && seller && buyer === seller) {
    return {
      case: "E_BOTH_SAME",
      platformFeeCents: fee,
      poolCents: pool,
      lines: [{ side: "BOTH", affiliateId: buyer, commissionCents: pool }],
    };
  }
  // D both different — 25% + 25% of fee (= half pool each)
  const half = Math.floor(pool / 2);
  const remainder = pool - half;
  return {
    case: "D_BOTH_DIFFERENT",
    platformFeeCents: fee,
    poolCents: pool,
    lines: [
      { side: "BUYER", affiliateId: buyer!, commissionCents: half },
      { side: "SELLER", affiliateId: seller!, commissionCents: remainder },
    ],
  };
}
