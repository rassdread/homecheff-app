'use client';

import { FeedCardPrimaryMedia } from '@/components/feed/feedMedia';
import TileBadgeRow from '@/components/marketplace/tiles/primitives/TileBadgeRow';
import TileFavoriteAction from '@/components/marketplace/tiles/primitives/TileFavoriteAction';
import type {
  MarketplaceTileMediaRatio,
  MarketplaceTileMode,
  TileBadge,
} from '@/lib/marketplace/tiles';

const RATIO_CLASS: Record<MarketplaceTileMediaRatio, string> = {
  '4:5': 'aspect-[4/5]',
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
};

export type TileMediaProps = {
  href: string;
  alt: string;
  imageUrl: string | null;
  videoUrl?: string | null;
  videoPoster?: string | null;
  mediaRatio: MarketplaceTileMediaRatio;
  badges?: TileBadge[];
  overflowCount?: number;
  favoriteId?: string;
  favoriteTitle?: string;
  mode?: MarketplaceTileMode;
  showFavorite?: boolean;
  className?: string;
};

export default function TileMedia({
  href,
  alt,
  imageUrl,
  videoUrl = null,
  videoPoster = null,
  mediaRatio,
  badges = [],
  overflowCount = 0,
  favoriteId,
  favoriteTitle,
  mode = 'sale',
  showFavorite = true,
  className = '',
}: TileMediaProps) {
  return (
    <div
      className={`relative w-full shrink-0 ${RATIO_CLASS[mediaRatio]} ${className}`}
    >
      <FeedCardPrimaryMedia
        href={href}
        alt={alt}
        videoUrl={videoUrl}
        videoPoster={videoPoster}
        imageUrl={imageUrl}
        className="absolute inset-0 h-full w-full feed-card-primary-media"
      />
      {badges.length > 0 || overflowCount > 0 ? (
        <TileBadgeRow badges={badges} overflowCount={overflowCount} />
      ) : null}
      {showFavorite && favoriteId && favoriteTitle ? (
        <TileFavoriteAction
          id={favoriteId}
          title={favoriteTitle}
          mode={mode}
          className="absolute top-2 right-2 z-10"
        />
      ) : null}
    </div>
  );
}
