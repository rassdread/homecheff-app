import { prisma } from '@/lib/prisma';
import { getScopedLeaderboardPayload } from '@/lib/gamification/leaderboard-scoped';
import {
  adminSlideMatchesTargeting,
  placementMatchesSlide,
  type CarouselViewerContext,
} from '@/lib/gamification/carousel-slide-filters';
import { carouselStrings, type CarouselLang } from '@/lib/gamification/home-carousel-i18n';

export type RankingPromoCard = {
  id: string;
  variantKey: string;
  sortKey: number;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundStyle?: string | null;
  spotlight?: {
    userId: string;
    displayName: string;
    username: string | null;
    avatar: string | null;
    level: number;
    subtitle: string;
  };
};

function dedupePromo(slides: RankingPromoCard[]): RankingPromoCard[] {
  const sorted = [...slides].sort((a, b) => a.sortKey - b.sortKey);
  const out: RankingPromoCard[] = [];
  let prev: string | null = null;
  for (const s of sorted) {
    if (s.variantKey === prev) continue;
    prev = s.variantKey;
    out.push(s);
  }
  return out;
}

export async function buildRankingPromoPayload(opts: {
  userId: string | null;
  lang: CarouselLang;
  gpsLat: number | null;
  gpsLng: number | null;
}): Promise<RankingPromoCard[]> {
  const copy = carouselStrings(opts.lang);
  const viewerProfile =
    opts.userId != null
      ? await prisma.user.findUnique({
          where: { id: opts.userId },
          select: { lat: true, lng: true, country: true },
        })
      : null;

  const langNorm: CarouselLang = opts.lang === 'en' ? 'en' : 'nl';
  const country = ((viewerProfile?.country ?? 'NL').trim() || 'NL').toUpperCase();

  const anchorLat =
    opts.gpsLat != null && Number.isFinite(opts.gpsLat)
      ? opts.gpsLat
      : viewerProfile?.lat != null && Number.isFinite(viewerProfile.lat)
        ? viewerProfile.lat
        : null;
  const anchorLng =
    opts.gpsLng != null && Number.isFinite(opts.gpsLng)
      ? opts.gpsLng
      : viewerProfile?.lng != null && Number.isFinite(viewerProfile.lng)
        ? viewerProfile.lng
        : null;

  const ctx: CarouselViewerContext = {
    lang: langNorm,
    country,
    anchorLat,
    anchorLng,
  };

  const now = new Date();

  const [adminRows, weekWorld] = await Promise.all([
    prisma.hcpCarouselSlide.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          { OR: [{ localeFilter: null }, { localeFilter: langNorm }] },
          { OR: [{ placement: 'RANKINGS' }, { placement: 'BOTH' }] },
        ],
      },
      orderBy: { sortOrder: 'asc' },
    }),
    getScopedLeaderboardPayload({
      take: 1,
      currentUserId: opts.userId,
      scope: 'worldwide',
      period: 'week',
      viewerProfile,
      includeBadges: false,
    }),
  ]);

  const slides: RankingPromoCard[] = [];

  const leader = weekWorld.rows[0];
  if (leader) {
    slides.push({
      id: 'auto:featured-week',
      variantKey: 'auto:featured-week',
      sortKey: 15,
      title: opts.lang === 'en' ? 'In the spotlight this week' : 'In het zonnetje deze week',
      subtitle: copy.spotlightWeek.reason,
      spotlight: {
        userId: leader.userId,
        displayName: leader.displayName,
        username: leader.username,
        avatar: leader.avatar,
        level: leader.level,
        subtitle: copy.spotlightWeek.reason,
      },
      ctaLabel: opts.lang === 'en' ? 'View profile' : 'Bekijk profiel',
      ctaUrl: leader.username ? `/user/${leader.username}` : `/profile/${leader.userId}`,
      backgroundStyle: 'emerald',
    });
  }

  slides.push(
    {
      id: 'auto:rewards',
      variantKey: 'auto:rewards',
      sortKey: 40,
      title: opts.lang === 'en' ? 'Automatic rewards' : 'Automatische beloningen',
      subtitle:
        opts.lang === 'en'
          ? 'Rewards are processed automatically once you meet the conditions. This can include extra visibility, badges, profile boosts, spotlight placements or promotions in the HCP screens. HCP does not include fixed cash prizes or automatic payouts unless HomeCheff communicates this separately in advance.'
          : 'Beloningen worden automatisch verwerkt zodra je aan de voorwaarden voldoet. Denk aan extra zichtbaarheid, badges, profielboosts, spotlight-plekken of promoties in de HCP-schermen. Er zijn geen vaste geldprijzen of automatische uitbetalingen gekoppeld aan HCP, tenzij HomeCheff dat apart en vooraf communiceert.',
      ctaLabel: opts.lang === 'en' ? 'My HCP' : 'Mijn HCP',
      ctaUrl: '/mijn-hcp',
      backgroundStyle: 'violet',
    },
    {
      id: 'auto:nearby-vis',
      variantKey: 'auto:nearby-vis',
      sortKey: 55,
      title: copy.promoLocal.title,
      subtitle: copy.promoLocal.subtitle,
      ctaLabel: copy.promoLocal.cta,
      ctaUrl: '/profile',
      backgroundStyle: 'amber',
    },
    {
      id: 'auto:future-vis',
      variantKey: 'auto:future-vis',
      sortKey: 65,
      title: copy.promoFuture.title,
      subtitle: copy.promoFuture.subtitle,
      ctaLabel: copy.promoFuture.cta,
      ctaUrl: '/hcp-ranglijsten',
      backgroundStyle: 'slate',
    }
  );

  for (const a of adminRows) {
    if (!placementMatchesSlide('RANKINGS', a)) continue;
    if (!adminSlideMatchesTargeting(a, ctx)) continue;
    slides.push({
      id: `admin:${a.id}`,
      variantKey: `admin:${a.id}`,
      sortKey: a.sortOrder,
      title: a.title,
      subtitle: a.subtitle ?? undefined,
      imageUrl: a.imageUrl,
      ctaLabel: a.ctaLabel ?? undefined,
      ctaUrl: a.ctaUrl ?? undefined,
      backgroundStyle: a.backgroundStyle,
    });
  }

  return dedupePromo(slides);
}
