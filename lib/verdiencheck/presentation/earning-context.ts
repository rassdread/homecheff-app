/**
 * Presentation/earning context only. Does not fork legal or financial engines.
 * Platform is not a legal classification.
 */

import type { VerdienCheckEntryPoint } from '../privacy/analytics-guard';
import type { ActivityChoice } from '../wizard/schema';
import type { ProceedSemantics } from '../personal-route/types';

export const EARNING_INTENT_CONTEXTS = ['HOMECHEFF_SELLER', 'GENERAL'] as const;
export type EarningIntentContext = (typeof EARNING_INTENT_CONTEXTS)[number];

export const RESULT_CTA_MODES = [
  'SELL_PRIMARY',
  'SELL_SECONDARY',
  'DISCOVER',
  'AFFILIATE',
  'NONE',
] as const;
export type ResultCtaMode = (typeof RESULT_CTA_MODES)[number];

/** Seller onboarding is the only entry that already knows HomeCheff selling intent. */
export function earningIntentFromEntry(entry: VerdienCheckEntryPoint): EarningIntentContext {
  return entry === 'seller' ? 'HOMECHEFF_SELLER' : 'GENERAL';
}

export function isAffiliateActivity(choice: ActivityChoice | null | undefined): boolean {
  return choice === 'AFFILIATE';
}

export function isHomecheffSupportedListingActivity(
  choice: ActivityChoice | null | undefined,
): boolean {
  return choice === 'MAKE' || choice === 'FOOD' || choice === 'SERVICE' || choice === 'GARDEN';
}

/**
 * CTA is presentation. Legal result does not require HomeCheff.
 * Affiliate never gets a listing CTA.
 */
export function resolveResultCtaMode(input: {
  intent: EarningIntentContext;
  activity: ActivityChoice | null;
  semantics: ProceedSemantics;
}): ResultCtaMode {
  if (input.semantics === 'CHECK_FIRST' || input.semantics === 'INSUFFICIENT_CONTEXT') {
    return 'NONE';
  }
  if (isAffiliateActivity(input.activity)) {
    return input.semantics === 'READY_TO_PROCEED' || input.semantics === 'PROCEED_AFTER_ACTION'
      ? 'AFFILIATE'
      : 'NONE';
  }
  if (input.intent === 'HOMECHEFF_SELLER' || input.intent === 'GENERAL') {
    if (input.semantics === 'READY_TO_PROCEED') return 'SELL_PRIMARY';
    if (input.semantics === 'PROCEED_AFTER_ACTION') return 'SELL_SECONDARY';
  }
  return 'NONE';
}

export function listingCtaPromptKey(
  activity: ActivityChoice | null | undefined,
): 'ctaPromptFood' | 'ctaPromptGarden' | 'ctaPromptMake' | 'ctaPromptService' | 'ctaPromptDefault' {
  if (activity === 'FOOD') return 'ctaPromptFood';
  if (activity === 'GARDEN') return 'ctaPromptGarden';
  if (activity === 'MAKE') return 'ctaPromptMake';
  if (activity === 'SERVICE') return 'ctaPromptService';
  return 'ctaPromptDefault';
}
