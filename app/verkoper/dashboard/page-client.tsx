'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionCleanup } from '@/hooks/useSessionCleanup';
import { useTranslation } from '@/hooks/useTranslation';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Star, 
  Eye, 
  Download,
  Calendar,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  User,
  Package,
  Minus,
  CheckCircle,
  Clock,
  XCircle,
  MessageCircle,
  Truck,
  Printer,
  ExternalLink,
  MapPin,
  LayoutGrid
} from 'lucide-react';
import { auth } from '@/lib/auth';
import Link from 'next/link';

interface DashboardStats {
  totalRevenue: number;
  platformFee?: number;
  platformFeePercentage?: number;
  netEarnings?: number;
  totalOrders: number;
  totalCustomers: number;
  averageRating: number;
  totalViews: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  ratingChange: number;
  viewsChange: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  productTitle: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface TopProduct {
  id: string;
  title: string;
  sales: number;
  revenue: number;
  views: number;
  rating: number;
}

interface ShippingLabel {
  id: string;
  pdfUrl: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  ectaroShipLabelId: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  productTitle: string;
  productImage?: string;
  amount: number;
  status: string;
  deliveryMode: string;
  deliveryAddress?: string;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  conversationId?: string;
  shippingLabel?: ShippingLabel | null;
}

export default function SellerDashboardClient() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'deliveries'>('dashboard');
  
