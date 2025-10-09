'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'notification' | 'success' | 'error';
  timestamp: number;
}

export default function ToastNotification() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { notifications, unreadCount } = useNotifications();

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Check if this is a new notification (within last 5 seconds)
      const notificationTime = new Date(latestNotification.createdAt).getTime();
      const now = Date.now();
      
      if (now - notificationTime < 5000) { // 5 seconds
        const newToast: Toast = {
          id: `toast-${latestNotification.id}`,
          title: latestNotification.title,
          message: latestNotification.message,
          type: latestNotification.type === 'MESSAGE' ? 'message' : 'notification',
          timestamp: now,
        };

        setToasts(prev => [newToast, ...prev.slice(0, 2)]); // Keep max 3 toasts

        // Auto remove after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
        }, 5000);
      }
    }
  }, [notifications]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${
            toast.type === 'message' 
              ? 'bg-blue-50 border-blue-500 text-blue-800'
              : toast.type === 'notification'
              ? 'bg-purple-50 border-purple-500 text-purple-800'
              : toast.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              <p className="text-sm mt-1 opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-5000 ease-linear ${
                toast.type === 'message' ? 'bg-blue-500' : 'bg-purple-500'
              }`}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
