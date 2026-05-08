'use client';

import Link from 'next/link';
import { getDisplayName, isNameClickable, type User } from '@/lib/displayName';

interface ClickableNameProps {
  user: User | null | undefined;
  className?: string;
  showUsername?: boolean;
  fallbackText?: string;
  linkTo?: 'profile' | 'seller';
}

export default function ClickableName({ 
  user, 
  className = '', 
  showUsername = false,
  fallbackText = 'Onbekend',
  linkTo = 'profile'
}: ClickableNameProps) {
  const displayName = getDisplayName(user);
  const isClickable = isNameClickable(user);
  
  if (!isClickable) {
    return (
      <span className={className}>
        {displayName}
      </span>
    );
  }
  
  const href = user?.id
    ? linkTo === "seller"
      ? `/seller/${user.sellerProfileId || user.id}`
      : linkTo === "profile"
        ? user?.username
          ? `/user/${encodeURIComponent(user.username.trim())}`
          : `/user/${encodeURIComponent(user.id)}`
        : `/user/${encodeURIComponent(user.id)}`
    : "";

  if (!href) {
    return (
      <span className={className}>
        {displayName}
        {showUsername && user?.username && (
          <span className="ml-1 text-sm text-gray-500">
            @{user.username}
          </span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={href}
      prefetch={true}
      className={`hover:text-primary-600 transition-colors ${className}`}
    >
      {displayName}
      {showUsername && user?.username && (
        <span className="text-sm text-gray-500 ml-1">
          @{user.username}
        </span>
      )}
    </Link>
  );
}
