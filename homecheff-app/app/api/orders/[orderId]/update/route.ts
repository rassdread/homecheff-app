import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { OrderMessagingService } from '@/lib/orderMessaging';

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;
    const { 
      status, 
      pickupAddress, 
      deliveryAddress, 
      pickupDate, 
      deliveryDate,
      notes 
    } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get order with seller info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            Product: {
              include: {
                seller: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is the seller for this order
    const isSeller = order.items.some(item => item.Product.seller.userId === user.id);
    
    if (!isSeller && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(status && { status }),
        ...(pickupAddress && { pickupAddress }),
        ...(deliveryAddress && { deliveryAddress }),
        ...(pickupDate && { pickupDate: new Date(pickupDate) }),
        ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
        ...(notes && { notes })
      }
    });

    // Send automatic update message if status changed
    if (status) {
      await OrderMessagingService.updateOrderStatus(orderId, status, {
        pickupAddress: updatedOrder.pickupAddress || undefined,
        deliveryAddress: updatedOrder.deliveryAddress || undefined,
        pickupDate: updatedOrder.pickupDate || undefined,
        deliveryDate: updatedOrder.deliveryDate || undefined,
        notes: updatedOrder.notes || undefined
      });
    }

    // Send address update message if address changed
    if (pickupAddress || deliveryAddress) {
      await OrderMessagingService.updateOrderAddress(orderId, {
        pickupAddress: updatedOrder.pickupAddress || undefined,
        deliveryAddress: updatedOrder.deliveryAddress || undefined,
        deliveryMode: updatedOrder.deliveryMode as any
      });
    }

    // Send time update message if time changed
    if (pickupDate || deliveryDate) {
      await OrderMessagingService.updateOrderTime(orderId, {
        pickupDate: updatedOrder.pickupDate || undefined,
        deliveryDate: updatedOrder.deliveryDate || undefined
      });
    }

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Order updated successfully and notification sent to chat'
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
