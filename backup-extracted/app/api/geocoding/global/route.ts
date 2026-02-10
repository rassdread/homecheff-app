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

    // Check if country is supported
    const country = getCountryConfig(countryCode);
    if (!country) {
      return NextResponse.json(
        { error: `Country ${countryCode} is not supported` },
        { status: 400 }
      );
    }

    // Get address format for this country
    const addressFormat = getAddressFormat(countryCode);
    
    // Geocode the address
    const result = await geocodeAddress(address, city, countryCode, googleMapsApiKey || undefined);

    return NextResponse.json({
      ...result,
      addressFormat,
      countryName: country.name,
      region: country.region
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

    // Check if country is supported
    const country = getCountryConfig(countryCode);
    if (!country) {
      return NextResponse.json(
        { error: `Country ${countryCode} is not supported` },
        { status: 400 }
      );
    }

    // Get address format for this country
    const addressFormat = getAddressFormat(countryCode);
    
    // Geocode the address
    const result = await geocodeAddress(address, city, countryCode, googleMapsApiKey || undefined);

    return NextResponse.json({
      ...result,
      addressFormat,
      countryName: country.name,
      region: country.region
    });

  } catch (error) {
    console.error('Global geocoding error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    );
  }
}
