/**
 * Goal-based portfolio examples on top of the commission catalog.
 * These are editable assumptions, not forecasts and not a second price list.
 */
import { buildAffiliateCommissionCatalog } from '@/lib/affiliate/commission-catalog';
import { growthStarterCustomersForMonthlyTarget } from '@/lib/affiliate/portfolio-scenario';

export const GOAL_TARGETS_EUR = [2000, 5000, 10000, 20000] as const;
export const DEFAULT_SCENARIO_LEVEL = 'mixed' as const;
export const DEFAULT_PORTFOLIO_FOCUS = 'multi' as const;

export type ScenarioLevel = 'conservative' | 'mixed' | 'ambitious';
export type PortfolioFocus = 'growth' | 'marketplace' | 'studio' | 'multi';

export type GrowthMixBps = {
  starter: number;
  pro: number;
  business: number;
  enterprise: number;
};

export type StudioMixBps = {
  creator: number;
  pro: number;
  studio: number;
};

export type MarketplaceMixBps = {
  basic: number;
  pro: number;
  premium: number;
};

export type GoalAssumptions = {
  level: ScenarioLevel;
  focus: PortfolioFocus;
  growthMixBps: GrowthMixBps;
  /** Share of the same customers who also pay a Studio plan. Not assumed for every customer. */
  studioCrossSellBps: number;
  studioMixBps: StudioMixBps;
  /** Share of those Studio customers who buy one top-up in the example month. */
  studioTopUpBps: number;
  marketplacePlanBps: number;
  marketplaceMixBps: MarketplaceMixBps;
  /** Qualifying private Marketplace orders of the catalog comparison amount, per 100 customers. */
  ordersPer100Customers: number;
  /** Qualifying deliveries at the catalog delivery example, per 100 customers. */
  deliveriesPer100Customers: number;
  includeNetwork: boolean;
  subAffiliates: number;
  customersPerSub: number;
};

export type PortfolioCounts = {
  growthStarter: number;
  growthPro: number;
  growthBusiness: number;
  growthEnterprise: number;
  studioCreator: number;
  studioPro: number;
  studioStudio: number;
  studioTopUps: number;
  marketplaceBasic: number;
  marketplacePro: number;
  marketplacePremium: number;
  orders: number;
  deliveries: number;
};

export type GoalQuote = {
  targetCents: number;
  reachable: boolean;
  ownCustomers: number;
  ownCents: number;
  /** ownCents / ownCustomers. A model average for this example, not a measured customer. */
  weightedCentsPerCustomer: number;
  networkCustomers: number;
  networkCents: number;
  networkApplies: boolean;
  calculatedCents: number;
  deltaCents: number;
  counts: PortfolioCounts;
  partCents: {
    growth: number;
    studio: number;
    studioTopUp: number;
    marketplacePlans: number;
    orders: number;
    deliveries: number;
  };
  rates: CanonicalRates;
};

type CanonicalRates = {
  growthDirect: GrowthMixBps;
  growthMain: GrowthMixBps;
  studioDirect: StudioMixBps;
  studioTopUpCents: number;
  studioTopUpPackId: string;
  marketplaceDirect: MarketplaceMixBps;
  marketplaceMain: MarketplaceMixBps;
  orderCents: number;
  deliveryCents: number;
};

const GROWTH_MIX: Record<ScenarioLevel, GrowthMixBps> = {
  conservative: { starter: 10000, pro: 0, business: 0, enterprise: 0 },
  mixed: { starter: 4000, pro: 3500, business: 2000, enterprise: 500 },
  ambitious: { starter: 1000, pro: 2500, business: 4000, enterprise: 2500 },
};

const STUDIO_MIX: Record<ScenarioLevel, StudioMixBps> = {
  conservative: { creator: 10000, pro: 0, studio: 0 },
  mixed: { creator: 6000, pro: 3000, studio: 1000 },
  ambitious: { creator: 2000, pro: 4000, studio: 4000 },
};

