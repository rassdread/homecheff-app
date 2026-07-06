'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ExchangeSuggestionSurfacePlan } from '@/lib/marketplace/exchange-suggestions';
import {
  EXCHANGE_SUGGESTION_CAPS,
  mainCategoryEmoji,
  readExchangeSuggestionCapState,
  recordExchangeSuggestionImpression,
  suggestionSummaryKey,
  trackExchangeSuggestionCtaClick,
  trackExchangeSuggestionImpression,
  trackExchangeSuggestionOpen,
} from '@/lib/marketplace/exchange-suggestions';
import { buildProductSlugPath } from '@/lib/seo/productSlug';

export type ExchangeSuggestionsMobileContext = 'profile' | 'detail' | 'discovery';

export type ExchangeSuggestionsMobileModuleProps = {
  context: ExchangeSuggestionsMobileContext;
  listingId?: string;
  className?: string;
};

/**
 * Compact mobile exchange suggestions — max 2 visible.
 */
export default function ExchangeSuggestionsMobileModule({
  context,
  listingId,
  className = '',
}: ExchangeSuggestionsMobileModuleProps) {
  const { status } = useSession();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<ExchangeSuggestionSurfacePlan | null>(null);
  const trackedIds = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (status !== 'authenticated') {
      setPlan(null);
      return;
    }
    try {
      const capState = readExchangeSuggestionCapState();
      const params = new URLSearchParams({
        surface: 'mobile',
        capState: JSON.stringify(capState),
      });
      if (context === 'detail' && listingId) {
        params.set('listingId', listingId);
      }
      const res = await fetch(`/api/marketplace/exchange-suggestions?${params}`);
      if (!res.ok) {
        setPlan(null);
        return;
      }
      const data = (await res.json()) as { plan: ExchangeSuggestionSurfacePlan };
      setPlan(data.plan);
      for (const card of data.plan.suggestions) {
        recordExchangeSuggestionImpression(card.counterpartyUserId);
      }
    } catch {
      setPlan(null);
    }
  }, [context, listingId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const suggestions = (plan?.suggestions ?? []).slice(
    0,
    EXCHANGE_SUGGESTION_CAPS.perPageMobile,
  );

  useEffect(() => {
    for (const [index, card] of suggestions.entries()) {
      if (trackedIds.current.has(card.id)) continue;
      trackedIds.current.add(card.id);
      trackExchangeSuggestionImpression({
        surface: 'mobile',
        listingId: listingId ?? card.sourceListingId,
        suggestedListingId: card.counterpartyListingId,
        category: card.mainCategory,
        position: index,
      });
    }
  }, [listingId, suggestions]);

  if (!plan?.showModule || suggestions.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border border-teal-100 bg-white p-4 shadow-sm ${className}`}
      data-surface="exchange_suggestions_mobile"
      data-surface-module="exchange_suggestion"
      data-mobile-context={context}
    >
      <h3 className="text-sm font-bold text-gray-900 mb-3">
        {t('marketplace.exchangeSuggestions.mobile.title')}
      </h3>
      <div className="flex flex-col gap-2">
        {suggestions.map((card, index) => {
          const href = `/product/${buildProductSlugPath(
            card.counterpartyTitle,
            null,
            card.counterpartyListingId,
          )}`;
          return (
            <Link
              key={card.id}
              href={href}
              onClick={() => {
                trackExchangeSuggestionOpen({
                  surface: 'mobile',
                  listingId: listingId ?? card.sourceListingId,
                  suggestedListingId: card.counterpartyListingId,
                  category: card.mainCategory,
                  position: index,
                });
                trackExchangeSuggestionCtaClick({
                  surface: 'mobile',
                  listingId: listingId ?? card.sourceListingId,
                  suggestedListingId: card.counterpartyListingId,
                  category: card.mainCategory,
                  position: index,
                  cta: 'view_exchange',
                });
              }}
              className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/40 px-3 py-2.5 hover:bg-teal-50"
              data-exchange-suggestion={card.id}
            >
              <span className="text-xl leading-none" aria-hidden>
                {mainCategoryEmoji(card.mainCategory)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900 line-clamp-1">
                  {card.counterpartyTitle}
                </span>
                <span className="block text-xs text-gray-600 line-clamp-2">
                  {t(suggestionSummaryKey(card.suggestionType), card.summaryParams)}
                </span>
                <span className="mt-1 inline-block text-xs font-semibold text-teal-800">
                  {t('marketplace.exchangeSuggestions.mobile.cta')}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
