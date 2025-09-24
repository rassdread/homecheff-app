import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { orderId } = params;
    const { status, notes } = await req.json();

    // Validate status
    const validStatuses = ['ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Ongeldige status' 
      }, { status: 400 });
    }

    // Get user's delivery profile
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id }
    });

    if (!profile) {
      return NextResponse.json({ 
        error: 'Geen bezorger profiel gevonden' 
      }, { status: 404 });
    }

    // Update delivery order status
    const updateData: any = {
      status,
      notes: notes || null
    };

    // Add timestamp for specific statuses
    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      
      // Update delivery profile stats
      await prisma.deliveryProfile.update({
        where: { id: profile.id },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: profile.totalEarnings || 0 } // Will be updated with actual fee
        }
      });
    }

    const updatedOrder = await prisma.deliveryOrder.update({
      where: {
        id: orderId,
        deliveryProfileId: profile.id
      },
      data: updateData,
      include: {
        order: {
          include: {
            User: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // If delivered, trigger payout to delivery person
    if (status === 'DELIVERED') {
      await triggerDeliveryPayout(updatedOrder, profile);
    }

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder 
    });

  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het updaten van de bestelling' 
    }, { status: 500 });
  }
}

async function triggerDeliveryPayout(deliveryOrder: any, profile: any) {
  try {
    // Calculate delivery person's cut (88% of delivery fee)
    const deliveryPersonCut = Math.round(deliveryOrder.deliveryFee * 0.88);
    const homecheffCut = deliveryOrder.deliveryFee - deliveryPersonCut;

    // Create payout record
    await prisma.payout.create({
      data: {
        id: `payout_${Date.now()}`,
        toUserId: profile.userId,
        amountCents: deliveryPersonCut,
        transactionId: deliveryOrder.orderId
      }
    });

    console.log(`Created payout for delivery person: ${deliveryPersonCut} cents (${(deliveryPersonCut/100).toFixed(2)}€)`);
    console.log(`HomeCheff cut: ${homecheffCut} cents (${(homecheffCut/100).toFixed(2)}€)`);

    // TODO: In production, integrate with Stripe Connect for actual payout
    // await stripe.transfers.create({
    //   amount: deliveryPersonCut,
    //   currency: 'eur',
    //   destination: profile.stripeConnectAccountId,
    //   metadata: {
    //     deliveryOrderId: deliveryOrder.id,
    //     type: 'delivery_fee'
    //   }
    // });

  } catch (error) {
    console.error('Error triggering delivery payout:', error);
  }
}
