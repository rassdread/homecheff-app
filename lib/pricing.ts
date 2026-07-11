// HomeCheff Verdienmodel & Pricing Tiers

export const PRICING_TIERS = {
  INDIVIDUAL: {
    name: 'Particulier',
    maxRevenue: 2000,
    feePercentage: 12,
    monthlyFee: 0,
    maxUsers: null,
    features: [
      'Zichtbaar op het dorpsplein in je buurt',
      'Basis verkopersoverzicht',
      '1 locatie',
      'Standaard support',
    ]
  },
  BUSINESS_BASIC: {
    name: 'Basic Bedrijf',
    maxRevenue: null,
    feePercentage: 9,
    monthlyFee: 39,
    maxUsers: 5,
    features: [
      'Business badge + geverifieerd profiel',
      'Lagere platformfee (9%)',
      'Basis verkopersoverzicht',
      'Lokale profielpresentatie',
      '€39 per maand',
    ]
  },
  BUSINESS_PRO: {
    name: 'Pro Bedrijf',
    maxRevenue: null,
    feePercentage: 7,
    monthlyFee: 99,
    maxUsers: 25,
    features: [
      'Business badge + sterkere profielpresentatie',
      'Lagere platformfee (7%)',
      'Verkopersoverzicht in dashboard',
      '2 vestigingen',
      '€99 per maand',
    ]
  },
  BUSINESS_PREMIUM: {
    name: 'Premium Bedrijf',
    maxRevenue: null,
    feePercentage: 5,
    monthlyFee: 199,
    maxUsers: null,
    features: [
      'Premium badge + uitgebreide profielpresentatie',
      'Laagste platformfee (5%)',
      'Verkopersoverzicht in dashboard',
      'Regionale profielondersteuning',
      '€199 per maand',
    ]
  }
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

export const calculateFee = (amount: number, tier: PricingTier): number => {
  const pricing = PRICING_TIERS[tier];
  return Math.round((amount * pricing.feePercentage) / 100);
};

export const calculateNetAmount = (amount: number, tier: PricingTier): number => {
  const fee = calculateFee(amount, tier);
  return amount - fee;
};

// Revenue projections
export const REVENUE_PROJECTIONS = {
  INDIVIDUAL: {
    maxPerUser: 240, // €240 per jaar per particulier
    targetUsers: 2000,
    projectedRevenue: 480000 // €480.000 per jaar bij 2000 gebruikers
  },
  BUSINESS: {
    basic: { users: 100, monthly: 3900, yearly: 46800 },
    pro: { users: 50, monthly: 4950, yearly: 59400 },
    premium: { users: 20, monthly: 3980, yearly: 47760 },
    totalYearly: 153960 // €153.960 per jaar
  },
  TOTAL_PROJECTED: 633960 // €633.960 per jaar totaal
};


