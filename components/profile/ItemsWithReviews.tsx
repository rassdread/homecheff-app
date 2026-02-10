'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, ChefHat, Sprout, Palette, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  reviewer: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  createdAt: string;
}

interface ItemWithReviews {
  id: string;
  type: 'dish' | 'product';
  title: string | null;
  description: string | null;
  category: string | null;
  image: string | null;
  reviewCount: number;
  averageRating: number;
  recentReviews: ReviewItem[];
  createdAt: string;
  updatedAt: string;
}

interface ItemsWithReviewsProps {
  userId?: string; // Optional: if provided, fetch for public profile
}

export default function ItemsWithReviews({ userId }: ItemsWithReviewsProps) {
  const [items, setItems] = useState<ItemWithReviews[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get the correct detail page URL based on type and category
  const getItemDetailUrl = (item: ItemWithReviews): string => {
    if (item.type === 'product') {
      return `/product/${item.id}`;
    }
    // For dishes, check category
    if (item.category === 'CHEFF') {
      return `/recipe/${item.id}`;
    } else if (item.category === 'GROWN') {
      return `/garden/${item.id}`;
    } else if (item.category === 'DESIGNER') {
      return `/design/${item.id}`;
    } else {
      // Fallback to inspiratie page
      return `/inspiratie/${item.id}`;
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Use public API if userId is provided, otherwise use profile API
        const apiUrl = userId 
          ? `/api/user/${userId}/items-with-reviews`
          : '/api/profile/items-with-reviews';
        
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching items with reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen reviews</h3>
        <p className="text-gray-500">Je items hebben nog geen beoordelingen ontvangen.</p>
      </div>
    );
  }

  const getCategoryIcon = (category: string | null, type: string) => {
    if (type === 'product') {
      return <Package className="w-5 h-5" />;
    }
    if (category === 'CHEFF') return <ChefHat className="w-5 h-5" />;
    if (category === 'GROWN') return <Sprout className="w-5 h-5" />;
    if (category === 'DESIGNER') return <Palette className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

  const getCategoryLabel = (category: string | null, type: string) => {
    if (type === 'product') return 'Product';
    if (category === 'CHEFF') return 'Chef';
    if (category === 'GROWN') return 'Garden';
    if (category === 'DESIGNER') return 'Designer';
    return 'Item';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Items met Reviews</h2>
          <p className="text-sm text-gray-500">Overzicht van je items die beoordelingen hebben ontvangen</p>
        </div>
        <div className="text-sm text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Item Header */}
            <Link
              href={getItemDetailUrl(item)}
              className="block"
            >
              <div className="relative h-48 bg-gray-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title || 'Item'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getCategoryIcon(item.category, item.type)}
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                    {getCategoryLabel(item.category, item.type)}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold text-gray-700">
                    {item.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>

            {/* Item Content */}
            <div className="p-4">
              <Link
                href={getItemDetailUrl(item)}
                className="block"
              >
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {item.title || 'Zonder titel'}
                </h3>
                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}
              </Link>

              {/* Review Stats */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(item.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Reviews */}
              {item.recentReviews.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Recente Reviews
                  </h4>
                  {item.recentReviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {getDisplayName(review.reviewer)}
                        </span>
                        <span className="text-xs text-gray-400">
                          • {new Date(review.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                  {item.reviewCount > 2 && (
                    <Link
                      href={getItemDetailUrl(item)}
                      className="text-sm text-primary-brand hover:text-primary-700 font-medium"
                    >
                      Bekijk alle {item.reviewCount} reviews →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


