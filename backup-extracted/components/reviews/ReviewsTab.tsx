'use client';

import { useState, useEffect } from 'react';
import { Star, Camera, ZoomIn } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';

interface ReviewsTabProps {
  userId: string;
  isOwnProfile?: boolean;
}

export default function ReviewsTab({ userId, isOwnProfile = false }: ReviewsTabProps) {
  const [productsWithReviews, setProductsWithReviews] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductsWithReviews();
  }, [userId]);

  const fetchProductsWithReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/reviews/products?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProductsWithReviews(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products with reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Producten laden...</span>
      </div>
    );
  }

  // Als een product is geselecteerd, toon de reviews
  if (selectedProduct) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProduct(null)}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
        >
          ← Terug naar overzicht
        </button>

        {/* Product Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {selectedProduct.image && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedProduct.title}</h3>
              {selectedProduct.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{selectedProduct.description}</p>
              )}
              <div className="flex items-center gap-4">
                {selectedProduct.priceCents > 0 && (
                  <span className="font-semibold text-emerald-600">
                    {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(selectedProduct.priceCents / 100)}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium">{selectedProduct.averageRating.toFixed(1)}</span>
                  <span className="text-gray-500">({selectedProduct.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Reviews en Beoordelingen</h4>
          {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
            selectedProduct.reviews.map((review: any) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Buyer Avatar */}
                  {review.buyer && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                        {review.buyer.profileImage ? (
                          <SafeImage
                            src={review.buyer.profileImage}
                            alt={getDisplayName(review.buyer)}
                            width={40}
                            height={40}
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
                  )}

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {review.buyer && (
                          <span className="font-medium text-gray-900">
                            {getDisplayName(review.buyer)}
                          </span>
                        )}
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>

                    {review.title && (
                      <h5 className="font-medium text-gray-900 mb-1">{review.title}</h5>
                    )}

                    {review.comment && (
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Camera className="w-4 h-4" />
                          <span>{review.images.length} foto{review.images.length !== 1 ? "'s" : ""}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-2xl">
                          {review.images.map((image: any) => (
                            <div
                              key={image.id}
                              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer group hover:shadow-md transition-all"
                            >
                              <Image
                                src={image.url}
                                alt={`Review foto`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="(max-width: 768px) 50vw, 150px"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {review.isVerified && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3 fill-current" />
                          Geverifieerde aankoop
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nog geen reviews voor dit product</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Toon overzicht van producten met reviews
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Reviews en Beoordelingen</h3>
          <p className="text-sm text-gray-600 mt-1">
            {productsWithReviews.length} product{productsWithReviews.length !== 1 ? 'en' : ''} met reviews
          </p>
        </div>
      </div>

      {productsWithReviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Nog geen producten met reviews</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsWithReviews.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
            >
              {product.image && (
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.title}</h4>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mb-3">
                  {product.priceCents > 0 ? (
                    <span className="font-semibold text-emerald-600">
                      {new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(product.priceCents / 100)}
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">Inspiratie</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-sm">{product.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>{product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button className="w-full py-2 px-4 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium">
                  Bekijk reviews
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
