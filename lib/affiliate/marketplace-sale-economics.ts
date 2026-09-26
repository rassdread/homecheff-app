/**
 * One Marketplace sale, two views.
 * Seller proceeds and affiliate pool both call the certified fee and pool helpers.
 */
import { calculatePlatformFeeCents } from '@/lib/fees';
import {
  PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT,
  PUBLIC_MARKETPLACE_SELLER_FEES,
} from '@/lib/earn/public-economics';
import {
  viewerOrderAffiliateForSale,
  type ViewerOrderAffiliate,
} from '@/lib/earn/passive-income-scenario';

export const MARKETPLACE_EXAMPLE_SALE_EUR = [25, 50, 100, 250] as const;

export type MarketplaceSaleEconomics = {
  saleCents: number;
  feePercent: number;
  platformFeeCents: number;
  sellerProceedsCents: number;
  singleAffiliate: ViewerOrderAffiliate;
  twoAffiliates: ViewerOrderAffiliate;
};

export function marketplaceSaleEconomics(input: {
  saleCents: number;
  feePercent: number;
}): MarketplaceSaleEconomics {
  const saleCents = Math.max(0, Math.floor(input.saleCents));
  const feePercent = input.feePercent;
  const platformFeeCents = calculatePlatformFeeCents(saleCents, feePercent);
  return {
    saleCents,
    feePercent,
    platformFeeCents,
    sellerProceedsCents: saleCents - platformFeeCents,
    singleAffiliate: viewerOrderAffiliateForSale({
      saleCents,
      feePercent,
      scenario: 'single',
    }),
    twoAffiliates: viewerOrderAffiliateForSale({
      saleCents,
      feePercent,
      scenario: 'two',
    }),
  };
}

export function individualSaleExamples(): MarketplaceSaleEconomics[] {
  return MARKETPLACE_EXAMPLE_SALE_EUR.map((eur) =>
    marketplaceSaleEconomics({
      saleCents: eur * 100,
      feePercent: PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT,
    }),
  );
}

export function feePercentForSellerTier(
  tier: keyof typeof PUBLIC_MARKETPLACE_SELLER_FEES,
): number {
  return PUBLIC_MARKETPLACE_SELLER_FEES[tier].percent;
}
