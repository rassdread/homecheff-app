'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { buildProductSlugPath } from '@/lib/seo/productSlug';
import {
  mapProfileListingToTileModel,
  type ProfileListingInput,
} from '@/lib/marketplace/tiles/map-profile-listing-to-tile-model';
import type { MarketplaceTilePerson } from '@/lib/marketplace/tiles';
import MarketplaceTileMini from '@/components/marketplace/tiles/MarketplaceTileMini';

export type ProfilePublicAanbodTileGridProps = {
  items: ProfileListingInput[];
  owner: MarketplaceTilePerson;
  className?: string;
};

function productHref(item: ProfileListingInput): string {
  const title = item.title?.trim();
  if (title) {
    return `/product/${buildProductSlugPath(title, item.place ?? null, item.id)}`;
  }
  return `/product/${item.id}`;
}

export default function ProfilePublicAanbodTileGrid({
  items,
  owner,
  className = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
}: ProfilePublicAanbodTileGridProps) {
  const { t } = useTranslation();

  return (
    <div className={className}>
      {items.map((item) => {
        const model = mapProfileListingToTileModel(item, {
          href: productHref(item),
          owner,
          mode: 'sale',
        });
        return (
          <MarketplaceTileMini key={item.id} model={model} t={t} />
        );
      })}
    </div>
  );
}
