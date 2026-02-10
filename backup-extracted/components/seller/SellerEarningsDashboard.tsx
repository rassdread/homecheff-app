'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Calendar,
  Download,
  Eye,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface SellerEarningsStats {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalOrders: number;
  completedOrders: number;
  averageOrderValue: number;
}

interface Payout {
  id: string;
  amount: number;
  createdAt: Date;
  status: string;
  transactionId: string;
  buyer: string;
}

interface RecentOrder {
  id: string;
  orderNumber: string | null;
  productTitle: string;
  quantity: number;
  amount: number;
  status: string;
  createdAt: Date;
}

export default function SellerEarningsDashboard() {
  const [stats, setStats] = useState<SellerEarningsStats>({
    totalEarnings: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seller/earnings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data');
      }

      const data = await response.json();
      setStats(data.stats);
      setPayouts(data.payouts);
      setRecentOrders(data.recentOrders);
      setError(null);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Kon verdiensten niet laden');
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
      year: 'numeric'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verdiensten Overzicht</h2>
          <p className="text-gray-600">Bekijk je verkopen en uitbetalingen</p>
        </div>
        <button
          onClick={fetchEarningsData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Ververs
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totaal Verdiend</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalEarnings)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Na platformkosten (88%)
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deze Maand</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.monthEarnings)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats.completedOrders} voltooide bestellingen
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deze Week</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.weekEarnings)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gem. Bestelling</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.averageOrderValue)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payouts */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recente Uitbetalingen</h3>
            <span className="text-sm text-gray-500">{payouts.length} transacties</span>
          </div>
          
          {payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(payout.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        van {payout.buyer}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDate(payout.createdAt)}
                    </p>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                      Voltooid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nog geen uitbetalingen</p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recente Bestellingen</h3>
            <span className="text-sm text-gray-500">{recentOrders.length} orders</span>
          </div>
          
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {order.productTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.orderNumber || 'N/A'} • {order.quantity}x
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.amount)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                      order.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'CONFIRMED' ? 'Voltooid' : 'In behandeling'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nog geen bestellingen</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500 rounded-lg">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">💰 Over Uitbetalingen</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ Je ontvangt <strong>88%</strong> van elke verkoop (12% platformkosten)</li>
              <li>✓ Uitbetalingen worden automatisch verwerkt na succesvolle bestelling</li>
              <li>✓ Stripe Connect verwerkt de betalingen veilig</li>
              <li>✓ Je kunt je uitbetalingsgegevens beheren in je Stripe dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
