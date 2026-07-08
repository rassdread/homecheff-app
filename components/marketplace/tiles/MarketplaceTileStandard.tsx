'use client';

import Link from 'next/link';
import ShareButton from '@/components/ui/ShareButton';
import {
  buildTileBadges,
  buildTileSettlementRow,
  buildTileTrustCue,
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

export type MarketplaceTileStandardProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  baseUrl: string;
  locale?: string;
  enablePreview?: boolean;
};

export default function MarketplaceTileStandard({
  model,
  t,
  baseUrl,
  locale = 'nl-NL',
  enablePreview = true,
}: MarketplaceTileStandardProps) {
  const { badges, overflowCount } = buildTileBadges(model, t, 'standard', locale);
  const trustCue = buildTileTrustCue(model, t, 3);
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
        mediaRatio="4:3"
        badges={badges}
        overflowCount={overflowCount}
        favoriteId={model.id}
        favoriteTitle={title}
        mode={model.mode}
        showPreviewInfo={enablePreview}
      />
      <div className="flex shrink-0 flex-col gap-1.5 p-3 sm:p-3.5">
        <TilePersonRow model={model} t={t} />
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
        <TileValueExchangeBlock
          model={model}
          t={t}
          variant="standard"
          device="desktop"
          showSettlement={false}
        />
        <TileTrustCue
          trustCue={trustCue}
          className="truncate text-xs font-medium text-gray-500"
        />
        {settlement ? <TileSettlementRow row={settlement} t={t} /> : null}
      </div>
    </article>
    </MarketplacePreviewShell>
  );
}
