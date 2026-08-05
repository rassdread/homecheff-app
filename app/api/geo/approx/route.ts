import { NextRequest, NextResponse } from 'next/server';
import { resolveIpApproxLocationForBrowse } from '@/lib/geo/ip-approx-location';
import { countryOptionLabel } from '@/lib/geo/structured-location';

export const dynamic = 'force-dynamic';

/**
 * Approximate location for first-visit feed — no browser permission.
 * International: never invents NL for non-NL / unknown visitors.
 */
export async function GET(req: NextRequest) {
  const approx = resolveIpApproxLocationForBrowse(req.headers);
  const label =
    approx.city ||
    approx.region ||
    (approx.countryCode
      ? countryOptionLabel(approx.countryCode).replace(/\s*\([A-Z]{2}\)\s*$/, '')
      : null) ||
    (approx.mode === 'global' ? 'Global' : null);

  return NextResponse.json(
    {
      lat: approx.lat,
      lng: approx.lng,
      city: approx.city,
      region: approx.region,
      country: approx.country,
      countryCode: approx.countryCode,
      label,
      source: approx.source,
      mode: approx.mode,
      precise: false,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    },
  );
}
