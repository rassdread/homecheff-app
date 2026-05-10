'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { HomeCarouselSlide } from '@/lib/gamification/home-carousel-types';
import { publicProfileHref } from '@/lib/user/public-profile';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';
import { HcpLevelPill } from '@/components/gamification/HcpLevelPill';

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

/** Iets hoger paneel zodat 5 compacte rankingrijen zichtbaar zijn (mobiel + desktop). */
const TRACK_FRAME =
  'min-h-[268px] h-[268px] sm:min-h-[276px] sm:h-[276px] lg:min-h-[284px] lg:h-[284px]';

function CarouselRankingSlide({ slide }: { slide: HomeCarouselSlide }) {
  const { t } = useTranslation();
  const rows = slide.rows ?? [];
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-1 flex shrink-0 flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase leading-tight tracking-wide text-amber-900/90 line-clamp-1">
            {slide.title}
          </p>
          {slide.subtitle ? (
            <p className="mt-0.5 text-[9px] leading-snug text-gray-600 line-clamp-1">{slide.subtitle}</p>
          ) : null}
        </div>
        <Link
          href="/hcp-ranglijsten"
          prefetch={false}
          className="shrink-0 text-[9px] font-semibold text-amber-800 hover:text-amber-950 hover:underline touch-pan-y select-none"
        >
          {t('home.hcpCarousel.openRankings')}
        </Link>
      </div>
      <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-y-contain pr-0.5 [-webkit-overflow-scrolling:touch]">
        {rows.slice(0, 5).map((row) => {
          const href = publicProfileHref(row.userId, row.username);
          const inner = (
            <>
              <span className="w-3.5 shrink-0 text-[10px] font-bold tabular-nums text-amber-900">{row.rank}</span>
              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-amber-100 ring-1 ring-white">
                {row.avatar ? (
                  <SafeImage src={row.avatar} alt="" fill className="object-cover" sizes="24px" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-amber-900">
                    HC
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold leading-tight text-gray-900">{row.displayName}</p>
                <p className="truncate text-[9px] tabular-nums text-gray-600">{row.score.toLocaleString()} HCP</p>
              </div>
            </>
          );
          const shell = cn(
            'flex min-h-[26px] items-center gap-1 rounded-md border px-1 py-0.5 transition-colors',
            row.isCurrentUser
              ? 'border-amber-400 bg-amber-50/95 ring-1 ring-amber-300/50'
              : 'border-amber-100/80 bg-white/65',
            href && 'hover:bg-white'
          );
          return (
            <li key={row.userId}>
              {href ? (
                <Link href={href} prefetch={false} className={cn(shell, 'touch-pan-y select-none')}>
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
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-100 ring-2 ring-white shadow-sm">
        {sp.avatar ? (
          <SafeImage src={sp.avatar} alt="" fill className="object-cover" sizes="40px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-emerald-800">
            HC
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-gray-900">{sp.displayName}</p>
        <HcpLevelPill level={sp.level} size="xs" tone="emerald" className="mt-1" />
        <p className="mt-1.5 text-[10px] leading-relaxed text-emerald-900/88 line-clamp-3">{sp.subtitle}</p>
      </div>
    </>
  ) : null;
  return (
    <div className="flex h-full min-h-0 flex-col justify-center overflow-hidden">
      <p className="mb-1.5 line-clamp-2 shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-900/85">
        {slide.title}
      </p>
      {sp ? (
        href ? (
          <Link
            href={href}
            prefetch={false}
            className="flex min-h-0 items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-2 py-1.5 hover:bg-emerald-50 transition-colors touch-pan-y select-none"
          >
            {spotlightInner}
          </Link>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-2 py-1.5">
            {spotlightInner}
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed border-amber-200/90 bg-amber-50/40 px-2 py-2">
          {slide.subtitle ? (
            <p className="text-[11px] leading-snug text-gray-700 line-clamp-5">{slide.subtitle}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CarouselPromoSlide({ slide, embedded }: { slide: HomeCarouselSlide; embedded?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col justify-between overflow-hidden',
        embedded
          ? 'rounded-lg border border-amber-200/45 bg-white/55 p-2.5 shadow-none ring-0'
          : cn(
              'rounded-xl border border-amber-200/60 p-3 shadow-sm ring-1 ring-amber-500/5',
              slideSurfaceClass(slide.backgroundStyle)
            )
      )}
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        {slide.imageUrl ? (
          <div className="relative mb-1.5 h-14 w-full overflow-hidden rounded-md border border-white/80 bg-white/50 sm:h-16">
            <SafeImage src={slide.imageUrl} alt="" fill className="object-cover" sizes="280px" />
          </div>
        ) : null}
        {!embedded ? null : slide.imageUrl ? null : (
          <div className="pointer-events-none mb-1 border-b border-dotted border-amber-200/50 pb-1" aria-hidden />
        )}
        <p className="text-sm font-bold leading-snug text-gray-900 line-clamp-2">{slide.title}</p>
        {slide.subtitle ? (
          <p className="mt-1 text-[10px] leading-snug text-gray-600 line-clamp-3 sm:text-[11px]">{slide.subtitle}</p>
        ) : null}
      </div>
      <div className="mt-1.5 shrink-0 space-y-1">
        {slide.ctaLabel && slide.ctaUrl ? (
          <Link
            href={slide.ctaUrl}
            prefetch={false}
            className={cn(
              'inline-flex min-h-[38px] w-full items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold',
              'bg-gradient-to-r from-amber-500/90 to-emerald-600/85 text-white shadow-sm',
              'hover:from-amber-500 hover:to-emerald-600 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
              'touch-pan-y select-none'
            )}
          >
            {slide.ctaLabel}
          </Link>
        ) : null}
        <Link
          href="/hcp-ranglijsten"
          prefetch={false}
          className="inline-flex min-h-[44px] w-full items-center justify-center py-2 text-center text-[10px] font-semibold text-amber-900/90 underline-offset-2 hover:underline touch-pan-y select-none"
        >
          {t('home.hcpCarousel.viewMore')}
        </Link>
      </div>
    </div>
  );
}

function renderSlide(slide: HomeCarouselSlide, embedded?: boolean) {
  switch (slide.kind) {
    case 'ranking':
      return <CarouselRankingSlide slide={slide} />;
    case 'spotlight':
      return <CarouselSpotlightSlide slide={slide} />;
    default:
      return <CarouselPromoSlide slide={slide} embedded={embedded} />;
  }
}

export type HcpHomeCarouselProps = {
  slides: HomeCarouselSlide[];
  loading?: boolean;
  failed?: boolean;
  /** Geen tweede kaart-rand: onderdeel van het grote HCP-dashboardpaneel. */
  embedded?: boolean;
  showFooter?: boolean;
  emptyLabel?: string;
  className?: string;
};

export default function HcpHomeCarousel({
  slides,
  loading = false,
  failed = false,
  embedded = false,
  showFooter = true,
  emptyLabel,
  className,
}: HcpHomeCarouselProps) {
  const { t } = useTranslation();
  const tk = (key: string, opts?: Record<string, string | number>) => t(`${HP}.${key}`, opts);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const n = slides.length;
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

  const showFooterBlock = showFooter && !loading && !failed;

  const fadeLeft = embedded
    ? 'bg-gradient-to-r from-amber-50/85 via-white/35 to-transparent'
    : 'bg-gradient-to-r from-white/95 via-white/40 to-transparent';
  const fadeRight = embedded
    ? 'bg-gradient-to-l from-amber-50/85 via-white/35 to-transparent'
    : 'bg-gradient-to-l from-white/95 via-white/40 to-transparent';

  return (
    <aside
      className={cn(
        embedded
          ? 'rounded-lg border-0 bg-transparent p-0 shadow-none ring-0'
          : cn(
              'rounded-xl border border-amber-200/65 bg-gradient-to-b from-white/95 to-amber-50/40',
              'p-3 shadow-sm ring-1 ring-emerald-600/10 sm:p-3.5'
            ),
        className
      )}
      aria-label={t('home.hcpCarousel.aria')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={cn('relative overflow-hidden rounded-lg', TRACK_FRAME)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {loading ? (
          <div className="flex h-full flex-col justify-center space-y-2 px-2 animate-pulse" aria-busy="true">
            <div className="h-3 w-40 rounded-md bg-amber-100/80" />
            <div className="h-20 rounded-xl bg-amber-100/50" />
            <div className="h-16 rounded-xl bg-amber-100/40" />
          </div>
        ) : failed ? (
          <div className="flex h-full items-center px-2">
            <p className="text-xs text-gray-600 leading-snug">{tk('ranking.loadError')}</p>
          </div>
        ) : n === 0 ? (
          <div className="flex h-full items-center px-2">
            <p className="w-full text-center text-xs leading-snug text-gray-500">{emptyLabel ?? tk('carousel.empty')}</p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-11 min-[400px]:flex items-center justify-start pl-1',
                fadeLeft
              )}
            >
              <button
                type="button"
                onClick={() => go(-1)}
                className="pointer-events-auto inline-flex h-9 w-9 shrink-0 touch-pan-y select-none items-center justify-center rounded-full border border-amber-200/90 bg-white/95 text-amber-900 shadow-md backdrop-blur-sm hover:bg-amber-50 sm:h-10 sm:w-10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={t('home.hcpCarousel.prev')}
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </button>
            </div>
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-11 min-[400px]:flex items-center justify-end pr-1',
                fadeRight
              )}
            >
              <button
                type="button"
                onClick={() => go(1)}
                className="pointer-events-auto inline-flex h-9 w-9 shrink-0 touch-pan-y select-none items-center justify-center rounded-full border border-amber-200/90 bg-white/95 text-amber-900 shadow-md backdrop-blur-sm hover:bg-amber-50 sm:h-10 sm:w-10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-label={t('home.hcpCarousel.next')}
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </button>
            </div>

            <div className="absolute inset-x-0 top-0 bottom-8 min-[400px]:px-10 px-2 py-0.5 overflow-hidden">
              {slides.map((slide, i) => (
                <div
                  key={slide.id}
                  className={cn(
                    'h-full transition-opacity duration-300 ease-out motion-reduce:transition-none',
                    i === safeIndex ? 'relative z-[1] opacity-100' : 'pointer-events-none absolute inset-0 z-0 opacity-0'
                  )}
                  aria-hidden={i !== safeIndex}
                >
                  {renderSlide(slide, embedded)}
                </div>
              ))}
            </div>

            {n > 1 ? (
              <div
                className="absolute bottom-1 left-0 right-0 z-30 flex justify-center gap-1.5 px-2 pt-1"
                role="tablist"
                aria-label={t('home.hcpCarousel.aria')}
              >
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    onClick={() => setIndex(i)}
                    className="inline-flex min-h-[44px] min-w-[44px] touch-pan-y select-none items-center justify-center rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                    aria-label={t('home.hcpCarousel.dot', { n: i + 1 })}
                    aria-selected={i === safeIndex}
                  >
                    <span
                      className={cn(
                        'block h-1.5 rounded-full transition-all motion-reduce:transition-none',
                        i === safeIndex ? 'w-5 bg-amber-600' : 'w-1.5 bg-amber-200 hover:bg-amber-300'
                      )}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      {showFooterBlock ? (
        <>
          <div className="my-3 h-px bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent" aria-hidden />
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-900/80">{tk('rewards.title')}</p>
            <p className="text-[10px] text-gray-600 leading-snug line-clamp-3 sm:text-[11px] sm:line-clamp-4">
              {tk('rewards.teaser')}
            </p>
            <Link
              href="/hcp-ranglijsten"
              className={cn(
                'flex w-full items-center justify-center rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500/15 to-emerald-600/15',
                'min-h-[44px] px-3 py-2 text-xs font-semibold text-amber-950 sm:text-sm',
                'hover:from-amber-500/25 hover:to-emerald-600/20 transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
              )}
            >
              {tk('ctaLeaderboards')}
            </Link>
          </div>
        </>
      ) : null}
    </aside>
  );
}
