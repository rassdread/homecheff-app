'use client';

import { useSession } from 'next-auth/react';
import FavoriteButton from '@/components/favorite/FavoriteButton';
import { cardActionBoundaryProps } from '@/lib/ui/card-action-boundary';

export default function TileFavoriteAction({
  id,
  title,
  mode,
  className = '',
  initialFavorited,
  ownerUserId,
}: {
  id: string;
  title: string;
  mode: MarketplaceTileMode;
  className?: string;
  initialFavorited?: boolean;
  ownerUserId?: string | null;
}) {
  const { data: session } = useSession();
  if (ownerUserId && session?.user?.id === ownerUserId) {
    return null;
  }

  return (
    <div
      className={className}
      data-preview-ignore
      {...cardActionBoundaryProps()}
    >
      <FavoriteButton
        {...(mode === 'inspiration' ? { dishId: id } : { productId: id })}
        productTitle={title}
        size="sm"
        initialFavorited={initialFavorited}
        className="min-h-[44px] min-w-[44px] rounded-full bg-white/90 shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      />
    </div>
  );
}
