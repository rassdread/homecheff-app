/**
 * Complete post-accept pickup/delivery location + schedule on CommunityOrder.
 */
import { prisma } from '@/lib/prisma';
import {
  deriveFulfillmentLocationState,
  formatOperationalAddress,
  isPhysicalFulfillment,
  resolveEffectiveSchedule,
  resolveLocationOwner,
  toIsoDate,
  type AddressParts,
} from '@/lib/proposals/fulfillment-location';
import { serializeCommunityOrder } from '@/lib/proposals/serialize-proposal';
import type { CommunityOrderDTO } from '@/lib/proposals/proposal-types';
import { NotificationService } from '@/lib/notifications/notification-service';

export class FulfillmentLocationError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorKey?: string,
  ) {
    super(message);
    this.name = 'FulfillmentLocationError';
  }
}

export type CompleteFulfillmentLocationInput = {
  address?: AddressParts;
  /** Full formatted line alternative to structured parts. */
  addressLine?: string | null;
  scheduleDate?: string | null;
  scheduleTimeWindow?: string | null;
  /** Use saved profile address for the responsible party. */
  useSavedProfileAddress?: boolean;
};

function parseScheduleDate(raw: string | null | undefined): Date | null {
  const iso = toIsoDate(raw);
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new FulfillmentLocationError('Invalid schedule date', 400, 'proposal.errors.invalidScheduleDate');
  }
  return d;
}

export async function getFulfillmentLocationView(
  communityOrderId: string,
  userId: string,
) {
  const order = await prisma.communityOrder.findUnique({
    where: { id: communityOrderId },
    include: {
      Proposal: {
        select: {
          requestedDate: true,
          requestedTimeWindow: true,
          fulfillmentType: true,
          title: true,
        },
      },
      Buyer: {
        select: {
          id: true,
          name: true,
          address: true,
          postalCode: true,
          city: true,
          place: true,
          country: true,
        },
      },
      Seller: {
        select: {
          id: true,
          name: true,
          address: true,
          postalCode: true,
          city: true,
          place: true,
          country: true,
        },
      },
      DeliveryRequests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          pickupAddress: true,
          deliveryAddress: true,
          pickupDate: true,
          pickupTimeWindow: true,
          deliveryDate: true,
          deliveryTimeWindow: true,
        },
      },
    },
  });

  if (!order) {
    throw new FulfillmentLocationError('Community order not found', 404);
  }
  if (userId !== order.buyerId && userId !== order.sellerId) {
    throw new FulfillmentLocationError('Access denied', 403, 'proposal.errors.locationAccessDenied');
  }

  const mode = order.fulfillmentMode ?? order.Proposal.fulfillmentType;
  const dr = order.DeliveryRequests[0] ?? null;
  const owner = resolveLocationOwner(mode);
  const state = deriveFulfillmentLocationState({
    fulfillmentMode: mode,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    deliveryRequestPickup: dr?.pickupAddress,
    deliveryRequestDelivery: dr?.deliveryAddress,
    proposalDate: order.Proposal.requestedDate,
    proposalTimeWindow: order.Proposal.requestedTimeWindow,
    confirmedDate: order.confirmedScheduleDate,
    confirmedTimeWindow: order.confirmedScheduleTimeWindow,
  });
  const schedule = resolveEffectiveSchedule({
    proposalDate: order.Proposal.requestedDate,
    proposalTimeWindow: order.Proposal.requestedTimeWindow,
    confirmedDate: order.confirmedScheduleDate,
    confirmedTimeWindow: order.confirmedScheduleTimeWindow,
  });

  const viewerIsOwner =
    (owner === 'SELLER' && userId === order.sellerId) ||
    (owner === 'BUYER' && userId === order.buyerId);

  const savedOwner =
    owner === 'SELLER'
      ? order.Seller
      : owner === 'BUYER'
        ? order.Buyer
        : null;
  const savedAddressLine = savedOwner
    ? formatOperationalAddress({
        address: savedOwner.address,
        postalCode: savedOwner.postalCode,
        city: savedOwner.city,
        place: savedOwner.place,
        country: savedOwner.country,
      })
    : null;

  const exactAddress =
    owner === 'SELLER'
      ? order.pickupAddress || dr?.pickupAddress || null
      : owner === 'BUYER'
        ? order.deliveryAddress || dr?.deliveryAddress || null
        : null;

  return {
    communityOrderId: order.id,
    fulfillmentMode: mode,
    state,
    ownerRole: owner,
    viewerCanComplete: viewerIsOwner && state !== 'COMPLETE' && state !== 'LOCATION_NOT_REQUIRED',
    scheduleLockedFromProposal: schedule.fromProposal,
    scheduleDate: schedule.date,
    scheduleTimeWindow: schedule.timeWindow,
    exactAddress,
    savedAddressLine,
    counterpartName:
      userId === order.buyerId ? order.Seller.name : order.Buyer.name,
    communityOrder: serializeCommunityOrder(order),
  };
}

