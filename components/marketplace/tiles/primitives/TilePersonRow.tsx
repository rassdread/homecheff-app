'use client';

import Link from 'next/link';
import { Store } from 'lucide-react';
import UserCircleAvatar from '@/components/ui/UserCircleAvatar';
import { getDisplayName } from '@/lib/displayName';
import { useTranslation } from '@/hooks/useTranslation';
import { formatItemPlaceDistanceLine } from '@/lib/geo/item-location';
import { formatFansCountLabel } from '@/lib/follow/format-fans-count';
import { useMakerFollowState } from '@/hooks/useMakerFollowState';
import type { MarketplaceTileModel, TranslateFn } from '@/lib/marketplace/tiles';
import { getPublicProfileHref } from '@/lib/user/public-profile';
import TileFollowAction from '@/components/marketplace/tiles/primitives/TileFollowAction';
import BusinessPlanBadge from '@/components/business/BusinessPlanBadge';

export default function TilePersonRow({
  model,
  t,
  avatarSize = 'xs',
}: {
  model: MarketplaceTileModel;
  t: TranslateFn;
  avatarSize?: 'xs' | 'sm';
}) {
  const { language } = useTranslation();
  const person = model.person;
  const { fansCount, isOwnProfile } = useMakerFollowState({
    sellerId: person?.userId ?? '',
    initialFollowing: person?.viewerIsFan,
    initialFansCount: person?.fansCount ?? 0,
  });

  if (!person) return null;

  const isRequest = model.listingIntent === 'REQUEST';

  const displayName = getDisplayName({
    name: person.name,
    username: person.username,
    displayFullName: person.displayFullName,
    displayNameOption: person.displayNameOption,
  }, language);

  const locationLine = formatItemPlaceDistanceLine({
    place: model.place,
    distanceKm: model.distanceKm,
    unknownPlaceLabel: t('feed.unknownPlace'),
    unknownDistanceLabel: t('feed.unknownDistance'),
  });

  const profileHref =
    getPublicProfileHref(person.userId, person.username) ??
    `/user/${encodeURIComponent(person.userId)}`;

  const fallbackName = isRequest
    ? t('marketplace.tile.person.requester')
    : t('marketplace.tile.person.maker');

  const paidPlan =
    model.trust.businessPlan && model.trust.businessPlan !== 'individual'
      ? model.trust.businessPlan
      : null;
  const business =
    model.mode !== 'inspiration' &&
    (model.sellerRole === 'business' || (model.sellerRole == null && Boolean(paidPlan)));
  const company = business ? model.companyName?.trim() || null : null;
  const primaryName = company || displayName || fallbackName;
  const secondaryName =
    company && person.username ? `@${person.username.replace(/^@/, '')}` : null;

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
          alt={primaryName}
          size={avatarSize}
          nameForInitial={primaryName}
        />
      </Link>
      <div className="min-w-0 flex-1 text-xs leading-tight text-gray-600">
        {isRequest ? (
          <span className="block text-[10px] font-medium uppercase tracking-wide text-amber-800/90">
            {t('marketplace.tile.person.requestedBy')}
          </span>
        ) : null}
        {business ? (
          <span
            className={`mb-0.5 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${
              paidPlan === 'premium'
                ? 'text-violet-800'
                : paidPlan === 'pro'
                  ? 'text-[#347266]'
                  : 'text-slate-500'
            }`}
          >
            <Store className="h-3 w-3" aria-hidden />
            {model.placeKind === 'sales_location'
              ? language === 'en'
                ? 'Sales location'
                : 'Verkooplocatie'
              : language === 'en'
                ? 'Business'
                : 'Bedrijf'}
          </span>
        ) : null}
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href={profileHref}
            prefetch
            className={`block min-w-0 truncate font-semibold hover:text-primary-brand ${
              paidPlan === 'premium'
                ? 'tracking-tight text-violet-950'
                : paidPlan === 'pro'
                  ? 'tracking-tight text-[#163f36]'
                  : business
                    ? 'text-slate-950'
                    : 'text-gray-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {primaryName}
          </Link>
          {business && paidPlan ? (
            <BusinessPlanBadge plan={paidPlan} t={t} size="sm" />
          ) : null}
        </div>
        {secondaryName ? (
          <p className="truncate text-[11px] text-slate-500">{secondaryName}</p>
        ) : null}
        <p className="truncate text-[11px] text-gray-500">
          {formatFansCountLabel(fansCount, t)}
          {locationLine ? ` · ${locationLine}` : ''}
        </p>
      </div>
      {isOwnProfile ? null : (
        <TileFollowAction
          sellerId={person.userId}
          sellerName={displayName ?? undefined}
          initialFollowing={person.viewerIsFan}
          initialFansCount={person.fansCount ?? 0}
        />
      )}
    </div>
  );
}
