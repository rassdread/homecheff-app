import { NextRequest, NextResponse } from 'next/server';
import {
  geocodeAddress,
  geocodePlaceQuery,
  getCountryConfig,
  getAddressFormat,
} from '@/lib/global-geocoding';
import { getCorsHeaders } from '@/lib/apiCors';
import { storedRecordLookupRejection } from '@/lib/geo/geocode-request-guard';

export async function POST(request: NextRequest) {
  const cors = getCorsHeaders(request);
  try {
    const body = await request.json();
    const blocked = storedRecordLookupRejection(body);
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 400, headers: cors });
    }
    const { address, city, countryCode } = body;

    if (!address?.trim() || !countryCode) {
      return NextResponse.json(
        { error: 'Address (or place/postcode) and country code are required' },
        { status: 400, headers: cors }
      );
    }

    // Check if country is in config, but allow all countries via Google Maps
    const country = getCountryConfig(countryCode);
    
    // Get address format for this country (defaults to 'street_city' if not configured)
    const addressFormat = getAddressFormat(countryCode);
    
    const cityVal = city?.trim() || '';
    const result = cityVal
      ? await geocodeAddress(address, cityVal, countryCode)
      : await geocodePlaceQuery(address.trim(), countryCode);
    
    // Log errors only
    if (result.error) {
      console.error('Geocoding error:', result.error);
    }

    return NextResponse.json({
      ...result,
      addressFormat,
      countryName: country?.name || countryCode,
      region: country?.region || 'Unknown'
    }, { headers: cors });

  } catch (error) {
    console.error('Global geocoding error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500, headers: cors }
    );
  }
}

export async function GET(request: NextRequest) {
  const cors = getCorsHeaders(request);
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const city = searchParams.get('city');
    const countryCode = searchParams.get('countryCode');
    const blocked = storedRecordLookupRejection(Object.fromEntries(searchParams.entries()));
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 400, headers: cors });
    }

    if (!address?.trim() || !countryCode) {
      return NextResponse.json(
        { error: 'Address (or place/postcode) and country code are required' },
        { status: 400, headers: cors }
      );
    }

    // Check if country is in config, but allow all countries via Google Maps
    const country = getCountryConfig(countryCode);
    
    // Get address format for this country (defaults to 'street_city' if not configured)
    const addressFormat = getAddressFormat(countryCode);
    
    const cityVal = city?.trim() || '';
    const result = cityVal
      ? await geocodeAddress(address, cityVal, countryCode)
      : await geocodePlaceQuery(address.trim(), countryCode);

    return NextResponse.json({
      ...result,
      addressFormat,
      countryName: country?.name || countryCode,
      region: country?.region || 'Unknown'
    }, { headers: cors });

  } catch (error) {
    console.error('Global geocoding error:', error);
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500, headers: cors }
    );
  }
}
