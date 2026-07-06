'use client';

import FavoriteButton from '@/components/favorite/FavoriteButton';
import type { MarketplaceTileMode } from '@/lib/marketplace/tiles';

export default function MarketplaceTileFavorite({
  id,
  title,
  mode,
  className = '',
}: {
  id: string;
  title: string;
  mode: MarketplaceTileMode;
  className?: string;
}) {
  return (
    <div
      className={`absolute top-2 right-2 z-10 ${className}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <FavoriteButton
        {...(mode === 'inspiration' ? { dishId: id } : { productId: id })}
        productTitle={title}
        size="sm"
        className="rounded-full bg-white/90 shadow-md ring-1 ring-white/80 backdrop-blur-sm"
      />
    </div>
  );
}
