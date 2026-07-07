import { prisma } from '@/lib/prisma';
import type { CourierAssignmentStatus, DeliveryRequestStatus } from '@prisma/client';
import {
  notifyDeliveryRequestAccepted,
  notifyDeliveryRequestAssigned,
  notifyDeliveryRequestCompleted,
  notifyDeliveryRequestCreated,
} from './notify-delivery-request';
import {
  serializeCourierAssignment,
  serializeDeliveryRequest,
} from './serialize-delivery-marketplace';
import type {
  AssignCourierInput,
  CommunityDeliveryRequestListItem,
  CreateDeliveryRequestInput,
  DeliveryRequestActionResult,
  DeliveryRequestDTO,
} from './delivery-marketplace-types';
import { assertDelivererCanAccept } from './delivery-eligibility';
import { calculateDistance } from '@/lib/geocoding';

const ACTIVE_REQUEST_STATUSES: DeliveryRequestStatus[] = [
  'OPEN',
  'CLAIMED',
  'ASSIGNED',
];

const ACTIVE_ASSIGNMENT_STATUSES: CourierAssignmentStatus[] = [
  'PENDING',
  'ACCEPTED',
];

export class DeliveryMarketplaceServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorKey?: string,
  ) {
    super(message);
    this.name = 'DeliveryMarketplaceServiceError';
  }
}

function formatAddress(parts: Array<string | null | undefined>): string | null {
  const line = parts.filter(Boolean).join(', ').trim();
  return line || null;
}

async function loadCommunityOrderForDelivery(communityOrderId: string) {
  return prisma.communityOrder.findUnique({
    where: { id: communityOrderId },
    include: {
      Proposal: {
        select: {
          requestedDate: true,
          requestedTimeWindow: true,
          title: true,
        },
      },
      Buyer: {
        select: {
          id: true,
          address: true,
          city: true,
          postalCode: true,
          place: true,
        },
      },
      Seller: {
        select: {
          id: true,
          address: true,
          city: true,
          postalCode: true,
          place: true,
          SellerProfile: { select: { lat: true, lng: true } },
        },
      },
    },
  });
}

function assertParty(userId: string, buyerId: string, sellerId: string) {
  if (userId !== buyerId && userId !== sellerId) {
    throw new DeliveryMarketplaceServiceError(
      'Access denied',
      403,
      'delivery.errors.accessDenied',
    );
  }
}

async function getActiveAssignment(deliveryRequestId: string) {
  return prisma.courierAssignment.findFirst({
    where: {
      deliveryRequestId,
      status: { in: ACTIVE_ASSIGNMENT_STATUSES },
    },
    orderBy: { assignedAt: 'desc' },
  });
}

export class DeliveryRequestService {
  static async createFromCommunityOrder(
    userId: string,
    communityOrderId: string,
    input: CreateDeliveryRequestInput = {},
  ): Promise<DeliveryRequestActionResult> {
    const order = await loadCommunityOrderForDelivery(communityOrderId);
    if (!order) {
      throw new DeliveryMarketplaceServiceError(
        'Community order not found',
        404,
        'delivery.errors.communityOrderNotFound',
      );
    }

    assertParty(userId, order.buyerId, order.sellerId);

    if (order.fulfillmentMode !== 'DELIVERY' || !order.deliveryRequested) {
      throw new DeliveryMarketplaceServiceError(
        'Delivery not requested for this community order',
        400,
        'delivery.errors.deliveryNotRequested',
      );
    }

    const existingActive = await prisma.deliveryRequest.findFirst({
      where: {
        communityOrderId,
        status: { in: ACTIVE_REQUEST_STATUSES },
      },
    });
    if (existingActive) {
      throw new DeliveryMarketplaceServiceError(
        'Active delivery request already exists',
        409,
        'delivery.errors.activeRequestExists',
      );
    }

    const defaultPickup = formatAddress([
      order.Seller.address,
      order.Seller.postalCode,
      order.Seller.city,
      order.Seller.place,
    ]);
    const defaultDelivery = formatAddress([
      order.Buyer.address,
      order.Buyer.postalCode,
      order.Buyer.city,
      order.Buyer.place,
    ]);

    const requestedDate = order.Proposal.requestedDate;

    const row = await prisma.deliveryRequest.create({
      data: {
        communityOrderId,
        status: 'OPEN',
        pickupAddress: input.pickupAddress?.trim() || defaultPickup,
        deliveryAddress: input.deliveryAddress?.trim() || defaultDelivery,
        pickupDate: input.pickupDate
          ? new Date(input.pickupDate)
          : requestedDate,
        pickupTimeWindow:
          input.pickupTimeWindow?.trim() ||
          order.Proposal.requestedTimeWindow,
        deliveryDate: input.deliveryDate
          ? new Date(input.deliveryDate)
          : requestedDate,
        deliveryTimeWindow:
          input.deliveryTimeWindow?.trim() ||
          order.Proposal.requestedTimeWindow,
        notes: input.notes?.trim() || null,
      },
    });

    const dto = serializeDeliveryRequest(row, null);

    await notifyDeliveryRequestCreated(
      order.buyerId,
      order.sellerId,
      userId,
      dto,
      order.conversationId,
      order.Proposal.title,
    );

    return { deliveryRequest: dto };
  }

