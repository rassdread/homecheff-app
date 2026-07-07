'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Award } from 'lucide-react';
import { useGamificationMe } from '@/hooks/useGamificationMe';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  variant?: 'default' | 'sidebar' | 'insert';
  /** Guest tap on sidebar row — opens bottom-nav reputation panel. */
  onGuestClick?: () => void;
};

const ctaClass =
  'inline-flex shrink-0 text-xs font-semibold text-secondary-brand hover:text-secondary-700 transition-colors';

/** Compact reputation — trust & community, not raw HCP scores. */
export default function HomeReputationCompactCard({
  className,
  variant = 'default',
  onGuestClick,
}: Props) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const isSidebar = variant === 'sidebar';
  const isGuest = status === 'unauthenticated';
  const isAuthenticated = status === 'authenticated';
  const { data, loading } = useGamificationMe();

  if (isSidebar) {
    if (isGuest && onGuestClick) {
      return (
        <section
          className={cn('hc-dorpsplein-card px-4 py-3', className)}
          aria-labelledby="home-reputation-heading"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Award className="h-4 w-4 shrink-0 text-primary-brand/60" aria-hidden />
              <h2 id="home-reputation-heading" className="text-sm font-medium text-gray-900">
                {t('home.reputationCompact.guestTitle')}
              </h2>
            </div>
            <button type="button" onClick={onGuestClick} className={ctaClass}>
              {t('home.reputationCompact.guestCta')} →
            </button>
          </div>
        </section>
      );
    }

    if (status === 'loading') {
      return (
        <div
          className={cn(
            'hc-dorpsplein-card px-4 py-3 min-h-[44px] animate-pulse',
            className
          )}
          aria-hidden
        />
      );
    }

    if (!isAuthenticated) return null;

    const topBadge = data?.badges?.[0];
    const level = data?.level ?? null;
    const statusLabel = topBadge?.name
      ? topBadge.name
      : level
        ? t('home.reputationCompact.levelLabel', { level })
        : null;

    return (
      <section
        className={cn('hc-dorpsplein-card px-4 py-3', className)}
        aria-labelledby="home-reputation-heading"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Award className="h-4 w-4 shrink-0 text-primary-brand/60" aria-hidden />
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2 id="home-reputation-heading" className="text-sm font-medium text-gray-900">
                {t('home.reputationCompact.title')}
              </h2>
              {statusLabel && !loading ? (
                <span className="inline-flex max-w-[9rem] truncate rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-brand border border-primary-200/50">
                  {statusLabel}
                </span>
              ) : loading ? (
                <span className="inline-block h-4 w-16 rounded-full bg-gray-100 animate-pulse" aria-hidden />
              ) : null}
            </div>
          </div>
          <Link href="/mijn-hcp" prefetch={false} className={ctaClass}>
            {t('home.reputationCompact.cta')} →
          </Link>
        </div>
      </section>
    );
  }

  if (status !== 'authenticated') return null;

  if (loading && !data) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-primary-brand/10 bg-primary-50/30 px-4 py-4 min-h-[88px] animate-pulse',
          className
        )}
        aria-hidden
      />
    );
  }

  if (!data) return null;

  const user = session?.user;
  const avatar = user?.image ?? null;
  const displayName = user?.name?.split(' ')[0] ?? user?.name ?? '';
  const level = data.level ?? 1;
  const topBadge = data.badges?.[0];
  const progressPct =
    data.hcpToNextLevel > 0 && data.nextLevelHcp > 0
      ? Math.min(100, Math.round(((data.nextLevelHcp - data.hcpToNextLevel) / data.nextLevelHcp) * 100))
      : 100;

  return (
    <section
      className={cn(
        variant === 'insert'
          ? 'rounded-2xl border border-primary-brand/15 bg-gradient-to-br from-primary-50/60 via-white to-secondary-50/25 px-4 py-4 shadow-sm'
          : 'rounded-2xl border border-primary-brand/15 bg-gradient-to-br from-primary-50/50 via-white to-secondary-50/20 px-4 py-4 shadow-sm',
        'mb-4 sm:mb-5',
        className
      )}
      aria-labelledby="home-reputation-heading-full"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary-brand/20 shadow-md bg-primary-50">
            {avatar ? (
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-primary-brand">
                {displayName?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-brand text-[10px] font-bold text-white shadow ring-2 ring-white">
            {level}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 id="home-reputation-heading-full" className="text-sm font-bold text-gray-900">
              {t('home.reputationCompact.title')}
            </h2>
            {topBadge ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-50 px-2 py-0.5 text-[10px] font-semibold text-secondary-brand border border-secondary-200/60">
                <Award className="h-3 w-3" aria-hidden />
                {topBadge.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-brand border border-primary-200/60">
                {t('home.reputationCompact.levelLabel', { level })}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-2.5">
            {t('home.reputationCompact.body')}
          </p>
          <div className="hc-reputation-progress mb-3" aria-hidden>
            <span style={{ width: `${progressPct}%` }} />
          </div>
          <Link
            href="/mijn-hcp"
            prefetch={false}
            className="inline-flex min-h-[36px] items-center rounded-xl border border-primary-brand/25 bg-white px-3.5 py-1.5 text-xs font-semibold text-primary-brand hover:bg-primary-50 transition-colors hc-card-lift"
          >
            {t('home.reputationCompact.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
