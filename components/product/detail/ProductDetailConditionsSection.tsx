'use client';

import { useMemo } from 'react';
import { MapPin, Package, Truck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  buildDetailConditionsBlock,
  detailConditionsHasContent,
} from '@/lib/marketplace/detail/detail-conditions-block';
import { cn } from '@/lib/utils';

type Props = {
  delivery?: string | null;
  sellerCanDeliver?: boolean;
  deliveryRadiusKm?: number | null;
  pickupAddress?: string | null;
  placeLabel?: string | null;
  availableStock?: number | null;
  className?: string;
};

function iconForKind(kind: string) {
  switch (kind) {
    case 'delivery':
    case 'delivery_radius':
      return Truck;
    case 'region':
      return MapPin;
    default:
      return Package;
  }
}

export default function ProductDetailConditionsSection({
  delivery,
  sellerCanDeliver,
  deliveryRadiusKm,
  pickupAddress,
  placeLabel,
  availableStock,
  className,
}: Props) {
  const { t } = useTranslation();

  const lines = useMemo(
    () =>
      buildDetailConditionsBlock({
        delivery,
        sellerCanDeliver,
        deliveryRadiusKm,
        pickupAddress,
        placeLabel,
        availableStock,
      }),
    [
      delivery,
      sellerCanDeliver,
      deliveryRadiusKm,
      pickupAddress,
      placeLabel,
      availableStock,
    ],
  );

  if (!detailConditionsHasContent(lines)) return null;

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm',
        className,
      )}
      data-detail-section="conditions"
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        {t('marketplace.detail.conditions.title')}
      </h2>
      <ul className="space-y-2">
        {lines.map((line) => {
          const Icon = iconForKind(line.kind);
          return (
            <li
              key={`${line.kind}-${line.labelKey}`}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <span>
                {line.params
                  ? t(line.labelKey, line.params as Record<string, string>)
                  : t(line.labelKey)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
