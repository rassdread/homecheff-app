/**
 * Geolocation utilities for delivery system
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliveryLocation extends Coordinates {
  address?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinates
 * @param coord2 Second coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find available delivery profiles within radius of order location
 * @param orderLocation Order delivery location
 * @param deliveryProfiles Array of delivery profiles
 * @param maxRadius Maximum radius in kilometers (optional, uses profile's maxDistance)
 * @returns Filtered delivery profiles within radius
 */
export function findDeliveryProfilesInRadius(
  orderLocation: DeliveryLocation,
  deliveryProfiles: Array<{
    id: string;
    homeLat: number | null;
    homeLng: number | null;
    currentLat: number | null;
    currentLng: number | null;
    maxDistance: number;
    isActive: boolean;
    deliveryMode: string;
    deliveryRegions: string[];
    availableDays: string[];
    availableTimeSlots: string[];
  }>,
  maxRadius?: number
): Array<{
  id: string;
  distance: number;
  maxDistance: number;
  availableDays: string[];
  availableTimeSlots: string[];
  deliveryMode: string;
}> {
  if (!orderLocation.lat || !orderLocation.lng) {
    return [];
  }

  return deliveryProfiles
    .filter(profile => {
      // Must be active
      if (!profile.isActive) return false;
      
      // Check delivery mode and location
      if (profile.deliveryMode === 'FIXED') {
        // Fixed mode: use home location
        if (!profile.homeLat || !profile.homeLng) return false;
        
        const distance = calculateDistance(
          { lat: orderLocation.lat, lng: orderLocation.lng },
          { lat: profile.homeLat, lng: profile.homeLng }
        );
        
        const radius = maxRadius || profile.maxDistance;
        return distance <= radius;
      } else if (profile.deliveryMode === 'DYNAMIC') {
        // Dynamic mode: use current location if available, otherwise home location
        const useCurrentLocation = profile.currentLat && profile.currentLng;
        const lat = useCurrentLocation ? profile.currentLat : profile.homeLat;
        const lng = useCurrentLocation ? profile.currentLng : profile.homeLng;
        
        if (!lat || !lng) return false;
        
        const distance = calculateDistance(
          { lat: orderLocation.lat, lng: orderLocation.lng },
          { lat, lng }
        );
        
        const radius = maxRadius || profile.maxDistance;
        return distance <= radius;
      }
      
      return false;
    })
    .map(profile => {
      const useCurrentLocation = profile.deliveryMode === 'DYNAMIC' && profile.currentLat && profile.currentLng;
      const lat = useCurrentLocation ? profile.currentLat : profile.homeLat;
      const lng = useCurrentLocation ? profile.currentLng : profile.homeLng;
      
      const distance = calculateDistance(
        { lat: orderLocation.lat, lng: orderLocation.lng },
        { lat: lat!, lng: lng! }
      );
      
      return {
        id: profile.id,
        distance,
        maxDistance: profile.maxDistance,
        availableDays: profile.availableDays,
        availableTimeSlots: profile.availableTimeSlots,
        deliveryMode: profile.deliveryMode
      };
    })
    .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)
}

/**
 * Check if delivery profile is available at specific time
 * @param profile Delivery profile
 * @param dateTime Date and time to check
 * @returns Whether profile is available
 */
export function isProfileAvailable(
  profile: {
    availableDays: string[];
    availableTimeSlots: string[];
  },
  dateTime: Date
): boolean {
  const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const currentDay = dayNames[dateTime.getDay()];
  
  // Check if day is available
  if (!profile.availableDays.includes(currentDay)) {
    return false;
  }
  
  // Check time slot
  const hour = dateTime.getHours();
  let timeSlot = '';
  
  if (hour >= 6 && hour < 12) {
    timeSlot = 'morning';
  } else if (hour >= 12 && hour < 18) {
    timeSlot = 'afternoon';
  } else if (hour >= 18 && hour < 22) {
    timeSlot = 'evening';
  }
  
  return profile.availableTimeSlots.includes(timeSlot);
}

/**
 * Get current location from browser
 * @returns Promise with coordinates
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}
