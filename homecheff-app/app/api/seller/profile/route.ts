import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Get seller profile
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        displayName: true,
        bio: true,
        lat: true,
        lng: true,
        companyName: true,
        kvk: true,
        deliveryMode: true,
        deliveryRadius: true,
        deliveryRegions: true
      }
    });

    return NextResponse.json({ profile });

  } catch (error) {
    console.error('Seller profile fetch error:', error);
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

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    const { 
      displayName, 
      bio, 
      companyName, 
      kvk, 
      deliveryMode, 
      deliveryRadius, 
      deliveryRegions, 
      lat, 
      lng 
    } = await req.json();

    // Validate required fields
    if (!displayName || !companyName) {
      return NextResponse.json({ 
        error: 'Bedrijfsnaam en weergavenaam zijn verplicht' 
      }, { status: 400 });
    }

    // Update or create seller profile
    const profile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName,
        bio: bio || null,
        companyName,
        kvk: kvk || null,
        deliveryMode: deliveryMode || 'FIXED',
        deliveryRadius: deliveryRadius || 5,
        deliveryRegions: deliveryRegions || [],
        lat: lat || null,
        lng: lng || null,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        displayName,
        bio: bio || null,
        companyName,
        kvk: kvk || null,
        deliveryMode: deliveryMode || 'FIXED',
        deliveryRadius: deliveryRadius || 5,
        deliveryRegions: deliveryRegions || [],
        lat: lat || null,
        lng: lng || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      profile 
    });

  } catch (error) {
    console.error('Seller profile update error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het bijwerken van je profiel' 
    }, { status: 500 });
  }
}
