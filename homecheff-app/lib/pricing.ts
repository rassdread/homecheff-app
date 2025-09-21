// HomeCheff Verdienmodel & Pricing Tiers

export const PRICING_TIERS = {
  INDIVIDUAL: {
    name: 'Particulier',
    maxRevenue: 2000, // €2000 per jaar
    feePercentage: 12, // 12% fee
    monthlyFee: 0, // Geen abonnement
    maxUsers: null, // Geen limiet
    features: [
      'Maximaal €2000 omzet per jaar',
      '12% transactiefee',
      'Basis support',
      'Standaard profiel'
    ]
  },
  BUSINESS_BASIC: {
    name: 'Basic Bedrijf',
    maxRevenue: null, // Geen limiet
    feePercentage: 7, // 7% fee
    monthlyFee: 39, // €39 per maand
    maxUsers: 5,
    features: [
      'Onbeperkte omzet',
      '7% transactiefee',
      '€39 per maand',
      'Max 5 gebruikers',
      'Prioriteit support',
      'Uitgebreid profiel'
    ]
  },
  BUSINESS_PRO: {
    name: 'Pro Bedrijf',
    maxRevenue: null, // Geen limiet
    feePercentage: 4, // 4% fee
    monthlyFee: 99, // €99 per maand
    maxUsers: 25,
    features: [
      'Onbeperkte omzet',
      '4% transactiefee',
      '€99 per maand',
      'Max 25 gebruikers',
      'Premium support',
      'Analytics dashboard',
      'Custom branding'
    ]
  },
  BUSINESS_PREMIUM: {
    name: 'Premium Bedrijf',
    maxRevenue: null, // Geen limiet
    feePercentage: 2, // 2% fee
    monthlyFee: 199, // €199 per maand
    maxUsers: null, // Onbeperkt
    features: [
      'Onbeperkte omzet',
      '2% transactiefee',
      '€199 per maand',
      'Onbeperkte gebruikers',
      'White-label support',
      'Advanced analytics',
      'API toegang',
      'Custom integraties'
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










