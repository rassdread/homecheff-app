'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sparkles } from 'lucide-react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { labelForHcpAction } from '@/lib/gamification/hcp-action-labels';

export default function HomeCheffPointsWidget() {
  const { status } = useSession();
  const { data, loading, error } = useGamificationMe();

  if (status === 'loading' || loading) {
    return (
      <div className="mt-4 rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 text-sm text-amber-900/80">
        HomeCheff Points laden…
      </div>
    );
  }

  if (status !== 'authenticated' || error || !data) {
    return null;
  }

  const progressPct =
    data.nextLevelHcp > 0
      ? Math.min(100, Math.round((100 * (data.nextLevelHcp - data.hcpToNextLevel)) / data.nextLevelHcp))
      : 100;

  return (
    <div className="mt-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50/90 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-100/80 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/70">HomeCheff Points</p>
            <p className="truncate text-lg font-bold text-gray-900">{data.totalHcp.toLocaleString('nl-NL')} HCP</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Level</p>
          <p className="text-2xl font-bold text-amber-900">{data.level}</p>
        </div>
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-gray-600">Login streak</p>
          <p className="text-base font-semibold text-gray-900">
            {data.currentStreak} dag{data.currentStreak === 1 ? '' : 'en'}
            <span className="ml-2 text-xs font-normal text-gray-500">(langste: {data.longestStreak})</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Volgend level</p>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Nog {data.hcpToNextLevel.toLocaleString('nl-NL')} HCP tot level {data.level + 1}
          </p>
        </div>
      </div>

      {data.recentEvents.length > 0 && (
        <div className="border-t border-amber-100/80 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recent</p>
          <ul className="max-h-36 space-y-1.5 overflow-y-auto text-sm">
            {data.recentEvents.slice(0, 6).map((ev) => (
              <li key={ev.id} className="flex justify-between gap-2 text-gray-800">
                <span className="min-w-0 truncate">{labelForHcpAction(ev.action)}</span>
                <span className="shrink-0 font-medium text-amber-800">+{ev.points} HCP</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-amber-100/80 px-4 py-2 text-right">
        <Link href="/mijn-hcp" className="text-xs font-semibold text-emerald-800 hover:underline">
          Bekijk volledige voortgang
        </Link>
      </div>
    </div>
  );
}
