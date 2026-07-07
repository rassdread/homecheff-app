'use client';

import {
  buildTileAcceptedValueIcons,
  buildTileValueRow,
  type MarketplaceTileModel,
  type TileBadgeVariant,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import TileAcceptedValueIcons from './TileAcceptedValueIcons';
import TileValueRow from './TileValueRow';

export type TileValueExchangeBlockProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  variant: TileBadgeVariant;
  className?: string;
  device?: 'desktop' | 'mobile';
  showAcceptedIcons?: boolean;
};

/**
 * Value row + accepted-value icon strip (Phase 5B-C).
 */
export default function TileValueExchangeBlock({
  model,
  t,
  variant,
  className,
  device = 'mobile',
  showAcceptedIcons = true,
}: TileValueExchangeBlockProps) {
  const valueRow = buildTileValueRow(model, t);
  const accepted =
    showAcceptedIcons && variant !== 'mini'
      ? buildTileAcceptedValueIcons(model, t, variant)
      : null;

  if (!valueRow && !accepted) return null;

  return (
    <div className={className ?? 'flex min-w-0 flex-col gap-1'}>
      {valueRow ? (
        <TileValueRow row={valueRow} model={model} device={device} />
      ) : null}
      {accepted && accepted.icons.length > 0 ? (
        <TileAcceptedValueIcons result={accepted} />
      ) : null}
    </div>
  );
}
