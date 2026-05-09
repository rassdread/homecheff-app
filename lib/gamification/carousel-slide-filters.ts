import type { HcpCarouselSlide } from '@prisma/client';
import { haversineKm } from '@/lib/gamification/leaderboard-scoped';

export type CarouselPlacementSurface = 'HOME' | 'RANKINGS';

export type CarouselViewerContext = {
  lang: 'nl' | 'en';
  /** ISO country from profile, uppercase */
  country: string | null;
  /** Viewer anchor for radius targeting (profile or GPS), never logged publicly */
  anchorLat: number | null;
  anchorLng: number | null;
};

export function placementMatchesSlide(surface: CarouselPlacementSurface, slide: HcpCarouselSlide): boolean {
  const p = slide.placement;
  if (p === 'BOTH') return true;
  if (surface === 'HOME') return p === 'HOME';
  return p === 'RANKINGS';
}

/**
 * Admin targeting: GLOBAL / COUNTRY / RADIUS vs viewer context.
 * Legacy `countryFilter` still applies when set (AND with targetType rules).
 */
export function adminSlideMatchesTargeting(slide: HcpCarouselSlide, ctx: CarouselViewerContext): boolean {
  if (slide.localeFilter && slide.localeFilter !== ctx.lang) {
    return false;
  }

  if (slide.countryFilter?.trim()) {
    const fc = slide.countryFilter.trim().toUpperCase();
    if (!ctx.country || ctx.country !== fc) return false;
  }

  switch (slide.targetType) {
    case 'GLOBAL':
      return true;
    case 'COUNTRY': {
      const tc = slide.targetCountry?.trim().toUpperCase();
      if (!tc || !ctx.country) return false;
      return ctx.country === tc;
    }
    case 'RADIUS': {
      const lat = slide.targetLat;
      const lng = slide.targetLng;
      const r = slide.targetRadiusKm;
      if (lat == null || lng == null || r == null || r <= 0) return false;
      if (ctx.anchorLat == null || ctx.anchorLng == null) return false;
      return haversineKm(lat, lng, ctx.anchorLat, ctx.anchorLng) <= r + 0.001;
    }
    default:
      return true;
  }
}
