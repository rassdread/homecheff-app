'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
          setError('Deze review is al ingediend.');
        } else if (response.status === 410) {
          setError('Deze review link is verlopen.');
        } else {
          setError(errorData.error || 'Review link niet gevonden.');
        }
        return;
      }

      const data = await response.json();
      if (data.valid && data.review) {
        setReviewData(data.review);
      } else {
        setError('Ongeldige review link.');
      }
    } catch (error) {
      console.error('Error loading review data:', error);
      setError('Er is een fout opgetreden bij het laden van de review.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setError('Selecteer een beoordeling tussen 1 en 5 sterren.');
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
        setError(errorData.error || 'Er is een fout opgetreden bij het indienen van de review.');
        return;
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Er is een fout opgetreden bij het indienen van de review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-brand mx-auto mb-4" />
          <p className="text-gray-600">Review wordt geladen...</p>
        </div>
      </div>
    );
  }

  if (error && !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Link Ongeldig</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>Terug naar Home</Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Ingediend!</h1>
          <p className="text-gray-600 mb-6">
            Bedankt voor je review. Deze helpt andere gebruikers bij het maken van een keuze.
          </p>
          <Button onClick={() => router.push('/')}>Terug naar Home</Button>
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
            <h1 className="text-3xl font-bold text-white mb-2">Schrijf een Review</h1>
            <p className="text-primary-100">Deel je ervaring met andere gebruikers</p>
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
                <p className="text-sm text-gray-600">Van {reviewData.sellerName}</p>
                {reviewData.orderNumber && (
                  <p className="text-xs text-gray-500">Bestelling #{reviewData.orderNumber}</p>
                )}
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Beoordeling <span className="text-red-500">*</span>
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
                    {rating === 1 && 'Zeer slecht'}
                    {rating === 2 && 'Slecht'}
                    {rating === 3 && 'Gemiddeld'}
                    {rating === 4 && 'Goed'}
                    {rating === 5 && 'Uitstekend'}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel (optioneel)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bijv. 'Heerlijk product!'"
                  maxLength={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jouw ervaring (optioneel)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Deel je ervaring met dit product..."
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-brand focus:border-primary-brand resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 tekens</p>
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
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Review Indienen
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Annuleren
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}




