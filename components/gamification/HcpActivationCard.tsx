'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Leaf, Package, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { useTranslation } from '@/hooks/useTranslation';
import HcpHomeCarousel from '@/components/gamification/HcpHomeCarousel';
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

  const tk = (key: string, opts?: Record<string, string | number>) => t(`${HP}.${key}`, opts);

  const loggedIn = status === 'authenticated' && Boolean(session?.user);

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
    <div className="min-w-0 space-y-4">
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

      <div className="pt-1 border-t border-amber-100/80">
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
        'rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/40 p-4 sm:p-5 shadow-sm ring-1 ring-amber-500/5',
        className
      )}
      aria-labelledby="hcp-activation-heading"
    >
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:items-start">
        <div className="order-1 min-w-0 lg:order-none">{leftColumn}</div>
        <div className="order-2 min-w-0 lg:order-none">
          <HcpHomeCarousel lang={language} />
        </div>
      </div>
    </section>
  );
}
