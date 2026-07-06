'use client';

import Link from 'next/link';
import {
  buildTileBadges,
  buildTilePriceLine,
  buildTileTrustCue,
  type MarketplaceTileMediaRatio,
  type MarketplaceTileModel,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import MarketplaceTileMedia from '@/components/marketplace/tiles/MarketplaceTileMedia';
import MarketplaceTilePersonRow from '@/components/marketplace/tiles/MarketplaceTilePersonRow';

export type MarketplaceTileCompactProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  mediaRatio?: MarketplaceTileMediaRatio;
  locale?: string;
};

export default function MarketplaceTileCompact({
  model,
  t,
  mediaRatio = '4:5',
  locale = 'nl-NL',
}: MarketplaceTileCompactProps) {
  const { badges, overflowCount } = buildTileBadges(model, t, 'compact', locale);
  const priceLine = buildTilePriceLine(model, t);
  const trustCue = buildTileTrustCue(model, t, 1);
  const title = model.title || t('common.dish');

  return (
    <article className="feed-card-geo hc-dorpsplein-card hc-feed-card hc-card-lift flex flex-col overflow-hidden border-primary-brand/15">
      <MarketplaceTileMedia
        href={model.href}
        alt={model.imageAlt}
        imageUrl={model.coverImage}
        videoUrl={model.videoUrl}
        videoPoster={model.videoPoster}
        mediaRatio={mediaRatio}
        badges={badges}
        overflowCount={overflowCount}
        favoriteId={model.id}
        favoriteTitle={title}
        mode={model.mode}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5">
        <MarketplaceTilePersonRow model={model} t={t} />
        <Link href={model.href} prefetch className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
            {title}
          </h3>
        </Link>
        {priceLine ? (
          <p className="truncate text-sm font-semibold tabular-nums text-primary-brand">
            {priceLine}
          </p>
        ) : null}
        {trustCue ? (
          <p className="truncate text-[11px] font-medium text-gray-500">
            {trustCue.segments.join(' · ')}
          </p>
        ) : null}
      </div>
    </article>
  );
}
