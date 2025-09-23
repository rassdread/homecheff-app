import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { lat, lng, deliveryDate, deliveryTime, maxRadius = 10 } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ 
        error: 'Coördinaten zijn vereist' 
      }, { status: 400 });
    }

    // Find active delivery profiles within radius
    const availableProfiles = await prisma.deliveryProfile.findMany({
      where: {
        isActive: true,
        // In a real app, you would use PostGIS or calculate distance in SQL
        // For now, we'll get all active profiles and filter by distance
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Calculate distance for each profile (mock implementation)
    // In production, you'd use the actual coordinates from deliveryProfile
    const profilesInRange = availableProfiles.filter(profile => {
      // Mock: assume all active profiles are within range for demo
      // In real app, calculate actual distance using coordinates
      return true;
    });

    // Check availability based on delivery time
    const requestedDate = deliveryDate ? new Date(deliveryDate) : new Date();
    const isWeekend = requestedDate.getDay() === 0 || requestedDate.getDay() === 6;
    const requestedHour = deliveryTime ? parseInt(deliveryTime.split(':')[0]) : new Date().getHours();

    // Filter by availability (mock business hours: 9-21, more limited on weekends)
    const availableProfilesFiltered = profilesInRange.filter(profile => {
      // Check if profile has availability for this time slot
      // For demo, assume all profiles are available during business hours
      const isBusinessHours = requestedHour >= 9 && requestedHour <= 21;
      const isWeekendAvailable = isWeekend ? requestedHour >= 10 && requestedHour <= 18 : true;
      
      return isBusinessHours && isWeekendAvailable;
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