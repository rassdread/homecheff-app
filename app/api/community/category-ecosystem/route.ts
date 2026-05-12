import { NextRequest, NextResponse } from 'next/server';
import { getCategoryEcosystem } from '@/lib/community/getCategoryEcosystem';
import { getCorsHeaders } from '@/lib/apiCors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const ecosystem = (req.nextUrl.searchParams.get('ecosystem') || '').trim().toLowerCase();
  if (!ecosystem) {
    return NextResponse.json({ error: 'Missing ecosystem' }, { status: 400, headers: cors });
  }
  try {
    const payload = await getCategoryEcosystem(ecosystem);
    if (!payload) {
      return NextResponse.json({ error: 'Unknown ecosystem' }, { status: 404, headers: cors });
    }
    return NextResponse.json(payload, {
      headers: {
        ...cors,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e) {
    console.error('[community/category-ecosystem]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors });
  }
}
