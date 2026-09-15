'use client';

import FollowButton from '@/components/follow/FollowButton';

export default function TileFollowAction({
  sellerId,
  sellerName,
  initialFollowing,
  initialFansCount,
}: {
  sellerId: string;
  sellerName?: string;
  initialFollowing?: boolean;
  initialFansCount?: number;
}) {
  return (
    <div
      className="shrink-0"
      data-preview-ignore
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <FollowButton
        sellerId={sellerId}
        sellerName={sellerName}
        variant="tile"
        size="sm"
        initialFollowing={initialFollowing}
        initialFansCount={initialFansCount}
      />
    </div>
  );
}
