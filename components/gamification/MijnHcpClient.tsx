'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Info, Sparkles, Trophy } from 'lucide-react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { useHcpLeaderboardScoped } from '@/hooks/useHcpLeaderboardScoped';
import { useTranslation } from '@/hooks/useTranslation';
import {
  loadFeedSurfaceState,
  saveFeedSurfaceState,
} from '@/lib/feed/feedSurfaceState';
import {
  HCP_BADGE_CATALOG,
  badgeCatalogEntryBySlug,
  type BadgeCatalogEntry,
} from '@/lib/gamification/badge-catalog';
import { labelForHcpAction } from '@/lib/gamification/hcp-action-labels';
import type { LeaderboardRow } from '@/lib/gamification/leaderboard-queries';
import { leaderboardRowPublicHref } from '@/lib/user/public-profile';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';
import { HcpLevelPill } from '@/components/gamification/HcpLevelPill';
import HcpWelcomeGate from '@/components/gamification/HcpWelcomeGate';
import AppBackBar from '@/components/navigation/AppBackBar';
import {
  HcpBadgeDetailSheet,
  HcpEarnedBadgeButton,
  HcpLockedBadgeButton,
} from '@/components/gamification/HcpLockedBadgeExplainer';

/** Zelfde perioden als `/hcp-ranglijsten` (zelfde API). */
type LbPreviewPeriod = 'week' | 'month' | 'year' | 'all';

const HP_REWARDS = 'home.hcpActivation.rewards';
const LB_PAGE = 'home.hcpRankingsPage';
const LB_PREVIEW = 'home.mijnHcpLb';
const MIJN_HCP_HOW = 'home.mijnHcpHow';

