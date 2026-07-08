'use client';

import Link from 'next/link';
import {
  buildTileBadges,
  buildTileTrustCue,
  type MarketplaceTileModel,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import {
  TileMedia,
  TilePersonRow,
  TileTrustCue,
  TileValueExchangeBlock,
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
  const trustCue = buildTileTrustCue(model, t, 1);
  const title = model.title || t('common.dish');

  return (
    <article className="hc-dorpsplein-card flex h-auto flex-col self-start overflow-hidden rounded-xl border border-primary-brand/10 bg-white shadow-sm transition-shadow hover:shadow-md">
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
        <TileValueExchangeBlock
          model={model}
          t={t}
          variant="mini"
          showAcceptedIcons={false}
          className="min-w-0"
        />
        <TileTrustCue
          trustCue={trustCue}
          className="truncate text-[10px] font-medium text-gray-500"
        />
      </div>
    </article>
  );
}
