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
import { normalizeCountryCode } from '@/lib/gamification/country-code';

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
    const allowedRadius = new Set([10, 25, 50, 100]);
    const radiusKm = allowedRadius.has(radiusRaw) ? radiusRaw : 50;

    const latRaw = searchParams.get('lat');
    const lngRaw = searchParams.get('lng');
    const lat = latRaw != null && latRaw !== '' ? Number(latRaw) : null;
    const lng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : null;

    const countryRaw = searchParams.get('country');
    const country =
      countryRaw != null && countryRaw.trim() !== ''
        ? normalizeCountryCode(countryRaw) ?? undefined
        : undefined;

    const limitRaw = searchParams.get('limit');
    let take = 50;
    if (limitRaw != null && limitRaw !== '') {
      const n = Number(limitRaw);
      if (Number.isFinite(n)) {
        take = Math.min(50, Math.max(1, Math.floor(n)));
      }
    }

    const viewerProfileRaw =
      userId != null
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { lat: true, lng: true, country: true },
          })
        : null;

    const viewerProfile = viewerProfileRaw
      ? {
          lat: viewerProfileRaw.lat,
          lng: viewerProfileRaw.lng,
          country: normalizeCountryCode(viewerProfileRaw.country ?? null),
        }
      : null;

    const payload = await getScopedLeaderboardPayload({
      take,
      currentUserId: userId,
      scope: scopeParam as LeaderboardScope,
      period: periodRaw as LeaderboardPeriodParam,
      radiusKm: scopeParam === 'nearby' ? radiusKm : undefined,
      lat: lat != null && Number.isFinite(lat) ? lat : null,
      lng: lng != null && Number.isFinite(lng) ? lng : null,
      country,
      viewerProfile,
    });

    return NextResponse.json(toPublicLeaderboardResponse(payload));
  } catch (e) {
    console.error('[gamification/leaderboard]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
