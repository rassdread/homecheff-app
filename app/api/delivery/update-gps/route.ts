import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Phase 5.7 — Live courier GPS for matching.
 * Writes DeliveryProfile.current* + lastGpsUpdate only.
 * Does NOT overwrite User.lat/lng (profile/home identity).
 */
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 },
      );
    }

    const now = new Date();
    await prisma.deliveryProfile.update({
      where: { userId: user.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastLocationUpdate: now,
        lastGpsUpdate: now,
        gpsTrackingEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      location: { lat, lng },
      message: 'GPS locatie bijgewerkt',
    });
  } catch (error) {
    console.error('Error updating GPS location:', error);
    return NextResponse.json(
      { error: 'Failed to update GPS location' },
      { status: 500 },
    );
  }
}
