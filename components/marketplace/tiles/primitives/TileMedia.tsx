'use client';

import { FeedCardPrimaryMedia } from '@/components/feed/feedMedia';
import TileBadgeRow from '@/components/marketplace/tiles/primitives/TileBadgeRow';
import TileFavoriteAction from '@/components/marketplace/tiles/primitives/TileFavoriteAction';
import MarketplacePreviewInfoButton from '@/components/marketplace/previews/MarketplacePreviewInfoButton';
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
  showPreviewInfo?: boolean;
  className?: string;
  imageLoading?: 'lazy' | 'eager';
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
  showPreviewInfo = false,
  className = '',
  imageLoading = 'lazy',
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
        imageLoading={imageLoading}
      />
      {badges.length > 0 || overflowCount > 0 ? (
        <TileBadgeRow badges={badges} overflowCount={overflowCount} />
      ) : null}
      {showPreviewInfo || (showFavorite && favoriteId && favoriteTitle) ? (
        <div
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5"
          data-preview-ignore
        >
          {showPreviewInfo ? <MarketplacePreviewInfoButton /> : null}
          {showFavorite && favoriteId && favoriteTitle ? (
            <TileFavoriteAction
              id={favoriteId}
              title={favoriteTitle}
              mode={mode}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
