import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { orderId, deliveryProfileId } = await req.json();

    if (!orderId || !deliveryProfileId) {
      return NextResponse.json({ error: 'Order ID and Delivery Profile ID are required' }, { status: 400 });
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