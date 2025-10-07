import { NextResponse } from 'next/server';
import { getCountriesByRegion, COUNTRY_CONFIGS } from '@/lib/global-geocoding';

export async function GET() {
  try {
    const countriesByRegion = getCountriesByRegion();
    
    return NextResponse.json({
      countries: countriesByRegion,
      totalCountries: COUNTRY_CONFIGS.length,
      regions: Object.keys(countriesByRegion)
    });

  } catch (error) {
    console.error('Countries API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
