'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  ShoppingBag,
  Search,
  Filter,
  Download,
  Eye,
  XCircle,
  RefreshCw,
  Calendar,
  User,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  MessageSquare,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  priceCents: number;
  Product: {
    id: string;
    title: string;
    seller: {
      User: {
        id: string;
        name: string | null;
        email: string;
        username: string | null;
      };
    };
    Image: Array<{ fileUrl: string }>;
  };
}

interface Transaction {
  id: string;
  amountCents: number;
  platformFeeBps: number;
  status: string;
  Payout: Array<{ amountCents: number; createdAt: string }>;
  Refund: Array<{ amountCents: number; createdAt: string }>;
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number;
  deliveryMode: string;
  deliveryAddress: string | null;
  pickupAddress: string | null;
  deliveryDate: Date | null;
  pickupDate: Date | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  stripeSessionId: string | null;
  User: {
    id: string;
    name: string | null;
    email: string;
    username: string | null;
  };
  items: OrderItem[];
  transactions: Transaction[];
  totalPayouts: number;
  totalRefunds: number;
  timeline?: Array<{
    type: string;
    date: string;
    user?: {
      id: string;
      name: string | null;
      email: string;
    };
    action?: string;
    notes?: string;
    message?: string;
    status?: string;
  }>;
  deliveryOrder?: {
    deliveryProfile: {
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    };
  } | null;
}

