'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Info, Sparkles, Trophy } from 'lucide-react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { HCP_BADGE_CATALOG } from '@/lib/gamification/badge-catalog';
import { labelForHcpAction } from '@/lib/gamification/hcp-action-labels';
import { iconKeyToDisplayIcon } from '@/lib/gamification/author-badge-summaries';
import type { LeaderboardRow } from '@/lib/gamification/leaderboard-queries';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';

type LeaderboardPayload = {
  allTime: LeaderboardRow[];
  weekly: LeaderboardRow[];
  monthly: LeaderboardRow[];
  me?: { allTimeRank: number | null; weeklyRank: number | null; monthlyRank: number | null };
};

type Tab = 'allTime' | 'weekly' | 'monthly';

export default function MijnHcpClient() {
  const { data, loading, error } = useGamificationMe();
  const [lb, setLb] = useState<LeaderboardPayload | null>(null);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbTab, setLbTab] = useState<Tab>('allTime');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gamification/leaderboard', { credentials: 'include' });
        if (!res.ok) throw new Error('leaderboard');
        const json = (await res.json()) as LeaderboardPayload;
        if (!cancelled) setLb(json);
      } catch {
        if (!cancelled) setLb(null);
      } finally {
        if (!cancelled) setLbLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const earnedSlugs = useMemo(() => new Set((data?.badges ?? []).map((b) => b.slug)), [data?.badges]);

  const earnedCatalog = useMemo(
    () => HCP_BADGE_CATALOG.filter((b) => earnedSlugs.has(b.slug)),
    [earnedSlugs]
  );

  const lockedCatalog = useMemo(
    () => HCP_BADGE_CATALOG.filter((b) => !earnedSlugs.has(b.slug)),
    [earnedSlugs]
  );

  const extraEarned = useMemo(
    () =>
      (data?.badges ?? []).filter((b) => !HCP_BADGE_CATALOG.some((c) => c.slug === b.slug)),
    [data?.badges]
  );

  const rows = lbTab === 'allTime' ? lb?.allTime : lbTab === 'weekly' ? lb?.weekly : lb?.monthly;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-gray-600">
        HomeCheff Points laden…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-red-700">
        {error ?? 'Kon je voortgang niet laden.'}
      </div>
    );
  }

  const progressPct =
    data.nextLevelHcp > 0
      ? Math.min(100, Math.round((100 * (data.nextLevelHcp - data.hcpToNextLevel)) / data.nextLevelHcp))
      : 100;

  const streakText =
    data.currentStreak === 0
      ? 'Nog geen login-streak'
      : data.currentStreak === 1
        ? '1 dag streak'
        : `${data.currentStreak} dagen streak`;

  const lastEvent = data.recentEvents?.[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">HomeCheff Points</h1>
        <p className="text-sm text-gray-600 mt-1">Jouw voortgang, badges en ranglijsten.</p>
      </header>

      {/* 1. Voortgang */}
      <section aria-labelledby="hcp-progress-heading" className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <h2 id="hcp-progress-heading" className="text-sm font-semibold text-amber-900 uppercase tracking-wide">
          Mijn voortgang
        </h2>
        <p className="mt-3 text-lg font-bold text-gray-900">Jouw HomeCheff Points</p>
        <p className="mt-1 text-2xl font-extrabold text-amber-950 tabular-nums">
          <span aria-hidden>⭐</span> {data.totalHcp.toLocaleString('nl-NL')} HCP
        </p>
        <p className="mt-2 text-gray-800">
          Level <span className="font-bold">{data.level}</span>
        </p>
        <p className="mt-1 text-sm text-gray-700">
          <span aria-hidden>🔥</span> {streakText}
          {data.longestStreak > 0 ? (
            <span className="text-gray-500"> · Langste streak: {data.longestStreak} dagen</span>
          ) : null}
        </p>
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-amber-100" aria-hidden>
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Nog {data.hcpToNextLevel.toLocaleString('nl-NL')} HCP tot level {data.level + 1} (doel:{' '}
            {data.nextLevelHcp.toLocaleString('nl-NL')} HCP).
          </p>
        </div>
      </section>

      {/* Recent */}
      <section aria-labelledby="hcp-recent-heading">
        <h2 id="hcp-recent-heading" className="text-lg font-bold text-gray-900 mb-3">
          Recent verdiend
        </h2>
        {data.recentEvents?.length ? (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {data.recentEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-gray-800 min-w-0 flex-1 truncate">{labelForHcpAction(e.action)}</span>
                <span className="shrink-0 font-semibold text-emerald-700 tabular-nums">+{e.points} HCP</span>
                <time className="shrink-0 text-xs text-gray-500" dateTime={e.createdAt}>
                  {new Date(e.createdAt).toLocaleString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-sm">Nog geen HCP verdiend.</p>
        )}
      </section>

      {/* Badges */}
      <section aria-labelledby="hcp-badges-heading">
        <h2 id="hcp-badges-heading" className="text-lg font-bold text-gray-900">
          Competenties & badges
        </h2>
        <p className="text-xs text-gray-500 mt-1">Behaald en nog te behalen competenties.</p>

        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">Behaald</h3>
            <div className="flex flex-wrap gap-2">
              {extraEarned.map((b) => (
                <span
                  key={b.slug}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
                >
                  <span aria-hidden>{iconKeyToDisplayIcon(b.iconKey)}</span>
                  {b.name}
                </span>
              ))}
              {earnedCatalog.map((b) => (
                <span
                  key={b.slug}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
                >
                  <span aria-hidden>{iconKeyToDisplayIcon(b.iconKey)}</span>
                  {b.name}
                </span>
              ))}
              {earnedCatalog.length === 0 && extraEarned.length === 0 ? (
                <span className="text-sm text-gray-600">
                  Nog geen badges — blijf actief om ze te ontgrendelen. Binnenkort verschijnen hier meer competenties.
                </span>
              ) : null}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Nog te behalen</h3>
            <div className="flex flex-wrap gap-2">
              {lockedCatalog.map((b) => (
                <span
                  key={b.slug}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500"
                  title={b.description}
                >
                  <span aria-hidden>{iconKeyToDisplayIcon(b.iconKey)}</span>
                  {b.name}
                </span>
              ))}
              {lockedCatalog.length === 0 ? (
                <span className="text-sm text-gray-600">Je hebt alle catalogus-badges! 🎉</span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section aria-labelledby="hcp-lb-heading">
        <h2 id="hcp-lb-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" aria-hidden />
          Ranglijsten
        </h2>
        <p className="text-xs text-gray-500 mt-1">Top HomeCheffers — algemeen, deze week en deze maand.</p>

        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Periode ranglijst">
          {(
            [
              ['allTime', 'Top algemeen'],
              ['weekly', 'Deze week'],
              ['monthly', 'Deze maand'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={lbTab === id}
              onClick={() => setLbTab(id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium border transition-colors',
                lbTab === id
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {lb?.me ? (
          <p className="mt-3 text-xs text-gray-600">
            Jouw plek: algemeen #{lb.me.allTimeRank ?? '—'}
            {lb.me.weeklyRank != null ? ` · deze week #${lb.me.weeklyRank}` : ''}
            {lb.me.monthlyRank != null ? ` · deze maand #${lb.me.monthlyRank}` : ''}
          </p>
        ) : null}

        {lbLoading ? (
          <p className="mt-4 text-sm text-gray-500">Ranglijst laden…</p>
        ) : !rows?.length ? (
          <p className="mt-4 text-sm text-gray-600">Nog onvoldoende data voor deze ranglijst.</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {rows.map((r) => (
              <li
                key={`${lbTab}-${r.userId}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2"
              >
                <span className="w-7 text-center text-sm font-bold text-amber-800 tabular-nums">{r.rank}</span>
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {r.avatar ? (
                    <SafeImage src={r.avatar} alt="" fill className="object-cover" sizes="36px" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-gray-500">HC</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{r.displayName}</p>
                  <p className="truncate text-xs text-gray-500">@{r.username ?? '—'} · Level {r.level}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-emerald-800 tabular-nums">
                  {r.score.toLocaleString('nl-NL')} HCP
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Info */}
      <section
        aria-labelledby="hcp-how-heading"
        className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5"
      >
        <h2 id="hcp-how-heading" className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Info className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
          Hoe verdien je HCP?
        </h2>
        <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm text-gray-800">
          <li>Dagelijks inloggen</li>
          <li>Je profiel compleet maken</li>
          <li>Producten plaatsen op het dorpsplein</li>
          <li>Inspiratie plaatsen (recepten, tuin, design)</li>
          <li>Foto’s en video toevoegen</li>
          <li>Reviews ontvangen</li>
          <li>Verkopen halen</li>
          <li>Community-acties (props, betrokkenheid)</li>
          <li>Referrals en uitnodigingen</li>
        </ul>
        <p className="mt-4 text-xs text-gray-600">
          Nog geen echte geldprijzen of externe koppelingen — HCP is nu vooral zichtbaarheid en plezier op het
          platform.
        </p>
      </section>

      {lastEvent ? (
        <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Laatste: {labelForHcpAction(lastEvent.action)} (+{lastEvent.points} HCP)
        </p>
      ) : null}

      <p className="text-center">
        <Link href="/profile" className="text-sm font-medium text-emerald-700 hover:underline">
          Terug naar Mijn HC
        </Link>
      </p>
    </div>
  );
}
