'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import OrderMessageButton from '@/components/chat/OrderMessageButton';
import OrderStatusChip from '@/components/orders/OrderStatusChip';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import TourTrigger from '@/components/onboarding/TourTrigger';
import InfoIcon from '@/components/onboarding/InfoIcon';
import { getHintsForPage } from '@/lib/onboarding/hints';
import { getDisplayName } from '@/lib/displayName';
import { useTranslation } from '@/hooks/useTranslation';

interface OrderItem {
  id: string;
  quantity: number;
  priceCents: number;
  product: {
    id: string;
    title: string;
    image?: string;
    seller: {
      id: string;
      name: string;
      username: string;
      profileImage?: string;
      displayFullName?: boolean | null;
      displayNameOption?: string | null;
    };
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryMode: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupDate?: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  hasUnreadMessages: boolean;
  lastMessage?: {
    text: string;
    sender: string;
    createdAt: string;
  };
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const { t, language } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const pageHints = getHintsForPage('orders');
  const dateLocale = language === 'en' ? 'en-GB' : 'nl-NL';

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session?.user, statusFilter]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders?status=${statusFilter}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        const sortedOrders = (data.orders || []).sort((a: Order, b: Order) => {
          const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateCompare !== 0) return dateCompare;
          return (b.orderNumber || '').localeCompare(a.orderNumber || '');
        });
        
        setOrders(sortedOrders);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Orders: error fetching orders:', response.status, errorData);
      }
    } catch (error) {
      console.error('Orders: error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'CONFIRMED':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'PROCESSING':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'SHIPPED':
        return <Truck className="w-5 h-5 text-indigo-600" />;
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('order.statusPending');
      case 'CONFIRMED':
        return t('order.statusConfirmed');
      case 'PROCESSING':
        return t('order.statusProcessing');
      case 'SHIPPED':
        return t('order.statusShipped');
      case 'DELIVERED':
        return t('order.statusDelivered');
      case 'CANCELLED':
        return t('order.statusCancelled');
      default:
        return status;
    }
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">{t('orders.loginTitle')}</h1>
          <Link href="/login" className="text-primary-600 hover:text-primary-700">
            {t('orders.loginCta')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <OnboardingTour pageId="orders" autoStart={false} />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('orders.title')}</h1>
              <p className="text-neutral-600 mt-2 text-sm sm:text-base">{t('orders.subtitle')}</p>
            </div>
            <TourTrigger pageId="orders" variant="button" />
          </div>
        </div>

        <div className="mb-6" data-tour="order-filter">
          <div className="flex gap-2 flex-wrap">
            {['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                {status === 'all' ? t('orders.filterAll') : getStatusText(status)}
              </button>
            ))}
          </div>
          {pageHints?.hints.filterStatus && (
            <div className="mt-2 flex items-center gap-2">
              <InfoIcon hint={pageHints.hints.filterStatus} pageId="orders" size="sm" />
              <span className="text-xs text-gray-500">{t('orders.filterHint')}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{t('orders.emptyTitle')}</h3>
            <p className="text-neutral-600 mb-6">
              {statusFilter === 'all' 
                ? t('orders.emptyAll')
                : t('orders.emptyFiltered', { status: getStatusText(statusFilter) })
              }
            </p>
            <Link
              href="/?chip=sale#homecheff-feed"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold"
            >
              {t('orders.continueShopping')}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <div 
                key={order.id} 
                data-tour={index === 0 ? "order-card" : undefined}
                className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        🛍️ {order.orderNumber || `HC-${order.id.slice(-6).toUpperCase()}`}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {new Date(order.createdAt).toLocaleDateString(dateLocale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusChip status={order.status} />
                    <span className="text-lg font-semibold text-neutral-900">
                      €{(order.totalAmount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-neutral-50 rounded-xl">
                      <div className="w-12 h-12 bg-neutral-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                            <Package className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900">{item.product.title}</h4>
                        <p className="text-sm text-neutral-600">
                          {t('orders.quantity', {
                            quantity: item.quantity,
                            price: (item.priceCents / 100).toFixed(2),
                          })}
                        </p>
                        <p className="text-sm text-neutral-600">
                          {t('orders.fromSeller', { seller: getDisplayName(item.product.seller) })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">
                          €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {(order.pickupAddress || order.deliveryAddress) && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl mb-4">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">
                        {order.deliveryMode === 'PICKUP' ? t('orders.pickupAddress') : t('orders.deliveryAddress')}
                      </p>
                      <p className="text-blue-700">
                        {order.deliveryMode === 'PICKUP' ? order.pickupAddress : order.deliveryAddress}
                      </p>
                      {(order.pickupDate || order.deliveryDate) && (
                        <p className="text-blue-700 mt-1">
                          {order.deliveryMode === 'PICKUP' ? t('orders.pickupDate') : t('orders.deliveryDate')}{' '}
                          {new Date(order.pickupDate || order.deliveryDate!).toLocaleDateString(dateLocale)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {order.lastMessage && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl mb-4">
                    <MessageCircle className={`w-5 h-5 ${order.hasUnreadMessages ? 'text-green-600' : 'text-green-500'} flex-shrink-0`} />
                    <div className="text-sm flex-1">
                      <p className="text-green-900">
                        <span className="font-medium">{order.lastMessage.sender}:</span>{' '}
                        {order.lastMessage.text}
                      </p>
                      <p className="text-green-700 text-xs">
                        {new Date(order.lastMessage.createdAt).toLocaleString(dateLocale)}
                      </p>
                    </div>
                    {order.hasUnreadMessages && (
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <OrderMessageButton 
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  />
                  {order.status === 'DELIVERED' && (
                    <Link
                      href={`/product/${order.items[0].product.id}`}
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
                    >
                      {t('orders.writeReview')}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
