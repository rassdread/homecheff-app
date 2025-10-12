import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, deliveryDate, deliveryTime, maxRadius = 10, sellerLat, sellerLng } = await req.json();

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
      include: {
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

    // Calculate distance for each profile and filter within radius
    const profilesInRange = availableProfiles.filter(profile => {
      if (!profile.user.lat || !profile.user.lng) return false;

      // Calculate distance from deliverer to buyer location
      const distanceToBuyer = calculateDistance(
        profile.user.lat,
        profile.user.lng,
        lat,
        lng
      );

      // If seller location provided, also check distance to seller
      if (sellerLat && sellerLng) {
        const distanceToSeller = calculateDistance(
          profile.user.lat,
          profile.user.lng,
          sellerLat,
          sellerLng
        );
        
        // Deliverer must be within radius of BOTH seller and buyer
        return distanceToSeller <= profile.maxDistance && 
               distanceToBuyer <= profile.maxDistance;
      }

      // If no seller location, only check distance to buyer
      return distanceToBuyer <= profile.maxDistance;
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
        estimatedTime: estimatedDeliveryTime
      })),
      message: isAvailable 
        ? `${availableCount} bezorger${availableCount > 1 ? 's' : ''} beschikbaar binnen ${maxRadius}km`
        : 'Geen bezorgers beschikbaar in jouw regio op dit moment'
    });

  } catch (error) {
    console.error('Delivery availability check error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het controleren van bezorgbeschikbaarheid' 
    }, { status: 500 });
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}