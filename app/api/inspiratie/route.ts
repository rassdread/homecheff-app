import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { getInspiratieItems } from '@/lib/getInspiratieItems';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  const headers = {
    ...cors,
    // Publieke inspiratie-content: korte edge-cache voor snellere eerste load.
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
  };
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const subcategory = searchParams.get('subcategory') || null;
    const region = searchParams.get('region') || 'all';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const q = searchParams.get('q')?.trim() || null;
    const takeParam = searchParams.get('take');
    const take = Math.min(Math.max(parseInt(takeParam || '24', 10) || 24, 1), 100);
    const skipParam = searchParams.get('skip');
    const skip = Math.max(parseInt(skipParam || '0', 10) || 0, 0);
    const feedScopeParam = searchParams.get('feedScope');
    const feedScope =
      feedScopeParam === 'nearby' ||
      feedScopeParam === 'national' ||
      feedScopeParam === 'international'
        ? feedScopeParam
        : null;
    const viewerLat = Number(searchParams.get('lat'));
    const viewerLng = Number(searchParams.get('lng'));
    const radiusKm = Number(searchParams.get('radiusKm'));

    const { items, hasMore, nextCursor } = await getInspiratieItems({
      category,
      subcategory,
      region,
      sortBy,
      take,
      skip,
      q,
      feedScope,
      cursor: searchParams.get('cursor'),
      viewerLat: Number.isFinite(viewerLat) ? viewerLat : null,
      viewerLng: Number.isFinite(viewerLng) ? viewerLng : null,
      radiusKm: Number.isFinite(radiusKm) ? radiusKm : null,
    });
    return NextResponse.json(
      {
        items,
        hasMore,
        nextCursor,
        pageLength: items.length,
      },
      { headers },
    );
  } catch (error) {
    console.error('❌ Error fetching inspiration items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspiration items' },
      { status: 500, headers }
    );
  }
}
