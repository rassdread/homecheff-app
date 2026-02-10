/**
 * Affiliate System Configuration
 * 
 * This file contains all configuration constants for the affiliate system.
 * These values can be adjusted based on business requirements.
 */

// Commission percentages for user transactions (0-1, so 0.25 = 25%)
// Per gebruiker (koper of verkoper): 25% van HomeCheff fee
// Als beide (koper EN verkoper) zijn aangebracht: 50% (25% + 25%)
export const AFFILIATE_USER_COMMISSION_PCT = 0.25; // 25% per gebruiker (voor directe affiliates)

// Sub-affiliate commission percentages
// Sub-affiliate krijgt minder dan directe affiliate, maar hoofd-affiliate krijgt ook commissie
export const SUB_AFFILIATE_USER_COMMISSION_PCT = 0.20; // 20% per gebruiker voor sub-affiliate
export const PARENT_AFFILIATE_USER_COMMISSION_PCT = 0.05; // 5% per gebruiker voor hoofd-affiliate
export const PARENT_AFFILIATE_BOTH_SIDES_COMMISSION_PCT = 0.10; // 10% als beide koper en verkoper (5% + 5%)

// Commission percentage for business subscriptions (0-1, so 0.50 = 50%)
// Direct affiliate krijgt 50% van de abonnementsfee
// HomeCheff krijgt altijd 50% (niet aangepast)
export const AFFILIATE_BUSINESS_COMMISSION_PCT = 0.50; // 50% van abonnementsfee (voor directe affiliates)

// Sub-affiliate business commission percentages
// Sub krijgt 40% van totaal = 80% van main's 50% commissie
export const SUB_AFFILIATE_BUSINESS_COMMISSION_PCT = 0.40; // 40% van abonnementsfee voor sub-affiliate (80% van main's 50%)
export const PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT = 0.10; // 10% van abonnementsfee voor hoofd-affiliate (20% van main's 50%)

// Maximum discount percentage for sub-affiliates (van hun 40% share)
// Sub krijgt 40% commissie (80% van main's 50%), kan maximaal 75% korting geven (25% minimum behouden = 10% van totaal)
// Van €40 commissie kan max €30 korting (75%), blijft €10 over (25% = 10% van totaal)
export const SUB_AFFILIATE_MAX_DISCOUNT_PCT = 75; // Max 75% korting van 40% share (25% minimum behouden = 10% van totaal)

// Maximum discount percentage for main affiliates (van hun 50% share)
// Main moet minimaal 20% behouden (via korting OF via sub-affiliate), dus max 80% korting
export const MAIN_AFFILIATE_MAX_DISCOUNT_PCT = 80; // Max 80% korting van 50% share (20% minimum behouden = 10% van totaal)

// Minimum commission percentage that must remain after discount
// Main affiliates: 20% minimum (via korting of sub-affiliate), dus max 80% korting
// Sub-affiliates: 25% minimum (van hun 40% = 80% van main's commissie), dus max 75% korting
export const MAIN_AFFILIATE_MIN_COMMISSION_PCT = 0.20; // 20% minimum voor main affiliates (10% van totaal)
export const SUB_AFFILIATE_MIN_COMMISSION_PCT = 0.20; // 20% minimum voor sub-affiliates (8% van totaal, want 20% van 40%)

// Legacy: L1/L2 percentages (niet meer gebruikt, maar behouden voor backwards compatibility)
export const AFFILIATE_L1_PCT = 0.25; // Direct affiliate (first level)
export const AFFILIATE_L2_PCT = 0.25; // Upline affiliate (second level)

// Attribution window: how long revenue share is valid (in days)
export const ATTRIBUTION_WINDOW_DAYS = 365;

// Cookie TTL: how long referral cookie is valid (in days)
export const COOKIE_TTL_DAYS = 30;

// Commission pending period: how long before commission becomes available (in days)
export const LEDGER_PENDING_DAYS = 14;

// Discount applies to
export const DISCOUNT_APPLIES_TO = 'SUBSCRIPTION_ONLY' as const;

// Minimum commission amount (in cents) before payout
export const MIN_PAYOUT_AMOUNT_CENTS = 1000; // €10.00

// Payout frequency: 'daily' | 'weekly' | 'monthly'
export const PAYOUT_FREQUENCY = 'weekly' as const;

/**
 * Calculate commission for user transactions (koper/verkoper)
 * @param homecheffFeeCents HomeCheff fee in cents (platform fee from transaction)
 * @param buyerAttributed Whether buyer was attributed to affiliate
 * @param sellerAttributed Whether seller was attributed to affiliate
 * @param isSubAffiliate Whether the affiliate is a sub-affiliate (has parent)
 * @returns Commission amount in cents for the direct affiliate
 */
