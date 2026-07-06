/**
 * Exchange suggestion caps — Phase 4F (4E rules).
 */

import type {
  ExchangeSuggestionCapState,
  ExchangeSuggestionCard,
  ExchangeSuggestionSidebarVariant,
  ExchangeSuggestionSurface,
} from './exchange-suggestion-contract';

export const EXCHANGE_SUGGESTION_CAPS = {
  perPageDetail: 3,
  perPageProfile: 5,
  perPageSidebar: 3,
  perPageSidebarMobile: 2,
  perPageMobile: 2,
  perPageFeedInsert: 1,
  perSessionFeedInserts: 3,
  feedInsertListingInterval: 20,
  perSessionImpressions: 8,
  perSellerPerDay: 3,
  perSellerPerPage: 1,
  dismissCooldownDays: 14,
  globalSnoozeDismissCount: 3,
  globalSnoozeHours: 24,
} as const;

export type CapApplyResult = {
  items: ExchangeSuggestionCard[];
  capped: boolean;
  reasons: string[];
};

function surfacePageLimit(
  surface: ExchangeSuggestionSurface,
  sidebarVariant?: ExchangeSuggestionSidebarVariant,
): number {
  switch (surface) {
    case 'detail':
      return EXCHANGE_SUGGESTION_CAPS.perPageDetail;
    case 'profile_owner':
      return EXCHANGE_SUGGESTION_CAPS.perPageProfile;
    case 'sidebar':
      return sidebarVariant === 'mobile'
        ? EXCHANGE_SUGGESTION_CAPS.perPageSidebarMobile
        : EXCHANGE_SUGGESTION_CAPS.perPageSidebar;
    case 'mobile':
      return EXCHANGE_SUGGESTION_CAPS.perPageMobile;
    case 'exchange_feed_insert':
      return EXCHANGE_SUGGESTION_CAPS.perPageFeedInsert;
    default:
      return EXCHANGE_SUGGESTION_CAPS.perPageDetail;
  }
}

export function applyExchangeSuggestionCaps(
  items: ExchangeSuggestionCard[],
  surface: ExchangeSuggestionSurface,
  capState: ExchangeSuggestionCapState,
  options?: {
    sidebarVariant?: ExchangeSuggestionSidebarVariant;
    feedBatch?: boolean;
  },
): CapApplyResult {
  const reasons: string[] = [];

  if (capState.globalSnoozeUntil) {
    const until = new Date(capState.globalSnoozeUntil).getTime();
    if (Number.isFinite(until) && until > Date.now()) {
      return { items: [], capped: true, reasons: ['global_snooze'] };
    }
  }

  const remainingFeedInserts =
    EXCHANGE_SUGGESTION_CAPS.perSessionFeedInserts -
    capState.feedInsertSessionCount;

  if (surface === 'exchange_feed_insert' && remainingFeedInserts <= 0) {
    return { items: [], capped: true, reasons: ['feed_session_cap'] };
  }

  const remainingSession =
    EXCHANGE_SUGGESTION_CAPS.perSessionImpressions -
    capState.sessionImpressionCount;
  if (remainingSession <= 0) {
    return { items: [], capped: true, reasons: ['session_cap'] };
  }

  const feedPageLimit =
    surface === 'exchange_feed_insert'
      ? options?.feedBatch
        ? remainingFeedInserts
        : EXCHANGE_SUGGESTION_CAPS.perPageFeedInsert
      : surfacePageLimit(surface, options?.sidebarVariant);

  const pageLimit = Math.min(feedPageLimit, remainingSession);
  const sellerCounts: Record<string, number> = {
    ...capState.sellerImpressionsToday,
  };
  const dismissed = new Set(capState.dismissedSuggestionIds);
  const out: ExchangeSuggestionCard[] = [];
  const sellersOnPage: Record<string, number> = {};

  for (const card of items) {
    if (out.length >= pageLimit) {
      reasons.push('page_cap');
      break;
    }
    if (dismissed.has(card.id)) {
      continue;
    }
    const sellerKey = card.counterpartyUserId;
    const dayCount = sellerCounts[sellerKey] ?? 0;
    if (dayCount >= EXCHANGE_SUGGESTION_CAPS.perSellerPerDay) {
      continue;
    }
    const pageSellerCount = sellersOnPage[sellerKey] ?? 0;
    if (pageSellerCount >= EXCHANGE_SUGGESTION_CAPS.perSellerPerPage) {
      continue;
    }
    out.push(card);
    sellersOnPage[sellerKey] = pageSellerCount + 1;
    sellerCounts[sellerKey] = dayCount + 1;
  }

  if (out.length < items.length && !reasons.includes('page_cap')) {
    reasons.push('seller_or_dismiss_cap');
  }

  return {
    items: out,
    capped: out.length < items.length || reasons.length > 0,
    reasons,
  };
}

export function splitProfileTabs(
  cards: ExchangeSuggestionCard[],
  viewerListingIds: Set<string>,
): { outbound: ExchangeSuggestionCard[]; inbound: ExchangeSuggestionCard[] } {
  const outbound: ExchangeSuggestionCard[] = [];
  const inbound: ExchangeSuggestionCard[] = [];

  for (const card of cards) {
    const viewerIsSource = viewerListingIds.has(card.sourceListingId);
    if (
      card.suggestionType === 'DIRECT_EXCHANGE' ||
      (viewerIsSource && card.suggestionType === 'MUTUAL_EXCHANGE')
    ) {
      outbound.push(card);
    } else {
      inbound.push(card);
    }
  }

  const limit = EXCHANGE_SUGGESTION_CAPS.perPageProfile;
  return {
    outbound: outbound.slice(0, limit),
    inbound: inbound.slice(0, limit),
  };
}
