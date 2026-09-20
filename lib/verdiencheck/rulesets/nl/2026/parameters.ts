import type { RuleParameter, RulePackStatus } from '../../types';
import { ROUNDING_STATUS, ROUNDING_STRATEGY } from '../../../math/scaled';
import * as C from './core-constants';
import { NL_2026_EFFECTIVE, SRC_AHK_2026, SRC_AK_2026, SRC_BOX1_2026, SRC_ROW, SRC_WZT_2026, SRC_ZORGTOESLAG_2026, SRC_ZVW_2026, SRC_HUURTOESLAG_WET_2026, SRC_KGB_WET_2026, SRC_KOT_STB_2026, SRC_IACK_2026, SRC_IACK_VOORWAARDEN_2026, SRC_IACK_ALGEMEEN, SRC_AOW_HEFFINGSKORTINGEN_2026, SRC_VOORLOPIGE_AANSLAG_2026 } from './sources';
import * as P from './personal-tax-parameters';
import { HOUSING_ALLOWANCE_PARAMETER_META } from './housing-allowance-parameters';
import { CHILD_BUDGET_PARAMETER_META } from './child-budget-parameters';
import { CHILDCARE_ALLOWANCE_PARAMETER_META } from './childcare-allowance-parameters';
import { BUSINESS_GUIDANCE_PARAMETER_META } from './business-guidance-parameters';
import { BENEFIT_GUIDANCE_PARAMETER_META } from './benefit-guidance-parameters';
import { FOOD_GUIDANCE_PARAMETER_META } from './food-guidance-parameters';

function param(
  value: unknown,
  source: { officialSource: string; officialSourceUrl: string },
  status: RulePackStatus | 'CERTIFIED_FOR_ASSUMPTION_MODE' = 'CERTIFIED',
): RuleParameter {
  return {
    value,
    officialSource: source.officialSource,
    officialSourceUrl: source.officialSourceUrl,
    effectiveFrom: NL_2026_EFFECTIVE.effectiveFrom,
    effectiveUntil: NL_2026_EFFECTIVE.effectiveUntil,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
    status: status === 'CERTIFIED_FOR_ASSUMPTION_MODE' ? 'CERTIFIED' : status,
  };
}

function fromMeta(
  record: Record<string, { value: unknown; officialSource: string; officialSourceUrl: string }>,
): Record<string, RuleParameter> {
  const out: Record<string, RuleParameter> = {};
  for (const [key, meta] of Object.entries(record)) {
    out[key] = param(meta.value, {
      officialSource: meta.officialSource,
      officialSourceUrl: meta.officialSourceUrl,
    });
  }
  return out;
}

