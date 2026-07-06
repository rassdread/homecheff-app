import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { buildProductSlugPath } from '@/lib/seo/productSlug';
import type { DiscoveryReadModel } from '../contracts/discovery-read-model';
import {
  buildCapabilityBlock,
  cityFromPlace,
  mergeSocialBlock,
  mergeTrustBlock,
  parseTrustBadges,
  toIsoString,
  type DiscoveryEnrichment,
} from './enrichment';

export type LegacyListingDiscoverySource = {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  vertical?: string | null;
  priceCents?: number | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  isPublic?: boolean | null;
  place?: string | null;
  ListingMedia?: Array<{ url?: string | null }> | null;
  images?: string[] | null;
  image?: string | null;
  User?: {
    sellerRoles?: string[];
    buyerRoles?: string[];
  } | null;
};

function resolveListingImages(source: LegacyListingDiscoverySource): string[] {
  if (source.images?.length) {
    return source.images.filter((u): u is string => Boolean(u?.trim()));
  }
  if (source.ListingMedia?.length) {
    return source.ListingMedia.map((m) => m.url).filter((u): u is string =>
      Boolean(u?.trim()),
    );
  }
  if (source.image?.trim()) return [source.image];
  return [];
}

export function mapLegacyListingToDiscoveryReadModel(
  source: LegacyListingDiscoverySource,
  enrichment?: DiscoveryEnrichment,
): DiscoveryReadModel {
  const category = source.category ?? source.vertical ?? null;
  const place = source.place?.trim() || null;
  const images = resolveListingImages(source);
  const title = String(source.title ?? '').trim() || 'Untitled';

  const { listingKind } = deriveListingKind({
    entityType: 'listing',
    category,
  });

  const sellerRoles = enrichment?.sellerRoles ?? source.User?.sellerRoles ?? [];
  const buyerRoles = enrichment?.buyerRoles ?? source.User?.buyerRoles ?? [];

  return {
    id: source.id,
    entityType: 'listing',
    listingKind,
    listingIntent: 'OFFER',
    title,
    slug: buildProductSlugPath(title, place, source.id),
    description: source.description?.trim() || null,
    coverImage: images[0] ?? null,
    imageCount: images.length,
    videoCount: 0,
    city: cityFromPlace(place),
    region: null,
    country: null,
    distanceKm: enrichment?.distanceKm ?? null,
    marketplaceCategory: null,
    specializations: [],
    acceptedSpecializations: [],
    barterOpenness: null,
    trust: mergeTrustBlock(
      { trustBadges: parseTrustBadges(enrichment?.trustBadges) },
      enrichment,
    ),
    social: mergeSocialBlock({}, enrichment),
    createdAt: toIsoString(source.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(source.updatedAt),
    availabilityDate: null,
    isActive: source.isPublic !== false,
    capability: buildCapabilityBlock(sellerRoles, buyerRoles),
  };
}
