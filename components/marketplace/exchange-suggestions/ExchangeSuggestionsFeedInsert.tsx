'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { ExchangeSuggestionCard } from '@/lib/marketplace/exchange-suggestions';
import {
  mainCategoryEmoji,
  recordExchangeSuggestionFeedInsert,
  suggestionSummaryKey,
  trackExchangeSuggestionCtaClick,
  trackExchangeSuggestionImpression,
  trackExchangeSuggestionOpen,
} from '@/lib/marketplace/exchange-suggestions';
import { buildProductSlugPath } from '@/lib/seo/productSlug';

export type ExchangeSuggestionsFeedInsertProps = {
  card: ExchangeSuggestionCard;
  position: number;
  t: (key: string, params?: Record<string, string>) => string;
  className?: string;
};

/**
 * Compact exchange suggestion feed insert — one card per slot.
 */
export default function ExchangeSuggestionsFeedInsert({
  card,
  position,
  t,
  className = '',
}: ExchangeSuggestionsFeedInsertProps) {
  const tracked = useRef(false);
  const listingHref = `/product/${buildProductSlugPath(card.counterpartyTitle, null, card.counterpartyListingId)}`;

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    recordExchangeSuggestionFeedInsert(1);
    trackExchangeSuggestionImpression({
      surface: 'exchange_feed_insert',
      listingId: card.sourceListingId,
      suggestedListingId: card.counterpartyListingId,
      category: card.mainCategory,
      position,
    });
  }, [card, position]);

  const handleOpen = () => {
    trackExchangeSuggestionOpen({
      surface: 'exchange_feed_insert',
      listingId: card.sourceListingId,
      suggestedListingId: card.counterpartyListingId,
      category: card.mainCategory,
      position,
    });
  };

  const handleCta = () => {
    trackExchangeSuggestionCtaClick({
      surface: 'exchange_feed_insert',
      listingId: card.sourceListingId,
      suggestedListingId: card.counterpartyListingId,
      category: card.mainCategory,
      position,
      cta: 'view_exchange',
    });
  };

  return (
    <article
      className={`rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/90 to-white p-4 shadow-sm ${className}`}
      data-surface="exchange_feed_insert"
      data-surface-module="exchange_suggestion"
      data-exchange-suggestion={card.id}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-xl"
          aria-hidden
        >
          {mainCategoryEmoji(card.mainCategory)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            {t('marketplace.exchangeSuggestions.feed.title')}
          </p>
          <p className="mt-1 text-sm font-bold text-gray-900 line-clamp-1">
            {card.counterpartyTitle}
          </p>
          <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
            {t(suggestionSummaryKey(card.suggestionType), card.summaryParams)}
          </p>
          <Link
            href={listingHref}
            onClick={() => {
              handleOpen();
              handleCta();
            }}
            className="mt-3 inline-flex min-h-9 items-center rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800"
          >
            {t('marketplace.exchangeSuggestions.feed.cta')}
          </Link>
        </div>
      </div>
    </article>
  );
}
