'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import GoogleAnalyticsAdvancedDashboard from './GoogleAnalyticsAdvancedDashboard';
import UnifiedAnalyticsDashboard from './UnifiedAnalyticsDashboard';
import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  MapPin, 
  Clock, 
  Star,
  Eye,
  Heart,
  MessageSquare,
  Truck,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  Database,
  ExternalLink
} from 'lucide-react';

interface AnalyticsData {
  // Revenue & Financial
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
  platformFees: number;
  
  // User Metrics
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userRetention: number;
  userGrowth: number;
  
  // Product Metrics
  totalProducts: number;
  activeProducts: number;
  newProducts: number;
  averageProductPrice: number;
  productViews: number;
  productFavorites: number;
  
  // Order Metrics
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageDeliveryTime: number;
  orderGrowth: number;
  
  // Delivery Metrics
  totalDeliveries: number;
  activeDeliverers: number;
  averageDeliveryRating: number;
  deliverySuccessRate: number;
  
  // Engagement Metrics
  totalViews: number;
  totalFavorites: number;
  totalMessages: number;
  averageSessionTime: number;
  bounceRate: number;
  
  // Geographic Data
  topCities: Array<{ city: string; count: number; revenue: number }>;
  deliveryRegions: Array<{ region: string; deliveries: number; avgTime: number }>;
  
  // Time-based Data
  hourlyActivity: Array<{ hour: number; users: number; orders: number }>;
  dailyActivity: Array<{ date: string; users: number; orders: number; revenue: number }>;
  weeklyActivity: Array<{ week: string; users: number; orders: number; revenue: number }>;
  
  // Category Performance
  categoryStats: Array<{ 
    category: string; 
    products: number; 
    revenue: number; 
    avgPrice: number;
    growth: number;
  }>;
  
