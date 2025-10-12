import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { sellerProfileId, deliveryMode, deliveryRadius } = await req.json();

    if (!sellerProfileId) {
      return NextResponse.json({ error: 'Seller profile ID vereist' }, { status: 400 });
    }

    // Verify ownership
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      include: {
        User: {
          select: { email: true }
        }
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Verkopersprofiel niet gevonden' }, { status: 404 });
    }

    if (sellerProfile.User.email !== session.user.email) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    // Validate delivery mode
    const validModes = ['SELLER_DELIVERY', 'PLATFORM_DELIVERERS', 'BOTH'];
    if (!validModes.includes(deliveryMode)) {
      return NextResponse.json({ error: 'Ongeldige bezorgmodus' }, { status: 400 });
    }

    // Validate delivery radius for seller delivery
    if ((deliveryMode === 'SELLER_DELIVERY' || deliveryMode === 'BOTH') && deliveryRadius) {
      if (deliveryRadius < 0.5 || deliveryRadius > 200) {
        return NextResponse.json({ 
          error: 'Bezorgstraal moet tussen 0.5 en 200 km zijn' 
        }, { status: 400 });
      }
    }

    // Update seller profile
    const updatedProfile = await prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        deliveryMode,
        deliveryRadius: deliveryRadius || 5.0,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Delivery settings updated for seller ${sellerProfileId}:`, {
      deliveryMode,
      deliveryRadius
    });

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });

  } catch (error) {
    console.error('Seller delivery settings error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het opslaan' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sellerProfileId = searchParams.get('sellerProfileId');

    if (!sellerProfileId) {
      return NextResponse.json({ error: 'Seller profile ID vereist' }, { status: 400 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      select: {
        id: true,
        deliveryMode: true,
        deliveryRadius: true,
        deliveryRegions: true,
        User: {
          select: {
            email: true
          }
        }
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Verkopersprofiel niet gevonden' }, { status: 404 });
    }

    if (sellerProfile.User.email !== session.user.email) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    return NextResponse.json({ 
      settings: {
        deliveryMode: sellerProfile.deliveryMode,
        deliveryRadius: sellerProfile.deliveryRadius,
        deliveryRegions: sellerProfile.deliveryRegions
      }
    });

  } catch (error) {
    console.error('Fetch delivery settings error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}

