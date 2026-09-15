/**
 * Single source of truth for “is this delivery profile ready for matching?”.
 * Wraps evaluateProviderActivation — do not invent a parallel checklist elsewhere.
 *
 * Call getDeliveryProfileCompletion() from sidebar, dashboard, settings,
 * onboarding and banners. Never duplicate the missing-field rules.
 */

import {
  evaluateProviderActivation,
  type ProviderActivationProfile,
  type ProviderActivationResult,
} from '@/lib/delivery/provider-activation';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import {
  toProviderActivationProfile,
  type CanonicalDeliveryProfileRow,
  type DeliveryUserLocation,
} from '@/lib/delivery/delivery-profile-canonical';
import { evaluateDeliveryAgeRequirement } from '@/lib/delivery/delivery-age';

export type DeliveryProfileCompletionInput = ProviderActivationProfile & {
  isVerified?: boolean;
  dateOfBirth?: Date | string | null;
};

export type DeliveryProfileCompletionResult = ProviderActivationResult & {
  /** True when activation gate passes (area + availability + pricing [+ business name]). */
  isComplete: boolean;
};

export const DELIVERY_SETTINGS_HREF = '/delivery/settings';
export const DELIVERY_AGE_STEP_HREF = '/delivery/settings#leeftijd';
export const DELIVERY_START_HREF = '/delivery/start';
export const DELIVERY_SIGNUP_HREF = '/delivery/signup';
export const DELIVERY_DASHBOARD_HREF = '/delivery/dashboard';

/** Canonical entry when the user has no DeliveryProfile row yet. */
export const DELIVERY_ONBOARDING_CANONICAL_HREF = DELIVERY_START_HREF;

/** Canonical editor when a DeliveryProfile row exists (complete or partial). */
export const DELIVERY_PROFILE_EDITOR_HREF = DELIVERY_SETTINGS_HREF;

export function evaluateDeliveryProfileCompletion(
  profile: DeliveryProfileCompletionInput,
  options?: { requirePricing?: boolean },
): DeliveryProfileCompletionResult {
  const flags = getDeliveryAlignmentFlags();
  const gate = evaluateProviderActivation(profile, {
    requirePricing: options?.requirePricing ?? flags.providerPricingEnabled,
  });
  const age = evaluateDeliveryAgeRequirement({
    dateOfBirth: profile.dateOfBirth,
    ageGateEnabled: flags.commercialAgeGate18Enabled,
  });
  const missing = [...age.missing, ...(gate.ok ? [] : gate.missing)];
  if (missing.length > 0) {
    const hints: Record<string, string> = {
      dateOfBirth: 'Bevestig je leeftijd om te kunnen bezorgen',
      under18: 'Bezorging via HomeCheff is beschikbaar vanaf 18 jaar',
      companyDisplayName: 'Vul een bedrijfsnaam in',
      serviceArea: 'Stel je werkgebied in (locatie + straal)',
      availability: 'Stel je beschikbare dagen en tijden in',
      pricing: 'Activeer en vul je bezorgtarief in',
    };
    return {
      ok: false,
      missing,
      message: missing.map((m) => hints[m] || m).join('. ') + '.',
      isComplete: false,
    };
  }
  return {
    ...gate,
    isComplete: true,
  };
}

export function isDeliveryProfileComplete(
  profile: DeliveryProfileCompletionInput,
  options?: { requirePricing?: boolean },
): boolean {
  return evaluateDeliveryProfileCompletion(profile, options).isComplete;
}

/** Canonical alias used by UI/API. Same rules as evaluateDeliveryProfileCompletion. */
export function getDeliveryProfileCompletion(
  profile: DeliveryProfileCompletionInput,
  options?: { requirePricing?: boolean },
): DeliveryProfileCompletionResult {
  return evaluateDeliveryProfileCompletion(profile, options);
}

export function getDeliveryProfileCompletionFromRow(
  profile: CanonicalDeliveryProfileRow,
  user?: DeliveryUserLocation | null,
  options?: { requirePricing?: boolean },
): DeliveryProfileCompletionResult {
  return getDeliveryProfileCompletion(
    {
      ...toProviderActivationProfile(profile, user),
      isVerified: profile.isVerified,
      dateOfBirth: user?.dateOfBirth ?? null,
    },
    options,
  );
}

export type DeliveryOnboardingPartId =
  | 'age'
  | 'serviceArea'
  | 'availability'
  | 'pricing'
  | 'companyDisplayName';

export type DeliveryOnboardingPart = {
  id: DeliveryOnboardingPartId;
  labelNl: string;
  done: boolean;
};

export function getDeliveryOnboardingProgress(
  profile: DeliveryProfileCompletionInput,
  options?: { requirePricing?: boolean },
): {
  completed: number;
  total: number;
  labelNl: string;
  remainingNl: string[];
  parts: DeliveryOnboardingPart[];
} {
  const result = evaluateDeliveryProfileCompletion(profile, options);
  const missing = new Set(result.ok ? [] : result.missing);
  const includeCompany = profile.providerType === 'DELIVERY_BUSINESS';
  const parts: DeliveryOnboardingPart[] = [
    {
      id: 'age',
      labelNl: 'Leeftijd',
      done: !missing.has('dateOfBirth') && !missing.has('under18'),
    },
    {
      id: 'serviceArea',
      labelNl: 'Werkgebied',
      done: !missing.has('serviceArea'),
    },
    {
      id: 'availability',
      labelNl: 'Beschikbaarheid',
      done: !missing.has('availability'),
    },
    {
      id: 'pricing',
      labelNl: 'Tarieven',
      done: !missing.has('pricing'),
    },
  ];
  if (includeCompany) {
    parts.push({
      id: 'companyDisplayName',
      labelNl: 'Bedrijfsnaam',
      done: !missing.has('companyDisplayName'),
    });
  }
  const completed = parts.filter((p) => p.done).length;
  const remainingNl = parts.filter((p) => !p.done).map((p) => p.labelNl);
  return {
    completed,
    total: parts.length,
    labelNl: `${completed} van ${parts.length} onderdelen voltooid`,
    remainingNl,
    parts,
  };
}
