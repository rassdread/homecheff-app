/**
 * WW guidance — three official UWV routes only.
 * 29% is start-period-only. No generic WW reduction. No fictive-income calculator.
 */

import {
  needsWaitForUwvPermission,
  resolveWwStartRoute,
  emptyWwContext,
  type WwContext,
} from '../../domain/benefits';
import type { GuidanceRule } from '../types';
import {
  NL_2026_EFFECTIVE,
  SRC_UWV_STARTEN,
  SRC_UWV_STARTPERIODE,
  SRC_UWV_WW,
} from '../../rulesets/nl/2026/sources';
import { WW_START_PERIOD_REDUCTION_PERCENT } from '../../rulesets/nl/2026/benefit-guidance-parameters';

const BASE = {
  jurisdiction: 'NL' as const,
  year: 2026,
  conditions: { personSituation: 'WW' as const, benefitRoute: 'WW' as const },
  blocking: false,
  dismissible: true,
  verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
};

function discussRule(): GuidanceRule {
  return {
    ...BASE,
    id: 'nl2026.ww.discuss_before_start',
    severity: 'ACTION',
    shortTitle: 'Controleer eerst je start met UWV',
    shortText:
      'Je kunt mogelijk vanuit je WW starten. Bespreek je plan met UWV voordat je begint. Volg eerst de UWV-training over starten vanuit WW.',
    expandedExplanation:
      'UWV heeft drie routes: met startperiode, zonder startperiode, of zonder behoud van WW. HomeCheff kiest die route niet voor je. De UWV-training vervangt HomeCheff niet.',
    cta: {
      label: 'Open UWV',
      href: SRC_UWV_WW.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_WW.officialSource,
    officialSourceUrl: SRC_UWV_WW.officialSourceUrl,
    recheckTrigger: 'UWV_ROUTE_SELECTED',
  };
}

function waitPermissionRule(): GuidanceRule {
  return {
    ...BASE,
    id: 'nl2026.ww.wait_permission',
    severity: 'ACTION',
    shortTitle: 'Wacht op toestemming van UWV',
    shortText:
      'Wil je de startperiode gebruiken? Wacht met bedrijfsactiviteiten totdat UWV toestemming geeft. Zoek nog geen klanten of werknemers.',
    expandedExplanation:
      'UWV waarschuwt dat wie de startperiode, onderzoeksperiode of starterskrediet wil gebruiken, moet wachten tot er toestemming is. HomeCheff blokkeert je niet, maar dit moet je eerst met UWV regelen.',
    cta: {
      label: 'Open UWV',
      href: SRC_UWV_STARTEN.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_STARTEN.officialSource,
    officialSourceUrl: SRC_UWV_STARTEN.officialSourceUrl,
    recheckTrigger: 'UWV_PERMISSION_CHANGED',
  };
}

function startPeriodRule(ctx: WwContext): GuidanceRule {
  const supplement = ctx.startPeriod?.receivesUwvSupplement === 'YES';
  return {
    ...BASE,
    id: 'nl2026.ww.start_period',
    severity: 'ACTION',
    shortTitle: 'Tijdens de startperiode gelden speciale WW-regels',
    shortText: `Tijdens de UWV-startperiode is je WW ${WW_START_PERIOD_REDUCTION_PERCENT}% lager. Zelfstandige inkomsten worden in die periode niet met je WW verrekend.`,
    expandedExplanation: supplement
      ? `Tijdens de startperiode (maximaal 6 maanden, met toestemming van UWV) hoef je niet te solliciteren. Uren zelfstandig werk veranderen het WW-bedrag in die periode niet. De maandelijkse Inkomstenopgave blijft verplicht. Krijg je ook een toeslag van UWV? Die kan wél worden beïnvloed door inkomsten uit je bedrijf. Dat is iets anders dan zorg- of huurtoeslag van Dienst Toeslagen.`
      : `Tijdens de startperiode (maximaal 6 maanden, met toestemming van UWV) hoef je niet te solliciteren. Uren zelfstandig werk veranderen het WW-bedrag in die periode niet. De maandelijkse Inkomstenopgave blijft verplicht. Krijg je daarnaast een toeslag van UWV, dan kunnen inkomsten uit je bedrijf die UWV-toeslag wél beïnvloeden. Dat is iets anders dan zorg- of huurtoeslag.`,
    cta: {
      label: 'Bekijk de startperiode',
      href: SRC_UWV_STARTPERIODE.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_STARTPERIODE.officialSource,
    officialSourceUrl: SRC_UWV_STARTPERIODE.officialSourceUrl,
    recheckTrigger: 'START_PERIOD_STARTED',
  };
}

function formerEmployerRule(): GuidanceRule {
  return {
    ...BASE,
    id: 'nl2026.ww.start_period.former_employer',
    severity: 'ACTION',
    shortTitle: 'Geen opdracht voor je laatste werkgever',
    shortText:
      'Tijdens de startperiode mag je geen opdracht doen voor de werkgever die je heeft ontslagen. Doorgaan kan betekenen dat UWV tot het einde van de startperiode geen WW meer betaalt.',
    expandedExplanation:
      'Na de startperiode mag je volgens UWV wél voor je laatste werkgever werken. Dit geldt alleen tijdens de startperiode, niet voor iedere WW-situatie.',
    cta: {
      label: 'Bekijk de startperiode',
      href: SRC_UWV_STARTPERIODE.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_STARTPERIODE.officialSource,
    officialSourceUrl: SRC_UWV_STARTPERIODE.officialSourceUrl,
    recheckTrigger: 'UWV_ROUTE_SELECTED',
  };
}

function withoutStartPeriodRule(): GuidanceRule {
  return {
    ...BASE,
    id: 'nl2026.ww.without_start_period',
    severity: 'ACTION',
    shortTitle: 'Geef je start en je uren door aan UWV',
    shortText:
      'Start je zonder startperiode? Dan is UWV-toestemming voor het starten zelf niet nodig. Geef wel door dat je eigen bedrijf begint, vul je bedrijfsgegevens in bij “Ik ga weer werken”, en geef je uren door via de Inkomstenopgave.',
    expandedExplanation:
      'Je sollicitatieplicht blijft gelden voor de WW-uren. Uren voor zelfstandig werk zijn breder dan betaalde HomeCheff-orders: ook voorbereiding, administratie, inkoop, marketing en klantencontact kunnen meetellen. HomeCheff bouwt in deze fase nog geen urenregistratie.',
    cta: {
      label: 'Open UWV',
      href: SRC_UWV_WW.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_WW.officialSource,
    officialSourceUrl: SRC_UWV_WW.officialSourceUrl,
    recheckTrigger: 'SELF_EMPLOYMENT_HOURS_CHANGED',
  };
}

function withoutRetainingRule(): GuidanceRule {
  return {
    ...BASE,
    id: 'nl2026.ww.without_retaining',
    severity: 'CHECK',
    shortTitle: 'Starten zonder behoud van WW',
    shortText:
      'UWV berekent bij deze route een fictief inkomen. Als dat hoger is dan 87,5% van je WW-maandloon, kan je WW stoppen. HomeCheff rekent dat fictieve inkomen niet uit.',
    expandedExplanation:
      'Geef via “Wijziging doorgeven WW” door dat je eigen bedrijf begint, vul bedrijfsgegevens in bij “Ik ga weer werken”, en geef uren door via de Inkomstenopgave. Geen HomeCheff-resultaat vergelijken met 87,5% van je WW-maandloon: dat is niet dezelfde toets.',
    cta: {
      label: 'Open UWV',
      href: SRC_UWV_WW.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_WW.officialSource,
    officialSourceUrl: SRC_UWV_WW.officialSourceUrl,
    recheckTrigger: 'UWV_ROUTE_SELECTED',
  };
}

function postStartPeriodRule(): GuidanceRule {
  return {
    ...BASE,
    id: 'nl2026.ww.after_start_period',
    severity: 'INFO',
    shortTitle: 'Na de startperiode geef je je keuze door',
    shortText:
      'Geef na je startperiode aan UWV door hoe je verdergaat: volledig als zelfstandige, gedeeltelijk, of stoppen. HomeCheff kiest dat niet voor je.',
    expandedExplanation:
      'Of je daarna WW houdt en hoe hoog die is, hangt mede af van je keuze. Je leest dit in de UWV-training.',
    cta: {
      label: 'Bekijk de startperiode',
      href: SRC_UWV_STARTPERIODE.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_STARTPERIODE.officialSource,
    officialSourceUrl: SRC_UWV_STARTPERIODE.officialSourceUrl,
    recheckTrigger: 'START_PERIOD_ENDING',
  };
}

export function wwGuidanceRules(ctx: WwContext = emptyWwContext()): GuidanceRule[] {
  const rules: GuidanceRule[] = [discussRule()];
  const route = resolveWwStartRoute(ctx);

  if (needsWaitForUwvPermission({ routeFamily: 'WW', ww: ctx })) {
    rules.push(waitPermissionRule());
  }

  if (route === 'WW_START_PERIOD') {
    rules.push(startPeriodRule(ctx));
    if (ctx.startPeriod?.formerEmployerWorkPlanned === 'YES') {
      rules.push(formerEmployerRule());
    }
    rules.push(postStartPeriodRule());
  } else if (route === 'WW_START_WITHOUT_START_PERIOD') {
    rules.push(withoutStartPeriodRule());
  } else if (route === 'WW_START_WITHOUT_RETAINING_WW') {
    rules.push(withoutRetainingRule());
  }

  return rules;
}

export function wwReductionPercentForRoute(
  route: ReturnType<typeof resolveWwStartRoute>,
): number | null {
  if (route === 'WW_START_PERIOD') return WW_START_PERIOD_REDUCTION_PERCENT;
  return null;
}
