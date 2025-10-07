'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  sellerId: string;
  sellerName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isOwnProfile?: boolean;
}

export default function FollowButton({ 
  sellerId, 
  sellerName = 'deze verkoper',
  className = '',
  size = 'md',
  isOwnProfile = false
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check follow status on mount
  useEffect(() => {
    if (!session?.user) {
      setCheckingStatus(false);
      return;
    }

    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/follows/status?sellerId=${sellerId}`);
        if (response.ok) {
          const data = await response.json();
          setFollowing(data.following);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkFollowStatus();
  }, [sellerId, session?.user]);

  const handleToggleFollow = async () => {
    if (!session?.user) {
      alert('Je moet ingelogd zijn om verkopers fan te worden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/follows/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sellerId }),
      });

      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following);
        
        // Show feedback and redirect to fans list if becoming a fan
        if (data.following) {
          console.log(`Je bent nu fan van ${sellerName}`);
          // Show success message and redirect to fans list
          alert(`Je bent nu fan van ${sellerName}! Je vindt deze verkoper in je "Mijn Fans" lijst.`);
          // Redirect to fans page after a short delay
          setTimeout(() => {
            window.location.href = '/favorites';
          }, 1500);
        } else {
          console.log(`Je bent geen fan meer van ${sellerName}`);
          alert(`Je bent geen fan meer van ${sellerName}`);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Er is een fout opgetreden');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Er is een fout opgetreden bij het fan worden');
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return null; // Don't show follow button if not logged in
  }

  if (checkingStatus) {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed ${className}`}
      >
        <UserPlus className="w-4 h-4" />
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

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`
        ${sizeClasses[size]}
        flex items-center gap-2 rounded-xl font-semibold transition-all duration-200
        transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg
        ${following 
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200' 
          : 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 hover:from-emerald-200 hover:to-emerald-300 border border-emerald-300'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${following ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {following ? (
        <>
          <UserCheck className={`${iconSize[size]} ${following ? 'animate-bounce' : ''}`} />
          <span>Fan</span>
        </>
      ) : (
        <>
          <UserPlus className={iconSize[size]} />
          <span>Fan worden</span>
        </>
      )}
    </button>
  );
}


