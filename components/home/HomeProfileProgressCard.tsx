'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useUserBootstrap } from '@/components/user/UserBootstrapProvider';
import { cn } from '@/lib/utils';

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function HomeProfileProgressCard({ className }: { className?: string }) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const { profile } = useUserBootstrap();

  const { pct, hint } = useMemo(() => {
    if (!session?.user) return { pct: 0, hint: '' as const };
    let score = 0;
    const max = 5;
    const u = session.user as {
      name?: string | null;
      image?: string | null;
    };
    if (u.name?.trim()) score += 1;
    if (u.image || profile?.profileImage || profile?.image) score += 1;
    if (profile?.username?.trim()) score += 1;
    if (
      (profile?.lat != null &&
        profile?.lng != null &&
        Number.isFinite(Number(profile.lat)) &&
        Number.isFinite(Number(profile.lng))) ||
      (profile?.place && profile.place.trim().length > 1)
    ) {
      score += 1;
    }
    if (profile?.sellerRoles && profile.sellerRoles.length > 0) score += 1;
    const p = clampPct((score / max) * 100);
    const hintKey =
      p >= 100
        ? 'home.profileProgress.complete'
        : p >= 60
          ? 'home.profileProgress.almost'
          : 'home.profileProgress.start';
    return { pct: p, hint: hintKey };
  }, [session?.user, profile]);

  if (!session?.user || pct >= 100) return null;

  return (
    <div
      className={cn(
        'mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{t('home.profileProgress.title')}</p>
          <p className="mt-1 text-xs text-slate-600">{t(hint)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        href="/profile"
        prefetch={false}
        className="mt-3 inline-flex text-sm font-semibold text-emerald-800 hover:text-emerald-950"
      >
        {t('home.profileProgress.cta')}
      </Link>
    </div>
  );
}
