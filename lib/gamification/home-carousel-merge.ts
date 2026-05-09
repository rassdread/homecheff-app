import type { HomeCarouselSlide } from '@/lib/gamification/home-carousel-types';

/** Voorkomt twee identieke varianten direct na elkaar (bv. dubbele week-slide). */
export function dedupeConsecutiveSlides(slides: HomeCarouselSlide[]): HomeCarouselSlide[] {
  const out: HomeCarouselSlide[] = [];
  let prev: string | null = null;
  for (const s of slides) {
    if (s.variantKey === prev) continue;
    prev = s.variantKey;
    out.push(s);
  }
  return out;
}

/**
 * Wisselt ranking/spotlight en promo/admin slides af zodat er zo min mogelijk promo alleen na promo staat
 * zolang er nog data-slides zijn.
 */
export function interleaveDataAndPromoSlides(
  data: HomeCarouselSlide[],
  promo: HomeCarouselSlide[]
): HomeCarouselSlide[] {
  const D = [...data].sort((a, b) => a.sortKey - b.sortKey);
  const P = [...promo].sort((a, b) => a.sortKey - b.sortKey);
  const out: HomeCarouselSlide[] = [];
  let i = 0;
  let j = 0;
  while (i < D.length && j < P.length) {
    out.push(D[i++]);
    out.push(P[j++]);
  }
  while (i < D.length) out.push(D[i++]);
  while (j < P.length) out.push(P[j++]);
  return dedupeConsecutiveSlides(out);
}
