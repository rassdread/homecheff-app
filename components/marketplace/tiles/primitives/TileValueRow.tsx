'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { TileValueRowData } from '@/lib/marketplace/tiles/build-tile-value-row';
import {
  tileValueAnalyticsFromModel,
  trackMarketplaceTileValueRowSeen,
  type TileValueAnalyticsDevice,
  type TileValueAnalyticsSurface,
} from '@/lib/marketplace/tiles/tile-value-analytics';
import type { MarketplaceTileModel } from '@/lib/marketplace/tiles';

export default function TileValueRow({
  row,
  model,
  className,
  surface = 'feed',
  device = 'mobile',
  trackSeen = true,
}: {
  row: TileValueRowData;
  model?: MarketplaceTileModel;
  className?: string;
  surface?: TileValueAnalyticsSurface;
  device?: TileValueAnalyticsDevice;
  trackSeen?: boolean;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!trackSeen || !model || tracked.current) return;
    tracked.current = true;
    trackMarketplaceTileValueRowSeen(tileValueAnalyticsFromModel(model, surface, device));
  }, [trackSeen, model, surface, device]);

  // Phase 7B: money/barter semantics moved to the dedicated settlement row.
  // This row is value-only (price / budget / barter label).
  return (
    <p
      className={cn(
        'flex min-w-0 items-center gap-1 text-xs font-semibold tabular-nums text-primary-brand',
        className,
      )}
      data-tile-value-row
    >
      <span className="min-w-0 truncate">{row.priceLabel}</span>
    </p>
  );
}
