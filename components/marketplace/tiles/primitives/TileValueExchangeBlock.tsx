'use client';

import {
  buildTileAcceptedValueIcons,
  buildTileValueRow,
  buildTileSettlementRow,
  type MarketplaceTileModel,
  type TileBadgeVariant,
  type TranslateFn,
} from '@/lib/marketplace/tiles';
import TileAcceptedValueIcons from './TileAcceptedValueIcons';
import TileValueRow from './TileValueRow';
import TileSettlementRow from './TileSettlementRow';

export type TileValueExchangeBlockProps = {
  model: MarketplaceTileModel;
  t: TranslateFn;
  variant: TileBadgeVariant;
  className?: string;
  device?: 'desktop' | 'mobile';
  showAcceptedIcons?: boolean;
  showSettlement?: boolean;
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
  showSettlement = true,
}: TileValueExchangeBlockProps) {
  const valueRow = buildTileValueRow(model, t);
  const accepted =
    showAcceptedIcons && variant !== 'mini'
      ? buildTileAcceptedValueIcons(model, t, variant)
      : null;
  const settlement =
    showSettlement && variant !== 'mini' && variant !== 'sidebar'
      ? buildTileSettlementRow(model)
      : null;

  if (!valueRow && !accepted && !settlement) return null;

  return (
    <div className={className ?? 'flex min-w-0 flex-col gap-1'}>
      {valueRow || (accepted && accepted.icons.length > 0) ? (
        <div className="flex min-w-0 items-center justify-between gap-2">
          {valueRow ? (
            <TileValueRow row={valueRow} model={model} device={device} className="min-w-0 flex-1" />
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          {accepted && accepted.icons.length > 0 ? (
            <TileAcceptedValueIcons result={accepted} className="shrink-0" />
          ) : null}
        </div>
      ) : null}
      {settlement ? <TileSettlementRow row={settlement} t={t} /> : null}
    </div>
  );
}
