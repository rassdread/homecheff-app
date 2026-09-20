/**
 * Primary UX copy. No legal thresholds. NL first.
 */

import type { ProceedSemantics } from './types';
import type { HomecheffGrowthIntent } from '../domain/growth-intent';
import type { BenefitRouteFamily } from '../domain/person';

export const PERSONAL_ROUTE_COPY = {
  tracking:
    'Wij houden je verkopen bij en laten het weten als er iets verandert. Je hoeft niet alles nu te weten.',
  laterSection: 'Wat kan later belangrijk worden?',
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
  foodCombinedTitle: 'Je verkoopt eten',
  foodCombinedBody:
    'Bereid het veilig en hygiënisch en vertel klanten welke allergenen erin zitten.',
  foodRegistrationExtra:
    'Je verkoopt meerdere keren per jaar. Meld je dan ook bij de voedselautoriteit (NVWA).',
  dac7Title: 'HomeCheff kan wettelijk verplicht zijn verkoopgegevens door te geven',
  dac7Body: 'Dat betekent niet automatisch dat je belasting moet betalen.',
  dac7Cta: 'Meer uitleg over platformrapportage',
  growthVat: 'Je verkoop groeit. Kijk daarom even of btw voor jou geldt.',
  growthNvwa:
    'Je verkoopt inmiddels vaker. Controleer of je je bij de voedselautoriteit (NVWA) moet melden.',
  korTitle: 'Kleineondernemersregeling (KOR) later bekijken',
  vatReviewTitle: 'Controleer later of btw voor jou geldt',
  nvwaOnceTitle:
    'Bij één keer verkopen hoef je je meestal niet te melden bij de voedselautoriteit (NVWA)',
  nvwaRequiredTitle: 'Meld je bij de voedselautoriteit (NVWA)',
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
      headline: 'Controleer eerst één stap voordat je begint.',
      summary: 'Er is één ding dat je nu moet nagaan bij UWV. Daarna kun je verder.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }

  if (input.benefitFamily === 'WW') {
    return {
      headline: 'Je kunt vanuit WW starten. Controleer eerst welke UWV-route bij je past.',
      summary: 'Eerst je uitkering. Daarna kijken we naar verkopen en wat je ongeveer overhoudt.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }
  if (input.benefitFamily === 'BIJSTAND') {
    return {
      headline:
        'Je gemeente kan je helpen om vanuit de bijstand te starten. Bespreek je plan eerst met de gemeente.',
      summary: PERSONAL_ROUTE_COPY.bijstandPlanHelp,
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
      headline: 'Controleer eerst één stap voordat je begint.',
      summary: 'Bespreek je plan met UWV. Daarna kijken we wat je via HomeCheff kunt doen.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }

  if (input.semantics === 'CHECK_FIRST') {
    return {
      headline: 'Controleer eerst één stap voordat je begint.',
      summary: 'Er is één ding dat je nu moet nagaan. Daarna kun je verder.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }

  if (input.foodMultiple && input.semantics === 'PROCEED_AFTER_ACTION') {
    return {
      headline: 'Je kunt verkopen, maar regel een paar praktische zaken.',
      summary: 'Begin met veilig werken en de stappen die nu nodig zijn. De rest komt later.',
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

  const trying = input.growth === 'TRYING_OUT' || input.growth === 'OCCASIONAL_EARNING';
  return {
    headline: 'Je kunt beginnen.',
    summary: trying
      ? 'Voor wat je nu wilt doen hoef je niet eerst alles over ondernemen te weten. HomeCheff helpt je als er later iets verandert.'
      : 'Begin met wat je kunt. HomeCheff laat zien wat verdienen voor jou betekent.',
    canStartMessage: 'Je kunt beginnen.',
  };
}
