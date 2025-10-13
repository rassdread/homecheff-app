'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Clock, 
  Check, 
  X, 
  Eye, 
  Filter,
  Search,
  ChevronDown,
  MapPin,
  User,
  MessageCircle
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
      const response = await fetch('/api/seller/dashboard/orders?limit=100');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(query) ||
        order.productTitle.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'voltooid':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'wachtend':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'geannuleerd':
        return 'bg-red-100 text-red-800';
      case 'shipped':
      case 'verzonden':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bestellingen</h1>
              <p className="text-gray-600">Overzicht van al je bestellingen</p>
            </div>
            <Link href="/verkoper/dashboard">
              <Button variant="ghost">
                Terug naar dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op klantnaam, productnaam of ordernummer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-transparent"
              >
                <option value="all">Alle statussen</option>
                <option value="pending">Wachtend</option>
                <option value="processing">In behandeling</option>
                <option value="completed">Voltooid</option>
                <option value="cancelled">Geannuleerd</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-brand mx-auto"></div>
              <p className="text-gray-600 mt-4">Laden...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen bestellingen gevonden</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Probeer andere filters' 
                  : 'Je hebt nog geen bestellingen ontvangen'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">{order.productTitle}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        {order.deliveryAddress && (
                          <div className="flex items-center gap-2 text-gray-600 col-span-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Amount & Actions */}
                    <div className="flex flex-col items-end justify-between">
                      <div className="text-right mb-3">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(order.amount)}</p>
                        <p className="text-sm text-gray-600">{order.deliveryMode}</p>
                      </div>

                      <div className="flex gap-2">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

