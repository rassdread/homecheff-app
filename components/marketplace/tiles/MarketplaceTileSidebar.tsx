'use client';

import Link from 'next/link';
import {
  buildTileBadges,
  buildTilePriceLine,
  type MarketplaceTileModel,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import { TileBadgeRow, TilePriceLine } from '@/components/marketplace/tiles/primitives';
import TileMedia from '@/components/marketplace/tiles/primitives/TileMedia';

export type MarketplaceTileSidebarProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  locale?: string;
};

/**
 * Sidebar strip shell — not mounted in feed (T2 architecture only).
 * Future: sponsored placements, recommended creators, local opportunities.
 */
export default function MarketplaceTileSidebar({
  model,
  t,
  locale = 'nl-NL',
}: MarketplaceTileSidebarProps) {
  const { badges } = buildTileBadges(model, t, 'sidebar', locale);
  const priceLine = buildTilePriceLine(model, t);
  const title = model.title || t('common.dish');

  return (
    <article className="flex gap-3 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
      <div className="w-28 shrink-0">
        <TileMedia
          href={model.href}
          alt={model.imageAlt}
          imageUrl={model.coverImage}
          mediaRatio="4:3"
          showFavorite={false}
          className="rounded-lg overflow-hidden"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
        {badges.length > 0 ? (
          <TileBadgeRow badges={badges} compact />
        ) : null}
        <Link href={model.href} prefetch>
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
            {title}
          </h3>
        </Link>
        <TilePriceLine
          line={priceLine}
          className="truncate text-xs font-semibold text-primary-brand"
        />
        <Link
          href={model.href}
          prefetch
          className="mt-1 text-xs font-medium text-primary-brand hover:underline"
        >
          {t('marketplace.tile.sidebar.viewLink')}
        </Link>
      </div>
    </article>
  );
}
