'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MapPin, Trophy } from 'lucide-react';
import { useHcpLeaderboardScoped } from '@/hooks/useHcpLeaderboardScoped';
import { useTranslation } from '@/hooks/useTranslation';
import type { LeaderboardRow } from '@/lib/gamification/leaderboard-queries';
import { publicProfileHref } from '@/lib/user/public-profile';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';
import HcpRankingPromoPanel from '@/components/gamification/HcpRankingPromoPanel';
import { HcpLevelPill } from '@/components/gamification/HcpLevelPill';

type LbScope = 'nearby' | 'country' | 'worldwide';
type LbPeriod = 'week' | 'month' | 'year' | 'all';

function RankRow({ row }: { row: LeaderboardRow }) {
  const href = publicProfileHref(row.userId, row.username);
  const inner = (
    <>
      <span className="w-8 text-center text-sm font-bold text-amber-900 tabular-nums shrink-0">{row.rank}</span>
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-amber-50 ring-1 ring-white shadow-sm">
        {row.avatar ? (
          <SafeImage src={row.avatar} alt="" fill className="object-cover" sizes="44px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-bold text-amber-900">HC</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 truncate">
          {row.displayName}
          {row.isCurrentUser ? (
            <span className="ml-2 text-[10px] font-bold uppercase text-amber-800">Jij</span>
          ) : null}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="truncate text-xs text-gray-600">@{row.username ?? '—'}</span>
          <HcpLevelPill level={row.level} size="xs" tone="amber" className="shrink-0" />
        </div>
        <UserBadgeChips
          badges={row.badgeSummaries.map((b) => ({ key: b.key, name: b.name, icon: b.icon }))}
          max={2}
          size="sm"
          className="mt-1"
        />
      </div>
      <span className="shrink-0 text-sm font-bold text-emerald-800 tabular-nums">{row.score.toLocaleString()} HCP</span>
    </>
  );

  const cardClass = cn(
    'flex flex-wrap items-center gap-3 rounded-2xl border px-3 py-3 sm:flex-nowrap min-h-[56px]',
    row.isCurrentUser
      ? 'border-amber-400 bg-amber-50/90 ring-2 ring-amber-400/35 shadow-sm'
      : 'border-gray-100 bg-white shadow-sm'
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          prefetch={false}
          className={cn(
            cardClass,
            'hover:border-amber-200 transition-colors active:bg-amber-50/50 touch-manipulation select-none'
          )}
        >
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div className={cardClass}>{inner}</div>
    </li>
  );
}

export default function HcpRanglijstenClient() {
  const { data: session, status } = useSession();
  const { t, language } = useTranslation();
  const P = 'home.hcpRankingsPage';

  const tk = (key: string, opts?: Record<string, string | number>) => t(`${P}.${key}`, opts);

  const [scope, setScope] = useState<LbScope>('worldwide');
  const [period, setPeriod] = useState<LbPeriod>('week');
  const [radiusKm, setRadiusKm] = useState<25 | 50 | 100>(50);
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [rankMovement, setRankMovement] = useState<string | null>(null);

  const loggedIn = status === 'authenticated' && Boolean(session?.user);

  const { data, loading } = useHcpLeaderboardScoped({
    scope,
    period,
    radiusKm,
    gpsPos,
  });

  useEffect(() => {
    setRankMovement(null);
    if (typeof window === 'undefined' || !data?.meta) return;
    const curr = data.currentUserRank ?? data.me?.rank;
    if (curr == null) return;
    const periodKey =
      period === 'month'
        ? data.meta.monthStartUtc
        : period === 'year'
          ? data.meta.yearStartUtc
          : period === 'week'
            ? data.meta.weekKey
            : 'all';
    const key = `hc_lb_page_${scope}_${period}_${periodKey}_${radiusKm}_${gpsPos ? 'gps' : 'prof'}`;
    const prevS = localStorage.getItem(key);
    if (prevS != null) {
      const prev = Number(prevS);
      if (Number.isFinite(prev) && prev !== curr) {
        setRankMovement(
          curr < prev ? t(`${P}.rankUp`) : t(`${P}.rankDown`)
        );
      }
    }
    localStorage.setItem(key, String(curr));
  }, [data, period, scope, radiusKm, gpsPos, t]);

  const requestGps = () => {
    setGpsError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError(tk('gpsUnsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsError(tk('gpsDenied')),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 }
    );
  };

  const rows = data?.rows ?? [];
  const meta = data?.meta;
  const myRank = data?.currentUserRank ?? data?.me?.rank ?? null;
  const myScore = data?.currentUserScore ?? data?.me?.score ?? 0;

  const filtersBlock = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={tk('ariaScope')}>
        {(
          [
            ['nearby', 'scopeNearby'],
            ['country', 'scopeCountry'],
            ['worldwide', 'scopeWorldwide'],
          ] as const
        ).map(([id, labelKey]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={scope === id}
            onClick={() => setScope(id)}
            className={cn(
              'rounded-full px-3.5 py-2 text-sm font-semibold border transition-colors min-h-[44px]',
              scope === id
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-gray-800 border-gray-200 hover:border-teal-300'
            )}
          >
            {tk(labelKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={tk('ariaPeriod')}>
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
            aria-selected={period === id}
            onClick={() => setPeriod(id)}
            className={cn(
              'rounded-full px-3.5 py-2 text-sm font-semibold border transition-colors min-h-[44px]',
              period === id
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-gray-800 border-gray-200 hover:border-amber-300'
            )}
          >
            {tk(labelKey)}
          </button>
        ))}
      </div>

      {scope === 'nearby' ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-3 space-y-3">
          <p className="text-sm text-gray-700 leading-snug">{tk('nearbyExplainer')}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <span>{tk('radiusLabel')}</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value) as 25 | 50 | 100)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm min-h-[44px]"
              >
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </label>
            <button
              type="button"
              onClick={requestGps}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 min-h-[44px] hover:bg-emerald-50"
            >
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              {tk('gpsButton')}
            </button>
            {gpsPos ? (
              <button
                type="button"
                onClick={() => setGpsPos(null)}
                className="text-sm font-medium text-gray-700 underline min-h-[44px]"
              >
                {tk('useProfileLocation')}
              </button>
            ) : null}
          </div>
          {gpsError ? <p className="text-xs text-amber-900">{gpsError}</p> : null}
          {meta?.locationSource === 'profile' && !gpsPos ? (
            <p className="text-xs text-gray-600">{tk('sourceProfile')}</p>
          ) : null}
          {(meta?.locationSource === 'gps' || gpsPos) && (
            <p className="text-xs text-gray-600">{tk('sourceGps')}</p>
          )}
        </div>
      ) : null}

      {scope === 'country' ? (
        <p className="text-sm text-gray-600">{tk('countryExplainer', { code: meta?.countryCode ?? 'NL' })}</p>
      ) : null}
      {scope === 'worldwide' ? <p className="text-sm text-gray-600">{tk('worldwideExplainer')}</p> : null}

      {meta?.hint ? (
        <p className="text-sm text-amber-950 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{meta.hint}</p>
      ) : null}

      {loggedIn ? (
        myRank != null ? (
          <p className="text-sm text-gray-700">
            {tk('yourRank', { rank: String(myRank) })}
            {myScore > 0 ? (
              <span className="text-gray-500">
                {' '}
                · {myScore.toLocaleString()} HCP {tk('inThisView')}
              </span>
            ) : null}
            {rankMovement ? <span className="ml-2 font-semibold text-emerald-800">{rankMovement}</span> : null}
          </p>
        ) : (
          <p className="text-sm text-gray-600">{tk('notRankedYet')}</p>
        )
      ) : (
        <p className="text-sm text-gray-600">{tk('loginHint')}</p>
      )}
    </div>
  );

  const listBlock = (
    <div>
      {loading ? (
        <ul className="mt-4 space-y-3" aria-busy="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </ul>
      ) : !rows.length ? (
        <p className="mt-4 text-sm text-gray-600">
          {scope === 'nearby' && meta?.locationSource === 'fallback'
            ? tk('emptyNearbyNoLocation')
            : tk('emptyGeneric')}
        </p>
      ) : (
        <ol className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <RankRow key={`${scope}-${period}-${r.userId}-${r.rank}`} row={r} />
          ))}
        </ol>
      )}
    </div>
  );

  const promo = (
    <HcpRankingPromoPanel lang={language} gpsLat={gpsPos?.lat ?? null} gpsLng={gpsPos?.lng ?? null} />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            prefetch={false}
            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-teal-800 hover:underline mb-2 touch-manipulation select-none"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {tk('backHome')}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500 shrink-0" aria-hidden />
            {tk('title')}
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">{tk('intro')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href="/mijn-hcp"
            prefetch={false}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-950 hover:bg-violet-50 touch-manipulation select-none"
          >
            {tk('ctaMijnHcp')}
          </Link>
          <Link
            href="/profile"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
          >
            {tk('ctaProfile')}
          </Link>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-8 lg:items-start">
        <div className="min-w-0 space-y-4">
          {filtersBlock}
          <div className="lg:hidden">{promo}</div>
          {listBlock}
        </div>
        <div className="hidden lg:block min-w-0 lg:sticky lg:top-4">{promo}</div>
      </div>
    </div>
  );
}