const MARKETPLACE_MIX: Record<ScenarioLevel, MarketplaceMixBps> = {
  conservative: { basic: 10000, pro: 0, premium: 0 },
  mixed: { basic: 5000, pro: 3500, premium: 1500 },
  ambitious: { basic: 2000, pro: 4000, premium: 4000 },
};

const STUDIO_CROSS_SELL_BPS: Record<ScenarioLevel, number> = {
  conservative: 1000,
  mixed: 2500,
  ambitious: 4000,
};

const STUDIO_TOP_UP_BPS: Record<ScenarioLevel, number> = {
  conservative: 0,
  mixed: 0,
  ambitious: 2500,
};

const MARKETPLACE_PLAN_BPS: Record<ScenarioLevel, number> = {
  conservative: 500,
  mixed: 1500,
  ambitious: 3000,
};

const ORDERS_PER_100: Record<ScenarioLevel, number> = {
  conservative: 10,
  mixed: 50,
  ambitious: 150,
};

const DELIVERIES_PER_100: Record<ScenarioLevel, number> = {
  conservative: 0,
  mixed: 0,
  ambitious: 50,
};

const MARKETPLACE_ORDERS_PER_100: Record<ScenarioLevel, number> = {
  conservative: 20,
  mixed: 80,
  ambitious: 200,
};

const MARKETPLACE_DELIVERIES_PER_100: Record<ScenarioLevel, number> = {
  conservative: 0,
  mixed: 20,
  ambitious: 80,
};

/** One Studio top-up used in the ambitious example: 1000 HC pack from the catalog. */
export const AMBITIOUS_STUDIO_TOP_UP_PACK_ID = 'studio-pack-1000';

let cachedRates: CanonicalRates | null = null;

function requireRow(id: string) {
  const row = buildAffiliateCommissionCatalog().find((item) => item.id === id);
  if (!row) {
    throw new Error(`Missing commission catalog row ${id}`);
  }
  return row;
}

export function canonicalScenarioRates(): CanonicalRates {
  if (cachedRates) return cachedRates;
  const growth = (key: keyof GrowthMixBps) => requireRow(`growth-${key}`);
  const studio = (key: keyof StudioMixBps) => requireRow(`studio-${key}`);
  const plan = (key: keyof MarketplaceMixBps) => requireRow(`marketplace-plan-${key}`);
  const topUp = requireRow(AMBITIOUS_STUDIO_TOP_UP_PACK_ID);
  const starter = growth('starter');
  const pro = growth('pro');
  const business = growth('business');
  const enterprise = growth('enterprise');
  const basic = plan('basic');
  const mpPro = plan('pro');
  const premium = plan('premium');
  cachedRates = {
    growthDirect: {
      starter: starter.affiliateCents,
      pro: pro.affiliateCents,
      business: business.affiliateCents,
      enterprise: enterprise.affiliateCents,
    },
    growthMain: {
      starter: starter.networkMainCents ?? 0,
      pro: pro.networkMainCents ?? 0,
      business: business.networkMainCents ?? 0,
      enterprise: enterprise.networkMainCents ?? 0,
    },
    studioDirect: {
      creator: studio('creator').affiliateCents,
      pro: studio('pro').affiliateCents,
      studio: studio('studio').affiliateCents,
    },
    studioTopUpCents: topUp.affiliateCents,
    studioTopUpPackId: AMBITIOUS_STUDIO_TOP_UP_PACK_ID,
    marketplaceDirect: {
      basic: basic.affiliateCents,
      pro: mpPro.affiliateCents,
      premium: premium.affiliateCents,
    },
    marketplaceMain: {
      basic: basic.networkMainCents ?? 0,
      pro: mpPro.networkMainCents ?? 0,
      premium: premium.networkMainCents ?? 0,
    },
    orderCents: requireRow('marketplace-buyer').affiliateCents,
    deliveryCents: requireRow('delivery-fee').affiliateCents,
  };
  return cachedRates;
}

