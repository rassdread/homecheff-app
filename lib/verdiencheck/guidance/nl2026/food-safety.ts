/**
 * Food safety / hygiene / HACCP-plan guidance.
 * Safety rules apply at home and for one-off sales. No HACCP-certificate claim.
 */

import {
  isFoodRoute,
  type FoodActivityContext,
} from '../../domain/food-activity';
import type { GuidanceRule } from '../types';
import type { GuidanceTiming } from '../principles';
import {
  NL_2026_EFFECTIVE,
  SRC_NVWA_HACCP,
  SRC_NVWA_THUIS,
} from '../../rulesets/nl/2026/sources';
import { NVWA_TEMPERATURE_EXAMPLES } from '../../rulesets/nl/2026/food-guidance-parameters';

const BASE = {
  jurisdiction: 'NL' as const,
  year: 2026,
  conditions: {},
  blocking: false,
  dismissible: true,
  verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
};

export type TimedRule = GuidanceRule & { timing: GuidanceTiming };

export function foodSafetyRules(food: FoodActivityContext): TimedRule[] {
  if (!isFoodRoute(food.activityType)) return [];
  const rules: TimedRule[] = [];

  rules.push({
    ...BASE,
    id: 'nl2026.food.safety.hygiene_always',
    timing: 'NOW',
    severity: 'ACTION',
    shortTitle: 'Bereid je eten veilig en hygiënisch',
    shortText:
      food.preparationLocation === 'HOME'
        ? 'Ook als je vanuit huis verkoopt, gelden regels voor veilig en hygiënisch werken. Ook bij incidentele verkoop.'
        : 'Ook bij incidentele verkoop moet je veilig en hygiënisch werken.',
    expandedExplanation:
      'Let op persoonlijke hygiëne, een schone werkplek, rauw en bereid voedsel gescheiden, veilig bewaren, verhitten en koelen, en voorkom kruisbesmetting. Voedselveiligheid is iets anders dan NVWA-registratie.',
    cta: {
      label: 'Bekijk veilig werken vanuit huis',
      href: SRC_NVWA_THUIS.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_NVWA_THUIS.officialSource,
    officialSourceUrl: SRC_NVWA_THUIS.officialSourceUrl,
    recheckTrigger: 'FOOD_ACTIVITY_CHANGED',
  });

  if (food.sellingFrequency === 'MULTIPLE_TIMES_PER_YEAR') {
    if (food.foodSafetyPlanStatus === 'NOT_ARRANGED' || food.foodSafetyPlanStatus === 'UNKNOWN') {
      rules.push({
        ...BASE,
        id: 'nl2026.food.safety.plan_required',
        timing: 'NOW',
        severity: 'ACTION',
        shortTitle: 'Werk met een voedselveiligheidsplan of hygiënecode',
        shortText:
          'Verkoop je meerdere keren per jaar eten? Dan werk je met een voedselveiligheidsplan. Je hoeft dat plan niet altijd zelf te schrijven: je kunt een goedgekeurde hygiënecode voor je branche gebruiken.',
        expandedExplanation:
          'De verplichting is werken volgens HACCP of een goedgekeurde hygiënecode. HomeCheff eist geen HACCP-certificaat en kiest geen commerciële code voor je.',
        cta: {
          label: 'Bekijk HACCP',
          href: SRC_NVWA_HACCP.officialSourceUrl,
          kind: 'official',
        },
        officialSource: SRC_NVWA_HACCP.officialSource,
        officialSourceUrl: SRC_NVWA_HACCP.officialSourceUrl,
        recheckTrigger: 'FOOD_SAFETY_PLAN_CHANGED',
      });
    } else {
      rules.push({
        ...BASE,
        id: 'nl2026.food.safety.plan_in_place',
        timing: 'SOON',
        severity: 'INFO',
        shortTitle: 'Houd je voedselveiligheidsplan bij',
        shortText:
          food.foodSafetyPlanStatus === 'USING_APPROVED_HYGIENE_CODE'
            ? 'Je werkt met een goedgekeurde hygiënecode. Pas die toe op hoe jij thuis of in je keuken werkt.'
            : 'Je hebt een eigen HACCP-voedselveiligheidsplan. Houd het bij als je werkwijze verandert.',
        expandedExplanation:
          'Een plan of code is geen certificaat. NVWA houdt toezicht op hoe je werkt.',
        cta: {
          label: 'Bekijk HACCP',
          href: SRC_NVWA_HACCP.officialSourceUrl,
          kind: 'official',
        },
        officialSource: SRC_NVWA_HACCP.officialSource,
        officialSourceUrl: SRC_NVWA_HACCP.officialSourceUrl,
        recheckTrigger: 'FOOD_SAFETY_PLAN_CHANGED',
      });
    }
  } else if (food.sellingFrequency === 'A_FEW_TIMES_PER_YEAR') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.safety.plan_review',
      timing: 'SOON',
      severity: 'CHECK',
      shortTitle: 'Als je vaker of bedrijfsmatig verkoopt, werk dan met een voedselveiligheidsplan',
      shortText:
        'De voedselautoriteit vraagt een voedselveiligheidsplan of hygiënecode als je meerdere keren per jaar eten verkoopt. Bij een paar keer is dat nog geen startblokkade. Voedselveilig werken geldt wél.',
      expandedExplanation:
        'Dit is geen vrijstelling en geen getal van X keer. HomeCheff eist geen HACCP-certificaat.',
      cta: {
        label: 'Bekijk HACCP',
        href: SRC_NVWA_HACCP.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_HACCP.officialSource,
      officialSourceUrl: SRC_NVWA_HACCP.officialSourceUrl,
      recheckTrigger: 'FOOD_SAFETY_PLAN_CHANGED',
    });
  }

  rules.push({
    ...BASE,
    id: 'nl2026.food.safety.thermometer',
    timing: food.sellingFrequency === 'ONCE_PER_YEAR' ? 'SOON' : 'NOW',
    severity: 'CHECK',
    shortTitle: 'Gebruik een digitale steekthermometer',
    shortText:
      'Gebruik een digitale steekthermometer om temperaturen te controleren. Alleen het display van de koelkast is niet genoeg.',
    expandedExplanation: `Voorbeelden van NVWA: bederfelijke levensmiddelen onder ${NVWA_TEMPERATURE_EXAMPLES.perishableStorageBelowC.celsius}°C bewaren; kip boven ${NVWA_TEMPERATURE_EXAMPLES.chickenHeatingAboveC.celsius}°C verhitten. Dat geldt niet automatisch voor elk product. HomeCheff blokkeert je niet als je nog geen thermometer hebt.`,
    cta: {
      label: 'Bekijk temperatuur-uitleg',
      href: SRC_NVWA_THUIS.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_NVWA_THUIS.officialSource,
    officialSourceUrl: SRC_NVWA_THUIS.officialSourceUrl,
    recheckTrigger: 'FOOD_PRODUCT_CHANGED',
  });

  return rules;
}
