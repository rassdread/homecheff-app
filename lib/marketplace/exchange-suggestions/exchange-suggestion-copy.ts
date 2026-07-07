/**
 * Exchange suggestion i18n keys — Phase 4F.
 */

import type { ActiveExchangeSuggestionType } from './exchange-suggestion-contract';
import type { ExchangeSuggestionCta } from './exchange-suggestion-contract';

const ROOT = 'marketplace.exchangeSuggestions';

export function suggestionTypeLabelKey(
  type: ActiveExchangeSuggestionType,
): string {
  return `${ROOT}.types.${camelType(type)}`;
}

export function suggestionSurfaceTitleKey(
  surface:
    | 'detail'
    | 'profile_owner'
    | 'sidebar'
    | 'exchange_feed_insert'
    | 'mobile',
): string {
  return `${ROOT}.surfaces.${surface}.title`;
}

export function suggestionSummaryKey(
  type: ActiveExchangeSuggestionType,
): string {
  return `${ROOT}.summaries.${camelType(type)}`;
}

export function suggestionCtaLabelKey(cta: ExchangeSuggestionCta): string {
  const map: Record<ExchangeSuggestionCta, string> = {
    view_listing: 'viewListing',
    view_profile: 'viewProfile',
    start_conversation: 'startConversation',
    start_proposal: 'startProposal',
  };
  return `${ROOT}.ctas.${map[cta]}`;
}

export function profileTabLabelKey(tab: 'outbound' | 'inbound'): string {
  return `${ROOT}.profile.tabs.${tab}`;
}

function camelType(type: ActiveExchangeSuggestionType): string {
  switch (type) {
    case 'DIRECT_EXCHANGE':
      return 'direct';
    case 'REVERSE_EXCHANGE':
      return 'reverse';
    case 'MUTUAL_EXCHANGE':
      return 'mutual';
    case 'LOCAL_EXCHANGE':
      return 'local';
    case 'COMMUNITY_EXCHANGE':
      return 'community';
    default:
      return 'direct';
  }
}

export const EXCHANGE_SUGGESTION_I18N_KEYS = [
  `${ROOT}.surfaces.detail.title`,
  `${ROOT}.surfaces.profile_owner.title`,
  `${ROOT}.surfaces.sidebar.title`,
  `${ROOT}.surfaces.exchange_feed_insert.title`,
  `${ROOT}.surfaces.mobile.title`,
  `${ROOT}.feed.title`,
  `${ROOT}.feed.matchText`,
  `${ROOT}.feed.cta`,
  `${ROOT}.mobile.title`,
  `${ROOT}.mobile.matchText`,
  `${ROOT}.mobile.cta`,
  `${ROOT}.types.direct`,
  `${ROOT}.types.reverse`,
  `${ROOT}.types.mutual`,
  `${ROOT}.types.local`,
  `${ROOT}.types.community`,
  `${ROOT}.summaries.direct`,
  `${ROOT}.summaries.reverse`,
  `${ROOT}.summaries.mutual`,
  `${ROOT}.summaries.local`,
  `${ROOT}.summaries.community`,
  `${ROOT}.ctas.viewListing`,
  `${ROOT}.ctas.viewProfile`,
  `${ROOT}.ctas.startConversation`,
  `${ROOT}.ctas.startProposal`,
  `${ROOT}.profile.tabs.outbound`,
  `${ROOT}.profile.tabs.inbound`,
  `${ROOT}.empty`,
  `${ROOT}.dismiss`,
  `${ROOT}.modifier.local`,
] as const;
