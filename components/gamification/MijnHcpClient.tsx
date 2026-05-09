'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Info, Sparkles, Trophy } from 'lucide-react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { HCP_BADGE_CATALOG } from '@/lib/gamification/badge-catalog';
import { labelForHcpAction } from '@/lib/gamification/hcp-action-labels';
import { iconKeyToDisplayIcon } from '@/lib/gamification/author-badge-summaries';
import type { LeaderboardRow } from '@/lib/gamification/leaderboard-queries';
import { HCP_V2_REWARD_CATALOG } from '@/lib/gamification/v2-reward-catalog';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';
import HcpWelcomeGate from '@/components/gamification/HcpWelcomeGate';
import {
  HcpLockedBadgeButton,
  HcpLockedBadgeDetailSheet,
} from '@/components/gamification/HcpLockedBadgeExplainer';

type LeaderboardPayload = {
  allTime: LeaderboardRow[];
  weekly: LeaderboardRow[];
  monthly: LeaderboardRow[];
  me?: { allTimeRank: number | null; weeklyRank: number | null; monthlyRank: number | null };
  meta?: { weekKey: string; weekStartUtc: string; monthStartUtc: string };
};

type Tab = 'allTime' | 'weekly' | 'monthly';

export default function MijnHcpClient() {
  const { data, loading, error } = useGamificationMe();
  const [lb, setLb] = useState<LeaderboardPayload | null>(null);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbTab, setLbTab] = useState<Tab>('allTime');
  const [rankMovement, setRankMovement] = useState<string | null>(null);
  /** Welke vergrendelde badge het uitleg-sheet toont (`null` = gesloten). */
  const [lockedBadgeSlug, setLockedBadgeSlug] = useState<string | null>(null);

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

  useEffect(() => {
    setRankMovement(null);
    if (typeof window === 'undefined' || !lb?.meta || !lb.me) return;
    const curr =
      lbTab === 'allTime' ? lb.me.allTimeRank : lbTab === 'weekly' ? lb.me.weeklyRank : lb.me.monthlyRank;
    if (curr == null) return;
    const periodId =
      lbTab === 'monthly' ? lb.meta.monthStartUtc : lbTab === 'weekly' ? lb.meta.weekKey : 'all';
    const key = `hc_lb_prev_${lbTab}_${periodId}`;
    const prevS = localStorage.getItem(key);
    if (prevS != null) {
      const prev = Number(prevS);
      if (Number.isFinite(prev) && prev !== curr) {
        setRankMovement(curr < prev ? '↑ Gestegen' : '↓ Gedaald');
      }
    }
    localStorage.setItem(key, String(curr));
  }, [lb, lbTab]);

  const earnedSlugs = useMemo(() => new Set((data?.badges ?? []).map((b) => b.slug)), [data?.badges]);

  const earnedCatalog = useMemo(
    () => HCP_BADGE_CATALOG.filter((b) => earnedSlugs.has(b.slug)),
    [earnedSlugs]
  );

  const lockedCatalog = useMemo(
    () => HCP_BADGE_CATALOG.filter((b) => !earnedSlugs.has(b.slug)),
    [earnedSlugs]
  );

  const lockedSheetEntry = useMemo(
    () => (lockedBadgeSlug ? lockedCatalog.find((b) => b.slug === lockedBadgeSlug) ?? null : null),
    [lockedBadgeSlug, lockedCatalog]
  );

  useEffect(() => {
    if (lockedBadgeSlug != null && lockedSheetEntry == null) {
      setLockedBadgeSlug(null);
    }
  }, [lockedBadgeSlug, lockedSheetEntry]);

  const extraEarned = useMemo(
    () =>
      (data?.badges ?? []).filter((b) => !HCP_BADGE_CATALOG.some((c) => c.slug === b.slug)),
    [data?.badges]
  );

  const rows = lbTab === 'allTime' ? lb?.allTime : lbTab === 'weekly' ? lb?.weekly : lb?.monthly;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-28 rounded-xl bg-gray-100 animate-pulse" />
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
  const challenges = data.weeklyChallenges?.items ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 space-y-8">
      <HcpWelcomeGate />

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
          Level <span className="font-bold text-amber-900">{data.level}</span>
        </p>
        <p className="mt-1 text-sm text-gray-700">
          <span aria-hidden>🔥</span> {streakText}
          {data.longestStreak > 0 ? (
            <span className="text-gray-500"> · Langste streak: {data.longestStreak} dagen</span>
          ) : null}
        </p>
        <div className="mt-4">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-amber-100/90 shadow-inner" aria-hidden>
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
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
            <p className="text-xs text-gray-500 mb-2">
              Tik op een badge voor uitleg (mobiel). Op desktop zie je ook een hint bij hover of toetsenbordfocus.
            </p>
            <div className="flex flex-wrap gap-2">
              {lockedCatalog.map((b) => (
                <HcpLockedBadgeButton
                  key={b.slug}
                  entry={b}
                  expanded={lockedBadgeSlug === b.slug}
                  onOpen={() => setLockedBadgeSlug(b.slug)}
                />
              ))}
              {lockedCatalog.length === 0 ? (
                <span className="text-sm text-gray-600">Je hebt alle catalogus-badges! 🎉</span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Weekly challenges */}
      <section aria-labelledby="hcp-ch-heading">
        <h2 id="hcp-ch-heading" className="text-lg font-bold text-gray-900">
          Uitdagingen van deze week
        </h2>
        <p className="text-xs text-gray-500 mt-1">Korte doelen — automatisch gevolgd op basis van je activiteit.</p>
        <ul className="mt-3 space-y-2">
          {challenges.length === 0 ? (
            <li className="text-sm text-gray-600">Challenges worden geladen bij je volgende bezoek.</li>
          ) : (
            challenges.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.description}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-emerald-800 tabular-nums">
                  {c.completed ? '✓' : `${c.progress}/${c.target}`}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Placeholder rewards */}
      <section aria-labelledby="hcp-rew-heading">
        <h2 id="hcp-rew-heading" className="text-lg font-bold text-gray-900">
          Beschikbare beloningen
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Placeholders voor toekomstige visibility-spotlights — nog geen automatische uitbetaling of Stripe.
        </p>
        <ul className="mt-3 space-y-2">
          {HCP_V2_REWARD_CATALOG.map((r) => (
            <li key={r.id} className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5">
              <p className="text-sm font-semibold text-violet-950">{r.title}</p>
              <p className="text-xs text-gray-600">{r.description}</p>
              <p className="mt-1 text-[11px] font-medium text-violet-800">{r.requirement}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Leaderboard */}
      <section aria-labelledby="hcp-lb-heading">
        <h2 id="hcp-lb-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" aria-hidden />
          Ranglijsten
        </h2>
        <p className="text-xs text-gray-500 mt-1">Tabs: algemeen · deze week · deze maand. Jouw rij is gemarkeerd.</p>

        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Periode ranglijst">
          {(
            [
              ['allTime', 'Algemeen'],
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
            {rankMovement ? (
              <span className="ml-2 font-semibold text-emerald-800">{rankMovement}</span>
            ) : null}
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
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 sm:flex-nowrap',
                  r.isCurrentUser
                    ? 'border-amber-300 bg-amber-50/70 ring-2 ring-amber-400/40'
                    : 'border-gray-100 bg-white'
                )}
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
                  <p className="truncate font-medium text-gray-900">
                    {r.displayName}
                    {r.isCurrentUser ? (
                      <span className="ml-2 text-[10px] font-bold uppercase text-amber-800">Jij</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-gray-500">@{r.username ?? '—'} · Level {r.level}</p>
                  <UserBadgeChips
                    badges={r.badgeSummaries.map((b) => ({ key: b.key, name: b.name, icon: b.icon }))}
                    max={2}
                    size="sm"
                    className="mt-1"
                  />
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
          Er zijn nu geen vaste geldprijzen of automatische uitbetalingen gekoppeld aan HCP. In de toekomst kunnen
          punten wel worden gekoppeld aan extra zichtbaarheid, beloningen en acties — dat communiceert HomeCheff dan
          apart en vooraf.
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

      <HcpLockedBadgeDetailSheet
        entry={lockedSheetEntry}
        open={lockedSheetEntry != null}
        onClose={() => setLockedBadgeSlug(null)}
      />
    </div>
  );
}
