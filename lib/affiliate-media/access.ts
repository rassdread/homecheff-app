import type {
  AffiliateMediaModerationStatus,
  AffiliateMediaVisibility,
} from '@prisma/client';

export type MediaAccessAsset = {
  creatorUserId: string;
  visibility: AffiliateMediaVisibility;
  moderationStatus: AffiliateMediaModerationStatus;
  deletedAt: Date | null;
};

export function isDeleted(asset: MediaAccessAsset): boolean {
  return Boolean(asset.deletedAt);
}

/** Unlisted-or-public landing: ACTIVE + not deleted. PRIVATE is unlisted-by-slug. */
export function isPublicLandingEligible(asset: MediaAccessAsset): boolean {
  if (isDeleted(asset)) return false;
  if (asset.moderationStatus !== 'ACTIVE') return false;
  return (
    asset.visibility === 'PRIVATE' ||
    asset.visibility === 'AFFILIATE_COMMUNITY' ||
    asset.visibility === 'OFFICIAL'
  );
}

/**
 * OG images are for listed ACTIVE community/official assets only.
 * PRIVATE remains unlisted-by-slug for humans, but anonymous metadata crawlers
 * must not receive the uploaded file as og:image.
 */
export function isSafeForOpenGraphMedia(asset: MediaAccessAsset): boolean {
  if (!isPublicLandingEligible(asset)) return false;
  return asset.visibility === 'OFFICIAL' || asset.visibility === 'AFFILIATE_COMMUNITY';
}

export function isListedOfficial(asset: MediaAccessAsset): boolean {
  return (
    !isDeleted(asset) &&
    asset.visibility === 'OFFICIAL' &&
    asset.moderationStatus === 'ACTIVE'
  );
}

export function isListedCommunity(asset: MediaAccessAsset): boolean {
  return (
    !isDeleted(asset) &&
    asset.visibility === 'AFFILIATE_COMMUNITY' &&
    asset.moderationStatus === 'ACTIVE'
  );
}

export function isOwnerLibraryItem(asset: MediaAccessAsset, userId: string): boolean {
  return !isDeleted(asset) && asset.creatorUserId === userId;
}

export function canOtherAffiliateShare(asset: MediaAccessAsset, viewerUserId: string): boolean {
  if (isDeleted(asset) || asset.moderationStatus !== 'ACTIVE') return false;
  if (asset.visibility === 'OFFICIAL') return true;
  if (asset.visibility === 'AFFILIATE_COMMUNITY') return true;
  return asset.creatorUserId === viewerUserId;
}

export function requiresReuseConsent(visibility: AffiliateMediaVisibility): boolean {
  return visibility === 'AFFILIATE_COMMUNITY';
}
