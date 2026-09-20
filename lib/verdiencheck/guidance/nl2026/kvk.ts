/**
 * KVK guidance: accompany, do not police. No omzetdrempel. No isEntrepreneur.
 */

import {
  assessKvkEntrepreneurship,
  kvkRegistrationObliged,
  type KvkEntrepreneurshipAssessment,
  type KvkPrimaryCriteria,
  type KvkSupportingFactors,
} from '../../domain/kvk';
import type { TriState } from '../../domain/tri-state';
import type { GuidanceRule } from '../types';
import {
  SRC_KVK_INSCHRIJFDATUM,
  SRC_KVK_INSCHRIJVEN,
  NL_2026_EFFECTIVE,
} from '../../rulesets/nl/2026/sources';

export function evaluateKvkAssessment(input: {
  primary: KvkPrimaryCriteria;
  supporting: KvkSupportingFactors;
}): {
  assessment: KvkEntrepreneurshipAssessment;
  registrationObliged: ReturnType<typeof kvkRegistrationObliged>;
} {
  const assessment = assessKvkEntrepreneurship(input);
  return { assessment, registrationObliged: kvkRegistrationObliged(assessment) };
}

export function kvkGuidanceRules(
  assessment: KvkEntrepreneurshipAssessment,
  alreadyRegistered: TriState = 'UNKNOWN',
): GuidanceRule[] {
  const base = {
    jurisdiction: 'NL' as const,
    year: 2026,
    conditions: {},
    blocking: false,
    dismissible: true,
    recheckTrigger: 'KVK_STATUS_CHANGED' as const,
    officialSource: SRC_KVK_INSCHRIJVEN.officialSource,
    officialSourceUrl: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
  };

  if (assessment === 'CLEAR_REGISTRATION_INDICATION') {
    if (alreadyRegistered === 'YES') {
      return [
        {
          ...base,
          id: 'nl2026.kvk.already_registered',
          severity: 'INFO',
          shortTitle: 'Je hebt aangegeven dat je al bij KVK staat ingeschreven',
          shortText:
            'Je activiteit past bij de KVK-criteria, en je hebt aangegeven dat je al ingeschreven staat. HomeCheff zet daar geen extra startactie op.',
          expandedExplanation:
            'KVK kijkt naar zelfstandig leveren, geld verdienen, en regelmatig leveren aan anderen dan alleen familie of vrienden. Een bestaande inschrijving vervangt geen andere toets als je activiteit later wijzigt.',
          cta: {
            label: 'Bekijk wat KVK hierover zegt',
            href: SRC_KVK_INSCHRIJFDATUM.officialSourceUrl,
            kind: 'official',
          },
        },
      ];
    }
    return [
      {
        ...base,
        id: 'nl2026.kvk.registration_indication',
        severity: 'ACTION',
        shortTitle: 'Controleer je KVK-inschrijving',
        shortText:
          'Je antwoorden passen bij de KVK-criteria voor een onderneming. Controleer of je inschrijving regelt is. Schrijf in rond de start van je activiteit, niet pas bij een bepaald omzetbedrag.',
        expandedExplanation:
          'KVK kijkt naar zelfstandig leveren, geld verdienen, en regelmatig leveren aan anderen dan alleen familie of vrienden. HomeCheff bepaalt niet dat je ondernemer bent.',
        cta: {
          label: 'Bekijk wat KVK hierover zegt',
          href: SRC_KVK_INSCHRIJFDATUM.officialSourceUrl,
          kind: 'official',
        },
      },
    ];
  }

  if (assessment === 'CLEAR_NON_BUSINESS_INDICATION') {
    return [
      {
        ...base,
        id: 'nl2026.kvk.incidental',
        severity: 'INFO',
        shortTitle: 'Je kunt beginnen',
        shortText:
          'Op basis van wat je nu invult lijkt KVK nog niet duidelijk nodig. Als je regelmatig gaat verkopen of actief klanten gaat zoeken, controleren we dit opnieuw.',
        expandedExplanation:
          'Een eenmalige of hobbymatige verkoop is volgens KVK meestal geen onderneming. Dat zegt niets over inkomstenbelasting of btw.',
        cta: {
          label: 'Bekijk de KVK-criteria',
          href: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
          kind: 'official',
        },
      },
    ];
  }

  if (assessment === 'REVIEW_RECOMMENDED') {
    return [
      {
        ...base,
        id: 'nl2026.kvk.review',
        severity: 'CHECK',
        shortTitle: 'KVK kan relevant zijn',
        shortText:
          'KVK kan voor jouw situatie relevant zijn. Je antwoorden zijn nog gemengd. Controleer je situatie bij KVK.',
        expandedExplanation:
          'Twijfel je over een van de ondernemerscriteria? KVK heeft hulpvragen. HomeCheff geeft geen percentage-kans dat je ondernemer bent.',
        cta: {
          label: 'Controleer mijn situatie',
          href: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
          kind: 'official',
        },
      },
    ];
  }

  return [
    {
      ...base,
      id: 'nl2026.kvk.insufficient',
      severity: 'INFO',
      shortTitle: 'We hebben meer nodig voor KVK',
      shortText:
        'We kunnen nog niet zeggen of KVK speelt. Als je vaker gaat verkopen, bekijken we dit opnieuw.',
      expandedExplanation:
        'Zonder de drie KVK-hoofdcriteria doen we geen aanname. Geen omzetbedrag vervangt die criteria.',
      cta: {
        label: 'Bekijk de KVK-criteria',
        href: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
        kind: 'official',
      },
    },
  ];
}
