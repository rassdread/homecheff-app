/**
 * Illustrative affiliate portfolio scenarios.
 * Every euro comes from the certified public economics helpers.
 * Nothing here changes prices, percentages, or attribution.
 */
import {
  PUBLIC_GROWTH_PLANS,
  PUBLIC_MAIN_PERCENT_OF_ELIGIBLE,
  PUBLIC_STUDIO_PLAN_ECONOMICS,
  PUBLIC_SUB_PERCENT_OF_ELIGIBLE,
  growthV2AffiliateCommissionCents,
} from '@/lib/earn/public-economics';
import {
  CALCULATOR_INDIVIDUAL_FEE_PERCENT,
  illustratedActiveCount,
  viewerOrderAffiliateForSale,
} from '@/lib/earn/passive-income-scenario';

export const JOURNEY_NEW_GROWTH_STARTER_PER_MONTH = 2;
export const JOURNEY_RETENTION = 1;
export const JOURNEY_STUDIO_FROM_MONTH = 6;
export const JOURNEY_STUDIO_CROSS_SELL_RATE = 0.25;
/** One illustrative private Marketplace sale. Not assumed in the base journey. */
export const ILLUSTRATIVE_MARKETPLACE_SALE_EUR = 20;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function growthStarterShareCents(): {
  directCents: number;
  residualCents: number;
  mainCents: number;
  subCents: number;
} {
  const plan = PUBLIC_GROWTH_PLANS.find((row) => row.key === 'starter');
  if (!plan) {
    return { directCents: 0, residualCents: 0, mainCents: 0, subCents: 0 };
  }
  const snap = growthV2AffiliateCommissionCents(
    Math.round(plan.monthlyEurExVat * 100),
    plan.affiliateCapacityHc,
  );
  const mainCents = Math.floor(
    (snap.commissionableCents * PUBLIC_MAIN_PERCENT_OF_ELIGIBLE) / 100,
  );
  const subCents = Math.floor(
    (snap.commissionableCents * PUBLIC_SUB_PERCENT_OF_ELIGIBLE) / 100,
  );
  return {
    directCents: snap.affiliateCommissionCents,
    residualCents: snap.commissionableCents,
    mainCents,
    subCents,
  };
}

export function studioCreatorAffiliateCents(): number {
  const plan = PUBLIC_STUDIO_PLAN_ECONOMICS.find((row) => row.key === 'creator');
  if (!plan) return 0;
  return Math.round(plan.affiliateCommissionEur * 100);
}

/** One qualifying private Marketplace order, single affiliate, current fee. */
export function illustrativeMarketplaceOrderCents(
  saleEur = ILLUSTRATIVE_MARKETPLACE_SALE_EUR,
): number {
  return viewerOrderAffiliateForSale({
    saleCents: Math.round(saleEur * 100),
    feePercent: CALCULATOR_INDIVIDUAL_FEE_PERCENT,
    scenario: 'single',
  }).viewerCommissionCents;
}

export type PortfolioQuoteInput = {
  months: number;
  newGrowthStarterPerMonth: number;
  /** Share of acquired customers still qualifying. 1 means this scenario keeps them all. */
  retention: number;
  /** Share of active Growth customers who also pay Studio Creator. */
  studioCrossSellRate: number;
  /** Qualifying private Marketplace orders per active Growth customer this month. */
  marketplaceOrdersPerActiveCustomer: number;
  /** Other affiliates invited under this affiliate. Their customers stay theirs. */
  subAffiliates: number;
  subNewGrowthStarterPerMonth: number;
};

export type PortfolioQuote = {
  months: number;
  acquiredGrowth: number;
  activeGrowth: number;
  retainedFromYearOne: number;
  addedAfterYearOne: number;
  activeStudio: number;
  marketplaceOrders: number;
  ownGrowthCents: number;
  ownStudioCents: number;
  ownMarketplaceCents: number;
  ownCents: number;
  networkGrowthCustomers: number;
  networkCents: number;
  totalCents: number;
  perGrowthDirectCents: number;
  perGrowthMainCents: number;
  perStudioCents: number;
  perMarketplaceOrderCents: number;
};

