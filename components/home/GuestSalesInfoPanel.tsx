'use client';

import GuestExplanationPanel from '@/components/home/GuestExplanationPanel';
import type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';

type Props = {
  panel: GuestSalesPanelId | null;
  onClose: () => void;
};

/** Hero sales-info panels (Fase 1 homepage). */
export type { GuestSalesPanelId } from '@/lib/guest/guest-explanation-panels';

export default function GuestSalesInfoPanel({ panel, onClose }: Props) {
  return (
    <GuestExplanationPanel
      namespace="guestSalesPanels"
      panel={panel}
      onClose={onClose}
    />
  );
}
