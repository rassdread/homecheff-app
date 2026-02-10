'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  MapPin,
  User,
  MessageCircle,
  Truck,
  ArrowLeft,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Verkooporders: Loading seller orders...');
      const response = await fetch('/api/seller/dashboard/orders?limit=100&period=1y', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Verkooporders: Orders loaded:', data.orders?.length || 0, 'orders');
        if (data.orders && data.orders.length > 0) {
          console.log('📦 Sample order:', {
            id: data.orders[0].id,
            orderNumber: data.orders[0].orderNumber,
            status: data.orders[0].status,
            amount: data.orders[0].amount,
            customerName: data.orders[0].customerName
          });
        } else {
          console.warn('⚠️ Verkooporders: No orders found. Check if orders exist with stripeSessionId in database.');
        }
        setOrders(data.orders || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Verkooporders: Error loading orders:', response.status, errorData);
        if (errorData.error === 'Seller profile not found') {
          console.error('❌ User is not a seller. Check seller profile creation.');
        }
      }
    } catch (error) {
      console.error('❌ Verkooporders: Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders]; // Create copy to avoid mutating original

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

    // Sort filtered orders consistently
    filtered.sort((a, b) => {
      // First by creation date (newest first)
      const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Then by order number (newest first)
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
    if (statusLower === 'confirmed' || statusLower === 'bevestigd') return 'Bevestigd';
    if (statusLower === 'processing' || statusLower === 'in behandeling') return 'In behandeling';
    if (statusLower === 'shipped' || statusLower === 'verzonden') return 'Verzonden';
    if (statusLower === 'delivered' || statusLower === 'voltooid') return 'Voltooid';
    if (statusLower === 'cancelled' || statusLower === 'geannuleerd') return 'Geannuleerd';
    return 'Wachtend';
  };

  const getStatusColor = (status: string) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
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
      console.log(`🔄 Updating order ${orderId} to status ${newStatus}...`);
      
      const response = await fetch(`/api/orders/${orderId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Order ${orderId} updated to ${newStatus}:`, data);
        
        // Update the order in the local state immediately for better UX
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        // Also reload orders to get any server-side changes
        await loadOrders();
        
        // Show success message with better UX
        const statusText = getStatusText(newStatus);
        console.log(`✅ Order ${orderId} successfully updated to ${statusText}`);
        
        // Show a non-blocking success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
        successDiv.innerHTML = `
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <span>Bestelling bijgewerkt naar: ${statusText}</span>
          </div>
        `;
        document.body.appendChild(successDiv);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
          successDiv.style.opacity = '0';
          setTimeout(() => {
            document.body.removeChild(successDiv);
          }, 300);
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error updating order:', response.status, response.statusText, errorData);
        
        let errorMessage = 'Fout bij bijwerken van bestelling';
        if (response.status === 401) {
          errorMessage = 'Je bent niet ingelogd. Log opnieuw in.';
        } else if (response.status === 403) {
          errorMessage = 'Je hebt geen toegang tot deze bestelling.';
        } else if (response.status === 404) {
          errorMessage = 'Bestelling niet gevonden.';
        } else if (errorData.error) {
          errorMessage = `Fout: ${errorData.error}`;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('❌ Network error updating order:', error);
      alert('Netwerkfout bij bijwerken van bestelling. Controleer je internetverbinding.');
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Verkooporders</h1>
              <p className="text-neutral-600 mt-2 text-sm sm:text-base">
                Overzicht van inkomende bestellingen van klanten
              </p>
            </div>
            <Link href="/verkoper/dashboard">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Terug naar dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Zoek op klantnaam, productnaam of ordernummer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'Bevestigd', 'In behandeling', 'Verzonden', 'Voltooid', 'Geannuleerd'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status === 'all' ? 'all' : status.toLowerCase())}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    statusFilter === (status === 'all' ? 'all' : status.toLowerCase())
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  {status === 'all' ? 'Alle' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
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
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-neutral-200">
            <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {searchQuery || statusFilter !== 'all' 
                ? 'Geen verkooporders gevonden' 
                : 'Nog geen verkooporders'}
            </h3>
            <p className="text-neutral-600 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Probeer andere filters of zoektermen'
                : 'Je hebt nog geen inkomende bestellingen ontvangen'}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                variant="outline"
              >
                Filters wissen
              </Button>
            ) : (
              <Link href="/verkoper/dashboard">
                <Button variant="default">
                  Terug naar dashboard
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        🛍️ {order.orderNumber || `HC-${order.id.slice(-6).toUpperCase()}`}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-lg font-semibold text-neutral-900">
                      {formatCurrency(order.amount)}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <User className="w-4 h-4" />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Package className="w-4 h-4" />
                    <span>{order.productTitle}</span>
                  </div>
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-sm text-neutral-600 col-span-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{order.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Truck className="w-4 h-4" />
                    <span className="capitalize">{order.deliveryMode.toLowerCase()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200">
                  {/* Status Update Buttons */}
                  {(order.status === 'Bevestigd' || order.status === 'CONFIRMED') && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'PROCESSING')}
                      className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Product Klaarzetten
                    </Button>
                  )}
                  {(order.status === 'In behandeling' || order.status === 'PROCESSING') && order.deliveryMode === 'PICKUP' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Klaar voor Ophalen
                    </Button>
                  )}
                  {(order.status === 'In behandeling' || order.status === 'PROCESSING') && order.deliveryMode === 'DELIVERY' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                      className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Klaar voor Bezorging
                    </Button>
                  )}
                  {(order.status === 'Verzonden' || order.status === 'SHIPPED') && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Markeer als Bezorgd
                    </Button>
                  )}
                  
                  {/* View & Chat */}
                  <div className="flex gap-2 ml-auto">
                    {order.conversationId && (
                      <Link href={`/messages/${order.conversationId}`}>
                        <Button variant="ghost" className="px-3 py-2">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      className="px-3 py-2"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
