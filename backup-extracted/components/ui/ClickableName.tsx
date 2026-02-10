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
  fallbackText = 'Gebruiker',
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
    ? linkTo === 'seller' 
      ? `/seller/${user.sellerProfileId || user.id}` 
      : linkTo === 'profile'
        ? user?.username 
          ? `/user/${user.username}`
          : `/user/${user.id}` // Gebruik userId als fallback voor bestaande accounts
        : `/user/${user.id}` // Altijd naar publieke profielpagina
    : '#';
  
  return (
    <Link 
      href={href}
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
