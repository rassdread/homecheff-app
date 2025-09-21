import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Get user's delivery profile
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Geen bezorger profiel gevonden' }, { status: 404 });
    }

    // Update delivery order status to ACCEPTED
    const updatedOrder = await prisma.deliveryOrder.update({
      where: {
        id: orderId,
        deliveryProfileId: profile.id,
        status: 'PENDING' // Only allow accepting pending orders
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      },
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

    // TODO: Send notification to customer that their order was accepted
    // await sendPushNotification(updatedOrder.order.User.email, {
    //   title: 'Bezorger gevonden!',
    //   body: `${profile.user.name} heeft je bestelling geaccepteerd.`
    // });

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder 
    });

  } catch (error) {
    console.error('Order acceptance error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het accepteren van de bestelling' 
    }, { status: 500 });
  }
}


