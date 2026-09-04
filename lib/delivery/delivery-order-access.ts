/**
 * Who may operate on a checkout DeliveryOrder (individual owner, company dispatcher, assigned driver).
 */

import { prisma } from '@/lib/prisma';
import {
  canDispatch,
  getActiveCompanyMembership,
} from '@/lib/delivery/company-auth';
import { isDeliveryBusinessProvider } from '@/lib/delivery/provider-identity';

export type DeliveryOrderAccess =
  | {
      ok: true;
      actorUserId: string;
      /** Commercial DeliveryProfile (settlement owner profile). */
      commercialProfileId: string;
      /** User who receives settlement (profile.userId). */
      settlementUserId: string;
      actorKind: 'PROFILE_OWNER' | 'COMPANY_DISPATCHER' | 'ASSIGNED_DRIVER';
    }
  | { ok: false; status: 403 | 404; error: string; code: string };

/**
 * Authorize status/ops on a DeliveryOrder.
 * Settlement always targets the commercial profile owner (company or individual).
 */
export async function resolveDeliveryOrderAccess(params: {
  actorUserId: string;
  deliveryOrderId: string;
}): Promise<DeliveryOrderAccess> {
  const order = await prisma.deliveryOrder.findUnique({
    where: { id: params.deliveryOrderId },
    select: {
      id: true,
      deliveryProfileId: true,
      assignedDriverUserId: true,
      status: true,
      deliveryProfile: {
        select: {
          id: true,
          userId: true,
          providerType: true,
        },
      },
    },
  });

  if (!order?.deliveryProfileId || !order.deliveryProfile) {
    return {
      ok: false,
      status: 404,
      error: 'Bezorgopdracht niet gevonden of nog niet toegewezen',
      code: 'DELIVERY_ORDER_NOT_FOUND',
    };
  }

  const profile = order.deliveryProfile;
  const commercialProfileId = profile.id;
  const settlementUserId = profile.userId;

  if (profile.userId === params.actorUserId) {
    return {
      ok: true,
      actorUserId: params.actorUserId,
      commercialProfileId,
      settlementUserId,
      actorKind: 'PROFILE_OWNER',
    };
  }

  if (
    order.assignedDriverUserId &&
    order.assignedDriverUserId === params.actorUserId
  ) {
    if (isDeliveryBusinessProvider(profile.providerType)) {
      const membership = await getActiveCompanyMembership(
        params.actorUserId,
        commercialProfileId,
      );
      if (!membership) {
        return {
          ok: false,
          status: 403,
          error: 'Je mag deze bezorging niet bijwerken',
          code: 'FORBIDDEN',
        };
      }
    }
    return {
      ok: true,
      actorUserId: params.actorUserId,
      commercialProfileId,
      settlementUserId,
      actorKind: 'ASSIGNED_DRIVER',
    };
  }

  if (isDeliveryBusinessProvider(profile.providerType)) {
    const membership = await getActiveCompanyMembership(
      params.actorUserId,
      commercialProfileId,
    );
    if (membership && canDispatch(membership.role)) {
      return {
        ok: true,
        actorUserId: params.actorUserId,
        commercialProfileId,
        settlementUserId,
        actorKind: 'COMPANY_DISPATCHER',
      };
    }
  }

  return {
    ok: false,
    status: 403,
    error: 'Bezorgopdracht niet gevonden of niet aan jou toegewezen',
    code: 'FORBIDDEN',
  };
}
