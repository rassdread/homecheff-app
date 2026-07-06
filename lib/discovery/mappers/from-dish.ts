import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import type { DiscoveryReadModel } from '../contracts/discovery-read-model';
import {
  buildCapabilityBlock,
  cityFromPlace,
  mergeDiscoveryTrust,
  mergeSocialBlock,
  parseTrustBadges,
  toIsoString,
  type DiscoveryEnrichment,
} from './enrichment';

export type DishDiscoverySource = {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  status?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  place?: string | null;
  photos?: Array<{ url?: string | null }> | null;
  images?: string[] | null;
  image?: string | null;
  videos?: Array<{ url?: string | null }> | null;
  user?: {
    sellerRoles?: string[];
    buyerRoles?: string[];
  } | null;
};

function inspirationSlug(category: string | null | undefined, id: string): string {
  const cat = String(category ?? '').trim().toUpperCase();
  if (cat === 'GROWN') return `/garden/${id}`;
  if (cat === 'DESIGNER') return `/design/${id}`;
  if (cat === 'CHEFF') return `/recipe/${id}`;
  return `/inspiratie/${id}`;
}

function resolveDishImages(source: DishDiscoverySource): string[] {
  if (source.images?.length) {
    return source.images.filter((u): u is string => Boolean(u?.trim()));
  }
  if (source.photos?.length) {
    return source.photos
      .map((p) => p.url)
      .filter((u): u is string => Boolean(u?.trim()));
  }
  if (source.image?.trim()) return [source.image];
  return [];
}

export function mapDishToDiscoveryReadModel(
  source: DishDiscoverySource,
  enrichment?: DiscoveryEnrichment,
): DiscoveryReadModel {
  const place = source.place?.trim() || null;
  const images = resolveDishImages(source);
  const { listingKind } = deriveListingKind({
    entityType: 'dish',
    category: source.category ?? null,
    subcategory: source.subcategory ?? null,
  });

  const title = String(source.title ?? '').trim() || 'Untitled';
  const sellerRoles = enrichment?.sellerRoles ?? source.user?.sellerRoles ?? [];
  const buyerRoles = enrichment?.buyerRoles ?? source.user?.buyerRoles ?? [];

  return {
    id: source.id,
    entityType: 'dish',
    listingKind,
    listingIntent: null,
    title,
    slug: inspirationSlug(source.category, source.id),
    description: source.description?.trim() || null,
    coverImage: images[0] ?? null,
    imageCount: images.length,
    videoCount: source.videos?.filter((v) => v.url)?.length ?? 0,
    city: cityFromPlace(place),
    region: null,
    country: null,
    distanceKm: enrichment?.distanceKm ?? null,
    marketplaceCategory: null,
    specializations: [],
    acceptedSpecializations: [],
    barterOpenness: null,
    trust: mergeDiscoveryTrust({
      ...enrichment,
      listingIsActive: enrichment?.listingIsActive ?? source.status !== 'PRIVATE',
    }),
    social: mergeSocialBlock({}, enrichment),
    createdAt: toIsoString(source.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(source.updatedAt),
    availabilityDate: null,
    isActive: source.status !== 'PRIVATE',
    capability: buildCapabilityBlock(sellerRoles, buyerRoles, true),
  };
}
