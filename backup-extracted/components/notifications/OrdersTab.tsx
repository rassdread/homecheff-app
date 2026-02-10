'use client';

import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex gap-2">
            {(['all', 'active', 'completed', 'cancelled'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterType
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filterType === 'all' ? 'Alle' :
                 filterType === 'active' ? 'Actief' :
                 filterType === 'completed' ? 'Voltooid' : 'Geannuleerd'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Geen bestelling notificaties
            </h3>
            <p className="text-gray-500">
              Je hebt nog geen notificaties over bestellingen ontvangen.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                  !notification.isRead ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'
                } ${getStatusColor(notification.type)}`}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.link) {
                    router.push(notification.link);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={`text-sm font-semibold ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        {notification.orderNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            Bestelling #{notification.orderNumber}
                          </p>
                        )}
                        {notification.deliveryOrderId && (
                          <div className="mt-2">
                            <DeliveryCountdownTimer 
                              deliveryOrderId={notification.deliveryOrderId}
                              className="inline-flex"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mb-2"></div>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


