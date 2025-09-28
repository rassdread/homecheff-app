import { getDistance, isPointWithinRadius } from 'geolib';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationWithCoordinates extends Coordinates {
  address?: string;
  city?: string;
}

// Calculate distance between two points in kilometers
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  return getDistance(point1, point2) / 1000; // Convert meters to kilometers
}

// Check if a point is within a radius of another point
export function isWithinRadius(
  center: Coordinates, 
  point: Coordinates, 
  radiusKm: number
): boolean {
  return isPointWithinRadius(point, center, radiusKm * 1000); // Convert km to meters
}

// Get user's current location
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

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${Math.round(distanceKm * 10) / 10}km`;
}



















