'use client';

import { useState } from 'react';
import { Star, Camera, MessageCircle, ThumbsUp, Reply, ShieldCheck, Heart, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
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
  compact?: boolean; // New prop for compact display
}

export default function ReviewItem({ 
  review, 
  onReply, 
  onResponseSubmit,
  canReply = false, 
  isSeller = false,
  compact = false
}: ReviewItemProps) {
  const [showImages, setShowImages] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  
  // Image modal state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

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

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (review.images && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % review.images.length);
    }
  };

  const prevImage = () => {
    if (review.images && selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? review.images.length - 1 : selectedImageIndex - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            {review.buyer.profileImage ? (
              <Image
                src={review.buyer.profileImage}
                alt={getDisplayName(review.buyer)}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <span className="text-gray-600 font-medium text-sm sm:text-base">
                {getDisplayName(review.buyer).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {getDisplayName(review.buyer)}
              </h4>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {review.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="hidden sm:inline">Geverifieerde aankoop</span>
                    <span className="sm:hidden">Geverifieerd</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Heart className="w-3 h-3" />
                    <span className="hidden sm:inline">Community review</span>
                    <span className="sm:hidden">Community</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <StarRating rating={review.rating} size="sm" />
              <span>•</span>
              <span>{formatDate(review.createdAt)}</span>
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
          <div className="mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Camera className="w-4 h-4" />
              <span>{review.images.length} foto{review.images.length !== 1 ? "'s" : ""}</span>
            </div>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-md">
              {review.images.slice(0, showImages ? review.images.length : 4).map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer group hover:shadow-md transition-all duration-200"
                  onClick={() => openImageModal(index)}
                >
                  <Image
                    src={image.url}
                    alt={`Review foto ${index + 1}`}
                    width={120}
                    height={120}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  
                  {/* Zoom overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
              ))}
              
              {/* Show more button */}
              {review.images.length > 4 && !showImages && (
                <button
                  onClick={() => setShowImages(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-lg font-semibold">+{review.images.length - 4}</span>
                  <span className="text-xs">meer</span>
                </button>
              )}
            </div>
            
            {/* Show less button */}
            {review.images.length > 4 && showImages && (
              <button
                onClick={() => setShowImages(false)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
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

      {/* Image Modal */}
      {showImageModal && selectedImageIndex !== null && review.images && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          {/* Close button */}
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          {review.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div className="max-w-4xl max-h-full flex items-center justify-center">
            <Image
              src={review.images[selectedImageIndex].url}
              alt={`Review foto ${selectedImageIndex + 1}`}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Image counter */}
          {review.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedImageIndex + 1} / {review.images.length}
            </div>
          )}

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeImageModal}
          />
        </div>
      )}
    </div>
  );
}
