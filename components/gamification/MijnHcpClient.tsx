'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Info, MapPin, Sparkles, Trophy } from 'lucide-react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { useTranslation } from '@/hooks/useTranslation';
import {
  HCP_BADGE_CATALOG,
  badgeCatalogEntryBySlug,
  type BadgeCatalogEntry,
} from '@/lib/gamification/badge-catalog';
import { labelForHcpAction } from '@/lib/gamification/hcp-action-labels';
import type { LeaderboardRow } from '@/lib/gamification/leaderboard-queries';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';
import { HcpLevelPill } from '@/components/gamification/HcpLevelPill';
import HcpWelcomeGate from '@/components/gamification/HcpWelcomeGate';
import {
  HcpBadgeDetailSheet,
  HcpEarnedBadgeButton,
  HcpLockedBadgeButton,
} from '@/components/gamification/HcpLockedBadgeExplainer';

type ScopedLbResponse = {
  rows: LeaderboardRow[];
  me?: { rank: number | null; score: number };
  meta: {
    scope: string;
    period: string;
    radiusKm?: number;
    locationSource?: string;
    hint?: string;
    weekKey: string;
    weekStartUtc: string;
    monthStartUtc: string;
    yearStartUtc?: string;
    countryCode?: string | null;
  };
};

type LbScope = 'nearby' | 'country' | 'worldwide';
type LbPeriod = 'week' | 'month' | 'year' | 'all';

const HP_REWARDS = 'home.hcpActivation.rewards';

