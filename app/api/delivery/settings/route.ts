import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get delivery profile with settings
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            lat: true,
            lng: true,
            place: true,
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true
          }
        }
      }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: deliveryProfile.id,
        isActive: deliveryProfile.isActive,
        isOnline: deliveryProfile.isOnline || false,
        maxDistance: deliveryProfile.maxDistance,
        availableDays: deliveryProfile.availableDays,
        availableTimes: deliveryProfile.availableTimeSlots || [],
        transportation: deliveryProfile.transportation || [],
        deliveryRegions: deliveryProfile.deliveryRegions,
        deliveryMode: deliveryProfile.deliveryMode || 'STATIC',
        gpsTrackingEnabled: deliveryProfile.gpsTrackingEnabled || false,
        currentLat: deliveryProfile.currentLat,
        currentLng: deliveryProfile.currentLng,
        bio: deliveryProfile.bio,
        totalDeliveries: deliveryProfile.totalDeliveries,
        averageRating: deliveryProfile.averageRating,
        totalEarnings: deliveryProfile.totalEarnings,
        createdAt: deliveryProfile.createdAt
      },
      user: deliveryProfile.user || null
    });
  } catch (error) {
    console.error('Error fetching delivery settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      isActive,
      maxDistance,
      availableDays,
      availableTimes,
      transportation,
      deliveryRegions,
      bio,
      lat,
      lng,
      place
    } = body;

    // Update delivery profile
    const updatedDeliveryProfile = await prisma.deliveryProfile.update({
      where: { userId: user.id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        maxDistance: maxDistance !== undefined ? maxDistance : undefined,
        availableDays: availableDays !== undefined ? availableDays : undefined,
        availableTimeSlots: availableTimes !== undefined ? availableTimes : undefined,
        transportation: transportation !== undefined ? transportation : undefined,
        deliveryRegions: deliveryRegions !== undefined ? deliveryRegions : undefined,
        bio: bio !== undefined ? bio : undefined,
        updatedAt: new Date()
      }
    });

    // Update user location if provided
    if (lat !== undefined || lng !== undefined || place !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lat: lat !== undefined ? lat : undefined,
          lng: lng !== undefined ? lng : undefined,
          place: place !== undefined ? place : undefined,
        }
      });
    }

    return NextResponse.json({
      success: true,
      profile: updatedDeliveryProfile
    });
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery settings' },
      { status: 500 }
    );
  }
}