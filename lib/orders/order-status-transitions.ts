/**
 * Server-side allowed OrderStatus transitions (marketplace Order enum).
 * Terminal states cannot leave; no backwards jumps after delivery/cancel/refund.
 */
import type { OrderStatus } from '@prisma/client';

const ALLOWED: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'CANCELLED', 'REFUNDED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'CANCELLED', 'REFUNDED'],
  DELIVERED: [], // terminal for fulfillment; refunds via admin/refund flows only
  CANCELLED: [],
  REFUNDED: [],
};

export function isOrderStatusTransitionAllowed(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return true; // idempotent no-op
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): { ok: true } | { ok: false; code: 'INVALID_TRANSITION'; message: string } {
  if (isOrderStatusTransitionAllowed(from, to)) return { ok: true };
  return {
    ok: false,
    code: 'INVALID_TRANSITION',
    message: `Statusovergang van ${from} naar ${to} is niet toegestaan.`,
  };
}

/** Fulfillment-aware timeline steps for order detail (only mark done when timestamps/status allow). */
export type OrderTimelineStepId =
  | 'placed'
  | 'paid_or_confirmed'
  | 'processing'
  | 'ready_or_shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderTimelineInput = {
  status: OrderStatus;
  createdAt: Date;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  deliveryMode?: string | null;
};

export type OrderTimelineStep = {
  id: OrderTimelineStepId;
  done: boolean;
  active: boolean;
  at: string | null;
  labelKey: string;
};

export function buildOrderTimeline(input: OrderTimelineInput): OrderTimelineStep[] {
  const { status, createdAt, shippedAt, deliveredAt, deliveryMode } = input;
  const isPickup = (deliveryMode || '').toUpperCase() === 'PICKUP';
  const cancelled = status === 'CANCELLED';
  const refunded = status === 'REFUNDED';

  if (cancelled || refunded) {
    return [
      {
        id: 'placed',
        done: true,
        active: false,
        at: createdAt.toISOString(),
        labelKey: 'orderTimeline.placed',
      },
      {
        id: cancelled ? 'cancelled' : 'refunded',
        done: true,
        active: true,
        at: null,
        labelKey: cancelled ? 'orderTimeline.cancelled' : 'orderTimeline.refunded',
      },
    ];
  }

  const confirmedDone = !['PENDING'].includes(status);
  const processingDone = ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status);
  const shippedDone = ['SHIPPED', 'DELIVERED'].includes(status) || Boolean(shippedAt);
  const deliveredDone = status === 'DELIVERED' || Boolean(deliveredAt);

  const active: OrderTimelineStepId = deliveredDone
    ? 'delivered'
    : shippedDone
      ? 'ready_or_shipped'
      : processingDone
        ? 'processing'
        : confirmedDone
          ? 'paid_or_confirmed'
          : 'placed';

  return [
    {
      id: 'placed',
      done: true,
      active: active === 'placed',
      at: createdAt.toISOString(),
      labelKey: 'orderTimeline.placed',
    },
    {
      id: 'paid_or_confirmed',
      done: confirmedDone,
      active: active === 'paid_or_confirmed',
      at: null,
      labelKey: 'orderTimeline.confirmed',
    },
    {
      id: 'processing',
      done: processingDone,
      active: active === 'processing',
      at: null,
      labelKey: 'orderTimeline.processing',
    },
    {
      id: 'ready_or_shipped',
      done: shippedDone,
      active: active === 'ready_or_shipped',
      at: shippedAt?.toISOString() ?? null,
      labelKey: isPickup ? 'orderTimeline.readyPickup' : 'orderTimeline.shipped',
    },
    {
      id: 'delivered',
      done: deliveredDone,
      active: active === 'delivered',
      at: deliveredAt?.toISOString() ?? null,
      labelKey: isPickup ? 'orderTimeline.pickedUp' : 'orderTimeline.delivered',
    },
  ];
}
