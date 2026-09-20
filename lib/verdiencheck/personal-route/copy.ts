/**
 * Primary UX copy. No legal thresholds. NL first.
 */

import type { ProceedSemantics } from './types';
import type { HomecheffGrowthIntent } from '../domain/growth-intent';
import type { BenefitRouteFamily } from '../domain/person';

export const PERSONAL_ROUTE_COPY = {
  tracking:
    'Wij houden je verkopen bij en laten het weten als er iets verandert. Je hoeft niet alles nu te weten.',
  growthReassurance:
    'Als je verkoop groeit, laat VerdienCheck zien wat later belangrijk wordt.',
  laterSection: 'Wat kan later belangrijk worden?',
  moreDetail: 'Meer uitleg',
  soonSection: 'Straks relevant',
  nowSection: 'Nu belangrijk',
  allDetails: 'Bekijk alle details',
  officialInfo: 'Bekijk officiële informatie',
  estimateYear: 'Schatting voor 2026.',
  disclaimer:
    'Dit is een schatting en persoonlijke uitleg op basis van wat je hebt ingevuld. Jij blijft verantwoordelijk voor wat je doorgeeft en regelt.',
  turnoverVsResult:
    'Omzet is wat klanten betalen. Resultaat is wat overblijft nadat je relevante kosten eraf haalt.',
  unknownFinancial: 'We kunnen het nog niet precies schatten.',
  foodCombinedTitle: 'Let bij eten op twee dingen',
  foodCombinedBody:
    'Bereid het veilig en hygiënisch en vertel klanten welke allergenen erin zitten.',
  foodRegistrationExtra:
    'Je verkoopt meerdere keren per jaar. Meld je dan ook bij de voedselautoriteit.',
  dac7Title: 'Als je verkoop groeit, kan HomeCheff verkoopgegevens moeten doorgeven',
  dac7Body: 'Dat betekent niet automatisch dat je belasting moet betalen.',
  dac7Cta: 'Meer uitleg over platformrapportage',
  growthVat: 'Als je verkoop groeit, kijk dan of btw voor jou speelt.',
  growthNvwa:
    'Als je vaker eten verkoopt, kijk dan of je je bij de voedselautoriteit moet melden.',
  korTitle: 'Kleineondernemersregeling later bekijken',
  vatReviewTitle: 'Later kun je kijken of btw voor jou speelt',
  nvwaOnceTitle: 'Bij één keer verkopen hoef je je meestal niet te melden bij de voedselautoriteit',
  nvwaRequiredTitle: 'Meld je nu bij de voedselautoriteit',
  kvkLaterTitle: 'Als je vaker gaat verkopen',
  kvkLaterBody:
    'Dan kijken we opnieuw of inschrijven bij de Kamer van Koophandel relevant wordt. Nu is dat meestal nog geen eerste stap.',
  growthBusiness: 'Je verkoop is gegroeid. Daardoor worden een paar zakelijke stappen relevant.',
  bijstandPlanHelp:
    'Wij kunnen de gegevens die je al hebt ingevuld later gebruiken om je plan overzichtelijk te maken.',
  sourceDetails: 'Waar komt dit vandaan?',
} as const;

export function headlineFor(input: {
  semantics: ProceedSemantics;
  benefitFamily: BenefitRouteFamily | null;
  growth: HomecheffGrowthIntent | null;
  foodMultiple: boolean;
  foodSold?: boolean;
  waitForPermission?: boolean;
}): { headline: string; summary: string; canStartMessage: string } {
  if (input.semantics === 'INSUFFICIENT_CONTEXT') {
    return {
      headline: 'Vertel eerst wat je wilt doen',
      summary: 'Met een paar antwoorden laten we zien wat dit voor jou betekent.',
      canStartMessage: 'We weten nog te weinig om te zeggen hoe je het best begint.',
    };
  }

  if (input.waitForPermission) {
    return {
      headline: 'Controleer dit eerst met UWV.',
      summary: 'Er is één ding dat je nu moet nagaan bij UWV. Daarna kun je verder.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }

  if (input.benefitFamily === 'WW') {
    return {
      headline: 'Controleer dit eerst met UWV.',
      summary: 'Bespreek je plan met UWV. Daarna kun je verder met verkopen.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }
  if (input.benefitFamily === 'BIJSTAND') {
    return {
      headline: 'Bespreek dit eerst met je gemeente.',
      summary: 'Je gemeente bepaalt de regels voor bijverdienen vanuit de bijstand.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }
  if (
    input.benefitFamily === 'WIA' ||
    input.benefitFamily === 'WAJONG' ||
    input.benefitFamily === 'ZW' ||
    input.benefitFamily === 'WAO' ||
    input.benefitFamily === 'WAZ'
  ) {
    return {
      headline: 'Controleer dit eerst met UWV.',
      summary: 'Bespreek je plan met UWV. Daarna kijken we wat je via HomeCheff kunt doen.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }

  if (input.semantics === 'CHECK_FIRST') {
    return {
      headline: 'Controleer eerst één stap.',
      summary: 'Er is één ding dat je nu moet nagaan. Daarna kun je verder.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }

  if (input.foodMultiple && input.semantics === 'PROCEED_AFTER_ACTION') {
    return {
      headline: 'Je kunt verkopen, maar regel nu deze praktische stap.',
      summary: 'Begin met veilig werken. De rest komt later.',
      canStartMessage: 'Je kunt beginnen. Regel daarnaast wat nu nodig is.',
    };
  }

  if (input.semantics === 'PROCEED_AFTER_ACTION') {
    return {
      headline: 'Je kunt beginnen. Regel daarnaast wat nu nodig is.',
      summary: 'Voor wat je nu wilt doen hoef je niet eerst alles over ondernemen te weten.',
      canStartMessage: 'Je kunt beginnen. Regel daarnaast wat nu nodig is.',
    };
  }

  if (input.foodSold) {
    return {
      headline: 'Je kunt beginnen.',
      summary:
        'Let bij eten meteen op deze twee dingen: veilig bereiden en allergenen duidelijk maken.',
      canStartMessage: 'Je kunt beginnen.',
    };
  }

  if (input.growth === 'TRYING_OUT') {
    return {
      headline: 'Je kunt het eerst proberen.',
      summary:
        'Je hoeft niet eerst alles over ondernemen te regelen. Als je vaker gaat verkopen, helpt HomeCheff je zien wat later belangrijk wordt.',
      canStartMessage: 'Je kunt beginnen.',
    };
  }

  return {
    headline: 'Je kunt beginnen.',
    summary: PERSONAL_ROUTE_COPY.growthReassurance,
    canStartMessage: 'Je kunt beginnen.',
  };
}
