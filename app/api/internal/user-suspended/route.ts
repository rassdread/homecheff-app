import { NextRequest, NextResponse } from 'next/server';
import { isUserSuspended } from '@/lib/user-suspend';

export const dynamic = 'force-dynamic';

/**
 * Internal edge-safe suspension lookup for middleware (Node runtime).
 * GET /api/internal/user-suspended?userId=...
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret');
  const expected = process.env.INTERNAL_API_SECRET || process.env.NEXTAUTH_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get('userId')?.trim();
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const suspended = await isUserSuspended(userId);
  return NextResponse.json({ suspended });
}
