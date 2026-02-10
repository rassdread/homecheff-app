'use client';

import { useState, useEffect } from 'react';
import DeliveryNotificationListener from './DeliveryNotificationListener';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Truck, 
  Navigation, 
  Bell, 
  Settings,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  MessageCircle,
  User,
  CreditCard,
  ExternalLink,
  Package,
  Printer,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface DeliveryStats {
  todayEarnings: number;
  weekEarnings: number;
  totalDeliveries: number;
  averageRating: number;
  onlineTime: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  totalEarnings: number;
  availableOrders: number;
  deliveryRadius: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

interface DeliveryOrder {
  id: string;
  orderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  deliveryFee: number;
  estimatedTime: number;
  distance: number;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  notes: string;
  createdAt: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  conversationId?: string;
  product: {
    title: string;
    image: string;
    seller: {
      name: string;
      address: string;
    };
  };
}

export default function DeliveryDashboard() {
  const { t, language, isReady, isLoading: translationsLoading } = useTranslation();
  const [isOnline, setIsOnline] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<DeliveryOrder | null>(null);
  const [stats, setStats] = useState<DeliveryStats>({
    todayEarnings: 0,
    weekEarnings: 0,
    totalDeliveries: 0,
    averageRating: 0,
    onlineTime: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    totalEarnings: 0,
    availableOrders: 0,
    deliveryRadius: 10
  });
  const [recentOrders, setRecentOrders] = useState<DeliveryOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<{
    accountId?: string | null;
    onboardingCompleted?: boolean;
  } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [shippingOrders, setShippingOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'delivery' | 'orders'>('delivery');

  useEffect(() => {
    fetchDeliveryData();
    // Only fetch online status and Stripe Connect if not a seller (sellers don't have delivery profiles)
    if (!isSeller) {
      fetchOnlineStatus();
      fetchStripeConnectStatus();
    }
    
    // Auto-refresh every 30 seconds when online
    const interval = setInterval(() => {
      if (isOnline) {
        fetchDeliveryData(true); // Pass true to indicate it's a refresh
      }
    }, 30000);
    
    // Check every minute if we should auto-go online (when within available times)
    const autoOnlineInterval = setInterval(() => {
      fetchOnlineStatus(); // This will check and auto-go online if needed
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(interval);
      clearInterval(autoOnlineInterval);
    };
  }, [isOnline]);

  // Start GPS tracking when online
  useEffect(() => {
    if (isOnline && gpsEnabled) {
      startGPSTracking();
    } else {
      stopGPSTracking();
    }
  }, [isOnline, gpsEnabled]);

  let gpsWatchId: number | null = null;

  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateGPSLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('GPS error:', error);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );

    // Watch position for continuous updates
    gpsWatchId = navigator.geolocation.watchPosition(
      (position) => {
        updateGPSLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('GPS watch error:', error);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );
  };

  const stopGPSTracking = () => {
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;

    }
  };

  const updateGPSLocation = async (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    
    try {
      await fetch('/api/delivery/update-gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

    } catch (error) {
      console.error('Failed to update GPS location:', error);
    }
  };

  const fetchOnlineStatus = async () => {
    try {
      const response = await fetch('/api/delivery/settings');
      if (response.ok) {
        const data = await response.json();
        const profile = data.profile;
        const currentIsOnline = profile?.isOnline || false;
        setIsOnline(currentIsOnline);
        // GPS enabled if deliveryMode is DYNAMIC OR gpsTrackingEnabled is true
        setGpsEnabled(
          profile?.deliveryMode === 'DYNAMIC' || 
          profile?.gpsTrackingEnabled === true
        );

        // Auto-go online if within available times and currently offline
        if (!currentIsOnline && profile?.availableDays && profile?.availableTimeSlots) {
          const now = new Date();
          const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
          const currentHour = now.getHours();

          // Check if current day is in available days
          const isDayAvailable = profile.availableDays.length === 0 || 
                                 profile.availableDays.includes(currentDay);

          // Check if current time is in available time slots
          let isTimeAvailable = profile.availableTimeSlots.length === 0;
          if (profile.availableTimeSlots.length > 0) {
            isTimeAvailable = profile.availableTimeSlots.some((slot: string) => {
              if (slot.includes('-')) {
                const parts = slot.split('-');
                const startTime = parts[0].includes(':') 
                  ? parseInt(parts[0].split(':')[0])
                  : parseInt(parts[0]);
                const endTime = parts[1].includes(':')
                  ? parseInt(parts[1].split(':')[0])
                  : parseInt(parts[1]);
                return currentHour >= startTime && currentHour < endTime;
              } else if (slot.includes(':')) {
                const slotHour = parseInt(slot.split(':')[0]);
                return currentHour >= slotHour && currentHour < slotHour + 1;
              } else {
                const timeSlotMap: Record<string, { start: number; end: number }> = {
                  'morning': { start: 6, end: 12 },
                  'afternoon': { start: 12, end: 18 },
                  'evening': { start: 18, end: 23 }
                };
                const mapped = timeSlotMap[slot.toLowerCase()];
                if (mapped) {
                  return currentHour >= mapped.start && currentHour < mapped.end;
                }
              }
              return false;
            });
          }

          // Auto-go online if within available times
          if (isDayAvailable && isTimeAvailable) {
            try {
              const toggleResponse = await fetch('/api/delivery/toggle-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isOnline: true })
              });
              if (toggleResponse.ok) {
                setIsOnline(true);
              }
            } catch (error) {
              console.error('Error auto-going online:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching online status:', error);
    }
  };

  const fetchStripeConnectStatus = async () => {
    try {
      const response = await fetch('/api/profile/me');
      if (response.ok) {
        const data = await response.json();
        setStripeConnectStatus({
          accountId: data.user?.stripeConnectAccountId,
          onboardingCompleted: data.user?.stripeConnectOnboardingCompleted
        });
      }
    } catch (error) {
      console.error('Error fetching Stripe Connect status:', error);
    }
  };

  const fetchDeliveryData = async (isRefresh = false) => {
    try {
      // Only show loading on initial load, not on refreshes
      if (!isRefresh && initialLoad) {
        setLoading(true);
      }
      // Fetch delivery data from API
      const response = await fetch('/api/delivery/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setCurrentOrder(data.currentOrder);
        setAvailableOrders(data.availableOrders || []);
        setIsOnline(data.isOnline || false);
        setIsSeller(data.isSeller || false);
        setShippingOrders(data.shippingOrders || []);
        setAllOrders(data.allOrders || []);
      }
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      if (!isRefresh && initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const response = await fetch('/api/delivery/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: !isOnline })
      });

      if (response.ok) {
        const data = await response.json();
        setIsOnline(!isOnline);
        
        // Show warning if going online outside available times
        if (data.warning) {
          alert(t('delivery.warning', { message: data.warning }));
        }
      } else {
        const error = await response.json();
        // Show error message to user
        alert(error.error || t('delivery.errorChangingStatus'));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert(t('delivery.errorChangingStatus'));
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/delivery/orders/${orderId}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (status === 'ACCEPTED') {
          setCurrentOrder(prev => prev ? { ...prev, status: 'ACCEPTED' } : null);
        } else if (status === 'PICKED_UP') {
          setCurrentOrder(prev => prev ? { ...prev, status: 'PICKED_UP' } : null);
        } else if (status === 'DELIVERED') {
          setCurrentOrder(null);
          fetchDeliveryData(); // Refresh stats
        } else if (status === 'CANCELLED') {
          setCurrentOrder(null);
          fetchDeliveryData(); // Refresh stats
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setAcceptingOrder(orderId);
    try {
      const response = await fetch(`/api/delivery/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        // Set this as current order
        setCurrentOrder(data.order);
        // Remove from available orders
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        // Refresh stats
        await fetchDeliveryData();
      } else {
        const error = await response.json();
        alert(`${t('delivery.error')} ${error.error || t('delivery.couldNotAcceptOrder')}`);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
        alert(t('delivery.errorAcceptingOrder'));
    } finally {
      setAcceptingOrder(null);
    }
  };

  const pickupOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'PICKED_UP');
  };

  const deliverOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'DELIVERED');
  };

  const cancelOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'CANCELLED');
  };

  const formatCurrency = (amount: number) => {
    const locale = language === 'en' ? 'en-GB' : 'nl-NL';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (language === 'en') {
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    } else {
      return hours > 0 ? `${hours}u ${mins}m` : `${mins}m`;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('delivery.pending');
      case 'ACCEPTED':
        return t('delivery.accepted');
      case 'PICKED_UP':
        return t('delivery.pickedUp');
      case 'DELIVERED':
        return t('delivery.delivered');
      case 'CANCELLED':
        return t('delivery.cancelled');
      default:
        return status;
    }
  };

  const handleStripeOnboard = async () => {
    setStripeLoading(true);
    try {
      console.log('🔍 Starting Stripe Connect onboarding...');
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log('📥 Response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        const errorMsg = data.error || t('delivery.errorStripeConnect');
        console.error('❌ Error response:', errorMsg);
        alert(errorMsg);
        return;
      }

      if (data.onboardingUrl) {
        console.log('✅ Redirecting to Stripe onboarding:', data.onboardingUrl);
        window.location.href = data.onboardingUrl;
      } else {
        console.error('❌ No onboardingUrl in response:', data);
        alert(t('delivery.errorStripeConnect'));
      }
    } catch (error) {
      console.error('❌ Exception during onboarding:', error);
      alert(t('delivery.errorSettingUpStripe'));
    } finally {
      setStripeLoading(false);
    }
  };

  // Wait for translations to load before rendering
  if (!isReady || translationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Listener */}
      <DeliveryNotificationListener />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('delivery.dashboardTitle')}</h1>
              <p className="text-sm sm:text-base text-gray-600">{t('delivery.dashboardSubtitle')}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/profile"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('delivery.myProfile')}</span>
                  <span className="sm:hidden">{t('delivery.profile')}</span>
                </a>
                <a
                  href="/delivery/settings"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('delivery.settings')}</span>
                  <span className="sm:hidden">{t('delivery.settingsShort')}</span>
                </a>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm ${
                  isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <span>{isOnline ? t('delivery.online') : t('delivery.offline')}</span>
                </div>
                {gpsEnabled && currentLocation && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-100 text-blue-800 text-sm">
                    <Navigation className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('delivery.gpsActive')}</span>
                    <span className="sm:hidden">GPS</span>
                  </div>
                )}
              </div>
              {/* Only show online/offline toggle for ambassadors, not sellers */}
              {!isSeller && (
                <button
                  onClick={toggleOnlineStatus}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium whitespace-nowrap ${
                    isOnline 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('delivery.goOffline')}</span>
                      <span className="sm:hidden">{t('delivery.offline')}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('delivery.goOnline')}</span>
                      <span className="sm:hidden">{t('delivery.online')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats Cards */}
        <div className={`grid ${isSeller ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'} gap-3 sm:gap-6 mb-6 sm:mb-8`}>
          <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('delivery.today')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.todayEarnings)}</p>
                {isSeller && (stats as any).totalSalesRevenue && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('seller.totalSales') || 'Totaal verkoop'}: {formatCurrency((stats as any).totalSalesRevenue || 0)}
                  </p>
                )}
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0 ml-2">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('delivery.thisWeek')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats.weekEarnings)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-2">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Earnings Card - For deliverers (not sellers) */}
          {!isSeller && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-sm border-2 border-emerald-200 p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-emerald-700">{t('delivery.totalEarned')}</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-900 truncate">{formatCurrency(stats.totalEarnings)}</p>
                  <p className="text-xs text-emerald-600 mt-1">{t('delivery.totalEarnedDesc') || 'Totaal verdiend met bezorgen'}</p>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-500 rounded-lg flex-shrink-0 ml-2">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Total Delivery Earnings Card - For sellers (if they have delivery earnings) */}
          {isSeller && (stats as any).totalDeliveryEarnings > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-blue-700">{t('delivery.totalEarned')}</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900 truncate">{formatCurrency((stats as any).totalDeliveryEarnings || 0)}</p>
                  <p className="text-xs text-blue-600 mt-1">{t('delivery.totalEarnedDesc') || 'Totaal verdiend met bezorgen'}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-500 rounded-lg flex-shrink-0 ml-2">
                  <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Total Earnings Card - Only for sellers */}
          {isSeller && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-sm border-2 border-emerald-200 p-3 sm:p-6 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-emerald-700">{t('seller.totalEarnings') || 'Totaal Verdiend'}</p>
                  <p className="text-xl sm:text-3xl font-bold text-emerald-900 truncate">{formatCurrency(stats.totalEarnings)}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-emerald-700">
                    <span>
                      {t('seller.sales') || 'Verkoop'}: {formatCurrency((stats as any).totalSalesRevenue || 0)}
                    </span>
                    <span>
                      {t('seller.delivery') || 'Bezorging'}: {formatCurrency((stats as any).totalDeliveryEarnings || 0)}
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-emerald-500 rounded-lg flex-shrink-0 ml-2">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Only show available orders count for ambassadors, not sellers */}
          {!isSeller && (
            <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('delivery.available')}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.availableOrders}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">{t('delivery.newOrders')}</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0 ml-2">
                  <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600">{t('delivery.rating')}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">{stats.totalDeliveries} {t('delivery.deliveries')}</p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-2">
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Sellers - Bezorgingen / Alle Orders */}
        {isSeller && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border p-1 flex gap-2">
            <button
              onClick={() => setActiveTab('delivery')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'delivery'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Truck className="w-4 h-4 inline mr-2" />
              {t('seller.deliveries') || 'Bezorgingen'}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              {t('seller.allOrders') || 'Alle Orders'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Available Orders Section - Only for ambassadors, not sellers */}
          {!isSeller && !currentOrder && availableOrders.length > 0 && isOnline && (
            <div className="lg:col-span-3 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-sm border-2 border-orange-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 bg-orange-500 rounded-full flex-shrink-0">
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('delivery.availableDeliveryOrders')}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{t('delivery.withinWorkArea', { radius: stats.deliveryRadius })}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchDeliveryData(true)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium self-start sm:self-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('delivery.refresh')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-5 hover:border-orange-300 transition-all">
                      <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {order.product.image ? (
                            <img
                              src={order.product.image}
                              alt={order.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 truncate">{order.product.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 truncate">{t('delivery.from')} {order.product.seller.name}</p>
                          <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {order.distance.toFixed(1)}km
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ~{order.estimatedTime}min
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b">
                        <div className="text-xs sm:text-sm text-gray-600">
                          <p className="font-medium">{t('delivery.deliveryCosts')}</p>
                          <p className="text-xs text-gray-500 hidden sm:block">{t('delivery.youGet')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                            {formatCurrency(order.deliveryFee)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ≈ {formatCurrency(order.deliveryFee * 0.88)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => acceptOrder(order.id)}
                        disabled={acceptingOrder === order.id}
                        className="w-full bg-emerald-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-emerald-700 font-semibold text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {acceptingOrder === order.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{t('delivery.accepting')}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{t('delivery.acceptOrder')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Current Order */}
          <div className="lg:col-span-2">
            {currentOrder ? (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('delivery.currentOrder')}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto ${
                    currentOrder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    currentOrder.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                    currentOrder.status === 'PICKED_UP' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {currentOrder.status === 'PENDING' ? t('delivery.pending') :
                     currentOrder.status === 'ACCEPTED' ? t('delivery.accepted') :
                     currentOrder.status === 'PICKED_UP' ? t('delivery.pickedUp') : t('delivery.delivered')}
                  </span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {currentOrder.product.image && (
                        <img
                          src={currentOrder.product.image}
                          alt={currentOrder.product.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{currentOrder.product.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{t('delivery.from')} {currentOrder.product.seller.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{currentOrder.customerName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base sm:text-lg font-bold text-emerald-600">
                        {formatCurrency(currentOrder.deliveryFee)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">{currentOrder.distance.toFixed(1)}km</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Pickup Details */}
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg flex-shrink-0">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-blue-900 mb-1">📦 {t('delivery.pickupAddress')}</p>
                          <p className="text-xs sm:text-sm text-blue-800 truncate">{currentOrder.product.seller.name}</p>
                          <p className="text-xs sm:text-sm text-blue-700 mt-1 break-words">{currentOrder.product.seller.address}</p>
                          {(currentOrder.product.seller as any).phone && (
                            <p className="text-xs sm:text-sm text-blue-700 mt-1">
                              📞 {(currentOrder.product.seller as any).phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg flex-shrink-0">
                          <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-green-900 mb-1">🏠 {t('delivery.deliveryAddress')}</p>
                          <p className="text-xs sm:text-sm text-green-800 truncate">{currentOrder.customerName}</p>
                          <p className="text-xs sm:text-sm text-green-700 mt-1 break-words">{currentOrder.customerAddress}</p>
                          {currentOrder.customerPhone && (
                            <p className="text-xs sm:text-sm text-green-700 mt-1">
                              📞 {currentOrder.customerPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentOrder.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <p className="font-medium text-yellow-900 text-xs sm:text-sm mb-1">💬 {t('delivery.notes')}</p>
                      <p className="text-yellow-800 text-xs sm:text-sm break-words">{currentOrder.notes}</p>
                    </div>
                  )}

                  <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t">
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      {currentOrder.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => acceptOrder(currentOrder.id)}
                            className="flex-1 bg-emerald-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-emerald-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg"
                          >
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>{t('delivery.acceptOrderButton')}</span>
                          </button>
                          <button
                            onClick={() => cancelOrder(currentOrder.id)}
                            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm sm:text-base"
                          >
                            {t('delivery.reject')}
                          </button>
                        </>
                      )}
                      {currentOrder.status === 'ACCEPTED' && (
                        <button
                          onClick={() => pickupOrder(currentOrder.id)}
                          className="flex-1 bg-blue-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>{t('delivery.productPickedUp')}</span>
                        </button>
                      )}
                      {currentOrder.status === 'PICKED_UP' && (
                        <button
                          onClick={() => deliverOrder(currentOrder.id)}
                          className="flex-1 bg-green-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-green-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>{t('delivery.productDelivered')}</span>
                        </button>
                      )}
                    </div>

                    {/* Communication Button - Show after acceptance */}
                    {(currentOrder.status === 'ACCEPTED' || currentOrder.status === 'PICKED_UP') && currentOrder.conversationId && (
                      <Link
                        href={`/messages?conversation=${currentOrder.conversationId}`}
                        className="w-full bg-purple-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-purple-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{t('delivery.sendMessageToCustomer')}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 text-center">
                {/* Show different message for sellers vs ambassadors */}
                {isSeller ? (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('delivery.sellerDeliveryDashboard')}</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {t('delivery.sellerDeliveryDescription')}
                    </p>
                  </>
                ) : !isOnline ? (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Pause className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('delivery.youAreOffline')}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      {t('delivery.goOnlineToReceive', { radius: stats.deliveryRadius })}
                    </p>
                    <button
                      onClick={toggleOnlineStatus}
                      className="bg-emerald-600 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg hover:bg-emerald-700 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 mx-auto shadow-lg"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{t('delivery.goOnline')}</span>
                    </button>
                  </>
                ) : availableOrders.length > 0 ? (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600 animate-pulse" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {t('delivery.ordersAvailable', { 
                        count: availableOrders.length, 
                        plural: availableOrders.length !== 1 ? (language === 'en' ? 's' : 'en') : '' 
                      })}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {t('delivery.scrollUpToSee')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{t('delivery.youAreOnline')}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      {t('delivery.waitingForOrders', { radius: stats.deliveryRadius })}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-blue-800">
                      <p className="font-medium mb-2">{t('delivery.searchingOrders')}</p>
                      <ul className="text-left space-y-1 text-xs">
                        <li>{t('delivery.withinRadiusSeller', { radius: stats.deliveryRadius })}</li>
                        <li>{t('delivery.withinRadiusBuyer', { radius: stats.deliveryRadius })}</li>
                        <li>{t('delivery.availableInTimeSlot')}</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Work Area Info */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl shadow-sm border border-emerald-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span>{t('delivery.workArea')}</span>
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-700">{t('delivery.deliveryRadius')}</span>
                  <span className="font-bold text-emerald-600 text-sm sm:text-base">{stats.deliveryRadius} km</span>
                </div>
                <div className="p-2.5 sm:p-3 bg-white rounded-lg border border-emerald-100">
                  <p className="text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2">
                    <strong>{t('delivery.gpsValidation')}</strong>
                  </p>
                  <ul className="text-xs text-gray-600 space-y-0.5 sm:space-y-1">
                    <li>{t('delivery.withinRadiusSellerShort', { radius: stats.deliveryRadius })}</li>
                    <li>{t('delivery.withinRadiusBuyerShort', { radius: stats.deliveryRadius })}</li>
                    <li>{t('delivery.availableInYourTimeSlot')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* All Orders Module - Only for Sellers, when Orders tab is active */}
            {isSeller && activeTab === 'orders' && allOrders.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span>{t('seller.allOrders') || 'Alle Verkooporders'}</span>
                  <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    {allOrders.length} {t('seller.orders') || 'orders'}
                  </span>
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allOrders.slice(0, 10).map((order) => {
                    const needsAction = order.status === 'CONFIRMED' || order.status === 'PROCESSING';
                    const isShipping = order.deliveryMode === 'SHIPPING';
                    
                    return (
                      <div key={order.id} className={`bg-white rounded-lg p-3 border ${needsAction ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-medium text-gray-900">
                                {order.orderNumber || `#${order.id.slice(-6)}`}
                              </p>
                              {needsAction && (
                                <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                                  {t('seller.actionRequired') || 'ACTIE'}
                                </span>
                              )}
                              {isShipping && (
                                <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs font-bold rounded">
                                  {t('seller.shipping') || 'VERZENDEN'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">{order.productTitle}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.customerName}</p>
                            <p className="text-xs font-semibold text-green-600 mt-1">
                              {formatCurrency(order.amount)}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ml-2 flex-shrink-0 ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'SHIPPED' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'DELIVERED' ? (t('seller.completed') || 'Voltooid') :
                             order.status === 'CONFIRMED' ? (t('seller.confirmed') || 'Bevestigd') :
                             order.status === 'PROCESSING' ? (t('seller.processing') || 'In behandeling') :
                             order.status === 'SHIPPED' ? (t('seller.shipped') || 'Verzonden') :
                             (t('seller.pending') || 'Wachtend')}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Link 
                            href={`/verkoper/orders`}
                            className="flex-1 px-2 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
                          >
                            <Package className="w-3 h-3" />
                            {t('seller.viewDetails') || 'Details'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {allOrders.length > 10 && (
                  <Link href="/verkoper/orders" className="block mt-3 text-center text-sm text-green-600 hover:text-green-700 font-medium">
                    {t('seller.viewAllOrders') || `Alle ${allOrders.length} orders bekijken →`}
                  </Link>
                )}
              </div>
            )}

            {/* Shipping Labels Module - Only for Sellers, when Delivery tab is active */}
            {isSeller && activeTab === 'delivery' && shippingOrders.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  <span>{t('seller.shippingLabels') || 'Verzendlabels'}</span>
                  {shippingOrders.filter((o: any) => o.shippingLabel?.status === 'generated' || !o.shippingLabel).length > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      {shippingOrders.filter((o: any) => o.shippingLabel?.status === 'generated' || !o.shippingLabel).length} {t('seller.actionRequired') || 'actie vereist'}
                    </span>
                  )}
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {shippingOrders.slice(0, 5).map((order) => {
                    const needsAction = !order.shippingLabel || order.shippingLabel.status === 'generated';
                    const isPrinted = order.shippingLabel?.status === 'printed';
                    const isShipped = order.shippingLabel?.status === 'shipped';
                    
                    return (
                    <div key={order.id} className={`bg-white rounded-lg p-3 border ${needsAction ? 'border-orange-300 bg-orange-50' : 'border-blue-100'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-medium text-gray-900">
                              {order.orderNumber || `#${order.id.slice(-6)}`}
                            </p>
                            {needsAction && (
                              <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded">
                                {t('seller.actionRequired') || 'ACTIE'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">{order.productTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.customerName}</p>
                        </div>
                        {order.shippingLabel && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ml-2 flex-shrink-0 ${
                            order.shippingLabel.status === 'generated' ? 'bg-green-100 text-green-800' :
                            order.shippingLabel.status === 'printed' ? 'bg-blue-100 text-blue-800' :
                            order.shippingLabel.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.shippingLabel.status === 'generated' ? (t('seller.labelGenerated') || 'Gegenereerd') :
                             order.shippingLabel.status === 'printed' ? (t('seller.labelPrinted') || 'Geprint') :
                             order.shippingLabel.status === 'shipped' ? (t('seller.labelShipped') || 'Verzonden') : 
                             (t('seller.labelPending') || 'In behandeling')}
                          </span>
                        )}
                      </div>
                      
                      {/* Action Instructions */}
                      {needsAction && !order.shippingLabel && (
                        <div className="mb-2 p-2 bg-blue-100 border border-blue-200 rounded text-xs text-blue-900">
                          <p className="font-medium mb-1">⏳ {t('seller.waitingForLabel') || 'Wachten op label...'}</p>
                          <p>{t('seller.labelWillBeGenerated') || 'Het verzendlabel wordt automatisch gegenereerd na betaling.'}</p>
                        </div>
                      )}
                      
                      {needsAction && order.shippingLabel?.status === 'generated' && (
                        <div className="mb-2 p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-900">
                          <p className="font-semibold mb-1">📦 {t('seller.actionNeeded') || 'Actie vereist:'}</p>
                          <ol className="list-decimal list-inside space-y-0.5 ml-1">
                            <li>{t('seller.step1PrintLabel') || 'Print het verzendlabel'}</li>
                            <li>{t('seller.step2PackItem') || 'Verpak het product veilig'}</li>
                            <li>{t('seller.step3AttachLabel') || 'Plak het label op het pakket'}</li>
                            <li>{t('seller.step4PostPackage') || 'Post het pakket bij de vervoerder'}</li>
                          </ol>
                        </div>
                      )}
                      
                      {isPrinted && (
                        <div className="mb-2 p-2 bg-blue-100 border border-blue-200 rounded text-xs text-blue-900">
                          <p className="font-medium">✅ {t('seller.labelPrintedReady') || 'Label geprint - klaar om te verzenden'}</p>
                          <p className="mt-1">{t('seller.markAsShippedWhenPosted') || 'Markeer als verzonden zodra je het pakket hebt gepost.'}</p>
                        </div>
                      )}
                      
                      {isShipped && (
                        <div className="mb-2 p-2 bg-green-100 border border-green-200 rounded text-xs text-green-900">
                          <p className="font-medium">✅ {t('seller.packageShipped') || 'Pakket verzonden'}</p>
                          <p className="mt-1">{t('seller.trackPackage') || 'Volg het pakket met het tracking nummer hieronder.'}</p>
                        </div>
                      )}
                      
                      {order.shippingLabel && order.shippingLabel.pdfUrl && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <button
                            onClick={() => window.open(order.shippingLabel.pdfUrl, '_blank')}
                            className="flex-1 px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t('seller.viewLabel') || 'Bekijk'}
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = order.shippingLabel.pdfUrl;
                              link.download = `verzendlabel-${order.orderNumber}.pdf`;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="flex-1 px-2 py-1.5 bg-white border border-blue-600 text-blue-600 text-xs rounded hover:bg-blue-50 flex items-center justify-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            {t('seller.downloadLabel') || 'Download'}
                          </button>
                          <button
                            onClick={() => {
                              const printWindow = window.open(order.shippingLabel.pdfUrl, '_blank');
                              if (printWindow) {
                                printWindow.onload = () => {
                                  printWindow.print();
                                };
                              }
                            }}
                            className="flex-1 px-2 py-1.5 bg-white border border-blue-600 text-blue-600 text-xs rounded hover:bg-blue-50 flex items-center justify-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            {t('seller.printLabel') || 'Print'}
                          </button>
                        </div>
                      )}
                      
                      {order.shippingLabel?.trackingNumber && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">{t('seller.trackingNumber') || 'Tracking'}:</span>{' '}
                            <span className="text-gray-900">{order.shippingLabel.trackingNumber}</span>
                          </p>
                          {order.shippingLabel.carrier && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              <span className="font-medium">{t('seller.carrier') || 'Vervoerder'}:</span>{' '}
                              <span className="text-gray-900">{order.shippingLabel.carrier}</span>
                            </p>
                          )}
                        </div>
                      )}
                      
                      {!order.shippingLabel && (
                        <p className="text-xs text-blue-600 mt-2">
                          {t('seller.labelGenerating') || 'Label wordt gegenereerd...'}
                        </p>
                      )}
                    </div>
                    );
                  })}
                </div>
                {shippingOrders.length > 5 && (
                  <Link href="/verkoper/orders" className="block mt-3 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {t('seller.viewAllShippingOrders') || `Alle ${shippingOrders.length} verzendorders bekijken →`}
                  </Link>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('delivery.today')}</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base text-gray-600">{t('delivery.onlineTime')}</span>
                  <span className="font-medium text-sm sm:text-base">{formatTime(stats.onlineTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base text-gray-600">{t('delivery.completed')}</span>
                  <span className="font-medium text-green-600 text-sm sm:text-base">{stats.completedDeliveries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base text-gray-600">{t('delivery.pending')}</span>
                  <span className="font-medium text-blue-600 text-sm sm:text-base">{stats.pendingDeliveries}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm sm:text-base text-gray-600">{t('delivery.totalEarned')}</span>
                  <span className="font-bold text-emerald-600 text-sm sm:text-base">{formatCurrency(stats.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('delivery.recentOrders')}</h3>
              <div className="space-y-2 sm:space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{order.product.title}</p>
                      <p className="text-xs text-gray-500 truncate">{order.customerName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-medium text-emerald-600">{formatCurrency(order.deliveryFee)}</p>
                      <p className="text-xs text-gray-500">{getStatusLabel(order.status)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stripe Connect Status */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('delivery.paymentStatus')}</span>
              </h3>
              
              {stripeConnectStatus?.onboardingCompleted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 flex-shrink-0" />
                    <span className="font-medium text-green-800 text-sm sm:text-base">{t('delivery.stripeConnectActive')}</span>
                  </div>
                  <p className="text-green-700 text-xs sm:text-sm">
                    {t('delivery.stripeConnectActiveDesc')}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mr-2 flex-shrink-0" />
                    <span className="font-medium text-amber-800 text-sm sm:text-base">{t('delivery.stripeConnectRequired')}</span>
                  </div>
                  <p className="text-amber-700 text-xs sm:text-sm mb-2 sm:mb-3">
                    {t('delivery.stripeConnectRequiredDesc')}
                  </p>
                  <button
                    onClick={handleStripeOnboard}
                    disabled={stripeLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
                  >
                    <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{stripeLoading ? t('common.loading') : t('delivery.setupNow')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{t('delivery.delivererTips')}</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                <li>{t('delivery.keepPhoneCharged')}</li>
                <li>{t('delivery.locationAlwaysOn')}</li>
                <li>{t('delivery.checkVehicle')}</li>
                <li>{t('delivery.beFriendly')}</li>
                <li>{t('delivery.timeWindow')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}