import { NextRequest, NextResponse } from 'next/server';
import {
  handleTrustServiceError,
  resolveTrustApiUser,
} from '@/lib/trust/trust-api';
import { completeCommunityOrder } from '@/lib/trust/community-order-service';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await resolveTrustApiUser();
    if ('error' in authResult) return authResult.error;

    const result = await completeCommunityOrder(authResult.userId, params.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleTrustServiceError(error);
  }
}
