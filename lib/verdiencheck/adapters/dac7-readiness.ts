/**
 * Adapter to existing LEGAL-4A DAC7 platform compliance.
 * Does not replace collection/reporting logic. Seller guidance only.
 */

import {
  classifyDac7ActivityFromMarketplaceCategory,
  goodsThresholdAppliesToCategory,
  type Dac7ActivityCategory,
} from '../../compliance/dac7-activity';
import { resolveDac7SellerReadiness } from '../../compliance/dac7-readiness';
import {
  DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
  DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE,
  isExcludedGoodsSeller,
} from '../../compliance/dac7-threshold';
import type { Dac7SellerActivityCategory } from '../domain/dac7';

export {
  classifyDac7ActivityFromMarketplaceCategory,
  goodsThresholdAppliesToCategory,
  resolveDac7SellerReadiness,
  isExcludedGoodsSeller,
  DAC7_GOODS_MAX_CONSIDERATION_CENTS_INCLUSIVE,
  DAC7_GOODS_MAX_TRANSACTIONS_EXCLUSIVE,
};

export function toLegal4aActivityCategory(
  category: Dac7SellerActivityCategory,
): Dac7ActivityCategory {
  if (category === 'SALE_OF_GOODS') return 'GOODS';
  if (category === 'PERSONAL_SERVICE') return 'PERSONAL_SERVICE';
  return 'OTHER_NON_REPORTABLE_OR_REVIEW';
}

export function goodsExclusionAppliesToSellerCategory(
  category: Dac7SellerActivityCategory,
): boolean {
  return goodsThresholdAppliesToCategory(toLegal4aActivityCategory(category));
}