  static async getById(
    userId: string,
    deliveryRequestId: string,
  ): Promise<DeliveryRequestDTO> {
    const row = await prisma.deliveryRequest.findUnique({
      where: { id: deliveryRequestId },
      include: {
        CommunityOrder: {
          select: { buyerId: true, sellerId: true },
        },
      },
    });
    if (!row) {
      throw new DeliveryMarketplaceServiceError(
        'Delivery request not found',
        404,
        'delivery.errors.requestNotFound',
      );
    }

    const { buyerId, sellerId } = row.CommunityOrder;
    const active = await prisma.courierAssignment.findFirst({
      where: {
        deliveryRequestId: row.id,
        status: { in: ACTIVE_ASSIGNMENT_STATUSES },
      },
      orderBy: { assignedAt: 'desc' },
      include: {
        Courier: { select: { id: true, name: true, username: true } },
      },
    });
    const isCourier = active?.courierId === userId;

    if (userId !== buyerId && userId !== sellerId && !isCourier) {
      throw new DeliveryMarketplaceServiceError(
        'Access denied',
        403,
        'delivery.errors.accessDenied',
      );
    }

    return serializeDeliveryRequest(row, active, active?.Courier ?? null);
  }

  static async assignCourier(
    userId: string,
    deliveryRequestId: string,
    input: AssignCourierInput,
  ): Promise<DeliveryRequestActionResult> {
    const row = await prisma.deliveryRequest.findUnique({
      where: { id: deliveryRequestId },
      include: {
        CommunityOrder: {
          select: {
            id: true,
            buyerId: true,
            sellerId: true,
            conversationId: true,
          },
        },
      },
    });
    if (!row) {
      throw new DeliveryMarketplaceServiceError(
        'Delivery request not found',
        404,
        'delivery.errors.requestNotFound',
      );
    }

    assertParty(userId, row.CommunityOrder.buyerId, row.CommunityOrder.sellerId);

    if (!ACTIVE_REQUEST_STATUSES.includes(row.status)) {
      throw new DeliveryMarketplaceServiceError(
        `Delivery request is ${row.status}`,
        409,
        'delivery.errors.requestNotActive',
      );
    }

    const courierId = input.courierId?.trim();
    if (!courierId) {
      throw new DeliveryMarketplaceServiceError(
        'courierId is required',
        400,
        'delivery.errors.courierRequired',
      );
    }

    const courierProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: courierId },
      select: { id: true, isActive: true },
    });
    if (!courierProfile?.isActive) {
      throw new DeliveryMarketplaceServiceError(
        'Courier profile not active',
        400,
        'delivery.errors.courierNotActive',
      );
    }

    const existingAssignment = await getActiveAssignment(deliveryRequestId);
    if (existingAssignment) {
      throw new DeliveryMarketplaceServiceError(
        'Active assignment already exists',
        409,
        'delivery.errors.activeAssignmentExists',
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.courierAssignment.create({
        data: {
          deliveryRequestId,
          courierId,
          status: 'PENDING',
        },
      });

      const updatedRequest = await tx.deliveryRequest.update({
        where: { id: deliveryRequestId },
        data: { status: 'CLAIMED' },
      });

      return { assignment, updatedRequest };
    });

    const dto = serializeDeliveryRequest(
      result.updatedRequest,
      result.assignment,
    );
    const assignmentDto = serializeCourierAssignment(result.assignment);

    await notifyDeliveryRequestAssigned(
      courierId,
      userId,
      dto,
      row.CommunityOrder.conversationId,
    );

    return {
      deliveryRequest: dto,
      assignment: assignmentDto,
    };
  }

  static async acceptAssignment(
    userId: string,
    deliveryRequestId: string,
  ): Promise<DeliveryRequestActionResult> {
    const row = await prisma.deliveryRequest.findUnique({
      where: { id: deliveryRequestId },
      include: {
        CommunityOrder: {
          select: {
            id: true,
            buyerId: true,
            sellerId: true,
            conversationId: true,
          },
        },
      },
    });
    if (!row) {
      throw new DeliveryMarketplaceServiceError(
        'Delivery request not found',
        404,
        'delivery.errors.requestNotFound',
      );
    }

    const assignment = await prisma.courierAssignment.findFirst({
      where: {
        deliveryRequestId,
        status: 'PENDING',
      },
      orderBy: { assignedAt: 'desc' },
    });
    if (!assignment) {
      throw new DeliveryMarketplaceServiceError(
        'No pending assignment',
        409,
        'delivery.errors.noPendingAssignment',
      );
    }
    if (assignment.courierId !== userId) {
      throw new DeliveryMarketplaceServiceError(
        'Only assigned courier can accept',
        403,
        'delivery.errors.courierOnly',
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.courierAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      const updatedRequest = await tx.deliveryRequest.update({
        where: { id: deliveryRequestId },
        data: { status: 'ASSIGNED' },
      });

      const updatedOrder = await tx.communityOrder.update({
        where: { id: row.communityOrderId },
        data: { deliveryAssigned: true },
      });

      return { updatedAssignment, updatedRequest, updatedOrder };
    });

    const dto = serializeDeliveryRequest(
      result.updatedRequest,
      result.updatedAssignment,
    );

    await notifyDeliveryRequestAccepted(
      row.CommunityOrder.buyerId,
      row.CommunityOrder.sellerId,
      userId,
      dto,
      row.CommunityOrder.conversationId,
    );

    return {
      deliveryRequest: dto,
      assignment: serializeCourierAssignment(result.updatedAssignment),
      communityOrder: {
        id: result.updatedOrder.id,
        deliveryAssigned: result.updatedOrder.deliveryAssigned,
      },
    };
  }

  static async completeDelivery(
    userId: string,
    deliveryRequestId: string,
  ): Promise<DeliveryRequestActionResult> {
    const row = await prisma.deliveryRequest.findUnique({
      where: { id: deliveryRequestId },
      include: {
        CommunityOrder: {
          select: {
            id: true,
            buyerId: true,
            sellerId: true,
            conversationId: true,
          },
        },
      },
    });
    if (!row) {
      throw new DeliveryMarketplaceServiceError(
        'Delivery request not found',
        404,
        'delivery.errors.requestNotFound',
      );
    }

    const assignment = await prisma.courierAssignment.findFirst({
      where: {
        deliveryRequestId,
        status: 'ACCEPTED',
      },
      orderBy: { assignedAt: 'desc' },
    });
    if (!assignment) {
      throw new DeliveryMarketplaceServiceError(
        'No accepted assignment',
        409,
        'delivery.errors.noAcceptedAssignment',
      );
    }

    const isParty =
      userId === row.CommunityOrder.buyerId ||
      userId === row.CommunityOrder.sellerId;
    const isCourier = assignment.courierId === userId;
    if (!isParty && !isCourier) {
      throw new DeliveryMarketplaceServiceError(
        'Access denied',
        403,
        'delivery.errors.accessDenied',
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedAssignment = await tx.courierAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      const updatedRequest = await tx.deliveryRequest.update({
        where: { id: deliveryRequestId },
        data: { status: 'COMPLETED' },
      });

      return { updatedAssignment, updatedRequest };
    });

    const dto = serializeDeliveryRequest(
      result.updatedRequest,
      result.updatedAssignment,
    );

    await notifyDeliveryRequestCompleted(
      row.CommunityOrder.buyerId,
      row.CommunityOrder.sellerId,
      assignment.courierId,
      userId,
      dto,
      row.CommunityOrder.conversationId,
    );

    const { tryAwardCommunityDeliveryCompletedHcp } = await import(
      '@/lib/gamification/trust-hcp'
    );
    await tryAwardCommunityDeliveryCompletedHcp(
      assignment.courierId,
      result.updatedAssignment.id,
    );
    const { unlockBadgesForUser } = await import('@/lib/gamification/unlock-badges');
    void unlockBadgesForUser(assignment.courierId).catch(() => undefined);

    const { promptDeliveryReviewAfterComplete } = await import(
      '@/lib/trust/community-delivery-review-service'
    );
    await promptDeliveryReviewAfterComplete(
      deliveryRequestId,
      row.CommunityOrder.buyerId,
      row.CommunityOrder.sellerId,
      assignment.courierId,
      row.CommunityOrder.conversationId,
    );

    return {
      deliveryRequest: dto,
      assignment: serializeCourierAssignment(result.updatedAssignment),
    };
  }

  /**
   * After proposal accept — auto-create delivery request when addresses + schedule exist.
   */
  static async tryAutoCreateAfterAccept(
    actorId: string,
    communityOrderId: string,
    schedule: {
      pickupDate?: string | null;
      pickupTimeWindow?: string | null;
      deliveryDate?: string | null;
      deliveryTimeWindow?: string | null;
    },
  ): Promise<{
    deliveryRequest: DeliveryRequestDTO | null;
    readyWithoutCreate: boolean;
  }> {
    const order = await loadCommunityOrderForDelivery(communityOrderId);
    if (!order || order.fulfillmentMode !== 'DELIVERY' || !order.deliveryRequested) {
      return { deliveryRequest: null, readyWithoutCreate: false };
    }

    const defaultPickup = formatAddress([
      order.Seller.address,
      order.Seller.postalCode,
      order.Seller.city,
      order.Seller.place,
    ]);
    const defaultDelivery = formatAddress([
      order.Buyer.address,
      order.Buyer.postalCode,
      order.Buyer.city,
      order.Buyer.place,
    ]);

    const hasAddresses = Boolean(defaultPickup && defaultDelivery);
    const hasSchedule = Boolean(
      schedule.pickupDate ||
        schedule.deliveryDate ||
        schedule.pickupTimeWindow ||
        schedule.deliveryTimeWindow,
    );

    if (!hasAddresses) {
      return { deliveryRequest: null, readyWithoutCreate: false };
    }

    if (!hasSchedule) {
      return { deliveryRequest: null, readyWithoutCreate: true };
    }

    const existingActive = await prisma.deliveryRequest.findFirst({
      where: {
        communityOrderId,
        status: { in: ACTIVE_REQUEST_STATUSES },
      },
    });
    if (existingActive) {
      return {
        deliveryRequest: serializeDeliveryRequest(existingActive, null),
        readyWithoutCreate: false,
      };
    }

    try {
      const result = await DeliveryRequestService.createFromCommunityOrder(
        actorId,
        communityOrderId,
        {
          pickupAddress: defaultPickup,
          deliveryAddress: defaultDelivery,
          pickupDate: schedule.pickupDate,
          pickupTimeWindow: schedule.pickupTimeWindow,
          deliveryDate: schedule.deliveryDate ?? schedule.pickupDate,
          deliveryTimeWindow:
            schedule.deliveryTimeWindow ?? schedule.pickupTimeWindow,
        },
      );
      return {
        deliveryRequest: result.deliveryRequest,
        readyWithoutCreate: false,
      };
    } catch {
      return { deliveryRequest: null, readyWithoutCreate: true };
    }
  }

  static async listForCourier(userId: string): Promise<{
    available: CommunityDeliveryRequestListItem[];
    mine: CommunityDeliveryRequestListItem[];
  }> {
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId },
      select: { id: true, isActive: true, isVerified: true, age: true, maxDistance: true },
    });
    const gate = assertDelivererCanAccept(profile);
    if (!gate.ok) {
      throw new DeliveryMarketplaceServiceError(
        gate.error,
        gate.status,
        gate.code === 'DELIVERY_NOT_VERIFIED'
          ? 'delivery.errors.courierNotActive'
          : 'delivery.errors.courierNotActive',
      );
    }

    const courierUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { lat: true, lng: true, country: true },
    });

    const rows = await prisma.deliveryRequest.findMany({
      where: {
        status: { in: ['OPEN', 'CLAIMED', 'ASSIGNED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        Assignments: {
          where: { status: { in: ACTIVE_ASSIGNMENT_STATUSES } },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: {
            Courier: {
              select: { id: true, name: true, username: true },
            },
          },
        },
        CommunityOrder: {
          include: {
            Proposal: { select: { title: true } },
            Seller: {
              select: {
                SellerProfile: { select: { lat: true, lng: true } },
              },
            },
          },
        },
      },
    });

    const maxKm = profile?.maxDistance ?? 25;
    const available: CommunityDeliveryRequestListItem[] = [];
    const mine: CommunityDeliveryRequestListItem[] = [];

    for (const row of rows) {
      const active = row.Assignments[0] ?? null;
      const courierUserForRow = active?.Courier ?? null;
      const dto = serializeDeliveryRequest(row, active, courierUserForRow);
      const sellerLat = row.CommunityOrder.Seller.SellerProfile?.lat;
      const sellerLng = row.CommunityOrder.Seller.SellerProfile?.lng;
      let distanceKm: number | null = null;
      if (
        courierUser?.lat != null &&
        courierUser.lng != null &&
        sellerLat != null &&
        sellerLng != null
      ) {
        distanceKm =
          Math.round(
            calculateDistance(
              courierUser.lat,
              courierUser.lng,
              sellerLat,
              sellerLng,
            ) * 10,
          ) / 10;
      }

      const item: CommunityDeliveryRequestListItem = {
        ...dto,
        title: row.CommunityOrder.Proposal.title,
        distanceKm,
        canClaim: row.status === 'OPEN' && !active,
        needsAccept: active?.status === 'PENDING' && active.courierId === userId,
        canComplete:
          active?.status === 'ACCEPTED' && active.courierId === userId,
      };

      if (active?.courierId === userId) {
        mine.push(item);
        continue;
      }

      if (item.canClaim) {
        if (distanceKm != null && distanceKm > maxKm) continue;
        available.push(item);
      }
    }

    return { available, mine };
  }

  /**
   * Courier self-claim — assign + accept in one step (teen-delivery parity).
   */
  static async claimByCourier(
    userId: string,
    deliveryRequestId: string,
  ): Promise<DeliveryRequestActionResult> {
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId },
      select: { id: true, isActive: true, isVerified: true, age: true },
    });
    const gate = assertDelivererCanAccept(profile);
    if (!gate.ok) {
      throw new DeliveryMarketplaceServiceError(
        gate.error,
        gate.status,
        'delivery.errors.courierNotActive',
      );
    }

    const row = await prisma.deliveryRequest.findUnique({
      where: { id: deliveryRequestId },
      include: {
        CommunityOrder: {
          select: {
            id: true,
            buyerId: true,
            sellerId: true,
            conversationId: true,
          },
        },
      },
    });
    if (!row) {
      throw new DeliveryMarketplaceServiceError(
        'Delivery request not found',
        404,
        'delivery.errors.requestNotFound',
      );
    }

    if (row.status !== 'OPEN') {
      throw new DeliveryMarketplaceServiceError(
        `Delivery request is ${row.status}`,
        409,
        'delivery.errors.notOpenForClaim',
      );
    }

    const existingAssignment = await getActiveAssignment(deliveryRequestId);
    if (existingAssignment) {
      throw new DeliveryMarketplaceServiceError(
        'Active assignment already exists',
        409,
        'delivery.errors.activeAssignmentExists',
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.courierAssignment.create({
        data: {
          deliveryRequestId,
          courierId: userId,
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      const updatedRequest = await tx.deliveryRequest.update({
        where: { id: deliveryRequestId },
        data: { status: 'ASSIGNED' },
      });

      const updatedOrder = await tx.communityOrder.update({
        where: { id: row.communityOrderId },
        data: { deliveryAssigned: true },
      });

      return { assignment, updatedRequest, updatedOrder };
    });

    const courierUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true },
    });

    const dto = serializeDeliveryRequest(
      result.updatedRequest,
      result.assignment,
      courierUser,
    );

    await notifyDeliveryRequestAssigned(
      userId,
      userId,
      dto,
      row.CommunityOrder.conversationId,
    );

    await notifyDeliveryRequestAccepted(
      row.CommunityOrder.buyerId,
      row.CommunityOrder.sellerId,
      userId,
      dto,
      row.CommunityOrder.conversationId,
    );

    return {
      deliveryRequest: dto,
      assignment: serializeCourierAssignment(result.assignment),
      communityOrder: {
        id: result.updatedOrder.id,
        deliveryAssigned: result.updatedOrder.deliveryAssigned,
      },
    };
  }
}
