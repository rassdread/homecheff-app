import { NextRequest, NextResponse } from 'next/server';
import { geocodeDutchAddressWithFallback } from '@/lib/dutch-geocoding';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const huisnummer = searchParams.get('huisnummer');

    if (!postcode || !huisnummer) {
      return NextResponse.json({ 
        error: 'Postcode en huisnummer zijn verplicht' 
      }, { status: 400 });
    }

    const result = await geocodeDutchAddressWithFallback(postcode, huisnummer);

    if ('error' in result) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Dutch geocoding API error:', error);
    return NextResponse.json({ 
      error: 'Er is een fout opgetreden bij het opzoeken van het adres' 
    }, { status: 500 });
  }
}
