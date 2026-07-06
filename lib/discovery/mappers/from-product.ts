import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';
import { buildProductSlugPath } from '@/lib/seo/productSlug';
import type {
  DiscoveryEntityType,
  DiscoveryListingIntent,
  DiscoveryReadModel,
} from '../contracts/discovery-read-model';
import {
  buildCapabilityBlock,
  cityFromPlace,
  mergeSocialBlock,
  mergeTrustBlock,
  parseTrustBadges,
  toIsoString,
  type DiscoveryEnrichment,
} from './enrichment';

export type ProductDiscoverySource = {
  id: string;
  title?: string | null;
  description?: string | null;
  listingIntent?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  acceptedSpecializations?: string[] | null;
  subcategory?: string | null;
  category?: string | null;
  barterOpenness?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  availabilityDate?: Date | string | null;
  isActive?: boolean | null;
  place?: string | null;
  pickupAddress?: string | null;
  Image?: Array<{ fileUrl?: string | null }> | null;
  images?: string[] | null;
  image?: string | null;
  Video?: { url?: string | null } | null;
  video?: { url?: string | null } | null;
  videoUrl?: string | null;
  seller?: {
    User?: {
      sellerRoles?: string[];
      buyerRoles?: string[];
    } | null;
  } | null;
};

function resolveListingIntent(
  raw: string | null | undefined,
  listingKind: ListingKind,
): DiscoveryListingIntent | null {
  const upper = String(raw ?? '').trim().toUpperCase();
  if (upper === 'REQUEST' || listingKind === 'REQUEST') return 'REQUEST';
  if (upper === 'OFFER' || listingKind === 'INSPIRATION') return 'OFFER';
  return 'OFFER';
}

function resolveImages(source: ProductDiscoverySource): string[] {
  if (source.images?.length) {
    return source.images.filter((u): u is string => Boolean(u?.trim()));
  }
  if (source.Image?.length) {
    return source.Image.map((i) => i.fileUrl).filter((u): u is string =>
      Boolean(u?.trim()),
    );
  }
  if (source.image?.trim()) return [source.image];
  return [];
}

function resolveVideoCount(source: ProductDiscoverySource): number {
  if (source.Video?.url || source.video?.url || source.videoUrl) return 1;
  return 0;
}

export function mapProductToDiscoveryReadModel(
  source: ProductDiscoverySource,
  enrichment?: DiscoveryEnrichment,
): DiscoveryReadModel {
  const place =
    source.place?.trim() ||
    source.pickupAddress?.trim()?.split(',').pop()?.trim() ||
    null;
  const images = resolveImages(source);
  const coverImage = images[0] ?? null;

  const { listingKind } = deriveListingKind({
    entityType: 'product',
    listingIntent: source.listingIntent ?? null,
    marketplaceCategory: source.marketplaceCategory ?? null,
    specializations: source.specializations ?? null,
    subcategory: source.subcategory ?? null,
    category: source.category ?? null,
  });

  const listingIntent = resolveListingIntent(source.listingIntent, listingKind);
  const title = String(source.title ?? '').trim() || 'Untitled';
  const slug = buildProductSlugPath(title, place, source.id);

  const sellerRoles = enrichment?.sellerRoles ?? source.seller?.User?.sellerRoles ?? [];
  const buyerRoles = enrichment?.buyerRoles ?? source.seller?.User?.buyerRoles ?? [];

  return {
    id: source.id,
    entityType: 'product',
    listingKind,
    listingIntent,
    title,
    slug,
    description: source.description?.trim() || null,
    coverImage,
    imageCount: images.length,
    videoCount: resolveVideoCount(source),
    city: cityFromPlace(place),
    region: null,
    country: null,
    distanceKm: enrichment?.distanceKm ?? null,
    marketplaceCategory: source.marketplaceCategory ?? null,
    specializations: source.specializations ?? [],
    acceptedSpecializations: source.acceptedSpecializations ?? [],
    barterOpenness: source.barterOpenness ?? null,
    trust: mergeTrustBlock(
      { trustBadges: parseTrustBadges(enrichment?.trustBadges) },
      enrichment,
    ),
    social: mergeSocialBlock({}, enrichment),
    createdAt: toIsoString(source.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoString(source.updatedAt),
    availabilityDate: toIsoString(source.availabilityDate),
    isActive: source.isActive !== false,
    capability: buildCapabilityBlock(sellerRoles, buyerRoles),
  };
}
