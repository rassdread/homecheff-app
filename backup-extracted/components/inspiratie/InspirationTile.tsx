'use client';

import { useState } from 'react';
import { Eye, Heart, Clock, ChefHat, Sprout, Palette } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getDisplayName } from '@/lib/displayName';
import ClickableName from '@/components/ui/ClickableName';
import PropsButton from '@/components/props/PropsButton';

type InspirationItem = {
  id: string;
  title: string | null;
  description: string | null;
  category: 'CHEFF' | 'GROWN' | 'DESIGNER';
  subcategory?: string | null;
  status: string;
  createdAt: string;
  viewCount?: number;
  propsCount?: number;
  photos: Array<{
    id: string;
    url: string;
    isMain: boolean;
  }>;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  };
};

const CATEGORY_COLORS = {
  CHEFF: {
    bg: 'bg-gradient-to-br from-orange-100 to-red-100',
    text: 'text-orange-800',
    icon: ChefHat,
    emoji: '🍳'
  },
  GROWN: {
    bg: 'bg-gradient-to-br from-green-100 to-emerald-100', 
    text: 'text-green-800',
    icon: Sprout,
    emoji: '🌱'
  },
  DESIGNER: {
    bg: 'bg-gradient-to-br from-purple-100 to-pink-100',
    text: 'text-purple-800', 
    icon: Palette,
    emoji: '🎨'
  }
};

interface InspirationTileProps {
  item: InspirationItem;
  onClick?: (item: InspirationItem) => void;
}

export default function InspirationTile({ item, onClick }: InspirationTileProps) {
  const [imageError, setImageError] = useState(false);
  
  const mainPhoto = item.photos.find(p => p.isMain) || item.photos[0];
  const categoryConfig = CATEGORY_COLORS[item.category];
  const Icon = categoryConfig.icon;
  
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Zojuist';
    if (diffInHours < 24) return `${diffInHours}u geleden`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d geleden`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w geleden`;
    return created.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {mainPhoto && !imageError ? (
          <Image
            src={mainPhoto.url}
            alt={item.title || 'Inspiratie'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full ${categoryConfig.bg} flex items-center justify-center`}>
            <Icon className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.bg} ${categoryConfig.text}`}>
            <span>{categoryConfig.emoji}</span>
            {item.category}
          </span>
        </div>

        {/* Stats Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {item.viewCount !== undefined && item.viewCount > 0 && (
            <div className="flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
              <Eye className="w-3 h-3" />
              <span>{item.viewCount}</span>
            </div>
          )}
          {item.propsCount !== undefined && item.propsCount > 0 && (
            <div className="flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
              <Heart className="w-3 h-3" />
              <span>{item.propsCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        {item.title && (
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Creator & Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Creator Avatar */}
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {item.user.profileImage ? (
                <img 
                  src={item.user.profileImage} 
                  alt={getDisplayName(item.user)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-brand text-white flex items-center justify-center text-xs font-bold">
                  {getDisplayName(item.user).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Creator Name */}
            <ClickableName 
              user={item.user}
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              fallbackText="Gebruiker"
            />
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{timeAgo(item.createdAt)}</span>
          </div>
        </div>

        {/* Props Button */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <PropsButton 
            productId={item.id}
            productTitle={item.title || 'deze inspiratie'}
            size="sm"
            variant="heart"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}



