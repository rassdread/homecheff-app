'use client';

import Link from 'next/link';
import {
  buildTileBadges,
  buildTilePriceLine,
  buildTileTrustCue,
  type MarketplaceTileModel,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import {
  TileMedia,
  TilePersonRow,
  TilePriceLine,
  TileTrustCue,
} from '@/components/marketplace/tiles/primitives';

export type MarketplaceTileMiniProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  locale?: string;
};

/**
 * Profile grids, favorites, collections — max 1 badge, favorite only.
 */
export default function MarketplaceTileMini({
  model,
  t,
  locale = 'nl-NL',
}: MarketplaceTileMiniProps) {
  const { badges, overflowCount } = buildTileBadges(model, t, 'mini', locale);
  const priceLine = buildTilePriceLine(model, t);
  const trustCue = buildTileTrustCue(model, t, 1);
  const title = model.title || t('common.dish');

  return (
    <article className="hc-dorpsplein-card flex flex-col overflow-hidden rounded-xl border border-primary-brand/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      <TileMedia
        href={model.href}
        alt={model.imageAlt}
        imageUrl={model.coverImage}
        mediaRatio="1:1"
        badges={badges}
        overflowCount={overflowCount}
        favoriteId={model.id}
        favoriteTitle={title}
        mode={model.mode}
      />
      <div className="flex flex-col gap-1 p-2.5">
        <TilePersonRow model={model} t={t} />
        <Link href={model.href} prefetch className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
            {title}
          </h3>
        </Link>
        <TilePriceLine
          line={priceLine}
          className="truncate text-xs font-semibold tabular-nums text-primary-brand"
        />
        <TileTrustCue
          trustCue={trustCue}
          className="truncate text-[10px] font-medium text-gray-500"
        />
      </div>
    </article>
  );
}
