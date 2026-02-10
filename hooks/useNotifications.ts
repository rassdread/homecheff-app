'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.email]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, readAt: new Date().toISOString() } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Poll for new notifications (reduced frequency to prevent rate limiting)
  useEffect(() => {
    if (!session?.user?.email) return;

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // Check every 30 seconds (reduced from 3 seconds to prevent 429 errors)

    return () => clearInterval(interval);
  }, [session?.user?.email, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
  };
}
