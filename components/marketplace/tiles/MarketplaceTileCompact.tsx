'use client';

import Link from 'next/link';
import {
  buildTileBadges,
  buildTileSettlementRow,
  buildTileTrustCue,
  type MarketplaceTileMediaRatio,
  type MarketplaceTileModel,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import { MarketplacePreviewShell } from '@/components/marketplace/previews';
import {
  TileMedia,
  TilePersonRow,
  TileSettlementRow,
  TileTrustCue,
  TileValueExchangeBlock,
} from '@/components/marketplace/tiles/primitives';

export type MarketplaceTileCompactProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  mediaRatio?: MarketplaceTileMediaRatio;
  locale?: string;
  enablePreview?: boolean;
  imageLoading?: 'lazy' | 'eager';
};

export default function MarketplaceTileCompact({
  model,
  t,
  mediaRatio = '4:5',
  locale = 'nl-NL',
  enablePreview = true,
  imageLoading = 'lazy',
}: MarketplaceTileCompactProps) {
  const { badges, overflowCount } = buildTileBadges(model, t, 'compact', locale);
  const trustCue = buildTileTrustCue(model, t, 2);
  const settlement = buildTileSettlementRow(model);
  const title = model.title || t('common.dish');

  return (
    <MarketplacePreviewShell
      model={model}
      t={t}
      locale={locale}
      enabled={enablePreview}
    >
      <article className="feed-card-geo hc-dorpsplein-card hc-feed-card hc-card-lift flex h-auto flex-col self-start overflow-hidden border-primary-brand/15">
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
        imageLoading={imageLoading}
      />
      <div className="flex shrink-0 flex-col gap-1.5 p-2.5">
        <TilePersonRow model={model} t={t} />
        <Link href={model.href} prefetch className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
            {title}
          </h3>
        </Link>
        <TileValueExchangeBlock
          model={model}
          t={t}
          variant="compact"
          showSettlement={false}
        />
        <TileTrustCue trustCue={trustCue} />
        {settlement ? <TileSettlementRow row={settlement} t={t} /> : null}
      </div>
    </article>
    </MarketplacePreviewShell>
  );
}
