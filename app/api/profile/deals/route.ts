import { NextRequest, NextResponse } from 'next/server';
import {
  handleTrustServiceError,
  resolveTrustApiUser,
} from '@/lib/trust/trust-api';
import { listCommunityOrdersForUser } from '@/lib/trust/community-order-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await resolveTrustApiUser();
    if ('error' in authResult) return authResult.error;

    const status = req.nextUrl.searchParams.get('status');
    const filter =
      status === 'OPEN' || status === 'COMPLETED' || status === 'CANCELLED'
        ? status
        : undefined;

    const deals = await listCommunityOrdersForUser(authResult.userId, filter);
    return NextResponse.json({ deals });
  } catch (error) {
    return handleTrustServiceError(error);
  }
}
