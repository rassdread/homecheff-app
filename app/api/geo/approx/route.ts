import { NextRequest, NextResponse } from 'next/server';
import { resolveIpApproxLocationOrNlFallback } from '@/lib/geo/ip-approx-location';

export const dynamic = 'force-dynamic';

/**
 * Approximate location for first-visit feed — no browser permission.
 * Uses edge geo headers; falls back to NL center when unavailable.
 */
export async function GET(req: NextRequest) {
  const approx = resolveIpApproxLocationOrNlFallback(req.headers);
  const label =
    approx.city ||
    approx.region ||
    (approx.country === 'NL' ? 'Nederland' : approx.country) ||
    null;

  return NextResponse.json(
    {
      lat: approx.lat,
      lng: approx.lng,
      city: approx.city,
      region: approx.region,
      country: approx.country,
      label,
      source: approx.source,
      precise: false,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    },
  );
}
