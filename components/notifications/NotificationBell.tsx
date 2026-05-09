'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { devBadgeLog } from '@/lib/devBadgeLog';

/** Voorkomt dat CDN/browser oude JSON voor badge-counts cached. */
const BADGE_FETCH: RequestInit = {
  cache: 'no-store',
  credentials: 'same-origin',
};

/**
 * Meldingsbel: badge = GET /api/notifications unreadCount.
 * Klik opent altijd /notifications (geen dropdown onder sticky header / overflow-clipping).
 */
export default function NotificationBell() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async (source: string = 'unknown') => {
    if (!session?.user?.email) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch('/api/notifications?limit=1', BADGE_FETCH);
      if (!res.ok) {
        console.warn('[NotificationBell] unread fetch failed', {
          source,
          status: res.status,
        });
        return;
      }
      const data = await res.json();
      const uc = typeof data.unreadCount === 'number' ? data.unreadCount : 0;
      setUnreadCount(uc);
      devBadgeLog({
        notificationsUnreadCount: uc,
        source: `bell:${source}:/api/notifications?limit=1`,
      });
    } catch (error) {
      console.warn('[NotificationBell] unread fetch error', {
        source,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [session?.user?.email]);

  useEffect(() => {
    void refreshUnread('mount');

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible')
        return;
      void refreshUnread('poll');
    }, 45000);

    const onUpdated = () => void refreshUnread('notificationsUpdated');
    const onFocus = () => void refreshUnread('focus');
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshUnread('visibilitychange');
      }
    };
    const onPageShow = (event: PageTransitionEvent) =>
      void refreshUnread(event.persisted ? 'pageshow:bfcache' : 'pageshow');

    window.addEventListener('notificationsUpdated', onUpdated);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', onUpdated);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [refreshUnread]);

  if (!session?.user?.email) {
    return null;
  }

  return (
    <button
      type="button"
      data-tour="notification-bell"
      onClick={() => router.push('/notifications')}
      className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2.5 transition-colors hover:bg-gray-100"
      aria-label={t('common.notifications')}
    >
      <Bell className="h-5 w-5 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
