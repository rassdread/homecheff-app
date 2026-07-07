/**
 * Barter ↔ commerce alignment — Phase 5E-B.
 * Single source for CTA visibility and checkout gates (no new enums).
 */

import type { BarterOpenness } from '@prisma/client';
import type { SettlementMode } from '@prisma/client';
import { getMarketplacePriceDisplay } from '@/lib/marketplace/price-display';

export type BarterOpennessValue = 'MONEY' | 'MONEY_AND_BARTER' | 'BARTER_ONLY';

export type ProductCommerceActions = {
  showOrderCheckout: boolean;
  showProposalCta: boolean;
};

export function normalizeBarterOpenness(
  raw?: string | null,
): BarterOpennessValue {
  const key = String(raw ?? 'MONEY').trim().toUpperCase();
  if (key === 'BARTER_ONLY' || key === 'MONEY_AND_BARTER') {
    return key;
  }
  return 'MONEY';
}

export function resolveProductCommerceActions(
  barterOpenness?: string | null,
): ProductCommerceActions {
  const openness = normalizeBarterOpenness(barterOpenness);
  switch (openness) {
    case 'BARTER_ONLY':
      return { showOrderCheckout: false, showProposalCta: true };
    case 'MONEY_AND_BARTER':
      return { showOrderCheckout: true, showProposalCta: true };
    default:
      return { showOrderCheckout: true, showProposalCta: false };
  }
}

/** Blocks Stripe/cart checkout for barter-only listings. */
export function blocksHomecheffCartCheckout(
  barterOpenness?: string | null,
): boolean {
  return normalizeBarterOpenness(barterOpenness) === 'BARTER_ONLY';
}

export function formatCommercePriceLabel(
  product: {
    priceCents?: number | null;
    priceModel?: string | null;
    orderMethod?: string | null;
    barterOpenness?: string | null;
    acceptedSpecializations?: string[] | null;
  },
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const openness = normalizeBarterOpenness(product.barterOpenness);
  if (openness === 'BARTER_ONLY') {
    return t('marketplace.tile.price.barterOnly');
  }
  const cents = product.priceCents ?? 0;
  if (openness === 'MONEY_AND_BARTER' && cents > 0) {
    return t('marketplace.tile.price.moneyAndBarter', {
      price: `€${(cents / 100).toFixed(2)}`,
    });
  }
  return getMarketplacePriceDisplay(
    {
      priceCents: product.priceCents,
      priceModel: product.priceModel,
      orderMethod: product.orderMethod,
      acceptedSpecializations: product.acceptedSpecializations,
    },
    t,
  );
}

const VALUE_SETTLEMENT: SettlementMode[] = ['VALUE_ONLY', 'MONEY_AND_VALUE'];
const MONEY_SETTLEMENT: SettlementMode[] = ['MONEY', 'MONEY_AND_VALUE'];

export function validateSettlementAgainstBarterOpenness(input: {
  barterOpenness?: string | null;
  settlementMode: SettlementMode;
}): { ok: true } | { ok: false; errorKey: string } {
  const openness = normalizeBarterOpenness(input.barterOpenness);

  if (openness === 'MONEY') {
    if (VALUE_SETTLEMENT.includes(input.settlementMode)) {
      return { ok: false, errorKey: 'proposal.errors.barterNotAllowedOnMoneyListing' };
    }
  }

  if (openness === 'BARTER_ONLY') {
    if (MONEY_SETTLEMENT.includes(input.settlementMode)) {
      return { ok: false, errorKey: 'proposal.errors.moneyNotAllowedOnBarterListing' };
    }
  }

  return { ok: true };
}

export function allowedSettlementModesForBarterOpenness(
  barterOpenness?: string | null,
): SettlementMode[] {
  const openness = normalizeBarterOpenness(barterOpenness);
  const all: SettlementMode[] = [
    'MONEY',
    'MONEY_AND_VALUE',
    'VALUE_ONLY',
    'FREE',
    'VOLUNTARY',
  ];
  if (openness === 'MONEY') {
    return all.filter((m) => !VALUE_SETTLEMENT.includes(m));
  }
  if (openness === 'BARTER_ONLY') {
    return all.filter((m) => !MONEY_SETTLEMENT.includes(m));
  }
  return all;
}

export function isBarterOpennessValue(
  raw: unknown,
): raw is BarterOpenness {
  const key = String(raw ?? '').toUpperCase();
  return key === 'MONEY' || key === 'MONEY_AND_BARTER' || key === 'BARTER_ONLY';
}
