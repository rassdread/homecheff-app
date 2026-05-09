import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildHomeCarouselSlides } from '@/lib/gamification/home-carousel-build';
import type { CarouselLang } from '@/lib/gamification/home-carousel-i18n';

export const dynamic = 'force-dynamic';

function geoBucket(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return 'none';
  return `${Math.round(lat * 50) / 50}_${Math.round(lng * 50) / 50}`;
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lang: CarouselLang = searchParams.get('lang') === 'en' ? 'en' : 'nl';

    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { lat: true, lng: true },
    });
    const geo = geoBucket(profile?.lat ?? null, profile?.lng ?? null);

    const slides = await unstable_cache(
      async () => buildHomeCarouselSlides({ userId, lang }),
      ['home-hcp-carousel', userId, lang, geo],
      { revalidate: 120 }
    )();

    return NextResponse.json({ slides }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch (e) {
    console.error('[gamification/home-carousel]', e);
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 });
  }
}
