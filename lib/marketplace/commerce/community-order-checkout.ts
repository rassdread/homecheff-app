/**
 * CommunityOrder → Stripe checkout bridge — Phase 5E-B.
 * Validates proposal deal checkout without new order models.
 */

import { prisma } from '@/lib/prisma';
import type { SettlementMode } from '@prisma/client';
import { paymentPathFromSummary } from '@/lib/proposals/proposal-accept-routing';
import type { ProposalSummarySnapshot } from '@/lib/proposals/proposal-settlement';

export type CommunityOrderCheckoutItem = {
  productId: string;
  title: string;
  priceCents: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  image?: string;
  deliveryMode: string;
};

type CheckoutFailure = {
  ok: false;
  errorKey: string;
  status: number;
};

type CheckoutSuccess = {
  ok: true;
  communityOrderId: string;
  item: CommunityOrderCheckoutItem;
};

function hasMoneyLeg(mode: SettlementMode): boolean {
  return mode === 'MONEY' || mode === 'MONEY_AND_VALUE';
}

function resolveDealUnitPriceCents(input: {
  amountCents: number | null;
  productPriceCents: number;
}): number {
  if (typeof input.amountCents === 'number' && input.amountCents > 0) {
    return input.amountCents;
  }
  return input.productPriceCents;
}

export async function loadCommunityOrderCheckoutContext(
  communityOrderId: string,
  buyerId: string,
): Promise<CheckoutSuccess | CheckoutFailure> {
  const order = await prisma.communityOrder.findUnique({
    where: { id: communityOrderId },
    include: {
      Proposal: {
        select: {
          id: true,
          productId: true,
          title: true,
          quantity: true,
          amountCents: true,
          settlementMode: true,
          status: true,
          proposalSummary: true,
          buyerId: true,
          Product: {
            select: {
              id: true,
              title: true,
              priceCents: true,
              delivery: true,
              image: true,
              seller: {
                select: {
                  User: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutNotFound',
      status: 404,
    };
  }

  if (order.buyerId !== buyerId) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutForbidden',
      status: 403,
    };
  }

  if (order.checkoutOrderId) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutAlreadyPaid',
      status: 409,
    };
  }

  if (order.status !== 'OPEN') {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutNotOpen',
      status: 409,
    };
  }

  const proposal = order.Proposal;
  if (!proposal?.productId || !proposal.Product) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutMissingProduct',
      status: 400,
    };
  }

  if (proposal.status !== 'ACCEPTED') {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutProposalNotAccepted',
      status: 409,
    };
  }

  if (!hasMoneyLeg(proposal.settlementMode)) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutNoMoneyLeg',
      status: 400,
    };
  }

  const summary = proposal.proposalSummary as ProposalSummarySnapshot | null;
  if (paymentPathFromSummary(summary) !== 'HOMECHEFF_CHECKOUT') {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutNotRequired',
      status: 400,
    };
  }

  const product = proposal.Product;
  const sellerUser = product.seller?.User;
  if (!sellerUser?.id) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutMissingSeller',
      status: 400,
    };
  }

  const quantity = proposal.quantity ?? 1;
  const priceCents = resolveDealUnitPriceCents({
    amountCents: proposal.amountCents,
    productPriceCents: product.priceCents,
  });

  if (priceCents <= 0) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutInvalidAmount',
      status: 400,
    };
  }

  return {
    ok: true,
    communityOrderId: order.id,
    item: {
      productId: product.id,
      title: proposal.title || product.title,
      priceCents,
      quantity,
      sellerId: sellerUser.id,
      sellerName: sellerUser.name || 'Seller',
      image: product.image ?? undefined,
      deliveryMode: product.delivery || 'PICKUP',
    },
  };
}

export async function validateCommunityOrderCheckoutItems(
  communityOrderId: string,
  buyerId: string,
  items: Array<{ productId: string; quantity: number; priceCents: number }>,
): Promise<{ ok: true } | CheckoutFailure> {
  const context = await loadCommunityOrderCheckoutContext(communityOrderId, buyerId);
  if (!context.ok) {
    return context;
  }

  if (items.length !== 1) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutItemMismatch',
      status: 400,
    };
  }

  const item = items[0];
  const expected = context.item;

  if (
    item.productId !== expected.productId ||
    item.quantity !== expected.quantity ||
    item.priceCents !== expected.priceCents
  ) {
    return {
      ok: false,
      errorKey: 'communityOrder.checkoutItemMismatch',
      status: 400,
    };
  }

  return { ok: true };
}
