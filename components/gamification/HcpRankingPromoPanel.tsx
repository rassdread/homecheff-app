'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { RankingPromoCard } from '@/lib/gamification/ranking-promo-build';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';
import { HcpLevelPill } from '@/components/gamification/HcpLevelPill';

const BG: Record<string, string> = {
  amber: 'bg-gradient-to-br from-amber-50 via-white to-amber-50/50',
  emerald: 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/40',
  violet: 'bg-gradient-to-br from-violet-50 via-white to-violet-50/45',
  rose: 'bg-gradient-to-br from-rose-50 via-white to-rose-50/35',
  slate: 'bg-gradient-to-br from-slate-50 via-white to-slate-100/50',
};

function surface(bg: string | null | undefined): string {
  if (!bg?.trim()) return BG.amber;
  const k = bg.trim().toLowerCase();
  return BG[k] ?? bg;
}

type Props = {
  lang: 'nl' | 'en';
  gpsLat: number | null;
  gpsLng: number | null;
  className?: string;
};

export default function HcpRankingPromoPanel({ lang, gpsLat, gpsLng, className }: Props) {
  const { t } = useTranslation();
  const [slides, setSlides] = useState<RankingPromoCard[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ lang });
      if (gpsLat != null && gpsLng != null) {
        params.set('lat', String(gpsLat));
        params.set('lng', String(gpsLng));
      }
      const res = await fetch(`/api/gamification/ranking-promo?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('promo');
      const json = (await res.json()) as { slides?: RankingPromoCard[] };
      setSlides(Array.isArray(json.slides) ? json.slides : []);
      setFailed(false);
    } catch {
      setFailed(true);
      setSlides([]);
    }
  }, [lang, gpsLat, gpsLng]);

  useEffect(() => {
    load();
  }, [load]);

  const n = slides?.length ?? 0;
  const i = n > 0 ? idx % n : 0;

  useEffect(() => {
    setIdx(0);
  }, [n]);

  useEffect(() => {
    if (n <= 1 || paused) return;
    const id = window.setInterval(() => setIdx((x) => (n ? (x + 1) % n : 0)), 12000);
    return () => window.clearInterval(id);
  }, [n, paused]);

  const go = (d: -1 | 1) => {
    if (n <= 0) return;
    setIdx((x) => (x + d + n) % n);
  };

  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const s = touchX.current;
    touchX.current = null;
    if (s == null || n <= 1) return;
    const eX = e.changedTouches[0]?.clientX ?? s;
    const dx = eX - s;
    if (dx > 56) go(-1);
    else if (dx < -56) go(1);
  };

  const loading = slides === null && !failed;

  return (
    <aside
      className={cn(
        'rounded-2xl border border-amber-200/70 bg-white/90 shadow-md ring-1 ring-amber-500/10 overflow-hidden',
        className
      )}
      aria-label={t('home.hcpRankingsPage.promoAria')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="px-4 py-3 border-b border-amber-100/90 bg-gradient-to-r from-amber-50/80 to-emerald-50/40">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-900/90">
          {t('home.hcpRankingsPage.promoHeading')}
        </p>
      </div>

      <div
        className="relative p-4 min-h-[220px] max-h-[min(52vh,420px)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <div className="space-y-3 animate-pulse pt-2">
            <div className="h-6 w-3/4 rounded-lg bg-amber-100/80 max-w-[280px]" />
            <div className="h-28 rounded-xl bg-gray-100" />
            <div className="h-10 rounded-xl bg-gray-100 w-2/3" />
          </div>
        ) : failed || n === 0 ? (
          <p className="text-sm text-gray-600 leading-relaxed">{t('home.hcpRankingsPage.promoFallback')}</p>
        ) : (
          <>
            <div className="relative min-h-[200px]">
              {slides!.map((slide, k) => (
                <div
                  key={slide.id}
                  className={cn(
                    'transition-opacity duration-500 ease-out motion-reduce:transition-none rounded-xl border border-white/80 p-4 shadow-sm',
                    surface(slide.backgroundStyle),
                    k === i ? 'opacity-100 relative z-[1]' : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
                  )}
                  aria-hidden={k !== i}
                >
                  {slide.spotlight ? (
                    <div className="flex flex-col gap-3">
                      <p className="text-base font-bold text-gray-900 leading-snug">{slide.title}</p>
                      <div className="flex gap-3 items-center">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white ring-2 ring-emerald-100">
                          {slide.spotlight.avatar ? (
                            <SafeImage
                              src={slide.spotlight.avatar}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-emerald-800">
                              HC
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="font-semibold text-gray-900 truncate">{slide.spotlight.displayName}</p>
                          <HcpLevelPill level={slide.spotlight.level} size="sm" tone="emerald" />
                          <p className="text-xs text-gray-600 leading-relaxed">{slide.spotlight.subtitle}</p>
                        </div>
                      </div>
                      {slide.ctaUrl ? (
                        <Link
                          href={slide.ctaUrl}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                        >
                          {slide.ctaLabel ?? t('home.hcpRankingsPage.viewProfile')}
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full justify-between gap-3 min-h-[180px]">
                      <div className="min-w-0">
                        {slide.imageUrl ? (
                          <div className="relative w-full h-32 mb-3 rounded-xl overflow-hidden border border-white/90 bg-white/50">
                            <SafeImage src={slide.imageUrl} alt="" fill className="object-cover" sizes="340px" />
                          </div>
                        ) : null}
                        <p className="text-lg font-bold text-gray-900 leading-snug">{slide.title}</p>
                        {slide.subtitle ? (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{slide.subtitle}</p>
                        ) : null}
                      </div>
                      {slide.ctaLabel && slide.ctaUrl ? (
                        <Link
                          href={slide.ctaUrl}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                        >
                          {slide.ctaLabel}
                        </Link>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {n > 1 ? (
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-amber-100/80">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                  aria-label={t('home.hcpCarousel.prev')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex flex-wrap justify-center gap-1.5 flex-1">
                  {slides!.map((s, k) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIdx(k)}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        k === i ? 'w-6 bg-amber-600' : 'w-2 bg-amber-200'
                      )}
                      aria-current={k === i}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                  aria-label={t('home.hcpCarousel.next')}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
