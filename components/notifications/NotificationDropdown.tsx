'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import NotificationFeedItems, {
  type NotificationFeedItem,
} from '@/components/notifications/NotificationFeedItems';

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const mapApiToFeed = useCallback((raw: unknown[]): NotificationFeedItem[] => {
    return (raw as any[]).map((n) => ({
      id: n.id,
      type: n.type || 'notice',
      title: n.title || 'Melding',
      message: n.message || '',
      link: n.link || n.targetRoute,
      isRead: !!n.isRead,
      createdAt: n.createdAt,
    }));
  }, []);

  const loadFeed = useCallback(async () => {
    if (!session?.user?.email) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setItems(mapApiToFeed(data.notifications || []));
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } catch (e) {
      console.error('notifications feed', e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, mapApiToFeed]);

  const refreshUnreadOnly = useCallback(async () => {
    if (!session?.user?.email) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch('/api/notifications?limit=1');
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
    } catch {
      /* ignore */
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) {
      setUnreadCount(0);
      setItems([]);
      return;
    }

    void refreshUnreadOnly();

    const interval = setInterval(
      () => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible')
          return;
        void refreshUnreadOnly();
      },
      isOpen ? 25000 : 75000
    );

    const onUpdated = () => void refreshUnreadOnly();
    window.addEventListener('notificationsUpdated', onUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', onUpdated);
    };
  }, [session?.user?.email, isOpen, refreshUnreadOnly]);

  useEffect(() => {
    if (isOpen && session?.user?.email) void loadFeed();
  }, [isOpen, session?.user?.email, loadFeed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      });
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    } catch {
      /* ignore */
    }
  };

  const handleSelect = async (n: NotificationFeedItem) => {
    if (!n.isRead) await markRead([n.id]);
    setIsOpen(false);
    const dest = n.link?.trim();
    if (dest) {
      if (dest.startsWith('http')) {
        window.location.href = dest;
      } else {
        router.push(dest);
      }
      return;
    }
    router.push('/notifications');
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      await loadFeed();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        data-tour="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
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

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            aria-hidden
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-4 bottom-4 top-20 z-50 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:h-auto md:max-h-[min(560px,calc(100vh-6rem))] md:w-[min(100vw-2rem,440px)] md:rounded-xl md:shadow-2xl">
            <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('common.notifications')}
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markAllRead()}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Alles gelezen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-gray-200/80"
                    aria-label="Sluiten"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-600">
                Chat, bestellingen, account en meer — één overzicht.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <NotificationFeedItems
                items={items}
                loading={loading}
                onSelect={handleSelect}
              />
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="w-full rounded-lg py-2 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
              >
                Alle meldingen bekijken →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
