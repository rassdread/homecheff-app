'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TileSettlementRowData } from '@/lib/marketplace/tiles/build-tile-settlement-row';
import type { TranslateFn } from '@/lib/marketplace/tiles';
import { SettlementLucideIcon } from '@/components/marketplace/SettlementLucideIcon';

/**
 * Settlement row — Phase 7B. "How can the agreement be settled?"
 *
 * Distinct icons, never conflated with the price / accepted-value row:
 *   ShieldCheck  → HomeCheff Checkout (safe pay). NOT a money-bill or bank-brand logo.
 *   Banknote     → cash / direct contact.
 *   Handshake    → barter allowed.
 *   ArrowLeftRight → alternative values (tegenwaarden) welcome.
 */
export default function TileSettlementRow({
  row,
  t,
  className,
}: {
  row: TileSettlementRowData;
  t: TranslateFn;
  className?: string;
}) {
  const items: { key: string; label: string; node: ReactNode }[] = [];

  if (row.homecheffCheckout) {
    items.push({
      key: 'homecheff',
      label: t('marketplace.tile.settlement.homecheff'),
      node: <SettlementLucideIcon kind="homecheff" />,
    });
  }
  if (row.directContact) {
    items.push({
      key: 'direct',
      label: t('marketplace.tile.settlement.direct'),
      node: <SettlementLucideIcon kind="directContact" />,
    });
  }
  if (row.barter) {
    items.push({
      key: 'barter',
      label: t('marketplace.tile.settlement.barter'),
      node: <SettlementLucideIcon kind="barter" />,
    });
  }
  if (row.acceptedValues) {
    items.push({
      key: 'acceptedValues',
      label: t('marketplace.tile.settlement.acceptedValues'),
      node: <SettlementLucideIcon kind="acceptedValues" />,
    });
  }

  if (items.length === 0) return null;

  return (
    <div
      className={cn('flex min-w-0 flex-nowrap items-center gap-1.5', className)}
      data-tile-settlement-row
      aria-label={t('marketplace.tile.settlement.aria')}
    >
      {items.map((item) => (
        <span
          key={item.key}
          title={item.label}
          role="img"
          aria-label={item.label}
          data-settlement={item.key}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-50 ring-1 ring-gray-200/70"
        >
          {item.node}
        </span>
      ))}
    </div>
  );
}
