/**
 * KOR: optional VAT exemption. Never “you must use KOR” and never tax-free income.
 */

import type { KorContext, KorOutcome } from '../../domain/kor';
import type { ThresholdEvent } from '../../domain/threshold-event';
import { isUnknown } from '../../domain/unknown';
import { KOR_MAX_RELEVANT_TURNOVER_CENTS } from '../../rulesets/nl/2026/business-guidance-parameters';
import {
  NL_2026_EFFECTIVE,
  SRC_KOR,
  SRC_KOR_AFMELDEN,
  SRC_KOR_VOORWAARDEN,
} from '../../rulesets/nl/2026/sources';
import type { GuidanceRule } from '../types';

export function evaluateKor(input: {
  context: KorContext;
  calendarYear: number;
}): { outcome: KorOutcome; thresholdEvent: ThresholdEvent } {
  const none: ThresholdEvent = {
    kind: 'KOR_20000',
    calendarYear: input.calendarYear,
    state: 'NONE',
  };
  const ctx = input.context;
  const current = ctx.currentYearRelevantTurnoverCents;
  const previous = ctx.previousYearRelevantTurnoverCents;

  if (
    ctx.establishedInNetherlands === 'UNKNOWN' ||
    ctx.activityEligibility === 'UNKNOWN' ||
    current == null ||
    isUnknown(current) ||
    previous == null ||
    isUnknown(previous)
  ) {
    return { outcome: 'REVIEW_REQUIRED', thresholdEvent: none };
  }
  if (ctx.establishedInNetherlands === 'NO' || ctx.activityEligibility === 'NOT_ELIGIBLE') {
    return { outcome: 'NOT_ELIGIBLE', thresholdEvent: none };
  }
  if (previous > KOR_MAX_RELEVANT_TURNOVER_CENTS) {
    return { outcome: 'NOT_ELIGIBLE', thresholdEvent: none };
  }
  if (current > KOR_MAX_RELEVANT_TURNOVER_CENTS) {
    return {
      outcome: ctx.currentlyParticipating === 'YES' ? 'ALREADY_PARTICIPATING' : 'NOT_ELIGIBLE',
      thresholdEvent: {
        kind: 'KOR_20000',
        calendarYear: input.calendarYear,
        state: 'EXCEEDED',
      },
    };
  }
  if (ctx.currentlyParticipating === 'YES') {
    return {
      outcome: 'ALREADY_PARTICIPATING',
      thresholdEvent:
        current === KOR_MAX_RELEVANT_TURNOVER_CENTS
          ? { kind: 'KOR_20000', calendarYear: input.calendarYear, state: 'REACHED' }
          : none,
    };
  }
  return {
    outcome: 'POTENTIALLY_ELIGIBLE',
    thresholdEvent:
      current === KOR_MAX_RELEVANT_TURNOVER_CENTS
        ? { kind: 'KOR_20000', calendarYear: input.calendarYear, state: 'REACHED' }
        : none,
  };
}

export function korGuidanceRules(input: {
  outcome: KorOutcome;
  thresholdEvent: ThresholdEvent;
}): GuidanceRule[] {
  const meta = {
    jurisdiction: 'NL' as const,
    year: 2026,
    conditions: {},
    blocking: false,
    dismissible: true,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
  };

  if (input.thresholdEvent.state === 'EXCEEDED' && input.outcome === 'ALREADY_PARTICIPATING') {
    return [
      {
        ...meta,
        id: 'nl2026.kor.exceeded',
        severity: 'ACTION',
        shortTitle: 'KOR-grens overschreden',
        shortText:
          'Je gaat over de KOR-grens. Vanaf deze verkoop kunnen de normale btw-regels gelden. Ook die overschrijdende verkoop valt niet meer onder de KOR-vrijstelling.',
        expandedExplanation:
          'KOR is een btw-vrijstelling, geen belastingvrije inkomstenregeling. De grens geldt voor je hele onderneming, niet per HomeCheff-activiteit.',
        cta: {
          label: 'Bekijk afmelden KOR',
          href: SRC_KOR_AFMELDEN.officialSourceUrl,
          kind: 'official',
        },
        officialSource: SRC_KOR_AFMELDEN.officialSource,
        officialSourceUrl: SRC_KOR_AFMELDEN.officialSourceUrl,
        recheckTrigger: 'KOR_STATUS_CHANGED',
      },
    ];
  }

  if (input.outcome === 'POTENTIALLY_ELIGIBLE') {
    return [
      {
        ...meta,
        id: 'nl2026.kor.potential',
        severity: 'INFO',
        shortTitle: 'KOR bekijken',
        shortText:
          'Blijf je met je onderneming onder de KOR-omzetgrens? Dan kun je mogelijk kiezen voor de KOR. HomeCheff zegt niet dat je de KOR moet gebruiken.',
        expandedExplanation:
          'Bij de KOR breng je geen btw in rekening, doe je meestal geen gewone btw-aangifte voor deze prestaties, en kun je btw op zakelijke kosten niet als voorbelasting aftrekken. KOR is geen belastingvrije inkomstenregeling.',
        cta: {
          label: 'Bekijk de KOR-voorwaarden',
          href: SRC_KOR_VOORWAARDEN.officialSourceUrl,
          kind: 'official',
        },
        officialSource: SRC_KOR.officialSource,
        officialSourceUrl: SRC_KOR.officialSourceUrl,
        recheckTrigger: 'TURNOVER_CHANGED',
      },
    ];
  }

  if (input.outcome === 'REVIEW_REQUIRED') {
    return [
      {
        ...meta,
        id: 'nl2026.kor.review',
        severity: 'CHECK',
        shortTitle: 'KOR nog niet te beoordelen',
        shortText:
          'We kunnen niet zeggen dat je onder de KOR-grens zit zolang omzet buiten HomeCheff onbekend is. KOR geldt voor je hele onderneming.',
        expandedExplanation:
          'HomeCheff-omzet alleen is niet genoeg. Tel relevante omzet van dezelfde ondernemer bij elkaar, ook buiten dit platform.',
        cta: {
          label: 'Bekijk hoe je omzet telt',
          href: SRC_KOR_VOORWAARDEN.officialSourceUrl,
          kind: 'official',
        },
        officialSource: SRC_KOR_VOORWAARDEN.officialSource,
        officialSourceUrl: SRC_KOR_VOORWAARDEN.officialSourceUrl,
        recheckTrigger: 'TURNOVER_CHANGED',
      },
    ];
  }

  return [];
}
