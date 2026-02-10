import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Update user's current GPS location
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lat: lat,
        lng: lng,
        lastLocationUpdate: new Date()
      }
    });

    // Also update delivery profile's last location and enable GPS tracking
    await prisma.deliveryProfile.update({
      where: { userId: user.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastLocationUpdate: new Date(),
        gpsTrackingEnabled: true // Enable GPS tracking when location is updated
      }
    });
    return NextResponse.json({
      success: true,
      location: { lat, lng },
      message: 'GPS locatie bijgewerkt'
    });

  } catch (error) {
    console.error('Error updating GPS location:', error);
    return NextResponse.json(
      { error: 'Failed to update GPS location' },
      { status: 500 }
    );
  }
}

