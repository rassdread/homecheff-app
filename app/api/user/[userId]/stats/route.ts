import { NextRequest, NextResponse } from 'next/server';
import { getCorsHeaders } from '@/lib/apiCors';
import {
  computeUserPublicStats,
  toUserStatsTilePayload,
  EMPTY_USER_PUBLIC_STATS,
} from '@/lib/stats/compute-user-public-stats';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const cors = getCorsHeaders(request);
  try {
    const { userId } = await params;

    if (!userId || typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
      return NextResponse.json(toUserStatsTilePayload(EMPTY_USER_PUBLIC_STATS), {
        status: 200,
        headers: cors,
      });
    }

    const stats = await computeUserPublicStats(userId);
    return NextResponse.json(toUserStatsTilePayload(stats), { headers: cors });
  } catch (error) {
    console.error('Error in /api/user/[userId]/stats:', error);
    return NextResponse.json(toUserStatsTilePayload(EMPTY_USER_PUBLIC_STATS), {
      headers: cors,
    });
  }
}
