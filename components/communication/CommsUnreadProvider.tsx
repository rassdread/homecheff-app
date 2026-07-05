'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';

export type CommsUnreadContextValue = {
  count: number;
  loading: boolean;
  refresh: () => Promise<number>;
};

const CommsUnreadContext = createContext<CommsUnreadContextValue | null>(null);

const POLL_MS = 45_000;

function dispatchUnreadCount(count: number) {
  try {
    window.dispatchEvent(
      new CustomEvent('unreadCountUpdate', { detail: { unreadCount: count } }),
    );
  } catch {
    /* ignore */
  }
}

type ProviderProps = {
  children: ReactNode;
};

/**
 * Single poll + event hub for message unread badges (Message.readAt).
 * Mount once in Providers — consumers use useCommsUnread().
 */
export function CommsUnreadProvider({ children }: ProviderProps) {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const inflightRef = useRef<Promise<number> | null>(null);
  const countRef = useRef(0);

  const refresh = useCallback(async (): Promise<number> => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setCount(0);
      countRef.current = 0;
      return 0;
    }

    if (inflightRef.current) {
      return inflightRef.current;
    }

    const run = (async () => {
      try {
        const res = await fetch('/api/messages/unread-count', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!res.ok) {
          if (res.status === 401) {
            setCount(0);
            countRef.current = 0;
          }
          return countRef.current;
        }
        const data = (await res.json()) as { count?: number };
        const next = typeof data.count === 'number' ? data.count : 0;
        setCount(next);
        countRef.current = next;
        dispatchUnreadCount(next);
        return next;
      } catch {
        return countRef.current;
      } finally {
        inflightRef.current = null;
        setLoading(false);
      }
    })();

    inflightRef.current = run;
    setLoading(true);
    return run;
  }, [session?.user?.email, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setCount(0);
      countRef.current = 0;
      return;
    }

    void refresh();

    const onMessagesRead = () => void refresh();
    const onUnreadUpdate = (e: Event) => {
      const d = (e as CustomEvent<{ unreadCount?: number }>).detail;
      if (typeof d?.unreadCount === 'number') {
        setCount(d.unreadCount);
        countRef.current = d.unreadCount;
      } else {
        void refresh();
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    window.addEventListener('messagesRead', onMessagesRead);
    window.addEventListener('unreadCountUpdate', onUnreadUpdate);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener('messagesRead', onMessagesRead);
      window.removeEventListener('unreadCountUpdate', onUnreadUpdate);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, session?.user?.email, status]);

  const value = useMemo(
    () => ({ count, loading, refresh }),
    [count, loading, refresh],
  );

  return (
    <CommsUnreadContext.Provider value={value}>
      {children}
    </CommsUnreadContext.Provider>
  );
}

export function useCommsUnreadContext(): CommsUnreadContextValue | null {
  return useContext(CommsUnreadContext);
}
