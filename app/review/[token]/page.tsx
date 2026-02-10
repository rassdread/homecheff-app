'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

interface ReviewData {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  sellerName: string;
  orderNumber: string | null;
  buyerName: string;
}

export default function ReviewPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadReviewData();
  }, [params.token]);

  const loadReviewData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reviews/token/${params.token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // Review already submitted
          setSubmitted(true);
          setError(t('review.alreadySubmitted'));
        } else if (response.status === 410) {
          setError(t('review.linkExpired'));
        } else {
          setError(errorData.error || t('review.linkNotFound'));
        }
        return;
      }

      const data = await response.json();
      if (data.valid && data.review) {
        setReviewData(data.review);
      } else {
        setError(t('review.invalidLinkError'));
      }
    } catch (error) {
      console.error('Error loading review data:', error);
      setError(t('review.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setError(t('review.selectRating'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: params.token,
          rating,
          title: title.trim() || null,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t('review.submitError'));
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(t('review.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-brand mx-auto mb-4" />
          <p className="text-gray-600">{t('review.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('review.invalidLink')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>{t('review.backToHome')}</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('review.submitted')}</h1>
          <p className="text-gray-600 mb-6">
            {t('review.thankYou')}
          </p>
          <Button onClick={() => router.push('/')}>{t('review.backToHome')}</Button>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-brand to-primary-700 px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('review.title')}</h1>
            <p className="text-primary-100">{t('review.subtitle')}</p>
          </div>

          <div className="p-6">
            {/* Product Info */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              {reviewData.productImage && (
                <img
                  src={reviewData.productImage}
                  alt={reviewData.productTitle}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{reviewData.productTitle}</h2>
                <p className="text-sm text-gray-600">{t('review.from')} {reviewData.sellerName}</p>
                {reviewData.orderNumber && (
                  <p className="text-xs text-gray-500">{t('review.order')} #{reviewData.orderNumber}</p>
                )}
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('review.rating')} <span className="text-red-500">{t('review.ratingRequired')}</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg transition-colors ${
                        rating >= star
                          ? 'text-yellow-400 bg-yellow-50'
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      <Star
                        className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {rating === 1 && t('review.rating1')}
                    {rating === 2 && t('review.rating2')}
                    {rating === 3 && t('review.rating3')}
                    {rating === 4 && t('review.rating4')}
                    {rating === 5 && t('review.rating5')}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('review.titleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('review.titlePlaceholder')}
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('review.commentLabel')}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('review.commentPlaceholder')}
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 {t('review.characters')}</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || rating < 1}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t('review.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('review.submit')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  {t('review.cancel')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}




