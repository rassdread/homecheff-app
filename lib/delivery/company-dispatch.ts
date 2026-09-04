/**
 * Manual company dispatch — assign / reassign driver without changing customer price.
 */

import { prisma } from '@/lib/prisma';
import { assertCompanyDispatcher } from '@/lib/delivery/company-auth';
import { isDeliveryBusinessProvider } from '@/lib/delivery/provider-identity';

const TERMINAL = new Set(['DELIVERED', 'CANCELLED', 'FAILED']);

export async function assignDriverToDeliveryOrder(input: {
  deliveryOrderId: string;
  companyProfileId: string;
  actorUserId: string;
  driverUserId: string;
  reason?: string;
}) {
  await assertCompanyDispatcher(input.actorUserId, input.companyProfileId);

  const driverMember = await prisma.deliveryCompanyMember.findUnique({
    where: {
      companyProfileId_userId: {
        companyProfileId: input.companyProfileId,
        userId: input.driverUserId,
      },
    },
  });
  if (!driverMember || driverMember.status !== 'ACTIVE') {
    throw Object.assign(new Error('DRIVER_NOT_IN_COMPANY'), {
      code: 'DRIVER_NOT_IN_COMPANY',
      status: 400,
    });
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.deliveryOrder.findUnique({
      where: { id: input.deliveryOrderId },
      select: {
        id: true,
        status: true,
        deliveryProfileId: true,
        assignedDriverUserId: true,
        quotedFeeCents: true,
        deliveryFee: true,
      },
    });
    if (!order) {
      throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND', status: 404 });
    }
    if (order.deliveryProfileId !== input.companyProfileId) {
      throw Object.assign(new Error('ORDER_NOT_OWNED'), { code: 'ORDER_NOT_OWNED', status: 403 });
    }
    if (TERMINAL.has(String(order.status || '').toUpperCase())) {
      throw Object.assign(new Error('ORDER_TERMINAL'), { code: 'ORDER_TERMINAL', status: 409 });
    }

    const profile = await tx.deliveryProfile.findUnique({
      where: { id: input.companyProfileId },
      select: { providerType: true },
    });
    if (!profile || !isDeliveryBusinessProvider(profile.providerType)) {
      throw Object.assign(new Error('NOT_COMPANY_PROVIDER'), {
        code: 'NOT_COMPANY_PROVIDER',
        status: 400,
      });
    }

    const fromDriverUserId = order.assignedDriverUserId;
    const updated = await tx.deliveryOrder.update({
      where: { id: order.id },
      data: {
        assignedDriverUserId: input.driverUserId,
        assignedAt: new Date(),
        assignedByUserId: input.actorUserId,
      },
    });

    await tx.deliveryDriverAssignmentEvent.create({
      data: {
        deliveryOrderId: order.id,
        companyProfileId: input.companyProfileId,
        fromDriverUserId,
        toDriverUserId: input.driverUserId,
        actorUserId: input.actorUserId,
        reason: input.reason ?? null,
      },
    });

    // Price ownership stays on company quote — never mutated by driver assignment.
    return {
      deliveryOrder: updated,
      quotedFeeCents: order.quotedFeeCents,
      deliveryFee: order.deliveryFee,
      priceChanged: false,
    };
  });
}
