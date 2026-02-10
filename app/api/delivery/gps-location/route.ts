import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { latitude, longitude, accuracy, batteryLevel, address } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'GPS coördinaten zijn vereist' }, { status: 400 });
    }

    // Check if user has delivery profile
    const deliveryProfile = await prisma.deliveryProfile.findFirst({
      where: {
        userId: (session as any)?.user?.id
      }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'Geen bezorger profiel gevonden' }, { status: 404 });
    }

    // Update GPS location
    const updatedProfile = await prisma.deliveryProfile.update({
      where: {
        id: deliveryProfile.id
      },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        currentAddress: address || null,
        lastLocationUpdate: new Date(),
        lastGpsUpdate: new Date(),
        locationAccuracy: accuracy || null,
        batteryLevel: batteryLevel || null,
        gpsTrackingEnabled: true
      }
    });

    return NextResponse.json({
      success: true,
      location: {
        latitude: updatedProfile.currentLat,
        longitude: updatedProfile.currentLng,
        address: updatedProfile.currentAddress,
        lastUpdate: updatedProfile.lastLocationUpdate,
        accuracy: updatedProfile.locationAccuracy
      }
    });

  } catch (error) {
    console.error('GPS location update error:', error);
    return NextResponse.json(
      { error: 'Interne server fout' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Check if user has delivery profile
    const deliveryProfile = await prisma.deliveryProfile.findFirst({
      where: {
        userId: (session as any)?.user?.id
      },
      select: {
        currentLat: true,
        currentLng: true,
        currentAddress: true,
        lastLocationUpdate: true,
        lastGpsUpdate: true,
        locationAccuracy: true,
        batteryLevel: true,
        gpsTrackingEnabled: true
      }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'Geen bezorger profiel gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      location: {
        latitude: deliveryProfile.currentLat,
        longitude: deliveryProfile.currentLng,
        address: deliveryProfile.currentAddress,
        lastUpdate: deliveryProfile.lastLocationUpdate,
        accuracy: deliveryProfile.locationAccuracy,
        batteryLevel: deliveryProfile.batteryLevel,
        gpsTrackingEnabled: deliveryProfile.gpsTrackingEnabled
      }
    });

  } catch (error) {
    console.error('GPS location fetch error:', error);
    return NextResponse.json(
      { error: 'Interne server fout' },
      { status: 500 }
    );
  }
}
