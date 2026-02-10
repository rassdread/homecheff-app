// International geocoding utilities
import { calculateDistance } from './geocoding';

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  country: string;
  city: string;
  error?: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  region: string;
  hasFreeGeocoding: boolean;
  postcodePattern?: RegExp;
}

// Countries with free geocoding support
export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  // Netherlands - PDOK API
  { code: 'NL', name: 'Nederland', region: 'Europe', hasFreeGeocoding: true, postcodePattern: /^\d{4}[A-Z]{2}$/ },
  
  // Caribbean countries - OpenStreetMap
  { code: 'CW', name: 'Curaçao', region: 'Caribbean', hasFreeGeocoding: true },
  { code: 'AW', name: 'Aruba', region: 'Caribbean', hasFreeGeocoding: true },
  { code: 'SX', name: 'Sint Maarten', region: 'Caribbean', hasFreeGeocoding: true },
  { code: 'SR', name: 'Suriname', region: 'South America', hasFreeGeocoding: true },
  
  // Other countries - require paid API
  { code: 'BE', name: 'België', region: 'Europe', hasFreeGeocoding: false },
  { code: 'DE', name: 'Duitsland', region: 'Europe', hasFreeGeocoding: false },
  { code: 'FR', name: 'Frankrijk', region: 'Europe', hasFreeGeocoding: false },
  { code: 'ES', name: 'Spanje', region: 'Europe', hasFreeGeocoding: false },
  { code: 'IT', name: 'Italië', region: 'Europe', hasFreeGeocoding: false },
  { code: 'GB', name: 'Verenigd Koninkrijk', region: 'Europe', hasFreeGeocoding: false },
  { code: 'US', name: 'Verenigde Staten', region: 'North America', hasFreeGeocoding: false },
  { code: 'CA', name: 'Canada', region: 'North America', hasFreeGeocoding: false },
  { code: 'AU', name: 'Australië', region: 'Oceania', hasFreeGeocoding: false },
];

export function getCountryInfo(countryCode: string): CountryInfo | undefined {
  return SUPPORTED_COUNTRIES.find(country => country.code === countryCode);
}

export function isCaribbeanCountry(countryCode: string): boolean {
  const country = getCountryInfo(countryCode);
  return country?.region === 'Caribbean' || country?.region === 'South America';
}

export function hasFreeGeocoding(countryCode: string): boolean {
  const country = getCountryInfo(countryCode);
  return country?.hasFreeGeocoding || false;
}

// OpenStreetMap Nominatim geocoding for international addresses
export async function geocodeInternationalAddress(
  address: string,
  city: string,
  countryCode: string
): Promise<GeocodeResult> {
  try {
    const query = `${address}, ${city}, ${countryCode}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=${countryCode.toLowerCase()}&limit=1&addressdetails=1`,
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
        lat: 0,
        lng: 0,
        formatted_address: '',
        country: countryCode,
        city: city,
        error: 'Adres niet gevonden'
      };
    }

    const result = data[0];
    const addressDetails = result.address || {};
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name,
      country: addressDetails.country_code?.toUpperCase() || countryCode,
      city: addressDetails.city || addressDetails.town || addressDetails.village || city
    };

  } catch (error) {
    console.error('International geocoding error:', error);
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      error: error instanceof Error ? error.message : 'Geocoding mislukt'
    };
  }
}

// Google Maps Geocoding API (requires API key)
export async function geocodeWithGoogleMaps(
  address: string,
  city: string,
  countryCode: string,
  apiKey: string
): Promise<GeocodeResult> {
  try {
    const query = `${address}, ${city}, ${countryCode}`;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return {
        lat: 0,
        lng: 0,
        formatted_address: '',
        country: countryCode,
        city: city,
        error: data.error_message || 'Adres niet gevonden'
      };
    }

    const result = data.results[0];
    const location = result.geometry.location;
    const addressComponents = result.address_components || [];
    
    // Extract country and city from address components
    const countryComponent = addressComponents.find((comp: any) => comp.types.includes('country'));
    const cityComponent = addressComponents.find((comp: any) => 
      comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')
    );

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      country: countryComponent?.short_name || countryCode,
      city: cityComponent?.long_name || city
    };

  } catch (error) {
    console.error('Google Maps geocoding error:', error);
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      error: error instanceof Error ? error.message : 'Google Maps geocoding mislukt'
    };
  }
}

// Main geocoding function that chooses the right service
export async function geocodeAddress(
  address: string,
  city: string,
  countryCode: string,
  googleMapsApiKey?: string
): Promise<GeocodeResult> {
  const country = getCountryInfo(countryCode);
  
  if (!country) {
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      error: 'Land niet ondersteund'
    };
  }

  // For Netherlands, use Dutch geocoding (PDOK)
  if (countryCode === 'NL') {
    // This should be handled by the Dutch geocoding API
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      error: 'Gebruik Nederlandse geocoding API'
    };
  }

  // For countries with free geocoding, use OpenStreetMap
  if (country.hasFreeGeocoding) {
    return await geocodeInternationalAddress(address, city, countryCode);
  }

  // For other countries, use Google Maps if API key is available
  if (googleMapsApiKey) {
    return await geocodeWithGoogleMaps(address, city, countryCode, googleMapsApiKey);
  }

  // Fallback to OpenStreetMap for unsupported countries
  console.warn(`Using OpenStreetMap fallback for ${countryCode}`);
  return await geocodeInternationalAddress(address, city, countryCode);
}

// Calculate distance between two points (works globally)
export function calculateDistanceBetweenAddresses(
  address1: { lat: number; lng: number },
  address2: { lat: number; lng: number }
): number {
  if (!address1.lat || !address1.lng || !address2.lat || !address2.lng) {
    return 0;
  }

  return calculateDistance(address1.lat, address1.lng, address2.lat, address2.lng);
}

// Get country list for UI
export function getCountryList() {
  const regions = SUPPORTED_COUNTRIES.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = [];
    }
    acc[country.region].push(country);
    return acc;
  }, {} as Record<string, CountryInfo[]>);

  return regions;
}