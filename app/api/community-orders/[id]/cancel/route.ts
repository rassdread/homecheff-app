import { NextRequest, NextResponse } from 'next/server';
import {
  handleTrustServiceError,
  resolveTrustApiUser,
} from '@/lib/trust/trust-api';
import { cancelCommunityOrder } from '@/lib/trust/community-order-service';

export const dynamic = 'force-dynamic';

/** CE-2A.4 — cancel an OPEN community order. Party-only; completed orders rejected. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await resolveTrustApiUser();
    if ('error' in authResult) return authResult.error;

    const body = (await req.json().catch(() => ({}))) as {
      reason?: string | null;
    };

    const result = await cancelCommunityOrder(
      authResult.userId,
      params.id,
      typeof body.reason === 'string' ? body.reason : null,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleTrustServiceError(error);
  }
}
