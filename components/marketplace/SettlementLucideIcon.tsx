'use client';

import {
  ShieldCheck,
  Banknote,
  Handshake,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SETTLEMENT_ICON_COLOR,
  SETTLEMENT_ICON_SIZE,
  type SettlementIconId,
} from '@/lib/marketplace/marketplace-icon-colors';

const SETTLEMENT_LUCIDE: Record<SettlementIconId, LucideIcon> = {
  homecheff: ShieldCheck,
  directContact: Banknote,
  barter: Handshake,
  acceptedValues: ArrowLeftRight,
};

export function SettlementLucideIcon({
  kind,
  size = 'sm',
  className,
}: {
  kind: SettlementIconId;
  size?: keyof typeof SETTLEMENT_ICON_SIZE;
  className?: string;
}) {
  const Icon = SETTLEMENT_LUCIDE[kind];
  return (
    <Icon
      className={cn(
        SETTLEMENT_ICON_SIZE[size],
        SETTLEMENT_ICON_COLOR[kind],
        className,
      )}
      aria-hidden
    />
  );
}
