'use client';

import { useState, useEffect } from 'react';
import { Star, MessageCircle, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { getDisplayName } from '@/lib/displayName';
import SafeImage from '@/components/ui/SafeImage';

interface ItemReviewsPreviewProps {
  itemId: string;
  itemType: 'product' | 'dish';
  itemTitle: string;
  compact?: boolean;
}

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerified: boolean;
  createdAt: string;
  buyer: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean;
    displayNameOption?: string;
  };
}

export default function ItemReviewsPreview({ 
  itemId, 
  itemType, 
  itemTitle,
  compact = true 
}: ItemReviewsPreviewProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (expanded) {
      fetchReviews();
    }
  }, [expanded, itemId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = itemType === 'dish' 
        ? `/api/inspiratie/${itemId}/reviews`
        : `/api/products/${itemId}/reviews`;
        
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        
        // Calculate average rating
        if (data.reviews && data.reviews.length > 0) {
          const avg = data.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.reviews.length;
          setAverageRating(avg);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${i < rating ? 'fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="border-t pt-3 mt-3">
      {/* Reviews Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          <span>
            Reviews ({reviews.length || '?'})
            {averageRating > 0 && (
              <span className="ml-1 text-yellow-600">
                ({averageRating.toFixed(1)} ⭐)
              </span>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Reviews Content */}
      {expanded && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="ml-2 text-xs text-gray-500">Reviews laden...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <MessageCircle className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <p className="text-xs">Nog geen reviews</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {reviews.slice(0, compact ? 2 : 5).map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                        {review.buyer.profileImage ? (
                          <SafeImage
                            src={review.buyer.profileImage}
                            alt={getDisplayName(review.buyer)}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {getDisplayName(review.buyer).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-xs truncate">
                            {getDisplayName(review.buyer)}
                          </span>
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                      </div>

                      {review.title && (
                        <h5 className="font-medium text-gray-900 text-xs mb-1 line-clamp-1">
                          {review.title}
                        </h5>
                      )}
                      
                      {review.comment && (
                        <p className="text-gray-700 text-xs line-clamp-2">
                          {review.comment}
                        </p>
                      )}

                      {review.isVerified && (
                        <span className="inline-block mt-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          Geverifieerd
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {reviews.length > (compact ? 2 : 5) && (
                <div className="text-center pt-2">
                  <button 
                    onClick={() => {
                      // Navigate to full item page
                      const url = itemType === 'dish' 
                        ? `/inspiratie/${itemId}`
                        : `/product/${itemId}`;
                      window.location.href = url;
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Alle {reviews.length} reviews bekijken
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}



