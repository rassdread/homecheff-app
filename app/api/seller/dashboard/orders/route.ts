import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!sellerProfile) {
      console.error(`❌ Seller Dashboard Orders API: Seller profile not found for user ${user.id}`);
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    console.log(`🔍 Seller Dashboard Orders API: Fetching orders for seller ${sellerProfile.id}, period: ${period}, limit: ${limit}`);

    // Calculate date range
    const now = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;

    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get orders for this seller - ONLY orders with Stripe payment (stripeSessionId)
    // This ensures we only count paid orders, consistent with Stripe data
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        },
        stripeSessionId: { not: null }, // Only paid orders (Stripe source)
        NOT: {
          orderNumber: {
            startsWith: 'SUB-' // Exclude subscription orders
          }
        },
        items: {
          some: {
            Product: {
              sellerId: sellerProfile.id
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }, // Most recent orders first
        { orderNumber: 'desc' } // Then by order number for consistency
      ],
      take: limit,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        deliveryMode: true,
        deliveryAddress: true,
        createdAt: true,
        stripeSessionId: true,
        shippingLabelId: true,
        shippingTrackingNumber: true,
        shippingCarrier: true,
        shippingStatus: true,
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        },
        items: {
          include: {
            Product: {
              select: {
                title: true,
                sellerId: true
              }
            }
          }
        },
        shippingLabels: {
          select: {
            id: true,
            ectaroShipLabelId: true,
            pdfUrl: true,
            trackingNumber: true,
            carrier: true,
            status: true,
            createdAt: true
          },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log(`📊 Seller Dashboard Orders API: Found ${orders.length} orders matching criteria (with stripeSessionId, period: ${period})`);

    // Filter orders to only include items from this seller
    const filteredOrders = orders.map(order => ({
      ...order,
      items: order.items.filter((item: any) => item.Product?.sellerId === sellerProfile.id)
    })).filter(order => order.items.length > 0);

    // Transform orders to include seller-specific data
    const transformedOrders = filteredOrders.map(order => {
      const sellerItems = order.items.filter(item => item.Product);
      const totalAmount = sellerItems.reduce((sum, item) => {
        return sum + (item.priceCents * item.quantity);
      }, 0);

      // Get shipping label info if available
      const shippingLabel = order.shippingLabels?.[0] || null;
      
      return {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        customerName: order.User?.name || order.User?.username || 'Onbekend',
        customerEmail: order.User?.email || '',
        productTitle: sellerItems.length === 1 
          ? sellerItems[0].Product?.title || 'Onbekend product'
          : `${sellerItems.length} producten`,
        amount: totalAmount,
        status: order.status === 'DELIVERED' ? 'Voltooid' : 
                order.status === 'CONFIRMED' ? 'Bevestigd' :
                order.status === 'PROCESSING' ? 'In behandeling' :
                order.status === 'CANCELLED' ? 'Geannuleerd' :
                order.status === 'SHIPPED' ? 'Verzonden' : 'Wachtend',
        deliveryMode: order.deliveryMode || 'PICKUP',
        deliveryAddress: order.deliveryAddress || undefined,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.stripeSessionId ? order.createdAt.toISOString() : undefined,
        // Shipping label information
        shippingLabel: shippingLabel ? {
          id: shippingLabel.id,
          pdfUrl: shippingLabel.pdfUrl,
          trackingNumber: shippingLabel.trackingNumber || order.shippingTrackingNumber,
          carrier: shippingLabel.carrier || order.shippingCarrier,
          status: shippingLabel.status || order.shippingStatus,
          ectaroShipLabelId: shippingLabel.ectaroShipLabelId
        } : null
      };
    });

    console.log(`✅ Seller Dashboard Orders API: Found ${orders.length} total orders, ${filteredOrders.length} after filtering, ${transformedOrders.length} transformed`);
    if (transformedOrders.length > 0) {
      console.log(`📦 Sample transformed order:`, {
        id: transformedOrders[0].id,
        orderNumber: transformedOrders[0].orderNumber,
        status: transformedOrders[0].status,
        amount: transformedOrders[0].amount
      });
    }

    return NextResponse.json({ orders: transformedOrders });
  } catch (error) {
    console.error('Error fetching dashboard orders:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
