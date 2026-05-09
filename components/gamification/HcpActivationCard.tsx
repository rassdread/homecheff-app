'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Leaf, Package, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { useTranslation } from '@/hooks/useTranslation';
import HcpHomeCarousel from '@/components/gamification/HcpHomeCarousel';
import type { HomeCarouselSlide } from '@/lib/gamification/home-carousel-types';
import { interleaveDataAndPromoSlides } from '@/lib/gamification/home-carousel-merge';
import { cn } from '@/lib/utils';

function isUtcToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getUTCFullYear() === n.getUTCFullYear() &&
    d.getUTCMonth() === n.getUTCMonth() &&
    d.getUTCDate() === n.getUTCDate()
  );
}

type MissionRow = {
  key: string;
  label: string;
  done: boolean;
  progress?: number;
  target?: number;
};

const HP = 'home.hcpActivation';

export default function HcpActivationCard({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const { t, language } = useTranslation();
  const { data, loading, error } = useGamificationMe();

  const [carouselLoading, setCarouselLoading] = useState(true);
  const [carouselFailed, setCarouselFailed] = useState(false);
  const [dataSlides, setDataSlides] = useState<HomeCarouselSlide[]>([]);
  const [promoSlides, setPromoSlides] = useState<HomeCarouselSlide[]>([]);

  const tk = (key: string, opts?: Record<string, string | number>) => t(`${HP}.${key}`, opts);

  const loggedIn = status === 'authenticated' && Boolean(session?.user);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    setCarouselLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/gamification/home-carousel?lang=${language}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('carousel');
        const json = (await res.json()) as {
          dataSlides?: HomeCarouselSlide[];
          promoSlides?: HomeCarouselSlide[];
          slides?: HomeCarouselSlide[];
        };
        if (cancelled) return;
        const d =
          json.dataSlides ??
          json.slides?.filter((s) => s.kind === 'ranking' || s.kind === 'spotlight') ??
          [];
        const p =
          json.promoSlides ??
          json.slides?.filter((s) => s.kind === 'promo' || s.kind === 'admin') ??
          [];
        setDataSlides(d);
        setPromoSlides(p);
        setCarouselFailed(false);
      } catch {
        if (!cancelled) {
          setCarouselFailed(true);
          setDataSlides([]);
          setPromoSlides([]);
        }
      } finally {
        if (!cancelled) setCarouselLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, language]);

  const mergedSlides = useMemo(
    () => interleaveDataAndPromoSlides(dataSlides, promoSlides),
    [dataSlides, promoSlides]
  );

  /** Voorkomt lange reeksen alleen admin-tekst in de promo-kolom (desktop). */
  const promoBalanced = useMemo(
    () =>
      interleaveDataAndPromoSlides(
        promoSlides.filter((s) => !s.id.startsWith('admin:')),
        promoSlides.filter((s) => s.id.startsWith('admin:'))
      ),
    [promoSlides]
  );

  const missions = useMemo((): MissionRow[] => {
    if (!data) return [];
    const loggedInToday = data.recentEvents.some(
      (e) => e.action === 'DAILY_LOGIN' && isUtcToday(e.createdAt)
    );
    const rows: MissionRow[] = [
      {
        key: 'daily-login',
        label: tk('missionLoginToday'),
        done: loggedInToday,
      },
    ];
    const weekly = [...(data.weeklyChallenges?.items ?? [])].sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
      const ra = a.target > 0 ? a.progress / a.target : 0;
      const rb = b.target > 0 ? b.progress / b.target : 0;
      return rb - ra;
    });
    for (const c of weekly) {
      if (rows.length >= 3) break;
      const tid = `home.hcpActivation.challengeIds.${c.id}`;
      const label = t(tid) || c.title;
      rows.push({
        key: c.id,
        label,
        done: c.completed,
        progress: c.progress,
        target: c.target,
      });
    }
    return rows;
  }, [data, t]);

  const progressPct = useMemo(() => {
    if (!data?.nextLevelHcp) return 100;
    return Math.min(
      100,
      Math.round((100 * (data.nextLevelHcp - data.hcpToNextLevel)) / data.nextLevelHcp)
    );
  }, [data]);

  const isFreshUser = useMemo(() => {
    if (!data) return false;
    return data.totalHcp < 25 && data.badges.length === 0 && data.recentEvents.length <= 2;
  }, [data]);

  if (!loggedIn) return null;

  if (loading && !data) {
    return (
      <section
        className={cn(
          'rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50/80 via-white to-teal-50/30 p-4 shadow-sm min-h-[168px]',
          className
        )}
        aria-busy="true"
        aria-label={tk('loadingAria')}
      >
        <div className="h-4 w-40 rounded-md bg-amber-100/80 animate-pulse mb-3" />
        <div className="h-3 w-full rounded-full bg-amber-100/60 animate-pulse mb-2" />
        <div className="h-16 rounded-xl bg-gray-100/80 animate-pulse" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        className={cn(
          'rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-600 min-h-[56px]',
          className
        )}
      >
        {tk('loadError')}
      </section>
    );
  }

  const streakLabel =
    data.currentStreak === 0
      ? tk('streakNone')
      : data.currentStreak === 1
        ? tk('streakOne')
        : tk('streakMany', { count: data.currentStreak });

  const leftColumn = (
    <div className="min-w-0 space-y-3 lg:space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="hcp-activation-heading" className="sr-only">
          {tk('sectionTitle')}
        </h2>
        <p className="text-base sm:text-lg font-bold text-gray-900 tabular-nums">
          <span aria-hidden className="mr-1">
            ⭐
          </span>
          {data.totalHcp.toLocaleString()} HCP · {tk('level', { level: data.level })}
        </p>
        <p
          className={cn(
            'text-sm font-medium text-amber-900 tabular-nums inline-flex items-center gap-1',
            data.currentStreak > 0 && 'motion-safe:animate-pulse'
          )}
        >
          <span aria-hidden>🔥</span>
          {streakLabel}
        </p>
      </div>

      <div className="relative">
        <div
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-amber-100/90 shadow-inner"
          aria-hidden
        >
          <div
            className="relative h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-600 transition-[width] duration-500 ease-out shadow-[0_0_14px_rgba(245,158,11,0.35)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600">
          {tk('toNextLevel', {
            amount: data.hcpToNextLevel.toLocaleString(),
            next: data.level + 1,
          })}
        </p>
      </div>

      {isFreshUser ? (
        <p className="text-sm text-emerald-900/90 leading-snug rounded-lg bg-emerald-50/80 border border-emerald-100 px-3 py-2">
          {tk('freshUserHint')}
        </p>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80 mb-2">
          {tk('missionsHeading')}
        </p>
        <ul className="space-y-2">
          {missions.map((m) => (
            <li key={m.key} className="flex items-start gap-2 text-sm text-gray-800">
              <span
                className={cn(
                  'mt-0.5 shrink-0 w-5 text-center transition-transform duration-200',
                  m.done && 'motion-safe:scale-110'
                )}
                aria-hidden
              >
                {m.done ? '✅' : '⬜'}
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                {m.label}
                {!m.done && m.target != null && m.progress != null ? (
                  <span className="text-gray-500 tabular-nums">
                    {' '}
                    ({m.progress}/{m.target})
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-1 lg:pt-0 border-t border-amber-100/80 lg:border-transparent">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
          {tk('quickActions')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/profile"
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-900',
              'hover:bg-emerald-50 active:bg-emerald-100/80 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2'
            )}
          >
            <Leaf className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {tk('ctaInspiration')}
          </Link>
          <Link
            href="/sell/new"
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-amber-950',
              'hover:bg-amber-50 active:bg-amber-100/80 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2'
            )}
          >
            <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {tk('ctaProduct')}
          </Link>
          <Link
            href="/mijn-hcp"
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-violet-950',
              'hover:bg-violet-50 active:bg-violet-100/80 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2'
            )}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {tk('ctaMijnHcp')}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <section
      id="homecheff-hcp-activation"
      className={cn(
        'rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/40 p-3 sm:p-4 lg:p-4 shadow-sm ring-1 ring-amber-500/5',
        className
      )}
      aria-labelledby="hcp-activation-heading"
    >
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="min-w-0">{leftColumn}</div>
        <HcpHomeCarousel
          slides={mergedSlides}
          loading={carouselLoading}
          failed={carouselFailed}
          showFooter
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-x-4 lg:items-stretch lg:min-h-[248px]">
        <div className="lg:col-span-3 flex flex-col min-w-0">{leftColumn}</div>
        <div className="lg:col-span-5 flex flex-col min-w-0 min-h-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/75 mb-1 shrink-0">
            {tk('carousel.dataHeading')}
          </p>
          <div className="min-h-0 flex-1">
            <HcpHomeCarousel
              slides={dataSlides}
              loading={carouselLoading}
              failed={carouselFailed}
              showFooter={false}
              emptyLabel={tk('carousel.empty')}
              className="h-full"
            />
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col min-w-0 min-h-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-900/75 mb-1 shrink-0">
            {tk('carousel.promoHeading')}
          </p>
          <div className="min-h-0 flex-1">
            <HcpHomeCarousel
              slides={promoBalanced}
              loading={carouselLoading}
              failed={carouselFailed}
              promoColumn
              showFooter={false}
              emptyLabel={tk('carousel.empty')}
              className="h-full"
            />
          </div>
        </div>

        <div className="lg:col-span-12 mt-3 pt-3 border-t border-amber-100/80 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-[11px] text-gray-600 leading-snug line-clamp-3 flex-1 min-w-0">{tk('rewards.teaser')}</p>
          <Link
            href="/hcp-ranglijsten"
            className={cn(
              'shrink-0 inline-flex items-center justify-center rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500/15 to-emerald-600/15',
              'min-h-[40px] px-4 py-2 text-xs font-semibold text-amber-950 whitespace-nowrap',
              'hover:from-amber-500/25 hover:to-emerald-600/20 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2'
            )}
          >
            {tk('ctaLeaderboards')}
          </Link>
        </div>
      </div>
    </section>
  );
}
