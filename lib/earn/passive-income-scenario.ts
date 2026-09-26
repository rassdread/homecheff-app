/**
 * Forward-looking affiliate scenario for the public calculator.
 * Order shares call allocateMarketplaceAffiliatePool. Subscription shares call
 * growthV2AffiliateCommissionCents with affiliateCapacityHc, not customer HC.
 * Settled ledger rows are not recomputed here.
 */
import { calculatePlatformFeeCents } from '@/lib/fees';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';
import {
  growthV2AffiliateCommissionCents,
  PUBLIC_GROWTH_PLANS,
  PUBLIC_MARKETPLACE_SELLER_FEES,
} from '@/lib/earn/public-economics';

export type OrderAffiliateScenario = 'none' | 'single' | 'two';

export type ViewerOrderAffiliate = {
  scenario: OrderAffiliateScenario;
  platformFeeCents: number;
  poolCents: number;
  viewerCommissionCents: number;
  otherCommissionCents: number;
};

const VIEWER = 'viewer';
const OTHER = 'other';

export function viewerOrderAffiliateCents(input: {
  platformFeeCents: number;
  scenario: OrderAffiliateScenario;
}): ViewerOrderAffiliate {
  const buyerAffiliateId = input.scenario === 'two' ? OTHER : null;
  const sellerAffiliateId = input.scenario === 'none' ? null : VIEWER;
  const alloc = allocateMarketplaceAffiliatePool({
    platformFeeCents: input.platformFeeCents,
    buyerAffiliateId,
    sellerAffiliateId,
  });
  const viewer =
    alloc.lines.find((line) => line.affiliateId === VIEWER)?.commissionCents ?? 0;
  const other =
    alloc.lines.find((line) => line.affiliateId === OTHER)?.commissionCents ?? 0;
  return {
    scenario: input.scenario,
    platformFeeCents: alloc.platformFeeCents,
    poolCents: alloc.poolCents,
    viewerCommissionCents: viewer,
    otherCommissionCents: other,
  };
}

export function viewerOrderAffiliateForSale(input: {
  saleCents: number;
  feePercent: number;
  scenario: OrderAffiliateScenario;
}): ViewerOrderAffiliate {
  return viewerOrderAffiliateCents({
    platformFeeCents: calculatePlatformFeeCents(input.saleCents, input.feePercent),
    scenario: input.scenario,
  });
}

export const CALCULATOR_GROWTH_PLAN_KEYS = ['starter', 'pro', 'business', 'enterprise'] as const;
export type CalculatorGrowthPlanKey = (typeof CALCULATOR_GROWTH_PLAN_KEYS)[number];

/**
 * Illustration only: customers added so far are still paying.
 * There is no automatic drop-off after 12 months.
 */
export function illustratedActiveCount(month: number, addedPerMonth: number): number {
  const months = Math.max(0, Math.floor(month));
  const added = Math.max(0, addedPerMonth);
  return months * added;
}

export function growthPlanAffiliateCents(planKey: CalculatorGrowthPlanKey): number {
  const plan = PUBLIC_GROWTH_PLANS.find((row) => row.key === planKey);
  if (!plan) return 0;
  const netCents = Math.round(plan.monthlyEurExVat * 100);
  return growthV2AffiliateCommissionCents(netCents, plan.affiliateCapacityHc)
    .affiliateCommissionCents;
}

export const CALCULATOR_INDIVIDUAL_FEE_PERCENT = PUBLIC_MARKETPLACE_SELLER_FEES.individual.percent;
export const CALCULATOR_BUSINESS_FEE_PERCENT = PUBLIC_MARKETPLACE_SELLER_FEES.pro.percent;
