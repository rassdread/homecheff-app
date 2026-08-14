/**
 * LEGAL-1 — server loader for seller commerce context.
 */

import { prisma } from '@/lib/prisma';
import { buildSellerCommerceContext } from './seller-commerce-context';
import type { SellerCommerceContext } from './seller-commerce-context';
import {
  collectCommerceReviewReasons,
  nextCommerceReviewState,
} from './seller-commerce-review-signals';
import {
  parseSellerCommerceDeclaration,
  parseSellerCommerceReviewState,
} from './seller-commerce-types';

export async function getSellerCommerceContextForUserId(
  userId: string,
  options?: { persistReviewSignals?: boolean },
): Promise<SellerCommerceContext> {
  const [seller, business, user, products, businessSub] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { userId } }),
    prisma.business.findUnique({
      where: { userId },
      select: { id: true, verified: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { stripeConnectAccountId: true },
    }),
    prisma.product.findMany({
      where: { seller: { userId } },
      select: {
        category: true,
        marketplaceCategory: true,
        priceCents: true,
        isActive: true,
      },
      take: 200,
    }),
    prisma.businessSubscription.findUnique({
      where: { businessUserId: userId },
      select: { status: true },
    }),
  ]);

  const hasBusinessSubscription = Boolean(
    businessSub &&
      ['active', 'trialing', 'past_due'].includes(
        (businessSub.status || '').toLowerCase(),
      ),
  );

  const ctx = buildSellerCommerceContext({
    seller,
    businessVerified: business?.verified === true,
    hasBusinessRecord: Boolean(business),
    stripeConnectAccountId: user?.stripeConnectAccountId,
    hasBusinessSubscription,
    products,
  });

  if (options?.persistReviewSignals && seller) {
    const declaration = parseSellerCommerceDeclaration(
      seller.commerceDeclaration,
    );
    const storedReview = parseSellerCommerceReviewState(
      seller.commerceReviewState,
    );
    const signalBase = {
      declaration,
      reviewState: storedReview,
      kvk: seller.kvk,
      btw: seller.btw,
      companyName: seller.companyName,
      hasBusinessRecord: Boolean(business),
      stripeConnectAccountId: user?.stripeConnectAccountId,
      hasBusinessSubscription,
      paidListingCount: products.filter((p) => (p.priceCents ?? 0) > 0).length,
      foodActivity: ctx.activities.food,
      serviceActivity: ctx.activities.services,
    };
    const reasons = collectCommerceReviewReasons(signalBase);
    const nextState = nextCommerceReviewState(signalBase);

    if (
      nextState === 'REVIEW_REQUIRED' &&
      storedReview === 'NONE' &&
      reasons.length > 0
    ) {
      const at = new Date();
      await prisma.sellerProfile.update({
        where: { id: seller.id },
        data: {
          commerceReviewState: 'REVIEW_REQUIRED',
          commerceReviewRequiredAt: at,
          commerceReviewReasons: reasons,
        },
      });
      return {
        ...ctx,
        reviewState: 'REVIEW_REQUIRED',
        reviewReasons: reasons,
        reviewRequiredAt: at.toISOString(),
      };
    }
  }

  return ctx;
}

export { buildSellerCommerceContext };
