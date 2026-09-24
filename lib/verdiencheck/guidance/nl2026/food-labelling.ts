/**
 * Allergen, packaging and labelling guidance. LEGAL-2 remains allergen SoT.
 * Listing allergen info ≠ a legally complete physical label.
 */

import {
  isFoodRoute,
  prepackedLabelContext,
  SPECIAL_CATEGORY_NOT_SUPPORTED,
  PRIMARY_PRODUCTION_RULESET_NOT_CERTIFIED,
  assessAnimalOriginRecognition,
  type FoodActivityContext,
} from '../../domain/food-activity';
import type { GuidanceRule } from '../types';
import type { GuidanceTiming } from '../principles';
import {
  NL_2026_EFFECTIVE,
  SRC_NVWA_ALLERGENEN,
  SRC_NVWA_ALLERGENEN_ONVERPAKT,
  SRC_NVWA_ERKENNING,
  SRC_NVWA_ETIKET,
  SRC_NVWA_REGISTRATIE,
} from '../../rulesets/nl/2026/sources';
import { HOMECHEFF_ALLERGEN_CHANNEL } from '../../adapters/legal2-food';

const BASE = {
  jurisdiction: 'NL' as const,
  year: 2026,
  conditions: {},
  blocking: false,
  dismissible: true,
  verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
};

export type TimedRule = GuidanceRule & { timing: GuidanceTiming };

