'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import { useCommsUnread } from '@/hooks/useCommsUnread';

/**
 * App-wide Pusher listener for in-app notifications + message badge refresh.
 * Single subscription per authenticated user (avoids duplicate binds in dashboards).
 */
export default function CommsRealtimeListener() {
  const { data: session } = useSession();
  const router = useRouter();
  const { refresh } = useCommsUnread(true);
  const [userId, setUserId] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.email) {
      setUserId(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/user/me', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { id?: string };
        if (data.id && !cancelled) setUserId(data.id);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  useEffect(() => {
    if (!userId || subscribedRef.current) return;
    subscribedRef.current = true;

    const channelName = `private-delivery-${userId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('notification', (data: { data?: Record<string, unknown> }) => {
      const type = String(data?.data?.type ?? '').toUpperCase();
      const conversationId = data?.data?.conversationId;

      if (type === 'NEW_MESSAGE' || type === 'MESSAGE_RECEIVED') {
        void refresh();
        try {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        } catch {
          /* ignore */
        }
      } else {
        try {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        } catch {
          /* ignore */
        }
      }

      if (
        typeof conversationId === 'string' &&
        conversationId &&
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/messages/') &&
        !window.location.pathname.includes(conversationId)
      ) {
        /* Badge refresh only — no intrusive toast on active thread list */
      }
    });

    return () => {
      subscribedRef.current = false;
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [userId, refresh, router]);

  return null;
}
