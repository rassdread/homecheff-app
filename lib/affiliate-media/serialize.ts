import { getDisplayName } from '@/lib/displayName';
import { inferPromoPlatform } from '@/lib/affiliate-media/platform';
import type { AffiliateMediaAsset } from '@prisma/client';

type Creator = {
  name: string | null;
  username: string | null;
  displayFullName: boolean | null;
  displayNameOption: string | null;
};

export function creatorCreditLabel(input: {
  visibility: AffiliateMediaAsset['visibility'] | string;
  creator: Creator | null;
}): string {
  if (input.visibility === 'OFFICIAL') return 'HomeCheff';
  return getDisplayName(input.creator);
}

export function serializePromoAsset(
  asset: Pick<
    AffiliateMediaAsset,
    | 'id'
    | 'kind'
    | 'mediaUrl'
    | 'posterUrl'
    | 'title'
    | 'caption'
    | 'ctaText'
    | 'visibility'
    | 'moderationStatus'
    | 'shareSlug'
    | 'destinationPath'
    | 'campaignTag'
    | 'createdAt'
    | 'creatorUserId'
    | 'durationMs'
  > & { shareCount?: number },
  creator: Creator | null,
  viewerUserId: string | null,
) {
  return {
    id: asset.id,
    kind: asset.kind,
    mediaUrl: asset.mediaUrl,
    posterUrl: asset.posterUrl,
    title: asset.title,
    caption: asset.caption,
    ctaText: asset.ctaText,
    visibility: asset.visibility,
    moderationStatus: asset.moderationStatus,
    shareSlug: asset.shareSlug,
    destinationPath: asset.destinationPath,
    platform: inferPromoPlatform(asset),
    createdAt: asset.createdAt,
    durationMs: asset.durationMs,
    shareCount: asset.shareCount ?? 0,
    isOwner: viewerUserId === asset.creatorUserId,
    creatorCredit: creatorCreditLabel({ visibility: asset.visibility, creator }),
  };
}
