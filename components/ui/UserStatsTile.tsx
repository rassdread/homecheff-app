'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, Heart, Star, Eye, ThumbsUp, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import UserCircleAvatar from '@/components/ui/UserCircleAvatar';
import { getDisplayName } from '@/lib/displayName';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useTranslation } from '@/hooks/useTranslation';
import {
  fetchUserStatsDeduped,
  EMPTY_USER_STATS,
  getCachedUserStats,
} from '@/lib/userStatsClientCache';

type UserStats = {
  fansCount: number;
  followingCount?: number;
  totalFavorites: number;
  totalReviews: number;
  averageRating: number;
  totalViews: number;
  totalProps: number;
  communityFeedbackCount?: number;
};

type UserStatsTileProps = {
  userId: string | null;
  userName?: string | null;
  userUsername?: string | null;
  userAvatar?: string | null;
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
  className?: string;
};

export default function UserStatsTile({
  userId,
  userName,
  userUsername,
  userAvatar,
  displayFullName,
  displayNameOption,
  className = '',
}: UserStatsTileProps) {
  const { t } = useTranslation();
  const { isMobile } = useMobileOptimization();
  const [stats, setStats] = useState<UserStats | null>(() =>
    userId ? getCachedUserStats(userId) : null,
  );
  const [loading, setLoading] = useState(() =>
    Boolean(userId && !getCachedUserStats(userId)),
  );
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }

    const cachedNow = getCachedUserStats(userId);
    if (cachedNow) {
      setStats(cachedNow);
      setLoading(false);
      let cancelled = false;
      const refresh = () => {
        if (cancelled) return;
        void fetchUserStatsDeduped(userId).then((data) => {
          if (!cancelled) setStats(data);
        });
      };
      if (typeof requestIdleCallback !== 'undefined') {
        const id = requestIdleCallback(refresh, { timeout: 3500 });
        return () => {
          cancelled = true;
          cancelIdleCallback(id);
        };
      }
      const tid = setTimeout(refresh, 0);
      return () => {
        cancelled = true;
        clearTimeout(tid);
      };
    }

    setStats(null);
    setLoading(true);

    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      let cancelled = false;
      void fetchUserStatsDeduped(userId).then((data) => {
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting);
        if (!vis || cancelled) return;
        observer.disconnect();
        void fetchUserStatsDeduped(userId).then((data) => {
          if (!cancelled) {
            setStats(data);
            setLoading(false);
          }
        });
      },
      { root: null, rootMargin: '120px 0px', threshold: 0.01 },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [userId]);

  if (!userId) return null;

  const userDisplayName = userName || userUsername || 'Gebruiker';
  const profileSlug = (userUsername?.trim() || userId || '').trim();
  const profileHref =
    profileSlug.length > 0 ? `/user/${encodeURIComponent(profileSlug)}` : '/profile';

  if (loading) {
    return (
      <div ref={rootRef} className={`pt-4 border-t border-gray-100 ${className}`}>
        <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  const effectiveStats = stats ?? EMPTY_USER_STATS;

  const statsItems = [
    {
      icon: Users,
      label: t('follow.followers'),
      value: effectiveStats.fansCount,
      tooltip: t('stats.tooltips.fans'),
    },
    {
      icon: Heart,
      label: t('favorites.label'),
      value: effectiveStats.totalFavorites,
      tooltip: t('stats.tooltips.favorites'),
    },
    {
      icon: ThumbsUp,
      label: t('props.workspaceLabel'),
      value: effectiveStats.totalProps,
      tooltip: t('stats.tooltips.workspaceProps'),
    },
    {
      icon: Star,
      label: t('stats.productReviews'),
      value: effectiveStats.totalReviews,
      tooltip: t('stats.tooltips.productReviews'),
    },
    {
      icon: Star,
      label: t('stats.productRating'),
      value:
        effectiveStats.averageRating > 0
          ? effectiveStats.averageRating.toFixed(1)
          : '—',
      tooltip: t('stats.tooltips.productRating'),
    },
    {
      icon: MessageCircle,
      label: t('communityFeedback.label'),
      value: effectiveStats.communityFeedbackCount ?? 0,
      tooltip: t('stats.tooltips.communityFeedback'),
    },
    {
      icon: Eye,
      label: t('stats.views'),
      value:
        effectiveStats.totalViews > 0
          ? formatViews(effectiveStats.totalViews)
          : '0',
      tooltip: t('stats.tooltips.views'),
    },
  ].filter((item) => {
    if (item.label === t('props.workspaceLabel') && item.value === 0) return false;
    if (item.label === t('communityFeedback.label') && item.value === 0) return false;
    return true;
  });

  return (
    <div ref={rootRef} className={`pt-4 border-t border-gray-200 ${className}`}>
      <Link
        href={profileHref}
        className="mb-3 block rounded-lg px-1 py-1 transition-colors hover:bg-gray-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 hover:opacity-90 transition-opacity group">
          <UserCircleAvatar
            src={userAvatar}
            alt={userDisplayName}
            size="md"
            nameForInitial={userDisplayName}
            className="border-2 border-primary-100 transition-colors group-hover:border-primary-300"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-600">
              {getDisplayName({
                id: userId,
                name: userName || null,
                username: userUsername || null,
                displayFullName: displayFullName,
                displayNameOption: displayNameOption,
              }) || 'Gebruiker'}
            </div>
          </div>
        </div>
      </Link>

      <div className="space-y-2">
        <p className="text-xs text-gray-500 text-center font-medium">{t('stats.aggregateLabel')}</p>
        <div className={`grid gap-2 ${statsItems.length >= 6 ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-3'}`}>
          {statsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all"
                title={item.tooltip}
              >
                <Icon className={`w-5 h-5 text-gray-600 ${isMobile ? 'mb-0' : 'mb-1.5'}`} />
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-800 leading-tight`}>
                  {typeof item.value === 'string' ? item.value : formatNumber(item.value as number)}
                </div>
                {!isMobile && (
                  <div className="text-[10px] text-gray-600 mt-0.5 truncate w-full text-center font-medium">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function formatViews(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}
