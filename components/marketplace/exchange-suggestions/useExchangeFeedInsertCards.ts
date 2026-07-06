'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { ExchangeSuggestionCard } from '@/lib/marketplace/exchange-suggestions';
import {
  EXCHANGE_SUGGESTION_CAPS,
  readExchangeSuggestionCapState,
  recordExchangeSuggestionImpression,
} from '@/lib/marketplace/exchange-suggestions';

/**
 * Fetch exchange suggestion cards for feed interleaving (batch).
 */
export function useExchangeFeedInsertCards(): ExchangeSuggestionCard[] {
  const { status } = useSession();
  const [cards, setCards] = useState<ExchangeSuggestionCard[]>([]);

  const load = useCallback(async () => {
    if (status !== 'authenticated') {
      setCards([]);
      return;
    }
    const capState = readExchangeSuggestionCapState();
    const remaining =
      EXCHANGE_SUGGESTION_CAPS.perSessionFeedInserts -
      capState.feedInsertSessionCount;
    if (remaining <= 0) {
      setCards([]);
      return;
    }
    try {
      const params = new URLSearchParams({
        surface: 'exchange_feed_insert',
        feedBatch: '1',
        capState: JSON.stringify(capState),
      });
      const res = await fetch(`/api/marketplace/exchange-suggestions?${params}`);
      if (!res.ok) {
        setCards([]);
        return;
      }
      const data = (await res.json()) as { plan: { suggestions: ExchangeSuggestionCard[] } };
      const suggestions = data.plan.suggestions ?? [];
      setCards(suggestions);
      for (const card of suggestions) {
        recordExchangeSuggestionImpression(card.counterpartyUserId);
      }
    } catch {
      setCards([]);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return cards;
}
