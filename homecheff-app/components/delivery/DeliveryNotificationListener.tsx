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

export default function DeliveryNotificationListener() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Array<NotificationMessage & { id: number }>>([]);
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const notificationAudio = new Audio('/notification.mp3');
      notificationAudio.volume = 0.5;
      return notificationAudio;
    }
    return null;
  });

  useEffect(() => {
    if (!session?.user?.id) return;

    console.log('🔔 Subscribing to delivery notifications for user:', session.user.id);

    const channel = pusherClient.subscribe(`private-delivery-${session.user.id}`);
    
    // Listen for general notifications
    channel.bind('notification', (data: NotificationMessage) => {
      console.log('📢 Notification received:', data);
      
      const notification = {
        ...data,
        id: Date.now()
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
            tag: `delivery-${notification.id}`,
            requireInteraction: data.urgent,
            vibrate: data.urgent ? [200, 100, 200] : undefined
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
  }, [session?.user?.id, audio, router]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const handleAction = async (notificationId: number, action: string) => {
    if (action === 'GO_ONLINE') {
      try {
        await fetch('/api/delivery/toggle-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isOnline: true })
        });
        router.push('/bezorger');
      } catch (error) {
        console.error('Failed to go online:', error);
      }
    } else if (action === 'VIEW_DASHBOARD') {
      router.push('/bezorger');
    }
    
    // Remove notification
    dismissNotification(notificationId);
  };

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
              onClick={() => dismissNotification(notification.id)}
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
                  onClick={() => handleAction(notification.id, action.action)}
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

