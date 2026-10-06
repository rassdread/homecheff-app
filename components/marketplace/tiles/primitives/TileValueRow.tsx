'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import type { TileValueRowData } from '@/lib/marketplace/tiles/build-tile-value-row';
import type {
  TileValueAnalyticsDevice,
  TileValueAnalyticsSurface,
} from '@/lib/marketplace/tiles/tile-value-analytics';
import type { MarketplaceTileModel } from '@/lib/marketplace/tiles';

export default function TileValueRow({
  row,
  model,
  className,
}: {
  row: TileValueRowData;
  model?: MarketplaceTileModel;
  className?: string;
  surface?: TileValueAnalyticsSurface;
  device?: TileValueAnalyticsDevice;
  trackSeen?: boolean;
}) {
  const { t } = useTranslation();
  const inspiration = model?.mode === 'inspiration';
  const requested = model?.listingIntent === 'REQUEST';
  const stateLabel = inspiration
    ? t('marketplace.tile.kind.inspiration')
    : requested
      ? t('marketplace.tile.badge.request')
      : null;
  const priceLabel = inspiration ? null : row.priceLabel;

  return (
    <p
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-[var(--hc-text)]',
        className,
      )}
      data-tile-value-row
    >
      {stateLabel ? (
        <span className="shrink-0 text-xs font-medium text-[var(--hc-text-secondary)]">
          {stateLabel}
        </span>
      ) : null}
      {priceLabel ? <span className="min-w-0 truncate">{priceLabel}</span> : null}
    </p>
  );
}
