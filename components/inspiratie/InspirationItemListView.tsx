'use client';

import Link from 'next/link';
import UserStatsTile from '@/components/ui/UserStatsTile';
import InspirationCardMedia from '@/components/inspiratie/InspirationCardMedia';
import type { InspirationItem } from './InspiratieContent';

type InspirationItemListViewProps = {
  item: InspirationItem;
  itemRef: React.RefObject<HTMLDivElement | null>;
  session: any;
  handleItemClick: (item: InspirationItem) => void;
  photo: { id: string; url: string; isMain: boolean } | undefined;
  primaryVideo: { id: string; url: string; thumbnail?: string | null } | undefined;
  categoryInfo: { id: string; label: string; icon: any; color: string } | undefined;
  translateSubcategory: (category: string, subcategory: string) => string;
  getItemDetailUrl: (item: InspirationItem) => string;
  localPropsCount: number;
  setLocalPropsCount: (n: number) => void;
  handlePropsClick: () => void;
  isHighlighted: boolean;
  isCardHovered?: boolean;
  onCardHoverChange?: (hovered: boolean) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  propsButtonSlot: React.ReactNode;
};

export default function InspirationItemListView({
  item,
  itemRef,
  session,
  handleItemClick,
  photo,
  primaryVideo,
  categoryInfo,
  translateSubcategory,
  getItemDetailUrl,
  localPropsCount,
  isHighlighted,
  isCardHovered,
  onCardHoverChange,
  t,
  propsButtonSlot,
}: InspirationItemListViewProps) {
  const CategoryIcon = categoryInfo?.icon || (() => null);

  return (
      <div
        ref={itemRef as React.RefObject<HTMLDivElement>}
        className={`group flex gap-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden p-4 cursor-pointer active:scale-[0.98] ${
        isHighlighted ? 'ring-4 ring-emerald-400 shadow-2xl shadow-emerald-200/50 scale-[1.01]' : ''
      }`}
      onMouseEnter={onCardHoverChange ? () => onCardHoverChange(true) : undefined}
      onMouseLeave={onCardHoverChange ? () => onCardHoverChange(false) : undefined}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('video') || target.tagName === 'VIDEO' || target.closest('[data-inspiration-card-media]')) return;
        if (target.closest('button')) return;
        handleItemClick(item);
      }}
    >
      <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <InspirationCardMedia
          item={item}
          objectFit={item.category === 'GROWN' ? 'contain' : 'cover'}
          alt={item.title || 'Inspiration item'}
          isCardHovered={isCardHovered}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <CategoryIcon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">{categoryInfo?.label}</span>
            {item.subcategory && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-blue-600">{translateSubcategory(item.category, item.subcategory)}</span>
              </>
            )}
          </div>
        </div>

        <Link
          href={session?.user ? getItemDetailUrl(item) : '#'}
          onClick={(e) => {
            e.stopPropagation();
            if (!session?.user) {
              e.preventDefault();
              handleItemClick(item);
            }
          }}
        >
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors cursor-pointer">
            {item.title}
          </h3>
        </Link>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          {item.user?.id && (
            <UserStatsTile
              userId={item.user.id}
              userName={item.user.name || null}
              userUsername={item.user.username || null}
              userAvatar={item.user.profileImage || null}
              displayFullName={item.user.displayFullName}
              displayNameOption={item.user.displayNameOption}
            />
          )}
          {session?.user && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {propsButtonSlot}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
