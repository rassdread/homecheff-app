'use client';

import { Package, Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  formatProductDeliveryMessages,
  type ProductDeliveryDisplayInput,
} from '@/lib/product/product-detail-display';
import { cn } from '@/lib/utils';

type Props = ProductDeliveryDisplayInput & {
  className?: string;
};

export default function ProductDetailDelivery({
  delivery,
  sellerCanDeliver,
  deliveryRadiusKm,
  orderMethod,
  className,
}: Props) {
  const { t } = useTranslation();

  const lines = formatProductDeliveryMessages(
    { delivery, sellerCanDeliver, deliveryRadiusKm, orderMethod },
    {
      pickupAvailable: t('product.pickupAvailable') || 'Ophalen mogelijk',
      pickupOnly: t('productDetail.pickupOnly') || 'Alleen ophalen',
      deliveryAvailable: t('productDetail.deliveryAvailable') || 'Bezorging mogelijk',
      deliveryUpToKm:
        t('productDetail.deliveryUpToKm') || 'Bezorging tot {km} km',
      contactForDelivery:
        t('productDetail.contactForDelivery') || 'Neem contact op voor levering',
    },
  );

  if (lines.length === 0) return null;

  return (
    <ul className={cn('space-y-1.5', className)}>
      {lines.map((line) => {
        const isDelivery = line.toLowerCase().includes('bezorg');
        const Icon = isDelivery ? Truck : Package;
        return (
          <li
            key={line}
            className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-800"
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                isDelivery ? 'text-emerald-600' : 'text-blue-600',
              )}
              aria-hidden
            />
            <span>{line}</span>
          </li>
        );
      })}
    </ul>
  );
}
