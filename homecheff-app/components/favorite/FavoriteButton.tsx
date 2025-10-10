'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  productId: string;
  productTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
  initialFavorited?: boolean; // NEW: Accept initial favorite status to avoid API call
}

export default function FavoriteButton({ 
  productId, 
  productTitle = 'dit product',
  className = '',
  size = 'md',
  variant = 'icon',
  initialFavorited // NEW
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(initialFavorited === undefined);

  // Check favorite status on mount ONLY if initialFavorited not provided
  useEffect(() => {
    // Skip if we already have the initial state
    if (initialFavorited !== undefined) {
      setCheckingStatus(false);
      return;
    }

    if (!session?.user) {
      setCheckingStatus(false);
      return;
    }

    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/favorites/status?productId=${productId}`);
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

    checkFavoriteStatus();
  }, [productId, session?.user, initialFavorited]);

  const handleToggleFavorite = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!session?.user) {
      alert('Je moet ingelogd zijn om producten te favorieten');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFavorited(data.favorited);
        
        // Show feedback
        if (data.favorited) {
          console.log(`${productTitle} toegevoegd aan favorieten`);
        } else {
          console.log(`${productTitle} verwijderd uit favorieten`);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Er is een fout opgetreden bij het favorieten');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <button
        disabled
        className={`p-2 bg-white/80 backdrop-blur-sm rounded-full cursor-not-allowed ${className}`}
      >
        <Heart className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  const sizeClasses = {
    sm: variant === 'button' ? 'px-3 py-1.5 text-sm' : 'p-1.5',
    md: variant === 'button' ? 'px-4 py-2 text-base' : 'p-2',
    lg: variant === 'button' ? 'px-6 py-3 text-lg' : 'p-3'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

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
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <Heart className={`${iconSize[size]} ${favorited ? 'fill-current' : ''}`} />
        <span>{favorited ? 'Favoriet' : 'Favorieten'}</span>
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
        ${className}
      `}
    >
      <Heart 
        className={`
          ${iconSize[size]} 
          transition-colors
          ${favorited 
            ? 'text-red-500 fill-red-500' 
            : 'text-neutral-600 hover:text-red-500'
          }
        `} 
      />
    </button>
  );
}