export default function OrderManagement() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    sellerId: '',
    buyerId: '',
    includeSubscriptions: false
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchOrders();
  }, [filters, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.sellerId && { sellerId: filters.sellerId }),
        ...(filters.buyerId && { buyerId: filters.buyerId }),
        ...(filters.includeSubscriptions && { includeSubscriptions: 'true' })
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    if (!confirm(t('admin.confirmCancelOrder'))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = ['Ordernummer', 'Status', 'Koper', 'Bedrag', 'Datum', 'Items'];
    const rows = orders.map(order => [
      order.orderNumber || order.id,
      order.status,
      order.User.name || order.User.email,
      formatCurrency(order.totalAmount),
      formatDate(order.createdAt),
      order.items.map(i => `${i.quantity}x ${i.Product.title}`).join('; ')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Beheer</h2>
          <p className="text-gray-600">{t('admin.orderManagementDescription')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Ververs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">{t('admin.allStatuses')}</option>
              <option value="PENDING">Wachtend</option>
              <option value="CONFIRMED">Bevestigd</option>
              <option value="PROCESSING">{t('order.statusProcessing')}</option>
              <option value="SHIPPED">{t('order.statusShipped')}</option>
              <option value="DELIVERED">{t('order.statusDelivered')}</option>
              <option value="CANCELLED">{t('common.cancelled')}</option>
              <option value="REFUNDED">{t('order.statusRefunded')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.search')}</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.searchOrderNumberNameEmail')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Van datum</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tot datum</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.includeSubscriptions}
              onChange={(e) => setFilters({ ...filters, includeSubscriptions: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Inclusief abonnementen</span>
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('common.totalOrders')}</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wachtend</p>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => o.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Behandeling</p>
              <p className="text-2xl font-bold text-purple-600">
                {orders.filter(o => o.status === 'PROCESSING' || o.status === 'SHIPPED').length}
              </p>
            </div>
            <Truck className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('common.cancelled')}</p>
              <p className="text-2xl font-bold text-red-600">
                {orders.filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Orders laden...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.noOrdersFound')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Koper</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bedrag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.orderNumber || order.id.substring(0, 8)}
                      </div>
                      {order.orderNumber?.startsWith('SUB-') && (
                        <span className="text-xs text-purple-600">Abonnement</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.User.name || order.User.username || 'Onbekend'}
                      </div>
                      <div className="text-xs text-gray-500">{order.User.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items[0]?.Product.title}
                        {order.items.length > 1 && ` +${order.items.length - 1} meer`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      {order.totalRefunds > 0 && (
                        <div className="text-xs text-red-600">
                          -{formatCurrency(order.totalRefunds)} refund
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Toon {page * limit + 1} - {Math.min((page + 1) * limit, total)} van {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Vorige
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Volgende
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onCancel={handleCancelOrder}
        />
      )}
    </div>
  );
}

// Order Detail Modal Component
function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
  onCancel
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: string) => void;
  onCancel: (orderId: string, reason: string) => void;
}) {
  const { t } = useTranslation();
  const [newStatus, setNewStatus] = useState(order.status);
  const [cancelReason, setCancelReason] = useState('');
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [order.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/admin/orders/${order.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrderDetails(data.order);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const displayOrder = orderDetails || order;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            Order Details: {order.orderNumber || order.id.substring(0, 8)}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loadingDetails ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : (
            <>
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t('common.totalAmount')}</label>
                  <p className="mt-1 text-lg font-bold">{formatCurrency(displayOrder.totalAmount)}</p>
                </div>
              </div>

              {/* Order Timeline */}
              {displayOrder.timeline && displayOrder.timeline.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Order Timeline</h4>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    <div className="space-y-4">
                      {displayOrder.timeline.map((event: any, index: number) => (
                        <div key={index} className="relative flex gap-4">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              event.type === 'order_created' ? 'bg-green-100' :
                              event.type === 'admin_action' ? 'bg-blue-100' :
                              event.type === 'status_update' ? 'bg-purple-100' :
                              'bg-gray-100'
                            }`}>
                              {event.type === 'order_created' ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : event.type === 'admin_action' ? (
                                <User className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {event.type === 'admin_action' ? 'Admin Actie' :
                                   event.type === 'status_update' ? 'Status Update' :
                                   event.type === 'order_created' ? 'Order Aangemaakt' :
                                   'Order Bijgewerkt'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(event.date)}
                                </span>
                              </div>
                              {event.user && (
                                <p className="text-xs text-gray-600 mb-1">
                                  {t('admin.by')}: {event.user.name || event.user.email}
                                </p>
                              )}
                              {event.action && (
                                <p className="text-sm text-gray-700 font-medium">{event.action}</p>
                              )}
                              {event.notes && (
                                <p className="text-sm text-gray-600 mt-1">{event.notes}</p>
                              )}
                              {event.message && (
                                <p className="text-sm text-gray-700 mt-1">{event.message}</p>
                              )}
                              {event.status && (
                                <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${getStatusColor(event.status)}`}>
                                  {event.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Koper</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-medium">Naam:</span> {displayOrder.User.name || displayOrder.User.username || 'Onbekend'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {displayOrder.User.email}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Items</h4>
                <div className="space-y-2">
                  {displayOrder.items.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                  {item.Product.Image[0] && (
                    <img
                      src={item.Product.Image[0].fileUrl}
                      alt={item.Product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.Product.title}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity}x {formatCurrency(item.priceCents)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Verkoper: {item.Product.seller.User.name || item.Product.seller.User.email}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.priceCents * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          {order.timeline && order.timeline.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Order Timeline</h4>
              <div className="space-y-3">
                {order.timeline.map((event: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                      {displayOrder.timeline && index < displayOrder.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 ml-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {event.type === 'admin_action' ? 'Admin Actie' :
                           event.type === 'status_update' ? 'Status Update' :
                           event.type === 'order_created' ? 'Order Aangemaakt' :
                           'Order Bijgewerkt'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(event.date)}
                        </span>
                      </div>
                      {event.user && (
                        <p className="text-xs text-gray-500 mb-1">
                          Door: {event.user.name || event.user.email}
                        </p>
                      )}
                      {event.action && (
                        <p className="text-sm text-gray-700">{event.action}</p>
                      )}
                      {event.notes && (
                        <p className="text-sm text-gray-600">{event.notes}</p>
                      )}
                      {event.message && (
                        <p className="text-sm text-gray-700">{event.message}</p>
                      )}
                      {event.status && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

                  {/* Transactions */}
                  {displayOrder.transactions && displayOrder.transactions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Transacties</h4>
                      <div className="space-y-2">
                        {displayOrder.transactions.map((tx) => (
                  <div key={tx.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(tx.amountCents)}</p>
                        <p className="text-xs text-gray-500">Status: {tx.status}</p>
                      </div>
                      <div className="text-right">
                        {tx.Payout.length > 0 && (
                          <p className="text-xs text-green-600">
                            Uitbetaald: {formatCurrency(tx.Payout.reduce((sum, p) => sum + p.amountCents, 0))}
                          </p>
                        )}
                        {tx.Refund.length > 0 && (
                          <p className="text-xs text-red-600">
                            Refund: {formatCurrency(tx.Refund.reduce((sum, r) => sum + r.amountCents, 0))}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    onStatusUpdate(displayOrder.id, newStatus);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Status Bijwerken
                </button>
                {displayOrder.status !== 'CANCELLED' && displayOrder.status !== 'REFUNDED' && (
                  <button
                    onClick={() => {
                      if (cancelReason) {
                        onCancel(displayOrder.id, cancelReason);
                      } else {
                        const reason = prompt('Reden voor annulering:');
                        if (reason) {
                          onCancel(displayOrder.id, reason);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Annuleren
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

