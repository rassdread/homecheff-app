import { NextRequest, NextResponse } from 'next/server';
import { getEcosystemHubForCitySlug } from '@/lib/community/getEcosystemHubForCitySlug';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const city = (req.nextUrl.searchParams.get('city') || '').trim().toLowerCase();
  if (!city) {
    return NextResponse.json({ error: 'Missing city' }, { status: 400, headers: cors });
  }
  try {
    const payload = await getEcosystemHubForCitySlug(city);
    if (!payload) {
      return NextResponse.json({ error: 'Unknown city' }, { status: 404, headers: cors });
    }
    return NextResponse.json(payload, {
      headers: {
        ...cors,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    console.error('[community/ecosystem-hub]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors });
  }
}
