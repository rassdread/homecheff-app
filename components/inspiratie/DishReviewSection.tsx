'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';

interface DishReviewSectionProps {
  dishId: string;
}

interface DishReview {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  reviewer: {
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
}

export default function DishReviewSection({ dishId }: DishReviewSectionProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/inspiratie/${dishId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        // Check if current user has reviewed
        if (session?.user) {
          const userEmail = (session.user as any).email;
          const userResponse = await fetch('/api/user/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userReviewed = data.reviews.some((r: DishReview) => r.reviewer.id === userData.user?.id);
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
      const response = await fetch(`/api/inspiratie/${dishId}/reviews/count`);
      if (response.ok) {
        const data = await response.json();
        setReviewCount(data.count || 0);
        setAverageRating(data.averageRating || 0);
      }
    } catch (error) {
      console.error('Error fetching review count:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchReviewCount();
  }, [dishId, session]);

  const handleReviewSubmit = async (reviewData: {
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
  }) => {
    try {
      // Log review data for debugging
      console.log('📤 Submitting review with:', {
        rating: reviewData.rating,
        title: reviewData.title,
        commentLength: reviewData.comment.length
      });
      
      const response = await fetch(`/api/inspiratie/${dishId}/reviews`, {
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
        console.error('❌ Review submission error:', error);
        console.error('❌ Response status:', response.status);
        console.error('❌ Review data sent:', reviewData);
        alert(error.error || error.details || 'Er is een fout opgetreden bij het plaatsen van je review');
      }
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      console.error('❌ Review data:', reviewData);
      alert(t('errors.reviewError'));
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
    buyer: {
      id: review.reviewer.id,
      name: review.reviewer.name ?? undefined,
      username: review.reviewer.username ?? undefined,
      profileImage: review.reviewer.profileImage || review.reviewer.image || undefined
    },
    responses: []
  }));

  if (loading) {
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
        {session?.user && !hasReviewed && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Review plaatsen
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <ReviewForm
            productId={dishId}
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
          <p className="text-gray-500">Nog geen beoordelingen voor dit inspiratie item.</p>
          {session?.user && !hasReviewed && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mt-4 px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Wees de eerste om te beoordelen
            </button>
          )}
        </div>
      )}
    </div>
  );
}


