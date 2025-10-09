// Global geocoding system for worldwide address lookup
import { calculateDistance } from './geocoding';

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  country: string;
  city: string;
  state?: string;
  error?: string;
  source: 'PDOK' | 'Nominatim' | 'GoogleMaps' | 'Manual';
}

export interface CountryConfig {
  code: string;
  name: string;
  region: string;
  geocodingService: 'PDOK' | 'Nominatim' | 'GoogleMaps' | 'Manual';
  postcodePattern?: RegExp;
  addressFormat: 'postcode_house' | 'street_city' | 'full_address';
  priority: number; // 1 = highest priority
}

// Country configurations with optimal geocoding services
export const COUNTRY_CONFIGS: CountryConfig[] = [
  // Tier 1: Official APIs (most accurate)
  { code: 'NL', name: 'Nederland', region: 'Europe', geocodingService: 'PDOK', postcodePattern: /^\d{4}[A-Z]{2}$/, addressFormat: 'postcode_house', priority: 1 },
  
  // Tier 2: Caribbean/Suriname (free, good quality)
  { code: 'CW', name: 'Curaçao', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'AW', name: 'Aruba', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'SX', name: 'Sint Maarten', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'SR', name: 'Suriname', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  
  // Tier 3: Major countries (paid, best quality)
  { code: 'US', name: 'Verenigde Staten', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'CA', name: 'Canada', region: 'North America', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'GB', name: 'Verenigd Koninkrijk', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'DE', name: 'Duitsland', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'FR', name: 'Frankrijk', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'ES', name: 'Spanje', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'IT', name: 'Italië', region: 'Europe', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'AU', name: 'Australië', region: 'Oceania', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  
  // Tier 4: Asian countries
  { code: 'JP', name: 'Japan', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'KR', name: 'Zuid-Korea', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'SG', name: 'Singapore', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'HK', name: 'Hong Kong', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'TH', name: 'Thailand', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'MY', name: 'Maleisië', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'ID', name: 'Indonesië', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'PH', name: 'Filipijnen', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'VN', name: 'Vietnam', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'IN', name: 'India', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  { code: 'CN', name: 'China', region: 'Asia', geocodingService: 'GoogleMaps', addressFormat: 'full_address', priority: 3 },
  
  // Tier 5: Other countries (fallback to Nominatim)
  { code: 'BE', name: 'België', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'CH', name: 'Zwitserland', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'AT', name: 'Oostenrijk', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'SE', name: 'Zweden', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'NO', name: 'Noorwegen', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'DK', name: 'Denemarken', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'FI', name: 'Finland', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'PL', name: 'Polen', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'CZ', name: 'Tsjechië', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'HU', name: 'Hongarije', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'RO', name: 'Roemenië', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'BG', name: 'Bulgarije', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'HR', name: 'Kroatië', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'SI', name: 'Slovenië', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'SK', name: 'Slowakije', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'LT', name: 'Litouwen', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'LV', name: 'Letland', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'EE', name: 'Estland', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'IE', name: 'Ierland', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'PT', name: 'Portugal', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'GR', name: 'Griekenland', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'CY', name: 'Cyprus', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'MT', name: 'Malta', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'LU', name: 'Luxemburg', region: 'Europe', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  
  // African countries
  { code: 'ZA', name: 'Zuid-Afrika', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'NG', name: 'Nigeria', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'KE', name: 'Kenia', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'EG', name: 'Egypte', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'MA', name: 'Marokko', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'TN', name: 'Tunesië', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'DZ', name: 'Algerije', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'GH', name: 'Ghana', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'ET', name: 'Ethiopië', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'UG', name: 'Oeganda', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'TZ', name: 'Tanzania', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'RW', name: 'Rwanda', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'BW', name: 'Botswana', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'NA', name: 'Namibië', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'ZM', name: 'Zambia', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'ZW', name: 'Zimbabwe', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'MW', name: 'Malawi', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'MZ', name: 'Mozambique', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'MG', name: 'Madagaskar', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'MU', name: 'Mauritius', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'SC', name: 'Seychellen', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'RE', name: 'Réunion', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'YT', name: 'Mayotte', region: 'Africa', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  
  // South American countries
  { code: 'BR', name: 'Brazilië', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'AR', name: 'Argentinië', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'CL', name: 'Chili', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'CO', name: 'Colombia', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'PE', name: 'Peru', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'VE', name: 'Venezuela', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'EC', name: 'Ecuador', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'BO', name: 'Bolivia', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'PY', name: 'Paraguay', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'UY', name: 'Uruguay', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'GY', name: 'Guyana', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'GF', name: 'Frans-Guyana', region: 'South America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  
  // Central American countries
  { code: 'MX', name: 'Mexico', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'GT', name: 'Guatemala', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'BZ', name: 'Belize', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'SV', name: 'El Salvador', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'HN', name: 'Honduras', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'NI', name: 'Nicaragua', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'CR', name: 'Costa Rica', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  { code: 'PA', name: 'Panama', region: 'North America', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 4 },
  
  // Caribbean countries (additional)
  { code: 'JM', name: 'Jamaica', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'TT', name: 'Trinidad en Tobago', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'BB', name: 'Barbados', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'BS', name: 'Bahamas', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'CU', name: 'Cuba', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'DO', name: 'Dominicaanse Republiek', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'HT', name: 'Haïti', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'PR', name: 'Puerto Rico', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'VI', name: 'Amerikaanse Maagdeneilanden', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'VG', name: 'Britse Maagdeneilanden', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'AG', name: 'Antigua en Barbuda', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'DM', name: 'Dominica', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'GD', name: 'Grenada', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'KN', name: 'Saint Kitts en Nevis', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'LC', name: 'Saint Lucia', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'VC', name: 'Saint Vincent en de Grenadines', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
  { code: 'BQ', name: 'Bonaire, Sint Eustatius en Saba', region: 'Caribbean', geocodingService: 'Nominatim', addressFormat: 'street_city', priority: 2 },
];

export function getCountryConfig(countryCode: string): CountryConfig | undefined {
  return COUNTRY_CONFIGS.find(country => country.code === countryCode);
}

export function getCountriesByRegion() {
  const regions = COUNTRY_CONFIGS.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = [];
    }
    acc[country.region].push(country);
    return acc;
  }, {} as Record<string, CountryConfig[]>);

  return regions;
}

export function isCaribbeanCountry(countryCode: string): boolean {
  const country = getCountryConfig(countryCode);
  return country?.region === 'Caribbean' || country?.region === 'South America';
}

export function hasFreeGeocoding(countryCode: string): boolean {
  const country = getCountryConfig(countryCode);
  return country?.geocodingService === 'PDOK' || country?.geocodingService === 'Nominatim';
}

// OpenStreetMap Nominatim geocoding
export async function geocodeWithNominatim(
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
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return {
        lat: 0,
        lng: 0,
        formatted_address: '',
        country: countryCode,
        city: city,
        source: 'Nominatim',
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
      city: addressDetails.city || addressDetails.town || addressDetails.village || city,
      state: addressDetails.state,
      source: 'Nominatim'
    };

  } catch (error) {
    console.error('Nominatim geocoding error:', error);
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      source: 'Nominatim',
      error: error instanceof Error ? error.message : 'Geocoding mislukt'
    };
  }
}

// Google Maps Geocoding API
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
        source: 'GoogleMaps',
        error: data.error_message || 'Adres niet gevonden'
      };
    }

    const result = data.results[0];
    const location = result.geometry.location;
    const addressComponents = result.address_components || [];
    
    const countryComponent = addressComponents.find((comp: any) => comp.types.includes('country'));
    const cityComponent = addressComponents.find((comp: any) => 
      comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')
    );
    const stateComponent = addressComponents.find((comp: any) => 
      comp.types.includes('administrative_area_level_1')
    );

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      country: countryComponent?.short_name || countryCode,
      city: cityComponent?.long_name || city,
      state: stateComponent?.long_name,
      source: 'GoogleMaps'
    };

  } catch (error) {
    console.error('Google Maps geocoding error:', error);
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      source: 'GoogleMaps',
      error: error instanceof Error ? error.message : 'Google Maps geocoding mislukt'
    };
  }
}

