/**
 * VAT registration threshold €2.200 — not KVK, not income tax, not DAC7, not profit.
 */

import type { ThresholdEvent } from '../../domain/threshold-event';
import {
  assessVatEntrepreneurship,
  totalRelevantVatTurnoverCents,
  type VatEntrepreneurshipAssessment,
  type VatEntrepreneurshipContext,
  type VatRegistrationThresholdEligibility,
  type VatTurnoverInput,
} from '../../domain/vat';
import type { TriState } from '../../domain/tri-state';
import { isUnknown } from '../../domain/unknown';
import { VAT_REGISTRATION_THRESHOLD_CENTS } from '../../rulesets/nl/2026/business-guidance-parameters';
import {
  NL_2026_EFFECTIVE,
  SRC_BTW_ONDERNEMER,
  SRC_BTW_REGISTRATIEDREMPEL,
} from '../../rulesets/nl/2026/sources';
import type { GuidanceRule } from '../types';

export function evaluateVatRegistrationThreshold(input: {
  vatAssessment: VatEntrepreneurshipAssessment;
  kvkRegistrationObliged: TriState;
  alreadyVatRegistered: TriState;
  turnover: VatTurnoverInput;
  calendarYear: number;
}): {
  eligibility: VatRegistrationThresholdEligibility;
  thresholdEvent: ThresholdEvent;
  totalTurnoverCents: ReturnType<typeof totalRelevantVatTurnoverCents>;
} {
  const total = totalRelevantVatTurnoverCents(input.turnover);
  const none: ThresholdEvent = {
    kind: 'VAT_REGISTRATION_2200',
    calendarYear: input.calendarYear,
    state: 'NONE',
  };

  if (input.vatAssessment !== 'CLEAR_VAT_ENTREPRENEUR_INDICATION') {
    return {
      eligibility:
        input.vatAssessment === 'CLEAR_NON_VAT_ENTREPRENEUR_INDICATION'
          ? 'NOT_ELIGIBLE'
          : 'UNKNOWN',
      thresholdEvent: none,
      totalTurnoverCents: total,
    };
  }
  if (input.alreadyVatRegistered === 'YES') {
    return { eligibility: 'NOT_ELIGIBLE', thresholdEvent: none, totalTurnoverCents: total };
  }
  if (input.kvkRegistrationObliged === 'YES') {
    return { eligibility: 'NOT_ELIGIBLE', thresholdEvent: none, totalTurnoverCents: total };
  }
  if (input.kvkRegistrationObliged === 'UNKNOWN' || isUnknown(total)) {
    return { eligibility: 'UNKNOWN', thresholdEvent: none, totalTurnoverCents: total };
  }
  if (total > VAT_REGISTRATION_THRESHOLD_CENTS) {
    return {
      eligibility: 'NOT_ELIGIBLE',
      thresholdEvent: {
        kind: 'VAT_REGISTRATION_2200',
        calendarYear: input.calendarYear,
        state: 'EXCEEDED',
      },
      totalTurnoverCents: total,
    };
  }
  return {
    eligibility: 'ELIGIBLE',
    thresholdEvent: {
      kind: 'VAT_REGISTRATION_2200',
      calendarYear: input.calendarYear,
      state: total === VAT_REGISTRATION_THRESHOLD_CENTS ? 'REACHED' : 'NONE',
    },
    totalTurnoverCents: total,
  };
}

export function vatGuidanceRules(input: {
  vatAssessment: VatEntrepreneurshipAssessment;
  eligibility: VatRegistrationThresholdEligibility;
  thresholdEvent: ThresholdEvent;
}): GuidanceRule[] {
  const rules: GuidanceRule[] = [];
  const meta = {
    jurisdiction: 'NL' as const,
    year: 2026,
    conditions: {},
    blocking: false,
    dismissible: true,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
  };

  if (input.vatAssessment === 'VAT_ENTREPRENEURSHIP_REVIEW_REQUIRED') {
    rules.push({
      ...meta,
      id: 'nl2026.vat.entrepreneurship_review',
      severity: 'CHECK',
      shortTitle: 'Btw-ondernemerschap apart bekijken',
      shortText:
        'Of je ondernemer bent voor de btw beoordeelt de Belastingdienst apart van KVK. We kunnen dat nu nog niet afronden.',
      expandedExplanation:
        'KVK-inschrijving betekent niet automatisch dat je btw-ondernemer bent, en omgekeerd ook niet.',
      cta: {
        label: 'Bekijk ondernemer voor de btw',
        href: SRC_BTW_ONDERNEMER.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_BTW_ONDERNEMER.officialSource,
      officialSourceUrl: SRC_BTW_ONDERNEMER.officialSourceUrl,
      recheckTrigger: 'VAT_STATUS_CHANGED',
    });
  }

  if (input.thresholdEvent.state === 'EXCEEDED') {
    rules.push({
      ...meta,
      id: 'nl2026.vat.registration_exceeded',
      severity: 'ACTION',
      shortTitle: 'Kleine btw-registratiedrempel overschreden',
      shortText:
        'Je omzet komt boven de kleine btw-registratiedrempel. Vanaf de verkoop waarmee je eroverheen gaat kunnen de normale btw-regels gelden. Controleer je btw-registratie.',
      expandedExplanation:
        'Dit is geen inkomstenbelastinggrens en geen KVK-grens. Het gaat om btw-omzet in het kalenderjaar, niet om je winst.',
      cta: {
        label: 'Bekijk de registratiedrempel',
        href: SRC_BTW_REGISTRATIEDREMPEL.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_BTW_REGISTRATIEDREMPEL.officialSource,
      officialSourceUrl: SRC_BTW_REGISTRATIEDREMPEL.officialSourceUrl,
      recheckTrigger: 'TURNOVER_CHANGED',
    });
    return rules;
  }

  if (input.eligibility === 'ELIGIBLE') {
    rules.push({
      ...meta,
      id: 'nl2026.vat.registration_possible',
      severity: 'INFO',
      shortTitle: 'Mogelijk kleine btw-registratiedrempel',
      shortText:
        'Je omzet is nog klein. Mogelijk hoef je je nog niet apart voor btw te registreren. Dit geldt alleen in specifieke situaties.',
      expandedExplanation:
        'Alleen als je btw-ondernemer bent, je omzet in het kalenderjaar maximaal de drempel is, en je niet verplicht bent je bij KVK in te schrijven.',
      cta: {
        label: 'Bekijk de voorwaarden',
        href: SRC_BTW_REGISTRATIEDREMPEL.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_BTW_REGISTRATIEDREMPEL.officialSource,
      officialSourceUrl: SRC_BTW_REGISTRATIEDREMPEL.officialSourceUrl,
      recheckTrigger: 'TURNOVER_CHANGED',
    });
  }

  return rules;
}

export function assessVatFromContext(ctx: VatEntrepreneurshipContext): VatEntrepreneurshipAssessment {
  return assessVatEntrepreneurship(ctx);
}
