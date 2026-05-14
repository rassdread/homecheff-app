'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  type: string;
  payload: {
    title: string;
    message: string;
    [key: string]: any;
  };
  readAt?: string;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const consecutiveFailuresRef = useRef(0);
  const nextAllowedAtRef = useRef(0);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    const now = Date.now();
    if (now < nextAllowedAtRef.current) {
      return;
    }

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store',
        credentials: 'same-origin',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        consecutiveFailuresRef.current = 0;
        nextAllowedAtRef.current = 0;
      } else {
        if (response.status === 401) {
          setNotifications([]);
          setUnreadCount(0);
          consecutiveFailuresRef.current = 0;
          nextAllowedAtRef.current = 0;
          return;
        }
        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= 2) {
          const ms = Math.min(
            600_000,
            10_000 * 2 ** (consecutiveFailuresRef.current - 2),
          );
          nextAllowedAtRef.current = Date.now() + ms;
        }
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      consecutiveFailuresRef.current += 1;
      if (consecutiveFailuresRef.current >= 2) {
        const ms = Math.min(
          600_000,
          10_000 * 2 ** (consecutiveFailuresRef.current - 2),
        );
        nextAllowedAtRef.current = Date.now() + ms;
      }
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email, status]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, readAt: new Date().toISOString() }
              : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Poll for new notifications (reduced frequency to prevent rate limiting)
  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    if (status !== 'authenticated' || !session?.user?.email) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      consecutiveFailuresRef.current = 0;
      nextAllowedAtRef.current = 0;
      return;
    }

    setIsLoading(true);
    void loadNotifications();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void loadNotifications();
    }, 30000); // Poll alleen op zichtbare tab.

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadNotifications();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [session?.user?.email, status, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
  };
}
