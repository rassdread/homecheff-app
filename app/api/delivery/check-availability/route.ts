import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geocoding';
import { getRouteDistance } from '@/lib/google-maps-distance';
import { delivererMatchingWhere } from '@/lib/delivery/delivery-eligibility';
import { resolveDelivererPosition } from '@/lib/delivery/delivery-position';
import { expireExpiredTemporaryOnline } from '@/lib/delivery/delivery-online-session';
import { resolveDeliveryTimeAvailability } from '@/lib/delivery/delivery-time-availability';

export async function POST(req: NextRequest) {
  try {
    const {
      lat,
      lng,
      deliveryDate,
      deliveryTime,
      sellerLat,
      sellerLng,
      sellerCountry,
    } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ 
        error: 'Coördinaten zijn vereist' 
      }, { status: 400 });
    }

    const countryFilter = sellerCountry
      ? String(sellerCountry).trim().toUpperCase()
      : null;

    await expireExpiredTemporaryOnline(prisma);

    // Find active delivery profiles with GPS coordinates
    const availableProfiles = await prisma.deliveryProfile.findMany({
      where: {
        ...delivererMatchingWhere(),
        user: {
          lat: { not: null },
          lng: { not: null },
          ...(countryFilter ? { country: countryFilter } : {}),
        }
      },
      select: {
        id: true,
        maxDistance: true,
        nationalCoverage: true,
        gpsTrackingEnabled: true,
        currentLat: true,
        currentLng: true,
        lastGpsUpdate: true,
        homeLat: true,
        homeLng: true,
        isOnline: true,
        lastOnlineAt: true,
        onlineUntil: true,
        availableDays: true,
        availableTimeSlots: true,
        workStartTime: true,
        workEndTime: true,
        temporaryOffline: true,
        user: {
          select: {
            id: true,
            name: true,
            lat: true,
            lng: true,
            country: true,
          }
        }
      }
    });

    // Calculate distance for each profile using Google Maps and filter within radius
    const profilesWithDistances = await Promise.all(
      availableProfiles.map(async (profile) => {
        const position = resolveDelivererPosition(profile);
        if (!position) return null;

        const delivererLat = position.lat;
        const delivererLng = position.lng;

        // Calculate route distance from deliverer to buyer location using Google Maps
        const routeToBuyer = await getRouteDistance(
          { lat: delivererLat, lng: delivererLng },
          { lat, lng },
          'driving'
        );
        const distanceToBuyer = 'distance' in routeToBuyer
          ? Math.round(routeToBuyer.distance * 10) / 10
          : Math.round(calculateDistance(delivererLat, delivererLng, lat, lng) * 10) / 10;

        let distanceToSeller = 0;
        if (sellerLat && sellerLng) {
          // Calculate route distance from deliverer to seller using Google Maps
          const routeToSeller = await getRouteDistance(
            { lat: delivererLat, lng: delivererLng },
            { lat: sellerLat, lng: sellerLng },
            'driving'
          );
          distanceToSeller = 'distance' in routeToSeller
            ? Math.round(routeToSeller.distance * 10) / 10
            : Math.round(calculateDistance(delivererLat, delivererLng, sellerLat, sellerLng) * 10) / 10;
        }

        return {
          ...profile,
          distanceToBuyer,
          distanceToSeller
        };
      })
    );

    const profilesInRange = profilesWithDistances.filter(
      (profile): profile is NonNullable<typeof profile> => {
        if (!profile) return false;
        if (profile.nationalCoverage) {
          // National = same-country only (already filtered by sellerCountry when provided).
          return true;
        }
        if (sellerLat && sellerLng) {
          return (
            profile.distanceToSeller <= profile.maxDistance &&
            profile.distanceToBuyer <= profile.maxDistance
          );
        }
        return profile.distanceToBuyer <= profile.maxDistance;
      }
    );

    // Check availability based on delivery time
    const requestedDate = deliveryDate ? new Date(deliveryDate) : new Date();
    const probeAt = Number.isNaN(requestedDate.getTime()) ? new Date() : requestedDate;

    const availableProfilesFiltered = profilesInRange.filter((profile) =>
      resolveDeliveryTimeAvailability(
        {
          availableDays: profile.availableDays,
          availableTimeSlots: profile.availableTimeSlots,
          workStartTime: profile.workStartTime,
          workEndTime: profile.workEndTime,
          temporaryOffline: profile.temporaryOffline,
          isOnline: profile.isOnline,
          onlineUntil: profile.onlineUntil,
        },
        probeAt,
      ).available,
    );

    const isAvailable = availableProfilesFiltered.length > 0;
    const availableCount = availableProfilesFiltered.length;
    
    // Calculate estimated delivery time based on distance and availability
    let estimatedDeliveryTime = 30; // Default 30 minutes
    if (availableCount > 0) {
      // More available delivery people = faster delivery
      if (availableCount >= 3) {
        estimatedDeliveryTime = 20; // 20 minutes
      } else if (availableCount >= 2) {
        estimatedDeliveryTime = 25; // 25 minutes
      }
    }

    // Calculate delivery fee based on distance (mock)
    let deliveryFee = 200; // Base fee €2.00
    // In real app, calculate actual distance
    const mockDistance = Math.random() * 8 + 1; // 1-9 km for demo
    if (mockDistance > 3) {
      deliveryFee += Math.round((mockDistance - 3) * 50); // €0.50 per km after 3km
    }

    return NextResponse.json({
      isAvailable,
      availableCount,
      estimatedDeliveryTime,
      deliveryFee,
      distance: Math.round(mockDistance * 10) / 10, // Round to 1 decimal
      profiles: availableProfilesFiltered.map(profile => ({
        id: profile.id,
        name: profile.user.name,
        estimatedTime: estimatedDeliveryTime,
        maxDistance: profile.maxDistance
      })),
      message: isAvailable 
        ? `${availableCount} bezorger${availableCount > 1 ? 's' : ''} beschikbaar (radius: ${availableProfilesFiltered[0]?.maxDistance || 'variabel'}km)`
        : 'Geen bezorgers beschikbaar in jouw regio op dit moment'
    });

  } catch (error) {
    console.error('Delivery availability check error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het controleren van bezorgbeschikbaarheid' 
    }, { status: 500 });
  }
}