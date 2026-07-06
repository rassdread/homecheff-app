'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ExchangeSuggestionSurfacePlan } from '@/lib/marketplace/exchange-suggestions';
import {
  profileTabLabelKey,
  readExchangeSuggestionCapState,
  recordExchangeSuggestionDismissed,
  recordExchangeSuggestionImpression,
} from '@/lib/marketplace/exchange-suggestions';
import ExchangeSuggestionCardView from './ExchangeSuggestionCard';

export type ExchangeSuggestionsProfileModuleProps = {
  className?: string;
};

type TabId = 'outbound' | 'inbound';

/**
 * Profile owner module — Ruilkansen voor jou.
 */
export default function ExchangeSuggestionsProfileModule({
  className = '',
}: ExchangeSuggestionsProfileModuleProps) {
  const { status } = useSession();
  const { t } = useTranslation();
  const [plan, setPlan] = useState<ExchangeSuggestionSurfacePlan | null>(null);
  const [tab, setTab] = useState<TabId>('outbound');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (status !== 'authenticated') {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const capState = readExchangeSuggestionCapState();
      const params = new URLSearchParams({
        surface: 'profile_owner',
        capState: JSON.stringify(capState),
      });
      const res = await fetch(`/api/marketplace/exchange-suggestions?${params}`);
      if (!res.ok) {
        setPlan(null);
        return;
      }
      const data = (await res.json()) as { plan: ExchangeSuggestionSurfacePlan };
      setPlan(data.plan);
      const shown = [...data.plan.outbound, ...data.plan.inbound];
      for (const card of shown) {
        recordExchangeSuggestionImpression(card.counterpartyUserId);
      }
      if (data.plan.outbound.length === 0 && data.plan.inbound.length > 0) {
        setTab('inbound');
      }
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDismiss = (id: string) => {
    recordExchangeSuggestionDismissed(id);
    setPlan((prev) => {
      if (!prev) return prev;
      const outbound = prev.outbound.filter((s) => s.id !== id);
      const inbound = prev.inbound.filter((s) => s.id !== id);
      return {
        ...prev,
        outbound,
        inbound,
        suggestions: [...outbound, ...inbound],
        showModule: outbound.length + inbound.length > 0,
      };
    });
  };

  if (loading || !plan?.showModule) {
    return null;
  }

  const items = tab === 'outbound' ? plan.outbound : plan.inbound;

  return (
    <section
      className={`rounded-2xl border border-teal-100 bg-white p-4 shadow-sm ${className}`}
      data-surface="exchange_suggestions_profile"
      data-profile-section="exchange_suggestions"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{t(plan.titleKey)}</h3>

      <div className="flex gap-2 mb-4">
        {(['outbound', 'inbound'] as const).map((tabId) => {
          const count =
            tabId === 'outbound' ? plan.outbound.length : plan.inbound.length;
          if (count === 0) return null;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setTab(tabId)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                tab === tabId
                  ? 'bg-teal-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(profileTabLabelKey(tabId))}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{t('marketplace.exchangeSuggestions.empty')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((card, index) => (
            <ExchangeSuggestionCardView
              key={card.id}
              card={card}
              t={t}
              onDismiss={handleDismiss}
              compact
              surface="profile_owner"
              position={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
