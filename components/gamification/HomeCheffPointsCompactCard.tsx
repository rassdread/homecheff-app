'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Flame, Sparkles } from 'lucide-react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { labelForHcpAction } from '@/lib/gamification/hcp-action-labels';

function rankLabel(level: number): string {
  if (level <= 1) return 'HomeCheff Starter';
  if (level <= 3) return 'HomeCheff Maker';
  if (level <= 5) return 'HomeCheff Pro';
  return 'HomeCheff Legend';
}

export default function HomeCheffPointsCompactCard() {
  const { status } = useSession();
  const { data, loading } = useGamificationMe();

  if (status === 'loading' || loading) {
    return (
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-xs text-gray-500">
        HomeCheff Points laden…
      </div>
    );
  }

  if (status !== 'authenticated' || !data) {
    return null;
  }

  const streak = data.currentStreak;
  const streakText =
    streak === 0
      ? 'Nog geen login-streak'
      : streak === 1
        ? '🔥 1 dag streak'
        : `🔥 ${streak} dagen streak`;

  const progressPct =
    data.nextLevelHcp > 0
      ? Math.min(100, Math.round((100 * (data.nextLevelHcp - data.hcpToNextLevel)) / data.nextLevelHcp))
      : 100;

  const recent = data.recentEvents?.[0];

  return (
    <Link
      href="/mijn-hcp"
      className="mt-6 block cursor-pointer rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-white px-3 py-3 text-left shadow-sm transition hover:border-amber-400/80 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
      aria-label="Bekijk je HomeCheff Points"
    >
      <div className="flex items-start gap-2 min-w-0">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/90">HomeCheff Points</p>
          <p className="text-sm font-bold text-gray-900 truncate mt-0.5">
            <span className="mr-1" aria-hidden>
              ⭐
            </span>
            {data.totalHcp.toLocaleString('nl-NL')} HCP
          </p>
          <p className="text-xs text-gray-700 mt-0.5">
            Level {data.level} — {rankLabel(data.level)}
          </p>
          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
            <span>{streakText}</span>
          </p>
          {recent ? (
            <p className="mt-1.5 text-[11px] leading-snug text-gray-500 line-clamp-2">
              Laatst: {labelForHcpAction(recent.action)} (+{recent.points} HCP)
            </p>
          ) : null}
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-100" aria-hidden>
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-1 text-[11px] leading-snug text-gray-600">
              Nog {data.hcpToNextLevel.toLocaleString('nl-NL')} HCP tot Level {data.level + 1}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
