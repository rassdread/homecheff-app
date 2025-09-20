'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Activity
} from 'lucide-react';
import { auth } from '@/lib/auth';

interface DashboardStats {
  totalRevenue: number;
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

export default function SellerDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

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
        alert('Er is een fout opgetreden bij het exporteren van de gegevens');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Er is een fout opgetreden bij het exporteren van de gegevens');
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Verkoper Dashboard</h1>
            <p className="text-gray-600 mt-1">Overzicht van je verkoopactiviteiten en prestaties</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Laatste 7 dagen</option>
              <option value="30d">Laatste 30 dagen</option>
              <option value="90d">Laatste 90 dagen</option>
              <option value="1y">Laatste jaar</option>
            </select>

            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporteren
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totale Omzet</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  <div className={`flex items-center text-sm ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.revenueChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(stats.revenueChange)}%
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totaal Bestellingen</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  <div className={`flex items-center text-sm ${stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.ordersChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(stats.ordersChange)}%
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Customers */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totaal Klanten</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                  <div className={`flex items-center text-sm ${stats.customersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.customersChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(stats.customersChange)}%
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gemiddelde Beoordeling</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                  <div className={`flex items-center text-sm ${stats.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.ratingChange >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {Math.abs(stats.ratingChange)}%
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recente Bestellingen</h3>
                <button
                  onClick={() => router.push('/verkoper/orders')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Alle bestellingen
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.productTitle}</p>
                        <p className="text-sm text-gray-600">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nog geen bestellingen</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Top Producten</h3>
                <button
                  onClick={() => router.push('/verkoper')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Alle producten
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
                            <span>{product.sales} verkocht</span>
                            <span>{product.views} weergaven</span>
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
                  <p className="text-gray-500">Nog geen verkoopdata</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Snelle Acties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/sell/new')}
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Nieuw Product</p>
                <p className="text-sm text-gray-600">Product toevoegen</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/verkoper/orders')}
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Bestellingen</p>
                <p className="text-sm text-gray-600">Beheer bestellingen</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/verkoper/analytics')}
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-600">Gedetailleerde rapporten</p>
              </div>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Exporteren</p>
                <p className="text-sm text-gray-600">Rapport downloaden</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gegevens Exporteren</h3>
            <p className="text-gray-600 mb-6">
              Kies het formaat voor je verkooprapport over de periode {selectedPeriod}.
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
                  <p className="font-medium text-gray-900">CSV Bestand</p>
                  <p className="text-sm text-gray-600">Voor Excel en andere spreadsheet programma's</p>
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
                  <p className="font-medium text-gray-900">PDF Rapport</p>
                  <p className="text-sm text-gray-600">Gedrukt rapport met grafieken</p>
                </div>
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
