/**
 * Exchange suggestion surface rules — Phase 4F.
 */

import type {
  ExchangeSuggestionSurface,
  ExchangeSuggestionSurfacePlan,
} from './exchange-suggestion-contract';
import { FORBIDDEN_EXCHANGE_SUGGESTION_SURFACES } from './exchange-suggestion-contract';
import { suggestionSurfaceTitleKey } from './exchange-suggestion-copy';

export const EXCHANGE_SUGGESTION_MIN_SCORE: Record<
  ExchangeSuggestionSurface,
  number
> = {
  detail: 55,
  profile_owner: 50,
  sidebar: 60,
  exchange_feed_insert: 60,
  mobile: 55,
};

export function isAllowedExchangeSuggestionSurface(
  surface: string,
): surface is ExchangeSuggestionSurface {
  return (
    surface === 'detail' ||
    surface === 'profile_owner' ||
    surface === 'sidebar' ||
    surface === 'exchange_feed_insert' ||
    surface === 'mobile'
  );
}

export function isForbiddenExchangeSuggestionSurface(surface: string): boolean {
  return (FORBIDDEN_EXCHANGE_SUGGESTION_SURFACES as readonly string[]).includes(
    surface,
  );
}

export function surfaceNeverRendersOnTiles(surface: string): boolean {
  return (
    surface === 'tile' ||
    surface === 'tile_browse' ||
    surface === 'discovery_feed' ||
    isForbiddenExchangeSuggestionSurface(surface)
  );
}

export function buildEmptySurfacePlan(
  surface: ExchangeSuggestionSurface,
): ExchangeSuggestionSurfacePlan {
  return {
    surface,
    titleKey: suggestionSurfaceTitleKey(surface),
    suggestions: [],
    outbound: [],
    inbound: [],
    showModule: false,
    capped: false,
    capReasons: [],
  };
}

export function finalizeSurfacePlan(
  surface: ExchangeSuggestionSurface,
  input: Omit<ExchangeSuggestionSurfacePlan, 'surface' | 'titleKey' | 'showModule'>,
): ExchangeSuggestionSurfacePlan {
  const hasItems =
    input.suggestions.length > 0 ||
    input.outbound.length > 0 ||
    input.inbound.length > 0;
  return {
    surface,
    titleKey: suggestionSurfaceTitleKey(surface),
    showModule: hasItems,
    ...input,
  };
}
