'use client';

import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, MapPin, MessageCircle } from 'lucide-react';

interface OrderTrackingProps {
  orderId: string;
}

interface OrderStatus {
  id: string;
  status: string;
  timestamp: string;
  description: string;
  icon: React.ReactNode;
}

export default function OrderTracking({ orderId }: OrderTrackingProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const orderData = await response.json();
          setOrder(orderData);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusInfo = (status: string): OrderStatus => {
    const statusMap: Record<string, OrderStatus> = {
      PENDING: {
        id: 'pending',
        status: 'In behandeling',
        timestamp: order?.createdAt || '',
        description: 'Je bestelling is ontvangen en wordt voorbereid',
        icon: <Clock className="w-5 h-5" />
      },
      CONFIRMED: {
        id: 'confirmed',
        status: 'Bevestigd',
        timestamp: order?.confirmedAt || '',
        description: 'Je bestelling is bevestigd door de verkoper',
        icon: <CheckCircle className="w-5 h-5" />
      },
      PROCESSING: {
        id: 'processing',
        status: 'Wordt voorbereid',
        timestamp: order?.processingAt || '',
        description: 'De verkoper bereidt je bestelling voor',
        icon: <Package className="w-5 h-5" />
      },
      SHIPPED: {
        id: 'shipped',
        status: 'Onderweg',
        timestamp: order?.shippedAt || '',
        description: 'Je bestelling is onderweg naar je',
        icon: <Truck className="w-5 h-5" />
      },
      DELIVERED: {
        id: 'delivered',
        status: 'Bezorgd',
        timestamp: order?.deliveredAt || '',
        description: 'Je bestelling is succesvol bezorgd',
        icon: <CheckCircle className="w-5 h-5" />
      },
      CANCELLED: {
        id: 'cancelled',
        status: 'Geannuleerd',
        timestamp: order?.cancelledAt || '',
        description: 'Je bestelling is geannuleerd',
        icon: <Clock className="w-5 h-5" />
      }
    };

    return statusMap[status] || statusMap.PENDING;
  };

  const getDeliveryInfo = () => {
    if (!order) return null;

    const deliveryMode = order.deliveryMode;
    
    if (deliveryMode === 'PICKUP') {
      return {
        title: 'Ophalen',
        description: 'Je haalt de producten op bij de verkoper',
        address: order.pickupAddress,
        date: order.pickupDate,
        icon: <Package className="w-5 h-5" />
      };
    } else {
      return {
        title: 'Bezorging',
        description: 'De producten worden bezorgd',
        address: order.deliveryAddress,
        date: order.deliveryDate,
        icon: <Truck className="w-5 h-5" />
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bestelling niet gevonden</h3>
        <p className="text-gray-600">De bestelling kon niet worden geladen.</p>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const deliveryInfo = getDeliveryInfo();

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-brand to-primary-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Bestelling #{order.orderNumber}</h2>
            <p className="text-primary-100 text-sm">Geplaatst op {new Date(order.createdAt).toLocaleDateString('nl-NL')}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold">€{(order.totalAmount / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Status Timeline */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Status</h3>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="relative flex items-start gap-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                order.status !== 'PENDING' ? 'bg-primary-brand border-primary-brand text-white' : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {statusInfo.icon}
              </div>
              <div className="flex-1 pb-8">
                <h4 className="font-semibold text-gray-900">{statusInfo.status}</h4>
                <p className="text-sm text-gray-600 mt-1">{statusInfo.description}</p>
                {statusInfo.timestamp && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(statusInfo.timestamp).toLocaleString('nl-NL')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        {deliveryInfo && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {deliveryInfo.icon}
              {deliveryInfo.title}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{deliveryInfo.description}</span>
                </div>
                
                {deliveryInfo.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-700">{deliveryInfo.address}</span>
                  </div>
                )}
                
                {deliveryInfo.date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {new Date(deliveryInfo.date).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestelde producten</h3>
          
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.product?.title}</h4>
                  <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    €{((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors">
            <MessageCircle className="w-4 h-4" />
            Contact verkoper
          </button>
          
          {order.status === 'DELIVERED' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <CheckCircle className="w-4 h-4" />
              Review schrijven
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


