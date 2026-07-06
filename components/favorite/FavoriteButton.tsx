'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { openSoftAuthGateWithScroll } from '@/lib/onboarding/open-soft-auth-gate';

interface FavoriteButtonProps {
  productId?: string;
  dishId?: string;
  productTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
  initialFavorited?: boolean;
  showCount?: boolean;
  onCountChange?: (count: number) => void;
}

export default function FavoriteButton({
  productId,
  dishId,
  productTitle = 'dit item',
  className = '',
  size = 'md',
  variant = 'icon',
  initialFavorited,
  showCount = false,
  onCountChange,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(initialFavorited === undefined);

  const itemKey = productId ?? dishId;

  useEffect(() => {
    if (initialFavorited !== undefined) {
      setCheckingStatus(false);
      return;
    }

    if (!session?.user || !itemKey) {
      setCheckingStatus(false);
      return;
    }

    const checkFavoriteStatus = async () => {
      try {
        const qs = productId
          ? `productId=${productId}`
          : `dishId=${encodeURIComponent(dishId!)}`;
        const response = await fetch(`/api/favorites/status?${qs}`);
        if (response.ok) {
          const data = await response.json();
          setFavorited(data.favorited);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    void checkFavoriteStatus();
  }, [productId, dishId, itemKey, session?.user, initialFavorited]);

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!session?.user) {
      const returnPath = `${pathname || '/'}${typeof window !== 'undefined' ? window.location.search : ''}`;
      openSoftAuthGateWithScroll({
        copyKey: 'saveItem',
        intent: {
          type: 'save_item',
          targetId: productId || dishId,
          returnPath,
          autoResume: true,
        },
      });
      return;
    }

    if (!productId && !dishId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productId ? { productId } : { dishId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFavorited(data.favorited);
        if (showCount) {
          setFavoriteCount((c) => Math.max(0, c + (data.favorited ? 1 : -1)));
          onCountChange?.(favoriteCount);
        }
      } else {
        const error = await response.json();
        alert(error.error || t('errors.favoriteError'));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert(t('errors.favoriteError'));
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <button
        disabled
        className={`p-2 bg-white/80 backdrop-blur-sm rounded-full cursor-not-allowed ${className}`}
        aria-label={t('favorites.loading')}
      >
        <Heart className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  const sizeClasses = {
    sm: variant === 'button' ? 'px-3 py-1.5 text-sm' : 'p-1.5',
    md: variant === 'button' ? 'px-4 py-2 text-base' : 'p-2',
    lg: variant === 'button' ? 'px-6 py-3 text-lg' : 'p-3',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const label = favorited ? t('favorites.saved') : t('favorites.save');

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleFavorite}
        disabled={loading}
        className={`
          ${sizeClasses[size]}
          flex items-center gap-2 rounded-lg font-medium transition-colors
          ${favorited
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={label}
        aria-pressed={favorited}
      >
        <Heart className={`${iconSize[size]} ${favorited ? 'fill-current' : ''}`} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center gap-1
        ${className}
      `}
      title={label}
      aria-label={label}
      aria-pressed={favorited}
    >
      <Heart
        className={`
          ${iconSize[size]}
          transition-colors
          ${favorited ? 'text-red-500 fill-red-500' : 'text-neutral-600 hover:text-red-500'}
        `}
      />
      {showCount && favoriteCount > 0 ? (
        <span className="text-xs font-semibold text-gray-600">{favoriteCount}</span>
      ) : null}
    </button>
  );
}
