'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ExchangeSuggestionSurfacePlan } from '@/lib/marketplace/exchange-suggestions';
import {
  readExchangeSuggestionCapState,
  recordExchangeSuggestionDismissed,
  recordExchangeSuggestionImpression,
} from '@/lib/marketplace/exchange-suggestions';
import ExchangeSuggestionCardView from './ExchangeSuggestionCard';

export type ExchangeSuggestionsDetailBlockProps = {
  listingId: string;
  barterEligible?: boolean;
  className?: string;
};

/**
 * Detail page exchange suggestions — after value exchange, before trust.
 * Read-only; no automated proposals.
 */
export default function ExchangeSuggestionsDetailBlock({
  listingId,
  barterEligible = true,
  className = '',
}: ExchangeSuggestionsDetailBlockProps) {
  const { status } = useSession();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<ExchangeSuggestionSurfacePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (status !== 'authenticated' || !barterEligible) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const capState = readExchangeSuggestionCapState();
      const params = new URLSearchParams({
        surface: 'detail',
        listingId,
        capState: JSON.stringify(capState),
      });
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
    } finally {
      setLoading(false);
    }
  }, [barterEligible, listingId, status]);

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

  if (loading || !plan?.showModule || plan.suggestions.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border border-teal-100 bg-white p-5 shadow-sm ${className}`}
      data-surface="exchange_suggestions_detail"
      aria-label={t(plan.titleKey)}
    >
      <h2 className="text-lg font-bold text-gray-900 mb-1">{t(plan.titleKey)}</h2>
      <p className="text-xs text-gray-500 mb-4">
        {t('marketplace.exchangeSuggestions.hint')}
      </p>
      <div className="flex flex-col gap-3">
        {plan.suggestions.map((card) => (
          <ExchangeSuggestionCardView
            key={card.id}
            card={card}
            t={t}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </section>
  );
}
