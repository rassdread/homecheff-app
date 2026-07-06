/**
 * Map /api/inspiratie InspirationItem → GeoFeedCardItem for tile mapper.
 */

import type { InspirationItem } from '@/components/inspiratie/InspiratieContent';
import type { GeoFeedCardItem } from '@/components/feed/GeoFeedCards';
import { getDiscoveryFavoriteCount, getDiscoveryLegacyVerticalCategory } from '@/lib/discovery/consumer-accessors';

export function inspirationApiToCardItem(item: InspirationItem): GeoFeedCardItem {
  const mainPhoto = item.photos.find((p) => p.isMain) ?? item.photos[0];
  const mainVideo = item.videos?.[0];
  const fav = getDiscoveryFavoriteCount(item);
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    priceCents: null,
    type: 'inspiration',
    isInspiration: true,
    deliveryMode: null,
    place: item.location?.place ?? null,
    photo: mainPhoto?.url ?? null,
    videoUrl: mainVideo?.url ?? null,
    videoThumbnail: mainVideo?.thumbnail ?? null,
    distanceKm: item.location?.distanceKm ?? undefined,
    category: getDiscoveryLegacyVerticalCategory(item) ?? item.category,
    listingKind: item.discovery?.listingKind ?? 'INSPIRATION',
    listingIntent: item.discovery?.listingIntent ?? null,
    discovery: item.discovery,
    sellerUserId: item.user.id,
    sellerName: item.user.name,
    sellerUsername: item.user.username,
    sellerAvatar: item.user.profileImage,
    sellerDisplayFullName: item.user.displayFullName,
    sellerDisplayNameOption: item.user.displayNameOption,
    sellerBadges: item.user.badges,
    favoriteCount: fav,
  };
}
