'use client';

import Link from 'next/link';
import UserCircleAvatar from '@/components/ui/UserCircleAvatar';
import { getDisplayName } from '@/lib/displayName';
import { formatItemPlaceDistanceLine } from '@/lib/geo/item-location';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles';

export default function TilePersonRow({
  model,
  t,
  avatarSize = 'xs',
}: {
  model: MarketplaceTileModel;
  t: TranslateFn;
  avatarSize?: 'xs' | 'sm';
}) {
  const person = model.person;
  if (!person) return null;

  const isRequest = model.listingIntent === 'REQUEST';

  const displayName = getDisplayName({
    name: person.name,
    username: person.username,
    displayFullName: person.displayFullName,
    displayNameOption: person.displayNameOption,
  });

  const locationLine = formatItemPlaceDistanceLine({
    place: model.place,
    distanceKm: model.distanceKm,
    unknownPlaceLabel: t('feed.unknownPlace'),
    unknownDistanceLabel: t('feed.unknownDistance'),
  });

  const profileHref = person.username
    ? `/user/${person.username}`
    : `/user/${person.userId}`;

  const fallbackName = isRequest
    ? t('marketplace.tile.person.requester')
    : t('marketplace.tile.person.maker');

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link
        href={profileHref}
        prefetch
        className="shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <UserCircleAvatar
          src={person.avatar}
          alt={displayName ?? ''}
          size={avatarSize}
          nameForInitial={displayName}
        />
      </Link>
      <div className="min-w-0 flex-1 text-xs leading-tight text-gray-600">
        {isRequest ? (
          <span className="block text-[10px] font-medium uppercase tracking-wide text-amber-800/90">
            {t('marketplace.tile.person.requestedBy')}
          </span>
        ) : null}
        <Link
          href={profileHref}
          prefetch
          className="block truncate font-semibold text-gray-800 hover:text-primary-brand"
          onClick={(e) => e.stopPropagation()}
        >
          {displayName ?? fallbackName}
        </Link>
        {locationLine ? (
          <p className="truncate text-[11px] text-gray-500">{locationLine}</p>
        ) : null}
      </div>
    </div>
  );
}
