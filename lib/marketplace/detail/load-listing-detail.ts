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
import { consumerContextFromProductPayload } from '@/lib/legal/consumer-context-from-product';
import { toPublicSellerCommerceView } from '@/lib/legal/seller-commerce-context';
import { buildSellerCommerceContext } from '@/lib/legal/seller-commerce-context';

export type ListingDetailPayload = {
  product: Record<string, unknown>;
  publicContactChannels: unknown[];
  checkoutAvailable: boolean;
  checkoutBlockedReason: string | null;
  paymentStatus: ReturnType<typeof buildPublicPaymentStatus>;
  sellerBadges: unknown[];
  isBusiness: boolean;
  companyName: string | null;
  /** LEGAL-1 public subset — no review internals. */
  publicSellerCommerce: ReturnType<typeof toPublicSellerCommerceView> | null;
  /** LEGAL-3 consumer disclosure context for this listing. */
  consumerCommerce: ReturnType<typeof consumerContextFromProductPayload>;
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

  const sellerSlice = product.seller as
    | {
        commerceDeclaration?: string | null;
        kvk?: string | null;
        companyName?: string | null;
        User?: { Business?: { verified?: boolean } | null };
      }
    | undefined;
  const sellerCommerceCtx = buildSellerCommerceContext({
    seller: {
      commerceDeclaration: sellerSlice?.commerceDeclaration,
      kvk: sellerSlice?.kvk,
      companyName: sellerSlice?.companyName,
    },
    businessVerified: sellerSlice?.User?.Business?.verified === true,
    products: [product as { category?: string; marketplaceCategory?: string; priceCents?: number; isActive?: boolean }],
  });
  const publicSellerCommerce = toPublicSellerCommerceView(sellerCommerceCtx);
  const consumerCommerce = consumerContextFromProductPayload(
    product as unknown as Record<string, unknown>,
  );

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
    publicSellerCommerce,
    consumerCommerce,
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
