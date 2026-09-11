import { NextRequest, NextResponse } from 'next/server';
import { getProfileTrustReviews } from '@/lib/trust/profile-trust-reviews';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/[userId]/trust-reviews
 * Public list of submitted reviews (text + photos) for Vertrouwen / public profile.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const takeRaw = searchParams.get('take');
    const take = takeRaw ? Number(takeRaw) : 20;

    const payload = await getProfileTrustReviews(userId, {
      take: Number.isFinite(take) ? take : 20,
      cursor,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('trust-reviews error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
