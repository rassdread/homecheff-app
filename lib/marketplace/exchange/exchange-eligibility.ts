/**
 * Exchange eligibility — Phase 4D.
 */

import type { BarterOpenness } from '@prisma/client';
import type { ExchangeListingProfile } from './exchange-contract';
import { resolvePaymentMethod } from '@/lib/marketplace/value-exchange/payment-methods';

export type ExchangeEligibilityInput = {
  isActive: boolean;
  isDiscoverable: boolean;
  isBlocked: boolean;
  expiresAt: string | null;
  barterOpenness?: string | null;
  priceModel?: string | null;
  acceptedTaxonomyIds?: string[];
  offerSubcategoryIds?: string[];
  now?: number;
};

export type ExchangeEligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

const BARTER_OPENNESS = new Set<string>([
  'MONEY',
  'MONEY_AND_BARTER',
  'BARTER_ONLY',
]);

export function isValidBarterConfiguration(input: {
  barterOpenness?: string | null;
  priceModel?: string | null;
  acceptedTaxonomyIds?: string[];
}): boolean {
  const openness = String(input.barterOpenness ?? 'MONEY').toUpperCase();
  if (!BARTER_OPENNESS.has(openness)) return false;

  if (openness === 'MONEY') return true;

  const hasAccepted = (input.acceptedTaxonomyIds?.length ?? 0) > 0;
  if (openness === 'BARTER_ONLY' && !hasAccepted) return false;

  resolvePaymentMethod({
    barterOpenness: openness as BarterOpenness,
    priceModel: input.priceModel,
  });

  return true;
}

export function evaluateExchangeEligibility(
  input: ExchangeEligibilityInput,
): ExchangeEligibilityResult {
  const reasons: string[] = [];
  const now = input.now ?? Date.now();

  if (!input.isActive) reasons.push('not_active');
  if (!input.isDiscoverable) reasons.push('not_discoverable');
  if (input.isBlocked) reasons.push('blocked');

  if (input.expiresAt) {
    const exp = Date.parse(input.expiresAt);
    if (Number.isFinite(exp) && exp < now) reasons.push('expired');
  }

  if (!isValidBarterConfiguration(input)) {
    reasons.push('invalid_barter_config');
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

export function profileIsExchangeEligible(
  profile: ExchangeListingProfile,
  now?: number,
): ExchangeEligibilityResult {
  return evaluateExchangeEligibility({
    isActive: profile.isActive,
    isDiscoverable: profile.isDiscoverable,
    isBlocked: profile.isBlocked,
    expiresAt: profile.expiresAt,
    barterOpenness: profile.acceptance?.barterOpenness,
    priceModel: null,
    acceptedTaxonomyIds: profile.acceptance?.subcategoryIds,
    offerSubcategoryIds: profile.offer.subcategoryIds,
    now,
  });
}

export function bothProfilesEligibleForMatching(
  a: ExchangeListingProfile,
  b: ExchangeListingProfile,
  now?: number,
): boolean {
  return (
    profileIsExchangeEligible(a, now).eligible &&
    profileIsExchangeEligible(b, now).eligible
  );
}
