'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { pusherClient } from '@/lib/pusher';
import { Bell, X, CheckCircle, Clock } from 'lucide-react';

interface NotificationMessage {
  id?: string;
  title: string;
  body: string;
  urgent?: boolean;
  data?: Record<string, any>;
  actions?: Array<{
    label: string;
    action: string;
  }>;
  timestamp?: string;
}

interface DisplayNotification extends NotificationMessage {
  id: string;
  displayId: number;
}

export default function DeliveryNotificationListener() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const notificationAudio = new Audio('/notification.mp3');
      notificationAudio.volume = 0.5;
      return notificationAudio;
    }
    return null;
  });

  // Get user ID from session
  useEffect(() => {
    const fetchUserId = async () => {
      if (!session?.user?.email) return;
      
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setUserId(data.id);
        }
      } catch (error) {
        console.error('Failed to fetch user ID:', error);
      }
    };

    fetchUserId();
  }, [session?.user?.email]);

  useEffect(() => {
    if (!userId) return;
    const channel = pusherClient.subscribe(`private-delivery-${userId}`);
    
    // Listen for general notifications
    channel.bind('notification', (data: NotificationMessage) => {
      const displayId = Date.now();
      const notification: DisplayNotification = {
        ...data,
        id: data.id || `notif-${displayId}`,
        displayId
      };
      
      // Add to notifications list
      setNotifications(prev => [...prev, notification]);
      
      // Play sound for urgent notifications
      if (data.urgent && audio) {
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
      
      // Browser notification API (if permission granted)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const browserNotification = new Notification(data.title, {
            body: data.body,
            icon: '/logo.png',
            badge: '/badge.png',
            tag: `delivery-${notification.displayId}`,
            requireInteraction: data.urgent
          });

          // Handle notification click
          browserNotification.onclick = () => {
            window.focus();
            if (data.data?.actionUrl) {
              router.push(data.data.actionUrl);
            }
            browserNotification.close();
          };
        } catch (error) {
          console.error('Failed to show browser notification:', error);
        }
      }
    });

    // Cleanup
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [userId, audio, router]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
      });
    }
  }, []);

  const handleAction = async (notificationDisplayId: number, action: string) => {
    if (action === 'GO_ONLINE') {
      try {
        await fetch('/api/delivery/toggle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: true })
        });
        router.push('/delivery/dashboard');
      } catch (error) {
        console.error('Failed to go online:', error);
      }
    } else if (action === 'VIEW_DASHBOARD') {
      router.push('/delivery/dashboard');
    }
    
    // Remove notification
    dismissNotification(notificationDisplayId);
  };

  const dismissNotification = (displayId: number) => {
    setNotifications(prev => prev.filter(n => n.displayId !== displayId));
  };

  // Auto-dismiss non-urgent notifications after 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => 
        prev.filter(n => {
          if (n.urgent) return true;
          if (!n.timestamp) return true;
          const age = Date.now() - new Date(n.timestamp).getTime();
          return age < 10000; // Keep for 10 seconds
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            bg-white rounded-xl shadow-2xl border-2 p-4
            animate-in slide-in-from-right duration-300
            ${notification.urgent 
              ? 'border-red-500 bg-gradient-to-br from-red-50 to-orange-50 ring-4 ring-red-100' 
              : 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50'
            }
          `}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              {notification.urgent ? (
                <Bell className="w-5 h-5 text-red-600 animate-bounce" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              )}
              <span className="font-bold text-gray-900 text-sm">
                {notification.title}
              </span>
            </div>
            <button 
              onClick={() => dismissNotification(notification.displayId)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            {notification.body}
          </p>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2">
              {notification.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(notification.displayId, action.action)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg font-semibold text-sm
                    transition-all transform hover:scale-105 active:scale-95
                    ${idx === 0
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Countdown for urgent notifications */}
          {notification.urgent && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-red-600 font-semibold animate-pulse">
              <Clock className="w-3 h-3" />
              <span>Actie vereist!</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

