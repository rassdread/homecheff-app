'use client';

import Link from 'next/link';
import { getDisplayName, isNameClickable, type User } from '@/lib/displayName';
import {
  getPublicProfileHref,
  profileFallbackHref,
} from '@/lib/user/public-profile';

interface ClickableNameProps {
  user: User | null | undefined;
  className?: string;
  showUsername?: boolean;
  fallbackText?: string;
  /** @deprecated Prefer canonical /user links; seller legacy ids still resolve via redirect. */
  linkTo?: 'profile' | 'seller';
}

export default function ClickableName({
  user,
  className = '',
  showUsername = false,
  fallbackText = 'Onbekend',
  linkTo = 'profile',
}: ClickableNameProps) {
  const displayName = getDisplayName(user);
  const isClickable = isNameClickable(user);

  if (!isClickable) {
    return <span className={className}>{displayName || fallbackText}</span>;
  }

  // Canonical public profile: /user/[username|uuid]. Legacy /seller only when
  // an explicit sellerProfileId is available for linkTo="seller".
  const href = user?.id
    ? linkTo === 'seller' && user.sellerProfileId
      ? `/seller/${user.sellerProfileId}`
      : getPublicProfileHref(user.id, user.username) ??
        profileFallbackHref(user.id)
    : '';

  if (!href) {
    return (
      <span className={className}>
        {displayName}
        {showUsername && user?.username ? (
          <span className="ml-1 text-sm text-gray-500">@{user.username}</span>
        ) : null}
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
      {showUsername && user?.username ? (
        <span className="ml-1 text-sm text-gray-500">@{user.username}</span>
      ) : null}
    </Link>
  );
}
