import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildRankingPromoPayload } from '@/lib/gamification/ranking-promo-build';
import type { CarouselLang } from '@/lib/gamification/home-carousel-i18n';

export const dynamic = 'force-dynamic';

function geoBucket(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return 'none';
  return `${Math.round(lat * 40) / 40}_${Math.round(lng * 40) / 40}`;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    const { searchParams } = new URL(req.url);
    const lang: CarouselLang = searchParams.get('lang') === 'en' ? 'en' : 'nl';
    const latRaw = searchParams.get('lat');
    const lngRaw = searchParams.get('lng');
    const gpsLat = latRaw != null && latRaw !== '' ? Number(latRaw) : null;
    const gpsLng = lngRaw != null && lngRaw !== '' ? Number(lngRaw) : null;
    const latOk = gpsLat != null && Number.isFinite(gpsLat) ? gpsLat : null;
    const lngOk = gpsLng != null && Number.isFinite(gpsLng) ? gpsLng : null;

    const profile =
      userId != null
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { lat: true, lng: true },
          })
        : null;

    const cacheLat = latOk ?? profile?.lat ?? null;
    const cacheLng = lngOk ?? profile?.lng ?? null;
    const geo = geoBucket(cacheLat, cacheLng);

    const slides = await unstable_cache(
      async () =>
        buildRankingPromoPayload({
          userId,
          lang,
          gpsLat: latOk,
          gpsLng: lngOk,
        }),
      ['ranking-promo', userId ?? 'anon', lang, geo],
      { revalidate: 90 }
    )();

    return NextResponse.json({ slides }, { headers: { 'Cache-Control': 'private, max-age=45' } });
  } catch (e) {
    console.error('[gamification/ranking-promo]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
