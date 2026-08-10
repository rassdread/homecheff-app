import { NextRequest, NextResponse } from 'next/server';
import { resolvePlaceInput } from '@/lib/geo/resolve-place-input';
import { getCorsHeaders } from '@/lib/apiCors';

/**
 * Write-time place resolution for create/edit/profile.
 * Not used by feed.
 */
export async function POST(request: NextRequest) {
  const cors = getCorsHeaders(request);
  try {
    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query : body.address;
    const countryCode =
      typeof body.countryCode === 'string' && body.countryCode.trim()
        ? body.countryCode.trim()
        : 'NL';

    if (!query?.trim()) {
      return NextResponse.json(
        { status: 'none', message: 'query and countryCode are required' },
        { status: 400, headers: cors },
      );
    }

    const result = await resolvePlaceInput({
      query: String(query),
      countryCode,
    });

    return NextResponse.json(result, { headers: cors });
  } catch (error) {
    console.error('[resolve-place]', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Locatie kon tijdelijk niet worden opgezocht.',
      },
      { status: 500, headers: cors },
    );
  }
}
