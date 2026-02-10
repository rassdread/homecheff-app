'use client';

import { useState } from 'react';
import { Star, Send, X, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface InspirationReviewFormProps {
  productId: string;
  productTitle: string;
  onSubmit: (review: any) => void;
  onCancel: () => void;
}

export default function InspirationReviewForm({ 
  productId, 
  productTitle, 
  onSubmit, 
  onCancel 
}: InspirationReviewFormProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      alert('Je moet ingelogd zijn om een reactie achter te laten');
      return;
    }

    if (!comment.trim()) {
      alert('Voeg een reactie toe');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          reviewType: 'INSPIRATION'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Er ging iets mis');
      }

      const newReview = await response.json();
      onSubmit(newReview);
      setComment('');
      setRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error instanceof Error ? error.message : 'Er ging iets mis bij het versturen van je reactie');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <p className="text-blue-700 mb-3">Log in om een reactie achter te laten</p>
        <button
          onClick={() => window.location.href = '/api/auth/signin'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Inloggen
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">💭 Reactie toevoegen</h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waardering
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-2 sm:p-1 hover:scale-110 transition-transform touch-manipulation"
                aria-label={`${star} sterren`}
              >
                <Star
                  className={`w-7 h-7 sm:w-6 sm:h-6 ${
                    star <= rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {rating === 5 ? '😍 Geweldig!' : 
               rating === 4 ? '😊 Mooi!' : 
               rating === 3 ? '🙂 Oké' : 
               rating === 2 ? '😐 Kan beter' : '😞 Niet leuk'}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jouw reactie
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Wat vind je van "${productTitle}"? Deel je gedachten...`}
            rows={4}
            className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-base sm:text-sm"
            maxLength={500}
            aria-label="Jouw reactie"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              {comment.length}/500 karakters
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 sm:py-2 text-gray-600 hover:text-gray-800 transition-colors text-center sm:text-left touch-manipulation"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 sm:py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation min-h-[44px] sm:min-h-[auto]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Versturen...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Reactie plaatsen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