  // Orders tab state
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Deliveries tab state
  const [deliveryOrders, setDeliveryOrders] = useState<any[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'deliveries') {
      loadDeliveryOrders();
    }
  }, [selectedPeriod, activeTab]);

  useEffect(() => {
    if (activeTab === 'orders') {
      filterOrders();
    }
  }, [orders, statusFilter, searchQuery, activeTab]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load dashboard stats
      const statsResponse = await fetch(`/api/seller/dashboard/stats?period=${selectedPeriod}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent orders
      const ordersResponse = await fetch(`/api/seller/dashboard/orders?period=${selectedPeriod}&limit=10`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders || []);
      }

      // Load top products
      const productsResponse = await fetch(`/api/seller/dashboard/products?period=${selectedPeriod}&limit=5`);
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setTopProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await fetch('/api/seller/dashboard/orders?limit=100&period=1y', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error loading orders:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadDeliveryOrders = async () => {
    try {
      setDeliveriesLoading(true);
      const response = await fetch('/api/delivery/dashboard', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        // For sellers: use recentOrders from delivery dashboard (same as bezorger dashboard)
        // These are LOCAL_DELIVERY orders that the seller needs to deliver themselves
        // Transform data to match UI expectations
        const deliveries = (data.recentOrders || []).map((order: any) => ({
          ...order,
          orderNumber: order.orderNumber || `HC-${(order.id || order.orderId)?.slice(-6).toUpperCase()}`,
          deliveryAddress: order.deliveryAddress || order.customerAddress || '',
          productTitle: order.productTitle || order.product?.title || 'Product',
          productImage: order.productImage || order.product?.image || '',
        }));
        setDeliveryOrders(deliveries);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error loading delivery orders:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error loading delivery orders:', error);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        const orderStatus = order.status.toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        return orderStatus === filterStatus || 
               (filterStatus === 'bevestigd' && orderStatus === 'confirmed') ||
               (filterStatus === 'in behandeling' && orderStatus === 'processing') ||
               (filterStatus === 'verzonden' && orderStatus === 'shipped') ||
               (filterStatus === 'voltooid' && orderStatus === 'delivered') ||
               (filterStatus === 'geannuleerd' && orderStatus === 'cancelled');
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(query) ||
        order.productTitle.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateCompare !== 0) return dateCompare;
      return (b.orderNumber || '').localeCompare(a.orderNumber || '');
    });

    setFilteredOrders(filtered);
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'confirmed' || statusLower === 'bevestigd') {
      return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
    if (statusLower === 'processing' || statusLower === 'in behandeling') {
      return <Package className="w-5 h-5 text-purple-600" />;
    }
    if (statusLower === 'shipped' || statusLower === 'verzonden') {
      return <Truck className="w-5 h-5 text-indigo-600" />;
    }
    if (statusLower === 'delivered' || statusLower === 'voltooid') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (statusLower === 'cancelled' || statusLower === 'geannuleerd') {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    return <Clock className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusText = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'confirmed' || statusLower === 'bevestigd') return t('seller.confirmed');
    if (statusLower === 'processing' || statusLower === 'in behandeling') return t('seller.processing');
    if (statusLower === 'shipped' || statusLower === 'verzonden') return t('seller.shipped');
    if (statusLower === 'delivered' || statusLower === 'voltooid') return t('seller.completed');
    if (statusLower === 'cancelled' || statusLower === 'geannuleerd') return t('seller.cancelled');
    return 'Wachtend';
  };

  const getOrderStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'confirmed' || statusLower === 'bevestigd') {
      return 'bg-blue-100 text-blue-800';
    }
    if (statusLower === 'processing' || statusLower === 'in behandeling') {
      return 'bg-purple-100 text-purple-800';
    }
    if (statusLower === 'shipped' || statusLower === 'verzonden') {
      return 'bg-indigo-100 text-indigo-800';
    }
    if (statusLower === 'delivered' || statusLower === 'voltooid') {
      return 'bg-green-100 text-green-800';
    }
    if (statusLower === 'cancelled' || statusLower === 'geannuleerd') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatOrderDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        await loadOrders();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || t('orders.updateError') || 'Fout bij bijwerken van bestelling');
      }
    } catch (error) {
      console.error('Network error updating order:', error);
      alert(t('errors.networkError'));
    }
  };

  const handleExportData = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/seller/dashboard/export?format=${format}&period=${selectedPeriod}`, {
        method: 'POST',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verkoper-rapport-${selectedPeriod}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setShowExportModal(false);
      } else {
        alert(t('errors.exportError'));
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(t('errors.exportError'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'voltooid':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'wachtend':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'geannuleerd':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('seller.dashboard')}</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">{t('seller.dashboardDescription')}</p>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Settings Button */}
              <Link
                href="/verkoper/instellingen"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                <Settings className="w-4 h-4" />
                <span>{t('common.settings')}</span>
              </Link>
            </div>
            
            {/* Period Selector - Moved below header, only show on dashboard tab */}
            {activeTab === 'dashboard' && (
              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm text-gray-600">{t('common.period') || 'Periode:'}</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                >
                  <option value="7d">{t('common.last7Days')}</option>
                  <option value="30d">{t('common.last30Days')}</option>
                  <option value="90d">{t('common.last90Days')}</option>
                  <option value="1y">{t('common.lastYear')}</option>
                </select>
              </div>
            )}
          </div>

          {/* Tabs - Responsive for mobile */}
          <div className="border-b border-gray-200 overflow-x-auto -mx-4 sm:mx-0 scrollbar-hide">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-0 min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 sm:gap-0`}
              >
                <LayoutGrid className="w-4 h-4 sm:hidden" />
                <span>{t('seller.dashboard')}</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 sm:gap-0`}
              >
                <Package className="w-4 h-4 sm:hidden" />
                <span>{t('seller.salesOrders') || 'Verkooporders'}</span>
              </button>
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`${
                  activeTab === 'deliveries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5 sm:gap-0`}
              >
                <Truck className="w-4 h-4 sm:hidden" />
                <span>{t('seller.deliveries') || 'Bezorgingen'}</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
        {/* Nieuwe Verkooporders Preview - BOVENAAN */}
        {(() => {
          const newOrders = recentOrders.filter(o => o.status === 'Bevestigd' || o.status === 'Wachtend');
          return newOrders.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 mb-6 sm:mb-8 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('seller.newOrders')}</h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {newOrders.length} {newOrders.length === 1 ? t('seller.newOrder') : t('seller.newOrdersPlural')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('common.allSalesOrders')}</span>
                </button>
              </div>
              
              {/* Preview van eerste 3 nieuwe bestellingen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {newOrders.slice(0, 3).map((order) => (
                  <div 
                    key={order.id}
                    onClick={() => setActiveTab('orders')}
                    className="bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-blue-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{order.productTitle}</p>
                        <p className="text-xs text-gray-600 mt-1">{order.customerName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'Bevestigd' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(order.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Als er meer dan 3 nieuwe bestellingen zijn */}
              {newOrders.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                  >
                    {t('seller.viewMoreOrders', { count: newOrders.length - 3 }) || `Bekijk ${newOrders.length - 3} meer →`}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Financial Overview - Prominent Section */}
        {stats && stats.netEarnings !== undefined && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-sm border border-emerald-200 p-4 sm:p-6 mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Financieel Overzicht</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Bruto Omzet */}
              <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Bruto Omzet</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{formatCurrency(stats.totalRevenue)}</p>
                <div className={`flex items-center text-xs mt-2 ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.revenueChange >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />
                  )}
                  <span className="break-words">{Math.abs(stats.revenueChange).toFixed(1)}% vs vorige periode</span>
                </div>
              </div>

              {/* Platform Kosten */}
              <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border-l-4 border-orange-500">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Platform Kosten</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600 break-words">{formatCurrency(stats.platformFee || 0)}</p>
                <p className="text-xs text-gray-500 mt-2 break-words">
                  {stats.platformFeePercentage ? `${stats.platformFeePercentage}%` : '12%'} HomeCheff fee
                  {stats.platformFeePercentage && stats.platformFeePercentage < 12 && (
                    <span className="ml-1 text-emerald-600 font-medium">✓ Met abonnement</span>
                  )}
                </p>
              </div>

              {/* Netto Verdiensten - Highlight */}
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg p-4 sm:p-5 shadow-lg text-white">
                <p className="text-xs sm:text-sm font-medium text-emerald-50 mb-2">Jouw Netto Verdiensten</p>
                <p className="text-2xl sm:text-3xl font-bold text-white break-words">{formatCurrency(stats.netEarnings)}</p>
                <p className="text-xs text-emerald-50 mt-2">Wordt automatisch uitbetaald</p>
              </div>
            </div>
          </div>
        )}

        {/* Other Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* Total Orders */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('common.totalOrders')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
                  <div className={`flex items-center text-xs sm:text-sm mt-1 ${stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.ordersChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    )}
                    <span>{Math.abs(stats.ordersChange).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0 ml-3">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('common.totalCustomers')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                  <div className={`flex items-center text-xs sm:text-sm mt-1 ${stats.customersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.customersChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    )}
                    <span>{Math.abs(stats.customersChange).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0 ml-3">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t('common.averageRating')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.averageRating.toFixed(1)}</p>
                  <div className={`flex items-center text-xs sm:text-sm mt-1 ${stats.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.ratingChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    )}
                    <span>{Math.abs(stats.ratingChange).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex-shrink-0 ml-3">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Total Views */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Totaal Weergaven</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.totalViews}</p>
                  <div className={`flex items-center text-xs sm:text-sm mt-1 ${stats.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.viewsChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    )}
                    <span>{Math.abs(stats.viewsChange).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-indigo-100 rounded-full flex-shrink-0 ml-3">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Alle Recente Verkooporders - Uitgebreid Overzicht */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('common.allSalesOrders')}</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                >
                  {t('common.viewAll') || 'Alles bekijken'} →
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentOrders.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => setActiveTab('orders')}
                      className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{order.productTitle}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(order.amount)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">{t('seller.noSalesOrders')}</p>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="mt-3 sm:mt-4 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                  >
                    {t('seller.manageOrders') || 'Orders beheren'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('seller.topProducts')}</h3>
                <button
                  onClick={() => router.push('/verkoper')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {t('seller.allProducts')}
                </button>
              </div>
            </div>
            <div className="p-6">
              {topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 truncate">{product.title}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{product.sales} {t('seller.sold')}</span>
                            <span>{product.views} {t('seller.views')}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{product.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('seller.noSalesData')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Quick Actions */}
        <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('seller.quickActions')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* Analytics - daarna */}
            <button
              onClick={() => router.push('/verkoper/analytics')}
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{t('seller.analytics')}</p>
                <p className="text-xs sm:text-sm text-gray-600">{t('seller.analyticsDescription')}</p>
              </div>
            </button>

            {/* Omzet - dan */}
            <button
              onClick={() => router.push('/verkoper/revenue')}
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{t('seller.revenue')}</p>
                <p className="text-xs sm:text-sm text-gray-600">{t('seller.revenueDescription')}</p>
              </div>
            </button>

            {/* Nieuw Product */}
            <button
              onClick={() => router.push('/sell/new')}
              className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{t('seller.newProduct')}</p>
                <p className="text-xs sm:text-sm text-gray-600">{t('seller.newProductDescription')}</p>
              </div>
            </button>

          </div>
          
          {/* Exporteren - helemaal onderaan */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{t('seller.export')}</p>
                <p className="text-sm text-gray-600">{t('seller.exportDescription')}</p>
              </div>
            </button>
          </div>
        </div>
          </>
        )}

        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <>
            {/* Filters */}
            <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-neutral-200">
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder={t('seller.searchOrders') || 'Zoek orders...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-neutral-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-1.5 sm:gap-2 flex-wrap overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  {['all', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status === 'all' ? 'all' : status.toLowerCase())}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                        statusFilter === (status === 'all' ? 'all' : status.toLowerCase())
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                      }`}
                    >
                      {status === 'all' ? (t('seller.all') || 'Alle') : (t(`seller.${status}`) || status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders List */}
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-neutral-200">
                <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {searchQuery || statusFilter !== 'all' 
                    ? (t('seller.noOrdersFound') || 'Geen orders gevonden')
                    : (t('seller.noSalesOrders') || 'Nog geen verkooporders')}
                </h3>
                <p className="text-neutral-600 mb-6">
                  {searchQuery || statusFilter !== 'all'
                    ? (t('seller.tryDifferentFilters') || 'Probeer andere filters')
                    : (t('seller.noIncomingOrders') || 'Je hebt nog geen inkomende orders ontvangen')}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('seller.clearFilters') || 'Filters wissen'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {getStatusIcon(order.status)}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-neutral-900 text-sm sm:text-base truncate">
                            🛍️ {order.orderNumber || `HC-${order.id.slice(-6).toUpperCase()}`}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-600">
                            {formatOrderDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-base sm:text-lg font-semibold text-neutral-900">
                          {formatCurrency(order.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{order.productTitle}</span>
                      </div>
                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2 text-xs sm:text-sm text-neutral-600 col-span-1 sm:col-span-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{order.deliveryAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                        <Truck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="capitalize">{order.deliveryMode.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Shipping Label Section - Only for SHIPPING orders */}
                    {order.deliveryMode === 'SHIPPING' && (
                      <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                          <h4 className="font-semibold text-blue-900 flex items-center gap-2 text-sm sm:text-base">
                            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                            {t('seller.shippingLabel') || 'Verzendlabel'}
                          </h4>
                          {order.shippingLabel && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
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
                        
                        {order.shippingLabel ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                              {order.shippingLabel.trackingNumber && (
                                <div className="break-words">
                                  <span className="font-medium text-blue-900">{t('seller.trackingNumber') || 'Tracking nummer'}:</span>
                                  <span className="ml-2 text-blue-700 break-all">{order.shippingLabel.trackingNumber}</span>
                                </div>
                              )}
                              {order.shippingLabel.carrier && (
                                <div>
                                  <span className="font-medium text-blue-900">{t('seller.carrier') || 'Vervoerder'}:</span>
                                  <span className="ml-2 text-blue-700">{order.shippingLabel.carrier}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {order.shippingLabel.pdfUrl && (
                                <>
                                  <button
                                    onClick={() => window.open(order.shippingLabel!.pdfUrl, '_blank')}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                                  >
                                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>{t('seller.viewLabel') || 'Label bekijken'}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = order.shippingLabel!.pdfUrl;
                                      link.download = `verzendlabel-${order.orderNumber}.pdf`;
                                      link.target = '_blank';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                                  >
                                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>{t('seller.downloadLabel') || 'Download'}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const printWindow = window.open(order.shippingLabel!.pdfUrl, '_blank');
                                      if (printWindow) {
                                        printWindow.onload = () => {
                                          printWindow.print();
                                        };
                                      }
                                    }}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                                  >
                                    <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>{t('seller.printLabel') || 'Printen'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm text-blue-700">
                            <p className="mb-2">{t('seller.labelAutoCreated') || 'Het verzendlabel wordt automatisch aangemaakt na betaling.'}</p>
                            <p className="text-xs text-blue-600">{t('seller.labelGenerating') || 'Als het label nog niet beschikbaar is, wordt het binnen enkele minuten gegenereerd.'}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-neutral-200">
                      {/* Status Update Buttons */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
                        {(order.status === 'Bevestigd' || order.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'PROCESSING')}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                          >
                            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{t('seller.productReady') || 'Product klaar'}</span>
                          </button>
                        )}
                        {(order.status === 'In behandeling' || order.status === 'PROCESSING') && order.deliveryMode === 'PICKUP' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{t('seller.readyForPickup') || 'Klaar voor afhalen'}</span>
                          </button>
                        )}
                        {(order.status === 'In behandeling' || order.status === 'PROCESSING') && order.deliveryMode === 'DELIVERY' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                          >
                            <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{t('seller.readyForDelivery') || 'Klaar voor bezorging'}</span>
                          </button>
                        )}
                        {(order.status === 'Verzonden' || order.status === 'SHIPPED') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{t('seller.markAsDelivered') || 'Markeer als bezorgd'}</span>
                          </button>
                        )}
                      </div>
                      
                      {/* View & Chat */}
                      <div className="flex gap-2 sm:ml-auto">
                        {order.conversationId && (
                          <Link href={`/messages/${order.conversationId}`}>
                            <button className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="sm:inline">{t('seller.details') || 'Details'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Deliveries Tab Content */}
        {activeTab === 'deliveries' && (
          <>
            {deliveriesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : deliveryOrders.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-neutral-200 px-4">
                <Truck className="w-12 h-12 sm:w-16 sm:h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
                  {t('seller.noDeliveries') || 'Nog geen bezorgingen'}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-6">
                  {t('seller.noDeliveryOrders') || 'Je hebt nog geen bezorgingen om uit te voeren.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {deliveryOrders.map((order: any) => (
                  <div 
                    key={order.id || order.orderId} 
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-neutral-900 text-sm sm:text-base truncate">
                            🚚 {order.orderNumber || `HC-${(order.id || order.orderId)?.slice(-6).toUpperCase()}`}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-600">
                            {formatOrderDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-base sm:text-lg font-semibold text-emerald-600">
                          {formatCurrency(order.deliveryFee || 300)}
                        </span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{order.customerName || order.User?.name || 'Klant'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{order.productTitle || order.product?.title || 'Product'}</span>
                      </div>
                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2 text-xs sm:text-sm text-neutral-600 col-span-1 sm:col-span-2">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{order.deliveryAddress}</span>
                        </div>
                      )}
                      {order.distance && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{order.distance.toFixed(1)} km</span>
                        </div>
                      )}
                      {order.estimatedTime && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>~{order.estimatedTime} min</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-neutral-200">
                      {/* Status Update Buttons */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 flex-1">
                        {(order.status === 'Bevestigd' || order.status === 'CONFIRMED' || order.status === 'PENDING') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id || order.orderId, 'PROCESSING')}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                          >
                            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{t('seller.startDelivery') || 'Start bezorging'}</span>
                          </button>
                        )}
                        {(order.status === 'In behandeling' || order.status === 'PROCESSING') && (
                          <button
                            onClick={() => handleStatusUpdate(order.id || order.orderId, 'SHIPPED')}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{t('seller.markAsDelivered') || 'Markeer als bezorgd'}</span>
                          </button>
                        )}
                      </div>
                      
                      {/* View & Chat */}
                      <div className="flex gap-2 sm:ml-auto">
                        {order.conversationId && (
                          <Link href={`/messages/${order.conversationId}`}>
                            <button className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => router.push(`/orders/${order.id || order.orderId}`)}
                          className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="sm:inline">{t('seller.details') || 'Details'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('seller.exportData')}</h3>
            <p className="text-gray-600 mb-6">
              {t('seller.chooseFormat', { period: selectedPeriod })}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExportData('csv')}
                className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{t('seller.csvFile')}</p>
                  <p className="text-sm text-gray-600">{t('seller.csvDescription')}</p>
                </div>
              </button>

              <button
                onClick={() => handleExportData('pdf')}
                className="w-full flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <Download className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{t('seller.pdfReport')}</p>
                  <p className="text-sm text-gray-600">{t('seller.pdfDescription')}</p>
                </div>
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('seller.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
