/**
 * Seller-facing DAC7 guidance. Reporting ≠ tax payable.
 * Goods exclusion uses LEGAL-4A; never applied to personal services.
 */

import {
  goodsExclusionAppliesToSellerCategory,
  isExcludedGoodsSeller,
} from '../../adapters/dac7-readiness';
import {
  DAC7_NOT_A_TAX_JUDGMENT,
  type Dac7ReportingContext,
  type Dac7ReportingStatus,
} from '../../domain/dac7';
import { NL_2026_EFFECTIVE, SRC_DAC7_VERKOPER } from '../../rulesets/nl/2026/sources';
import type { GuidanceRule } from '../types';

export function evaluateDac7SellerReporting(
  ctx: Dac7ReportingContext,
): Dac7ReportingStatus {
  if (ctx.transactionCount == null || ctx.considerationCents == null) {
    return 'NOT_ASSESSED';
  }
  if (ctx.activityCategory === 'OTHER_OR_UNKNOWN') return 'REVIEW_REQUIRED';
  if (ctx.activityCategory === 'SALE_OF_GOODS') {
    if (!goodsExclusionAppliesToSellerCategory(ctx.activityCategory)) {
      return 'REVIEW_REQUIRED';
    }
    const excluded = isExcludedGoodsSeller({
      transactionCount: ctx.transactionCount,
      netConsiderationCents: ctx.considerationCents,
    });
    return excluded ? 'GOODS_EXCLUSION_MAY_APPLY' : 'POTENTIALLY_REPORTABLE';
  }
  if (ctx.activityCategory === 'PERSONAL_SERVICE') {
    return 'POTENTIALLY_REPORTABLE';
  }
  return 'REVIEW_REQUIRED';
}

export function dac7GuidanceRules(input: {
  status: Dac7ReportingStatus;
}): GuidanceRule[] {
  const meta = {
    jurisdiction: 'NL' as const,
    year: 2026,
    conditions: {},
    blocking: false,
    dismissible: true,
    officialSource: SRC_DAC7_VERKOPER.officialSource,
    officialSourceUrl: SRC_DAC7_VERKOPER.officialSourceUrl,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
    recheckTrigger: 'TRANSACTION_COUNT_CHANGED' as const,
  };

  if (input.status === 'POTENTIALLY_REPORTABLE') {
    return [
      {
        ...meta,
        id: 'nl2026.dac7.reportable',
        severity: 'INFO',
        shortTitle: 'Platformrapportage',
        shortText: `HomeCheff kan verplicht zijn gegevens over je verkopen door te geven aan de Belastingdienst. ${DAC7_NOT_A_TAX_JUDGMENT}`,
        expandedExplanation: DAC7_NOT_A_TAX_JUDGMENT,
        cta: {
          label: 'Wat betekent DAC7 voor verkopers?',
          href: SRC_DAC7_VERKOPER.officialSourceUrl,
          kind: 'official',
        },
      },
    ];
  }

  if (input.status === 'GOODS_EXCLUSION_MAY_APPLY') {
    return [
      {
        ...meta,
        id: 'nl2026.dac7.goods_exclusion',
        severity: 'INFO',
        shortTitle: 'Mogelijke DAC7-uitzondering voor goederen',
        shortText:
          'Voor deze DAC7-platformrapportage val je op basis van deze verkopen mogelijk onder de uitzondering. Dat zegt niets over of je belasting moet betalen.',
        expandedExplanation: DAC7_NOT_A_TAX_JUDGMENT,
        cta: {
          label: 'Bekijk informatie voor verkopers',
          href: SRC_DAC7_VERKOPER.officialSourceUrl,
          kind: 'official',
        },
      },
    ];
  }

  return [];
}
