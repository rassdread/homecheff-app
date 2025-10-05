import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { validateApiSession } from '@/lib/api-auth';
import { PrismaClient } from '@prisma/client';
import { TransportationMode } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Validate session and get user
    const { error, user } = await validateApiSession(req);
    if (error) return error;

    const { age, transportation, maxDistance, availableDays, availableTimeSlots, bio } = await req.json();

    // Validate age (must be 15-25)
    if (age < 15 || age > 25) {
      return NextResponse.json({ 
        error: 'Je moet tussen 15 en 25 jaar oud zijn' 
      }, { status: 400 });
    }

    // Check if user already has a delivery profile
    const existingProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user!.id }
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
        userId: user!.id,
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
    // Validate session and get user
    const { error, user } = await validateApiSession(req);
    if (error) return error;

    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: user!.id },
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
    // Validate session and get user
    const { error, user } = await validateApiSession(req);
    if (error) return error;

    const { 
      age, 
      transportation, 
      maxDistance, 
      availableDays, 
      availableTimeSlots, 
      bio, 
      isActive,
      deliveryMode,
      deliveryRegions,
      homeLat,
      homeLng,
      homeAddress
    } = await req.json();

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
      where: { userId: user!.id },
      data: {
        ...(age && { age }),
        ...(validTransportModes && { transportation: validTransportModes }),
        ...(maxDistance && { maxDistance }),
        ...(availableDays && { availableDays }),
        ...(availableTimeSlots && { availableTimeSlots }),
        ...(bio !== undefined && { bio }),
        ...(isActive !== undefined && { isActive }),
        ...(deliveryMode && { deliveryMode }),
        ...(deliveryRegions && { deliveryRegions }),
        ...(homeLat && { homeLat }),
        ...(homeLng && { homeLng }),
        ...(homeAddress && { homeAddress }),
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