export const NL_2026_PARAMETERS: Readonly<Record<string, RuleParameter>> = {
  'rounding.strategy': param(ROUNDING_STRATEGY, SRC_BOX1_2026),
  'rounding.status': param(ROUNDING_STATUS, SRC_BOX1_2026),
  'box1.bracket1.maxCents': param(C.BOX1_B1_MAX_CENTS, SRC_BOX1_2026),
  'box1.bracket1.rate': param(C.BOX1_B1_RATE, SRC_BOX1_2026),
  'box1.bracket2.maxCents': param(C.BOX1_B2_MAX_CENTS, SRC_BOX1_2026),
  'box1.bracket2.rate': param(C.BOX1_B2_RATE, SRC_BOX1_2026),
  'box1.bracket3.rate': param(C.BOX1_B3_RATE, SRC_BOX1_2026),
  'ahk.maxCents': param(C.AHK_MAX_CENTS, SRC_AHK_2026),
  'ahk.fullUntilCents': param(C.AHK_FULL_MAX_INCOME_CENTS, SRC_AHK_2026),
  'ahk.phaseoutRate': param(C.AHK_PHASEOUT_RATE, SRC_AHK_2026),
  'ahk.zeroFromCents': param(C.AHK_ZERO_FROM_CENTS, SRC_AHK_2026),
  'ak.t1.maxCents': param(C.AK_T1_MAX_CENTS, SRC_AK_2026),
  'ak.t1.rate': param(C.AK_T1_RATE, SRC_AK_2026),
  'ak.t2.baseCents': param(C.AK_T2_BASE_CENTS, SRC_AK_2026),
  'ak.t2.rate': param(C.AK_T2_RATE, SRC_AK_2026),
  'ak.t3.baseCents': param(C.AK_T3_BASE_CENTS, SRC_AK_2026),
  'ak.t3.rate': param(C.AK_T3_RATE, SRC_AK_2026),
  'ak.t4.baseCents': param(C.AK_T4_BASE_CENTS, SRC_AK_2026),
  'ak.t4.phaseoutRate': param(C.AK_T4_PHASEOUT_RATE, SRC_AK_2026),
  'ak.zeroFromCents': param(C.AK_ZERO_FROM_CENTS, SRC_AK_2026),
  'row.classification': param('RESULT_FROM_OTHER_WORK', SRC_ROW, 'CERTIFIED_FOR_ASSUMPTION_MODE'),
  'zvw.rate': param(C.ZVW_RATE, SRC_ZVW_2026),
  'zvw.maxContributionIncomeCents': param(C.ZVW_MAX_CONTRIBUTION_INCOME_CENTS, SRC_ZVW_2026),
  'zt.thresholdCents': param(C.ZT_THRESHOLD_CENTS, SRC_ZORGTOESLAG_2026),
  'zt.standardPremiumCents': param(C.ZT_STANDARD_PREMIUM_CENTS, SRC_ZORGTOESLAG_2026),
  'zt.pctThresholdSingle': param(C.ZT_PCT_THRESHOLD_SINGLE, SRC_ZORGTOESLAG_2026),
  'zt.pctThresholdPartner': param(C.ZT_PCT_THRESHOLD_PARTNER, SRC_ZORGTOESLAG_2026),
  'zt.pctAbove': param(C.ZT_PCT_ABOVE_THRESHOLD, SRC_ZORGTOESLAG_2026),
  'zt.maxIncomeSingleCents': param(C.ZT_MAX_INCOME_SINGLE_CENTS, SRC_ZORGTOESLAG_2026),
  'zt.maxIncomePartnerCents': param(C.ZT_MAX_INCOME_PARTNER_CENTS, SRC_ZORGTOESLAG_2026),
  'zt.assetsMaxSingleCents': param(C.ZT_ASSETS_MAX_SINGLE_CENTS, SRC_ZORGTOESLAG_2026),
  'zt.assetsMaxPartnerCents': param(C.ZT_ASSETS_MAX_PARTNER_CENTS, SRC_ZORGTOESLAG_2026),
  'zt.partnerNotInsuredShare': param({ n: BigInt(1), d: BigInt(2) }, SRC_WZT_2026),
  'rentAllowance': param('NL_2026_HOUSING_ALLOWANCE', SRC_HUURTOESLAG_WET_2026),
  'childBudget': param('NL_2026_CHILD_BUDGET', SRC_KGB_WET_2026),
  'childcareAllowance': param('NL_2026_CHILDCARE_ALLOWANCE', SRC_KOT_STB_2026),
  'iack.zeroThroughCents': param(P.IACK_ZERO_THROUGH_CENTS, SRC_IACK_2026),
  'iack.belowAow.rate': param(P.IACK_BELOW_AOW_RATE, SRC_IACK_2026),
  'iack.belowAow.maxCents': param(P.IACK_BELOW_AOW_MAX_CENTS, SRC_IACK_2026),
  'iack.fullYearAow.rate': param(P.IACK_FULL_YEAR_AOW_RATE, SRC_IACK_2026),
  'iack.fullYearAow.maxCents': param(P.IACK_FULL_YEAR_AOW_MAX_CENTS, SRC_IACK_2026),
  'iack.conditions': param('NL_2026_IACK_ELIGIBILITY', SRC_IACK_VOORWAARDEN_2026),
  'iack.equalIncomeTieBreak': param('OLDEST_PARTNER', SRC_IACK_ALGEMEEN),
  'box1.fullYearAow.rate': param(P.BOX1_AOW_RATE, SRC_BOX1_2026),
  'box1.fullYearAow.bornBefore1946.b1MaxCents': param(
    P.BOX1_AOW_BORN_BEFORE_1946_B1_MAX_CENTS,
    SRC_BOX1_2026,
  ),
  'box1.fullYearAow.bornOnOrAfter1946.b1MaxCents': param(
    P.BOX1_AOW_BORN_ON_OR_AFTER_1946_B1_MAX_CENTS,
    SRC_BOX1_2026,
  ),
  'box1.transition.schijf1RatesByMonth': param(
    P.BOX1_TRANSITION_SCHIJF1_RATE_BY_MONTH,
    SRC_BOX1_2026,
  ),
  'ahk.fullYearAow.maxCents': param(P.AHK_AOW_MAX_CENTS, SRC_AHK_2026),
  'ahk.fullYearAow.phaseoutRate': param(P.AHK_AOW_PHASEOUT_RATE, SRC_AHK_2026),
  'ak.fullYearAow.t1.rate': param(P.AK_AOW_T1_RATE, SRC_AK_2026),
  'ak.fullYearAow.t2.baseCents': param(P.AK_AOW_T2_BASE_CENTS, SRC_AK_2026),
  'ak.fullYearAow.t4.baseCents': param(P.AK_AOW_T4_BASE_CENTS, SRC_AK_2026),
  'olderPersonsTaxCredit.maxCents': param(P.OUDERENKORTING_MAX_CENTS, SRC_AOW_HEFFINGSKORTINGEN_2026),
  'olderPersonsTaxCredit.fullUntilCents': param(
    P.OUDERENKORTING_FULL_UNTIL_CENTS,
    SRC_AOW_HEFFINGSKORTINGEN_2026,
  ),
  'olderPersonsTaxCredit.phaseoutRate': param(
    P.OUDERENKORTING_PHASEOUT_RATE,
    SRC_AOW_HEFFINGSKORTINGEN_2026,
  ),
  'singleOlderPersonsTaxCredit.cents': param(
    P.ALLEENSTAANDE_OUDERENKORTING_CENTS,
    SRC_AOW_HEFFINGSKORTINGEN_2026,
  ),
  'aow.transitionYearCredits': param(
    'OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED',
    SRC_VOORLOPIGE_AANSLAG_2026,
    'DRAFT',
  ),
  'jonggehandicaptenkorting.cents': param(P.JONGGEHANDICAPTENKORTING_CENTS, SRC_AOW_HEFFINGSKORTINGEN_2026, 'DRAFT'),
  ...fromMeta(HOUSING_ALLOWANCE_PARAMETER_META),
  ...fromMeta(CHILD_BUDGET_PARAMETER_META),
  ...fromMeta(CHILDCARE_ALLOWANCE_PARAMETER_META),
  ...fromMeta(BUSINESS_GUIDANCE_PARAMETER_META),
  ...fromMeta(BENEFIT_GUIDANCE_PARAMETER_META),
  ...fromMeta(FOOD_GUIDANCE_PARAMETER_META),
};
