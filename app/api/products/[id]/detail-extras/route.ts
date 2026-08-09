import { NextRequest, NextResponse } from 'next/server';
import { loadListingDetailExtras } from '@/lib/marketplace/detail/load-listing-detail-extras';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';

export const dynamic = 'force-dynamic';

/** Deferred listing enrichment — must not block first paint. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: raw } = await params;
  const id = resolveProductIdFromParam(raw);
  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const extras = await loadListingDetailExtras(id);
  if (!extras) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(extras, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
    },
  });
}
