'use client';

import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import { useHcpRewardUi } from '@/components/gamification/HcpRewardProvider';

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
  const hcpRewardUi = useHcpRewardUi();
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<DishReview[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/inspiratie/${dishId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        if (session?.user) {
          const userResponse = await fetch('/api/user/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const userReviewed = data.reviews.some(
              (r: DishReview) => r.reviewer.id === userData.user?.id,
            );
            setHasSubmitted(userReviewed);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching community feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackCount = async () => {
    try {
      const response = await fetch(`/api/inspiratie/${dishId}/reviews/count`);
      if (response.ok) {
        const data = await response.json();
        setFeedbackCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching feedback count:', error);
    }
  };

  useEffect(() => {
    void fetchReviews();
    void fetchFeedbackCount();
  }, [dishId, session]);

  const handleFeedbackSubmit = async (reviewData: {
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
  }) => {
    try {
      const response = await fetch(`/api/inspiratie/${dishId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        const data = await response.json();
        setReviews([data.review, ...reviews]);
        setFeedbackCount(feedbackCount + 1);
        setHasSubmitted(true);
        setShowFeedbackForm(false);
        await fetchFeedbackCount();
        await hcpRewardUi?.refetchGamification();
      } else {
        const error = await response.json();
        alert(error.error || error.details || t('communityFeedback.submitError'));
      }
    } catch (error) {
      console.error('Error submitting community feedback:', error);
      alert(t('communityFeedback.submitError'));
    }
  };

  const transformedReviews = reviews.map((review) => ({
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
      profileImage: review.reviewer.profileImage || review.reviewer.image || undefined,
    },
    responses: [],
  }));

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t('communityFeedback.heading')}
          </h3>
          {feedbackCount > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {t('communityFeedback.count', { count: feedbackCount })}
            </p>
          )}
        </div>
        {session?.user && !hasSubmitted && (
          <button
            onClick={() => setShowFeedbackForm(true)}
            className="px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {t('communityFeedback.addCta')}
          </button>
        )}
      </div>

      {showFeedbackForm && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <ReviewForm
            productId={dishId}
            onSubmit={handleFeedbackSubmit}
            onCancel={() => setShowFeedbackForm(false)}
            isSubmitting={false}
          />
        </div>
      )}

      {feedbackCount > 0 ? (
        <ReviewList reviews={transformedReviews} canReply={false} isSeller={false} />
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('communityFeedback.empty')}</p>
          {session?.user && !hasSubmitted && (
            <button
              onClick={() => setShowFeedbackForm(true)}
              className="mt-4 px-4 py-2 bg-primary-brand text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t('communityFeedback.firstCta')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
