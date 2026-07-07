import { NextRequest, NextResponse } from 'next/server';
import {
  handleTrustServiceError,
  resolveTrustApiUser,
} from '@/lib/trust/trust-api';
import {
  listUserProposals,
  USER_PROPOSAL_STATUS_FILTERS,
} from '@/lib/proposals/list-user-proposals';

export const dynamic = 'force-dynamic';

/** CE-2A.1 — user-wide proposals (pending / countered / accepted / rejected / cancelled). */
export async function GET(req: NextRequest) {
  try {
    const authResult = await resolveTrustApiUser();
    if ('error' in authResult) return authResult.error;

    const raw = req.nextUrl.searchParams.get('status') ?? '';
    const status = (USER_PROPOSAL_STATUS_FILTERS as readonly string[]).includes(
      raw,
    )
      ? (raw as (typeof USER_PROPOSAL_STATUS_FILTERS)[number])
      : undefined;

    const proposals = await listUserProposals(authResult.userId, status);
    return NextResponse.json({ proposals });
  } catch (error) {
    return handleTrustServiceError(error);
  }
}
