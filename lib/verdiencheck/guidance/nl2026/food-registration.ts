/**
 * NVWA registration guidance. Frequency, not revenue. Does not mutate KVK assessment.
 */

import type { KvkEntrepreneurshipAssessment } from '../../domain/kvk';
import {
  assessNvwaRegistration,
  isFoodRoute,
  type FoodActivityContext,
  type NvwaRegistrationAssessment,
} from '../../domain/food-activity';
import type { GuidanceRule } from '../types';
import type { GuidanceTiming } from '../principles';
import {
  NL_2026_EFFECTIVE,
  SRC_NVWA_REGISTRATIE,
  SRC_NVWA_STAPPENPLAN,
  SRC_KVK_INSCHRIJVEN,
} from '../../rulesets/nl/2026/sources';
import {
  NVWA_MIJNNVWA_TRANSITION_DATE,
  NVWA_REGISTRATION_SYSTEM,
} from '../../rulesets/nl/2026/food-guidance-parameters';

const BASE = {
  jurisdiction: 'NL' as const,
  year: 2026,
  conditions: {},
  blocking: false,
  dismissible: true,
  verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
};

export type TimedRule = GuidanceRule & { timing: GuidanceTiming };

export function nvwaRegistrationRules(input: {
  food: FoodActivityContext;
  kvkAssessment: KvkEntrepreneurshipAssessment;
}): TimedRule[] {
  if (!isFoodRoute(input.food.activityType)) return [];
  const assessment = assessNvwaRegistration(input.food);
  const rules: TimedRule[] = [];

  if (assessment === 'NOT_REQUIRED_BASED_ON_ONE_OFF_FREQUENCY') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.nvwa.once_per_year',
      timing: 'LATER',
      severity: 'INFO',
      shortTitle: 'NVWA-registratie is bij een eenmalige verkoop meestal niet nodig',
      shortText:
        'Je hoeft je op basis van deze eenmalige verkoop niet bij de NVWA te registreren. Je moet het eten wel veilig en hygiënisch bereiden en je klanten informeren over allergenen.',
      expandedExplanation:
        'NVWA-registratie hangt af van hoe vaak je voedsel verkoopt, niet van omzet of aantal porties. Als je later vaker gaat verkopen, kijken we dit opnieuw.',
      cta: {
        label: 'Bekijk het stappenplan',
        href: SRC_NVWA_STAPPENPLAN.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_STAPPENPLAN.officialSource,
      officialSourceUrl: SRC_NVWA_STAPPENPLAN.officialSourceUrl,
      recheckTrigger: 'FOOD_SELLING_FREQUENCY_CHANGED',
    });
  }

  if (assessment === 'REGISTRATION_REQUIRED') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.nvwa.registration_required',
      timing: 'NOW',
      severity: 'ACTION',
      shortTitle: 'Registreer je levensmiddelenbedrijf bij de NVWA',
      shortText:
        'Je verkoopt inmiddels vaker. Daardoor wordt NVWA-registratie relevant. Wil je meerdere keren per jaar eten verkopen? Dan moet je je levensmiddelenbedrijf bij de NVWA registreren. Dat doe je via MijnNVWA.',
      expandedExplanation: `Registratie loopt via ${NVWA_REGISTRATION_SYSTEM}. Vanaf ${NVWA_MIJNNVWA_TRANSITION_DATE} gebruikt NVWA MijnNVWA voor levensmiddelenregistratie. HomeCheff registreert niet namens jou.`,
      cta: {
        label: 'Bekijk wat ik moet regelen',
        href: SRC_NVWA_REGISTRATIE.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_REGISTRATIE.officialSource,
      officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
      recheckTrigger: 'NVWA_REGISTRATION_CHANGED',
    });
    if (
      input.kvkAssessment !== 'CLEAR_REGISTRATION_INDICATION' &&
      input.food.nvwaRegistrationStatus !== 'YES'
    ) {
      rules.push({
        ...BASE,
        id: 'nl2026.food.nvwa.needs_kvk_operational',
        timing: 'NOW',
        severity: 'CHECK',
        shortTitle: 'Voor NVWA-registratie heb je een KVK-inschrijving nodig',
        shortText:
          'Voor NVWA-registratie heb je een KVK-inschrijving nodig. Controleer daarom ook je KVK-situatie. HomeCheff zet je KVK-beoordeling niet automatisch op verplicht.',
        expandedExplanation:
          'NVWA gebruikt KVK operationeel. Dat is iets anders dan de KVK-ondernemerscriteria zelf. Food maakt je niet automatisch ondernemer voor KVK.',
        cta: {
          label: 'Bekijk KVK',
          href: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
          kind: 'official',
        },
        officialSource: SRC_NVWA_REGISTRATIE.officialSource,
        officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
        recheckTrigger: 'KVK_STATUS_CHANGED',
      });
    }
  }

  if (assessment === 'ALREADY_REGISTERED') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.nvwa.mijnNvwa_current',
      timing: 'SOON',
      severity: 'INFO',
      shortTitle: 'Controleer of je registratie in MijnNVWA actueel is',
      shortText:
        'Je zegt al geregistreerd te zijn. Controleer of je registratie in MijnNVWA actueel is en bevestig die ieder jaar.',
      expandedExplanation: `Wie vóór ${NVWA_MIJNNVWA_TRANSITION_DATE} was geregistreerd, moet zich opnieuw via MijnNVWA registreren. Wijzigingen in activiteiten geef je daar door.`,
      cta: {
        label: 'Open MijnNVWA-uitleg',
        href: SRC_NVWA_REGISTRATIE.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_REGISTRATIE.officialSource,
      officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
      recheckTrigger: 'NVWA_REGISTRATION_CHANGED',
    });
  }

  if (assessment === 'UNKNOWN' || assessment === 'REVIEW_REQUIRED') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.nvwa.review',
      timing: 'SOON',
      severity: 'CHECK',
      shortTitle: 'We kijken later of NVWA-registratie speelt',
      shortText:
        'Als je vaker gaat verkopen, controleren we of je je levensmiddelenbedrijf bij de NVWA moet registreren.',
      expandedExplanation:
        'Zonder duidelijke frequentie verzinnen we geen omzet- of portiesdrempel.',
      cta: {
        label: 'Bekijk het stappenplan',
        href: SRC_NVWA_STAPPENPLAN.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_STAPPENPLAN.officialSource,
      officialSourceUrl: SRC_NVWA_STAPPENPLAN.officialSourceUrl,
      recheckTrigger: 'FOOD_SELLING_FREQUENCY_CHANGED',
    });
  }

  return rules;
}

export function nvwaAssessmentFor(
  food: FoodActivityContext,
): NvwaRegistrationAssessment {
  return assessNvwaRegistration(food);
}
