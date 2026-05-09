import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLeaderboardPayload } from '@/lib/gamification/leaderboard-queries';
import {
  getScopedLeaderboardPayload,
  type LeaderboardPeriodParam,
  type LeaderboardScope,
} from '@/lib/gamification/leaderboard-scoped';
import { toPublicLeaderboardResponse } from '@/lib/gamification/leaderboard-public-response';

const SCOPES: LeaderboardScope[] = ['nearby', 'country', 'worldwide'];
const PERIODS: LeaderboardPeriodParam[] = ['week', 'month', 'year', 'all'];

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    const { searchParams } = new URL(req.url);
    const scopeParam = searchParams.get('scope');

    if (!scopeParam) {
      const payload = await getLeaderboardPayload({ take: 20, currentUserId: userId });
      return NextResponse.json(payload);
    }

    if (!SCOPES.includes(scopeParam as LeaderboardScope)) {
      return NextResponse.json({ error: 'Ongeldige scope' }, { status: 400 });
    }

    const periodRaw = searchParams.get('period') ?? 'week';
    if (!PERIODS.includes(periodRaw as LeaderboardPeriodParam)) {
      return NextResponse.json({ error: 'Ongeldige period' }, { status: 400 });
    }

    const radiusRaw = Number(searchParams.get('radiusKm') ?? '50');
    const radiusKm =
      radiusRaw === 25 || radiusRaw === 50 || radiusRaw === 100 ? radiusRaw : 50;

    const latRaw = searchParams.get('lat');
    const lngRaw = searchParams.get('lng');
    const lat = latRaw != null && latRaw !== '' ? Number(latRaw) : null;
    const lng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : null;

    const country = searchParams.get('country');

    const viewerProfile =
      userId != null
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { lat: true, lng: true, country: true },
          })
        : null;

    const payload = await getScopedLeaderboardPayload({
      take: 50,
      currentUserId: userId,
      scope: scopeParam as LeaderboardScope,
      period: periodRaw as LeaderboardPeriodParam,
      radiusKm: scopeParam === 'nearby' ? radiusKm : undefined,
      lat: lat != null && Number.isFinite(lat) ? lat : null,
      lng: lng != null && Number.isFinite(lng) ? lng : null,
      country: country ?? undefined,
      viewerProfile,
    });

    return NextResponse.json(toPublicLeaderboardResponse(payload));
  } catch (e) {
    console.error('[gamification/leaderboard]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
