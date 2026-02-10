'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Package, Clock, CheckCircle, Truck, X, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DeliveryCountdownTimer from './DeliveryCountdownTimer';

interface OrderNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  deliveryOrderId: string | null;
  orderNumber: string | null;
  link: string;
  isRead: boolean;
  createdAt: string;
  countdownData?: any;
}

type FilterType = 'all' | 'active' | 'completed' | 'cancelled';

export default function OrdersTab() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/orders');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading order notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('DELIVERED') || type.includes('COMPLETED')) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (type.includes('PICKED_UP') || type.includes('SHIPPED')) {
      return <Truck className="w-5 h-5 text-blue-600" />;
    }
    if (type.includes('CANCELLED')) {
      return <X className="w-5 h-5 text-red-600" />;
    }
    if (type.includes('COUNTDOWN') || type.includes('WARNING')) {
      return <Clock className="w-5 h-5 text-orange-600" />;
    }
    return <Package className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (type: string) => {
    if (type.includes('DELIVERED') || type.includes('COMPLETED')) {
      return 'border-green-200 bg-green-50';
    }
    if (type.includes('CANCELLED')) {
      return 'border-red-200 bg-red-50';
    }
    if (type.includes('COUNTDOWN') || type.includes('WARNING') || type.includes('URGENT')) {
      return 'border-orange-200 bg-orange-50';
    }
    return 'border-gray-200 bg-white';
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return !notif.type.includes('DELIVERED') && 
             !notif.type.includes('COMPLETED') && 
             !notif.type.includes('CANCELLED');
    }
    if (filter === 'completed') {
      return notif.type.includes('DELIVERED') || notif.type.includes('COMPLETED');
    }
    if (filter === 'cancelled') {
      return notif.type.includes('CANCELLED');
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
          <p className="text-sm text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'completed', 'cancelled'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors min-h-[36px] ${
                  filter === filterType
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filterType === 'all' ? t('filters.all') :
                 filterType === 'active' ? t('common.active') :
                 filterType === 'completed' ? t('common.completed') : t('common.cancelled')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Geen bestelling notificaties
            </h3>
            <p className="text-gray-500 text-sm">
              Je hebt nog geen notificaties over bestellingen ontvangen.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => {
              const notificationDate = new Date(notification.createdAt);
              const isToday = notificationDate.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer border-l-4 ${
                    !notification.isRead ? 'border-l-blue-500 bg-blue-50/30' : 'border-l-transparent'
                  } ${getStatusColor(notification.type)}`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) {
                      router.push(notification.link);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className={`text-sm font-semibold flex-1 ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-start gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1"></div>
                          )}
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {isToday
                              ? notificationDate.toLocaleTimeString('nl-NL', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : notificationDate.toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                            }
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed break-words ${
                        !notification.isRead ? 'text-gray-800 font-medium' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.orderNumber && (
                        <p className="text-xs text-gray-500 mt-1.5 font-medium">
                          Bestelling #{notification.orderNumber}
                        </p>
                      )}
                      {notification.deliveryOrderId && (
                        <div className="mt-2.5">
                          <DeliveryCountdownTimer 
                            deliveryOrderId={notification.deliveryOrderId}
                            className="inline-flex"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


