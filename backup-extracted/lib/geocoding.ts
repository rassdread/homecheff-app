// Geocoding service to convert addresses to coordinates
// Uses OpenStreetMap Nominatim API (free, no API key required)

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

export interface GeocodingError {
  error: string;
  message: string;
}

export async function geocodeAddress(
  address: string,
  city: string,
  postalCode: string
): Promise<GeocodingResult | GeocodingError> {
  try {
    // Construct the full address
    const fullAddress = `${address}, ${postalCode} ${city}, Nederland`;
    // Use OpenStreetMap Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=nl&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: 'Geen resultaten gevonden voor dit adres'
      };
    }

    const result = data[0];
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      error: 'GEOCODING_ERROR',
      message: error instanceof Error ? error.message : 'Onbekende fout bij geocoding'
    };
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | GeocodingError> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HomeCheff-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data.lat || !data.lon) {
      return {
        error: 'NO_RESULTS',
        message: 'Geen resultaten gevonden voor deze coördinaten'
      };
    }

    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      display_name: data.display_name,
      address: data.address
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      error: 'REVERSE_GEOCODING_ERROR',
      message: error instanceof Error ? error.message : 'Onbekende fout bij reverse geocoding'
    };
  }
}

// Helper function to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Check for null, undefined, or invalid coordinates
  if (!lat1 || !lng1 || !lat2 || !lng2 || 
      isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    return 0; // Return 0 if coordinates are invalid
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}