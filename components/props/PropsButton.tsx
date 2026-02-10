'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUp, Heart, Star, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface PropsButtonProps {
  productId?: string;
  dishId?: string;
  productTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'thumbs' | 'heart' | 'star' | 'zap';
  onCountChange?: (count: number) => void; // Callback for count updates
}

export default function PropsButton({ 
  productId,
  dishId,
  productTitle = 'dit product',
  className = '',
  size = 'md',
  variant = 'thumbs',
  onCountChange
}: PropsButtonProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [propsGiven, setPropsGiven] = useState(false);
  const [propsCount, setPropsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check props status on mount
  useEffect(() => {
    if (!session?.user || (!productId && !dishId)) {
      setCheckingStatus(false);
      return;
    }

    const checkPropsStatus = async () => {
      try {
        const statusUrl = productId 
          ? `/api/props/status?productId=${productId}`
          : `/api/props/status?dishId=${dishId}`;
        const countUrl = productId
          ? `/api/props/count?productId=${productId}`
          : `/api/props/count?dishId=${dishId}`;
        
        const [statusResponse, countResponse] = await Promise.all([
          fetch(statusUrl),
          fetch(countUrl)
        ]);
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setPropsGiven(statusData.propsGiven);
        }
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setPropsCount(countData.propsCount);
        }
      } catch (error) {
        console.error('Error checking props status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkPropsStatus();
  }, [productId, dishId, session?.user, onCountChange]);

  const handleToggleProps = async () => {
    if (!session?.user) {
      alert(t('errors.loginRequiredForProps'));
      return;
    }

    if (!productId && !dishId) {
      alert(t('errors.productOrDishIdRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/props/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...(productId ? { productId } : {}),
          ...(dishId ? { dishId } : {})
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPropsGiven(data.propsGiven);
        
        // Update props count
        const countUrl = productId
          ? `/api/props/count?productId=${productId}`
          : `/api/props/count?dishId=${dishId}`;
        const countResponse = await fetch(countUrl);
        let newCount = propsCount;
        if (countResponse.ok) {
          const countData = await countResponse.json();
          newCount = countData.propsCount;
          setPropsCount(newCount);
          onCountChange?.(newCount); // Notify parent of new count
        }
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('propsToggled', {
          detail: { 
            productId, 
            dishId, 
            propsGiven: data.propsGiven,
            newCount: newCount
          }
        }));
        
        // Show feedback
        if (data.propsGiven) {
        } else {
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error toggling props:', error);
      alert(t('errors.propsError'));
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return null; // Don't show props button if not logged in
  }

  if (checkingStatus) {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed ${className}`}
      >
        {variant === 'thumbs' ? <ThumbsUp className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
      </button>
    );
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getIcon = () => {
    switch (variant) {
      case 'thumbs': return ThumbsUp;
      case 'heart': return Heart;
      case 'star': return Star;
      case 'zap': return Zap;
      default: return ThumbsUp;
    }
  };

  const Icon = getIcon();

  // If className is provided, use it (for custom styling like in product page)
  if (className) {
    return (
      <button
        onClick={handleToggleProps}
        disabled={loading}
        className={`
          ${className} 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-300 transform hover:scale-110 active:scale-95
          flex items-center gap-2 rounded-full font-semibold
          ${propsGiven 
            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-200/50 ring-2 ring-emerald-300 ring-offset-2 animate-pulse' 
            : 'bg-white text-emerald-600 hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md'
          }
        `}
        title={propsGiven ? 'Props ingetrekken' : 'Props geven'}
      >
        <Icon className={`w-4 h-4 ${propsGiven ? 'animate-bounce' : ''} transition-transform`} />
        <span className="font-bold">
          {propsGiven ? 'Props!' : 'Props'}
          {propsCount > 0 && (
            <span className={`ml-1 ${propsGiven ? 'text-white' : 'text-emerald-500'}`}>
              {propsCount > 1000 ? `${(propsCount / 1000).toFixed(1)}k` : propsCount}
            </span>
          )}
        </span>
      </button>
    );
  }

  // Default styling for other use cases - HomeCheff style
  return (
    <button
      onClick={handleToggleProps}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        flex items-center gap-2 rounded-full font-semibold transition-all duration-300
        transform hover:scale-110 active:scale-95
        ${propsGiven 
          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-200/50 ring-2 ring-emerald-300 ring-offset-2' 
          : 'bg-white text-emerald-600 hover:bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${propsGiven ? 'animate-pulse' : ''}
      `}
      title={propsGiven ? 'Props ingetrekken' : 'Props geven'}
    >
      <Icon className={`${iconSize[size]} ${propsGiven ? 'animate-bounce' : ''} transition-transform`} />
      <span className="font-bold">
        {propsGiven ? 'Props!' : 'Props'}
        {propsCount > 0 && (
          <span className={`ml-1 ${propsGiven ? 'text-white' : 'text-emerald-500'}`}>
            {propsCount > 1000 ? `${(propsCount / 1000).toFixed(1)}k` : propsCount}
          </span>
        )}
      </span>
    </button>
  );
}
