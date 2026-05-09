import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { getLeaderboardPayload } from '@/lib/gamification/leaderboard-queries';

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    const payload = await getLeaderboardPayload({ take: 20, currentUserId: userId });

    return NextResponse.json(payload);
  } catch (e) {
    console.error('[gamification/leaderboard]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
