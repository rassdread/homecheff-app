/**
 * Detail value exchange block plan — Phase 4C.
 * Wires Phase 4A contracts to detail surface tier.
 */

import type { MarketplaceTileModel } from '@/lib/marketplace/tiles/types';
import type { DesiredExchangeDetail } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import {
  buildBarterAcceptanceModel,
  resolvePaymentMethod,
} from '@/lib/marketplace/value-exchange';
import { PAYMENT_METHOD_REGISTRY } from '@/lib/marketplace/value-exchange/payment-methods';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';

const KEY = 'marketplace.detail.valueExchange';

export type DetailValueExchangeLine = {
  kind: 'payment' | 'accepted_category' | 'accepted_subcategory' | 'desired';
  emoji?: string;
  labelKey: string;
  description?: string;
  taxonomyId?: string;
};

export type DetailValueExchangeBlockPlan = {
  paymentMethod: string;
  paymentLabelKey: string;
  paymentEmoji: string;
  acceptedMainCategories: string[];
  acceptedSubcategories: Array<{ id: string; labelKey: string; emoji: string }>;
  desiredExchanges: DesiredExchangeDetail[];
  lines: DetailValueExchangeLine[];
};

export function buildDetailValueExchangeBlock(input: {
  listingKind: MarketplaceTileModel['listingKind'];
  marketplaceCategory: string | null;
  primarySpecializationId?: string | null;
  barterOpenness?: string | null;
  priceModel?: string | null;
  acceptedTaxonomyIds: string[];
  desiredExchanges?: DesiredExchangeDetail[];
}): DetailValueExchangeBlockPlan | null {
  if (input.listingKind === 'INSPIRATION') return null;

  const paymentId = resolvePaymentMethod({
    barterOpenness: input.barterOpenness,
    priceModel: input.priceModel,
  });
  const payment = PAYMENT_METHOD_REGISTRY[paymentId];

  const barter = buildBarterAcceptanceModel({
    barterOpenness: (input.barterOpenness ?? 'MONEY') as import('@prisma/client').BarterOpenness,
    acceptedTaxonomyIds: input.acceptedTaxonomyIds,
  });

  const acceptedSubcategories = input.acceptedTaxonomyIds
    .map((id) => {
      const item = getMarketplaceTaxonomyItem(id);
      if (!item) return null;
      return { id, labelKey: item.labelKey, emoji: item.icon };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const desired = input.desiredExchanges ?? [];
  const lines: DetailValueExchangeLine[] = [
    {
      kind: 'payment',
      emoji: payment.emoji,
      labelKey: payment.labelKey,
    },
  ];

  if (barter) {
    for (const cat of barter.acceptedMainCategories) {
      lines.push({
        kind: 'accepted_category',
        labelKey: `marketplace.valueExchange.categories.${cat.replace('HOME_', '').toLowerCase().replace('_', '')}`,
      });
    }
    for (const sub of acceptedSubcategories) {
      lines.push({
        kind: 'accepted_subcategory',
        labelKey: sub.labelKey,
        taxonomyId: sub.id,
      });
    }
  }

  for (const d of desired) {
    lines.push({
      kind: 'desired',
      labelKey: d.subcategoryLabelKey,
      description: d.description,
      taxonomyId: d.subcategoryId,
    });
  }

  return {
    paymentMethod: paymentId,
    paymentLabelKey: payment.labelKey,
    paymentEmoji: payment.emoji,
    acceptedMainCategories: barter?.acceptedMainCategories ?? [],
    acceptedSubcategories,
    desiredExchanges: desired,
    lines,
  };
}

export function valueExchangeSectionTitleKey(): string {
  return `${KEY}.title`;
}
