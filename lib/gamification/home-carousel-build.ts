import { prisma } from '@/lib/prisma';
import {
  buildRowsFromUserIds,
  mondayStartUtc,
  type LeaderboardRow,
} from '@/lib/gamification/leaderboard-queries';
import { hcpLevelFromTotal } from '@/lib/gamification/hcp-level';
import { getScopedLeaderboardPayload } from '@/lib/gamification/leaderboard-scoped';
import type { HomeCarouselSlide } from '@/lib/gamification/home-carousel-types';
import { carouselStrings, type CarouselLang } from '@/lib/gamification/home-carousel-i18n';
import {
  adminSlideMatchesTargeting,
  placementMatchesSlide,
  type CarouselViewerContext,
} from '@/lib/gamification/carousel-slide-filters';
import {
  dedupeConsecutiveSlides,
  interleaveCommunityFirst,
} from '@/lib/gamification/home-carousel-merge';

function slimFromLeaderboard(r: LeaderboardRow) {
  return {
    rank: r.rank,
    userId: r.userId,
    displayName: r.displayName,
    username: r.username,
    avatar: r.avatar,
    level: r.level,
    score: r.score,
    isCurrentUser: r.isCurrentUser,
  };
}

async function buildRiserRows(viewerId: string): Promise<LeaderboardRow[]> {
  const weekStart = mondayStartUtc();
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

  const raw = await prisma.$queryRaw<Array<{ userId: string; delta: bigint }>>`
    WITH tw AS (
      SELECT he."userId", SUM(he.points)::bigint AS s
      FROM "HcpEvent" he
      WHERE he."createdAt" >= ${weekStart}
      GROUP BY he."userId"
    ),
    pw AS (
      SELECT he."userId", SUM(he.points)::bigint AS s
      FROM "HcpEvent" he
      WHERE he."createdAt" >= ${prevWeekStart} AND he."createdAt" < ${weekStart}
      GROUP BY he."userId"
    )
    SELECT tw."userId", (tw.s - COALESCE(pw.s, 0))::bigint AS delta
    FROM tw
    LEFT JOIN pw ON pw."userId" = tw."userId"
    WHERE (tw.s - COALESCE(pw.s, 0)) > 0
    ORDER BY delta DESC
    LIMIT 12
  `;

  const sortedIds = raw.map((r) => r.userId);
  const deltaMap = new Map(raw.map((r) => [r.userId, Number(r.delta)]));
  if (sortedIds.length === 0) return [];

  const stats = await prisma.userHcpStats.findMany({
    where: { userId: { in: sortedIds } },
    select: { userId: true, totalHcp: true },
  });
  const totalMap = new Map(stats.map((s) => [s.userId, s.totalHcp]));
  const levelFn = (uid: string) => hcpLevelFromTotal(totalMap.get(uid) ?? 0);

  return buildRowsFromUserIds(
    sortedIds,
    (uid) => deltaMap.get(uid) ?? 0,
    levelFn,
    5,
    viewerId,
    { includeBadges: false }
  );
}

async function pickNewTalentFromWeeklyTop(
  topWeekUserIds: string[],
  exclude: Set<string>,
  viewerId: string
): Promise<LeaderboardRow | null> {
  const pool = topWeekUserIds.slice(0, 15).filter((id) => !exclude.has(id));
  if (pool.length === 0) return null;

  const u = await prisma.user.findFirst({
    where: { id: { in: pool } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      profileImage: true,
    },
  });
  if (!u) return null;

  const stats = await prisma.userHcpStats.findUnique({
    where: { userId: u.id },
    select: { totalHcp: true },
  });
  const total = stats?.totalHcp ?? 0;
  const displayName = (u.name || u.username || 'HomeCheff').trim() || 'HomeCheff';
  const avatar = u.profileImage || u.image || null;

  return {
    rank: 0,
    userId: u.id,
    displayName,
    username: u.username,
    avatar,
    level: hcpLevelFromTotal(total),
    score: total,
    badgeSummaries: [],
    isCurrentUser: viewerId === u.id,
  };
}

export type HomeCarouselPayload = {
  dataSlides: HomeCarouselSlide[];
  promoSlides: HomeCarouselSlide[];
};

