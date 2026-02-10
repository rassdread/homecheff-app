// Google Maps Distance Matrix API integration
// Calculates route distances and travel times between locations
import { calculateDistance } from './geocoding';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface RouteDistance {
  distance: number; // in kilometers
  duration: number; // in minutes
  distanceText: string; // formatted distance (e.g., "7.8 km")
  durationText: string; // formatted duration (e.g., "12 min")
}

export interface RouteDistanceError {
  error: string;
  message: string;
}

// Simple in-memory cache (in production, use Redis or similar)
const distanceCache = new Map<string, { result: RouteDistance; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get route distance and duration between two points using Google Maps Distance Matrix API
 * Falls back to Haversine formula if API key is not available
 */
export async function getRouteDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'driving' | 'walking' | 'bicycling' = 'driving'
): Promise<RouteDistance | RouteDistanceError> {
  // Check if API key is available
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ GOOGLE_MAPS_API_KEY not found - using Haversine fallback');
    return getHaversineDistance(origin, destination);
  }

  // Create cache key
  const cacheKey = `${origin.lat},${origin.lng}|${destination.lat},${destination.lng}|${mode}`;
  
  // Check cache
  const cached = distanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}&units=metric`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
      // Fallback to Haversine if API fails
      console.warn('Google Maps API returned error, using Haversine fallback:', data.status);
      return getHaversineDistance(origin, destination);
    }

    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      // Fallback to Haversine if route not found
      console.warn('Google Maps route not found, using Haversine fallback');
      return getHaversineDistance(origin, destination);
    }

    const distanceKm = element.distance.value / 1000; // Convert meters to kilometers
    const durationMinutes = Math.ceil(element.duration.value / 60); // Convert seconds to minutes

    const result: RouteDistance = {
      distance: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
      duration: durationMinutes,
      distanceText: element.distance.text,
      durationText: element.duration.text
    };

    // Cache the result
    distanceCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;

  } catch (error) {
    console.error('Google Maps Distance Matrix error:', error);
    // Fallback to Haversine on error
    return getHaversineDistance(origin, destination);
  }
}

/**
 * Fallback: Calculate distance using Haversine formula (hemelsbreed)
 * Uses the centralized calculateDistance function from lib/geocoding.ts
 */
function getHaversineDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): RouteDistance {
  const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

  // Estimate duration: ~50 km/h average for driving
  const estimatedDuration = Math.ceil((distance / 50) * 60);

  return {
    distance: Math.round(distance * 10) / 10,
    duration: estimatedDuration,
    distanceText: `${distance.toFixed(1)} km`,
    durationText: `~${estimatedDuration} min`
  };
}

/**
 * Batch calculate distances for multiple destinations from one origin
 * More efficient than multiple single calls
 */
export async function getBatchRouteDistances(
  origin: { lat: number; lng: number },
  destinations: Array<{ lat: number; lng: number }>,
  mode: 'driving' | 'walking' | 'bicycling' = 'driving'
): Promise<Array<RouteDistance | RouteDistanceError>> {
  if (!GOOGLE_MAPS_API_KEY || destinations.length === 0) {
    // Fallback to individual Haversine calculations
    return Promise.all(
      destinations.map(dest => getRouteDistance(origin, dest, mode))
    );
  }

  try {
    const destString = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destString}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}&units=metric`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
      // Fallback to Haversine
      return Promise.all(
        destinations.map(dest => getHaversineDistance(origin, dest))
      );
    }

    const elements = data.rows[0]?.elements || [];

    return elements.map((element: any, index: number) => {
      if (element.status !== 'OK') {
        return getHaversineDistance(origin, destinations[index]);
      }

      const distanceKm = element.distance.value / 1000;
      const durationMinutes = Math.ceil(element.duration.value / 60);

      return {
        distance: Math.round(distanceKm * 10) / 10,
        duration: durationMinutes,
        distanceText: element.distance.text,
        durationText: element.duration.text
      };
    });

  } catch (error) {
    console.error('Google Maps batch distance error:', error);
    // Fallback to Haversine
    return Promise.all(
      destinations.map(dest => getHaversineDistance(origin, dest))
    );
  }
}

/**
 * Clear the distance cache (useful for testing or manual cache clearing)
 */
export function clearDistanceCache(): void {
  distanceCache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: distanceCache.size,
    keys: Array.from(distanceCache.keys())
  };
}

