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
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

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
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);

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
        setAvailableOrders(data.availableOrders || []);
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
        alert(`Fout: ${error.error || 'Kon opdracht niet accepteren'}`);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Er is een fout opgetreden bij het accepteren van de opdracht');
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
                <p className="text-sm font-medium text-gray-600">Beschikbaar</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Nieuwe bestellingen</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Bell className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Beoordeling</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalDeliveries} bezorgingen</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Orders Section */}
          {!currentOrder && availableOrders.length > 0 && isOnline && (
            <div className="lg:col-span-3 mb-6">
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl shadow-sm border-2 border-orange-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500 rounded-full">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Beschikbare Bezorgopdrachten</h3>
                      <p className="text-sm text-gray-600">Binnen jouw werkgebied ({stats.deliveryRadius}km)</p>
                    </div>
                  </div>
                  <button
                    onClick={fetchDeliveryData}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Ververs
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-orange-300 transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {order.product.image ? (
                            <img
                              src={order.product.image}
                              alt={order.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Truck className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1">{order.product.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">van {order.product.seller.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
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

                      <div className="flex items-center justify-between mb-4 pb-4 border-b">
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">Bezorgkosten</p>
                          <p className="text-xs text-gray-500">Jij krijgt 88%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatCurrency(order.deliveryFee)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ≈ {formatCurrency(order.deliveryFee * 0.88)} voor jou
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => acceptOrder(order.id)}
                        disabled={acceptingOrder === order.id}
                        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {acceptingOrder === order.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Accepteren...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Accepteer Opdracht
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
                      <p className="text-sm text-gray-500">{currentOrder.distance.toFixed(1)}km</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Pickup Details */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900 mb-1">📦 Ophaaladres (Verkoper)</p>
                          <p className="text-sm text-blue-800">{currentOrder.product.seller.name}</p>
                          <p className="text-sm text-blue-700 mt-1">{currentOrder.product.seller.address}</p>
                          {(currentOrder.product.seller as any).phone && (
                            <p className="text-sm text-blue-700 mt-1">
                              📞 {(currentOrder.product.seller as any).phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <Navigation className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-900 mb-1">🏠 Bezorgadres (Klant)</p>
                          <p className="text-sm text-green-800">{currentOrder.customerName}</p>
                          <p className="text-sm text-green-700 mt-1">{currentOrder.customerAddress}</p>
                          {currentOrder.customerPhone && (
                            <p className="text-sm text-green-700 mt-1">
                              📞 {currentOrder.customerPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentOrder.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="font-medium text-yellow-900 text-sm mb-1">💬 Opmerkingen</p>
                      <p className="text-yellow-800 text-sm">{currentOrder.notes}</p>
                    </div>
                  )}

                  <div className="space-y-3 pt-4 border-t">
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {currentOrder.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => acceptOrder(currentOrder.id)}
                            className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2 shadow-lg"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Accepteer Bestelling
                          </button>
                          <button
                            onClick={() => cancelOrder(currentOrder.id)}
                            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                          >
                            Weigeren
                          </button>
                        </>
                      )}
                      {currentOrder.status === 'ACCEPTED' && (
                        <button
                          onClick={() => pickupOrder(currentOrder.id)}
                          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Product Opgehaald
                        </button>
                      )}
                      {currentOrder.status === 'PICKED_UP' && (
                        <button
                          onClick={() => deliverOrder(currentOrder.id)}
                          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Product Bezorgd
                        </button>
                      )}
                    </div>

                    {/* Communication Button - Show after acceptance */}
                    {(currentOrder.status === 'ACCEPTED' || currentOrder.status === 'PICKED_UP') && currentOrder.conversationId && (
                      <Link
                        href={`/messages?conversation=${currentOrder.conversationId}`}
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Stuur bericht naar klant
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                {!isOnline ? (
                  <>
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Pause className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Je bent offline</h3>
                    <p className="text-gray-600 mb-6">
                      Ga online om bestellingen te ontvangen in jouw werkgebied ({stats.deliveryRadius}km)
                    </p>
                    <button
                      onClick={toggleOnlineStatus}
                      className="bg-emerald-600 text-white py-3 px-8 rounded-lg hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2 mx-auto shadow-lg"
                    >
                      <Play className="w-5 h-5" />
                      Ga Online
                    </button>
                  </>
                ) : availableOrders.length > 0 ? (
                  <>
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-10 h-10 text-orange-600 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {availableOrders.length} opdracht{availableOrders.length !== 1 ? 'en' : ''} beschikbaar!
                    </h3>
                    <p className="text-gray-600">
                      Scroll naar boven om beschikbare opdrachten te zien en te accepteren
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Je bent online!</h3>
                    <p className="text-gray-600 mb-4">
                      Wacht op nieuwe bestellingen binnen {stats.deliveryRadius}km van je locatie
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                      <p className="font-medium mb-2">🔍 We zoeken opdrachten waarbij:</p>
                      <ul className="text-left space-y-1 text-xs">
                        <li>✓ Je binnen {stats.deliveryRadius}km bent van de verkoper</li>
                        <li>✓ Je binnen {stats.deliveryRadius}km bent van de koper</li>
                        <li>✓ Je beschikbaar bent in het gevraagde tijdslot</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Work Area Info */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl shadow-sm border border-emerald-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Jouw Werkgebied
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Bezorgradius</span>
                  <span className="font-bold text-emerald-600">{stats.deliveryRadius} km</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>GPS Validatie:</strong>
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Binnen {stats.deliveryRadius}km van verkoper</li>
                    <li>✓ Binnen {stats.deliveryRadius}km van koper</li>
                    <li>✓ Beschikbaar in jouw tijdslot</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vandaag</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Online Tijd</span>
                  <span className="font-medium">{formatTime(stats.onlineTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voltooid</span>
                  <span className="font-medium text-green-600">{stats.completedDeliveries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In behandeling</span>
                  <span className="font-medium text-blue-600">{stats.pendingDeliveries}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Totaal Verdiend</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(stats.totalEarnings)}</span>
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
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Bezorger Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>🔋 Houd je telefoon opgeladen</li>
                <li>📍 Locatie altijd aan voor GPS matching</li>
                <li>🚴 Check je vervoersmiddel voor vertrek</li>
                <li>😊 Wees vriendelijk en professioneel</li>
                <li>⏰ Houd rekening met het 3-uur tijdvenster</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}