export async function completeFulfillmentLocation(
  userId: string,
  communityOrderId: string,
  input: CompleteFulfillmentLocationInput,
): Promise<{ communityOrder: CommunityOrderDTO; state: string; idempotentReplay: boolean }> {
  const order = await prisma.communityOrder.findUnique({
    where: { id: communityOrderId },
    include: {
      Proposal: {
        select: {
          requestedDate: true,
          requestedTimeWindow: true,
          fulfillmentType: true,
          title: true,
          buyerId: true,
          sellerId: true,
        },
      },
      Buyer: {
        select: {
          id: true,
          address: true,
          postalCode: true,
          city: true,
          place: true,
          country: true,
        },
      },
      Seller: {
        select: {
          id: true,
          address: true,
          postalCode: true,
          city: true,
          place: true,
          country: true,
        },
      },
      DeliveryRequests: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) {
    throw new FulfillmentLocationError('Community order not found', 404);
  }
  if (userId !== order.buyerId && userId !== order.sellerId) {
    throw new FulfillmentLocationError('Access denied', 403, 'proposal.errors.locationAccessDenied');
  }

  const mode = order.fulfillmentMode ?? order.Proposal.fulfillmentType;
  if (!isPhysicalFulfillment(mode)) {
    throw new FulfillmentLocationError(
      'Location not required',
      400,
      'proposal.errors.locationNotRequired',
    );
  }

  const owner = resolveLocationOwner(mode);
  const isOwner =
    (owner === 'SELLER' && userId === order.sellerId) ||
    (owner === 'BUYER' && userId === order.buyerId);
  if (!isOwner) {
    throw new FulfillmentLocationError(
      'Only the responsible party can confirm this location',
      403,
      'proposal.errors.locationOwnerOnly',
    );
  }

  const existingState = deriveFulfillmentLocationState({
    fulfillmentMode: mode,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    deliveryRequestPickup: order.DeliveryRequests[0]?.pickupAddress,
    deliveryRequestDelivery: order.DeliveryRequests[0]?.deliveryAddress,
    proposalDate: order.Proposal.requestedDate,
    proposalTimeWindow: order.Proposal.requestedTimeWindow,
    confirmedDate: order.confirmedScheduleDate,
    confirmedTimeWindow: order.confirmedScheduleTimeWindow,
  });
  if (existingState === 'COMPLETE') {
    return {
      communityOrder: serializeCommunityOrder(order),
      state: 'COMPLETE',
      idempotentReplay: true,
    };
  }

  let addressLine: string | null = null;
  if (input.useSavedProfileAddress) {
    const profile = owner === 'SELLER' ? order.Seller : order.Buyer;
    addressLine = formatOperationalAddress({
      address: profile.address,
      postalCode: profile.postalCode,
      city: profile.city,
      place: profile.place,
      country: profile.country,
    });
  } else if (input.addressLine?.trim()) {
    addressLine = input.addressLine.trim();
  } else if (input.address) {
    addressLine = formatOperationalAddress(input.address);
  }

  if (!addressLine || addressLine.length < 5) {
    throw new FulfillmentLocationError(
      'Address required',
      400,
      'proposal.errors.locationAddressRequired',
    );
  }

  const agreedSchedule = resolveEffectiveSchedule({
    proposalDate: order.Proposal.requestedDate,
    proposalTimeWindow: order.Proposal.requestedTimeWindow,
    confirmedDate: order.confirmedScheduleDate,
    confirmedTimeWindow: order.confirmedScheduleTimeWindow,
  });

  let scheduleDate = agreedSchedule.date;
  let scheduleTime = agreedSchedule.timeWindow;

  if (agreedSchedule.fromProposal) {
    // Accepted proposal schedule is immutable — ignore client overrides.
    scheduleDate = agreedSchedule.date;
    scheduleTime = agreedSchedule.timeWindow;
  } else {
    scheduleDate = toIsoDate(input.scheduleDate) || scheduleDate;
    scheduleTime =
      (input.scheduleTimeWindow?.trim() || scheduleTime || null);
  }

  if (!scheduleDate || !scheduleTime) {
    throw new FulfillmentLocationError(
      'Schedule date and time required for physical completion',
      400,
      'proposal.errors.locationScheduleRequired',
    );
  }

  const confirmedDate = parseScheduleDate(scheduleDate);

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.communityOrder.update({
      where: { id: order.id },
      data: {
        pickupAddress: owner === 'SELLER' ? addressLine : order.pickupAddress,
        deliveryAddress: owner === 'BUYER' ? addressLine : order.deliveryAddress,
        confirmedScheduleDate: confirmedDate,
        confirmedScheduleTimeWindow: scheduleTime,
        locationCompletedAt: new Date(),
        locationCompletedById: userId,
      },
    });

    const existingDr = order.DeliveryRequests[0];
    if (existingDr) {
      await tx.deliveryRequest.update({
        where: { id: existingDr.id },
        data: {
          pickupAddress:
            owner === 'SELLER' ? addressLine : existingDr.pickupAddress,
          deliveryAddress:
            owner === 'BUYER' ? addressLine : existingDr.deliveryAddress,
          pickupDate:
            owner === 'SELLER' ? confirmedDate : existingDr.pickupDate,
          pickupTimeWindow:
            owner === 'SELLER' ? scheduleTime : existingDr.pickupTimeWindow,
          deliveryDate:
            owner === 'BUYER' ? confirmedDate : existingDr.deliveryDate,
          deliveryTimeWindow:
            owner === 'BUYER' ? scheduleTime : existingDr.deliveryTimeWindow,
        },
      });
    } else if (mode === 'DELIVERY' || order.deliveryRequested) {
      const sellerLine =
        owner === 'SELLER'
          ? addressLine
          : formatOperationalAddress({
              address: order.Seller.address,
              postalCode: order.Seller.postalCode,
              city: order.Seller.city,
              place: order.Seller.place,
              country: order.Seller.country,
            });
      const buyerLine =
        owner === 'BUYER'
          ? addressLine
          : formatOperationalAddress({
              address: order.Buyer.address,
              postalCode: order.Buyer.postalCode,
              city: order.Buyer.city,
              place: order.Buyer.place,
              country: order.Buyer.country,
            });
      if (sellerLine && buyerLine) {
        await tx.deliveryRequest.create({
          data: {
            communityOrderId: order.id,
            status: 'OPEN',
            pickupAddress: sellerLine,
            deliveryAddress: buyerLine,
            pickupDate: confirmedDate,
            pickupTimeWindow: scheduleTime,
            deliveryDate: confirmedDate,
            deliveryTimeWindow: scheduleTime,
          },
        });
      }
    }

    return next;
  });

  const counterpartId = userId === order.buyerId ? order.sellerId : order.buyerId;
  const title =
    owner === 'SELLER' ? 'Afhaaladres bevestigd' : 'Afleveradres bevestigd';
  const body = `"${order.Proposal.title}" — locatie afgerond.`;
  void NotificationService.send({
    userId: counterpartId,
    message: {
      title,
      body,
      data: {
        type: 'FULFILLMENT_LOCATION_CONFIRMED',
        communityOrderId: order.id,
        conversationId: order.conversationId,
        actionUrl: `/profile/deals?highlight=${encodeURIComponent(order.id)}`,
        route: `/profile/deals?highlight=${encodeURIComponent(order.id)}`,
      },
    },
    channels: ['push'],
    saveToDatabase: true,
  }).catch(() => undefined);

  return {
    communityOrder: serializeCommunityOrder(updated),
    state: 'COMPLETE',
    idempotentReplay: false,
  };
}
