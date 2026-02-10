'use client';

import { useState, useRef, useEffect } from 'react';
import { getDisplayName } from '@/lib/displayName';
import { MoreHorizontal, Star, Clock, Truck, Package, MapPin, Volume2, VolumeX } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import ImageSlider from '@/components/ui/ImageSlider';
import { checkVideoHasAudio } from '@/lib/videoUtils';
import { videoManager } from '@/lib/videoManager';
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
  images?: string[]; // Array of all images for slider
  video?: { id: string; url: string; thumbnail?: string | null; duration?: number | null } | null;
  createdAt: string;
  category?: string | null;
  subcategory?: string | null;
  favoriteCount?: number;
  viewCount?: number;
  reviewCount?: number;
  averageRating?: number;
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
  priority?: boolean; // Priority loading for above-the-fold items
}

export default function ItemCard({ item, priority = false }: ItemCardProps) {
  const [hasProps, setHasProps] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoHasAudio, setVideoHasAudio] = useState<boolean | null>(null); // null = checking, true = has audio, false = no audio
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  
  // Global ref to track all video elements (for stopping other videos)
  const allVideoRefs = useRef<Set<HTMLVideoElement>>(new Set());

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
    // Don't navigate if clicking on seller name, favorite button, video controls, or image slider
    const target = e.target as HTMLElement;
    if (target.closest('[data-seller-name]') || 
        target.closest('[data-favorite-button]') ||
        target.closest('video') || 
        target.tagName === 'VIDEO' ||
        target.closest('[data-image-slider]')) {
      return;
    }
    
    // Navigate to product page
    router.push(`/product/${item.id}`);
  };
  
  // Check if video has audio (only for logged-in users)
  useEffect(() => {
    if (session?.user && item.video && item.video.url && videoHasAudio === null) {
      checkVideoHasAudio(item.video.url).then((hasAudio) => {
        setVideoHasAudio(hasAudio);
        if (!hasAudio) {
          console.warn('⚠️ Video has no audio track:', item.video?.url);
        }
      }).catch(() => {
        // Default to true (assume audio exists)
        setVideoHasAudio(true);
      });
    }
  }, [session?.user, item.video, videoHasAudio]);

  // Setup intersection observer for video autoplay (for non-logged users)
  useEffect(() => {
    if (!videoElementRef.current || !item.video || !item.video.url) return;
    
    const video = videoElementRef.current;
    
    // Add to global video refs set (for stopping other videos)
    allVideoRefs.current.add(video);
    // Register with global video manager
    videoManager.register(video);
    
    // Ensure video attributes are set for autoplay
    // Start muted for autoplay compliance, will unmute after play starts
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.preload = 'metadata';
    
    // Intersection observer for autoplay when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 1.0) {
            // Video is fully visible - play it
            // Stop all other videos first (using global video manager)
            videoManager.stopAllExcept(videoElement);
            
            // Start muted for autoplay compliance, then unmute after play starts
            videoElement.muted = true;
            videoElement.loop = true;
            videoElement.playsInline = true;
            videoElement.setAttribute('playsinline', 'true');
            videoElement.setAttribute('webkit-playsinline', 'true');
            
            const playPromise = videoElement.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  // After video starts playing, unmute immediately (with sound)
                  if (videoElement && !videoElement.paused && !isVideoMuted) {
                    videoElement.muted = false;
                    setIsVideoMuted(false);
                  }
                })
                .catch((error) => {
                  // Ignore autoplay errors (browser restrictions)
                  console.log('Video autoplay prevented by browser:', error);
                });
            }
          } else {
            // Don't pause - let video play to completion
            // Video will continue playing even when scrolled out of view
          }
        });
      },
      { threshold: 1.0 } // Only trigger when 100% visible
    );
    
    observer.observe(video);
    
    return () => {
      observer.disconnect();
      allVideoRefs.current.delete(video);
    };
  }, [item.video]);
  
  // Prepare media items for ImageSlider (images + video)
  const allImages = item.images || (item.image ? [item.image] : []);
  const primaryVideo = item.video;

  return (
    <article 
      className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-md transition-shadow duration-200 group cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image/Video */}
      <div className="relative h-48 bg-neutral-100" data-image-slider>
        {((allImages.length > 0) || primaryVideo) ? (
          session?.user ? (
            <ImageSlider
              media={[
                // Put video first so it's shown by default and autoplays
                ...(primaryVideo && primaryVideo.url ? [{
                  type: 'video' as const,
                  url: primaryVideo.url,
                  thumbnail: primaryVideo.thumbnail || allImages[0] || null
                }] : []),
                ...allImages.map(url => ({ type: 'image' as const, url }))
              ].filter(m => m && m.url && m.url.trim().length > 0)}
              alt={item.title || 'Item afbeelding'}
              className="w-full h-full"
              showDots={((allImages.length || 0) + (primaryVideo && primaryVideo.url ? 1 : 0)) > 1}
              showArrows={((allImages.length || 0) + (primaryVideo && primaryVideo.url ? 1 : 0)) > 1}
              preventClick={true}
              autoSlideOnScroll={true}
              scrollSlideInterval={3000}
              priority={priority}
              objectFit="cover"
            />
          ) : (
            // For non-logged in users, show video if available, otherwise first image
            primaryVideo && primaryVideo.url ? (
              <div className="relative w-full h-full" style={{ zIndex: 10 }}>
                <video
                  ref={(el) => {
                    if (el) {
                      videoElementRef.current = el;
                      allVideoRefs.current.add(el);
                      // Register with global video manager
                      videoManager.register(el);
                      // Start muted for autoplay compliance, will unmute after play starts
                      el.muted = true;
                      el.loop = true;
                      el.playsInline = true;
                      el.setAttribute('playsinline', 'true');
                      el.setAttribute('webkit-playsinline', 'true');
                      // Only preload metadata when video is about to be visible
                      el.preload = 'none';
                    } else if (videoElementRef.current) {
                      allVideoRefs.current.delete(videoElementRef.current);
                      if (videoElementRef.current) {
                        videoManager.unregister(videoElementRef.current);
                      }
                    }
                  }}
                  src={primaryVideo.url}
                  className="w-full h-full object-cover"
                  controls
                  controlsList="nodownload"
                  playsInline
                  webkit-playsinline="true"
                  preload="none"
                  loop
                  style={{ zIndex: 10, position: 'relative' }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
                {/* Mute/Unmute Button - Only show if logged in and video has audio */}
                {session?.user && videoHasAudio !== false && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (videoElementRef.current) {
                        const newMutedState = !isVideoMuted;
                        setIsVideoMuted(newMutedState);
                        videoElementRef.current.muted = newMutedState;
                      }
                    }}
                    className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-30 transition-all duration-200"
                    aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
                  >
                    {isVideoMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                )}
                {/* Warning if video has no audio - Only for logged-in users */}
                {session?.user && videoHasAudio === false && (
                  <div className="absolute bottom-3 right-3 bg-yellow-500/80 text-white text-xs px-2 py-1 rounded z-30">
                    Geen audio
                  </div>
                )}
              </div>
            ) : allImages[0] ? (
              <SafeImage
                src={allImages[0]}
                alt={item.title || 'Item afbeelding'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                loading={priority ? undefined : "lazy"}
                priority={priority}
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                <div className="text-neutral-400">
                  <Package className="w-12 h-12" />
                </div>
              </div>
            )
          )
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
        
        {/* Price Tag - visible on both images and videos */}
        {item.priceCents && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
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
                
                {item.reviewCount && item.reviewCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-neutral-500">
                      {item.reviewCount}
                      {item.averageRating && item.averageRating > 0 && (
                        <span className="ml-1">({item.averageRating.toFixed(1)})</span>
                      )}
                    </span>
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

