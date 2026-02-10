'use client';

import { useState } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { MoreHorizontal, Star, Clock, Truck, Package, MapPin } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FavoriteButton from '@/components/favorite/FavoriteButton';
import ClickableName from '@/components/ui/ClickableName';
import BusinessBadge from '@/components/ui/BusinessBadge';

type HomeItem = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  image?: string | null;
  createdAt: string;
  category?: string | null;
  subcategory?: string | null;
  favoriteCount?: number;
  viewCount?: number;
  isFavorited?: boolean; // NEW: User's favorite status
  distanceKm?: number; // Afstand in kilometers
  lat?: number | null; // Product locatie latitude
  lng?: number | null; // Product locatie longitude
  place?: string | null; // Product locatie plaatsnaam
  seller?: { 
    id?: string | null; 
    name?: string | null; 
    username?: string | null; 
    avatar?: string | null;
    followerCount?: number;
    lat?: number | null;
    lng?: number | null;
    isBusiness?: boolean;
    companyName?: string | null;
    kvk?: string | null;
  } | null;
};

const CATEGORY_COLORS = {
  CHEFF: { bg: 'bg-warning-100', text: 'text-warning-800' },
  GROWN: { bg: 'bg-success-100', text: 'text-success-800' },
  DESIGNER: { bg: 'bg-secondary-100', text: 'text-secondary-800' },
};

const CATEGORY_ICONS = {
  CHEFF: '👨‍🍳',
  GROWN: '🌱',
  DESIGNER: '🎨',
};

interface ItemCardProps {
  item: HomeItem;
}

export default function ItemCard({ item }: ItemCardProps) {
  const [hasProps, setHasProps] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '🆕 Zojuist geplaatst';
    if (diffInHours < 24) return `${diffInHours} uur geleden geplaatst`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dagen geleden geplaatst`;
    return date.toLocaleDateString('nl-NL');
  };

  const formatDistance = (distanceKm: number) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    }
    return `${distanceKm.toFixed(1)}km`;
  };

  // Seller name will be handled by ClickableName component

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on seller name or favorite button
    const target = e.target as HTMLElement;
    if (target.closest('[data-seller-name]') || target.closest('[data-favorite-button]')) {
      return;
    }
    
    // Navigate to product page
    router.push(`/product/${item.id}`);
  };

  return (
    <article 
      className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative h-48 bg-neutral-100">
        {item.image ? (
          <SafeImage
            src={item.image}
            alt={item.title || 'Item afbeelding'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <div className="text-neutral-400">
              <Package className="w-12 h-12" />
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        {item.category && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS]?.bg || 'bg-neutral-100'} ${CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS]?.text || 'text-neutral-800'}`}>
              <span className="text-xs">
                {CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || '📦'}
              </span>
              {item.category}
            </span>
          </div>
        )}
        
        {/* Business Badge - exclusief bovenaan */}
        {item.seller?.isBusiness && (
          <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
            <BusinessBadge 
              companyName={item.seller.companyName}
              variant="product"
            />
          </div>
        )}
        
        {/* Favorite Button */}
        <div className={`absolute ${item.seller?.isBusiness ? 'top-12' : 'top-3'} right-3 z-10`} data-favorite-button>
          <FavoriteButton 
            productId={item.id}
            productTitle={item.title}
            size="md"
            initialFavorited={item.isFavorited}
          />
        </div>
        
        {/* Price Tag */}
        {item.priceCents && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              {formatPrice(item.priceCents)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-neutral-900 mb-1 line-clamp-1">
          {item.title || 'Zonder titel'}
        </h3>
        
        {/* Subcategory */}
        {item.subcategory && (
          <p className="text-sm text-primary-600 mb-2">
            {item.subcategory}
          </p>
        )}
        
        {/* Description */}
        {item.description && (
          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Seller Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SafeImage
              src={item.seller?.avatar || ""}
              alt={getDisplayName(item.seller)}
              width={24}
              height={24}
              className="rounded-full border border-primary-100"
            />
            <div>
              <div className="flex items-center gap-2">
                <div data-seller-name>
                  <ClickableName 
                    user={item.seller}
                    className="text-sm font-medium text-neutral-900 hover:text-primary-600 transition-colors"
                    fallbackText="Onbekend"
                    linkTo="profile"
                  />
                </div>
                {item.seller?.followerCount && item.seller.followerCount > 0 && (
                  <span className="text-xs text-neutral-500">
                    ({item.seller.followerCount})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span className="text-xs text-neutral-500">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>
                
                {/* Locatie en afstand gecombineerd */}
                {(item.place || item.distanceKm) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    <span className="text-xs text-neutral-500">
                      {item.place && item.distanceKm 
                        ? `${item.place} (${formatDistance(item.distanceKm)})`
                        : item.place || formatDistance(item.distanceKm!)
                      }
                    </span>
                  </div>
                )}
                
                {item.favoriteCount && item.favoriteCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">❤️</span>
                    <span className="text-xs text-neutral-500">{item.favoriteCount}</span>
                  </div>
                )}
                
                {item.viewCount && item.viewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs">👁️</span>
                    <span className="text-xs text-neutral-500">{item.viewCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button 
            className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
            data-favorite-button
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

