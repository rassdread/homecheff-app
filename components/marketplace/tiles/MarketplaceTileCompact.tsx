'use client';

import Link from 'next/link';
import {
  buildTileBadges,
  buildTileTrustCue,
  type MarketplaceTileMediaRatio,
  type MarketplaceTileModel,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import { MarketplacePreviewShell } from '@/components/marketplace/previews';
import {
  TileMedia,
  TilePersonRow,
  TileTrustCue,
  TileValueExchangeBlock,
} from '@/components/marketplace/tiles/primitives';

export type MarketplaceTileCompactProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  mediaRatio?: MarketplaceTileMediaRatio;
  locale?: string;
  enablePreview?: boolean;
};

export default function MarketplaceTileCompact({
  model,
  t,
  mediaRatio = '4:5',
  locale = 'nl-NL',
  enablePreview = true,
}: MarketplaceTileCompactProps) {
  const { badges, overflowCount } = buildTileBadges(model, t, 'compact', locale);
  const trustCue = buildTileTrustCue(model, t, 2);
  const title = model.title || t('common.dish');

  return (
    <MarketplacePreviewShell
      model={model}
      t={t}
      locale={locale}
      enabled={enablePreview}
    >
      <article className="feed-card-geo hc-dorpsplein-card hc-feed-card hc-card-lift flex flex-col overflow-hidden border-primary-brand/15">
      <TileMedia
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
        showPreviewInfo={enablePreview}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5">
        <TilePersonRow model={model} t={t} />
        <Link href={model.href} prefetch className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
            {title}
          </h3>
        </Link>
        <TileValueExchangeBlock model={model} t={t} variant="compact" />
        <TileTrustCue trustCue={trustCue} />
      </div>
    </article>
    </MarketplacePreviewShell>
  );
}
