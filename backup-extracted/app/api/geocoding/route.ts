import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, city, postalCode, lat, lng, action } = body;

    if (action === 'geocode' && address && city && postalCode) {
      // Geocode address to coordinates
      const result = await geocodeAddress(address, city, postalCode);
      
      if ('error' in result) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        lat: result.lat,
        lng: result.lng,
        display_name: result.display_name
      });
    }
    
    if (action === 'reverse' && lat && lng) {
      // Reverse geocode coordinates to address
      const result = await reverseGeocode(lat, lng);
      
      if ('error' in result) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        lat: result.lat,
        lng: result.lng,
        display_name: result.display_name,
        address: result.address
      });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
