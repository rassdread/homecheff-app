import { prisma } from '@/lib/prisma';
import type { CourierVehicleType } from '@prisma/client';
import { serializeCourierAvailability } from './serialize-delivery-marketplace';
import type { CourierAvailabilityDTO } from './delivery-marketplace-types';
import { DeliveryMarketplaceServiceError } from './delivery-request-service';

const TRANSPORT_TO_VEHICLE: Record<string, CourierVehicleType> = {
  BIKE: 'BIKE',
  EBIKE: 'BIKE',
  SCOOTER: 'SCOOTER',
  CAR: 'CAR',
};

export class CourierAvailabilityService {
  static async listForUser(userId: string): Promise<CourierAvailabilityDTO[]> {
    const rows = await prisma.courierAvailability.findMany({
      where: { userId, isActive: true },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map(serializeCourierAvailability);
  }

  static async upsertWindow(
    userId: string,
    input: {
      id?: string;
      weekday: CourierAvailabilityDTO['weekday'];
      startTime: string;
      endTime: string;
      radiusKm?: number;
      preferredAreas?: string[];
      vehicleType?: CourierVehicleType;
      isActive?: boolean;
    },
  ): Promise<CourierAvailabilityDTO> {
    if (!input.startTime?.trim() || !input.endTime?.trim()) {
      throw new DeliveryMarketplaceServiceError(
        'Start and end time required',
        400,
        'courier.errors.timeRequired',
      );
    }

    const data = {
      weekday: input.weekday,
      startTime: input.startTime.trim(),
      endTime: input.endTime.trim(),
      radiusKm: input.radiusKm ?? 5,
      preferredAreas: input.preferredAreas ?? [],
      vehicleType: input.vehicleType ?? 'BIKE',
      isActive: input.isActive ?? true,
    };

    const row = input.id
      ? await prisma.courierAvailability.update({
          where: { id: input.id, userId },
          data,
        })
      : await prisma.courierAvailability.create({
          data: { ...data, userId },
        });

    return serializeCourierAvailability(row);
  }
}

/** Bridges legacy DeliveryProfile with structured CourierAvailability. */
export async function resolveCourierProfileFoundation(userId: string) {
  const [profile, windows] = await Promise.all([
    prisma.deliveryProfile.findUnique({
      where: { userId },
      select: {
        transportation: true,
        maxDistance: true,
        preferredRadius: true,
        deliveryRegions: true,
        availableDays: true,
        availableTimeSlots: true,
        isActive: true,
      },
    }),
    CourierAvailabilityService.listForUser(userId),
  ]);

  const vehicleTypes = profile
    ? [
        ...new Set(
          profile.transportation
            .map((t) => TRANSPORT_TO_VEHICLE[t])
            .filter(Boolean),
        ),
      ]
    : [];

  return {
    userId,
    hasDeliveryProfile: Boolean(profile?.isActive),
    vehicleTypes,
    radiusKm: profile?.preferredRadius ?? profile?.maxDistance ?? null,
    preferredAreas: profile?.deliveryRegions ?? [],
    availabilityWindows: windows,
    legacyAvailableDays: profile?.availableDays ?? [],
    legacyAvailableTimeSlots: profile?.availableTimeSlots ?? [],
  };
}
