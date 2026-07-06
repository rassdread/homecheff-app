/**
 * Exchange suggestion resolver — Phase 4F.
 * Uses 4D matching only; no ranking, notifications, or multi-step chains.
 */

import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { ExchangeListingProfile } from '@/lib/marketplace/exchange/exchange-contract';
import {
  findExchangeMatchesForListing,
  resolveExchangeMatch,
  type ResolvedExchangeMatch,
} from '@/lib/marketplace/exchange';
import { exchangeMatchId } from '@/lib/marketplace/exchange/exchange-contract';
import type {
  ActiveExchangeSuggestionType,
  ExchangeSuggestionCapState,
  ExchangeSuggestionCard,
  ExchangeSuggestionCta,
  ExchangeSuggestionSurface,
} from './exchange-suggestion-contract';
import {
  EMPTY_EXCHANGE_SUGGESTION_CAP_STATE,
  suggestionPayloadIsClean,
} from './exchange-suggestion-contract';
import {
  applyExchangeSuggestionCaps,
  splitProfileTabs,
} from './exchange-suggestion-caps';
import {
  suggestionSummaryKey,
  suggestionTypeLabelKey,
} from './exchange-suggestion-copy';
import {
  buildEmptySurfacePlan,
  EXCHANGE_SUGGESTION_MIN_SCORE,
  finalizeSurfacePlan,
} from './exchange-suggestion-surface';

const LOCAL_DISTANCE_SCORE_MIN = 0.6;
const ALL_CTAS: ExchangeSuggestionCta[] = [
  'view_listing',
  'view_profile',
  'start_conversation',
];

export type ResolveExchangeSuggestionsInput = {
  surface: ExchangeSuggestionSurface;
  viewerUserId: string;
  viewerListingIds: string[];
  sourceListing?: ExchangeListingProfile | null;
  candidates: ExchangeListingProfile[];
  candidateMeta: Record<
    string,
    { title: string; username: string | null; userId: string }
  >;
  capState?: ExchangeSuggestionCapState;
  trustByUserId?: Record<string, DiscoveryTrustContract>;
  now?: number;
};

function classifySuggestionType(
  resolved: ResolvedExchangeMatch,
  viewerListingId: string,
  counterpartyListingId: string,
): {
  primary: ActiveExchangeSuggestionType;
  modifiers: ActiveExchangeSuggestionType[];
} {
  const { overlap, scoreSignals } = resolved;
  const modifiers: ActiveExchangeSuggestionType[] = [];

  if (scoreSignals.distanceScore >= LOCAL_DISTANCE_SCORE_MIN) {
    modifiers.push('LOCAL_EXCHANGE');
  }

  let primary: ActiveExchangeSuggestionType;

  if (overlap.mutualBarterReady) {
    primary = 'MUTUAL_EXCHANGE';
  } else {
    const viewerOffersMatch =
      overlap.offerMatchesDesired.some(
        (m) =>
          m.offerListingId === viewerListingId &&
          m.desiredListingId === counterpartyListingId,
      ) ||
      overlap.offerMatchesDesired.some(
        (m) =>
          m.offerListingId === counterpartyListingId &&
          m.desiredListingId === viewerListingId,
      );

    const directFromViewer = overlap.offerMatchesDesired.some(
      (m) =>
        m.offerListingId === viewerListingId &&
        m.desiredListingId === counterpartyListingId,
    );
    const reverseToViewer = overlap.offerMatchesDesired.some(
      (m) =>
        m.offerListingId === counterpartyListingId &&
        m.desiredListingId === viewerListingId,
    );

    if (directFromViewer) {
      primary = 'DIRECT_EXCHANGE';
    } else if (reverseToViewer) {
      primary = 'REVERSE_EXCHANGE';
    } else if (viewerOffersMatch) {
      primary = 'DIRECT_EXCHANGE';
    } else if (
      overlap.sharedMainCategories.length >= 2 ||
      scoreSignals.categoryOverlap >= 0.66
    ) {
      primary = 'COMMUNITY_EXCHANGE';
    } else if (overlap.sharedSubcategoryIds.length > 0) {
      primary = 'COMMUNITY_EXCHANGE';
    } else {
      primary = 'COMMUNITY_EXCHANGE';
    }
  }

  return {
    primary,
    modifiers: modifiers.filter((m) => m !== primary),
  };
}

function buildSuggestionCard(
  resolved: ResolvedExchangeMatch,
  viewerListing: ExchangeListingProfile,
  counterparty: ExchangeListingProfile,
  meta: { title: string; username: string | null; userId: string },
): ExchangeSuggestionCard {
  const { primary, modifiers } = classifySuggestionType(
    resolved,
    viewerListing.listingId,
    counterparty.listingId,
  );

  const distanceKm =
    counterparty.distanceKm ?? resolved.scoreSignals.distanceKm;

  const id = `${exchangeMatchId(viewerListing.listingId, counterparty.listingId)}:${primary}`;

  return {
    id,
    suggestionType: primary,
    modifierTypes: modifiers,
    primaryMatchType: resolved.match.type,
    score: resolved.match.score,
    typeLabelKey: suggestionTypeLabelKey(primary),
    summaryLabelKey: suggestionSummaryKey(primary),
    summaryParams: {
      title: meta.title,
      distance:
        distanceKm != null && Number.isFinite(distanceKm)
          ? String(Math.round(distanceKm))
          : '',
    },
    sourceListingId: viewerListing.listingId,
    targetListingId: counterparty.listingId,
    counterpartyListingId: counterparty.listingId,
    counterpartyTitle: meta.title,
    counterpartyUsername: meta.username,
    counterpartyUserId: meta.userId,
    distanceKm: distanceKm ?? null,
    allowedCtas: [...ALL_CTAS],
    signalKinds: resolved.signals.map((s) => s.kind),
  };
}

