'use client';

import { useState } from 'react';
import { Star, MessageCircle, Heart, MoreHorizontal, Reply } from 'lucide-react';
import { getDisplayName } from '@/lib/displayName';
import { useSession } from 'next-auth/react';
import SafeImage from '@/components/ui/SafeImage';

interface InspirationReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyer: {
    id: string;
    name?: string;
    username?: string;
    profileImage?: string;
    displayFullName?: boolean;
    displayNameOption?: string;
  };
  responses?: {
    id: string;
    comment: string;
    createdAt: string;
    seller: {
      id: string;
      name?: string;
      username?: string;
      profileImage?: string;
    };
  }[];
}

interface InspirationReviewListProps {
  reviews: InspirationReview[];
  onReply?: (reviewId: string, comment: string) => Promise<void>;
  canReply?: boolean;
}

export default function InspirationReviewList({ 
  reviews, 
  onReply, 
  canReply = false 
}: InspirationReviewListProps) {
  const { data: session } = useSession();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim() || !onReply) return;

    setIsSubmittingReply(true);
    try {
      await onReply(reviewId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Er ging iets mis bij het versturen van je reactie');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Zojuist';
    if (diffInHours < 24) return `${diffInHours}u geleden`;
    if (diffInHours < 48) return 'Gisteren';
    
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nog geen reacties. Wees de eerste!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-sm transition-shadow">
          {/* Review Header */}
          <div className="flex items-start gap-3 sm:gap-4 mb-3">
            <div className="flex-shrink-0">
              {review.buyer.profileImage ? (
                <SafeImage
                  src={review.buyer.profileImage}
                  alt={getDisplayName(review.buyer)}
                  width={44}
                  height={44}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-base">
                    {getDisplayName(review.buyer).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate text-base sm:text-sm">
                  {getDisplayName(review.buyer)}
                </h4>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
            </div>

            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Review Content */}
          <div className="mb-3">
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          </div>

          {/* Review Actions */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <button 
              className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors touch-manipulation py-2 px-1"
              aria-label="Markeer als leuk"
            >
              <Heart className="w-4 h-4" />
              <span>Leuk</span>
            </button>
            
            {canReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                className="flex items-center gap-1 text-gray-500 hover:text-purple-500 transition-colors touch-manipulation py-2 px-1"
                aria-label="Reageer op deze review"
              >
                <Reply className="w-4 h-4" />
                <span>Reageren</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === review.id && (
            <div className="mt-4 pl-12">
              <div className="bg-gray-50 rounded-lg p-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Schrijf een reactie..."
                  rows={2}
                  className="w-full bg-transparent border-none resize-none focus:outline-none placeholder-gray-500"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={() => handleReplySubmit(review.id)}
                    disabled={!replyText.trim() || isSubmittingReply}
                    className="px-4 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmittingReply ? 'Versturen...' : 'Reageren'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Responses */}
          {review.responses && review.responses.length > 0 && (
            <div className="mt-4 pl-12 space-y-3">
              {review.responses.map((response) => (
                <div key={response.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-shrink-0">
                      {response.seller.profileImage ? (
                        <SafeImage
                          src={response.seller.profileImage}
                          alt={getDisplayName(response.seller)}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {getDisplayName(response.seller).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">
                          {getDisplayName(response.seller)}
                        </span>
                        <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                          Maker
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(response.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{response.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
