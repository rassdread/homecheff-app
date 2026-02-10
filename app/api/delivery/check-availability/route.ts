import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geocoding';
import { getRouteDistance } from '@/lib/google-maps-distance';

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, deliveryDate, deliveryTime, sellerLat, sellerLng } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ 
        error: 'Coördinaten zijn vereist' 
      }, { status: 400 });
    }

    // Find active delivery profiles with GPS coordinates
    const availableProfiles = await prisma.deliveryProfile.findMany({
      where: {
        isActive: true,
        user: {
          lat: { not: null },
          lng: { not: null }
        }
      },
      select: {
        id: true,
        maxDistance: true,
        gpsTrackingEnabled: true,
        currentLat: true,
        currentLng: true,
        isOnline: true,
        availableDays: true,
        availableTimeSlots: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            lat: true,
            lng: true
          }
        }
      }
    });

    // Calculate distance for each profile using Google Maps and filter within radius
    // Priority: Use GPS location (currentLat/currentLng) if GPS tracking is enabled and online, otherwise use home location (user.lat/lng)
    const profilesWithDistances = await Promise.all(
      availableProfiles.map(async (profile) => {
        // Determine which location to use: GPS location if enabled and online, otherwise home location
        const useGpsLocation = profile.gpsTrackingEnabled && 
                               profile.isOnline && 
                               profile.currentLat && 
                               profile.currentLng;
        
        const delivererLat = useGpsLocation ? profile.currentLat! : profile.user.lat!;
        const delivererLng = useGpsLocation ? profile.currentLng! : profile.user.lng!;

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

    // Filter profiles within radius
    const profilesInRange = profilesWithDistances.filter(profile => {
      // If seller location provided, deliverer must be within radius of BOTH seller and buyer
      if (sellerLat && sellerLng) {
        return profile.distanceToSeller <= profile.maxDistance && 
               profile.distanceToBuyer <= profile.maxDistance;
      }

      // If no seller location, only check distance to buyer
      return profile.distanceToBuyer <= profile.maxDistance;
    });

    // Check availability based on delivery time
    const requestedDate = deliveryDate ? new Date(deliveryDate) : new Date();
    const requestedDay = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const requestedHour = deliveryTime ? parseInt(deliveryTime.split(':')[0]) : new Date().getHours();

    // Filter by time availability
    const availableProfilesFiltered = profilesInRange.filter(profile => {
      // Check if profile works on this day
      if (!profile.availableDays.includes(requestedDay as any)) {
        return false;
      }

      // Check if profile works in this time slot (with 3-hour window)
      const timeSlotAvailable = profile.availableTimeSlots.some((slot: string) => {
        const [startTime, endTime] = slot.split('-').map(t => parseInt(t.split(':')[0]));
        // Check if the requested hour + 3 hours window fits within the slot
        return requestedHour >= startTime && (requestedHour + 3) <= endTime;
      });
      
      return timeSlotAvailable;
    });

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