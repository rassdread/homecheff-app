import type {
  CourierAssignmentStatus,
  CourierVehicleType,
  CourierWeekday,
  DeliveryRequestStatus,
} from '@prisma/client';

export type DeliveryRequestDTO = {
  id: string;
  communityOrderId: string;
  status: DeliveryRequestStatus;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  pickupDate: string | null;
  pickupTimeWindow: string | null;
  deliveryDate: string | null;
  deliveryTimeWindow: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  activeAssignment?: CourierAssignmentDTO | null;
  courierId?: string | null;
  courierName?: string | null;
};

export type CourierAssignmentDTO = {
  id: string;
  deliveryRequestId: string;
  courierId: string;
  status: CourierAssignmentStatus;
  assignedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CourierAvailabilityDTO = {
  id: string;
  userId: string;
  weekday: CourierWeekday;
  startTime: string;
  endTime: string;
  radiusKm: number;
  preferredAreas: string[];
  vehicleType: CourierVehicleType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDeliveryRequestInput = {
  pickupAddress?: string | null;
  deliveryAddress?: string | null;
  pickupDate?: string | null;
  pickupTimeWindow?: string | null;
  deliveryDate?: string | null;
  deliveryTimeWindow?: string | null;
  notes?: string | null;
};

export type AssignCourierInput = {
  courierId: string;
};

export type CourierProfileFoundation = {
  userId: string;
  hasDeliveryProfile: boolean;
  vehicleTypes: CourierVehicleType[];
  radiusKm: number | null;
  preferredAreas: string[];
  availabilityWindows: CourierAvailabilityDTO[];
  legacyAvailableDays: string[];
  legacyAvailableTimeSlots: string[];
};

export type CourierScheduleSlot = {
  kind: 'availability' | 'assigned_delivery' | 'reserved';
  labelKey: string;
  startAt: string | null;
  endAt: string | null;
  deliveryRequestId?: string;
  communityOrderId?: string;
};

export type CourierScheduleDay = {
  weekday: CourierWeekday;
  slots: CourierScheduleSlot[];
};

export type DeliveryRequestActionResult = {
  deliveryRequest: DeliveryRequestDTO;
  assignment?: CourierAssignmentDTO;
  communityOrder?: { id: string; deliveryAssigned: boolean };
};

/** Courier dashboard list row — community DeliveryRequest + deal context. */
export type CommunityDeliveryRequestListItem = DeliveryRequestDTO & {
  title: string;
  distanceKm: number | null;
  needsAccept: boolean;
  canComplete: boolean;
  canClaim: boolean;
};
