import { NextRequest, NextResponse } from 'next/server';
import { entityExistsForHttp404 } from '@/lib/seo/entity-exists-for-http-404';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Internal Node lookup for Edge middleware. Do not import Prisma in middleware.
 * GET /api/internal/entity-exists?pathname=/product/...
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  const expected = process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pathname = request.nextUrl.searchParams.get('pathname') || '';
  if (!pathname.startsWith('/')) {
    return NextResponse.json({ exists: null }, { status: 400 });
  }
  try {
    const exists = await entityExistsForHttp404(pathname);
    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json({ exists: null });
  }
}
