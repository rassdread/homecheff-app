'use client';

import Link from 'next/link';
import UserStatsTile from '@/components/ui/UserStatsTile';
import InspirationCardMedia from '@/components/inspiratie/InspirationCardMedia';
import { useTranslation } from '@/hooks/useTranslation';
import type { InspirationItem } from './InspiratieContent';
import { formatItemPlaceDistanceLine } from '@/lib/geo/item-location';
import FavoriteButton from '@/components/favorite/FavoriteButton';
import ShareButton from '@/components/ui/ShareButton';
import { Eye } from 'lucide-react';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string;

export function inspirationContentLabel(
  item: InspirationItem,
  t: TranslateFn
): string {
  switch (item.category) {
    case 'CHEFF':
      return t('feed.inspirationCategoryCheff');
    case 'GROWN':
      return t('feed.inspirationCategoryGrown');
    case 'DESIGNER':
      return t('feed.inspirationCategoryDesigner');
    default:
      return t('feed.inspirationCategoryDefault');
  }
}

type InspirationCardProps = {
  item: InspirationItem;
  variant: 'grid' | 'list';
  session: any;
  detailHref: string;
  onCardClick: (item: InspirationItem) => void;
  translateSubcategory: (category: string, subcategory: string) => string;
  itemRef?: React.RefObject<HTMLDivElement | null>;
  isCardHovered?: boolean;
  onCardHoverChange?: (hovered: boolean) => void;
  priority?: boolean;
};

function snippet(text: string | null, maxLen = 160) {
  if (!text) return '';
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen).trim()}…`;
}

export default function InspirationCard({
  item,
  variant,
  session,
  detailHref,
  onCardClick,
  translateSubcategory,
  itemRef,
  isCardHovered,
  onCardHoverChange,
  priority = false,
}: InspirationCardProps) {
  const { t } = useTranslation();
  const categoryLabel = inspirationContentLabel(item, t);
  const desc = snippet(item.description);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${detailHref}`
      : detailHref;

  const titleBlock = (
    <div className="mb-2">
      <Link
        href={session?.user ? detailHref : '#'}
        onClick={(e) => {
          e.stopPropagation();
          if (!session?.user) {
            e.preventDefault();
            onCardClick(item);
          }
        }}
      >
        <h3 className="font-semibold text-stone-900 text-lg leading-snug line-clamp-2 hover:text-emerald-800 transition-colors">
          {item.title}
        </h3>
      </Link>
      {item.subcategory ? (
        <p className="mt-1 text-xs text-stone-500">
          {translateSubcategory(item.category, item.subcategory)}
        </p>
      ) : null}
    </div>
  );

  const metaPill = (
    <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
      {categoryLabel}
    </span>
  );

  const authorRow =
    item.user?.id ? (
      <div className="mt-2 min-h-[5.5rem]">
        <UserStatsTile
          userId={item.user.id}
          userName={item.user.name || null}
          userUsername={item.user.username || null}
          userAvatar={item.user.profileImage || null}
          displayFullName={item.user.displayFullName}
          displayNameOption={item.user.displayNameOption}
          className="!pt-3"
        />
        <UserBadgeChips badges={item.user.badges} max={2} size="sm" className="mt-1" />
      </div>
    ) : (
      <div className="mt-2 min-h-[5.5rem]" aria-hidden />
    );

  const cardShellClass =
    'group relative rounded-xl border border-emerald-200/80 bg-white overflow-hidden shadow-sm transition-shadow duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]';

  if (variant === 'list') {
    return (
      <div
        ref={itemRef as React.RefObject<HTMLDivElement>}
        className={`${cardShellClass} flex gap-4 p-4`}
        onMouseEnter={onCardHoverChange ? () => onCardHoverChange(true) : undefined}
        onMouseLeave={onCardHoverChange ? () => onCardHoverChange(false) : undefined}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('video') || target.tagName === 'VIDEO' || target.closest('[data-inspiration-card-media]')) return;
          if (target.closest('button') || target.closest('a')) return;
          onCardClick(item);
        }}
      >
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100">
          <InspirationCardMedia
            item={item}
            alt={item.title || 'Inspiratie'}
            isCardHovered={isCardHovered}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-1">{metaPill}</div>
          {titleBlock}
          {desc ? <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">{desc}</p> : null}
          {authorRow}
        </div>
      </div>
    );
  }

  // grid - zelfde tegelstructuur als de gemengde feed-cards.
  return (
    <div
      ref={itemRef as React.RefObject<HTMLDivElement>}
      className={`${cardShellClass} flex flex-col`}
      onMouseEnter={onCardHoverChange ? () => onCardHoverChange(true) : undefined}
      onMouseLeave={onCardHoverChange ? () => onCardHoverChange(false) : undefined}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('video') || target.tagName === 'VIDEO' || target.closest('.video-controls') || target.closest('[data-video-controls]')) return;
        if (target.closest('[data-inspiration-card-media]')) return;
        if (target.closest('button') || target.closest('a')) return;
        onCardClick(item);
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <InspirationCardMedia
          item={item}
          priority={priority}
          alt={item.title || 'Inspiratie'}
          isCardHovered={isCardHovered}
        />
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span className="inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-stone-700 shadow-sm">
            {categoryLabel}
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start gap-2">
          <Link
            href={session?.user ? detailHref : '#'}
            className="flex-1 min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              if (!session?.user) {
                e.preventDefault();
                onCardClick(item);
              }
            }}
          >
            <p className="font-semibold text-gray-900 line-clamp-2 leading-snug">
              {item.title ?? t('common.dish')}
            </p>
          </Link>
          <ShareButton
            url={shareUrl}
            title={item.title ?? t('common.dish')}
            description={item.description || ''}
            className="shrink-0 p-1 text-gray-400 hover:text-blue-600"
          />
        </div>
        <p className="text-2xl font-bold text-emerald-700 tabular-nums">
          {categoryLabel}
        </p>
        <p className="text-xs text-gray-600">
          {formatItemPlaceDistanceLine({
            place: item.location?.place,
            distanceKm: item.location?.distanceKm,
            unknownPlaceLabel: t('feed.unknownPlace'),
            unknownDistanceLabel: t('feed.unknownDistance'),
          })}
        </p>
        <p className="text-xs text-gray-500">&nbsp;</p>
        {authorRow}
        <div className="flex items-center justify-between text-xs mt-auto pt-1">
          <Link
            href={session?.user ? detailHref : '#'}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (!session?.user) {
                e.preventDefault();
                onCardClick(item);
              }
            }}
          >
            {t('feed.inspirationViewCta')}
          </Link>
          <div className="flex items-center gap-2">
            {item.viewCount !== undefined && (
              <div className="flex items-center gap-1 text-gray-500">
                <Eye className="w-3 h-3" aria-hidden />
                <span>{item.viewCount}</span>
              </div>
            )}
            <FavoriteButton
              dishId={item.id}
              productTitle={item.title ?? t('common.dish')}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
