'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { TrendingUp, Bell, Bookmark } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';
import { cn } from '@/lib/utils';

type Visibility = {
  profileViews: number;
  productSavesWeek: number;
  newFollowersWeek: number;
  unreadNotifications: number;
  hasSellerProfile: boolean;
};

export default function CreatorMomentumCard({ className }: { className?: string }) {
  const { status } = useSession();
  const { t } = useTranslation();
  const [v, setV] = useState<Visibility | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/creator/visibility-summary', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as Visibility;
        if (!cancelled) setV(j);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const bump = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        void (async () => {
          try {
            const res = await fetch('/api/creator/visibility-summary', { cache: 'no-store' });
            if (!res.ok) return;
            const j = (await res.json()) as Visibility;
            setV(j);
          } catch {
            /* ignore */
          }
        })();
      }, 400);
    };
    window.addEventListener('notificationsUpdated', bump);
    window.addEventListener('messagesRead', bump);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener('notificationsUpdated', bump);
      window.removeEventListener('messagesRead', bump);
    };
  }, [status]);

  useEffect(() => {
    if (!v || trackedRef.current) return;
    trackedRef.current = true;
    trackOnboardingEvent('CREATOR_VISIBILITY_DIGEST_SHOWN', {
      profileViews: v.profileViews,
      savesWeek: v.productSavesWeek,
      followersWeek: v.newFollowersWeek,
    });
  }, [v]);

  if (status !== 'authenticated' || !v) return null;

  const hasSignal =
    v.profileViews > 0 ||
    v.productSavesWeek > 0 ||
    v.newFollowersWeek > 0 ||
    v.unreadNotifications > 0;

  if (!hasSignal) return null;

  return (
    <div className={cn('mb-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-white px-4 py-3 shadow-sm hc-dorpsplein-card', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
          <TrendingUp className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-slate-900">{t('creatorMomentum.title')}</p>
          {v.profileViews > 0 ? (
            <p className="text-xs text-slate-600">{t('creatorMomentum.profileViews', { count: v.profileViews })}</p>
          ) : null}
          {v.productSavesWeek > 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <Bookmark className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
              {t('creatorMomentum.savesWeek', { count: v.productSavesWeek })}
            </p>
          ) : null}
          {v.newFollowersWeek > 0 ? (
            <p className="text-xs text-slate-600">{t('creatorMomentum.newFollowersWeek', { count: v.newFollowersWeek })}</p>
          ) : null}
          {v.unreadNotifications > 0 ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <Bell className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
              {t('creatorMomentum.unreadNotifications', { count: v.unreadNotifications })}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/profile"
              prefetch={false}
              className="text-xs font-semibold text-violet-800 underline-offset-2 hover:underline"
            >
              {t('creatorMomentum.ctaProfile')}
            </Link>
            {v.unreadNotifications > 0 ? (
              <Link
                href="/notifications"
                prefetch={false}
                className="text-xs font-semibold text-amber-900/90 underline-offset-2 hover:underline"
              >
                {t('creatorMomentum.ctaNotifications')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
