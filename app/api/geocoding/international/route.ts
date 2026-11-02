import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, isValidPostcode } from "@/lib/global-geocoding";
import { storedRecordLookupRejection } from "@/lib/geo/geocode-request-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const city = searchParams.get('city');
    const postalCode = searchParams.get('postalCode');
    const country = searchParams.get('country') || 'NL';
    const blocked = storedRecordLookupRejection(Object.fromEntries(searchParams.entries()));
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 400 });
    }

    if (!address || !city || !postalCode) {
      return NextResponse.json({ 
        error: 'Adres, stad en postcode zijn verplicht' 
      }, { status: 400 });
    }

    // Validate postal code format
    if (!isValidPostcode(postalCode, country)) {
      return NextResponse.json({ 
        error: `Ongeldig postcode formaat voor ${country}. Gebruik het juiste formaat.` 
      }, { status: 400 });
    }

    const result = await geocodeAddress(address, city, country);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API error during international geocoding:', error);
    return NextResponse.json({ 
      error: 'Serverfout bij adres lookup' 
    }, { status: 500 });
  }
}
