'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  Users,
  Truck,
  Calendar,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface FinancialOverview {
  totalOrders: number;
  totalRevenue: number;
  subscriptionRevenue?: number;
  subscriptionRevenueByType?: {
    basic: number;
    pro: number;
    premium: number;
    total: number;
  };
  totalPayouts: number;
  platformFees: number;
  platformFeesProduct?: number;
  platformFeesDelivery?: number;
  netPlatformRevenue: number;
  averageOrderValue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string | null;
  totalAmount: number;
  status: string;
  createdAt: Date;
  buyer: string;
  totalItems: number;
  uniqueProducts: number;
  items: Array<{
    title: string;
    seller: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface TopSeller {
  id: string;
  name: string;
  totalEarnings: number;
  totalPayouts: number;
}

interface TopDeliverer {
  id: string;
  name: string;
  totalEarnings: number;
  totalDeliveries: number;
  averageRating: number;
  maxDistance: number;
}

interface MonthlyStats {
  month: string;
  orders: number;
  revenue: number;
  subscriptionRevenue?: number;
  payouts: number;
  platformFee: number;
}

export default function AdminFinancialOverview() {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [topDeliverers, setTopDeliverers] = useState<TopDeliverer[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/financial');
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }

      const data = await response.json();
      setOverview(data.overview);
      setRecentOrders(data.recentOrders);
      setTopSellers(data.topSellers);
      setTopDeliverers(data.topDeliverers);
      setMonthlyStats(data.monthlyStats);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Kon financiële data niet laden');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return new Intl.DateTimeFormat('nl-NL', {
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error || 'Geen data beschikbaar'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financieel Overzicht</h2>
          <p className="text-gray-600">Platform inkomsten en statistieken</p>
        </div>
        <button
          onClick={fetchFinancialData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Ververs
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Product Omzet</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(overview.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {overview.totalOrders} product bestellingen
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Abonnement Inkomsten (KVK)</p>
              <p className={`text-2xl font-bold mt-1 ${
                (overview.subscriptionRevenue || 0) > 0 ? 'text-purple-600' : 'text-gray-400'
              }`}>
                {formatCurrency(overview.subscriptionRevenue || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              (overview.subscriptionRevenue || 0) > 0 ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <TrendingUp className={`w-6 h-6 ${
                (overview.subscriptionRevenue || 0) > 0 ? 'text-purple-600' : 'text-gray-400'
              }`} />
            </div>
          </div>
          
          {overview.subscriptionRevenueByType && (overview.subscriptionRevenue || 0) > 0 ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">🥉 Basic (€39/m):</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(overview.subscriptionRevenueByType.basic)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🥈 Pro (€99/m):</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(overview.subscriptionRevenueByType.pro)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🥇 Premium (€199/m):</span>
                <span className="font-medium text-purple-600">
                  {formatCurrency(overview.subscriptionRevenueByType.premium)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Alleen KVK bedrijven betalen abonnementen
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">HomeCheff Platform Fees</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(overview.platformFees)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          {overview.platformFeesProduct !== undefined && overview.platformFeesDelivery !== undefined ? (
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p>Product fees: {formatCurrency(overview.platformFeesProduct)}</p>
              <p>Delivery fees: {formatCurrency(overview.platformFeesDelivery)}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">
              Van producten & bezorgingen
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uitbetalingen</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(overview.totalPayouts)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Aan verkopers & bezorgers
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl shadow-sm border border-emerald-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Netto Platform Inkomsten</h3>
            <ArrowUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(overview.netPlatformRevenue)}
          </p>
          <div className="text-sm text-gray-600 mt-2 space-y-1">
            <p>Platform fees: {formatCurrency(overview.platformFees)}</p>
            {overview.subscriptionRevenue !== undefined && (
              <p>Abonnementen: {formatCurrency(overview.subscriptionRevenue)}</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Gem. Bestelwaarde</h3>
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(overview.averageOrderValue)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Per bestelling
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Top 5 Verkopers
          </h3>
          
          {topSellers.length > 0 ? (
            <div className="space-y-3">
              {topSellers.map((seller, index) => (
                <div key={seller.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{seller.name}</p>
                      <p className="text-xs text-gray-500">{seller.totalPayouts} uitbetalingen</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(seller.totalEarnings)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Geen verkopers</p>
          )}
        </div>

        {/* Top Deliverers */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Top 5 Bezorgers
          </h3>
          
          {topDeliverers.length > 0 ? (
            <div className="space-y-3">
              {topDeliverers.map((deliverer, index) => (
                <div key={deliverer.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{deliverer.name}</p>
                      <p className="text-xs text-gray-500">
                        {deliverer.totalDeliveries} bezorgingen • ⭐ {deliverer.averageRating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(deliverer.totalEarnings)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Geen bezorgers</p>
          )}
        </div>
      </div>

      {/* Monthly Stats Chart */}
      {monthlyStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Maandelijkse Statistieken
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Maand</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Orders</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Product Omzet</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Abonnementen</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Uitbetalingen</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Platform Fee</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((month) => (
                  <tr key={month.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{formatMonth(month.month)}</td>
                    <td className="text-right py-3 px-4">{month.orders}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(month.revenue)}</td>
                    <td className="text-right py-3 px-4 text-purple-600">
                      {formatCurrency(month.subscriptionRevenue || 0)}
                    </td>
                    <td className="text-right py-3 px-4 text-purple-600">{formatCurrency(month.payouts)}</td>
                    <td className="text-right py-3 px-4 font-semibold text-emerald-600">
                      {formatCurrency(month.platformFee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-orange-600" />
          Recente Bestellingen
        </h3>
        
        {recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.orderNumber || order.id.substring(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">van {order.buyer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-gray-600 font-medium text-center">
                    📦 {order.uniqueProducts} product{order.uniqueProducts !== 1 ? 'en' : ''} • 
                    🔢 {order.totalItems} item{order.totalItems !== 1 ? 's' : ''} totaal
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                              {item.quantity}
                            </span>
                            <span className="font-medium text-gray-800">{item.title}</span>
                          </div>
                          <div className="text-gray-500 ml-8 text-xs">
                            van {item.seller} • {formatCurrency(item.price)} per stuk
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-gray-800">
                            {formatCurrency(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.items.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center font-semibold text-gray-800">
                      <span>Totaal bestelling:</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">{formatDate(order.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Geen recente bestellingen</p>
        )}
      </div>
    </div>
  );
}
