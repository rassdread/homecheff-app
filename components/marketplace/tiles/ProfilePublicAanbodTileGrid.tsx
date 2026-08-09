'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { getListingHref } from '@/lib/routing/public-hrefs';
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
  return getListingHref({
    id: item.id,
    title: item.title?.trim() || 'listing',
    place: item.place ?? null,
    listingIntent: (item as { listingIntent?: string | null }).listingIntent,
  });
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
