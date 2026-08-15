/**
 * LEGAL-4A — DAC7 seller readiness labels (internal / admin only).
 * Not tax liability. Not LEGAL-1 trader status.
 */

import type { Dac7ActivityCategory } from '@/lib/compliance/dac7-activity';
import { isExcludedGoodsSeller } from '@/lib/compliance/dac7-threshold';
import type { Dac7GoodsYearTotals } from '@/lib/compliance/dac7-threshold';

export const DAC7_SELLER_READINESS_STATES = [
  'NOT_REPORTABLE_BY_ACTIVITY',
  'EXCLUDED_GOODS_SELLER',
  'POTENTIALLY_REPORTABLE',
  'IDENTITY_INCOMPLETE',
  'COUNSEL_REVIEW_REQUIRED',
] as const;

export type Dac7SellerReadinessState =
  (typeof DAC7_SELLER_READINESS_STATES)[number];

export function resolveDac7SellerReadiness(input: {
  primaryActivity: Dac7ActivityCategory;
  goodsTotals?: Dac7GoodsYearTotals | null;
  hasAmbiguousActivity: boolean;
  hasBarterWithoutCounselRule: boolean;
  identityCompletenessScore: number;
}): Dac7SellerReadinessState {
  if (input.hasBarterWithoutCounselRule || input.hasAmbiguousActivity) {
    return 'COUNSEL_REVIEW_REQUIRED';
  }

  if (input.primaryActivity === 'OTHER_NON_REPORTABLE_OR_REVIEW') {
    return 'COUNSEL_REVIEW_REQUIRED';
  }

  if (input.primaryActivity === 'GOODS' && input.goodsTotals) {
    if (
      isExcludedGoodsSeller({
        transactionCount: input.goodsTotals.transactionCount,
        netConsiderationCents: input.goodsTotals.netConsiderationCents,
      })
    ) {
      return 'EXCLUDED_GOODS_SELLER';
    }
    if (input.identityCompletenessScore < 0.4) {
      return 'IDENTITY_INCOMPLETE';
    }
    return 'POTENTIALLY_REPORTABLE';
  }

  if (input.primaryActivity === 'PERSONAL_SERVICE') {
    // Goods threshold does NOT apply.
    if (input.identityCompletenessScore < 0.4) {
      return 'IDENTITY_INCOMPLETE';
    }
    return 'POTENTIALLY_REPORTABLE';
  }

  return 'NOT_REPORTABLE_BY_ACTIVITY';
}
