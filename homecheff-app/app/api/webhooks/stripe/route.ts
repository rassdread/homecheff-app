import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // For now, just return success since we don't have Stripe configured
    // In production, you would verify the webhook signature here
    
    // Parse the webhook body (in production, use Stripe's webhook verification)
    let event;
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('Error parsing webhook body:', err);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);

      // Create order and delivery order if needed
      await createOrderFromSession(session);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function createOrderFromSession(session: any) {
  try {
    const metadata = session.metadata;
    if (!metadata) return;

    const buyerId = metadata.buyerId;
    const items = JSON.parse(metadata.items || '[]');
    const deliveryMode = metadata.deliveryMode;
    const address = metadata.address;
    const notes = metadata.notes;
    const deliveryFeeCents = parseInt(metadata.deliveryFeeCents || '0');
    const platformFeeCents = parseInt(metadata.platformFeeCents || '0');
    const deliveryFeeBreakdown = metadata.deliveryFeeBreakdown ? JSON.parse(metadata.deliveryFeeBreakdown) : null;

    // Create the main order
    const order = await prisma.order.create({
      data: {
        id: `order_${Date.now()}`,
        userId: buyerId,
        totalAmount: parseInt(metadata.totalAmount || '0'),
        status: 'PAID',
        deliveryMode: deliveryMode || 'PICKUP',
        deliveryAddress: address || null,
        notes: notes || null,
        stripeSessionId: session.id,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceCents: item.priceCents
          }))
        }
      }
    });

    console.log('Created order:', order.id);

    // Create delivery order if delivery mode is selected
    if (deliveryMode === 'DELIVERY' || deliveryMode === 'TEEN_DELIVERY') {
      // Find available delivery profiles
      const availableProfiles = await prisma.deliveryProfile.findMany({
        where: {
          isActive: true,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      if (availableProfiles.length > 0) {
        // For demo, assign to the first available profile
        const assignedProfile = availableProfiles[0];

        const deliveryOrder = await prisma.deliveryOrder.create({
          data: {
            orderId: order.id,
            deliveryProfileId: assignedProfile.id,
            deliveryFee: deliveryFeeCents,
            status: 'PENDING',
            estimatedTime: 30, // Default 30 minutes
            notes: notes || null
          }
        });

        console.log('Created delivery order:', deliveryOrder.id);
        console.log('Assigned to delivery profile:', assignedProfile.id);
      }
    }

  } catch (error) {
    console.error('Error creating order from session:', error);
  }
}