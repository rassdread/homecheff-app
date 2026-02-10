import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress, getCountryConfig, getAddressFormat } from '@/lib/global-geocoding';

export async function POST(request: NextRequest) {
  try {
    const { address, city, countryCode, googleMapsApiKey } = await request.json();

    if (!address || !city || !countryCode) {
      return NextResponse.json(
        { error: 'Address, city, and country code are required' },
        { status: 400 }
      );
    }

    // Check if country is in config, but allow all countries via Google Maps
    const country = getCountryConfig(countryCode);
    
    // Get address format for this country (defaults to 'street_city' if not configured)
    const addressFormat = getAddressFormat(countryCode);
    
    // Use Google Maps API key from environment if not provided
    const apiKey = googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
    
    // Geocode the address (works for all countries via Google Maps)
    const result = await geocodeAddress(address, city, countryCode, apiKey);
    
    // Log errors only
    if (result.error) {
      console.error('Geocoding error:', result.error);
    }

    return NextResponse.json({
      ...result,
      addressFormat,
      countryName: country?.name || countryCode,
      region: country?.region || 'Unknown'
    });

  } catch (error) {
    console.error('Global geocoding error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const city = searchParams.get('city');
    const countryCode = searchParams.get('countryCode');
    const googleMapsApiKey = searchParams.get('googleMapsApiKey');

    if (!address || !city || !countryCode) {
      return NextResponse.json(
        { error: 'Address, city, and country code are required' },
        { status: 400 }
      );
    }

    // Check if country is in config, but allow all countries via Google Maps
    const country = getCountryConfig(countryCode);
    
    // Get address format for this country (defaults to 'street_city' if not configured)
    const addressFormat = getAddressFormat(countryCode);
    
    // Use Google Maps API key from environment if not provided
    const apiKey = googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;
    
    // Geocode the address (works for all countries via Google Maps)
    const result = await geocodeAddress(address, city, countryCode, apiKey);

    return NextResponse.json({
      ...result,
      addressFormat,
      countryName: country?.name || countryCode,
      region: country?.region || 'Unknown'
    });

  } catch (error) {
    console.error('Global geocoding error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    );
  }
}
