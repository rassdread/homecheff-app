import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { relationshipTierFromCounts } from '@/lib/relationship/relationshipTier';

export const dynamic = 'force-dynamic';

/**
 * Aggregate relationship footprint for the signed-in user (counts only).
 * Intended for calm “ecosystem” surfaces and internal analytics — not individual tracking.
 */
export async function GET(req: Request) {
  const cors = getCorsHeaders(req as Request);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: cors });
    }

    const [followingCount, favoritedCount, conversationThreadCount] = await Promise.all([
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.favorite.count({
        where: {
          userId: user.id,
          OR: [{ productId: { not: null } }, { listingId: { not: null } }, { dishId: { not: null } }],
        },
      }),
      prisma.conversationParticipant.count({ where: { userId: user.id } }),
    ]);

    const tier = relationshipTierFromCounts({
      followingCount,
      favoritedCount,
      conversationThreadCount,
    });

    return NextResponse.json(
      {
        followingCount,
        favoritedCount,
        conversationThreadCount,
        relationshipTier: tier,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          ...cors,
          'Cache-Control': 'private, no-store, max-age=0',
        },
      },
    );
  } catch (e) {
    console.error('[user/relationship-summary]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors });
  }
}