  // Top Performers
  topSellers: Array<{ 
    id: string; 
    name: string; 
    products: number; 
    revenue: number; 
    rating: number;
  }>;
  topDeliverers: Array<{ 
    id: string; 
    name: string; 
    deliveries: number; 
    rating: number; 
    earnings: number;
  }>;
  topProducts: Array<{ 
    id: string; 
    title: string; 
    views: number; 
    favorites: number;
    orders: number;
    revenue: number;
  }>;
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [activeView, setActiveView] = useState<'internal' | 'ga4' | 'unified'>('internal');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Analytics API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }
      
      const data = await response.json();

      // Ensure all required fields have defaults
      const safeData: AnalyticsData = {
        totalRevenue: data.totalRevenue || 0,
        monthlyRevenue: data.monthlyRevenue || 0,
        averageOrderValue: data.averageOrderValue || 0,
        revenueGrowth: data.revenueGrowth || 0,
        platformFees: data.platformFees || 0,
        totalUsers: data.totalUsers || 0,
        activeUsers: data.activeUsers || 0,
        newUsers: data.newUsers || 0,
        userRetention: data.userRetention || 0,
        userGrowth: data.userGrowth || 0,
        totalProducts: data.totalProducts || 0,
        activeProducts: data.activeProducts || 0,
        newProducts: data.newProducts || 0,
        averageProductPrice: data.averageProductPrice || 0,
        productViews: data.productViews || 0,
        productFavorites: data.productFavorites || 0,
        totalOrders: data.totalOrders || 0,
        completedOrders: data.completedOrders || 0,
        cancelledOrders: data.cancelledOrders || 0,
        averageDeliveryTime: data.averageDeliveryTime || 0,
        orderGrowth: data.orderGrowth || 0,
        totalDeliveries: data.totalDeliveries || 0,
        activeDeliverers: data.activeDeliverers || 0,
        averageDeliveryRating: data.averageDeliveryRating || 0,
        deliverySuccessRate: data.deliverySuccessRate || 0,
        totalViews: data.totalViews || 0,
        totalFavorites: data.totalFavorites || 0,
        totalMessages: data.totalMessages || 0,
        averageSessionTime: data.averageSessionTime || 0,
        bounceRate: data.bounceRate || 0,
        topCities: data.topCities || [],
        deliveryRegions: data.deliveryRegions || [],
        hourlyActivity: data.hourlyActivity || [],
        dailyActivity: data.dailyActivity || [],
        weeklyActivity: data.weeklyActivity || [],
        categoryStats: data.categoryStats || [],
        topSellers: data.topSellers || [],
        topDeliverers: data.topDeliverers || [],
        topProducts: data.topProducts || []
      };
      
      setAnalyticsData(safeData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data to prevent crashes
      setAnalyticsData({
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
        platformFees: 0,
        totalUsers: 0,
        activeUsers: 0,
        newUsers: 0,
        userRetention: 0,
        userGrowth: 0,
        totalProducts: 0,
        activeProducts: 0,
        newProducts: 0,
        averageProductPrice: 0,
        productViews: 0,
        productFavorites: 0,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageDeliveryTime: 0,
        orderGrowth: 0,
        totalDeliveries: 0,
        activeDeliverers: 0,
        averageDeliveryRating: 0,
        deliverySuccessRate: 0,
        totalViews: 0,
        totalFavorites: 0,
        totalMessages: 0,
        averageSessionTime: 0,
        bounceRate: 0,
        topCities: [],
        deliveryRegions: [],
        hourlyActivity: [],
        dailyActivity: [],
        weeklyActivity: [],
        categoryStats: [],
        topSellers: [],
        topDeliverers: [],
        topProducts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const locale = language === 'en' ? 'en-US' : 'nl-NL';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    const locale = language === 'en' ? 'en-US' : 'nl-NL';
    return new Intl.NumberFormat(locale).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('admin.analyticsDashboard.noDataAvailable')}</h3>
        <p className="text-gray-500 mb-4">{t('admin.analyticsDashboard.errorFetching')}</p>
        <button
          onClick={fetchAnalyticsData}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {t('admin.analyticsDashboard.retry')}
        </button>
      </div>
    );
  }

  const metricCards = [
    {
      title: t('admin.analyticsDashboard.totalRevenue'),
      value: formatCurrency(analyticsData.totalRevenue),
      change: formatPercentage(analyticsData.revenueGrowth),
      icon: DollarSign,
      color: 'green'
    },
    {
      title: t('admin.analyticsDashboard.activeUsers'),
      value: formatNumber(analyticsData.activeUsers),
      change: formatPercentage(analyticsData.userGrowth),
      icon: Users,
      color: 'blue'
    },
    {
      title: t('admin.analyticsDashboard.totalOrders'),
      value: formatNumber(analyticsData.totalOrders),
      change: formatPercentage(analyticsData.orderGrowth),
      icon: ShoppingCart,
      color: 'purple'
    },
    {
      title: t('admin.analyticsDashboard.averageOrderValue'),
      value: formatCurrency(analyticsData.averageOrderValue),
      change: null,
      icon: Target,
      color: 'orange'
    },
    {
      title: t('admin.analyticsDashboard.activeProducts'),
      value: formatNumber(analyticsData.activeProducts),
      change: null,
      icon: Package,
      color: 'indigo'
    },
    {
      title: t('admin.analyticsDashboard.deliverers'),
      value: formatNumber(analyticsData.activeDeliverers),
      change: null,
      icon: Truck,
      color: 'red'
    }
  ];

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.analyticsDashboard.title')}</h2>
          <div className="flex items-center gap-4">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveView('internal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'internal'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('admin.analyticsDashboard.platformAnalytics')}
              </button>
              <button
                onClick={() => setActiveView('ga4')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'ga4'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('admin.analyticsDashboard.googleAnalytics4')}
              </button>
            </div>
            <button
              onClick={() => router.push('/admin/variabelen')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title={t('admin.analyticsDashboard.variablesDashboardTitle')}
            >
              <Database className="w-4 h-4" />
              <span>{t('admin.analyticsDashboard.variablesDashboard')}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {activeView === 'ga4' ? (
        <GoogleAnalyticsAdvancedDashboard />
      ) : activeView === 'unified' ? (
        <UnifiedAnalyticsDashboard />
      ) : (
        <>
          {/* Time Range Selector */}
          <div className="flex justify-between items-center">
            <div></div>
            <div className="flex space-x-2">
              {['24h', '7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    timeRange === range
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            green: 'bg-green-100 text-green-600',
            blue: 'bg-blue-100 text-blue-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
            indigo: 'bg-indigo-100 text-indigo-600',
            red: 'bg-red-100 text-red-600'
          };
          
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {card.change && (
                    <p className={`text-sm mt-1 ${
                      card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.analyticsDashboard.revenueTrend')}</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveMetric('revenue')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  activeMetric === 'revenue'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t('admin.analyticsDashboard.revenue')}
              </button>
              <button
                onClick={() => setActiveMetric('orders')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  activeMetric === 'orders'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t('admin.analyticsDashboard.orders')}
              </button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{t('admin.analyticsDashboard.chartPlaceholder')}</p>
            </div>
          </div>
        </div>

        {/* User Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.analyticsDashboard.userActivity')}</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{t('admin.analyticsDashboard.activityChartPlaceholder')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Cities */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.analyticsDashboard.topCities')}</h3>
          <div className="space-y-3">
            {analyticsData.topCities && analyticsData.topCities.length > 0 ? analyticsData.topCities.slice(0, 5).map((city, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-600">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{city.city}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(city.revenue)}</p>
                  <p className="text-xs text-gray-500">{city.count} {t('admin.analyticsDashboard.ordersPlural')}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">{t('admin.analyticsDashboard.noDataYet')}</p>
            )}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.analyticsDashboard.categoryPerformance')}</h3>
          <div className="space-y-3">
            {analyticsData.categoryStats && analyticsData.categoryStats.length > 0 ? analyticsData.categoryStats.slice(0, 5).map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{category.category}</p>
                  <p className="text-sm text-gray-500">{category.products} {t('admin.analyticsDashboard.productsPlural')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(category.revenue)}</p>
                  <p className={`text-xs ${category.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(category.growth)}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">{t('admin.analyticsDashboard.noDataYet')}</p>
            )}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.analyticsDashboard.topSellers')}</h3>
          <div className="space-y-3">
            {analyticsData.topSellers && analyticsData.topSellers.length > 0 ? analyticsData.topSellers.slice(0, 5).map((seller, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{seller.name}</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">{seller.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(seller.revenue)}</p>
                  <p className="text-xs text-gray-500">{seller.products} {t('admin.analyticsDashboard.productsPlural')}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">{t('admin.analyticsDashboard.noDataYet')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('admin.analyticsDashboard.engagementMetrics')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalViews)}</p>
            <p className="text-sm text-gray-500">{t('admin.analyticsDashboard.totalViews')}</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalFavorites)}</p>
            <p className="text-sm text-gray-500">{t('admin.analyticsDashboard.favorites')}</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalMessages)}</p>
            <p className="text-sm text-gray-500">{t('admin.analyticsDashboard.messages')}</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.averageSessionTime}m</p>
            <p className="text-sm text-gray-500">{t('admin.analyticsDashboard.averageSessionTime')}</p>
          </div>
        </div>
      </div>

      {/* Top Products Detail */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('admin.analyticsDashboard.topProductsDetailed')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t('admin.analyticsDashboard.product')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t('admin.analyticsDashboard.views')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t('admin.analyticsDashboard.sold')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t('admin.analyticsDashboard.favorites')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t('admin.analyticsDashboard.conversion')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{t('admin.analyticsDashboard.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analyticsData.topProducts && analyticsData.topProducts.length > 0 ? (
                analyticsData.topProducts.map((product, index) => {
                  const conversionRate = product.views > 0 ? (product.orders / product.views) * 100 : 0;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{product.title}</p>
                        <p className="text-xs text-gray-500">ID: {product.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold text-gray-900">{formatNumber(product.views)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ShoppingCart className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-gray-900">{formatNumber(product.orders)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="font-semibold text-gray-900">{formatNumber(product.favorites)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          conversionRate > 10 ? 'bg-green-100 text-green-700' :
                          conversionRate > 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {t('admin.analyticsDashboard.noProductData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">LIVE</span>
          </div>
          <p className="text-3xl font-bold mb-1">{formatNumber(analyticsData.activeUsers)}</p>
          <p className="text-sm opacity-90">{t('admin.analyticsDashboard.activeUsersShort')}</p>
          <p className="text-xs opacity-70 mt-2">{t('admin.analyticsDashboard.lastPeriod', { timeRange })}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 opacity-80" />
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              (analyticsData.totalViews > 0 ? (analyticsData.totalOrders / analyticsData.totalViews) * 100 : 0) > 5
                ? 'bg-white/30'
                : 'bg-white/20'
            }`}>
              {(analyticsData.totalViews > 0 ? (analyticsData.totalOrders / analyticsData.totalViews) * 100 : 0).toFixed(1)}%
            </span>
          </div>
          <p className="text-3xl font-bold mb-1">{t('admin.analyticsDashboard.conversionRate')}</p>
          <p className="text-sm opacity-90">{t('admin.analyticsDashboard.viewsToSales')}</p>
          <p className="text-xs opacity-70 mt-2">
            {formatNumber(analyticsData.totalViews)} {t('admin.analyticsDashboard.viewsToOrders')} {formatNumber(analyticsData.totalOrders)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">TOP</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 
              ? formatNumber(analyticsData.topProducts[0].views) 
              : '0'}
          </p>
          <p className="text-sm opacity-90">{t('admin.analyticsDashboard.mostViewedProduct')}</p>
          <p className="text-xs opacity-70 mt-2 truncate">
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 
              ? analyticsData.topProducts[0].title 
              : t('admin.analyticsDashboard.noDataYet')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">BEST</span>
          </div>
          <p className="text-3xl font-bold mb-1">
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 
              ? formatNumber(analyticsData.topProducts.reduce((max, p) => p.orders > max ? p.orders : max, 0))
              : '0'}
          </p>
          <p className="text-sm opacity-90">{t('admin.analyticsDashboard.bestSeller')}</p>
          <p className="text-xs opacity-70 mt-2 truncate">
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 
              ? analyticsData.topProducts.sort((a, b) => b.orders - a.orders)[0].title
              : t('admin.analyticsDashboard.noDataYet')}
          </p>
        </div>
      </div>
        </>
      )}
    </div>
  );
}