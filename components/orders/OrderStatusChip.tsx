'use client';

/**
 * Shared order-status chip (UX-FIN-3B.1). Renders the same colours, label and
 * spacing everywhere an order status is shown (buyer orders, seller orders,
 * seller dashboard). Pass the raw Prisma enum when available.
 */

import { useTranslation } from '@/hooks/useTranslation';
import {
  ORDER_STATUS_CHIP_CLASSES,
  normalizeOrderStatus,
  orderStatusLabelKey,
} from '@/lib/orders/order-status-display';

type Props = {
  status: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
};

export default function OrderStatusChip({ status, size = 'md', className = '' }: Props) {
  const { t } = useTranslation();
  const tone = normalizeOrderStatus(status);
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${ORDER_STATUS_CHIP_CLASSES[tone]} ${className}`}
    >
      {t(orderStatusLabelKey(status))}
    </span>
  );
}