function collectMatches(
  input: ResolveExchangeSuggestionsInput,
): ExchangeSuggestionCard[] {
  const minScore = EXCHANGE_SUGGESTION_MIN_SCORE[input.surface];
  const trust = input.trustByUserId ?? {};
  const seen = new Set<string>();
  const cards: ExchangeSuggestionCard[] = [];

  const viewerListings = input.sourceListing
    ? [
        input.sourceListing,
        ...input.candidates.filter(
          (c) =>
            input.viewerListingIds.includes(c.listingId) &&
            c.listingId !== input.sourceListing!.listingId,
        ),
      ]
    : input.candidates.filter((c) => input.viewerListingIds.includes(c.listingId));

  const uniqueViewerListings = [
    ...new Map(viewerListings.map((l) => [l.listingId, l])).values(),
  ];

  const pool = input.candidates.filter(
    (c) => !input.viewerListingIds.includes(c.listingId),
  );

  if (input.sourceListing && input.surface === 'detail') {
    const detailMatches = findExchangeMatchesForListing(
      input.sourceListing,
      pool,
      {
        minScore,
        trustByUserId: trust,
        now: input.now,
        limit: 30,
      },
    );

    for (const resolved of detailMatches) {
      const counterpartyId =
        resolved.match.listingAId === input.sourceListing.listingId
          ? resolved.match.listingBId
          : resolved.match.listingAId;
      const counterparty = pool.find((p) => p.listingId === counterpartyId);
      if (!counterparty) continue;
      const meta = input.candidateMeta[counterpartyId];
      if (!meta) continue;

      const card = buildSuggestionCard(
        resolved,
        input.sourceListing,
        counterparty,
        meta,
      );
      if (seen.has(card.id)) continue;
      seen.add(card.id);
      if (!suggestionPayloadIsClean(card as unknown as Record<string, unknown>)) {
        continue;
      }
      cards.push(card);
    }

    return cards.sort((a, b) => b.score - a.score);
  }

  for (const viewerListing of uniqueViewerListings) {
    const matches = findExchangeMatchesForListing(viewerListing, pool, {
      minScore,
      trustByUserId: trust,
      now: input.now,
      limit: 20,
    });

    for (const resolved of matches) {
      const counterpartyId =
        resolved.match.listingAId === viewerListing.listingId
          ? resolved.match.listingBId
          : resolved.match.listingAId;
      const counterparty = pool.find((p) => p.listingId === counterpartyId);
      if (!counterparty) continue;
      const meta = input.candidateMeta[counterpartyId];
      if (!meta) continue;

      const card = buildSuggestionCard(
        resolved,
        viewerListing,
        counterparty,
        meta,
      );
      if (seen.has(card.id)) continue;
      seen.add(card.id);
      if (!suggestionPayloadIsClean(card as unknown as Record<string, unknown>)) {
        continue;
      }
      cards.push(card);
    }
  }

  return cards.sort((a, b) => b.score - a.score);
}

export function resolveExchangeSuggestions(
  input: ResolveExchangeSuggestionsInput,
): ExchangeSuggestionSurfacePlan {
  if (!input.viewerUserId) {
    return buildEmptySurfacePlan(input.surface);
  }

  const capState = input.capState ?? EMPTY_EXCHANGE_SUGGESTION_CAP_STATE;
  const raw = collectMatches(input);
  const capped = applyExchangeSuggestionCaps(raw, input.surface, capState);

  if (input.surface === 'profile_owner') {
    const viewerIds = new Set(input.viewerListingIds);
    const tabs = splitProfileTabs(capped.items, viewerIds);
    return finalizeSurfacePlan(input.surface, {
      suggestions: capped.items,
      outbound: tabs.outbound,
      inbound: tabs.inbound,
      capped: capped.capped,
      capReasons: capped.reasons,
    });
  }

  return finalizeSurfacePlan(input.surface, {
    suggestions: capped.items,
    outbound: [],
    inbound: [],
    capped: capped.capped,
    capReasons: capped.reasons,
  });
}

/** Verify a pair resolves without forbidden signals — for tests. */
export function previewExchangeSuggestionPair(
  a: ExchangeListingProfile,
  b: ExchangeListingProfile,
  trustByUserId?: Record<string, DiscoveryTrustContract>,
): ResolvedExchangeMatch | null {
  return resolveExchangeMatch({
    a,
    b,
    distanceKm: b.distanceKm,
    trustA: trustByUserId?.[a.userId],
    trustB: trustByUserId?.[b.userId],
  });
}
