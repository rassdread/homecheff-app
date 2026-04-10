'use client';

import Link from 'next/link';
import UserStatsTile from '@/components/ui/UserStatsTile';
import { useCreateFlow } from '@/components/create/CreateFlowContext';
import InspirationCardMedia from '@/components/inspiratie/InspirationCardMedia';
import type { InspirationItem } from './InspiratieContent';

export function inspirationContentLabel(item: InspirationItem): string {
  switch (item.category) {
    case 'CHEFF':
      return 'Recept';
    case 'GROWN':
      return 'Tuin';
    case 'DESIGNER':
      return 'Design';
    default:
      return 'Inspiratie';
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
  const { openCreateFlow } = useCreateFlow();
  const categoryLabel = inspirationContentLabel(item);
  const desc = snippet(item.description);

  const ctaBlock = (
    <div
      className="mt-4 rounded-xl border border-stone-200 bg-stone-50/90 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm font-medium text-stone-800 mb-3">Wil je dit ook maken?</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={session?.user ? detailHref : '#'}
          onClick={(e) => {
            e.stopPropagation();
            if (!session?.user) {
              e.preventDefault();
              onCardClick(item);
            }
          }}
          className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
        >
          Bekijk
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openCreateFlow();
          }}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Start met verkopen
        </button>
      </div>
    </div>
  );

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
      <div className="mt-3 pt-3 border-t border-stone-100">
        <UserStatsTile
          userId={item.user.id}
          userName={item.user.name || null}
          userUsername={item.user.username || null}
          userAvatar={item.user.profileImage || null}
          displayFullName={item.user.displayFullName}
          displayNameOption={item.user.displayNameOption}
        />
      </div>
    ) : null;

  const cardShellClass =
    'rounded-2xl border border-stone-200/90 bg-white overflow-hidden transition-shadow duration-200 cursor-pointer hover:shadow-md active:scale-[0.99]';

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
            objectFit={item.category === 'GROWN' ? 'contain' : 'cover'}
            alt={item.title || 'Inspiratie'}
            isCardHovered={isCardHovered}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-1">{metaPill}</div>
          {titleBlock}
          {desc ? <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">{desc}</p> : null}
          {authorRow}
          {ctaBlock}
        </div>
      </div>
    );
  }

  // grid
  return (
    <div
      ref={itemRef as React.RefObject<HTMLDivElement>}
      className={cardShellClass}
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
          objectFit={item.category === 'GROWN' ? 'contain' : 'cover'}
          alt={item.title || 'Inspiratie'}
          isCardHovered={isCardHovered}
        />
        <div className="absolute top-3 left-3 z-10 pointer-events-none">{metaPill}</div>
      </div>
      <div className="p-4 sm:p-5">
        {titleBlock}
        {desc ? <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed mb-1">{desc}</p> : null}
        {authorRow}
        {ctaBlock}
      </div>
    </div>
  );
}
