'use client';

import { useState, useEffect } from 'react';
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
  Zap
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
    revenue: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeMetric, setActiveMetric] = useState('revenue');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nl-NL').format(num);
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
      <div className="text-center py-8">
        <p className="text-gray-500">Geen analytics data beschikbaar</p>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Totale Omzet',
      value: formatCurrency(analyticsData.totalRevenue),
      change: formatPercentage(analyticsData.revenueGrowth),
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Actieve Gebruikers',
      value: formatNumber(analyticsData.activeUsers),
      change: formatPercentage(analyticsData.userGrowth),
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Totale Bestellingen',
      value: formatNumber(analyticsData.totalOrders),
      change: formatPercentage(analyticsData.orderGrowth),
      icon: ShoppingCart,
      color: 'purple'
    },
    {
      title: 'Gem. Bestelwaarde',
      value: formatCurrency(analyticsData.averageOrderValue),
      change: null,
      icon: Target,
      color: 'orange'
    },
    {
      title: 'Actieve Producten',
      value: formatNumber(analyticsData.activeProducts),
      change: null,
      icon: Package,
      color: 'indigo'
    },
    {
      title: 'Bezorgers',
      value: formatNumber(analyticsData.activeDeliverers),
      change: null,
      icon: Truck,
      color: 'red'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
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
            <h3 className="text-lg font-semibold text-gray-900">Omzet Trend</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveMetric('revenue')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  activeMetric === 'revenue'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Omzet
              </button>
              <button
                onClick={() => setActiveMetric('orders')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  activeMetric === 'orders'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Bestellingen
              </button>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart component hier</p>
            </div>
          </div>
        </div>

        {/* User Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gebruikersactiviteit</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Activity chart hier</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Cities */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Steden</h3>
          <div className="space-y-3">
            {analyticsData.topCities.slice(0, 5).map((city, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-600">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{city.city}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(city.revenue)}</p>
                  <p className="text-xs text-gray-500">{city.count} bestellingen</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorie Prestaties</h3>
          <div className="space-y-3">
            {analyticsData.categoryStats.slice(0, 5).map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{category.category}</p>
                  <p className="text-sm text-gray-500">{category.products} producten</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(category.revenue)}</p>
                  <p className={`text-xs ${category.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(category.growth)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Verkopers</h3>
          <div className="space-y-3">
            {analyticsData.topSellers.slice(0, 5).map((seller, index) => (
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
                  <p className="text-xs text-gray-500">{seller.products} producten</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalViews)}</p>
            <p className="text-sm text-gray-500">Totaal Weergaven</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalFavorites)}</p>
            <p className="text-sm text-gray-500">Favorieten</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalMessages)}</p>
            <p className="text-sm text-gray-500">Berichten</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analyticsData.averageSessionTime}m</p>
            <p className="text-sm text-gray-500">Gem. Sessietijd</p>
          </div>
        </div>
      </div>
    </div>
  );
}