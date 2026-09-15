'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { UserCheck, UserPlus } from 'lucide-react';
import { openSoftAuthGateWithScroll } from '@/lib/onboarding/open-soft-auth-gate';
import { useTranslation } from '@/hooks/useTranslation';
import { useMakerFollowState } from '@/hooks/useMakerFollowState';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  sellerId: string;
  sellerName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isOwnProfile?: boolean;
  variant?: 'default' | 'tile';
  initialFollowing?: boolean;
  initialFansCount?: number;
}

export default function FollowButton({
  sellerId,
  sellerName = 'deze verkoper',
  className = '',
  size = 'md',
  isOwnProfile = false,
  variant = 'default',
  initialFollowing,
  initialFansCount,
}: FollowButtonProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const pathname = usePathname();
  const { following, toggle, isOwnProfile: viewerIsMaker } = useMakerFollowState({
    sellerId,
    initialFollowing,
    initialFansCount,
  });

  if (isOwnProfile || viewerIsMaker) {
    return null;
  }

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!session?.user) {
      const returnPath = `${pathname || '/'}${typeof window !== 'undefined' ? window.location.search : ''}`;
      openSoftAuthGateWithScroll({
        copyKey: 'follow',
        intent: {
          type: 'follow_profile',
          targetId: sellerId,
          returnPath,
          autoResume: true,
        },
      });
      return;
    }
    void toggle(event);
  };

  if (variant === 'tile') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1',
          'rounded-lg px-2 py-1.5 text-[11px] font-semibold leading-tight',
          'touch-manipulation select-none',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-brand',
          following
            ? 'bg-emerald-700 text-white [-webkit-text-fill-color:#ffffff]'
            : 'border border-emerald-700/70 bg-white text-emerald-800 [-webkit-text-fill-color:#065f46]',
          className,
        )}
        aria-pressed={following}
        aria-label={following ? t('follow.followingButton') : t('follow.followButton')}
      >
        {following ? (
          <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className="whitespace-nowrap">
          {following ? t('follow.followingButton') : t('follow.followButton')}
        </span>
      </button>
    );
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        sizeClasses[size],
        'flex items-center gap-2 rounded-xl font-semibold transition-all duration-200',
        'hover:scale-105 active:scale-95 shadow-md hover:shadow-lg',
        following
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200'
          : 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 hover:from-emerald-200 hover:to-emerald-300 border border-emerald-300',
        className,
      )}
      aria-pressed={following}
      aria-label={
        following
          ? t('follow.followingButton')
          : `${t('follow.followButton')} ${sellerName}`.trim()
      }
    >
      {following ? (
        <UserCheck className={iconSize[size]} aria-hidden />
      ) : (
        <UserPlus className={iconSize[size]} aria-hidden />
      )}
      <span>{following ? t('follow.followingButton') : t('follow.followButton')}</span>
    </button>
  );
}