/** Homepage: data (ranglijsten + spotlights) en promo (tekst/admin) apart voor desktop lay-out en mobiele interleave. */
export async function buildHomeCarouselPayload(opts: {
  userId: string;
  lang: CarouselLang;
}): Promise<HomeCarouselPayload> {
  const copy = carouselStrings(opts.lang);

  const viewerProfile = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { lat: true, lng: true, country: true },
  });

  const langNorm: CarouselLang = opts.lang === 'en' ? 'en' : 'nl';
  const viewerCountry = ((viewerProfile?.country ?? 'NL').trim() || 'NL').toUpperCase();
  const carouselCtx: CarouselViewerContext = {
    lang: langNorm,
    country: viewerCountry,
    anchorLat:
      viewerProfile?.lat != null && Number.isFinite(viewerProfile.lat) ? viewerProfile.lat : null,
    anchorLng:
      viewerProfile?.lng != null && Number.isFinite(viewerProfile.lng) ? viewerProfile.lng : null,
  };
  const now = new Date();

  const hasNearbyAnchor =
    viewerProfile?.lat != null &&
    viewerProfile?.lng != null &&
    Number.isFinite(viewerProfile.lat) &&
    Number.isFinite(viewerProfile.lng);

  const [adminDb, weekWorld, monthWorld, yearWorld, nearbyWeek, riserRows] = await Promise.all([
    prisma.hcpCarouselSlide.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          { OR: [{ localeFilter: null }, { localeFilter: langNorm }] },
          { OR: [{ placement: 'HOME' }, { placement: 'BOTH' }] },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    }),
    getScopedLeaderboardPayload({
      take: 5,
      currentUserId: opts.userId,
      scope: 'worldwide',
      period: 'week',
      viewerProfile,
      includeBadges: false,
    }),
    getScopedLeaderboardPayload({
      take: 5,
      currentUserId: opts.userId,
      scope: 'worldwide',
      period: 'month',
      viewerProfile,
      includeBadges: false,
    }),
    getScopedLeaderboardPayload({
      take: 5,
      currentUserId: opts.userId,
      scope: 'worldwide',
      period: 'year',
      viewerProfile,
      includeBadges: false,
    }),
    hasNearbyAnchor
      ? getScopedLeaderboardPayload({
          take: 5,
          currentUserId: opts.userId,
          scope: 'nearby',
          period: 'week',
          viewerProfile,
          includeBadges: false,
        })
      : Promise.resolve(null),
    buildRiserRows(opts.userId),
  ]);

  const dataSlides: HomeCarouselSlide[] = [];
  const promoSlides: HomeCarouselSlide[] = [];

  const pushRanking = (
    variantKey: string,
    sortKey: number,
    title: string,
    subtitle: string,
    rows: LeaderboardRow[]
  ) => {
    if (!rows?.length) return;
    dataSlides.push({
      id: `rank:${variantKey}`,
      kind: 'ranking',
      variantKey,
      sortKey,
      title,
      subtitle,
      rows: rows.map(slimFromLeaderboard),
    });
  };

  pushRanking(
    'worldwide:week',
    20,
    copy.rankWeekWorld.title,
    copy.rankWeekWorld.subtitle,
    weekWorld.rows
  );

  pushRanking(
    'worldwide:month',
    40,
    copy.rankMonthWorld.title,
    copy.rankMonthWorld.subtitle,
    monthWorld.rows
  );

  if (nearbyWeek?.rows?.length) {
    pushRanking(
      'nearby:week',
      60,
      copy.rankNearby.title,
      copy.rankNearby.subtitle,
      nearbyWeek.rows
    );
  }

  pushRanking(
    'risers:week_delta',
    80,
    copy.rankRisers.title,
    copy.rankRisers.subtitle,
    riserRows
  );

  pushRanking(
    'worldwide:year',
    100,
    copy.rankYearWorld.title,
    copy.rankYearWorld.subtitle,
    yearWorld.rows
  );

  const exclude = new Set<string>();
  const weekLeader = weekWorld.rows[0];
  let pushedSpotlightUser = false;

  if (weekLeader) {
    pushedSpotlightUser = true;
    dataSlides.push({
      id: 'spot:week-leader',
      kind: 'spotlight',
      variantKey: 'spotlight:week_leader',
      sortKey: 30,
      title: copy.spotlightWeek.title,
      spotlight: {
        userId: weekLeader.userId,
        displayName: weekLeader.displayName,
        username: weekLeader.username,
        avatar: weekLeader.avatar,
        level: weekLeader.level,
        subtitle: copy.spotlightWeek.reason,
      },
    });
    exclude.add(weekLeader.userId);
  }

  const riserTop = riserRows[0];
  if (riserTop && !exclude.has(riserTop.userId)) {
    pushedSpotlightUser = true;
    dataSlides.push({
      id: 'spot:riser',
      kind: 'spotlight',
      variantKey: 'spotlight:riser',
      sortKey: 50,
      title: copy.spotlightRiser.title,
      spotlight: {
        userId: riserTop.userId,
        displayName: riserTop.displayName,
        username: riserTop.username,
        avatar: riserTop.avatar,
        level: riserTop.level,
        subtitle: copy.spotlightRiser.reason,
      },
    });
    exclude.add(riserTop.userId);
  }

  const newTalent = await pickNewTalentFromWeeklyTop(
    weekWorld.rows.map((r) => r.userId),
    exclude,
    opts.userId
  );
  if (newTalent && !exclude.has(newTalent.userId)) {
    pushedSpotlightUser = true;
    dataSlides.push({
      id: 'spot:new',
      kind: 'spotlight',
      variantKey: 'spotlight:new_talent',
      sortKey: 70,
      title: copy.spotlightNew.title,
      spotlight: {
        userId: newTalent.userId,
        displayName: newTalent.displayName,
        username: newTalent.username,
        avatar: newTalent.avatar,
        level: newTalent.level,
        subtitle: copy.spotlightNew.reason,
      },
    });
    exclude.add(newTalent.userId);
  }

  if (!pushedSpotlightUser) {
    dataSlides.push({
      id: 'spot:fallback',
      kind: 'spotlight',
      variantKey: 'spotlight:fallback',
      sortKey: 35,
      title: copy.spotlightFallback.title,
      subtitle: copy.spotlightFallback.subtitle,
    });
  }

  promoSlides.push(
    {
      id: 'promo:join',
      kind: 'promo',
      variantKey: 'promo:join',
      sortKey: 120,
      title: copy.promoJoin.title,
      subtitle: copy.promoJoin.subtitle,
      ctaLabel: copy.promoJoin.cta,
      ctaUrl: '/mijn-hcp',
    },
    {
      id: 'promo:local',
      kind: 'promo',
      variantKey: 'promo:local',
      sortKey: 140,
      title: copy.promoLocal.title,
      subtitle: copy.promoLocal.subtitle,
      ctaLabel: copy.promoLocal.cta,
      ctaUrl: '/profile',
    },
    {
      id: 'promo:badges',
      kind: 'promo',
      variantKey: 'promo:badges',
      sortKey: 160,
      title: copy.promoBadges.title,
      subtitle: copy.promoBadges.subtitle,
      ctaLabel: copy.promoBadges.cta,
      ctaUrl: '/mijn-hcp',
    },
    {
      id: 'promo:inspire',
      kind: 'promo',
      variantKey: 'promo:inspire',
      sortKey: 180,
      title: copy.promoInspire.title,
      subtitle: copy.promoInspire.subtitle,
      ctaLabel: copy.promoInspire.cta,
      ctaUrl: '/profile',
    },
    {
      id: 'promo:future',
      kind: 'promo',
      variantKey: 'promo:future',
      sortKey: 200,
      title: copy.promoFuture.title,
      subtitle: copy.promoFuture.subtitleShort,
      ctaLabel: copy.promoFuture.cta,
      ctaUrl: '/hcp-ranglijsten',
    }
  );

  for (const a of adminDb) {
    if (!placementMatchesSlide('HOME', a)) continue;
    if (!adminSlideMatchesTargeting(a, carouselCtx)) continue;
    promoSlides.push({
      id: `admin:${a.id}`,
      /** Admin slides render as promo-style cards (CTA/image); type is metadata for the dashboard. */
      kind: 'admin',
      variantKey: `admin:${a.id}`,
      sortKey: a.sortOrder,
      title: a.title,
      subtitle: a.subtitle ?? undefined,
      ctaLabel: a.ctaLabel ?? undefined,
      ctaUrl: a.ctaUrl ?? undefined,
      imageUrl: a.imageUrl,
      backgroundStyle: a.backgroundStyle,
    });
  }

  dataSlides.sort((a, b) => a.sortKey - b.sortKey);
  promoSlides.sort((a, b) => a.sortKey - b.sortKey);

  return {
    dataSlides: dedupeConsecutiveSlides(dataSlides),
    promoSlides: dedupeConsecutiveSlides(promoSlides),
  };
}

/** @deprecated Gebruik `buildHomeCarouselPayload` + client-side merge of aparte kolommen. */
export async function buildHomeCarouselSlides(opts: {
  userId: string;
  lang: CarouselLang;
}): Promise<HomeCarouselSlide[]> {
  const { dataSlides, promoSlides } = await buildHomeCarouselPayload(opts);
  return dedupeConsecutiveSlides(interleaveCommunityFirst(dataSlides, promoSlides, { dataBeforePromo: 3 }));
}
