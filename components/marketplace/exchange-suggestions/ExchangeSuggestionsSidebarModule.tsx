'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRightLeft } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ExchangeSuggestionSurfacePlan } from '@/lib/marketplace/exchange-suggestions';
import {
  readExchangeSuggestionCapState,
  recordExchangeSuggestionImpression,
  suggestionSummaryKey,
  suggestionTypeLabelKey,
} from '@/lib/marketplace/exchange-suggestions';
import { buildProductSlugPath } from '@/lib/seo/productSlug';

export type ExchangeSuggestionsSidebarModuleProps = {
  className?: string;
};

/**
 * Desktop sidebar compact exchange suggestions — read-only.
 */
export default function ExchangeSuggestionsSidebarModule({
  className = '',
}: ExchangeSuggestionsSidebarModuleProps) {
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
        surface: 'sidebar',
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
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!plan?.showModule || plan.suggestions.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/90 to-white p-4 shadow-sm ${className}`}
      data-surface="exchange_suggestions_sidebar"
      data-surface-module="exchange_suggestion"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
          <ArrowRightLeft className="h-4 w-4" aria-hidden />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{t(plan.titleKey)}</h3>
      </div>

      <div className="flex flex-col gap-2">
        {plan.suggestions.map((card) => {
          const href = `/product/${buildProductSlugPath(
            card.counterpartyTitle,
            null,
            card.counterpartyListingId,
          )}`;
          return (
            <Link
              key={card.id}
              href={href}
              className="block rounded-xl border border-teal-100 bg-white/80 px-3 py-2 hover:bg-white"
            >
              <p className="text-xs font-semibold text-teal-800">
                {t(suggestionTypeLabelKey(card.suggestionType))}
              </p>
              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                {card.counterpartyTitle}
              </p>
              <p className="text-xs text-gray-600 line-clamp-1">
                {t(suggestionSummaryKey(card.suggestionType), card.summaryParams)}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
