import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Get platform settings
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'SuperAdmin access required' }, { status: 403 });
    }

    // Get subscription plans (these contain fee information)
    const subscriptions = await prisma.subscription.findMany({
      where: { isActive: true },
      orderBy: { feeBps: 'asc' }
    });

    // Get delivery fee configuration from code (would be better in DB, but for now return defaults)
    const deliverySettings = {
      platformDeliverers: {
        baseFee: 250, // €2.50
        perKmRate: 50, // €0.50
        freeDistanceKm: 3,
        platformCut: 12 // 12%
      },
      sellerDelivery: {
        baseFee: 300, // €3.00
        perKmRate: 60, // €0.60
        freeDistanceKm: 5,
        platformCut: 12 // 12%
      }
    };

    return NextResponse.json({
      subscriptions,
      deliverySettings,
      defaultPlatformFee: 12, // 12% for individuals
      stripeFee: {
        percentage: 1.4,
        fixed: 25 // €0.25
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// Update platform settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'SuperAdmin access required' }, { status: 403 });
    }

    const { subscriptionId, feeBps, priceCents } = await req.json();

    if (subscriptionId && feeBps !== undefined) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          feeBps,
          ...(priceCents && { priceCents })
        }
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          id: `admin_action_${Date.now()}`,
          adminId: user.id,
          action: 'SETTINGS_UPDATE',
          notes: `Subscription ${subscriptionId} fee updated to ${feeBps / 100}%`
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}




