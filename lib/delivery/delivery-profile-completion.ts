/**
 * Single source of truth for “is this delivery profile ready for matching?”.
 * Wraps evaluateProviderActivation — do not invent a parallel checklist elsewhere.
 */

import {
  evaluateProviderActivation,
  type ProviderActivationProfile,
  type ProviderActivationResult,
} from '@/lib/delivery/provider-activation';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';

export type DeliveryProfileCompletionInput = ProviderActivationProfile & {
  isVerified?: boolean;
};

export type DeliveryProfileCompletionResult = ProviderActivationResult & {
  /** True when activation gate passes (area + pricing [+ business name]). */
  isComplete: boolean;
};

export const DELIVERY_SETTINGS_HREF = '/delivery/settings';
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
  return {
    ...gate,
    isComplete: gate.ok,
  };
}

export function isDeliveryProfileComplete(
  profile: DeliveryProfileCompletionInput,
  options?: { requirePricing?: boolean },
): boolean {
  return evaluateDeliveryProfileCompletion(profile, options).isComplete;
}
