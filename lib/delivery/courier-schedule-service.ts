/**
 * Courier schedule foundation — aggregates availability + assigned deliveries.
 * No UI calendar yet; consumed by future courier dashboard / matching.
 */
import { prisma } from '@/lib/prisma';
import type { CourierWeekday } from '@prisma/client';
import { CourierAvailabilityService } from './courier-availability-service';
import type { CourierScheduleDay, CourierScheduleSlot } from './delivery-marketplace-types';

const WEEKDAY_ORDER: CourierWeekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function jsDayToCourierWeekday(day: number): CourierWeekday {
  const map: CourierWeekday[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return map[day] ?? 'MONDAY';
}

export class CourierScheduleService {
  static async getScheduleForCourier(
    userId: string,
    options?: { from?: Date; to?: Date },
  ): Promise<CourierScheduleDay[]> {
    const from = options?.from ?? new Date();
    const to =
      options?.to ??
      new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [availability, assignments] = await Promise.all([
      CourierAvailabilityService.listForUser(userId),
      prisma.courierAssignment.findMany({
        where: {
          courierId: userId,
          status: { in: ['PENDING', 'ACCEPTED'] },
          DeliveryRequest: {
            OR: [
              { pickupDate: { gte: from, lte: to } },
              { deliveryDate: { gte: from, lte: to } },
            ],
          },
        },
        include: {
          DeliveryRequest: {
            select: {
              id: true,
              communityOrderId: true,
              pickupDate: true,
              pickupTimeWindow: true,
              deliveryDate: true,
              deliveryTimeWindow: true,
              status: true,
            },
          },
        },
        orderBy: { assignedAt: 'asc' },
      }),
    ]);

    const byWeekday = new Map<CourierWeekday, CourierScheduleSlot[]>();

    for (const w of WEEKDAY_ORDER) {
      byWeekday.set(w, []);
    }

    for (const window of availability) {
      byWeekday.get(window.weekday)?.push({
        kind: 'availability',
        labelKey: 'schedule.slot.availability',
        startAt: window.startTime,
        endAt: window.endTime,
      });
    }

    for (const assignment of assignments) {
      const dr = assignment.DeliveryRequest;
      const weekday = dr.deliveryDate
        ? jsDayToCourierWeekday(dr.deliveryDate.getDay())
        : dr.pickupDate
          ? jsDayToCourierWeekday(dr.pickupDate.getDay())
          : 'MONDAY';

      byWeekday.get(weekday)?.push({
        kind: 'assigned_delivery',
        labelKey: 'schedule.slot.assignedDelivery',
        startAt: dr.deliveryTimeWindow ?? dr.pickupTimeWindow,
        endAt: null,
        deliveryRequestId: dr.id,
        communityOrderId: dr.communityOrderId,
      });
    }

    return WEEKDAY_ORDER.map((weekday) => ({
      weekday,
      slots: byWeekday.get(weekday) ?? [],
    }));
  }

  /** Reserved timeslot placeholder for future booking / matching engine. */
  static buildReservedSlot(input: {
    startAt: string;
    endAt: string;
    deliveryRequestId?: string;
  }): CourierScheduleSlot {
    return {
      kind: 'reserved',
      labelKey: 'schedule.slot.reserved',
      startAt: input.startAt,
      endAt: input.endAt,
      deliveryRequestId: input.deliveryRequestId,
    };
  }
}
