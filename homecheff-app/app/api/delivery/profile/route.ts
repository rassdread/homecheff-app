import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { TransportationMode } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { age, transportation, maxDistance, availableDays, availableTimeSlots, bio } = await req.json();

    // Validate age (must be 15-25)
    if (age < 15 || age > 25) {
      return NextResponse.json({ 
        error: 'Je moet tussen 15 en 25 jaar oud zijn' 
      }, { status: 400 });
    }

    // Check if user already has a delivery profile
    const existingProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id }
    });

    if (existingProfile) {
      return NextResponse.json({ 
        error: 'Je hebt al een bezorger profiel' 
      }, { status: 400 });
    }

    // Validate and convert transportation modes
    const validTransportModes = transportation.filter(t => 
      Object.values(TransportationMode).includes(t as TransportationMode)
    ) as TransportationMode[];

    if (validTransportModes.length === 0) {
      return NextResponse.json({ 
        error: 'Selecteer minimaal één vervoersmiddel' 
      }, { status: 400 });
    }

    // Create delivery profile
    const deliveryProfile = await prisma.deliveryProfile.create({
      data: {
        userId: (session.user as any).id,
        age,
        transportation: validTransportModes,
        maxDistance,
        availableDays,
        availableTimeSlots,
        bio: bio || null,
        isActive: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile: deliveryProfile 
    });

  } catch (error) {
    console.error('Delivery profile creation error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het aanmaken van je profiel' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      }
    });

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Delivery profile fetch error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van je profiel' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { age, transportation, maxDistance, availableDays, availableTimeSlots, bio, isActive } = await req.json();

    // Validate age if provided
    if (age && (age < 15 || age > 25)) {
      return NextResponse.json({ 
        error: 'Je moet tussen 15 en 25 jaar oud zijn' 
      }, { status: 400 });
    }

    // Validate transportation modes if provided
    let validTransportModes;
    if (transportation) {
      validTransportModes = transportation.filter(t => 
        Object.values(TransportationMode).includes(t as TransportationMode)
      ) as TransportationMode[];
      
      if (validTransportModes.length === 0) {
        return NextResponse.json({ 
          error: 'Selecteer minimaal één vervoersmiddel' 
        }, { status: 400 });
      }
    }

    const updatedProfile = await prisma.deliveryProfile.update({
      where: { userId: (session.user as any).id },
      data: {
        ...(age && { age }),
        ...(validTransportModes && { transportation: validTransportModes }),
        ...(maxDistance && { maxDistance }),
        ...(availableDays && { availableDays }),
        ...(availableTimeSlots && { availableTimeSlots }),
        ...(bio !== undefined && { bio }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });

  } catch (error) {
    console.error('Delivery profile update error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het bijwerken van je profiel' 
    }, { status: 500 });
  }
}
