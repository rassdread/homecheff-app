'use client';

import Link from 'next/link';
import ShareButton from '@/components/ui/ShareButton';
import {
  buildTileBadges,
  buildTilePriceLine,
  buildTileTrustCue,
  type MarketplaceTileModel,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import MarketplaceTileMedia from '@/components/marketplace/tiles/MarketplaceTileMedia';
import MarketplaceTilePersonRow from '@/components/marketplace/tiles/MarketplaceTilePersonRow';

export type MarketplaceTileStandardProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  baseUrl: string;
  locale?: string;
};

export default function MarketplaceTileStandard({
  model,
  t,
  baseUrl,
  locale = 'nl-NL',
}: MarketplaceTileStandardProps) {
  const { badges, overflowCount } = buildTileBadges(model, t, 'standard', locale);
  const priceLine = buildTilePriceLine(model, t);
  const trustCue = buildTileTrustCue(model, t, 2);
  const title = model.title || t('common.dish');

  return (
    <article className="feed-card-geo hc-dorpsplein-card hc-feed-card hc-card-lift flex flex-col overflow-hidden border-primary-brand/15">
      <MarketplaceTileMedia
        href={model.href}
        alt={model.imageAlt}
        imageUrl={model.coverImage}
        videoUrl={model.videoUrl}
        videoPoster={model.videoPoster}
        mediaRatio="4:3"
        badges={badges}
        overflowCount={overflowCount}
        favoriteId={model.id}
        favoriteTitle={title}
        mode={model.mode}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
        <MarketplaceTilePersonRow model={model} t={t} />
        <div className="flex items-start justify-between gap-2">
          <Link href={model.href} prefetch className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 sm:text-base">
              {title}
            </h3>
          </Link>
          <ShareButton
            url={`${baseUrl}${model.href}`}
            title={title}
            description={model.description ?? ''}
            className="shrink-0 p-1 text-gray-400 hover:text-secondary-brand"
          />
        </div>
        {priceLine ? (
          <p className="truncate text-sm font-semibold tabular-nums text-primary-brand">
            {priceLine}
          </p>
        ) : null}
        {trustCue ? (
          <p className="truncate text-xs font-medium text-gray-500">
            {trustCue.segments.join(' · ')}
          </p>
        ) : null}
      </div>
    </article>
  );
}
