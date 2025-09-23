import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all pending platform fees and delivery fee cuts
    const orders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        platformFeeCollected: false
      },
      include: {
        deliveryOrders: {
          where: {
            status: 'DELIVERED',
            deliveryFeeCollected: false
          }
        }
      }
    });

    let totalPlatformFees = 0;
    let totalDeliveryFeeCuts = 0;
    let processedOrders = [];

    for (const order of orders) {
      // Calculate platform fee (12% of product sales)
      const platformFee = Math.round(order.totalAmount * 0.12);
      totalPlatformFees += platformFee;

      // Calculate delivery fee cuts (12% of delivery fees)
      for (const deliveryOrder of order.deliveryOrders) {
        const deliveryFeeCut = Math.round(deliveryOrder.deliveryFee * 0.12);
        totalDeliveryFeeCuts += deliveryFeeCut;

        // Mark delivery fee as collected
        await prisma.deliveryOrder.update({
          where: { id: deliveryOrder.id },
          data: { deliveryFeeCollected: true }
        });
      }

      // Mark platform fee as collected
      await prisma.order.update({
        where: { id: order.id },
        data: { platformFeeCollected: true }
      });

      processedOrders.push(order.id);
    }

    const totalHomeCheffFees = totalPlatformFees + totalDeliveryFeeCuts;

    // Create collection record
    const collection = await prisma.homecheffCollection.create({
      data: {
        id: `collection_${Date.now()}`,
        platformFees: totalPlatformFees,
        deliveryFeeCuts: totalDeliveryFeeCuts,
        totalAmount: totalHomeCheffFees,
        status: 'PENDING',
        description: `Automated collection of platform fees and delivery cuts`,
        processedOrdersCount: processedOrders.length
      }
    });

    console.log(`Collected HomeCheff fees: ${totalHomeCheffFees} cents (€${(totalHomeCheffFees/100).toFixed(2)})`);
    console.log(`- Platform fees: ${totalPlatformFees} cents (€${(totalPlatformFees/100).toFixed(2)})`);
    console.log(`- Delivery fee cuts: ${totalDeliveryFeeCuts} cents (€${(totalDeliveryFeeCuts/100).toFixed(2)})`);
    console.log(`- Processed orders: ${processedOrders.length}`);

    // TODO: In production, transfer to HomeCheff bank account
    // await transferToHomeCheffAccount(totalHomeCheffFees, collection.id);

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        totalAmount: totalHomeCheffFees,
        platformFees: totalPlatformFees,
        deliveryFeeCuts: totalDeliveryFeeCuts,
        processedOrders: processedOrders.length
      }
    });

  } catch (error) {
    console.error('Fee collection error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het verzamelen van fees' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get collection history
    const collections = await prisma.homecheffCollection.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Calculate totals
    const totalCollected = collections.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalPlatformFees = collections.reduce((sum, c) => sum + c.platformFees, 0);
    const totalDeliveryCuts = collections.reduce((sum, c) => sum + c.deliveryFeeCuts, 0);

    return NextResponse.json({
      collections,
      totals: {
        totalCollected,
        totalPlatformFees,
        totalDeliveryCuts,
        collectionsCount: collections.length
      }
    });

  } catch (error) {
    console.error('Fee collection history error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van fee geschiedenis' 
    }, { status: 500 });
  }
}
