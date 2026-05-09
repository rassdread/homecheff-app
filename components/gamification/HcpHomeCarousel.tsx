'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { HomeCarouselSlide } from '@/lib/gamification/home-carousel-types';
import { publicProfileHref } from '@/lib/user/public-profile';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';

const HP = 'home.hcpActivation';

const BG_PRESETS: Record<string, string> = {
  amber: 'bg-gradient-to-br from-amber-50/95 via-white to-amber-50/40',
  emerald: 'bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/35',
  violet: 'bg-gradient-to-br from-violet-50/95 via-white to-violet-50/35',
  rose: 'bg-gradient-to-br from-rose-50/95 via-white to-rose-50/30',
  slate: 'bg-gradient-to-br from-slate-50/95 via-white to-slate-100/40',
};

function slideSurfaceClass(style: string | null | undefined): string {
  if (!style?.trim()) return BG_PRESETS.amber;
  const key = style.trim().toLowerCase();
  return BG_PRESETS[key] ?? style;
}

function CarouselRankingSlide({ slide }: { slide: HomeCarouselSlide }) {
  const { t } = useTranslation();
  const rows = slide.rows ?? [];
  return (
    <div className="flex flex-col h-full min-h-[220px]">
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-900/85">{slide.title}</p>
        {slide.subtitle ? (
          <p className="text-[11px] text-gray-600 mt-1 leading-snug">{slide.subtitle}</p>
        ) : null}
        <Link
          href="/hcp-ranglijsten"
          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 hover:underline mt-1.5 inline-block min-h-[44px] py-1"
        >
          {t('home.hcpCarousel.openRankings')}
        </Link>
      </div>
      <ol className="space-y-2 flex-1 min-h-0">
        {rows.map((row) => {
          const href = publicProfileHref(row.userId, row.username);
          const inner = (
            <>
              <span className="text-xs font-bold text-amber-900 tabular-nums w-5 shrink-0">{row.rank}</span>
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-amber-100 ring-1 ring-white">
                {row.avatar ? (
                  <SafeImage src={row.avatar} alt="" fill className="object-cover" sizes="36px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-amber-900">
                    HC
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{row.displayName}</p>
                <p className="text-[11px] text-gray-600 tabular-nums">
                  L{row.level} · {row.score.toLocaleString()} HCP
                </p>
              </div>
            </>
          );
          const shell = cn(
            'flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors min-h-[44px]',
            row.isCurrentUser
              ? 'border-amber-400 bg-amber-50/90 ring-1 ring-amber-300/60'
              : 'border-amber-100/90 bg-white/70',
            href && 'hover:bg-white'
          );
          return (
            <li key={row.userId}>
              {href ? (
                <Link href={href} className={shell}>
                  {inner}
                </Link>
              ) : (
                <div className={shell}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CarouselSpotlightSlide({ slide }: { slide: HomeCarouselSlide }) {
  const sp = slide.spotlight;
  const href = sp ? publicProfileHref(sp.userId, sp.username) : null;
  const spotlightInner = sp ? (
    <>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-emerald-100 ring-2 ring-white shadow-sm">
        {sp.avatar ? (
          <SafeImage src={sp.avatar} alt="" fill className="object-cover" sizes="56px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm font-bold text-emerald-800">
            HC
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-gray-900 truncate">{sp.displayName}</p>
        <p className="text-xs text-emerald-900/90 mt-0.5 leading-snug">
          L{sp.level} · {sp.subtitle}
        </p>
      </div>
    </>
  ) : null;
  return (
    <div className="flex flex-col justify-center h-full min-h-[220px]">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-900/85 mb-3">{slide.title}</p>
      {sp ? (
        href ? (
          <Link
            href={href}
            className="flex gap-3 items-center rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-3 min-h-[52px] hover:bg-emerald-50 transition-colors"
          >
            {spotlightInner}
          </Link>
        ) : (
          <div className="flex gap-3 items-center rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-3 min-h-[52px]">
            {spotlightInner}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-amber-200/90 bg-amber-50/40 px-3 py-4">
          {slide.subtitle ? (
            <p className="text-sm text-gray-700 leading-snug">{slide.subtitle}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CarouselPromoSlide({ slide }: { slide: HomeCarouselSlide }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between h-full min-h-[220px] rounded-xl border border-amber-200/60 p-4 shadow-sm ring-1 ring-amber-500/5',
        slideSurfaceClass(slide.backgroundStyle)
      )}
    >
      <div className="min-w-0">
        {slide.imageUrl ? (
          <div className="relative w-full h-24 mb-3 rounded-lg overflow-hidden bg-white/50 border border-white/80">
            <SafeImage src={slide.imageUrl} alt="" fill className="object-cover" sizes="280px" />
          </div>
        ) : null}
        <p className="text-sm font-bold text-gray-900 leading-snug">{slide.title}</p>
        {slide.subtitle ? (
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{slide.subtitle}</p>
        ) : null}
      </div>
      {slide.ctaLabel && slide.ctaUrl ? (
        <Link
          href={slide.ctaUrl}
          className={cn(
            'mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold',
            'bg-gradient-to-r from-amber-500/90 to-emerald-600/85 text-white shadow-sm',
            'hover:from-amber-500 hover:to-emerald-600 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
          )}
        >
          {slide.ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

function renderSlide(slide: HomeCarouselSlide) {
  switch (slide.kind) {
    case 'ranking':
      return <CarouselRankingSlide slide={slide} />;
    case 'spotlight':
      return <CarouselSpotlightSlide slide={slide} />;
    default:
      return <CarouselPromoSlide slide={slide} />;
  }
}

type Props = {
  lang: 'nl' | 'en';
  className?: string;
};

export default function HcpHomeCarousel({ lang, className }: Props) {
  const { t } = useTranslation();
  const tk = (key: string, opts?: Record<string, string | number>) => t(`${HP}.${key}`, opts);

  const [slides, setSlides] = useState<HomeCarouselSlide[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/gamification/home-carousel?lang=${lang}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('carousel');
        const json = (await res.json()) as { slides?: HomeCarouselSlide[] };
        const list = Array.isArray(json.slides) ? json.slides : [];
        if (!cancelled) setSlides(list);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setSlides([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const n = slides?.length ?? 0;
  const safeIndex = n > 0 ? index % n : 0;

  useEffect(() => {
    setIndex(0);
  }, [n]);

  useEffect(() => {
    if (n <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (n > 0 ? (i + 1) % n : 0));
    }, 7000);
    return () => window.clearInterval(id);
  }, [n, paused]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 0) return;
      setIndex((i) => (i + dir + n) % n);
    },
    [n]
  );

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null || n <= 1) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const dx = end - start;
    if (dx > 52) go(-1);
    else if (dx < -52) go(1);
  };

  const loading = slides === null && !failed;

  return (
    <aside
      className={cn(
        'rounded-xl border border-amber-200/65 bg-gradient-to-b from-white/95 to-amber-50/40',
        'p-3.5 sm:p-4 shadow-sm ring-1 ring-emerald-600/10 space-y-4 min-h-[240px]',
        className
      )}
      aria-label={t('home.hcpCarousel.aria')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative min-h-[228px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <div className="space-y-3 animate-pulse pt-1" aria-busy="true">
            <div className="h-4 w-44 rounded-md bg-amber-100/80" />
            <div className="h-24 rounded-xl bg-amber-100/50" />
            <div className="h-24 rounded-xl bg-amber-100/50" />
          </div>
        ) : failed || n === 0 ? (
          <p className="text-xs text-gray-600 leading-snug">{tk('ranking.loadError')}</p>
        ) : (
          <>
            <div className="relative overflow-hidden min-h-[228px]">
              {slides!.map((slide, i) => (
                <div
                  key={slide.id}
                  className={cn(
                    'transition-opacity duration-300 ease-out motion-reduce:transition-none',
                    i === safeIndex ? 'opacity-100 relative z-[1]' : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
                  )}
                  aria-hidden={i !== safeIndex}
                >
                  {renderSlide(slide)}
                </div>
              ))}
            </div>

            {n > 1 ? (
              <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-amber-100/80">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-900 hover:bg-amber-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={t('home.hcpCarousel.prev')}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <div className="flex flex-wrap justify-center gap-1.5 flex-1">
                  {slides!.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={cn(
                        'h-2 rounded-full transition-all motion-reduce:transition-none',
                        i === safeIndex ? 'w-6 bg-amber-600' : 'w-2 bg-amber-200 hover:bg-amber-300'
                      )}
                      aria-label={t('home.hcpCarousel.dot', { n: i + 1 })}
                      aria-current={i === safeIndex}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-900 hover:bg-amber-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={t('home.hcpCarousel.next')}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent" aria-hidden />

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-violet-900/80 mb-1">
          {tk('rewards.title')}
        </p>
        <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">{tk('rewards.teaser')}</p>
      </div>

      <Link
        href="/hcp-ranglijsten"
        className={cn(
          'flex w-full items-center justify-center rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500/15 to-emerald-600/15',
          'min-h-[44px] px-3 py-2.5 text-sm font-semibold text-amber-950 hover:from-amber-500/25 hover:to-emerald-600/20 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
        )}
      >
        {tk('ctaLeaderboards')}
      </Link>
    </aside>
  );
}
