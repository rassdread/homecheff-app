'use client';

import { FeedCardPrimaryMedia } from '@/components/feed/feedMedia';
import MarketplaceTileBadgeStrip from '@/components/marketplace/tiles/MarketplaceTileBadgeStrip';
import MarketplaceTileFavorite from '@/components/marketplace/tiles/MarketplaceTileFavorite';
import type { MarketplaceTileMediaRatio } from '@/lib/marketplace/tiles';
import type { TileBadge } from '@/lib/marketplace/tiles';
import type { MarketplaceTileMode } from '@/lib/marketplace/tiles';

const RATIO_CLASS: Record<MarketplaceTileMediaRatio, string> = {
  '4:5': 'aspect-[4/5]',
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
};

export default function MarketplaceTileMedia({
  href,
  alt,
  imageUrl,
  videoUrl,
  videoPoster,
  mediaRatio,
  badges,
  overflowCount,
  favoriteId,
  favoriteTitle,
  mode,
}: {
  href: string;
  alt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  videoPoster: string | null;
  mediaRatio: MarketplaceTileMediaRatio;
  badges: TileBadge[];
  overflowCount: number;
  favoriteId: string;
  favoriteTitle: string;
  mode: MarketplaceTileMode;
}) {
  return (
    <div className={`relative w-full shrink-0 ${RATIO_CLASS[mediaRatio]}`}>
      <FeedCardPrimaryMedia
        href={href}
        alt={alt}
        videoUrl={videoUrl}
        videoPoster={videoPoster}
        imageUrl={imageUrl}
        className="absolute inset-0 h-full w-full feed-card-primary-media"
      />
      <MarketplaceTileBadgeStrip badges={badges} overflowCount={overflowCount} />
      <MarketplaceTileFavorite
        id={favoriteId}
        title={favoriteTitle}
        mode={mode}
      />
    </div>
  );
}
