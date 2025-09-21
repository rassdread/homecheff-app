import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Get user's delivery profile
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Geen bezorger profiel gevonden' }, { status: 404 });
    }

    // Get available orders for this delivery person
    const orders = await prisma.deliveryOrder.findMany({
      where: {
        deliveryProfileId: profile.id,
        status: 'PENDING'
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Delivery orders fetch error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van bestellingen' 
    }, { status: 500 });
  }
}

// Create a new delivery order (called when customer places order)
export async function POST(req: NextRequest) {
  try {
    const { orderId, deliveryMode, address, coordinates } = await req.json();

    // Only create delivery orders for teen delivery mode
    if (deliveryMode !== 'TEEN_DELIVERY') {
      return NextResponse.json({ message: 'Geen delivery order nodig' });
    }

    // Find available delivery profiles within radius
    const availableProfiles = await prisma.deliveryProfile.findMany({
      where: {
        isActive: true,
        // Note: In a real app, you'd calculate distance based on coordinates
        // For now, we'll just get active profiles
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

    if (availableProfiles.length === 0) {
      return NextResponse.json({ 
        error: 'Geen beschikbare bezorgers gevonden' 
      }, { status: 404 });
    }

    // For demo purposes, assign to the first available profile
    // In a real app, you'd use more sophisticated matching
    const assignedProfile = availableProfiles[0];

    // Create delivery order
    const deliveryOrder = await prisma.deliveryOrder.create({
      data: {
        orderId,
        deliveryProfileId: assignedProfile.id,
        deliveryFee: 200, // €2.00 in cents
        status: 'PENDING'
      },
      include: {
        deliveryProfile: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
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

    // TODO: Send push notification to delivery person
    // await sendPushNotification(assignedProfile.user.email, {
    //   title: 'Nieuwe bezorgopdracht!',
    //   body: 'Er is een nieuwe bestelling beschikbaar in jouw gebied.'
    // });

    return NextResponse.json({ 
      success: true, 
      deliveryOrder 
    });

  } catch (error) {
    console.error('Delivery order creation error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het toewijzen van de bezorger' 
    }, { status: 500 });
  }
}


