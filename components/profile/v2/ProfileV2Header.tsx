'use client';

import Link from 'next/link';
import {
  Calendar,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import BusinessBadge from '@/components/ui/BusinessBadge';
import FollowButton from '@/components/follow/FollowButton';
import UserBadgeChips from '@/components/gamification/UserBadgeChips';
import MakerContactSection from '@/components/profile/MakerContactSection';
import ProfileV2HeroPhotoEdit from '@/components/profile/v2/ProfileV2HeroPhotoEdit';
import { ProfileV2RolePills } from '@/components/profile/v2/ProfileV2Ui';
import { getDisplayName } from '@/lib/displayName';
import { useTranslation } from '@/hooks/useTranslation';
import { sortBadgesByDisplayPriority } from '@/lib/gamification/badge-priority';
import type { ProfileV2Context } from '@/lib/profile/profile-v2/types';

type Props = {
  ctx: ProfileV2Context;
  onEditProfile?: () => void;
  onPhotoChange?: (url: string | null) => void;
  onAvatarPreview?: (url: string) => void;
  onViewAanbod?: () => void;
  avatarPreviewUrl?: string | null;
};

const ROLE_EMOJI: Record<string, string> = {
  chef: '👨‍🍳',
  garden: '🌱',
  designer: '🎨',
};

function roleLabelKeys(role: string): string {
  const map: Record<string, string> = {
    chef: 'publicProfile.roles.kitchen',
    garden: 'publicProfile.roles.garden',
    designer: 'publicProfile.roles.studio',
  };
  return map[role] ?? 'publicProfile.roles.maker';
}

function ProfileAvatar({
  src,
  alt,
  onPreview,
}: {
  src: string;
  alt: string;
  onPreview?: (url: string) => void;
}) {
  const canPreview = Boolean(onPreview && src && !src.includes('avatar-placeholder'));

  const circle = (
    <div className="hc-profile-v2-avatar-circle relative shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg ring-2 ring-primary-brand/25">
      <SafeImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 120px, 128px"
        priority
      />
    </div>
  );

  if (!canPreview) return circle;

  return (
    <button
      type="button"
      className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-brand focus-visible:ring-offset-2"
      onClick={() => onPreview?.(src)}
      aria-label={alt}
    >
      {circle}
    </button>
  );
}

function formatMemberSince(createdAt: string | Date, locale: string): string | null {
  try {
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(locale === 'en' ? 'en-NL' : 'nl-NL', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function ProfileV2Header({
  ctx,
  onEditProfile,
  onPhotoChange,
  onAvatarPreview,
  onViewAanbod,
  avatarPreviewUrl,
}: Props) {
  const { t, language } = useTranslation();
  const { viewerIsOwner, user, stats, hcp, publicContact, ecosystemChipKeys } =
    ctx;
  const displayName = getDisplayName(user);
  const avatarSrc =
    avatarPreviewUrl ?? user.profileImage ?? user.image ?? '/avatar-placeholder.png';

  const roleLabels = (user.sellerRoles ?? []).map(
    (r) => `${ROLE_EMOJI[r] ?? ''} ${t(roleLabelKeys(r))}`.trim(),
  );

  const fanCount = stats?.followers ?? 0;
  const followingCount = stats?.following ?? 0;
  const sortedBadges = hcp?.badges ? sortBadgesByDisplayPriority(hcp.badges, 3) : [];
  const badgeCount = sortedBadges.length;
  const isOwnPublicView = Boolean(ctx.isOwnPublicUrl);
  const showContactSection =
    !viewerIsOwner && !isOwnPublicView && publicContact && publicContact.length > 0;
  const memberSince = formatMemberSince(user.createdAt, language);

  return (
    <header className="hc-profile-v2-hero hc-dorpsplein-card w-full overflow-visible border-primary-brand/15 shadow-md">
      <div className="hc-profile-v2-hero-cover hc-profile-cover h-32 sm:h-40 lg:h-52">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22)_0%,transparent_55%)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/10" aria-hidden />
        {!viewerIsOwner ? (
          <div className="absolute bottom-3 right-4 z-[1] sm:right-6 lg:right-8">
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {t('profileV2.header.makerOnMarketplace')}
            </span>
          </div>
        ) : null}
      </div>

      <div className="hc-profile-v2-hero-body px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        <div className="grid w-full min-w-0 grid-cols-1 gap-5 lg:grid-cols-[var(--hc-profile-v2-avatar-slot)_minmax(0,1fr)] lg:items-start lg:gap-[var(--hc-profile-v2-hero-gap)]">
          <div className="hc-profile-v2-avatar-column">
            <div className="hc-profile-v2-avatar-overlap mx-auto lg:mx-0">
              <ProfileAvatar
                src={avatarSrc}
                alt={t('profilePage.profilePhotoAlt')}
                onPreview={onAvatarPreview}
              />
            </div>
          </div>

          <div className="min-w-0 w-full space-y-4 pt-1 text-center lg:pt-2 lg:text-left">
            {user.SellerProfile?.kvk && user.SellerProfile.companyName ? (
              <div className="flex justify-center lg:justify-start">
                <BusinessBadge
                  companyName={user.SellerProfile.companyName}
                  subscriptionName={user.SellerProfile.Subscription?.name}
                  size="lg"
                />
              </div>
            ) : null}

            {/* 1. Persoon */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-[2rem] lg:leading-tight">
                {displayName}
              </h1>
              {user.username ? (
                <p className="text-sm text-gray-500">@{user.username}</p>
              ) : null}
              <ProfileV2RolePills labels={roleLabels} />
              {user.place ? (
                <p className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-600 lg:justify-start">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  {user.place}
                </p>
              ) : null}
            </div>

            {/* 2. Verhaal */}
            {user.quote?.trim() ? (
              <blockquote className="rounded-2xl border border-emerald-100/90 bg-gradient-to-br from-emerald-50/90 to-teal-50/40 px-4 py-3.5 text-sm italic leading-relaxed text-gray-800 sm:text-base">
                &ldquo;{user.quote.trim()}&rdquo;
              </blockquote>
            ) : null}

            {user.bio?.trim() ? (
              <p className="text-sm leading-relaxed text-gray-700 sm:text-[15px]">{user.bio.trim()}</p>
            ) : !viewerIsOwner ? (
              <p className="text-sm italic text-gray-500">{t('publicProfile.emptyBio')}</p>
            ) : null}

            {ecosystemChipKeys && ecosystemChipKeys.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                {ecosystemChipKeys.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-emerald-900 shadow-sm"
                  >
                    {t(key)}
                  </span>
                ))}
              </div>
            ) : null}

            {/* 3. Vertrouwen — ondersteunend */}
            {badgeCount > 0 && hcp ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2.5">
                <p className="mb-1.5 text-xs font-medium text-amber-900/90">
                  {hcp.levelTitle}
                </p>
                <UserBadgeChips badges={sortedBadges} max={3} size="sm" />
              </div>
            ) : null}

            {/* 4. Statistieken — klein, niet overheersend */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500 lg:justify-start">
              {hcp && hcp.totalHcp > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden />
                  {t('profileV2.header.hcp', { count: hcp.totalHcp })}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {t('profileV2.header.fans', { count: fanCount })}
              </span>
              {followingCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {t('profileV2.header.following', { count: followingCount })}
                </span>
              ) : null}
              {typeof user.profileViews === 'number' && user.profileViews > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                  <Heart className="h-3.5 w-3.5" aria-hidden />
                  {t('profileV2.header.profileViews', { count: user.profileViews })}
                </span>
              ) : null}
              {memberSince ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  {t('profileV2.header.memberSince', { date: memberSince })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hc-profile-v2-hero-actions">
          {viewerIsOwner && onPhotoChange ? (
            <ProfileV2HeroPhotoEdit
              initialUrl={user.profileImage}
              onPhotoChange={onPhotoChange}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {viewerIsOwner ? (
              <>
                <button type="button" onClick={onEditProfile} className="hc-btn-primary inline-flex items-center gap-2">
                  <Pencil className="h-4 w-4" aria-hidden />
                  {t('profileV2.actions.editProfile')}
                </button>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" aria-hidden />
                  {t('profileV2.actions.settings')}
                </Link>
              </>
            ) : isOwnPublicView ? (
              <Link href="/profile" className="hc-btn-primary inline-flex items-center gap-2">
                <Pencil className="h-4 w-4" aria-hidden />
                {t('profileV2.actions.editProfile')}
              </Link>
            ) : (
              <>
                <button type="button" onClick={onViewAanbod} className="hc-btn-primary inline-flex items-center gap-2">
                  {t('profileV2.actions.viewAanbod')}
                </button>
                <FollowButton
                  sellerId={user.id}
                  sellerName={displayName}
                  isOwnProfile
                />
                {!showContactSection || !publicContact.some((c) => c.id === 'chat') ? (
                  <Link
                    href={`/messages?user=${encodeURIComponent(user.id)}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {t('profileV2.actions.message')}
                  </Link>
                ) : null}
              </>
            )}
          </div>

          {showContactSection ? (
            <MakerContactSection
              makerId={user.id}
              makerName={displayName}
              channels={publicContact}
              className="text-left"
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
