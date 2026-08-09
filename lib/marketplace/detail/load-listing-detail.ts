/**
 * Server-first public listing detail loader (critical path only).
 * Trust / badges / contacts / dish / reviewAgg load via detail-extras (deferred).
 */

import { buildDiscoveryTrust } from '@/lib/discovery/trust/build-discovery-trust';
import { getCachedListingProductCore } from '@/lib/marketplace/detail/get-cached-listing-product-core';
import { requiresStripeForHomecheffCheckout } from '@/lib/product/order-method';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { buildPublicPaymentStatus } from '@/lib/stripe/seller-payment-status';
import type { InspirationCategory } from '@/lib/inspiratie/instruction-content';

export type ListingDetailPayload = {
  product: Record<string, unknown>;
  publicContactChannels: unknown[];
  checkoutAvailable: boolean;
  checkoutBlockedReason: string | null;
  paymentStatus: ReturnType<typeof buildPublicPaymentStatus>;
  sellerBadges: unknown[];
  isBusiness: boolean;
  companyName: string | null;
  isDish: boolean;
  dishCategory: string | null;
  linkedInspiration: {
    href: string;
    category: InspirationCategory;
    status: string;
    isOwner: boolean;
  } | null;
  dish: Record<string, unknown> | null;
  stats: {
    viewCount: number;
    orderCount: number;
    favoriteCount: number;
    averageRating: number;
    reviewCount: number;
  };
  discoveryTrust: ReturnType<typeof buildDiscoveryTrust>;
};

/**
 * Critical public listing payload for RSC first paint.
 * Class A only: product core + Stripe checkout flags (from same User select).
 */
export async function loadListingDetail(
  rawId: string,
): Promise<ListingDetailPayload | null> {
  const id = resolveProductIdFromParam(rawId);
  if (!id) return null;

  const product = await getCachedListingProductCore(id);
  if (!product) return null;

  const sellerUser = product.seller?.User as
    | {
        id?: string;
        stripeConnectAccountId?: string | null;
        stripeConnectOnboardingCompleted?: boolean | null;
      }
    | undefined;

  const sortedVideo =
    product.Video && Array.isArray(product.Video) && product.Video.length > 0
      ? [...product.Video].sort(
          (
            a: { createdAt?: string | Date },
            b: { createdAt?: string | Date },
          ) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
          },
        )
      : product.Video;

  const isBusiness = Boolean(product.seller?.kvk && product.seller?.companyName);

  const requiresStripeCheckout = requiresStripeForHomecheffCheckout({
    orderMethod: (product as { orderMethod?: string }).orderMethod,
    priceCents: product.priceCents,
  });
  const paymentStatus = buildPublicPaymentStatus({
    requiresStripeCheckout,
    seller: sellerUser
      ? {
          stripeConnectAccountId: sellerUser.stripeConnectAccountId,
          stripeConnectOnboardingCompleted:
            sellerUser.stripeConnectOnboardingCompleted,
        }
      : null,
  });
  const checkoutAvailable = requiresStripeCheckout
    ? paymentStatus.canCheckout
    : false;

  return {
    product: {
      ...product,
      Video: sortedVideo,
    },
    // B-class: filled by client detail-extras after first paint
    publicContactChannels: [{ id: 'chat', href: '' }],
    checkoutAvailable,
    checkoutBlockedReason: paymentStatus.reason ?? null,
    paymentStatus,
    sellerBadges: [],
    isBusiness,
    companyName: product.seller?.companyName ?? null,
    isDish: false,
    dishCategory: null,
    linkedInspiration: null,
    dish: null,
    stats: {
      viewCount: 0,
      orderCount: 0,
      favoriteCount: 0,
      averageRating: 0,
      reviewCount: 0,
    },
    discoveryTrust: buildDiscoveryTrust({
      listingProductReviewCount: 0,
      listingIsActive: Boolean(product.isActive ?? true),
    }),
  };
}
