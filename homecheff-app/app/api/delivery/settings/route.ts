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

    const {
      transportation,
      maxDistance,
      preferredRadius,
      deliveryMode,
      availableDays,
      availableTimeSlots,
      bio,
      isActive
    } = await req.json();

    // Validate input
    if (!transportation || transportation.length === 0) {
      return NextResponse.json({ 
        error: 'Selecteer minimaal één vervoersmiddel' 
      }, { status: 400 });
    }

    if (maxDistance < 2 || maxDistance > 25) {
      return NextResponse.json({ 
        error: 'Maximale afstand moet tussen 2 en 25 km liggen' 
      }, { status: 400 });
    }

    if (preferredRadius < 2 || preferredRadius > maxDistance) {
      return NextResponse.json({ 
        error: 'Voorkeursradius moet tussen 2 km en maximale afstand liggen' 
      }, { status: 400 });
    }

    if (!deliveryMode || !['FIXED', 'DYNAMIC'].includes(deliveryMode)) {
      return NextResponse.json({ 
        error: 'Ongeldige bezorgmodus' 
      }, { status: 400 });
    }

    if (!availableDays || availableDays.length === 0) {
      return NextResponse.json({ 
        error: 'Selecteer minimaal één beschikbare dag' 
      }, { status: 400 });
    }

    if (!availableTimeSlots || availableTimeSlots.length === 0) {
      return NextResponse.json({ 
        error: 'Selecteer minimaal één tijdslot' 
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

    // Update delivery profile
    const updatedProfile = await prisma.deliveryProfile.update({
      where: { id: profile.id },
      data: {
        transportation,
        maxDistance,
        preferredRadius,
        deliveryMode,
        availableDays,
        availableTimeSlots,
        bio: bio || null,
        isActive
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });

  } catch (error) {
    console.error('Delivery settings update error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het updaten van de instellingen' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get user's delivery profile
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ 
        error: 'Geen bezorger profiel gevonden' 
      }, { status: 404 });
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Delivery settings fetch error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van de instellingen' 
    }, { status: 500 });
  }
}
