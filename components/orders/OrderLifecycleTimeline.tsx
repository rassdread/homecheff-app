'use client';

import { buildOrderTimeline } from '@/lib/orders/order-status-transitions';
import type { OrderStatus } from '@prisma/client';

const LABELS: Record<string, string> = {
  'orderTimeline.placed': 'Bestelling geplaatst',
  'orderTimeline.confirmed': 'Bevestigd / betaald',
  'orderTimeline.processing': 'In behandeling',
  'orderTimeline.shipped': 'Onderweg / verzonden',
  'orderTimeline.readyPickup': 'Klaar om op te halen',
  'orderTimeline.delivered': 'Bezorgd',
  'orderTimeline.pickedUp': 'Opgehaald',
  'orderTimeline.cancelled': 'Geannuleerd',
  'orderTimeline.refunded': 'Terugbetaald',
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
              {LABELS[step.labelKey] || step.labelKey}
            </p>
            {step.at ? (
              <p className="text-xs text-gray-500">
                {new Date(step.at).toLocaleString('nl-NL')}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