export function clearCanonicalScenarioRateCache(): void {
  cachedRates = null;
}

function clampCount(value: number, max = 5000): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.floor(value)));
}

function clampBps(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(10000, Math.max(0, Math.floor(value)));
}

export function allocateByWeights(total: number, weights: number[]): number[] {
  const safeTotal = clampCount(total, 5_000_000);
  const safe = weights.map((weight) => Math.max(0, Math.floor(weight)));
  const sum = safe.reduce((totalWeight, weight) => totalWeight + weight, 0);
  if (safeTotal <= 0 || sum <= 0) return safe.map(() => 0);
  const raw = safe.map((weight) => (safeTotal * weight) / sum);
  const base = raw.map((value) => Math.floor(value));
  let left = safeTotal - base.reduce((totalCount, count) => totalCount + count, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value), weight: safe[index] }))
    .sort((a, b) => b.frac - a.frac || b.weight - a.weight || a.index - b.index);
  let step = 0;
  while (left > 0 && order.length > 0) {
    base[order[step % order.length].index] += 1;
    left -= 1;
    step += 1;
  }
  return base;
}

export function assumptionsFor(
  level: ScenarioLevel,
  focus: PortfolioFocus,
  network?: Pick<GoalAssumptions, 'includeNetwork' | 'subAffiliates' | 'customersPerSub'>,
): GoalAssumptions {
  const growthMixBps = { ...GROWTH_MIX[level] };
  const studioMixBps = { ...STUDIO_MIX[level] };
  const marketplaceMixBps = { ...MARKETPLACE_MIX[level] };
  const base: GoalAssumptions = {
    level,
    focus,
    growthMixBps,
    studioCrossSellBps: focus === 'multi' ? STUDIO_CROSS_SELL_BPS[level] : focus === 'studio' ? 10000 : 0,
    studioMixBps,
    studioTopUpBps: focus === 'studio' || focus === 'multi' ? STUDIO_TOP_UP_BPS[level] : 0,
    marketplacePlanBps: focus === 'multi' ? MARKETPLACE_PLAN_BPS[level] : focus === 'marketplace' ? 10000 : 0,
    marketplaceMixBps,
    ordersPer100Customers:
      focus === 'marketplace'
        ? MARKETPLACE_ORDERS_PER_100[level]
        : focus === 'multi'
          ? ORDERS_PER_100[level]
          : 0,
    deliveriesPer100Customers:
      focus === 'marketplace'
        ? MARKETPLACE_DELIVERIES_PER_100[level]
        : focus === 'multi'
          ? DELIVERIES_PER_100[level]
          : 0,
    includeNetwork: network?.includeNetwork ?? false,
    subAffiliates: network?.subAffiliates ?? 5,
    customersPerSub: network?.customersPerSub ?? 10,
  };
  return base;
}

export function assumptionsWithoutAddOns(assumptions: GoalAssumptions): GoalAssumptions {
  if (assumptions.focus === 'studio') {
    return { ...assumptions, studioTopUpBps: 0, includeNetwork: false };
  }
  if (assumptions.focus === 'marketplace') {
    return {
      ...assumptions,
      ordersPer100Customers: 0,
      deliveriesPer100Customers: 0,
      includeNetwork: false,
    };
  }
  return {
    ...assumptions,
    studioCrossSellBps: 0,
    studioTopUpBps: 0,
    marketplacePlanBps: 0,
    ordersPer100Customers: 0,
    deliveriesPer100Customers: 0,
    includeNetwork: false,
  };
}

function emptyCounts(): PortfolioCounts {
  return {
    growthStarter: 0,
    growthPro: 0,
    growthBusiness: 0,
    growthEnterprise: 0,
    studioCreator: 0,
    studioPro: 0,
    studioStudio: 0,
    studioTopUps: 0,
    marketplaceBasic: 0,
    marketplacePro: 0,
    marketplacePremium: 0,
    orders: 0,
    deliveries: 0,
  };
}

