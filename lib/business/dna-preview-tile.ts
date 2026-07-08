/**
 * Minimal marketplace tile for Business DNA product preview — Phase 12C.
 * Uses real tile pipeline; plan affects trust badges only.
 */

import type { BusinessPlanId } from '@/lib/business/visibility-profile';
import type { MarketplaceTileModel } from '@/lib/marketplace/tiles/types';

const PREVIEW_IMAGE = '/avatar-placeholder.png';

export function buildDnaPreviewTileModel(
  plan: BusinessPlanId,
  sellerName: string,
): MarketplaceTileModel {
  const tier =
    plan === 'premium' ? 4 : plan === 'pro' ? 3 : plan === 'basic' ? 2 : 1;

  return {
    id: 'dna-preview-tile',
    href: '#dna-preview',
    entityType: 'product',
    title: sellerName,
    description: null,
    coverImage: PREVIEW_IMAGE,
    videoUrl: null,
    videoPoster: null,
    imageAlt: sellerName,
    listingKind: 'PRODUCT',
    listingIntent: 'OFFER',
    marketplaceCategory: 'chef',
    specializations: [],
    acceptedSpecializations: [],
    barterOpenness: 'MONEY',
    availabilityDate: null,
    priceCents: 1250,
    priceModel: 'FIXED',
    orderMethod: 'CHECKOUT',
    acceptsHomeCheffCheckout: true,
    acceptsDirectContact: true,
    homeCheffCheckoutConfigured: true,
    person: {
      userId: 'preview-seller',
      name: sellerName,
      username: 'preview',
      avatar: PREVIEW_IMAGE,
    },
    place: 'Vlaardingen',
    distanceKm: 1.2,
    favoriteCount: 3,
    trust: {
      productReviewCount: 4,
      dealReviewCount: 0,
      courierReviewCount: 0,
      completedDeals: 2,
      completedDeliveries: 0,
      repeatCustomers: 1,
      trustBadges: [],
      sellerTier: tier,
      businessPlan: plan,
    },
    fulfillmentFlags: {
      pickup: true,
      delivery: false,
      shipping: false,
      digital: false,
      onSite: false,
      onlineSession: false,
    },
    fulfillmentMode: 'pickup',
    capacityRemaining: null,
    neededBy: null,
    mode: 'sale',
    acceptedValueSubcategories: [],
  };
}
