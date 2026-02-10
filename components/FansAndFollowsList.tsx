"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { UserPlus, Users, Heart } from "lucide-react";
import ClickableName from '@/components/ui/ClickableName';
import SafeImage from '@/components/ui/SafeImage';
import { getDisplayName } from '@/lib/displayName';

type Follow = { 
  id: string; 
  createdAt: string;
  seller?: { 
    id: string; 
    name?: string | null; 
    username?: string | null;
    image?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean;
    displayNameOption?: string | null;
  };
  user?: { 
    id: string; 
    name?: string | null; 
    username?: string | null;
    image?: string | null;
    profileImage?: string | null;
    displayFullName?: boolean;
    displayNameOption?: string | null;
  };
};

type Favorite = {
  id: string;
  createdAt: string;
  Product?: {
    id: string;
    title: string | null;
    priceCents: number | null;
    description: string | null;
    category: string | null;
    isActive: boolean;
    Image?: Array<{
      id: string;
      fileUrl: string;
      sortOrder: number;
    }>;
  } | null;
  Listing?: {
    id: string;
    title: string;
    priceCents: number;
    description: string;
    category: string;
  } | null;
};

interface FansAndFollowsListProps {
  userId?: string; // Optional userId for viewing other users' profiles
}

export default function FansAndFollowsList({ userId }: FansAndFollowsListProps) {
  const [follows, setFollows] = useState<Follow[]>([]);
  const [fans, setFans] = useState<Follow[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'follows' | 'fans' | 'favorites'>('follows');

  useEffect(() => {
    (async () => {
      setLoading(true);
      
      // Build API URLs with userId if provided
      const followsUrl = userId ? `/api/profile/follows?userId=${userId}` : "/api/profile/follows";
      const fansUrl = userId ? `/api/follows/fans?userId=${userId}` : "/api/follows/fans";
      
      // Fetch follows (people you follow)
      const followsRes = await fetch(followsUrl);
      if (followsRes.ok) {
        const followsData = await followsRes.json();
        const items = followsData.items || [];
        // Debug: log data om structuur te zien
        console.log('Follows API response:', {
          total: items.length,
          sample: items[0] || null,
          allItems: items
        });
        setFollows(items);
      } else {
        const errorData = await followsRes.json().catch(() => ({}));
        console.error('Failed to fetch follows:', errorData);
      }
      
      // Fetch fans (people who follow you)
      const fansRes = await fetch(fansUrl);
      if (fansRes.ok) {
        const fansData = await fansRes.json();
        const fans = fansData.fans || [];
        // Debug: log data om structuur te zien
        console.log('Fans API response:', {
          total: fans.length,
          sample: fans[0] || null,
          allFans: fans
        });
        setFans(fans);
      } else {
        const errorData = await fansRes.json().catch(() => ({}));
        console.error('Failed to fetch fans:', errorData);
      }
      
      // Fetch favorites
      const favoritesRes = await fetch("/api/profile/favorites");
      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json();
        const favs = favoritesData.items || [];
        console.log('Favorites API response:', {
          total: favs.length,
          sample: favs[0] || null
        });
        setFavorites(favs);
      } else {
        const errorData = await favoritesRes.json().catch(() => ({}));
        console.error('Failed to fetch favorites:', errorData);
      }
      
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4 bg-white animate-pulse h-24" />
        <div className="rounded-xl border p-4 bg-white animate-pulse h-24" />
      </div>
    );
  }

  const currentItems = activeTab === 'follows' ? follows : activeTab === 'fans' ? fans : [];
  const currentLabel = activeTab === 'follows' ? 'fan' : activeTab === 'fans' ? 'fans' : 'favorieten';

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 rounded-t-xl">
        <nav className="flex space-x-1 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('follows')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative whitespace-nowrap ${
              activeTab === 'follows'
                ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <UserPlus className={`w-4 h-4 ${activeTab === 'follows' ? 'text-white' : 'text-gray-500'}`} />
            <span>Fan ({follows.length})</span>
            {activeTab === 'follows' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('fans')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative whitespace-nowrap ${
              activeTab === 'fans'
                ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'fans' ? 'text-white' : 'text-gray-500'}`} />
            <span>Fans ({fans.length})</span>
            {activeTab === 'fans' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 relative whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-emerald-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'text-white' : 'text-gray-500'}`} />
            <span>Favorieten ({favorites.length})</span>
            {activeTab === 'favorites' && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
            )}
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'favorites' ? (
        // Favorieten Tab Content
        !favorites.length ? (
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Nog geen favorieten
            </h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
              Zodra je een product als favoriet markeert, verschijnt het hier.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-b-xl border border-t-0 border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {favorites.map((favorite) => {
                const product = favorite.Product || favorite.Listing;
                if (!product) return null;

                const imageUrl = favorite.Product?.Image?.[0]?.fileUrl || 
                                (favorite.Listing as any)?.image || 
                                "/placeholder.webp";
                const href = favorite.Product 
                  ? `/product/${product.id}`
                  : `/listing/${product.id}`;

                return (
                  <Link
                    key={favorite.id}
                    href={href}
                    className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-pink-400 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  >
                    <div className="flex flex-col">
                      {/* Product Image */}
                      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                        {imageUrl && imageUrl !== "/placeholder.webp" ? (
                          <img
                            src={imageUrl}
                            alt={product.title || 'Product'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.webp";
                              target.onerror = null;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <div className="text-gray-400 text-4xl">
                              {favorite.Product?.category === 'CHEFF' ? '👨‍🍳' :
                               favorite.Product?.category === 'GROWN' ? '🌱' :
                               favorite.Product?.category === 'DESIGNER' ? '🎨' : '📦'}
                            </div>
                          </div>
                        )}
                        {/* Heart Badge */}
                        <div className="absolute top-3 right-3 w-9 h-9 bg-gradient-to-br from-pink-500 to-red-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                          <Heart className="w-5 h-5 text-white fill-white" />
                        </div>
                        {/* Active/Inactive Badge */}
                        {favorite.Product && !favorite.Product.isActive && (
                          <div className="absolute top-3 left-3 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Inactief
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-5 flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors text-base mb-2 line-clamp-2 min-h-[3rem]">
                          {product.title || 'Product'}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          {product.priceCents ? (
                            <span className="font-bold text-emerald-600 text-lg">
                              €{(product.priceCents / 100).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 font-medium">
                              Gratis
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(favorite.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )
      ) : !currentItems.length ? (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            {activeTab === 'follows' ? (
              <UserPlus className="w-10 h-10 text-gray-400" />
            ) : (
              <Users className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Nog geen {currentLabel}
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed">
            {activeTab === 'follows' 
              ? 'Zodra je fan wordt van iemand, verschijnt het hier.'
              : 'Zodra iemand fan van je wordt, verschijnt het hier.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-b-xl border border-t-0 border-gray-200">
          {/* Grid Layout voor Fan & Fans tegels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {currentItems.map((item) => {
              // Get user data - check both seller and user fields (and handle capitalized versions from API)
              const user = item.seller || item.user || (item as any).Seller || (item as any).User;
              
              // Ensure we have valid user data
              if (!user || !user.id) {
                console.warn('Invalid user data:', item);
                return null;
              }

              // Get profile image with fallbacks
              let profileImage = user.profileImage || user.image;
              if (!profileImage || profileImage === '' || profileImage === 'null') {
                profileImage = "/avatar-placeholder.png";
              }

              // Get display name - always prioritize username if name is not available
              let displayName = '';
              
              // First try to get display name using the utility function
              const computedName = getDisplayName(user);
              
              // If we have a valid name from the utility, use it
              if (computedName && computedName !== 'Gebruiker' && computedName !== 'Anoniem') {
                displayName = computedName;
              } else if (user.name && user.name.trim() !== '') {
                // Use name if available
                displayName = user.name;
              } else if (user.username && user.username.trim() !== '') {
                // Fallback to username
                displayName = user.username;
              } else {
                // Final fallback
                displayName = 'Gebruiker';
              }

              // Build href - always use username if available, fallback to ID
              const href = user.username 
                ? `/user/${user.username}`
                : `/user/${user.id}`;

              return (
                <Link
                  key={item.id}
                  href={href}
                  className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-emerald-400 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-100 group-hover:ring-emerald-200 transition-all duration-300 shadow-lg bg-gray-100">
                        {profileImage && profileImage !== "/avatar-placeholder.png" && profileImage !== "null" ? (
                          <img
                            src={profileImage}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to placeholder on error
                              const target = e.target as HTMLImageElement;
                              target.src = "/avatar-placeholder.png";
                              target.onerror = null; // Prevent infinite loop
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 text-2xl font-semibold">
                            {displayName && displayName !== 'Gebruiker' ? displayName.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                      </div>
                      {activeTab === 'fans' && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full border-4 border-white flex items-center justify-center shadow-md z-10">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {activeTab === 'follows' && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full border-4 border-white flex items-center justify-center shadow-md z-10">
                          <UserPlus className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors text-base mb-1 truncate">
                        {displayName || 'Gebruiker'}
                      </h3>
                      {user.username && displayName !== user.username && (
                        <p className="text-xs text-gray-500 mb-2 truncate">
                          @{user.username}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {activeTab === 'follows' 
                          ? `Fan sinds ${new Date(item.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : `Fan sinds ${new Date(item.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        }
                      </p>
                    </div>

                    {/* Badge */}
                    <div className="w-full pt-2 border-t border-gray-100">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                        activeTab === 'fans'
                          ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          : 'text-blue-700 bg-blue-50 border border-blue-200'
                      }`}>
                        {activeTab === 'fans' ? 'Fan' : 'Jij volgt'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}
