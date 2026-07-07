'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ExchangeSuggestionSurfacePlan } from '@/lib/marketplace/exchange-suggestions';
import {
  EXCHANGE_SUGGESTION_CAPS,
  readExchangeSuggestionCapState,
  recordExchangeSuggestionDismissed,
  recordExchangeSuggestionImpression,
} from '@/lib/marketplace/exchange-suggestions';
import ExchangeSuggestionCardView from './ExchangeSuggestionCard';

export type ExchangeSuggestionsMobileContext = 'profile' | 'detail' | 'discovery';

export type ExchangeSuggestionsMobileModuleProps = {
  context: ExchangeSuggestionsMobileContext;
  listingId?: string;
  className?: string;
};

/**
 * Compact mobile exchange suggestions — max 2 visible, full CTA parity with desktop.
 */
export default function ExchangeSuggestionsMobileModule({
  context,
  listingId,
  className = '',
}: ExchangeSuggestionsMobileModuleProps) {
  const { status } = useSession();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<ExchangeSuggestionSurfacePlan | null>(null);

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

  const handleDismiss = (id: string) => {
    recordExchangeSuggestionDismissed(id);
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            suggestions: prev.suggestions.filter((s) => s.id !== id),
            showModule: prev.suggestions.filter((s) => s.id !== id).length > 0,
          }
        : prev,
    );
  };

  const suggestions = (plan?.suggestions ?? []).slice(
    0,
    EXCHANGE_SUGGESTION_CAPS.perPageMobile,
  );

  if (!plan?.showModule || suggestions.length === 0) {
    return null;
  }

  const titleKey =
    context === 'detail'
      ? 'marketplace.exchangeSuggestions.surfaces.detail.title'
      : plan.titleKey;

  return (
    <section
      className={`rounded-2xl border border-teal-100 bg-white p-4 shadow-sm ${className}`}
      data-surface="exchange_suggestions_mobile"
      data-surface-module="exchange_suggestion"
      data-mobile-context={context}
      aria-label={t(titleKey)}
    >
      <h3 className="text-sm font-bold text-gray-900 mb-1">{t(titleKey)}</h3>
      <p className="text-xs text-gray-500 mb-3">
        {t('marketplace.exchangeSuggestions.hint')}
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map((card, index) => (
          <ExchangeSuggestionCardView
            key={card.id}
            card={card}
            t={t}
            compact
            onDismiss={handleDismiss}
            surface="mobile"
            listingId={listingId ?? card.sourceListingId}
            position={index}
          />
        ))}
      </div>
    </section>
  );
}
