import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deliverySelfServiceIsActivePatch } from '@/lib/delivery/delivery-eligibility';

// Update delivery driver's current location
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const { lat, lng, isActive, address } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ 
        error: 'Coördinaten zijn verplicht' 
      }, { status: 400 });
    }

    const existingBlock = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: { isBlocked: true },
    });
    const nextActive = deliverySelfServiceIsActivePatch(
      { isBlocked: Boolean(existingBlock?.isBlocked) },
      isActive !== undefined ? Boolean(isActive) : true,
    );

    // Update delivery profile with current location
    const updatedProfile = await prisma.deliveryProfile.update({
      where: { userId: user.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        currentAddress: address || null,
        ...(nextActive !== undefined ? { isActive: nextActive } : {}),
        lastLocationUpdate: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      location: {
        lat: updatedProfile.currentLat,
        lng: updatedProfile.currentLng,
        address: updatedProfile.currentAddress,
        isActive: updatedProfile.isActive,
        lastUpdate: updatedProfile.lastLocationUpdate
      }
    });

  } catch (error) {
    console.error('Location update error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het updaten van je locatie' 
    }, { status: 500 });
  }
}

// Get delivery driver's current location
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Get delivery profile with current location
    const profile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: {
        currentLat: true,
        currentLng: true,
        currentAddress: true,
        isActive: true,
        lastLocationUpdate: true,
        maxDistance: true
      }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Geen bezorger profiel gevonden' }, { status: 404 });
    }

    return NextResponse.json({ 
      location: {
        lat: profile.currentLat,
        lng: profile.currentLng,
        address: profile.currentAddress,
        isActive: profile.isActive,
        lastUpdate: profile.lastLocationUpdate,
        maxDistance: profile.maxDistance
      }
    });

  } catch (error) {
    console.error('Location fetch error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het ophalen van je locatie' 
    }, { status: 500 });
  }
}
