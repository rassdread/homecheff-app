'use client';

import { useState } from 'react';
import { Star, Camera, MessageCircle, ThumbsUp, Reply } from 'lucide-react';
import StarRating from './StarRating';
import ReviewResponseForm from './ReviewResponseForm';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';

interface ReviewItemProps {
  review: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: { id: string; url: string; sortOrder: number }[];
    isVerified: boolean;
    createdAt: string;
    reviewSubmittedAt?: string | null;
    buyer: {
      id: string;
      name?: string;
      username?: string;
      profileImage?: string;
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
  };
  onReply?: (reviewId: string) => void;
  onResponseSubmit?: (reviewId: string, comment: string) => Promise<void>;
  canReply?: boolean;
  isSeller?: boolean;
}

export default function ReviewItem({ 
  review, 
  onReply, 
  onResponseSubmit,
  canReply = false, 
  isSeller = false 
}: ReviewItemProps) {
  const [showImages, setShowImages] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleResponseSubmit = async (comment: string) => {
    if (!onResponseSubmit) return;

    setIsSubmittingResponse(true);
    try {
      await onResponseSubmit(review.id, comment);
      setShowResponseForm(false);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply(review.id);
    } else {
      setShowResponseForm(true);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            {review.buyer.profileImage ? (
              <Image
                src={review.buyer.profileImage}
                alt={getDisplayName(review.buyer)}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <span className="text-gray-600 font-medium">
                {getDisplayName(review.buyer).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900">
                {getDisplayName(review.buyer)}
              </h4>
              {review.isVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Geverifieerde aankoop
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <StarRating rating={review.rating} size="sm" />
              <span>•</span>
              <span>{formatDate(review.reviewSubmittedAt || review.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`p-1 rounded-full transition-colors ${
              liked ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          {canReply && (
            <button
              onClick={handleReplyClick}
              className="p-1 text-gray-400 hover:text-blue-600 rounded-full transition-colors"
            >
              <Reply className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-3">
        {review.title && (
          <h5 className="font-medium text-gray-900">{review.title}</h5>
        )}
        
        {review.comment && (
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        )}

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Camera className="w-4 h-4" />
              <span>{review.images.length} foto{review.images.length !== 1 ? "'s" : ""}</span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {review.images.slice(0, showImages ? review.images.length : 3).map((image) => (
                <div
                  key={image.id}
                  className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                >
                  <Image
                    src={image.url}
                    alt="Review foto"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              
              {review.images.length > 3 && !showImages && (
                <button
                  onClick={() => setShowImages(true)}
                  className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 hover:border-gray-400 transition-colors"
                >
                  <span className="text-xs">+{review.images.length - 3}</span>
                </button>
              )}
            </div>
            
            {review.images.length > 3 && showImages && (
              <button
                onClick={() => setShowImages(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Minder foto's tonen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Seller Responses */}
      {review.responses && review.responses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-3">
            {review.responses.map((response) => (
              <div key={response.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs text-blue-600 font-medium">
                      {getDisplayName(response.seller).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {getDisplayName(response.seller)}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {formatDate(response.createdAt)}
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    Verkoper
                  </span>
                </div>
                <p className="text-sm text-gray-700">{response.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Response Form */}
      {showResponseForm && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <ReviewResponseForm
            reviewId={review.id}
            onSubmit={handleResponseSubmit}
            onCancel={() => setShowResponseForm(false)}
            isSubmitting={isSubmittingResponse}
          />
        </div>
      )}
    </div>
  );
}
