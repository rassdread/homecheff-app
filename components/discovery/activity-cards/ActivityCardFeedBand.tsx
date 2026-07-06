'use client';

import { useCallback, useMemo } from 'react';
import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import {
  filterCardsForSession,
  readActivityCardSessionState,
  recordActivityCardDismissed,
  recordActivityCardShown,
} from '@/lib/discovery/activity-cards/activity-card-client-storage';
import ActivityCard from './ActivityCard';

export type ActivityCardFeedBandProps = {
  cards: ActivityCardFeedItem[];
  maxVisible?: number;
  maxSession?: number;
  t: (key: string) => string;
  surface?: string;
  className?: string;
};

export default function ActivityCardFeedBand({
  cards,
  maxVisible = 1,
  maxSession = 2,
  t,
  surface = 'home_feed',
  className = '',
}: ActivityCardFeedBandProps) {
  const visibleCards = useMemo(
    () => filterCardsForSession(cards, maxSession, maxVisible),
    [cards, maxSession, maxVisible],
  );

  const handleDismiss = useCallback((card: ActivityCardFeedItem) => {
    if (card.type) recordActivityCardDismissed(card.type as import('@/lib/discovery/activity-cards/activity-card-contract').ActivityCardType);
  }, []);

  const handleShown = useCallback((card: ActivityCardFeedItem) => {
    if (card.type) recordActivityCardShown(card.type as import('@/lib/discovery/activity-cards/activity-card-contract').ActivityCardType);
  }, []);

  if (visibleCards.length === 0) return null;

  const card = visibleCards[0]!;

  return (
    <div className={`col-span-full ${className}`}>
      <ActivityCard
        card={card}
        t={t}
        surface={surface}
        onDismiss={handleDismiss}
        onAction={() => {
          handleShown(card);
        }}
      />
    </div>
  );
}
