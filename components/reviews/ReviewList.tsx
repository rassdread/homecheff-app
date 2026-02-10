'use client';

import { useState } from 'react';
import { Star, Filter, SortAsc } from 'lucide-react';
import ReviewItem from './ReviewItem';
import StarRating from './StarRating';

interface ReviewListProps {
  reviews: {
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
  }[];
  onReply?: (reviewId: string) => void;
  onResponseSubmit?: (reviewId: string, comment: string) => Promise<void>;
  canReply?: boolean;
  isSeller?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | '5' | '4' | '3' | '2' | '1';

export default function ReviewList({ 
  reviews, 
  onReply, 
  onResponseSubmit,
  canReply = false, 
  isSeller = false 
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0 
      ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 
      : 0
  }));

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      if (filterBy === 'all') return true;
      return review.rating === parseInt(filterBy);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': {
          const dateA = a.reviewSubmittedAt || a.createdAt;
          const dateB = b.reviewSubmittedAt || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        }
        case 'oldest': {
          const dateA = a.reviewSubmittedAt || a.createdAt;
          const dateB = b.reviewSubmittedAt || b.createdAt;
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Beoordelingen ({totalReviews})
            </h3>
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size="lg" showNumber={true} />
              <span className="text-sm text-gray-600">
                op basis van {totalReviews} beoordeling{totalReviews !== 1 ? 'en' : ''}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Rating Distribution */}
        {totalReviews > 0 && (
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-6">
                  {rating}
                </span>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sorteren op
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Nieuwste eerst</option>
                <option value="oldest">Oudste eerst</option>
                <option value="highest">Hoogste beoordeling</option>
                <option value="lowest">Laagste beoordeling</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter op beoordeling
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle beoordelingen</option>
                <option value="5">5 sterren</option>
                <option value="4">4 sterren</option>
                <option value="3">3 sterren</option>
                <option value="2">2 sterren</option>
                <option value="1">1 ster</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onReply={onReply}
              onResponseSubmit={onResponseSubmit}
              canReply={canReply}
              isSeller={isSeller}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {filterBy === 'all' 
                ? 'Nog geen beoordelingen voor dit product.'
                : `Geen beoordelingen met ${filterBy} sterren.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
