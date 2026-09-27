'use client';

import { buildOrderTimeline } from '@/lib/orders/order-status-transitions';
import type { OrderStatus } from '@prisma/client';
import { useTranslation } from '@/hooks/useTranslation';

const LABEL_KEYS: Record<string, { key: string; en: string; nl: string }> = {
  'orderTimeline.placed': { key: 'surfaceLang.timelinePlaced', en: 'Order placed', nl: 'Bestelling geplaatst' },
  'orderTimeline.confirmed': { key: 'surfaceLang.timelineConfirmed', en: 'Confirmed / paid', nl: 'Bevestigd / betaald' },
  'orderTimeline.processing': { key: 'surfaceLang.timelineProcessing', en: 'In progress', nl: 'In behandeling' },
  'orderTimeline.shipped': { key: 'surfaceLang.timelineShipped', en: 'On the way / shipped', nl: 'Onderweg / verzonden' },
  'orderTimeline.readyPickup': { key: 'surfaceLang.timelineReadyPickup', en: 'Ready for pickup', nl: 'Klaar om op te halen' },
  'orderTimeline.delivered': { key: 'surfaceLang.timelineDelivered', en: 'Delivered', nl: 'Bezorgd' },
  'orderTimeline.pickedUp': { key: 'surfaceLang.timelinePickedUp', en: 'Picked up', nl: 'Opgehaald' },
  'orderTimeline.cancelled': { key: 'surfaceLang.timelineCancelled', en: 'Cancelled', nl: 'Geannuleerd' },
  'orderTimeline.refunded': { key: 'surfaceLang.timelineRefunded', en: 'Refunded', nl: 'Terugbetaald' },
};

type Props = {
  status: string;
  createdAt: string | Date;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  deliveryMode?: string | null;
};

export default function OrderLifecycleTimeline({
  status,
  createdAt,
  shippedAt,
  deliveredAt,
  deliveryMode,
}: Props) {
  const { tOr, language } = useTranslation();
  const dateTag = language === 'nl' ? 'nl-NL' : 'en-GB';
  const steps = buildOrderTimeline({
    status: status as OrderStatus,
    createdAt: new Date(createdAt),
    shippedAt: shippedAt ? new Date(shippedAt) : null,
    deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
    deliveryMode,
  });

  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.id} className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step.done
                ? 'bg-emerald-600 text-white'
                : step.active
                  ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                  : 'bg-gray-100 text-gray-400'
            }`}
            aria-hidden
          >
            {step.done ? '✓' : step.active ? '●' : '○'}
          </span>
          <div className="min-w-0">
            <p
              className={`text-sm font-medium ${
                step.done || step.active ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {LABEL_KEYS[step.labelKey]
                ? tOr(LABEL_KEYS[step.labelKey].key, LABEL_KEYS[step.labelKey].en, LABEL_KEYS[step.labelKey].nl)
                : step.labelKey}
            </p>
            {step.at ? (
              <p className="text-xs text-gray-500">
                {new Date(step.at).toLocaleString(dateTag)}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
