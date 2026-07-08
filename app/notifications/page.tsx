'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NotificationFeedItems, {
  type NotificationFeedItem,
} from '@/components/notifications/NotificationFeedItems';
import AppBackBar from '@/components/navigation/AppBackBar';
import { useTranslation } from '@/hooks/useTranslation';
import { savePendingIntent } from '@/lib/onboarding/pending-intent';
import { useSessionSwr } from '@/hooks/useSessionSwr';

function mapApiToFeed(raw: unknown[]): NotificationFeedItem[] {
  return (raw as any[]).map((n) => ({
    id: n.id,
    type: n.type || 'notice',
    title: n.title || 'Melding',
    message: n.message || '',
    link: n.link || n.targetRoute,
    isRead: !!n.isRead,
    createdAt: n.createdAt,
  }));
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, status } = useSession();

  const isAuthed = status === 'authenticated' && !!session?.user?.email;

  // Instant reopen from session cache, background refresh (UX-FIN-4C.2/4C.6).
  const {
    data: items,
    loading,
    refresh,
    mutate,
  } = useSessionSwr<NotificationFeedItem[]>(
    isAuthed ? `notifications:${session!.user!.email}` : '',
    async (signal) => {
      const res = await fetch('/api/notifications?limit=100', {
        cache: 'no-store',
        credentials: 'same-origin',
        signal,
      });
      if (!res.ok) throw new Error(`notifications ${res.status}`);
      const data = await res.json();
      return mapApiToFeed(data.notifications || []);
    },
    { enabled: isAuthed },
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      savePendingIntent({
        type: 'enable_notifications',
        returnPath: '/notifications',
      });
      router.replace('/login?callbackUrl=/notifications');
    }
  }, [status, router]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      mutate((prev) =>
        (prev ?? []).map((n) =>
          ids.includes(n.id) ? { ...n, isRead: true } : n,
        ),
      );
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: ids }),
        });
        if (!res.ok) await refresh();
      } catch {
        await refresh();
      }
    },
    [mutate, refresh],
  );

  const markAllRead = useCallback(async () => {
    mutate((prev) => (prev ?? []).map((n) => ({ ...n, isRead: true })));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      if (!res.ok) await refresh();
    } catch {
      await refresh();
    }
  }, [mutate, refresh]);

  const handleSelect = useCallback(
    (n: NotificationFeedItem) => {
      if (!n.isRead) void markRead([n.id]);
      const dest = n.link?.trim();
      if (dest) {
        if (dest.startsWith('http')) window.location.href = dest;
        else router.push(dest);
      }
    },
    [markRead, router],
  );

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-8 animate-pulse rounded bg-gray-200" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-2xl px-4 py-8">
      <AppBackBar
        fallbackUrl="/profile"
        label={t('navigation.back')}
        className="-mx-1 mb-6 rounded-xl border border-gray-100 bg-white/90 px-2"
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('notificationsPage.title') || 'Meldingen'}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('notificationsPage.subtitle') || 'Alle updates op één plek. Tik op een regel om naar de juiste pagina te gaan.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          {t('notificationsPage.markAllRead') || 'Alles als gelezen markeren'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <NotificationFeedItems
          items={items ?? []}
          loading={loading}
          onSelect={handleSelect}
        />
      </div>
    </main>
  );
}