export function quotePortfolio(input: PortfolioQuoteInput): PortfolioQuote {
  const shares = growthStarterShareCents();
  const perStudio = studioCreatorAffiliateCents();
  const perOrder = illustrativeMarketplaceOrderCents();
  const months = Math.max(0, Math.floor(input.months));
  const perMonth = Math.max(0, input.newGrowthStarterPerMonth);
  const retention = clamp01(input.retention);
  const studioRate = clamp01(input.studioCrossSellRate);
  const ordersEach = Math.max(0, input.marketplaceOrdersPerActiveCustomer);
  const subs = Math.max(0, Math.floor(input.subAffiliates));
  const subPerMonth = Math.max(0, input.subNewGrowthStarterPerMonth);

  const acquiredGrowth = illustratedActiveCount(months, perMonth);
  const activeGrowth = Math.round(acquiredGrowth * retention);
  const yearOneAcquired = illustratedActiveCount(Math.min(months, 12), perMonth);
  const retainedFromYearOne =
    months <= 12 ? activeGrowth : Math.round(yearOneAcquired * retention);
  const addedAfterYearOne = Math.max(0, activeGrowth - retainedFromYearOne);
  const activeStudio = Math.floor(activeGrowth * studioRate);
  const marketplaceOrders = Math.round(activeGrowth * ordersEach);

  const ownGrowthCents = activeGrowth * shares.directCents;
  const ownStudioCents = activeStudio * perStudio;
  const ownMarketplaceCents = marketplaceOrders * perOrder;
  const ownCents = ownGrowthCents + ownStudioCents + ownMarketplaceCents;

  const networkAcquiredEach = illustratedActiveCount(months, subPerMonth);
  const networkGrowthCustomers = subs * Math.round(networkAcquiredEach * retention);
  const networkCents = networkGrowthCustomers * shares.mainCents;

  return {
    months,
    acquiredGrowth,
    activeGrowth,
    retainedFromYearOne,
    addedAfterYearOne,
    activeStudio,
    marketplaceOrders,
    ownGrowthCents,
    ownStudioCents,
    ownMarketplaceCents,
    ownCents,
    networkGrowthCustomers,
    networkCents,
    totalCents: ownCents + networkCents,
    perGrowthDirectCents: shares.directCents,
    perGrowthMainCents: shares.mainCents,
    perStudioCents: perStudio,
    perMarketplaceOrderCents: perOrder,
  };
}

export function journeyStudioRate(month: number): number {
  return month >= JOURNEY_STUDIO_FROM_MONTH ? JOURNEY_STUDIO_CROSS_SELL_RATE : 0;
}

/** Base story: a few hours alongside work. Not a forecast and not tied to hours. */
export function alongsideWorkJourney(month: number): PortfolioQuote {
  return quotePortfolio({
    months: month,
    newGrowthStarterPerMonth: JOURNEY_NEW_GROWTH_STARTER_PER_MONTH,
    retention: JOURNEY_RETENTION,
    studioCrossSellRate: journeyStudioRate(month),
    marketplaceOrdersPerActiveCustomer: 0,
    subAffiliates: 0,
    subNewGrowthStarterPerMonth: 0,
  });
}

export const JOURNEY_MONTHS = [1, 3, 6, 12, 24, 36] as const;

export function alongsideWorkJourneyStages(): PortfolioQuote[] {
  return JOURNEY_MONTHS.map((month) => alongsideWorkJourney(month));
}

/** Smallest whole Starter portfolio whose direct commission reaches the target. */
export function growthStarterCustomersForMonthlyTarget(targetEur: number): {
  customers: number;
  monthlyCents: number;
  perCustomerCents: number;
} {
  const perCustomerCents = growthStarterShareCents().directCents;
  const targetCents = Math.max(0, Math.round(targetEur * 100));
  if (perCustomerCents <= 0) {
    return { customers: 0, monthlyCents: 0, perCustomerCents: 0 };
  }
  const customers = Math.ceil(targetCents / perCustomerCents);
  return {
    customers,
    monthlyCents: customers * perCustomerCents,
    perCustomerCents,
  };
}

export function networkStarterCustomersForMonthlyTarget(targetEur: number): {
  customers: number;
  monthlyCents: number;
  perCustomerCents: number;
} {
  const perCustomerCents = growthStarterShareCents().mainCents;
  const targetCents = Math.max(0, Math.round(targetEur * 100));
  if (perCustomerCents <= 0) {
    return { customers: 0, monthlyCents: 0, perCustomerCents: 0 };
  }
  const customers = Math.ceil(targetCents / perCustomerCents);
  return {
    customers,
    monthlyCents: customers * perCustomerCents,
    perCustomerCents,
  };
}

export const SCALE_TARGET_EUR = [3000, 10000, 20000] as const;

export type PortfolioPresetId =
  | 'alongside'
  | 'active'
  | 'growing'
  | 'organisation';

export function presetQuote(id: PortfolioPresetId): PortfolioQuote {
  if (id === 'alongside') {
    return quotePortfolio({
      months: 12,
      newGrowthStarterPerMonth: 1,
      retention: 1,
      studioCrossSellRate: 0,
      marketplaceOrdersPerActiveCustomer: 0,
      subAffiliates: 0,
      subNewGrowthStarterPerMonth: 0,
    });
  }
  if (id === 'active') return alongsideWorkJourney(12);
  if (id === 'growing') {
    return quotePortfolio({
      months: 24,
      newGrowthStarterPerMonth: 8,
      retention: 1,
      studioCrossSellRate: JOURNEY_STUDIO_CROSS_SELL_RATE,
      marketplaceOrdersPerActiveCustomer: 0,
      subAffiliates: 0,
      subNewGrowthStarterPerMonth: 0,
    });
  }
  return quotePortfolio({
    months: 36,
    newGrowthStarterPerMonth: 8,
    retention: 1,
    studioCrossSellRate: JOURNEY_STUDIO_CROSS_SELL_RATE,
    marketplaceOrdersPerActiveCustomer: 0,
    subAffiliates: 10,
    subNewGrowthStarterPerMonth: 4,
  });
}
