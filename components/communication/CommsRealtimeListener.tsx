'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { X, Bell } from 'lucide-react';
import { pusherClient } from '@/lib/pusher';
import { useCommsUnread } from '@/hooks/useCommsUnread';
import { canonicalLogoPath } from '@/lib/brand/canonical-logo';
import { parseInternalPathFromUnknownInput } from '@/lib/native/safeRoute';

type LiveToast = {
  id: string;
  title: string;
  body: string;
  route: string | null;
  urgent: boolean;
};

function resolveLiveRoute(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const candidates = [data.route, data.actionUrl, data.link, data.path];
  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const parsed = parseInternalPathFromUnknownInput(raw);
    if (parsed) return parsed;
  }
  const conversationId = data.conversationId;
  if (typeof conversationId === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(conversationId)) {
    return `/messages/${conversationId}/`;
  }
  const orderId = data.orderId;
  if (typeof orderId === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(orderId)) {
    return `/orders/${orderId}`;
  }
  return null;
}

function shouldSuppressToastForCurrentPath(route: string | null): boolean {
  if (typeof window === 'undefined' || !route) return false;
  const path = window.location.pathname;
  if (route.includes('/messages') && path.startsWith('/messages')) {
    const cid = route.match(/\/messages\/([^/?#]+)/)?.[1];
    if (cid && path.includes(cid)) return true;
    if (route.includes('conversation=') && path.startsWith('/messages')) {
      try {
        const u = new URL(route, window.location.origin);
        const q = u.searchParams.get('conversation');
        if (q && window.location.search.includes(q)) return true;
      } catch {
        /* ignore */
      }
    }
  }
  if (route.includes('/orders/') && path.startsWith('/orders/')) {
    const oid = route.match(/\/orders\/([^/?#]+)/)?.[1];
    if (oid && path.includes(oid)) return true;
  }
  return false;
}

/**
 * App-wide Pusher listener: badge refresh + in-app toast/sound for important events.
 * Typing indicators never arrive on this channel (Pusher `user-typing` only).
 */
export default function CommsRealtimeListener() {
  const { data: session } = useSession();
  const router = useRouter();
  const { refresh } = useCommsUnread(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<LiveToast[]>([]);
  const subscribedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const a = new Audio('/notification.mp3');
    a.volume = 0.45;
    audioRef.current = a;
  }, []);

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

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!userId || subscribedRef.current) return;
    subscribedRef.current = true;

    const channelName = `private-delivery-${userId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind(
      'notification',
      (payload: {
        title?: string;
        body?: string;
        urgent?: boolean;
        data?: Record<string, unknown>;
      }) => {
        const type = String(payload?.data?.type ?? '').toUpperCase();
        const route = resolveLiveRoute(payload?.data);

        try {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        } catch {
          /* ignore */
        }

        if (type === 'NEW_MESSAGE' || type === 'MESSAGE_RECEIVED') {
          void refresh();
        }

        // Never toast for typing (not on this event). Suppress when already on target.
        if (shouldSuppressToastForCurrentPath(route)) {
          return;
        }

        const title = (payload.title || '').trim() || 'HomeCheff';
        const body = (payload.body || '').trim() || 'Nieuwe update';
        const id = `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const urgent = Boolean(payload.urgent) || type.startsWith('ORDER_') || type.startsWith('DELIVERY_') || type.startsWith('PROPOSAL_') || type === 'NEW_ORDER' || type === 'NEW_MESSAGE';

        setToasts((prev) => [...prev.slice(-4), { id, title, body, route, urgent }]);

        if (audioRef.current && document.visibilityState === 'visible') {
          void audioRef.current.play().catch(() => undefined);
        }

        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted' &&
          document.visibilityState !== 'visible'
        ) {
          try {
            const n = new Notification(title, {
              body,
              icon: canonicalLogoPath('square'),
              badge: canonicalLogoPath('favicon48'),
              tag: type || id,
            });
            n.onclick = () => {
              window.focus();
              if (route) router.push(route);
              n.close();
            };
          } catch {
            /* ignore */
          }
        }

        window.setTimeout(() => dismissToast(id), urgent ? 12000 : 7000);
      }
    );

    return () => {
      subscribedRef.current = false;
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [userId, refresh, router, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="hc-toast-dock pointer-events-none fixed bottom-4 right-4 z-[80] flex max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
          role="status"
        >
          <div className="flex items-start gap-2">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{toast.title}</p>
              <p className="mt-0.5 text-sm text-gray-600 line-clamp-3">{toast.body}</p>
              {toast.route ? (
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
                  onClick={() => {
                    router.push(toast.route!);
                    dismissToast(toast.id);
                  }}
                >
                  Openen
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
              aria-label="Sluiten"
              onClick={() => dismissToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