function ownPortfolio(customers: number, assumptions: GoalAssumptions, rates: CanonicalRates) {
  const growthWeights =
    assumptions.focus === 'studio' || assumptions.focus === 'marketplace'
      ? [0, 0, 0, 0]
      : [
          assumptions.growthMixBps.starter,
          assumptions.growthMixBps.pro,
          assumptions.growthMixBps.business,
          assumptions.growthMixBps.enterprise,
        ];
  const [growthStarter, growthPro, growthBusiness, growthEnterprise] = allocateByWeights(
    customers,
    growthWeights,
  );
  const studioBase =
    assumptions.focus === 'studio'
      ? customers
      : Math.floor((customers * clampBps(assumptions.studioCrossSellBps)) / 10000);
  const [studioCreator, studioPro, studioStudio] = allocateByWeights(studioBase, [
    assumptions.studioMixBps.creator,
    assumptions.studioMixBps.pro,
    assumptions.studioMixBps.studio,
  ]);
  const studioTopUps = Math.floor((studioBase * clampBps(assumptions.studioTopUpBps)) / 10000);
  const marketplaceBase =
    assumptions.focus === 'marketplace'
      ? customers
      : Math.floor((customers * clampBps(assumptions.marketplacePlanBps)) / 10000);
  const [marketplaceBasic, marketplacePro, marketplacePremium] = allocateByWeights(marketplaceBase, [
    assumptions.marketplaceMixBps.basic,
    assumptions.marketplaceMixBps.pro,
    assumptions.marketplaceMixBps.premium,
  ]);
  const orders = Math.floor((customers * clampCount(assumptions.ordersPer100Customers, 10000)) / 100);
  const deliveries = Math.floor(
    (customers * clampCount(assumptions.deliveriesPer100Customers, 10000)) / 100,
  );
  const growth =
    growthStarter * rates.growthDirect.starter +
    growthPro * rates.growthDirect.pro +
    growthBusiness * rates.growthDirect.business +
    growthEnterprise * rates.growthDirect.enterprise;
  const studio =
    studioCreator * rates.studioDirect.creator +
    studioPro * rates.studioDirect.pro +
    studioStudio * rates.studioDirect.studio;
  const studioTopUp = studioTopUps * rates.studioTopUpCents;
  const marketplacePlans =
    marketplaceBasic * rates.marketplaceDirect.basic +
    marketplacePro * rates.marketplaceDirect.pro +
    marketplacePremium * rates.marketplaceDirect.premium;
  const orderCents = orders * rates.orderCents;
  const deliveryCents = deliveries * rates.deliveryCents;
  const counts: PortfolioCounts = {
    growthStarter,
    growthPro,
    growthBusiness,
    growthEnterprise,
    studioCreator,
    studioPro,
    studioStudio,
    studioTopUps,
    marketplaceBasic,
    marketplacePro,
    marketplacePremium,
    orders,
    deliveries,
  };
  return {
    cents: growth + studio + studioTopUp + marketplacePlans + orderCents + deliveryCents,
    counts,
    partCents: {
      growth,
      studio,
      studioTopUp,
      marketplacePlans,
      orders: orderCents,
      deliveries: deliveryCents,
    },
  };
}

