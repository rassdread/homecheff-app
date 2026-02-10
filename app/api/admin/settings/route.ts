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

    // Get Stripe configuration status
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || '';
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || '';
    const isTestMode = !stripeSecretKey || stripeSecretKey.startsWith('sk_test');
    const isLiveMode = stripeSecretKey.startsWith('sk_live');
    
    // Determine key type for better display
    const secretKeyType = stripeSecretKey 
      ? (stripeSecretKey.startsWith('sk_live') ? 'live' : stripeSecretKey.startsWith('sk_test') ? 'test' : 'unknown')
      : 'none';
    const publishableKeyType = stripePublishableKey
      ? (stripePublishableKey.startsWith('pk_live') ? 'live' : stripePublishableKey.startsWith('pk_test') ? 'test' : 'unknown')
      : 'none';
    
    const stripeConfig = {
      isConfigured: !!stripeSecretKey && !!stripePublishableKey,
      mode: isLiveMode ? 'live' : isTestMode ? 'test' : 'unknown',
      hasSecretKey: !!stripeSecretKey,
      hasPublishableKey: !!stripePublishableKey,
      secretKeyPrefix: stripeSecretKey ? `${stripeSecretKey.substring(0, 12)}...` : 'Niet ingesteld',
      secretKeyType,
      publishableKeyPrefix: stripePublishableKey ? `${stripePublishableKey.substring(0, 12)}...` : 'Niet ingesteld',
      publishableKeyType,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Ingesteld' : 'Niet ingesteld',
      connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID ? 'Ingesteld' : 'Niet ingesteld'
    };

    return NextResponse.json({
      subscriptions,
      deliverySettings,
      defaultPlatformFee: 12, // 12% for individuals
      stripeFee: {
        percentage: 1.4,
        fixed: 25 // €0.25
      },
      stripeConfig
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




