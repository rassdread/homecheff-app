import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deliveryDisabledBody, isHomeCheffDeliveryEnabled } from "@/lib/delivery/delivery-deployment-gate";
import { deliveryAccessDeniedBody, evaluateDeliveryAccess } from "@/lib/delivery/delivery-pilot-access";
import {
  assertDelivererCanAccept,
  delivererAcceptDenialResponse,
} from "@/lib/delivery/delivery-eligibility";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!isHomeCheffDeliveryEnabled()) {
      return NextResponse.json(deliveryDisabledBody(), { status: 403 });
    }
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { orderId, deliveryProfileId } = await req.json();

    if (!orderId || !deliveryProfileId) {
      return NextResponse.json({ error: 'Order ID and Delivery Profile ID are required' }, { status: 400 });
    }

    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { id: deliveryProfileId },
      include: { user: { select: { id: true, dateOfBirth: true } } },
    });

    const acceptCheck = assertDelivererCanAccept(deliveryProfile, {
      dateOfBirth: deliveryProfile?.user?.dateOfBirth,
    });
    if (!acceptCheck.ok) {
      return NextResponse.json(
        delivererAcceptDenialResponse(acceptCheck),
        { status: acceptCheck.status }
      );
    }

    const marketplaceOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });
    const assignAccess = evaluateDeliveryAccess({
      requesterUserId: marketplaceOrder?.userId ?? null,
      courierProfileId: deliveryProfile?.id ?? deliveryProfileId,
      courierUserId: deliveryProfile?.user?.id ?? null,
    });
    if (!assignAccess.allowed) {
      return NextResponse.json(deliveryAccessDeniedBody(assignAccess.code), { status: 403 });
    }

    // Check if the order exists and is not already assigned
    const existingDeliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { orderId: orderId },
    });

    if (existingDeliveryOrder && existingDeliveryOrder.deliveryProfileId !== deliveryProfileId) {
      return NextResponse.json({ error: 'Order is already assigned to another delivery person' }, { status: 409 });
    }

    // Create or update DeliveryOrder
    const deliveryOrder = await prisma.deliveryOrder.upsert({
      where: { orderId: orderId },
      update: {
        deliveryProfileId: deliveryProfileId,
        status: 'ACCEPTED', // Or a more appropriate initial status
      },
      create: {
        orderId: orderId,
        deliveryProfileId: deliveryProfileId,
        status: 'ACCEPTED',
        deliveryFee: 0, // This should be calculated based on distance/rules
      },
    });

    return NextResponse.json({ success: true, deliveryOrder });

  } catch (error) {
    console.error('Error assigning order:', error);
    return NextResponse.json({ error: 'Failed to assign order' }, { status: 500 });
  }
}