export default function MijnHcpClient() {
  const { t, language } = useTranslation();
  const { data, loading, error } = useGamificationMe();
  const [previewPeriod, setPreviewPeriod] = useState<LbPreviewPeriod>(() => {
    const p = loadFeedSurfaceState<{ previewPeriod?: LbPreviewPeriod }>('hcp_mijn');
    if (
      p?.previewPeriod === 'week' ||
      p?.previewPeriod === 'month' ||
      p?.previewPeriod === 'year' ||
      p?.previewPeriod === 'all'
    ) {
      return p.previewPeriod;
    }
    return 'week';
  });
  const [rankMovement, setRankMovement] = useState<string | null>(null);
  /** Open badge-detail (zelfde sheet): vergrendeld of behaald. */
  const [badgeSheet, setBadgeSheet] = useState<{ mode: 'locked' | 'earned'; slug: string } | null>(
    null
  );

  const { data: lbData, loading: lbLoading } = useHcpLeaderboardScoped({
    scope: 'worldwide',
    period: previewPeriod,
    limit: 10,
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveFeedSurfaceState('hcp_mijn', { previewPeriod });
    }, 400);
    return () => window.clearTimeout(t);
  }, [previewPeriod]);

  useEffect(() => {
    setRankMovement(null);
    if (typeof window === 'undefined' || !lbData?.meta) return;
    const curr = lbData.currentUserRank ?? lbData.me?.rank;
    if (curr == null) return;
    const periodKey =
      previewPeriod === 'month'
        ? lbData.meta.monthStartUtc
        : previewPeriod === 'year'
          ? lbData.meta.yearStartUtc
          : previewPeriod === 'week'
            ? lbData.meta.weekKey
            : 'all';
    const radiusKm = 50;
    const key = `hc_lb_page_worldwide_${previewPeriod}_${periodKey}_${radiusKm}_prof`;
    const prevS = localStorage.getItem(key);
    if (prevS != null) {
      const prev = Number(prevS);
      if (Number.isFinite(prev) && prev !== curr) {
        setRankMovement(
          curr < prev ? t(`${LB_PAGE}.rankUp`) : t(`${LB_PAGE}.rankDown`)
        );
      }
    }
    localStorage.setItem(key, String(curr));
  }, [lbData, previewPeriod, t]);

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

  const lbRows: LeaderboardRow[] = lbData?.rows ?? [];
  const lbMeta = lbData?.meta;
  const myLbRank = lbData?.currentUserRank ?? lbData?.me?.rank ?? null;
  const myLbScore = lbData?.currentUserScore ?? lbData?.me?.score ?? 0;

  const rewardStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      coming_soon: 'Later beschikbaar',
      locked: 'Nog niet vrijgespeeld',
      unlocked: 'Vrijgespeeld',
      active: 'Actief',
      expired: 'Verlopen',
    };
    return map[s] ?? s;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+6rem))]">
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-28 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+6rem))] text-center text-red-700">
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
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+6rem))]">
      <AppBackBar
        fallbackUrl="/hcp-ranglijsten"
        label={t('navigation.backToRankings')}
        className="-mx-1 rounded-xl border border-amber-100/90 bg-amber-50/40 px-2"
      />
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
      <section aria-labelledby="hcp-rew-heading" className="scroll-mt-2">
        <h2 id="hcp-rew-heading" className="text-lg font-bold text-gray-900">
          Beschikbare beloningen
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-600">{t(`${HP_REWARDS}.teaser`)}</p>
        <ul className="mt-4 space-y-3">
          {(data.hcpRewards ?? []).map((r) => (
            <li
              key={r.id}
              className={cn(
                'rounded-xl border px-3.5 py-3 shadow-sm',
                r.displayStatus === 'active'
                  ? 'border-emerald-200/90 bg-emerald-50/70'
                  : r.displayStatus === 'expired'
                    ? 'border-gray-200 bg-gray-50/90 opacity-85'
                    : r.displayStatus === 'unlocked'
                      ? 'border-amber-200/90 bg-amber-50/50'
                      : r.displayStatus === 'locked'
                        ? 'border-gray-200/90 bg-white'
                        : 'border-violet-100 bg-violet-50/40'
              )}
            >
              <p className="text-[15px] font-semibold leading-snug text-gray-900">{r.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{r.description}</p>
              <p className="mt-2 text-xs font-medium leading-snug text-teal-800/90">{r.requirement}</p>
              {r.expiresAt ? (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {r.displayStatus === 'expired' ? 'Verlopen per ' : 'Geldig tot '}
                  {new Date(r.expiresAt).toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
              <div className="mt-2.5 flex justify-end">
                <span
                  className={cn(
                    'inline-flex max-w-full rounded-full border px-2.5 py-0.5 text-[10px] font-medium leading-tight text-gray-800',
                    r.displayStatus === 'active'
                      ? 'border-emerald-200 bg-white/90 text-emerald-900'
                      : r.displayStatus === 'expired'
                        ? 'border-gray-200 bg-white/80 text-gray-600'
                        : r.displayStatus === 'unlocked'
                          ? 'border-amber-200 bg-white/90 text-amber-950'
                          : r.displayStatus === 'locked'
                            ? 'border-gray-200 bg-gray-50 text-gray-700'
                            : 'border-violet-200 bg-white/90 text-violet-900'
                  )}
                >
                  {rewardStatusLabel(r.displayStatus)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Leaderboard — zelfde API als /hcp-ranglijsten (worldwide preview) */}
      <section aria-labelledby="hcp-lb-heading" className="scroll-mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2
              id="hcp-lb-heading"
              className="flex min-w-0 flex-wrap items-center gap-2 text-lg font-bold text-gray-900"
            >
              <Trophy className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <span className="min-w-0">{t(`${LB_PREVIEW}.previewTitle`)}</span>
            </h2>
            <p className="mt-1.5 text-sm text-gray-600 leading-snug max-w-2xl">{t(`${LB_PREVIEW}.previewSubtitle`)}</p>
            <p className="mt-1 text-xs text-gray-500 leading-snug max-w-2xl">{t(`${LB_PREVIEW}.filtersHint`)}</p>
          </div>
          <Link
            href="/hcp-ranglijsten"
            prefetch={false}
            className="inline-flex min-h-[44px] min-w-0 max-w-full shrink-0 touch-pan-y items-center self-start text-left text-sm font-semibold leading-snug text-teal-800 underline-offset-2 [overflow-wrap:anywhere] hover:text-teal-950 hover:underline sm:max-w-[min(100%,15rem)] sm:justify-end sm:self-center sm:text-right select-none"
          >
            {t(`${LB_PREVIEW}.ctaFull`)} →
          </Link>
        </div>

        <div
          className="mt-3 flex flex-wrap gap-2 sm:mt-4"
          role="tablist"
          aria-label={t(`${LB_PREVIEW}.ariaPeriod`)}
        >
          {(
            [
              ['week', 'periodWeek'],
              ['month', 'periodMonth'],
              ['year', 'periodYear'],
              ['all', 'periodAll'],
            ] as const
          ).map(([id, labelKey]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={previewPeriod === id}
              onClick={() => setPreviewPeriod(id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium border transition-colors min-h-[44px]',
                previewPeriod === id
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300'
              )}
            >
              {t(`${LB_PAGE}.${labelKey}`)}
            </button>
          ))}
        </div>

        {lbMeta?.hintKey ? (
          <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {lbMeta.hintKey === 'nearby_no_location'
              ? t(`${LB_PAGE}.hintNearbyNoLocation`)
              : lbMeta.hintKey === 'nearby_empty_radius'
                ? t(`${LB_PAGE}.hintNearbyEmptyRadius`)
                : lbMeta.hintKey === 'country_missing'
                  ? t(`${LB_PAGE}.hintCountryMissing`)
                  : null}
          </p>
        ) : lbMeta?.hint ? (
          <p className="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {lbMeta.hint}
          </p>
        ) : null}

        {!lbLoading ? (
          myLbRank != null ? (
            <p className="mt-3 text-sm text-gray-700">
              {t(`${LB_PAGE}.yourRank`, { rank: String(myLbRank) })}
              {myLbScore > 0 ? (
                <span className="text-gray-500">
                  {' '}
                  · {myLbScore.toLocaleString()} HCP {t(`${LB_PAGE}.inThisView`)}
                </span>
              ) : null}
              {rankMovement ? <span className="ml-2 font-semibold text-emerald-800">{rankMovement}</span> : null}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-600">{t(`${LB_PAGE}.notRankedYet`)}</p>
          )
        ) : null}

        {lbLoading ? (
          <p className="mt-4 text-sm text-gray-500">{t(`${LB_PREVIEW}.loading`)}</p>
        ) : !lbRows.length ? (
          <p className="mt-4 text-sm text-gray-600">
            {lbMeta?.hintKey === 'country_missing'
              ? t(`${LB_PAGE}.hintCountryMissing`)
              : t(`${LB_PAGE}.emptyNoHcpInList`)}
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {lbRows.map((r) => {
              const href = leaderboardRowPublicHref(r);
              const inner = (
                <>
                  <span className="w-7 text-center text-sm font-bold text-amber-800 tabular-nums shrink-0">
                    {r.rank}
                  </span>
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
                    {r.score.toLocaleString()} HCP
                  </span>
                </>
              );
              const cardClass = cn(
                'flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 sm:flex-nowrap',
                r.isCurrentUser
                  ? 'border-amber-300 bg-amber-50/70 ring-2 ring-amber-400/40'
                  : 'border-gray-100 bg-white'
              );
              if (href) {
                return (
                  <li key={`worldwide-${previewPeriod}-${r.userId}-${r.rank}`}>
                    <Link
                      href={href}
                      prefetch={false}
                      className={cn(
                        cardClass,
                        'block touch-pan-y hover:border-amber-200 transition-colors active:bg-amber-50/50 select-none'
                      )}
                    >
                      {inner}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={`worldwide-${previewPeriod}-${r.userId}-${r.rank}`}>
                  <div className={cardClass}>{inner}</div>
                </li>
              );
            })}
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
          {t(`${MIJN_HCP_HOW}.title`)}
        </h2>
        <ul className="mt-3 list-disc pl-5 space-y-1.5 text-sm text-gray-800">
          <li>{t(`${MIJN_HCP_HOW}.bulletLogin`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletProfile`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletProduct`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletInspiration`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletMedia`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletReviews`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletSales`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletCommunity`)}</li>
          <li>{t(`${MIJN_HCP_HOW}.bulletReferrals`)}</li>
        </ul>
        <p className="mt-4 text-xs text-gray-600 leading-relaxed">{t(`${HP_REWARDS}.teaser`)}</p>
      </section>

      {lastEvent ? (
        <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t(`${MIJN_HCP_HOW}.lastEventPrefix`)}{' '}
          {labelForHcpAction(lastEvent.action)} (+{lastEvent.points} HCP)
        </p>
      ) : null}

      <p className="text-center">
        <Link
          href="/profile"
          prefetch={false}
          className="inline-flex min-h-[44px] touch-pan-y items-center text-sm font-medium text-emerald-700 hover:underline select-none"
        >
          {t(`${MIJN_HCP_HOW}.backToProfile`)}
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
