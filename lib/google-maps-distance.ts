// Google Maps Distance Matrix API integration
// Calculates route distances and travel times between locations
import { calculateDistance } from './geocoding';
import { assessMapsProductionConfig, serverDistanceMatrixKey } from '@/lib/delivery/maps-key-placement';

function mapsApiKey(override?: string | null): string {
  if (override !== undefined) return override || '';
  return serverDistanceMatrixKey();
}

export interface RouteDistance {
  distance: number; // in kilometers
  duration: number; // in minutes
  distanceText: string; // formatted distance (e.g., "7.8 km")
  durationText: string; // formatted duration (e.g., "12 min")
  distanceSource?: 'google' | 'haversine';
}

export const COMMERCIAL_DISTANCE_UNAVAILABLE = {
  code: 'DELIVERY_ROUTE_UNRELIABLE' as const,
  error:
    'De bezorgafstand kan momenteel niet betrouwbaar worden berekend. Probeer het later opnieuw.',
  message:
    'The delivery distance cannot currently be calculated reliably. Please try again later.',
};

export function isVerifiedRoadDistance(
  value: RouteDistance | RouteDistanceError | null | undefined,
): value is RouteDistance {
  return Boolean(
    value &&
      'distance' in value &&
      value.distanceSource === 'google' &&
      Number.isFinite(value.distance) &&
      value.distance > 0 &&
      Number.isFinite(value.duration) &&
      value.duration > 0,
  );
}

export function interpretDistanceMatrixElement(data: {
  status?: string;
  rows?: Array<{ elements?: Array<Record<string, unknown>> }>;
} | null | undefined): RouteDistance | null {
  if (!data || data.status !== 'OK' || !data.rows?.length) return null;
  const element = data.rows[0]?.elements?.[0] as
    | {
        status?: string;
        distance?: { value?: number; text?: string };
        duration?: { value?: number; text?: string };
      }
    | undefined;
  const meters = element?.distance?.value;
  const seconds = element?.duration?.value;
  if (
    element?.status !== 'OK' ||
    typeof meters !== 'number' ||
    !Number.isFinite(meters) ||
    meters <= 0 ||
    typeof seconds !== 'number' ||
    !Number.isFinite(seconds) ||
    seconds <= 0
  ) {
    return null;
  }
  const distanceKm = meters / 1000;
  const durationMinutes = Math.ceil(seconds / 60);
  return {
    distance: Math.round(distanceKm * 10) / 10,
    duration: durationMinutes,
    distanceText: element.distance?.text || `${distanceKm.toFixed(1)} km`,
    durationText: element.duration?.text || `${durationMinutes} min`,
    distanceSource: 'google',
  };
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
  mode: 'driving' | 'walking' | 'bicycling' = 'driving',
  options?: { fetchImpl?: typeof fetch; apiKey?: string | null; env?: NodeJS.ProcessEnv },
): Promise<RouteDistance | RouteDistanceError> {
  const env = options?.env ?? process.env;
  const productionConfig = assessMapsProductionConfig(env);
  if (productionConfig.runtime === 'production' && !productionConfig.payable) {
    return {
      error: productionConfig.reason,
      message: 'Distance Matrix is not configured for this production runtime.',
    };
  }
  const apiKey = mapsApiKey(options?.apiKey);
  const fetchImpl = options?.fetchImpl ?? fetch;
  const productionRuntime = productionConfig.runtime === 'production';
  // Check if API key is available
  if (!apiKey) {
    if (productionRuntime) {
      return {
        error: 'PRODUCTION_KEY_MISSING',
        message: 'Distance Matrix is not configured for this production runtime.',
      };
    }
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
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=${mode}&key=${apiKey}&units=metric`;
    
    const response = await fetchImpl(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();
    const result = interpretDistanceMatrixElement(data);
    if (!result) {
      if (productionRuntime) {
        return {
          error: 'DISTANCE_MATRIX_UNAVAILABLE',
          message: 'Distance Matrix did not return a road distance.',
        };
      }
      console.warn('Google Maps API returned error, using Haversine fallback:', data?.status);
      return getHaversineDistance(origin, destination);
    }

    // Cache the result
    distanceCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;

  } catch (error) {
    console.error('Google Maps Distance Matrix error:', error instanceof Error ? error.name : 'error');
    if (productionRuntime) {
      return {
        error: 'DISTANCE_MATRIX_UNAVAILABLE',
        message: 'Distance Matrix did not return a road distance.',
      };
    }
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
    durationText: `~${estimatedDuration} min`,
    distanceSource: 'haversine',
  };
}

/**
 * Batch calculate distances for multiple destinations from one origin
 * More efficient than multiple single calls
 */
export async function getBatchRouteDistances(
  origin: { lat: number; lng: number },
  destinations: Array<{ lat: number; lng: number }>,
  mode: 'driving' | 'walking' | 'bicycling' = 'driving',
  options?: { fetchImpl?: typeof fetch; env?: NodeJS.ProcessEnv },
): Promise<Array<RouteDistance | RouteDistanceError>> {
  const env = options?.env ?? process.env;
  const productionConfig = assessMapsProductionConfig(env);
  const productionRuntime = productionConfig.runtime === 'production';
  const unavailable = (): RouteDistanceError => ({
    error: productionConfig.payable ? 'DISTANCE_MATRIX_UNAVAILABLE' : productionConfig.reason,
    message: 'Distance Matrix is not configured for this production runtime.',
  });
  if (productionRuntime && !productionConfig.payable) {
    return destinations.map(() => unavailable());
  }
  const fetchImpl = options?.fetchImpl ?? fetch;
  const apiKey = serverDistanceMatrixKey(env);
  if (!apiKey || destinations.length === 0) {
    return Promise.all(
      destinations.map((dest) => getRouteDistance(origin, dest, mode, { env, fetchImpl, apiKey }))
    );
  }

  try {
    const destString = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destString}&mode=${mode}&key=${apiKey}&units=metric`;
    
    const response = await fetchImpl(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
      if (productionRuntime) return destinations.map(() => unavailable());
      return Promise.all(
        destinations.map(dest => getHaversineDistance(origin, dest))
      );
    }

    const elements = data.rows[0]?.elements || [];

    return elements.map((element: any, index: number) => {
      const interpreted = interpretDistanceMatrixElement({
        status: 'OK',
        rows: [{ elements: [element] }],
      });
      return interpreted ?? (productionRuntime
        ? unavailable()
        : getHaversineDistance(origin, destinations[index]));
    });

  } catch (error) {
    console.error('Google Maps batch distance error:', error instanceof Error ? error.name : 'error');
    if (productionRuntime) return destinations.map(() => unavailable());
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

