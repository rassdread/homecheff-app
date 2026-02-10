import { NextRequest, NextResponse } from 'next/server';
import { getRouteDistance } from '@/lib/google-maps-distance';

/**
 * API route for calculating Google Maps route distances
 * Supports both single and batch requests
 * 
 * POST /api/distance
 * Body: {
 *   origin: { lat: number, lng: number },
 *   destinations: Array<{ lat: number, lng: number, id?: string }>,
 *   mode?: 'driving' | 'walking' | 'bicycling'
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destinations, mode = 'driving' } = body;

    if (!origin || !origin.lat || !origin.lng) {
      return NextResponse.json(
        { error: 'Origin is required with lat and lng' },
        { status: 400 }
      );
    }

    if (!destinations || !Array.isArray(destinations) || destinations.length === 0) {
      return NextResponse.json(
        { error: 'Destinations array is required' },
        { status: 400 }
      );
    }

    // Limit to 25 destinations per request (Google Maps API limit)
    if (destinations.length > 25) {
      return NextResponse.json(
        { error: 'Maximum 25 destinations per request' },
        { status: 400 }
      );
    }

    // Calculate distances for all destinations
    const results = await Promise.all(
      destinations.map(async (dest: { lat: number; lng: number; id?: string }) => {
        if (!dest.lat || !dest.lng) {
          return {
            id: dest.id,
            error: 'Invalid destination coordinates'
          };
        }

        const result = await getRouteDistance(
          { lat: origin.lat, lng: origin.lng },
          { lat: dest.lat, lng: dest.lng },
          mode
        );

        if ('error' in result) {
          return {
            id: dest.id,
            error: result.error,
            message: result.message
          };
        }

        return {
          id: dest.id,
          distance: result.distance,
          duration: result.duration,
          distanceText: result.distanceText,
          durationText: result.durationText
        };
      })
    );

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Distance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}






















