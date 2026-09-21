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
import type { PersonSituation } from '../../domain/person';
import type { TriState } from '../../domain/tri-state';

const BASE = {
  jurisdiction: 'NL' as const,
  year: 2026,
  conditions: {},
  blocking: false,
  dismissible: true,
  verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
};

export type TimedRule = GuidanceRule & { timing: GuidanceTiming };

/** NVWA registration is only executable once the company is inscribed at KVK. UNKNOWN ≠ YES. */
export function kvkSatisfiedForNvwaRegistration(alreadyKvkRegistered?: TriState): boolean {
  return alreadyKvkRegistered === 'YES';
}

export function nvwaRegistrationRules(input: {
  food: FoodActivityContext;
  kvkAssessment: KvkEntrepreneurshipAssessment;
  alreadyKvkRegistered?: TriState;
  personSituation?: PersonSituation | null;
}): TimedRule[] {
  if (!isFoodRoute(input.food.activityType)) return [];
  const likelyEntrepreneur =
    input.personSituation === 'EXISTING_ENTREPRENEUR' ||
    input.alreadyKvkRegistered === 'YES' ||
    input.kvkAssessment === 'CLEAR_REGISTRATION_INDICATION';
  const assessment = assessNvwaRegistration(input.food, { likelyEntrepreneur });
  const rules: TimedRule[] = [];

  if (assessment === 'NOT_REQUIRED_BASED_ON_ONE_OFF_FREQUENCY') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.nvwa.once_per_year',
      timing: 'LATER',
      severity: 'INFO',
      shortTitle: 'Bij één keer verkopen hoef je je meestal niet te melden bij de voedselautoriteit',
      shortText:
        'Je hoeft je op basis van deze eenmalige verkoop niet bij de voedselautoriteit te registreren. Je moet het eten wel veilig en hygiënisch bereiden en je klanten informeren over allergenen.',
      expandedExplanation:
        'Registratieplicht geldt voor levensmiddelenbedrijven, niet voor een omzetbedrag. De voedselautoriteit zegt dat je je niet hoeft te registreren als je één keer per jaar voedsel verkoopt. Ga je vaker of bedrijfsmatig verkopen, controleer dan of je je moet registreren.',
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

  if (assessment === 'NOT_REQUIRED_OCCASIONAL_NON_BUSINESS') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.nvwa.few_times_non_business',
      timing: 'LATER',
      severity: 'INFO',
      shortTitle: 'Bij een paar keer per jaar is meldplicht bij de voedselautoriteit meestal nog niet aan de orde',
      shortText:
        'De voedselautoriteit noemt als voorbeeld dat je geen ondernemer bent als je maar een paar keer per jaar voedsel verkoopt. Ga je vaker of bedrijfsmatig verkopen, controleer dan of je je moet registreren. Voedselveiligheid en allergenen blijven gelden.',
      expandedExplanation:
        'NVWA-registratie geldt voor levensmiddelenbedrijven. Frequentie alleen is geen wettelijk getal. HomeCheff verzint geen drempel in keren per jaar. Intentie is geen vrijstelling.',
      cta: {
        label: 'Bekijk wanneer registratie nodig is',
        href: SRC_NVWA_REGISTRATIE.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_REGISTRATIE.officialSource,
      officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
      recheckTrigger: 'FOOD_SELLING_FREQUENCY_CHANGED',
    });
  }

  if (assessment === 'REGISTRATION_REQUIRED') {
    const kvkReady = kvkSatisfiedForNvwaRegistration(input.alreadyKvkRegistered);
    if (kvkReady) {
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
    } else {
      rules.push({
        ...BASE,
        id: 'nl2026.food.nvwa.registration_required',
        timing: 'SOON',
        severity: 'CHECK',
        shortTitle: 'NVWA-registratie kan nodig worden',
        shortText:
          'Ga je structureler eten verkopen? Dan kunnen eerst een KVK-inschrijving en daarna registratie van je levensmiddelenactiviteit nodig zijn. VerdienCheck laat zien welke stap voor jouw situatie eerst komt.',
        expandedExplanation: `Om je levensmiddelenbedrijf bij de NVWA te registreren moet je bedrijf zijn ingeschreven bij de Kamer van Koophandel. NVWA-registratie loopt via ${NVWA_REGISTRATION_SYSTEM}. HomeCheff registreert niet namens jou en verzint geen automatische KVK-plicht.`,
        cta: {
          label: 'Bekijk de volgorde bij NVWA',
          href: SRC_NVWA_STAPPENPLAN.officialSourceUrl,
          kind: 'official',
        },
        officialSource: SRC_NVWA_STAPPENPLAN.officialSource,
        officialSourceUrl: SRC_NVWA_STAPPENPLAN.officialSourceUrl,
        recheckTrigger: 'NVWA_REGISTRATION_CHANGED',
      });
      if (input.food.nvwaRegistrationStatus !== 'YES') {
        const kvkIndicated = input.kvkAssessment === 'CLEAR_REGISTRATION_INDICATION';
        rules.push({
          ...BASE,
          id: 'nl2026.food.nvwa.needs_kvk_operational',
          timing: 'NOW',
          severity: kvkIndicated ? 'ACTION' : 'CHECK',
          shortTitle: kvkIndicated
            ? 'Regel eerst je inschrijving bij de Kamer van Koophandel'
            : 'Voor NVWA-registratie is een KVK-inschrijving nodig',
          shortText: kvkIndicated
            ? 'Je antwoorden passen bij de KVK-ondernemerscriteria. Schrijf je eerst in bij de Kamer van Koophandel. Daarna kun je je levensmiddelenactiviteit bij de NVWA registreren. HomeCheff schrijft niet namens jou in.'
            : 'Om je levensmiddelenbedrijf bij de NVWA te registreren moet je bedrijf bij de Kamer van Koophandel staan. Of je je nu moet inschrijven hangt af van de KVK-ondernemerscriteria. Eten verkopen maakt je niet automatisch ondernemer.',
          expandedExplanation:
            'NVWA gebruikt KVK operationeel voor registratie. Dat is iets anders dan de KVK-ondernemerscriteria zelf. HomeCheff zet je KVK-beoordeling niet automatisch op verplicht als die criteria nog niet vaststaan.',
          cta: {
            label: 'Bekijk de KVK-criteria',
            href: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
            kind: 'official',
          },
          officialSource: SRC_NVWA_REGISTRATIE.officialSource,
          officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
          recheckTrigger: 'KVK_STATUS_CHANGED',
        });
      }
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
      shortTitle: 'Controleer of je je bij de voedselautoriteit moet registreren',
      shortText:
        'Of registratie nodig is, hangt af van of je een levensmiddelenbedrijf / ondernemer bent, niet van een omzetbedrag. De voedselautoriteit noemt “een paar keer per jaar” als voorbeeld van geen ondernemer, en “meerdere keren per jaar” als je wel een bedrijf start.',
      expandedExplanation:
        'HomeCheff verzint geen getal voor “een paar keer”. Intentie is geen vrijstelling. Als je regelmatig of bedrijfsmatig eten verkoopt, is registratie wel aan de orde.',
      cta: {
        label: 'Bekijk wanneer registratie nodig is',
        href: SRC_NVWA_REGISTRATIE.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_REGISTRATIE.officialSource,
      officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
      recheckTrigger: 'FOOD_SELLING_FREQUENCY_CHANGED',
    });
  }

  return rules;
}

export function nvwaAssessmentFor(
  food: FoodActivityContext,
  operator?: { likelyEntrepreneur?: boolean },
): NvwaRegistrationAssessment {
  return assessNvwaRegistration(food, operator);
}
