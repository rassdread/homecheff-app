import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { validateApiSession } from '@/lib/api-auth';
import { PrismaClient } from '@prisma/client';
// import { string } from '@prisma/client';

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
      ['BIKE', 'CAR', 'SCOOTER', 'PUBLIC_TRANSPORT', 'WALKING'].includes(t as string)
    ) as string[];

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
        transportation: validTransportModes as any,
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
            profileImage: true,
            lat: true,
            lng: true,
            place: true,
            address: true,
            city: true,
            postalCode: true
          }
        }
      }
    });
    
    // If delivery profile doesn't have home location but user has location, use user location
    if (profile && !profile.homeLat && !profile.homeLng && profile.user.lat && profile.user.lng) {
      // Update delivery profile with user's location
      const updatedProfile = await prisma.deliveryProfile.update({
        where: { userId: user!.id },
        data: {
          homeLat: profile.user.lat,
          homeLng: profile.user.lng,
          homeAddress: profile.user.place || profile.user.address || profile.user.postalCode || null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
              lat: true,
              lng: true,
              place: true,
              address: true,
              city: true,
              postalCode: true
            }
          }
        }
      });
      return NextResponse.json({ profile: updatedProfile });
    }

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
        ['BIKE', 'CAR', 'SCOOTER', 'PUBLIC_TRANSPORT', 'WALKING'].includes(t as string)
      ) as string[];
      
      if (validTransportModes.length === 0) {
        return NextResponse.json({ 
          error: 'Selecteer minimaal één vervoersmiddel' 
        }, { status: 400 });
      }
    }

    // If home location not provided but user has location, use user location
    let finalHomeLat = homeLat;
    let finalHomeLng = homeLng;
    let finalHomeAddress = homeAddress;
    
    if (!homeLat || !homeLng) {
      const userData = await prisma.user.findUnique({
        where: { id: user!.id },
        select: { lat: true, lng: true, place: true, address: true, postalCode: true }
      });
      
      if (userData?.lat && userData?.lng) {
        finalHomeLat = userData.lat;
        finalHomeLng = userData.lng;
        finalHomeAddress = finalHomeAddress || userData.place || userData.address || userData.postalCode || null;
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
        ...(finalHomeLat && { homeLat: finalHomeLat }),
        ...(finalHomeLng && { homeLng: finalHomeLng }),
        ...(finalHomeAddress && { homeAddress: finalHomeAddress }),
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
