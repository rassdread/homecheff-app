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

    const { 
      currentLat, 
      currentLng, 
      locationAccuracy, 
      isActive,
      deliveryRadius,
      availableTimeSlots,
      contactPhone,
      contactEmail,
      specialInstructions,
      estimatedDeliveryTime
    } = await req.json();

    // Check if user has seller role
    const user = await prisma.user.findUnique({
      where: {
        id: (session as any)?.user?.id
      },
      select: {
        role: true,
        sellerRoles: true
      }
    });

    // Allow access if user is SELLER, has sellerRoles, or is ADMIN with sellerRoles
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const hasSellerAccess = user.role === 'SELLER' ||
                           user.sellerRoles.length > 0 ||
                           (user.role === 'ADMIN' && user.sellerRoles.length > 0);
    
    if (!user || !hasSellerAccess) {
      return NextResponse.json({ error: 'Geen verkoper profiel gevonden' }, { status: 403 });
    }

    // Create or update dynamic seller profile
    const dynamicSeller = await prisma.dynamicSeller.upsert({
      where: {
        userId: (session as any)?.user?.id
      },
      update: {
        currentLat: currentLat,
        currentLng: currentLng,
        locationAccuracy: locationAccuracy,
        isActive: isActive,
        deliveryRadius: deliveryRadius,
        availableTimeSlots: availableTimeSlots || [],
        contactPhone: contactPhone,
        contactEmail: contactEmail,
        specialInstructions: specialInstructions,
        estimatedDeliveryTime: estimatedDeliveryTime,
        lastLocationUpdate: new Date(),
        lastGpsUpdate: new Date()
      },
      create: {
        userId: (session as any)?.user?.id,
        currentLat: currentLat,
        currentLng: currentLng,
        locationAccuracy: locationAccuracy,
        isActive: isActive,
        deliveryRadius: deliveryRadius,
        availableTimeSlots: availableTimeSlots || [],
        contactPhone: contactPhone,
        contactEmail: contactEmail,
        specialInstructions: specialInstructions,
        estimatedDeliveryTime: estimatedDeliveryTime,
        lastLocationUpdate: new Date(),
        lastGpsUpdate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      location: {
        latitude: dynamicSeller.currentLat,
        longitude: dynamicSeller.currentLng,
        accuracy: dynamicSeller.locationAccuracy,
        lastUpdate: dynamicSeller.lastLocationUpdate,
        isActive: dynamicSeller.isActive
      }
    });

  } catch (error) {
    console.error('Dynamic seller location update error:', error);
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

    // Get dynamic seller profile
    const dynamicSeller = await prisma.dynamicSeller.findUnique({
      where: {
        userId: (session as any)?.user?.id
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!dynamicSeller) {
      return NextResponse.json({ error: 'Geen dynamisch verkoper profiel gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      location: {
        latitude: dynamicSeller.currentLat,
        longitude: dynamicSeller.currentLng,
        accuracy: dynamicSeller.locationAccuracy,
        lastUpdate: dynamicSeller.lastLocationUpdate,
        isActive: dynamicSeller.isActive,
        deliveryRadius: dynamicSeller.deliveryRadius,
        availableTimeSlots: dynamicSeller.availableTimeSlots,
        contactPhone: dynamicSeller.contactPhone,
        contactEmail: dynamicSeller.contactEmail,
        specialInstructions: dynamicSeller.specialInstructions,
        estimatedDeliveryTime: dynamicSeller.estimatedDeliveryTime
      }
    });

  } catch (error) {
    console.error('Dynamic seller location fetch error:', error);
    return NextResponse.json(
      { error: 'Interne server fout' },
      { status: 500 }
    );
  }
}
