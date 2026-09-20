import {
  fromCents,
  max0Scaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  ZT_MAX_INCOME_PARTNER_CENTS,
  ZT_MAX_INCOME_SINGLE_CENTS,
  ZT_PCT_ABOVE_THRESHOLD,
  ZT_PCT_THRESHOLD_PARTNER,
  ZT_PCT_THRESHOLD_SINGLE,
  ZT_STANDARD_PREMIUM_CENTS,
  ZT_THRESHOLD_CENTS,
} from '../rulesets/nl/2026/core-constants';

export type HealthcarePartnerInsurance = 'INSURED' | 'NOT_INSURED';

export function calculateHealthcareAllowance2026(input: {
  hasPartner: boolean;
  assessmentIncomeCents: number;
  partnerAssessmentIncomeCents?: number;
  partnerInsurance?: HealthcarePartnerInsurance;
}): number {
  const {
    hasPartner,
    assessmentIncomeCents,
    partnerAssessmentIncomeCents = 0,
    partnerInsurance = 'INSURED',
  } = input;
  if (!Number.isInteger(assessmentIncomeCents)) {
    throw new Error('assessmentIncomeCents must be integer cents');
  }
  if (!Number.isInteger(partnerAssessmentIncomeCents)) {
    throw new Error('partnerAssessmentIncomeCents must be integer cents');
  }
  if (assessmentIncomeCents < 0 || partnerAssessmentIncomeCents < 0) {
    throw new Error('assessment income must be >= 0');
  }

  const threshold = fromCents(ZT_THRESHOLD_CENTS);
  const premium = fromCents(ZT_STANDARD_PREMIUM_CENTS);

  if (!hasPartner) {
    if (assessmentIncomeCents > ZT_MAX_INCOME_SINGLE_CENTS) return 0;
    const toets = fromCents(assessmentIncomeCents);
    const above = max0Scaled(toets - threshold);
    const norm =
      mulRate(threshold, ZT_PCT_THRESHOLD_SINGLE.n, ZT_PCT_THRESHOLD_SINGLE.d) +
      mulRate(above, ZT_PCT_ABOVE_THRESHOLD.n, ZT_PCT_ABOVE_THRESHOLD.d);
    return toCentsRoundHalfUp(max0Scaled(premium - norm));
  }

  const jointCents = assessmentIncomeCents + partnerAssessmentIncomeCents;
  if (jointCents > ZT_MAX_INCOME_PARTNER_CENTS) return 0;
  const joint = fromCents(jointCents);
  const above = max0Scaled(joint - threshold);
  const norm =
    mulRate(threshold, ZT_PCT_THRESHOLD_PARTNER.n, ZT_PCT_THRESHOLD_PARTNER.d) +
    mulRate(above, ZT_PCT_ABOVE_THRESHOLD.n, ZT_PCT_ABOVE_THRESHOLD.d);
  let allowance = max0Scaled(premium + premium - norm);
  if (partnerInsurance === 'NOT_INSURED') {
    allowance = mulRate(allowance, BigInt(1), BigInt(2));
  }
  return toCentsRoundHalfUp(allowance);
}
