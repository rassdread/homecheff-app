/**
 * WIA / Wajong / ZW / WAO / WAZ — shared start primitives, separate scheme IDs.
 * No generic 70% rule. commercialResult is not UWV profit.
 */

import {
  emptyUwvDisabilityContext,
  needsWaitForUwvPermission,
  uwvBenefitProfitBasisCents,
  type UwvDisabilityContext,
  type UwvDisabilityScheme,
} from '../../domain/benefits';
import { isUnknown } from '../../domain/unknown';
import type { GuidanceRule } from '../types';
import {
  NL_2026_EFFECTIVE,
  SRC_UWV_DISABILITY,
  SRC_UWV_INKOMSTEN,
  SRC_UWV_STARTEN,
} from '../../rulesets/nl/2026/sources';
import {
  WIA_AVERAGE_PROFIT_REVIEW_AFTER_YEARS,
  WAJONG_WAO_WAZ_REVIEW_AFTER_YEARS,
} from '../../rulesets/nl/2026/benefit-guidance-parameters';

function base(scheme: UwvDisabilityScheme) {
  return {
    jurisdiction: 'NL' as const,
    year: 2026,
    conditions: { personSituation: scheme, benefitRoute: scheme },
    blocking: false,
    dismissible: true,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
  };
}

function discussRule(scheme: UwvDisabilityScheme): GuidanceRule {
  return {
    ...base(scheme),
    id: `nl2026.${scheme.toLowerCase()}.discuss_labour_expert`,
    severity: 'ACTION',
    shortTitle: 'Bespreek je plan met je arbeidsdeskundige voordat je begint',
    shortText:
      'Je kunt mogelijk vanuit je uitkering starten. UWV wil wel vooraf weten wat je van plan bent. Maak afspraken over het traject zelfstandig ondernemer.',
    expandedExplanation:
      'Na een onderzoeksperiode bespreek je of starten haalbaar is. Geef je besluit door. Geef een realistische schatting van je inkomen of winst. HomeCheff berekent je uitkering niet opnieuw.',
    cta: {
      label: 'Open UWV',
      href: SRC_UWV_DISABILITY.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_DISABILITY.officialSource,
    officialSourceUrl: SRC_UWV_DISABILITY.officialSourceUrl,
    recheckTrigger: 'UWV_ROUTE_SELECTED',
  };
}

function waitPermissionRule(scheme: UwvDisabilityScheme): GuidanceRule {
  return {
    ...base(scheme),
    id: `nl2026.${scheme.toLowerCase()}.wait_permission`,
    severity: 'ACTION',
    shortTitle: 'Wacht met bedrijfsactiviteiten tot UWV toestemming geeft',
    shortText:
      'Wil je een onderzoeksperiode of starterskrediet gebruiken? Wacht dan met bedrijfsactiviteiten. Zoek nog geen klanten of werknemers.',
    expandedExplanation:
      'HomeCheff blokkeert je listing niet namens UWV. Regel dit eerst met UWV voordat je begint.',
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

function incomeReportRule(scheme: UwvDisabilityScheme, ctx: UwvDisabilityContext): GuidanceRule {
  const zwViaWw = scheme === 'ZW' && ctx.zwOrigin === 'FROM_OR_AFTER_WW';
  const zwUnknown = scheme === 'ZW' && (ctx.zwOrigin == null || ctx.zwOrigin === 'UNKNOWN');
  if (zwUnknown) {
    return {
      ...base(scheme),
      id: `nl2026.zw.income_report_unknown_origin`,
      severity: 'CHECK',
      shortTitle: 'Vraag na hoe je inkomsten doorgeeft',
      shortText:
        'Bij Ziektewet tijdens of na WW kan de Inkomstenopgave gelden. We kiezen geen generieke meldroute zolang dat onbekend is.',
      expandedExplanation:
        'Geef commerciële internetverkopen en zelfstandig werk door als dat voor jouw Ziektewet-route geldt. Ook zonder KVK kunnen commerciële verkopen relevant zijn voor UWV.',
      cta: {
        label: 'Bekijk inkomsten doorgeven',
        href: SRC_UWV_INKOMSTEN.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_UWV_INKOMSTEN.officialSource,
      officialSourceUrl: SRC_UWV_INKOMSTEN.officialSourceUrl,
      recheckTrigger: 'INCOME_ESTIMATE_CHANGED',
    };
  }

  const path = zwViaWw
    ? 'Gebruik de Inkomstenopgave, omdat je Ziektewet tijdens of na WW loopt.'
    : 'Geef inkomsten binnen 1 week door. Wijzigt iets? Geef de wijziging binnen 2 dagen door.';

  return {
    ...base(scheme),
    id: `nl2026.${scheme.toLowerCase()}.income_report`,
    severity: 'ACTION',
    shortTitle: 'Geef inkomsten en wijzigingen door aan UWV',
    shortText: `${path} Ook commerciële internetverkopen tellen mee. Ook zonder KVK kunnen commerciële verkopen of betaald werk relevant zijn voor UWV.`,
    expandedExplanation:
      'UWV noemt onder meer zelfstandig ondernemerschap, betaald werk, klussen, oppassen, hobby’s en commerciële internetverkopen. HomeCheff-verkopen zijn commercieel; we zetten ze niet automatisch als privé-tweedehands. UWV kan eerst met een schatting van je winst werken. HomeCheff houdt je verkopen en kosten later voor je bij. Het UWV-winstbegrip is niet hetzelfde als je HomeCheff-resultaat.',
    cta: {
      label: 'Bekijk inkomsten doorgeven',
      href: SRC_UWV_INKOMSTEN.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_INKOMSTEN.officialSource,
    officialSourceUrl: SRC_UWV_INKOMSTEN.officialSourceUrl,
    recheckTrigger: 'INCOME_ESTIMATE_CHANGED',
  };
}

function profitEstimateRule(scheme: UwvDisabilityScheme): GuidanceRule {
  const unknown = isUnknown(uwvBenefitProfitBasisCents());
  return {
    ...base(scheme),
    id: `nl2026.${scheme.toLowerCase()}.profit_estimate`,
    severity: 'INFO',
    shortTitle: 'UWV kan eerst met een schatting van je winst werken',
    shortText:
      'Geef een realistische schatting door. Later volgt een definitieve uitkering op basis van winstcijfers die UWV van de Belastingdienst krijgt.',
    expandedExplanation: unknown
      ? 'UWV berekent winst als belastbare winst plus mkb-winstvrijstelling plus ondernemersaftrek. HomeCheff mapt je commercialResult daar in deze fase niet op. uwvBenefitProfitBasisCents blijft UNKNOWN tot een gecertificeerde adapter bestaat.'
      : 'UWV-winstbasis is bekend.',
    cta: {
      label: 'Open UWV',
      href: SRC_UWV_DISABILITY.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_UWV_DISABILITY.officialSource,
    officialSourceUrl: SRC_UWV_DISABILITY.officialSourceUrl,
    recheckTrigger: 'INCOME_ESTIMATE_CHANGED',
  };
}

function longTermInfo(scheme: UwvDisabilityScheme): GuidanceRule | null {
  if (scheme === 'WIA') {
    return {
      ...base(scheme),
      id: 'nl2026.wia.three_year_review',
      severity: 'INFO',
      shortTitle: 'Na 3 jaar kan UWV opnieuw kijken',
      shortText: `Na ${WIA_AVERAGE_PROFIT_REVIEW_AFTER_YEARS} jaar kan UWV bekijken of de uitkering moet stoppen, op basis van de gemiddelde winst in die jaren. Dat is geen voorspelling dat jouw WIA stopt.`,
      expandedExplanation:
        'HomeCheff voorspelt niet of je uitkering stopt. UWV beoordeelt dit later.',
      cta: {
        label: 'Open UWV',
        href: SRC_UWV_DISABILITY.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_UWV_DISABILITY.officialSource,
      officialSourceUrl: SRC_UWV_DISABILITY.officialSourceUrl,
      recheckTrigger: 'BENEFIT_STATUS_CHANGED',
    };
  }
  if (scheme === 'WAJONG') {
    return {
      ...base(scheme),
      id: 'nl2026.wajong.five_year_review',
      severity: 'INFO',
      shortTitle: 'Na 5 jaar kan UWV opnieuw kijken',
      shortText: `Na ${WAJONG_WAO_WAZ_REVIEW_AFTER_YEARS} jaar kan UWV kijken of Wajong stopt, op basis van de gemiddelde winst in de afgelopen 3 jaar. Dat is geen voorspelling. UWV bepaalt het effect; er is geen generieke kortingsregel.`,
      expandedExplanation:
        'Geen generieke verrekening van inkomsten. Vooraf bespreken, inkomsten melden, winstschatting, UWV bepaalt het effect, definitieve beoordeling achteraf.',
      cta: {
        label: 'Open UWV',
        href: SRC_UWV_DISABILITY.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_UWV_DISABILITY.officialSource,
      officialSourceUrl: SRC_UWV_DISABILITY.officialSourceUrl,
      recheckTrigger: 'BENEFIT_STATUS_CHANGED',
    };
  }
  if (scheme === 'WAO' || scheme === 'WAZ') {
    return {
      ...base(scheme),
      id: `nl2026.${scheme.toLowerCase()}.five_year_review`,
      severity: 'INFO',
      shortTitle: 'Na 5 jaar kan UWV de uitkering opnieuw beoordelen',
      shortText: `Na ${WAJONG_WAO_WAZ_REVIEW_AFTER_YEARS} jaar kan UWV kijken of de uitkering stopt of de arbeidsongeschiktheidsklasse definitief lager wordt, op basis van gemiddelde winst over 3 jaar. HomeCheff voorspelt dat niet.`,
      expandedExplanation:
        'Zelfde startstappen als andere arbeidsongeschiktheidsuitkeringen, maar dit blijft een eigen regeling.',
      cta: {
        label: 'Open UWV',
        href: SRC_UWV_DISABILITY.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_UWV_DISABILITY.officialSource,
      officialSourceUrl: SRC_UWV_DISABILITY.officialSourceUrl,
      recheckTrigger: 'BENEFIT_STATUS_CHANGED',
    };
  }
  return null;
}

export function uwvDisabilityGuidanceRules(
  ctx: UwvDisabilityContext,
): GuidanceRule[] {
  const scheme = ctx.scheme;
  const rules: GuidanceRule[] = [discussRule(scheme)];
  if (
    needsWaitForUwvPermission({
      routeFamily: scheme,
      disability: ctx,
    })
  ) {
    rules.push(waitPermissionRule(scheme));
  }
  rules.push(incomeReportRule(scheme, ctx));
  rules.push(profitEstimateRule(scheme));
  const later = longTermInfo(scheme);
  if (later) rules.push(later);
  return rules;
}

export function uwvDisabilityGuidanceForScheme(
  scheme: UwvDisabilityScheme,
  ctx?: Partial<UwvDisabilityContext>,
): GuidanceRule[] {
  return uwvDisabilityGuidanceRules({
    ...emptyUwvDisabilityContext(scheme),
    ...ctx,
    scheme,
  });
}