export function foodLabellingRules(food: FoodActivityContext): TimedRule[] {
  if (!isFoodRoute(food.activityType)) return [];
  const rules: TimedRule[] = [];
  const label = prepackedLabelContext(food.packagingMode);

  rules.push({
    ...BASE,
    id: 'nl2026.food.allergens.listing_before_purchase',
    timing: 'NOW',
    severity: 'ACTION',
    shortTitle: 'Vertel klanten welke allergenen in je eten zitten',
    shortText:
      'Vertel je klanten welke allergenen in je eten zitten. HomeCheff laat je die bij je gerecht invullen, vóór aankoop. Alleen achteraf vragen is niet genoeg.',
    expandedExplanation: `HomeCheff kiest schriftelijke informatie in de listing (${HOMECHEFF_ALLERGEN_CHANNEL}). Dat is de veiligere route voor een online marktplaats. Voor glutenbevattende granen en noten moet je de soort kunnen noemen. Listing-informatie is niet automatisch een wettelijk correct fysiek etiket.`,
    cta: {
      label: 'Bekijk allergenen',
      href: SRC_NVWA_ALLERGENEN.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_NVWA_ALLERGENEN_ONVERPAKT.officialSource,
    officialSourceUrl: SRC_NVWA_ALLERGENEN_ONVERPAKT.officialSourceUrl,
    recheckTrigger: 'ALLERGENS_CHANGED',
    platformObligation: { id: 'FOOD_ALLERGEN_CHECKOUT', enforced: false },
  });

  if (food.packagingMode === 'PREPACKED') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.label.prepacked',
      timing: 'NOW',
      severity: 'CHECK',
      shortTitle: 'Voor voorverpakt eten gelden extra etiketregels',
      shortText:
        'Voor voorverpakt eten gelden extra etiketregels. Allergenen in de listing zijn nog geen compleet etiket. HomeCheff heeft je etiket niet volledig gecontroleerd.',
      expandedExplanation: `Voedingswaarde: ${label.nutritionDeclarationRequirement} — geen generieke “altijd verplicht”. Voorzorgsallergenen (PAL) vanaf 2026: ${label.palStatus}. HomeCheff verzint geen “kan sporen bevatten”-tekst. listingAllergenInfoIsNotPhysicalLabel=${label.listingAllergenInfoIsNotPhysicalLabel}.`,
      cta: {
        label: 'Bekijk mijn etiket',
        href: SRC_NVWA_ETIKET.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_ETIKET.officialSource,
      officialSourceUrl: SRC_NVWA_ETIKET.officialSourceUrl,
      recheckTrigger: 'FOOD_PACKAGING_CHANGED',
    });
  } else if (food.packagingMode === 'UNPACKAGED') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.label.unpackaged',
      timing: 'SOON',
      severity: 'INFO',
      shortTitle: 'Onverpakt: allergenen staan in je listing',
      shortText:
        'Bij onverpakt eten moet de klant allergeneninformatie vóór aankoop kunnen zien. In de webshop zetten wij die in de listing.',
      expandedExplanation:
        'NVWA staat voor sommige fysieke verkoop mondelinge informatie toe. HomeCheff gebruikt dat niet als standaard voor de marktplaats.',
      cta: {
        label: 'Bekijk onverpakte allergenen',
        href: SRC_NVWA_ALLERGENEN_ONVERPAKT.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_ALLERGENEN_ONVERPAKT.officialSource,
      officialSourceUrl: SRC_NVWA_ALLERGENEN_ONVERPAKT.officialSourceUrl,
      recheckTrigger: 'FOOD_PACKAGING_CHANGED',
    });
  } else if (food.packagingMode === 'PREPACKED_FOR_DIRECT_SALE') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.label.ppds',
      timing: 'SOON',
      severity: 'CHECK',
      shortTitle: 'Verpakt voor directe verkoop heeft een eigen route',
      shortText:
        'Verpakking voor directe verkoop is niet hetzelfde als voorverpakt in de winkelzin. Controleer welke informatie je klant vóór aankoop nodig heeft.',
      expandedExplanation:
        'Geen boolean “heeft verpakking ja/nee”. HomeCheff toont allergenen in de listing.',
      cta: {
        label: 'Bekijk etiketregels',
        href: SRC_NVWA_ETIKET.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_ETIKET.officialSource,
      officialSourceUrl: SRC_NVWA_ETIKET.officialSourceUrl,
      recheckTrigger: 'FOOD_PACKAGING_CHANGED',
    });
  }

  const recognition = assessAnimalOriginRecognition(food);
  if (recognition === 'RECOGNITION_REVIEW_REQUIRED') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.animal.recognition_review',
      timing: 'SOON',
      severity: 'CHECK',
      shortTitle: 'Voor deze producten kan een NVWA-erkenning nodig zijn',
      shortText:
        'Voor deze producten kan naast registratie een NVWA-erkenning nodig zijn. Controleer dit bij NVWA. Dierlijke oorsprong betekent niet automatisch erkenning.',
      expandedExplanation:
        'Er bestaan uitzonderingen, bijvoorbeeld bij directe consumentenverkoop van maaltijden. HomeCheff beslist dat niet.',
      cta: {
        label: 'Bekijk erkenning',
        href: SRC_NVWA_ERKENNING.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_ERKENNING.officialSource,
      officialSourceUrl: SRC_NVWA_ERKENNING.officialSourceUrl,
      recheckTrigger: 'ANIMAL_ORIGIN_ACTIVITY_CHANGED',
    });
  } else if (recognition === 'REGISTRATION_MAY_BE_SUFFICIENT') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.animal.registration_may_suffice',
      timing: 'LATER',
      severity: 'INFO',
      shortTitle: 'Dierlijke producten: controleer of registratie volstaat',
      shortText:
        'Je verkoopt mogelijk producten van dierlijke oorsprong rechtstreeks aan klanten. Dat betekent niet automatisch dat je een erkenning nodig hebt. Controleer het bij twijfel.',
      expandedExplanation:
        'Geen containsMeat → recognitionRequired.',
      cta: {
        label: 'Bekijk erkenning',
        href: SRC_NVWA_ERKENNING.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_ERKENNING.officialSource,
      officialSourceUrl: SRC_NVWA_ERKENNING.officialSourceUrl,
      recheckTrigger: 'ANIMAL_ORIGIN_ACTIVITY_CHANGED',
    });
  }

  if (food.containsAlcohol === 'YES') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.alcohol.not_supported',
      timing: 'NOW',
      severity: 'INFO',
      shortTitle: 'Voor alcohol gelden extra regels',
      shortText:
        'Voor alcohol gelden extra regels die deze VerdienCheck nog niet beoordeelt.',
      expandedExplanation: `${SPECIAL_CATEGORY_NOT_SUPPORTED}. Geen wijziging van verkooplogica in deze fase.`,
      cta: { label: 'Later', kind: 'later' },
      officialSource: SRC_NVWA_ETIKET.officialSource,
      officialSourceUrl: SRC_NVWA_ETIKET.officialSourceUrl,
      recheckTrigger: 'FOOD_PRODUCT_CHANGED',
    });
  }

  if (food.isPrimaryProduction === 'YES') {
    rules.push({
      ...BASE,
      id: 'nl2026.food.primary.not_certified',
      timing: 'SOON',
      severity: 'CHECK',
      shortTitle: 'Voor primaire producten kijken we later verder',
      shortText:
        'Voor groente, fruit, eieren of zuivel uit eigen tuin gelden soms andere regels. We beoordelen dat in deze fase niet volledig.',
      expandedExplanation: `${PRIMARY_PRODUCTION_RULESET_NOT_CERTIFIED}. Geen algemene NVWA-vrijstelling.`,
      cta: {
        label: 'Bekijk NVWA-registratie',
        href: SRC_NVWA_REGISTRATIE.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_NVWA_REGISTRATIE.officialSource,
      officialSourceUrl: SRC_NVWA_REGISTRATIE.officialSourceUrl,
      recheckTrigger: 'FOOD_PRODUCT_CHANGED',
    });
  }

  return rules;
}