function networkPortfolio(assumptions: GoalAssumptions, rates: CanonicalRates) {
  if (!assumptions.includeNetwork) {
    return { customers: 0, cents: 0, applies: assumptions.focus !== 'studio' };
  }
  if (assumptions.focus === 'studio') {
    return {
      customers: clampCount(assumptions.subAffiliates, 500) * clampCount(assumptions.customersPerSub, 5000),
      cents: 0,
      applies: false,
    };
  }
  const customers =
    clampCount(assumptions.subAffiliates, 500) * clampCount(assumptions.customersPerSub, 5000);
  if (assumptions.focus === 'marketplace') {
    const [basic, pro, premium] = allocateByWeights(customers, [
      assumptions.marketplaceMixBps.basic,
      assumptions.marketplaceMixBps.pro,
      assumptions.marketplaceMixBps.premium,
    ]);
    return {
      customers,
      cents:
        basic * rates.marketplaceMain.basic +
        pro * rates.marketplaceMain.pro +
        premium * rates.marketplaceMain.premium,
      applies: true,
    };
  }
  const [starter, pro, business, enterprise] = allocateByWeights(customers, [
    assumptions.growthMixBps.starter,
    assumptions.growthMixBps.pro,
    assumptions.growthMixBps.business,
    assumptions.growthMixBps.enterprise,
  ]);
  return {
    customers,
    cents:
      starter * rates.growthMain.starter +
      pro * rates.growthMain.pro +
      business * rates.growthMain.business +
      enterprise * rates.growthMain.enterprise,
    applies: true,
  };
}

function smallestCustomers(targetCents: number, score: (customers: number) => number): number {
  if (targetCents <= 0) return 0;
  if (score(1) <= 0) return -1;
  let high = 1;
  while (score(high) < targetCents) {
    if (high >= 1_000_000) return -1;
    high = Math.min(1_000_000, high * 2);
  }
  let low = 0;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (score(mid) >= targetCents) high = mid;
    else low = mid + 1;
  }
  return low;
}

export function commissionForCustomerCount(customers: number, assumptions: GoalAssumptions): number {
  return ownPortfolio(Math.max(0, Math.floor(customers)), assumptions, canonicalScenarioRates()).cents;
}

export function quoteIncomeGoal(input: {
  targetEur: number;
  assumptions: GoalAssumptions;
}): GoalQuote {
  const rates = canonicalScenarioRates();
  const targetCents = Math.max(0, Math.round(input.targetEur * 100));
  const assumptions = input.assumptions;
  const network = networkPortfolio(assumptions, rates);
  const ownTarget = Math.max(0, targetCents - network.cents);
  const ownCustomers = smallestCustomers(ownTarget, (customers) => ownPortfolio(customers, assumptions, rates).cents);
  const reachable = ownCustomers >= 0;
  const own = reachable ? ownPortfolio(ownCustomers, assumptions, rates) : ownPortfolio(0, assumptions, rates);
  const calculatedCents = (reachable ? own.cents : 0) + network.cents;
  return {
    targetCents,
    reachable,
    ownCustomers: reachable ? ownCustomers : 0,
    ownCents: reachable ? own.cents : 0,
    weightedCentsPerCustomer:
      reachable && ownCustomers > 0 ? own.cents / ownCustomers : 0,
    networkCustomers: network.customers,
    networkCents: network.cents,
    networkApplies: network.applies,
    calculatedCents,
    deltaCents: calculatedCents - targetCents,
    counts: own.counts,
    partCents: own.partCents,
    rates,
  };
}

export function starterOnlyCustomersForGoal(targetEur: number): number {
  return growthStarterCustomersForMonthlyTarget(targetEur).customers;
}

export function compareScenarioLevels(targetEur: number, focus: PortfolioFocus): Record<ScenarioLevel, GoalQuote> {
  return {
    conservative: quoteIncomeGoal({
      targetEur,
      assumptions: assumptionsFor('conservative', focus),
    }),
    mixed: quoteIncomeGoal({
      targetEur,
      assumptions: assumptionsFor('mixed', focus),
    }),
    ambitious: quoteIncomeGoal({
      targetEur,
      assumptions: assumptionsFor('ambitious', focus),
    }),
  };
}

export function percentLabel(weight: number, weights: number[]): number {
  const sum = weights.reduce((total, item) => total + Math.max(0, item), 0);
  if (sum <= 0) return 0;
  return Math.round((Math.max(0, weight) * 1000) / sum) / 10;
}
