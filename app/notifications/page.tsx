'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NotificationFeedItems, {
  type NotificationFeedItem,
} from '@/components/notifications/NotificationFeedItems';
import AppBackBar from '@/components/navigation/AppBackBar';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const load = useCallback(async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=100');
      if (res.ok) {
        const data = await res.json();
        setItems(mapApiToFeed(data.notifications || []));
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, mapApiToFeed]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/notifications');
      return;
    }
    if (session?.user?.email) void load();
  }, [status, session?.user?.email, router, load]);

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: ids }),
    });
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllAsRead: true }),
    });
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    await load();
  };

  const handleSelect = async (n: NotificationFeedItem) => {
    if (!n.isRead) await markRead([n.id]);
    const dest = n.link?.trim();
    if (dest) {
      if (dest.startsWith('http')) window.location.href = dest;
      else router.push(dest);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Meldingen</h1>
          <p className="mt-1 text-sm text-gray-600">
            Alle updates op één plek. Tik op een regel om naar de juiste pagina te gaan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void markAllRead()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Alles als gelezen markeren
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <NotificationFeedItems
          items={items}
          loading={loading}
          onSelect={handleSelect}
        />
      </div>
    </main>
  );
}
