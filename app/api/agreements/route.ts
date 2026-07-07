import { NextRequest, NextResponse } from 'next/server';
import {
  handleTrustServiceError,
  resolveTrustApiUser,
} from '@/lib/trust/trust-api';
import { listAgreementsHubForUser } from '@/lib/agreements/agreements-hub-service';
import { AGREEMENTS_HUB_FILTERS } from '@/lib/agreements/agreements-hub-types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await resolveTrustApiUser();
    if ('error' in authResult) return authResult.error;

    const rawFilter = req.nextUrl.searchParams.get('filter') ?? '';
    const filter = (AGREEMENTS_HUB_FILTERS as readonly string[]).includes(
      rawFilter,
    )
      ? (rawFilter as (typeof AGREEMENTS_HUB_FILTERS)[number])
      : undefined;

    const hub = await listAgreementsHubForUser(authResult.userId, filter);
    return NextResponse.json(hub);
  } catch (error) {
    return handleTrustServiceError(error);
  }
}
