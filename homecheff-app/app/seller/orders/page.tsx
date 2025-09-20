'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Clock, MapPin, MessageCircle, Eye } from 'lucide-react';
import OrderUpdateForm from '@/components/orders/OrderUpdateForm';

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number;
  deliveryMode: string;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    priceCents: number;
    Product: {
      id: string;
      title: string;
      Image: Array<{
        fileUrl: string;
        sortOrder: number;
      }>;
    };
  }>;
}

export default function SellerOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadOrders();
    }
  }, [session]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/seller/orders');
      
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const { orders: fetchedOrders } = await response.json();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderUpdate = async (updateData: any) => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const { order } = await response.json();
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? order : o));
      setSelectedOrder(order);
      
      alert('Bestelling bijgewerkt en koper geïnformeerd!');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Fout bij bijwerken van bestelling');
    }
  };

  const formatPrice = (priceCents: number) => {
    return `€${(priceCents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Niet ingevuld';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-purple-100 text-purple-800';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'In behandeling';
      case 'CONFIRMED': return 'Bevestigd';
      case 'PROCESSING': return 'Wordt verwerkt';
      case 'SHIPPED': return 'Verzonden';
      case 'DELIVERED': return 'Bezorgd';
      case 'CANCELLED': return 'Geannuleerd';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Bestellingen laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mijn Bestellingen</h1>
          <p className="text-gray-600">Beheer je bestellingen en informeer kopers automatisch</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Bestellingen ({orders.length})</h2>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen bestellingen</h3>
                  <p className="text-gray-500">Je hebt nog geen bestellingen ontvangen.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-gray-400" />
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {order.orderNumber || `Bestelling ${order.id.slice(-6)}`}
                            </h3>
                            <p className="text-sm text-gray-500">
                              van {order.User.name || order.User.username}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span className="capitalize">{order.deliveryMode.toLowerCase()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Open chat conversation
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            title="Open chat"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mt-3 flex items-center space-x-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{item.quantity}x</span>
                            <span className="truncate max-w-32">{item.Product.title}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-sm text-gray-500">+{order.items.length - 3} meer</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Details & Update Form */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Order Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Bestelling Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Klant</label>
                      <p className="text-gray-900">{selectedOrder.User.name || selectedOrder.User.username}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Bestelling</label>
                      <p className="text-gray-900">{selectedOrder.orderNumber || `#${selectedOrder.id.slice(-6)}`}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Totaalbedrag</label>
                      <p className="text-gray-900 font-semibold">{formatPrice(selectedOrder.totalAmount)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Bezorgwijze</label>
                      <p className="text-gray-900 capitalize">{selectedOrder.deliveryMode.toLowerCase()}</p>
                    </div>
                    
                    {selectedOrder.pickupAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Afhaaladres</label>
                        <p className="text-gray-900 text-sm">{selectedOrder.pickupAddress}</p>
                      </div>
                    )}
                    
                    {selectedOrder.deliveryAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bezorgadres</label>
                        <p className="text-gray-900 text-sm">{selectedOrder.deliveryAddress}</p>
                      </div>
                    )}
                    
                    {selectedOrder.pickupDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Afhaaldatum</label>
                        <p className="text-gray-900 text-sm">{formatDate(selectedOrder.pickupDate)}</p>
                      </div>
                    )}
                    
                    {selectedOrder.deliveryDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bezorgdatum</label>
                        <p className="text-gray-900 text-sm">{formatDate(selectedOrder.deliveryDate)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Update Form */}
                <OrderUpdateForm
                  orderId={selectedOrder.id}
                  currentStatus={selectedOrder.status}
                  currentPickupAddress={selectedOrder.pickupAddress || undefined}
                  currentDeliveryAddress={selectedOrder.deliveryAddress || undefined}
                  currentPickupDate={selectedOrder.pickupDate || undefined}
                  currentDeliveryDate={selectedOrder.deliveryDate || undefined}
                  onUpdate={handleOrderUpdate}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een bestelling</h3>
                  <p className="text-gray-500">Klik op een bestelling om details te bekijken en updates te verzenden.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
