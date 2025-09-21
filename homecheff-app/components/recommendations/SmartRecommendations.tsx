'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, MapPin, Clock, Heart, Eye } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description?: string;
  priceCents: number;
  image?: string;
  category?: string;
  createdAt: string;
  location?: {
    distanceKm?: number;
    place?: string;
  };
  seller?: {
    name?: string;
    followerCount?: number;
  };
  viewCount?: number;
  favoriteCount?: number;
}

interface Recommendation {
  id: string;
  type: 'trending' | 'nearby' | 'similar' | 'price_drop' | 'new_seller' | 'popular';
  title: string;
  description: string;
  products: Product[];
  confidence: number;
  reason: string;
}

interface SmartRecommendationsProps {
  userId?: string;
  userLocation?: { lat: number; lng: number } | null;
  onProductClick: (product: Product) => void;
  className?: string;
}

export default function SmartRecommendations({ 
  userId, 
  userLocation, 
  onProductClick, 
  className = '' 
}: SmartRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [userId, userLocation]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
      }

      const response = await fetch(`/api/recommendations/smart?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error('Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Kon aanbevelingen niet laden');
      
      // Fallback to mock recommendations
      setRecommendations(generateMockRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRecommendations = (): Recommendation[] => {
    return [
      {
        id: 'trending_1',
        type: 'trending',
        title: 'Trending in jouw omgeving',
        description: 'Populaire producten die anderen ook bekijken',
        confidence: 0.85,
        reason: 'Gebaseerd op bekijkgedrag in jouw regio',
        products: []
      },
      {
        id: 'nearby_1',
        type: 'nearby',
        title: 'Dichtbij jou',
        description: 'Nieuwe producten binnen 5km van jouw locatie',
        confidence: 0.92,
        reason: 'Gebaseerd op jouw locatie',
        products: []
      },
      {
        id: 'similar_1',
        type: 'similar',
        title: 'Vergelijkbare smaak',
        description: 'Producten die lijken op wat je eerder bekeken hebt',
        confidence: 0.78,
        reason: 'Gebaseerd op jouw browsegeschiedenis',
        products: []
      }
    ];
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'nearby':
        return <MapPin className="w-5 h-5 text-green-500" />;
      case 'similar':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'price_drop':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'new_seller':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      case 'popular':
        return <Eye className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'trending':
        return 'bg-orange-50 border-orange-200';
      case 'nearby':
        return 'bg-green-50 border-green-200';
      case 'similar':
        return 'bg-pink-50 border-pink-200';
      case 'price_drop':
        return 'bg-red-50 border-red-200';
      case 'new_seller':
        return 'bg-blue-50 border-blue-200';
      case 'popular':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Slimme Aanbevelingen</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((j) => (
                  <div key={j} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Slimme Aanbevelingen</h3>
        </div>
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">
            {error || 'Nog geen aanbevelingen beschikbaar'}
          </p>
          <button
            onClick={loadRecommendations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Slimme Aanbevelingen</h3>
        </div>
        <button
          onClick={loadRecommendations}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Vernieuwen
        </button>
      </div>

      <div className="space-y-6">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className={`rounded-lg border p-4 ${getRecommendationColor(recommendation.type)}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 mt-1">
                {getRecommendationIcon(recommendation.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {recommendation.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {recommendation.description}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">
                      {Math.round(recommendation.confidence * 100)}% zekerheid
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {recommendation.reason}
                  </span>
                </div>
              </div>
            </div>

            {recommendation.products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {recommendation.products.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-2xl">📷</span>
                      )}
                    </div>
                    <h5 className="text-xs font-medium text-gray-900 line-clamp-1 mb-1">
                      {product.title}
                    </h5>
                    <p className="text-sm font-semibold text-green-600">
                      €{(product.priceCents / 100).toFixed(2)}
                    </p>
                    {product.location?.distanceKm && (
                      <p className="text-xs text-gray-500">
                        {product.location.distanceKm}km
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Nog geen producten beschikbaar in deze categorie
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Aanbevelingen worden gegenereerd op basis van jouw browsegedrag, locatie en voorkeuren
        </p>
      </div>
    </div>
  );
}
