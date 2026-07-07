import type { CourierAssignment, CourierAvailability, DeliveryRequest } from '@prisma/client';
import type {
  CourierAssignmentDTO,
  CourierAvailabilityDTO,
  DeliveryRequestDTO,
} from './delivery-marketplace-types';

function courierDisplayName(user: {
  name: string | null;
  username: string | null;
}): string | null {
  return user.name?.trim() || user.username?.trim() || null;
}

export function serializeDeliveryRequest(
  row: DeliveryRequest,
  activeAssignment?: CourierAssignment | null,
  courierUser?: { id: string; name: string | null; username: string | null } | null,
): DeliveryRequestDTO {
  const courierId =
    courierUser?.id ?? activeAssignment?.courierId ?? null;
  const courierName = courierUser
    ? courierDisplayName(courierUser)
    : null;

  return {
    id: row.id,
    communityOrderId: row.communityOrderId,
    status: row.status,
    pickupAddress: row.pickupAddress,
    deliveryAddress: row.deliveryAddress,
    pickupDate: row.pickupDate?.toISOString() ?? null,
    pickupTimeWindow: row.pickupTimeWindow,
    deliveryDate: row.deliveryDate?.toISOString() ?? null,
    deliveryTimeWindow: row.deliveryTimeWindow,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    activeAssignment: activeAssignment
      ? serializeCourierAssignment(activeAssignment)
      : null,
    courierId,
    courierName,
  };
}

export function serializeCourierAssignment(row: CourierAssignment): CourierAssignmentDTO {
  return {
    id: row.id,
    deliveryRequestId: row.deliveryRequestId,
    courierId: row.courierId,
    status: row.status,
    assignedAt: row.assignedAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeCourierAvailability(row: CourierAvailability): CourierAvailabilityDTO {
  return {
    id: row.id,
    userId: row.userId,
    weekday: row.weekday,
    startTime: row.startTime,
    endTime: row.endTime,
    radiusKm: row.radiusKm,
    preferredAreas: row.preferredAreas ?? [],
    vehicleType: row.vehicleType,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
