'use client';

import { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

interface DeliveryStats {
  todayEarnings: number;
  weekEarnings: number;
  totalDeliveries: number;
  averageRating: number;
  onlineTime: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  totalEarnings: number;
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
    totalEarnings: 0
  });
  const [recentOrders, setRecentOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    try {
      setLoading(true);
      // Fetch delivery data from API
      const response = await fetch('/api/delivery/dashboard');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setCurrentOrder(data.currentOrder);
      }
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      setLoading(false);
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
        setIsOnline(!isOnline);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
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
    await updateOrderStatus(orderId, 'ACCEPTED');
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
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}u ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bezorger Dashboard</h1>
              <p className="text-gray-600">Beheer je bezorgingen en verdiensten</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/delivery/settings"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Instellingen
              </a>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                  isOnline 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isOnline ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Ga Offline
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Ga Online
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vandaag</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayEarnings)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deze Week</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.weekEarnings)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bezorgingen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beoordeling</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Order */}
          <div className="lg:col-span-2">
            {currentOrder ? (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Huidige Bestelling</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentOrder.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    currentOrder.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                    currentOrder.status === 'PICKED_UP' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {currentOrder.status === 'PENDING' ? 'Wachtend' :
                     currentOrder.status === 'ACCEPTED' ? 'Geaccepteerd' :
                     currentOrder.status === 'PICKED_UP' ? 'Opggehaald' : 'Bezorgd'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {currentOrder.product.image && (
                        <img
                          src={currentOrder.product.image}
                          alt={currentOrder.product.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{currentOrder.product.title}</h4>
                      <p className="text-sm text-gray-600">van {currentOrder.product.seller.name}</p>
                      <p className="text-sm text-gray-500">{currentOrder.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatCurrency(currentOrder.deliveryFee)}
                      </p>
                      <p className="text-sm text-gray-500">{currentOrder.distance}km</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Ophaaladres</p>
                      <p className="text-gray-600">{currentOrder.product.seller.address}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Bezorgadres</p>
                      <p className="text-gray-600">{currentOrder.customerAddress}</p>
                    </div>
                  </div>

                  {currentOrder.notes && (
                    <div>
                      <p className="font-medium text-gray-700 text-sm">Opmerkingen</p>
                      <p className="text-gray-600 text-sm">{currentOrder.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {currentOrder.status === 'PENDING' && (
                      <button
                        onClick={() => acceptOrder(currentOrder.id)}
                        className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 font-medium"
                      >
                        Accepteer Bestelling
                      </button>
                    )}
                    {currentOrder.status === 'ACCEPTED' && (
                      <button
                        onClick={() => setCurrentOrder(prev => prev ? { ...prev, status: 'PICKED_UP' } : null)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Markeer als Opgehaald
                      </button>
                    )}
                    {currentOrder.status === 'PICKED_UP' && (
                      <button
                        onClick={() => completeOrder(currentOrder.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
                      >
                        Markeer als Bezorgd
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen actieve bestelling</h3>
                <p className="text-gray-600 mb-4">
                  {isOnline 
                    ? 'Wacht op nieuwe bestellingen in jouw gebied' 
                    : 'Ga online om bestellingen te ontvangen'
                  }
                </p>
                {!isOnline && (
                  <button
                    onClick={toggleOnlineStatus}
                    className="bg-emerald-600 text-white py-2 px-6 rounded-lg hover:bg-emerald-700 font-medium"
                  >
                    Ga Online
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Snelle Statistieken</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Online Tijd</span>
                  <span className="font-medium">{formatTime(stats.onlineTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voltooid Vandaag</span>
                  <span className="font-medium">{stats.completedDeliveries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wachtend</span>
                  <span className="font-medium">{stats.pendingDeliveries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Totaal Verdiensten</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(stats.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Bestellingen</h3>
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.product.title}</p>
                      <p className="text-xs text-gray-500">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">{formatCurrency(order.deliveryFee)}</p>
                      <p className="text-xs text-gray-500">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Houd je telefoon opgeladen</li>
                <li>• Controleer je route voor vertrek</li>
                <li>• Wees vriendelijk tegen klanten</li>
                <li>• Update je locatie regelmatig</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}