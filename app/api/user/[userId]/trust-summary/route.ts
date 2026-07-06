import { NextResponse } from 'next/server';
import { getProfileTrustSummary } from '@/lib/trust/profile-trust-summary';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const summary = await getProfileTrustSummary(params.userId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[trust-summary]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