export default function MijnHcpClient() {
  const { t } = useTranslation();
  const { data, loading, error } = useGamificationMe();
  const [scopedLb, setScopedLb] = useState<ScopedLbResponse | null>(null);
  const [lbLoading, setLbLoading] = useState(true);
  const [lbScope, setLbScope] = useState<LbScope>('nearby');
  const [lbPeriod, setLbPeriod] = useState<LbPeriod>('week');
  const [radiusKm, setRadiusKm] = useState<25 | 50 | 100>(50);
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [rankMovement, setRankMovement] = useState<string | null>(null);
  /** Open badge-detail (zelfde sheet): vergrendeld of behaald. */
  const [badgeSheet, setBadgeSheet] = useState<{ mode: 'locked' | 'earned'; slug: string } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLbLoading(true);
      try {
        const params = new URLSearchParams({
          scope: lbScope,
          period: lbPeriod,
        });
        if (lbScope === 'nearby') {
          params.set('radiusKm', String(radiusKm));
          if (gpsPos) {
            params.set('lat', String(gpsPos.lat));
            params.set('lng', String(gpsPos.lng));
          }
        }
        const res = await fetch(`/api/gamification/leaderboard?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('leaderboard');
        const json = (await res.json()) as ScopedLbResponse;
        if (!cancelled) setScopedLb(json);
      } catch {
        if (!cancelled) setScopedLb(null);
      } finally {
        if (!cancelled) setLbLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lbScope, lbPeriod, radiusKm, gpsPos]);

  useEffect(() => {
    setRankMovement(null);
    if (typeof window === 'undefined' || !scopedLb?.meta || scopedLb.me?.rank == null) return;
    const curr = scopedLb.me.rank;
    const periodKey =
      lbPeriod === 'month'
        ? scopedLb.meta.monthStartUtc
        : lbPeriod === 'year'
          ? scopedLb.meta.yearStartUtc ?? 'year'
          : lbPeriod === 'week'
            ? scopedLb.meta.weekKey
            : 'all';
    const key = `hc_lb_prev_${lbScope}_${lbPeriod}_${periodKey}_${radiusKm}_${gpsPos ? 'gps' : 'prof'}`;
    const prevS = localStorage.getItem(key);
    if (prevS != null) {
      const prev = Number(prevS);
      if (Number.isFinite(prev) && prev !== curr) {
        setRankMovement(curr < prev ? '↑ Gestegen' : '↓ Gedaald');
      }
    }
    localStorage.setItem(key, String(curr));
  }, [scopedLb, lbPeriod, lbScope, radiusKm, gpsPos]);

  const requestGps = () => {
    setGpsError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Locatie wordt niet ondersteund in deze browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setGpsError(
          'Geen toegang tot locatie. Controleer je browserinstellingen, of we gebruiken je profiel-locatie.'
        );
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 }
    );
  };

  const earnedSlugs = useMemo(() => new Set((data?.badges ?? []).map((b) => b.slug)), [data?.badges]);

  const earnedCatalog = useMemo(
    () => HCP_BADGE_CATALOG.filter((b) => earnedSlugs.has(b.slug)),
    [earnedSlugs]
  );

  const lockedCatalog = useMemo(
    () => HCP_BADGE_CATALOG.filter((b) => !earnedSlugs.has(b.slug)),
    [earnedSlugs]
  );

  useEffect(() => {
    if (!badgeSheet) return;
    if (badgeSheet.mode === 'locked') {
      if (!lockedCatalog.some((b) => b.slug === badgeSheet.slug)) setBadgeSheet(null);
    } else if (!earnedSlugs.has(badgeSheet.slug)) {
      setBadgeSheet(null);
    }
  }, [badgeSheet, lockedCatalog, earnedSlugs]);

  const badgeSheetModel = useMemo(() => {
    if (!badgeSheet || !data) return null;
    const { mode, slug } = badgeSheet;
    if (mode === 'locked') {
      const e = lockedCatalog.find((b) => b.slug === slug);
      return e ? ({ mode, entry: e, earnedAtIso: null } as const) : null;
    }
    const apiBadge = data.badges.find((b) => b.slug === slug);
    if (!apiBadge) return null;
    const catalog = badgeCatalogEntryBySlug(slug);
    const entry: BadgeCatalogEntry =
      catalog ??
      ({
        slug: apiBadge.slug,
        name: apiBadge.name,
        description: apiBadge.description ?? 'Speciale badge op je account.',
        iconKey: apiBadge.iconKey ?? 'spark',
        unlockHint: '',
      } satisfies BadgeCatalogEntry);
    return { mode: 'earned' as const, entry, earnedAtIso: apiBadge.awardedAt };
  }, [badgeSheet, data, lockedCatalog]);

  const extraEarned = useMemo(
    () =>
      (data?.badges ?? []).filter((b) => !HCP_BADGE_CATALOG.some((c) => c.slug === b.slug)),
    [data?.badges]
  );

  const lbRows = scopedLb?.rows ?? [];

  const rewardStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      coming_soon: 'Binnenkort',
      unlocked: 'Behaald',
      active: 'Actief',
      expired: 'Verlopen',
    };
    return map[s] ?? s;
  };

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
            <p className="text-xs text-gray-500 mb-2">
              Tik op een behaalde badge voor datum en uitleg; tik op een open badge om te zien hoe je die verdient.
            </p>
            <div className="flex flex-wrap gap-2">
              {extraEarned.map((b) => {
                const entry: BadgeCatalogEntry = {
                  slug: b.slug,
                  name: b.name,
                  description: b.description ?? 'Speciale badge op je account.',
                  iconKey: b.iconKey ?? 'spark',
                  unlockHint: '',
                };
                return (
                  <HcpEarnedBadgeButton
                    key={b.slug}
                    entry={entry}
                    expanded={badgeSheet?.mode === 'earned' && badgeSheet.slug === b.slug}
                    onOpen={() => setBadgeSheet({ mode: 'earned', slug: b.slug })}
                  />
                );
              })}
              {earnedCatalog.map((b) => (
                <HcpEarnedBadgeButton
                  key={b.slug}
                  entry={b}
                  expanded={badgeSheet?.mode === 'earned' && badgeSheet.slug === b.slug}
                  onOpen={() => setBadgeSheet({ mode: 'earned', slug: b.slug })}
                />
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
              Op desktop zie je bij open badges ook een hint bij hover of toetsenbordfocus.
            </p>
            <div className="flex flex-wrap gap-2">
              {lockedCatalog.map((b) => (
                <HcpLockedBadgeButton
                  key={b.slug}
                  entry={b}
                  expanded={badgeSheet?.mode === 'locked' && badgeSheet.slug === b.slug}
                  onOpen={() => setBadgeSheet({ mode: 'locked', slug: b.slug })}
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

      {/* Automatische beloningen (server) */}
      <section aria-labelledby="hcp-rew-heading">
        <h2 id="hcp-rew-heading" className="text-lg font-bold text-gray-900">
          Beschikbare beloningen
        </h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t(`${HP_REWARDS}.teaser`)}</p>
        <ul className="mt-3 space-y-2">
          {(data.hcpRewards ?? []).map((r) => (
            <li
              key={r.id}
              className={cn(
                'rounded-xl border px-3 py-2.5',
                r.displayStatus === 'active'
                  ? 'border-emerald-200 bg-emerald-50/80'
                  : r.displayStatus === 'expired'
                    ? 'border-gray-200 bg-gray-50/80 opacity-80'
                    : r.displayStatus === 'unlocked'
                      ? 'border-amber-200 bg-amber-50/60'
                      : r.displayStatus === 'locked'
                        ? 'border-gray-200 bg-white'
                        : 'border-violet-100 bg-violet-50/50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    r.displayStatus === 'active'
                      ? 'bg-emerald-600 text-white'
                      : r.displayStatus === 'expired'
                        ? 'bg-gray-400 text-white'
                        : r.displayStatus === 'unlocked'
                          ? 'bg-amber-600 text-white'
                          : r.displayStatus === 'locked'
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-violet-200 text-violet-900'
                  )}
                >
                  {rewardStatusLabel(r.displayStatus)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{r.description}</p>
              <p className="mt-1 text-[11px] font-medium text-violet-800">{r.requirement}</p>
              {r.expiresAt ? (
                <p className="mt-1 text-[10px] text-gray-500">
                  {r.displayStatus === 'expired' ? 'Verlopen per ' : 'Tot '}
                  {new Date(r.expiresAt).toLocaleString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {/* Leaderboard — scoped */}
      <section aria-labelledby="hcp-lb-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="hcp-lb-heading" className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" aria-hidden />
            Ranglijsten
          </h2>
          <Link
            href="/hcp-ranglijsten"
            className="text-sm font-semibold text-teal-800 hover:text-teal-950 hover:underline shrink-0"
          >
            Bekijk alle ranglijsten →
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Gebied">
          {(
            [
              ['nearby', 'In de buurt'],
              ['country', 'Land'],
              ['worldwide', 'Wereldwijd'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={lbScope === id}
              onClick={() => setLbScope(id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium border transition-colors',
                lbScope === id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Periode">
          {(
            [
              ['week', 'Deze week'],
              ['month', 'Deze maand'],
              ['year', 'Dit jaar'],
              ['all', 'Algemeen'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={lbPeriod === id}
              onClick={() => setLbPeriod(id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium border transition-colors',
                lbPeriod === id
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {lbScope === 'nearby' ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-600">
              Ranglijst in een straal van {radiusKm} km. Gebaseerd op je profiel-locatie of huidige locatie als je die
              toestaat.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-gray-700" htmlFor="hcp-radius">
                Straal
              </label>
              <select
                id="hcp-radius"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value) as 25 | 50 | 100)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
              >
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
              <button
                type="button"
                onClick={requestGps}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Gebruik huidige locatie
              </button>
              {gpsPos ? (
                <button
                  type="button"
                  onClick={() => setGpsPos(null)}
                  className="text-xs font-medium text-gray-600 underline"
                >
                  Profiel-locatie gebruiken
                </button>
              ) : null}
            </div>
            {gpsError ? <p className="text-xs text-amber-800">{gpsError}</p> : null}
            {scopedLb?.meta?.locationSource === 'profile' && !gpsPos ? (
              <p className="text-[11px] text-gray-500">Locatiebron: opgeslagen profiel.</p>
            ) : null}
            {scopedLb?.meta?.locationSource === 'gps' || gpsPos ? (
              <p className="text-[11px] text-gray-500">Locatiebron: huidige locatie (alleen deze sessie).</p>
            ) : null}
          </div>
        ) : lbScope === 'country' ? (
          <p className="mt-3 text-xs text-gray-600">
            Ranglijst voor je land ({scopedLb?.meta?.countryCode ?? 'NL'}). Wereldwijd blijft stabiel; in de buurt volgt
            je reis alleen als je GPS deelt.
          </p>
        ) : (
          <p className="mt-3 text-xs text-gray-600">Wereldwijde ranglijst op basis van HomeCheff Points.</p>
        )}

        {scopedLb?.meta?.hint ? (
          <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {scopedLb.meta.hint}
          </p>
        ) : null}

        {scopedLb?.me ? (
          <p className="mt-3 text-xs text-gray-600">
            Jouw plek in deze weergave:{' '}
            <span className="font-semibold">#{scopedLb.me.rank ?? '—'}</span>
            {scopedLb.me.score > 0 ? (
              <span className="text-gray-500"> · {scopedLb.me.score.toLocaleString('nl-NL')} HCP in deze periode</span>
            ) : null}
            {rankMovement ? (
              <span className="ml-2 font-semibold text-emerald-800">{rankMovement}</span>
            ) : null}
          </p>
        ) : null}

        {lbLoading ? (
          <p className="mt-4 text-sm text-gray-500">Ranglijst laden…</p>
        ) : !lbRows.length ? (
          <p className="mt-4 text-sm text-gray-600">
            {lbScope === 'nearby' && scopedLb?.meta?.locationSource === 'fallback'
              ? 'Voeg je locatie toe om de ranglijst in je buurt te zien.'
              : 'Nog onvoldoende data voor deze ranglijst.'}
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {lbRows.map((r) => (
              <li
                key={`${lbScope}-${lbPeriod}-${r.userId}`}
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
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="truncate text-xs text-gray-500">@{r.username ?? '—'}</span>
                    <HcpLevelPill level={r.level} size="xs" tone="amber" className="shrink-0" />
                  </div>
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
        <p className="mt-4 text-xs text-gray-600 leading-relaxed">{t(`${HP_REWARDS}.teaser`)}</p>
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

      <HcpBadgeDetailSheet
        open={badgeSheetModel != null}
        onClose={() => setBadgeSheet(null)}
        mode={badgeSheetModel?.mode ?? 'locked'}
        entry={badgeSheetModel?.entry ?? null}
        earnedAtIso={badgeSheetModel?.mode === 'earned' ? badgeSheetModel.earnedAtIso : null}
      />
    </div>
  );
}
