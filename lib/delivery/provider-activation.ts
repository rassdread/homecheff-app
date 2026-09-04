/**
 * Deterministic provider activation gate (customer-selectable supply).
 * Does not require admin approval by default.
 */

import { validateProviderPricingConfig } from '@/lib/delivery/provider-pricing';
import { isDeliveryBusinessProvider } from '@/lib/delivery/provider-identity';

export type ProviderActivationProfile = {
  providerType: string;
  isActive: boolean;
  isOnline: boolean;
  homeLat: number | null;
  homeLng: number | null;
  maxDistance: number | null;
  nationalCoverage: boolean | null;
  pricingEnabled: boolean;
  baseFeeCents: number | null;
  pricePerKmCents: number | null;
  minimumFeeCents: number | null;
  freeDeliveryRadiusKm: number | null;
  companyDisplayName: string | null;
};

export type ProviderActivationResult =
  | { ok: true; missing: [] }
  | { ok: false; missing: string[]; message: string };

/**
 * Requirements before a provider may be customer-selectable (isActive=true).
 */
export function evaluateProviderActivation(
  profile: ProviderActivationProfile,
  options?: { requirePricing?: boolean },
): ProviderActivationResult {
  const missing: string[] = [];
  const requirePricing = options?.requirePricing !== false;

  if (isDeliveryBusinessProvider(profile.providerType)) {
    if (!profile.companyDisplayName?.trim()) {
      missing.push('companyDisplayName');
    }
  }

  const hasArea =
    profile.nationalCoverage === true ||
    (typeof profile.homeLat === 'number' &&
      typeof profile.homeLng === 'number' &&
      typeof profile.maxDistance === 'number' &&
      profile.maxDistance > 0);

  if (!hasArea) {
    missing.push('serviceArea');
  }

  if (requirePricing) {
    const pricing = validateProviderPricingConfig({
      pricingEnabled: profile.pricingEnabled,
      baseFeeCents: profile.baseFeeCents,
      pricePerKmCents: profile.pricePerKmCents,
      minimumFeeCents: profile.minimumFeeCents,
      freeDeliveryRadiusKm: profile.freeDeliveryRadiusKm,
      maxDistanceKm: profile.maxDistance,
      nationalCoverage: profile.nationalCoverage,
    });
    if (!pricing.ok) {
      missing.push('pricing');
    }
  }

  if (missing.length > 0) {
    const hints: Record<string, string> = {
      companyDisplayName: 'Vul een bedrijfsnaam in',
      serviceArea: 'Stel je werkgebied in (locatie + straal)',
      pricing: 'Activeer en vul je bezorgtarief in',
    };
    return {
      ok: false,
      missing,
      message: missing.map((m) => hints[m] || m).join('. ') + '.',
    };
  }

  return { ok: true, missing: [] };
}
