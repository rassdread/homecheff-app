import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    // Get all orders for this delivery person
    const orders = await prisma.deliveryOrder.findMany({
      where: {
        deliveryProfileId: profile.id
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

// Create a new delivery order (unassigned – bezorgers zien hem in dashboard en accepteren daar)
// Normaal wordt dit gedaan door de Stripe webhook na betaling; deze POST is voor fallback/alternatieve flows.
export async function POST(req: NextRequest) {
  try {
    const { orderId, deliveryMode, address, deliveryFeeCents, productId } = await req.json();

    if (deliveryMode !== 'TEEN_DELIVERY' && deliveryMode !== 'DELIVERY') {
      return NextResponse.json({ message: 'Geen delivery order nodig voor deze mode' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, deliveryAddress: true }
    });
    if (!order) {
      return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 });
    }

    const existing = await prisma.deliveryOrder.findUnique({
      where: { orderId }
    });
    if (existing) {
      return NextResponse.json({ success: true, deliveryOrder: existing, message: 'DeliveryOrder bestond al' });
    }

    // Eén DeliveryOrder per order, ongeassigneed → koppeling aan bezorger gebeurt bij accepteren
    const deliveryOrder = await prisma.deliveryOrder.create({
      data: {
        orderId,
        deliveryProfileId: null,
        deliveryAddress: address ?? order.deliveryAddress ?? '',
        deliveryFee: deliveryFeeCents ?? 200,
        status: 'PENDING',
        ...(productId ? { productId } : {})
      },
      include: {
        order: {
          include: {
            User: { select: { name: true, email: true } }
          }
        }
      }
    });

    return NextResponse.json({ success: true, deliveryOrder });
  } catch (error) {
    console.error('Delivery order creation error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het aanmaken van de bezorgopdracht'
    }, { status: 500 });
  }
}