// Main geocoding function
export async function geocodeAddress(
  address: string,
  city: string,
  countryCode: string,
  googleMapsApiKey?: string
): Promise<GeocodeResult> {
  const country = getCountryConfig(countryCode);
  
  if (!country) {
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      source: 'Manual',
      error: 'Land niet ondersteund'
    };
  }

  // For Netherlands, redirect to Dutch geocoding API
  if (country.geocodingService === 'PDOK') {
    return {
      lat: 0,
      lng: 0,
      formatted_address: '',
      country: countryCode,
      city: city,
      source: 'PDOK',
      error: 'Gebruik Nederlandse geocoding API'
    };
  }

  // For Google Maps countries
  if (country.geocodingService === 'GoogleMaps' && googleMapsApiKey) {
    const result = await geocodeWithGoogleMaps(address, city, countryCode, googleMapsApiKey);
    if (!result.error) return result;
    
    // Fallback to Nominatim if Google Maps fails
    console.warn(`Google Maps failed for ${countryCode}, falling back to Nominatim`);
  }

  // For Nominatim countries or as fallback
  if (country.geocodingService === 'Nominatim') {
    return await geocodeWithNominatim(address, city, countryCode);
  }

  // Final fallback to Nominatim
  console.warn(`Using Nominatim fallback for ${countryCode}`);
  return await geocodeWithNominatim(address, city, countryCode);
}

// Calculate distance between two addresses
export function calculateDistanceBetweenAddresses(
  address1: { lat: number; lng: number },
  address2: { lat: number; lng: number }
): number {
  if (!address1.lat || !address1.lng || !address2.lat || !address2.lng) {
    return 0;
  }

  return calculateDistance(address1.lat, address1.lng, address2.lat, address2.lng);
}

// Get address format for UI
export function getAddressFormat(countryCode: string): 'postcode_house' | 'street_city' | 'full_address' {
  const country = getCountryConfig(countryCode);
  return country?.addressFormat || 'street_city';
}

// Check if postcode is valid for country
export function isValidPostcode(postcode: string, countryCode: string): boolean {
  const country = getCountryConfig(countryCode);
  if (!country?.postcodePattern) return true; // No validation if no pattern
  
  return country.postcodePattern.test(postcode);
}

