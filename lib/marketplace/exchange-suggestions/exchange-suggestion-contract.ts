/**
 * Exchange suggestion contracts — Phase 4F.
 * @see docs/architecture/MARKETPLACE_EXCHANGE_SUGGESTIONS.md
 */

import type { ExchangeMatchType } from '@/lib/marketplace/exchange/exchange-match-types';
import type { ExchangeSignalKind } from '@/lib/marketplace/exchange/exchange-signals';
import { FORBIDDEN_EXCHANGE_SCORE_SIGNALS } from '@/lib/marketplace/exchange/exchange-contract';

export const EXCHANGE_SUGGESTION_SPEC_VERSION = 1 as const;

/** Active suggestion types in 4F — MULTI_STEP is future-only. */
export const ACTIVE_EXCHANGE_SUGGESTION_TYPES = [
  'DIRECT_EXCHANGE',
  'REVERSE_EXCHANGE',
  'MUTUAL_EXCHANGE',
  'LOCAL_EXCHANGE',
  'COMMUNITY_EXCHANGE',
] as const;

export type ActiveExchangeSuggestionType =
  (typeof ACTIVE_EXCHANGE_SUGGESTION_TYPES)[number];

/** Reserved for Phase 4H — never resolved in 4F. */
export const FUTURE_EXCHANGE_SUGGESTION_TYPES = ['MULTI_STEP_EXCHANGE'] as const;

export type FutureExchangeSuggestionType =
  (typeof FUTURE_EXCHANGE_SUGGESTION_TYPES)[number];

export type ExchangeSuggestionType =
  | ActiveExchangeSuggestionType
  | FutureExchangeSuggestionType;

export const EXCHANGE_SUGGESTION_SURFACES = [
  'detail',
  'profile_owner',
  'sidebar',
] as const;

export type ExchangeSuggestionSurface =
  (typeof EXCHANGE_SUGGESTION_SURFACES)[number];

/** Surfaces explicitly forbidden in 4F (documented for validator). */
export const FORBIDDEN_EXCHANGE_SUGGESTION_SURFACES = [
  'tile',
  'tile_browse',
  'discovery_feed',
  'sponsored',
  'notification',
] as const;

export const EXCHANGE_SUGGESTION_CTAS = [
  'view_listing',
  'view_profile',
  'start_conversation',
] as const;

export type ExchangeSuggestionCta = (typeof EXCHANGE_SUGGESTION_CTAS)[number];

export type ExchangeSuggestionCard = {
  id: string;
  suggestionType: ActiveExchangeSuggestionType;
  modifierTypes: ActiveExchangeSuggestionType[];
  primaryMatchType: ExchangeMatchType;
  score: number;
  typeLabelKey: string;
  summaryLabelKey: string;
  summaryParams: Record<string, string>;
  sourceListingId: string;
  targetListingId: string;
  counterpartyListingId: string;
  counterpartyTitle: string;
  counterpartyUsername: string | null;
  counterpartyUserId: string;
  distanceKm: number | null;
  allowedCtas: ExchangeSuggestionCta[];
  signalKinds: ExchangeSignalKind[];
};

export type ExchangeSuggestionSurfacePlan = {
  surface: ExchangeSuggestionSurface;
  titleKey: string;
  suggestions: ExchangeSuggestionCard[];
  outbound: ExchangeSuggestionCard[];
  inbound: ExchangeSuggestionCard[];
  showModule: boolean;
  capped: boolean;
  capReasons: string[];
};

export type ExchangeSuggestionCapState = {
  sessionImpressionCount: number;
  dismissedSuggestionIds: string[];
  sellerImpressionsToday: Record<string, number>;
  globalSnoozeUntil: string | null;
};

export const EMPTY_EXCHANGE_SUGGESTION_CAP_STATE: ExchangeSuggestionCapState = {
  sessionImpressionCount: 0,
  dismissedSuggestionIds: [],
  sellerImpressionsToday: {},
  globalSnoozeUntil: null,
};

export const EXCHANGE_SUGGESTION_FORBIDDEN_SIGNALS = [
  ...FORBIDDEN_EXCHANGE_SCORE_SIGNALS,
] as const;

export type ExchangeSuggestionForbiddenSignal =
  (typeof EXCHANGE_SUGGESTION_FORBIDDEN_SIGNALS)[number];

export function suggestionPayloadIsClean(
  payload: Record<string, unknown>,
): boolean {
  return EXCHANGE_SUGGESTION_FORBIDDEN_SIGNALS.every(
    (key) => payload[key] === undefined,
  );
}

export function isActiveSuggestionType(
  value: string,
): value is ActiveExchangeSuggestionType {
  return (ACTIVE_EXCHANGE_SUGGESTION_TYPES as readonly string[]).includes(value);
}
