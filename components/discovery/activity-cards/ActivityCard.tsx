'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  GraduationCap,
  HandHeart,
  Images,
  PackagePlus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UserCircle,
  UserPlus,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import { trackActivityCardEvent } from '@/lib/discovery/activity-cards/activity-card-analytics';

const ICON_MAP: Record<string, LucideIcon> = {
  UserCircle,
  Star,
  QrCode,
  HandHeart,
  PackagePlus,
  Sparkles,
  Images,
  ShieldCheck,
  GraduationCap,
  Truck,
  UserPlus,
};

export type ActivityCardProps = {
  card: ActivityCardFeedItem;
  t: (key: string) => string;
  onDismiss?: (card: ActivityCardFeedItem) => void;
  onAction?: (card: ActivityCardFeedItem) => void;
  surface?: string;
  className?: string;
};

export default function ActivityCard({
  card,
  t,
  onDismiss,
  onAction,
  surface = 'home_feed',
  className = '',
}: ActivityCardProps) {
  const Icon = ICON_MAP[card.icon ?? ''] ?? Sparkles;
  const title = t(card.titleKey);
  const description = t(card.descriptionKey);
  const actionLabel = t(card.ctaKey);

  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    trackActivityCardEvent('ACTIVITY_CARD_SHOWN', {
      cardId: card.id,
      cardType: card.type ?? card.id,
      surface,
    });
  }, [card.id, card.type, surface]);

  const handleAction = () => {
    trackActivityCardEvent('ACTIVITY_CARD_CLICKED', {
      cardId: card.id,
      cardType: card.type ?? card.id,
      surface,
    });
    onAction?.(card);
  };

  const handleDismiss = () => {
    trackActivityCardEvent('ACTIVITY_CARD_DISMISSED', {
      cardId: card.id,
      cardType: card.type ?? card.id,
      surface,
    });
    onDismiss?.(card);
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm ${className}`}
      data-activity-card
      data-activity-card-type={card.type ?? card.id}
    >
      {card.dismissible !== false ? (
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 hover:bg-white/80 hover:text-gray-600"
          aria-label={t('buttons.close')}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      <div className="flex gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/80">
            {t('activityCards.band.label')}
          </p>
          <h3 className="mt-0.5 text-base font-bold leading-snug text-gray-900">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 line-clamp-3">
            {description}
          </p>
          {card.ctaHref ? (
            <Link
              href={card.ctaHref}
              onClick={handleAction}
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAction}
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