export function calculateUserTransactionCommission(
  homecheffFeeCents: number,
  buyerAttributed: boolean,
  sellerAttributed: boolean,
  isSubAffiliate: boolean = false,
  customUserCommissionPct: number | null = null
): number {
  let commissionPct = 0;
  
  // Use custom percentage if provided, otherwise use defaults
  const userCommissionPct = customUserCommissionPct !== null
    ? customUserCommissionPct
    : (isSubAffiliate 
        ? SUB_AFFILIATE_USER_COMMISSION_PCT 
        : AFFILIATE_USER_COMMISSION_PCT);
  
  if (buyerAttributed) {
    commissionPct += userCommissionPct;
  }
  
  if (sellerAttributed) {
    commissionPct += userCommissionPct;
  }
  
  return Math.round(homecheffFeeCents * commissionPct);
}

/**
 * Calculate parent affiliate commission for user transactions
 * @param homecheffFeeCents HomeCheff fee in cents
 * @param buyerAttributed Whether buyer was attributed to sub-affiliate
 * @param sellerAttributed Whether seller was attributed to sub-affiliate
 * @returns Commission amount in cents for parent affiliate
 */
export function calculateParentAffiliateUserTransactionCommission(
  homecheffFeeCents: number,
  buyerAttributed: boolean,
  sellerAttributed: boolean,
  customParentUserCommissionPct: number | null = null
): number {
  let commissionPct = 0;
  
  // Use custom percentage if provided, otherwise use default
  const parentCommissionPct = customParentUserCommissionPct !== null
    ? customParentUserCommissionPct
    : PARENT_AFFILIATE_USER_COMMISSION_PCT;
  
  if (buyerAttributed) {
    commissionPct += parentCommissionPct;
  }
  
  if (sellerAttributed) {
    commissionPct += parentCommissionPct;
  }
  
  return Math.round(homecheffFeeCents * commissionPct);
}

/**
 * Calculate commission for business subscriptions
 * @param subscriptionFeeCents Subscription fee in cents (base price)
 * @param discountSharePct Discount percentage (0-100) that affiliate gives from their commission
 * @param isSubAffiliate Whether the affiliate is a sub-affiliate (has parent)
 * @returns Object with affiliate commission, discount, final price, and HomeCheff share
 */
export function calculateBusinessSubscriptionCommission(
  subscriptionFeeCents: number,
  discountSharePct: number = 0,
  isSubAffiliate: boolean = false,
  customBusinessCommissionPct: number | null = null
): {
  affiliateCommissionCents: number; // Affiliate krijgt 50% (direct) of 40% (sub) van base price
  discountCents: number; // Korting die affiliate geeft (vanuit zijn eigen commission)
  finalPriceCents: number; // Wat bedrijf betaalt (base - discount)
  homecheffShareCents: number; // HomeCheff krijgt altijd 50% van base price
  finalAffiliateCommissionCents: number; // Wat affiliate uiteindelijk krijgt (commission - discount)
} {
  // Use custom percentage if provided, otherwise use defaults
  const commissionPct = customBusinessCommissionPct !== null
    ? customBusinessCommissionPct
    : (isSubAffiliate 
        ? SUB_AFFILIATE_BUSINESS_COMMISSION_PCT 
        : AFFILIATE_BUSINESS_COMMISSION_PCT);
  
  // Affiliate krijgt 50% (direct) of 40% (sub) of custom van de abonnementsfee
  const affiliateCommissionCents = Math.round(subscriptionFeeCents * commissionPct);
  
  // HomeCheff krijgt altijd 50% van de base price (niet aangepast)
  const homecheffShareCents = Math.round(subscriptionFeeCents * AFFILIATE_BUSINESS_COMMISSION_PCT);
  
  // Cap discount percentage based on affiliate type
  // Main affiliates: max 80% of their 50% share (20% minimum behouden = 10% van totaal)
  // Sub-affiliates: max 75% of their 40% share (25% minimum behouden = 10% van totaal)
  // Sub krijgt 40% commissie, kan max €30 korting geven van €40 (75%), blijft €10 over (25% = 10% van totaal)
  const maxDiscountPct = isSubAffiliate 
    ? Math.min(discountSharePct, SUB_AFFILIATE_MAX_DISCOUNT_PCT)
    : Math.min(discountSharePct, MAIN_AFFILIATE_MAX_DISCOUNT_PCT);
  
  // Affiliate kan korting geven vanuit zijn eigen commission
  // applyDiscountToL1 ensures minimum commission remains (20% for both main and sub)
  const { discountCents, finalL1ShareCents } = applyDiscountToL1(
    affiliateCommissionCents,
    maxDiscountPct,
    isSubAffiliate
  );
  
  // Final price = base price - discount
  const finalPriceCents = subscriptionFeeCents - discountCents;
  
  // Final affiliate commission = commission - discount
  const finalAffiliateCommissionCents = finalL1ShareCents;
  
  return {
    affiliateCommissionCents,
    discountCents,
    finalPriceCents,
    homecheffShareCents,
    finalAffiliateCommissionCents,
  };
}

