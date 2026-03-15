import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import { getInspiratieItems } from '@/lib/getInspiratieItems';

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const subcategory = searchParams.get('subcategory') || null;
    const region = searchParams.get('region') || 'all';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const takeParam = searchParams.get('take');
    const take = Math.min(Math.max(parseInt(takeParam || '24', 10) || 24, 1), 100);
    const skipParam = searchParams.get('skip');
    const skip = Math.max(parseInt(skipParam || '0', 10) || 0, 0);

    const { items } = await getInspiratieItems({ category, subcategory, region, sortBy, take, skip });
    return NextResponse.json({ items, total: items.length }, { headers: cors });
  } catch (error) {
    console.error('❌ Error fetching inspiration items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspiration items' },
      { status: 500, headers: cors }
    );
  }
}
