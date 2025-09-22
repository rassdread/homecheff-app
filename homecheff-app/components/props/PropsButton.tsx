'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ThumbsUp, Heart } from 'lucide-react';

interface PropsButtonProps {
  productId: string;
  productTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'thumbs' | 'heart';
}

export default function PropsButton({ 
  productId, 
  productTitle = 'dit product',
  className = '',
  size = 'md',
  variant = 'thumbs'
}: PropsButtonProps) {
  const { data: session } = useSession();
  const [propsGiven, setPropsGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check props status on mount
  useEffect(() => {
    if (!session?.user) {
      setCheckingStatus(false);
      return;
    }

    const checkPropsStatus = async () => {
      try {
        const response = await fetch(`/api/props/status?productId=${productId}`);
        if (response.ok) {
          const data = await response.json();
          setPropsGiven(data.propsGiven);
        }
      } catch (error) {
        console.error('Error checking props status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkPropsStatus();
  }, [productId, session?.user]);

  const handleToggleProps = async () => {
    if (!session?.user) {
      alert('Je moet ingelogd zijn om props te geven');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/props/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPropsGiven(data.propsGiven);
        
        // Show feedback
        if (data.propsGiven) {
          console.log(`Je hebt props gegeven aan ${productTitle}`);
        } else {
          console.log(`Je hebt props ingetrokken van ${productTitle}`);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error toggling props:', error);
      alert('Er is een fout opgetreden bij het geven van props');
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

  const Icon = variant === 'thumbs' ? ThumbsUp : Heart;

  // If className is provided, use it (for custom styling like in product page)
  if (className) {
    return (
      <button
        onClick={handleToggleProps}
        disabled={loading}
        className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
        title={propsGiven ? 'Props ingetrekken' : 'Props geven'}
      >
        <Icon className="w-4 h-4" />
        <span>{propsGiven ? 'Props!' : 'Props'}</span>
      </button>
    );
  }

  // Default styling for other use cases
  return (
    <button
      onClick={handleToggleProps}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        flex items-center gap-2 rounded-lg font-medium transition-colors
        ${propsGiven 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={propsGiven ? 'Props ingetrekken' : 'Props geven'}
    >
      <Icon className={iconSize[size]} />
      <span>{propsGiven ? 'Props!' : 'Props'}</span>
    </button>
  );
}