/**
 * Calculate parent affiliate commission for business subscriptions
 * @param subscriptionFeeCents Subscription fee in cents (base price)
 * @returns Commission amount in cents for parent affiliate
 */
export function calculateParentAffiliateBusinessCommission(
  subscriptionFeeCents: number,
  customParentBusinessCommissionPct: number | null = null
): number {
  const commissionPct = customParentBusinessCommissionPct !== null
    ? customParentBusinessCommissionPct
    : PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT;
  
  return Math.round(subscriptionFeeCents * commissionPct);
}

/**
 * Calculate revenue shares for a given amount (legacy function, kept for backwards compatibility)
 * @param amountCents Amount in cents
 * @param hasL2 Whether L2 affiliate exists
 * @returns Object with L1, L2, and HomeCheff shares
 */
export function calculateRevenueShares(
  amountCents: number,
  hasL2: boolean = false
): {
  l1ShareCents: number;
  l2ShareCents: number;
  homecheffShareCents: number;
} {
  const l1ShareCents = Math.round(amountCents * AFFILIATE_L1_PCT);
  const l2ShareCents = hasL2 ? Math.round(amountCents * AFFILIATE_L2_PCT) : 0;
  const homecheffShareCents = amountCents - l1ShareCents - l2ShareCents;

  return {
    l1ShareCents,
    l2ShareCents,
    homecheffShareCents,
  };
}

/**
 * Apply discount to L1 share (only L1 share can be discounted)
 * @param l1ShareCents Original L1 share in cents
 * @param discountSharePct Discount percentage (0-100) of L1 share
 * @param isSubAffiliate Whether the affiliate is a sub-affiliate (affects minimum commission)
 * @returns Discount amount and new L1 share
 */
export function applyDiscountToL1(
  l1ShareCents: number,
  discountSharePct: number,
  isSubAffiliate: boolean = false
): {
  discountCents: number;
  finalL1ShareCents: number;
} {
  // Ensure discount is between 0 and 100
  const cappedDiscountPct = Math.min(Math.max(discountSharePct, 0), 100);
  
  // Calculate discount amount
  const discountCents = Math.round(l1ShareCents * (cappedDiscountPct / 100));
  const finalL1ShareCents = l1ShareCents - discountCents;
  
  // Ensure affiliate keeps at least the minimum commission based on type
  // Main affiliates: 20% minimum van hun 50% commissie (10% van totaal) - max 80% korting
  // Sub-affiliates: 25% minimum van hun 40% commissie (10% van totaal) - max 75% korting
  // Sub krijgt 40% commissie, kan max €30 korting geven van €40 (75%), blijft €10 over (25% = 10% van totaal)
  const minCommissionPct = isSubAffiliate 
    ? SUB_AFFILIATE_MIN_COMMISSION_PCT 
    : MAIN_AFFILIATE_MIN_COMMISSION_PCT;
  const minCommissionCents = Math.round(l1ShareCents * minCommissionPct);
  
  if (finalL1ShareCents < minCommissionCents) {
    // Adjust discount to ensure minimum commission remains
    const adjustedDiscountCents = l1ShareCents - minCommissionCents;
    return {
      discountCents: adjustedDiscountCents,
      finalL1ShareCents: minCommissionCents,
    };
  }

  return {
    discountCents,
    finalL1ShareCents,
  };
}

/**
 * Calculate final subscription price with affiliate discount (for business subscriptions)
 * @param basePriceCents Base subscription price in cents
 * @param discountSharePct Discount percentage (0-100) that affiliate gives from their commission
 * @returns Final price and discount details
 */
export function calculateSubscriptionPrice(
  basePriceCents: number,
  discountSharePct: number,
  isSubAffiliate: boolean = false
): {
  basePriceCents: number;
  affiliateCommissionCents: number;
  discountCents: number;
  finalPriceCents: number;
  homecheffShareCents: number;
  finalAffiliateCommissionCents: number;
} {
  const result = calculateBusinessSubscriptionCommission(basePriceCents, discountSharePct, isSubAffiliate);
  
  return {
    basePriceCents,
    affiliateCommissionCents: result.affiliateCommissionCents,
    discountCents: result.discountCents,
    finalPriceCents: result.finalPriceCents,
    homecheffShareCents: result.homecheffShareCents,
    finalAffiliateCommissionCents: result.finalAffiliateCommissionCents,
  };
}

