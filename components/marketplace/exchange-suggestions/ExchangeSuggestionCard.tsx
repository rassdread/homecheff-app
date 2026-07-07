'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, X } from 'lucide-react';
import StartChatButton from '@/components/chat/StartChatButton';
import type { ExchangeSuggestionCard } from '@/lib/marketplace/exchange-suggestions';
import {
  mainCategoryEmoji,
  pickDisplaySignalLabelKeys,
  suggestionCtaLabelKey,
  suggestionSummaryKey,
  suggestionTypeLabelKey,
  trackExchangeSuggestionCtaClick,
  trackExchangeSuggestionImpression,
} from '@/lib/marketplace/exchange-suggestions';
import { proposalPrefillFromSuggestionCard } from '@/lib/proposals/proposal-prefill';
import { buildListingDetailHref } from '@/lib/seo/listing-routes';

export type ExchangeSuggestionCardProps = {
  card: ExchangeSuggestionCard;
  t: (key: string, params?: Record<string, string>) => string;
  onDismiss?: (id: string) => void;
  compact?: boolean;
  surface?: string;
  position?: number;
  listingId?: string;
};

export default function ExchangeSuggestionCardView({
  card,
  t,
  onDismiss,
  compact = false,
  surface = 'detail',
  position = 0,
  listingId,
}: ExchangeSuggestionCardProps) {
  const tracked = useRef(false);
  const listingHref = buildListingDetailHref({
    listingKind: card.counterpartyListingKind,
    listingIntent: card.counterpartyListingIntent,
    title: card.counterpartyTitle,
    place: null,
    id: card.counterpartyListingId,
  });
  const profileHref = card.counterpartyUsername
    ? `/user/${card.counterpartyUsername}`
    : listingHref;

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackExchangeSuggestionImpression({
      surface,
      listingId: listingId ?? card.sourceListingId,
      suggestedListingId: card.counterpartyListingId,
      category: card.mainCategory,
      position,
    });
  }, [card, listingId, position, surface]);

  const trackCta = (cta: string) => {
    trackExchangeSuggestionCtaClick({
      surface,
      listingId: listingId ?? card.sourceListingId,
      suggestedListingId: card.counterpartyListingId,
      category: card.mainCategory,
      position,
      cta,
    });
  };

  const signalLabelKeys = pickDisplaySignalLabelKeys(card.signalKinds, 2);

  return (
    <article
      className={`relative rounded-xl border border-teal-100 bg-teal-50/40 ${
        compact ? 'p-3' : 'p-4'
      }`}
      data-exchange-suggestion={card.id}
      data-suggestion-type={card.suggestionType}
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={() => onDismiss(card.id)}
          className="absolute right-2 top-2 rounded-full p-1 text-gray-400 hover:bg-white/80 hover:text-gray-600"
          aria-label={t('marketplace.exchangeSuggestions.dismiss')}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className={`flex gap-3 ${onDismiss ? 'pr-8' : ''}`}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-xl"
          aria-hidden
        >
          {mainCategoryEmoji(card.mainCategory)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              {t(suggestionTypeLabelKey(card.suggestionType))}
            </span>
            {card.modifierTypes.includes('LOCAL_EXCHANGE') &&
            card.distanceKm != null ? (
              <span className="inline-flex items-center gap-0.5 text-xs text-gray-600">
                <MapPin className="h-3 w-3" aria-hidden />
                {t('marketplace.exchangeSuggestions.modifier.local', {
                  distance: String(Math.round(card.distanceKm)),
                })}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
            {card.counterpartyTitle}
          </p>
          <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
            {t(suggestionSummaryKey(card.suggestionType), card.summaryParams)}
          </p>
          {signalLabelKeys.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t('marketplace.exchangeSuggestions.matchReasons')}>
              {signalLabelKeys.map((key) => (
                <li
                  key={key}
                  className="inline-flex rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-teal-900 ring-1 ring-teal-200/80"
                >
                  {t(key)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {card.allowedCtas.includes('view_listing') ? (
              <Link
                href={listingHref}
                onClick={() => trackCta('view_listing')}
                className="inline-flex min-h-8 items-center rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800"
              >
                {t(suggestionCtaLabelKey('view_listing'))}
              </Link>
            ) : null}
            {card.allowedCtas.includes('view_profile') && card.counterpartyUsername ? (
              <Link
                href={profileHref}
                onClick={() => trackCta('view_profile')}
                className="inline-flex min-h-8 items-center rounded-lg border border-teal-200 bg-white px-3 text-xs font-semibold text-teal-800 hover:bg-teal-50"
              >
                {t(suggestionCtaLabelKey('view_profile'))}
              </Link>
            ) : null}
            {card.allowedCtas.includes('start_proposal') ? (
              <StartChatButton
                productId={card.counterpartyListingId}
                sellerId={card.counterpartyUserId}
                sellerName={card.counterpartyTitle}
                skipModal
                openProposalAfterStart
                label={t(suggestionCtaLabelKey('start_proposal'))}
                funnelListing={{
                  listingId: card.sourceListingId,
                }}
                funnelSurface="suggestion"
                funnelEntrypoint="exchange_suggestion_start_proposal"
                proposalPrefill={{
                  source: 'exchange_suggestion',
                  exchangeSuggestion: proposalPrefillFromSuggestionCard(card),
                }}
                onConversationStarted={() => trackCta('start_proposal')}
                className="inline-flex min-h-8 !w-auto items-center rounded-lg bg-indigo-700 px-3 !py-0 text-xs font-semibold text-white shadow-none hover:bg-indigo-800 !from-indigo-700 !to-indigo-700 hover:!from-indigo-800 hover:!to-indigo-800"
              />
            ) : null}
            {card.allowedCtas.includes('start_conversation') ? (
              <StartChatButton
                productId={card.counterpartyListingId}
                sellerId={card.counterpartyUserId}
                sellerName={card.counterpartyTitle}
                skipModal
                label={t(suggestionCtaLabelKey('start_conversation'))}
                onConversationStarted={() => trackCta('start_conversation')}
                className="inline-flex min-h-8 !w-auto items-center rounded-lg border border-gray-200 bg-white px-3 !py-0 text-xs font-semibold text-gray-700 shadow-none hover:bg-gray-50 !from-white !to-white hover:!from-gray-50 hover:!to-gray-50"
              />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
