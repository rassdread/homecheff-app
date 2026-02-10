'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Lock } from 'lucide-react';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductReviewSectionProps {
  productId: string;
}

interface ProductReview {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  reviewSubmittedAt?: string | null;
  buyer: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    image: string | null;
    displayFullName: boolean | null;
    displayNameOption: string | null;
  };
  images?: Array<{
    id: string;
    url: string;
    sortOrder: number;
  }>;
  responses?: Array<{
    id: string;
    comment: string;
    createdAt: string;
    seller: {
      id: string;
      name: string | null;
      username: string | null;
      profileImage: string | null;
    };
  }>;
}

export default function ProductReviewSection({ productId }: ProductReviewSectionProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);

  // Check if user has purchased this product
  useEffect(() => {
    const checkPurchase = async () => {
      if (!session?.user) {
        setCheckingPurchase(false);
        return;
      }

      try {
        const userResponse = await fetch('/api/user/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userId = userData.user?.id;

          if (userId) {
            // Check if user has purchased this product
            const ordersResponse = await fetch(`/api/orders?productId=${productId}`);
            if (ordersResponse.ok) {
              const ordersData = await ordersResponse.json();
              const hasBought = ordersData.items?.some((order: any) => 
                order.items?.some((item: any) => item.productId === productId)
              ) || false;
              setHasPurchased(hasBought);
            }
          }
        }
      } catch (error) {
        console.error('Error checking purchase:', error);
      } finally {
        setCheckingPurchase(false);
      }
    };

    checkPurchase();
  }, [productId, session]);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/dorpsplein/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        // Check if current user has reviewed
        if (session?.user) {
          const userResponse = await fetch('/api/user/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userReviewed = data.reviews.some((r: ProductReview) => r.buyer.id === userData.user?.id);
            setHasReviewed(userReviewed);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch review count
  const fetchReviewCount = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        const reviews = data.reviews || [];
        setReviewCount(reviews.length);
        if (reviews.length > 0) {
          const avg = reviews.reduce((sum: number, r: ProductReview) => sum + r.rating, 0) / reviews.length;
          setAverageRating(Math.round(avg * 10) / 10);
        }
      }
    } catch (error) {
      console.error('Error fetching review count:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchReviewCount();
  }, [productId, session]);

  const handleReviewSubmit = async (reviewData: {
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
  }) => {
    try {
      const response = await fetch(`/api/dorpsplein/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        const data = await response.json();
        setReviews([data.review, ...reviews]);
        setReviewCount(reviewCount + 1);
        setHasReviewed(true);
        setShowReviewForm(false);
        // Recalculate average rating
        await fetchReviewCount();
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden bij het plaatsen van je review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(t('errors.reviewErrorSimple'));
    }
  };

  // Transform reviews to match ReviewList format
  const transformedReviews = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    title: review.title ?? undefined,
    comment: review.comment ?? undefined,
    images: review.images || [],
    isVerified: review.isVerified,
    createdAt: review.createdAt,
    reviewSubmittedAt: review.reviewSubmittedAt ?? undefined,
    buyer: {
      id: review.buyer.id,
      name: review.buyer.name ?? undefined,
      username: review.buyer.username ?? undefined,
      profileImage: review.buyer.profileImage || review.buyer.image || undefined
    },
    responses: (review.responses || []).map(response => ({
      id: response.id,
      comment: response.comment,
      createdAt: response.createdAt,
      seller: {
        id: response.seller.id,
        name: response.seller.name ?? undefined,
        username: response.seller.username ?? undefined,
        profileImage: response.seller.profileImage ?? undefined
      }
    }))
  }));

  if (loading || checkingPurchase) {
    return (
      <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Beoordelingen
          </h3>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'beoordeling' : 'beoordelingen'})
              </span>
            </div>
          )}
        </div>
        {session?.user && !hasReviewed && hasPurchased && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Review plaatsen
          </button>
        )}
        {session?.user && !hasPurchased && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Koop eerst dit product</span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && hasPurchased && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <ReviewForm
            productId={productId}
            onSubmit={handleReviewSubmit}
            onCancel={() => setShowReviewForm(false)}
            isSubmitting={false}
          />
        </div>
      )}

      {/* Reviews List */}
      {reviewCount > 0 ? (
        <ReviewList
          reviews={transformedReviews}
          canReply={false}
          isSeller={false}
        />
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nog geen beoordelingen voor dit product.</p>
          {session?.user && !hasReviewed && hasPurchased && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mt-4 px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Wees de eerste om te beoordelen
            </button>
          )}
          {session?.user && !hasPurchased && (
            <p className="mt-4 text-sm text-gray-500">
              Je moet dit product eerst kopen voordat je een review kunt plaatsen.
            </p>
          )}
        </div>
      )}
    </div>
  );
}


