'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Star, ArrowLeft, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import ReviewForm from '@/components/reviews/ReviewForm';
import { OrderNumberGenerator } from '@/lib/orderNumberGenerator';

interface OrderItem {
  id: string;
  quantity: number;
  priceCents: number;
  Product: {
    id: string;
    title: string;
    image?: string;
    seller: {
      User: {
        name?: string;
        username?: string;
      };
    };
  };
  hasReview?: boolean;
}

interface Order {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const orderId = params?.orderId as string;

  if (!orderId) {
    return <div>Order niet gevonden</div>;
  }

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    fetchOrder();
  }, [orderId, session]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Check which products already have reviews
        const itemsWithReviewStatus = await Promise.all(
          data.order.items.map(async (item: OrderItem) => {
            const reviewResponse = await fetch(`/api/products/${item.Product.id}/reviews`);
            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();
              const hasReview = reviewData.reviews.some((review: any) => 
                review.buyerId === (session?.user as any)?.id && review.orderId === orderId
              );
              return { ...item, hasReview };
            }
            return { ...item, hasReview: false };
          })
        );

        setOrder({ ...data.order, items: itemsWithReviewStatus });
      } else {
        console.error('Failed to fetch order');
        router.push('/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData: any) => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/products/${selectedProduct.Product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          orderId: orderId
        }),
      });

      if (response.ok) {
        alert('✅ Beoordeling succesvol geplaatst!');
        setSelectedProduct(null);
        await fetchOrder(); // Refresh to update review status
      } else {
        const error = await response.json();
        alert(`❌ Fout: ${error.error || 'Er is een fout opgetreden'}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('❌ Er is een fout opgetreden bij het plaatsen van je beoordeling');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bestelling niet gevonden</h1>
          <Button onClick={() => router.push('/orders')}>
            Terug naar bestellingen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Beoordeling schrijven</h1>
                <p className="text-sm sm:text-base text-gray-600 truncate">
                  Bestelling {OrderNumberGenerator.getDisplayNumber(order.orderNumber, order.id)}
                </p>
              </div>
            </div>
            
            {order.status === 'DELIVERED' && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Bestelling voltooid</span>
              </div>
            )}
          </div>
        </div>

        {/* Review Form or Product Selection */}
        {selectedProduct ? (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {selectedProduct.Product.image && (
                  <img
                    src={selectedProduct.Product.image}
                    alt={selectedProduct.Product.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{selectedProduct.Product.title}</h3>
                <p className="text-sm text-gray-600 truncate">
                  Van {selectedProduct.Product.seller.User.name || selectedProduct.Product.seller.User.username}
                </p>
                <p className="text-sm text-gray-500">Aantal: {selectedProduct.quantity}</p>
              </div>
            </div>

            <ReviewForm
              productId={selectedProduct.Product.id}
              onSubmit={handleReviewSubmit}
              onCancel={() => setSelectedProduct(null)}
              isSubmitting={submitting}
            />
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 px-1">
              Selecteer een product om te beoordelen
            </h2>
            
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {item.Product.image && (
                      <img
                        src={item.Product.image}
                        alt={item.Product.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.Product.title}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      Van {item.Product.seller.User.name || item.Product.seller.User.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      Aantal: {item.quantity} • €{(item.priceCents * item.quantity / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {item.hasReview ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium hidden sm:inline">Beoordeeld</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setSelectedProduct(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm px-3 sm:px-4 py-2"
                      >
                        <span className="hidden sm:inline">Beoordeling schrijven</span>
                        <span className="sm:hidden">Review</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
