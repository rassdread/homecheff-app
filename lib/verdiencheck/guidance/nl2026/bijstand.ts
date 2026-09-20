/**
 * Bijstand / Bbz guidance. Municipality decides. No national safe-earnings rule.
 */

import {
  emptyBijstandContext,
  MUNICIPAL_BBZ_REVIEW_REQUIRED,
  type BijstandContext,
} from '../../domain/benefits';
import type { GuidanceRule } from '../types';
import {
  NL_2026_EFFECTIVE,
  SRC_RIJK_BBZ_KAPITAAL,
  SRC_RIJK_BBZ_REGELS,
  SRC_RIJK_BIJSTAND_START,
} from '../../rulesets/nl/2026/sources';
import { BBZ_STARTER_CREDIT_MAX_CENTS_2026 } from '../../rulesets/nl/2026/benefit-guidance-parameters';

const BASE = {
  jurisdiction: 'NL' as const,
  year: 2026,
  conditions: { personSituation: 'BIJSTAND' as const, benefitRoute: 'BIJSTAND' as const },
  blocking: false,
  dismissible: true,
  verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
};

export function bijstandGuidanceRules(
  ctx: BijstandContext = emptyBijstandContext(),
): GuidanceRule[] {
  const rules: GuidanceRule[] = [
    {
      ...BASE,
      id: 'nl2026.bijstand.discuss_municipality',
      severity: 'ACTION',
      shortTitle: 'Bespreek je plan eerst met je gemeente',
      shortText:
        'Je gemeente kan je mogelijk helpen om vanuit de bijstand te starten. De gemeente beslist, niet HomeCheff. Er is geen landelijk bedrag dat je “gewoon” mag bijverdienen.',
      expandedExplanation:
        ctx.municipality.municipalityKnown && ctx.municipality.municipalityName
          ? `Voor ${ctx.municipality.municipalityName} kennen we het lokale beleid niet als landelijke regel. Vraag je gemeente naar de voorbereidingsperiode en Bbz.`
          : 'Niet iedere gemeente heeft dezelfde regels. HomeCheff raadt geen lokaal beleid. Vraag je gemeente naar een voorbereidingsperiode of Bbz.',
      cta: {
        label: 'Bekijk wat ik kan meenemen naar mijn gemeente',
        href: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_RIJK_BIJSTAND_START.officialSource,
      officialSourceUrl: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
      recheckTrigger: 'MUNICIPALITY_CHANGED',
    },
  ];

  if (ctx.municipality.localPolicyStatus === 'UNKNOWN' || !ctx.municipality.municipalityKnown) {
    rules.push({
      ...BASE,
      id: 'nl2026.bijstand.local_policy_unknown',
      severity: 'CHECK',
      shortTitle: 'Lokaal beleid vragen we na bij de gemeente',
      shortText:
        'Ook als je gemeente bekend is, behandelen we lokale regels als onbekend tot een gemeente-ruleset bestaat.',
      expandedExplanation:
        'Geen hardcoded gemeenteregel als Nederlandse hoofdregel. Later kan een municipality-ruleset worden toegevoegd.',
      cta: {
        label: 'Bekijk de landelijke Bbz-uitleg',
        href: SRC_RIJK_BBZ_REGELS.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_RIJK_BBZ_REGELS.officialSource,
      officialSourceUrl: SRC_RIJK_BBZ_REGELS.officialSourceUrl,
      recheckTrigger: 'MUNICIPAL_APPROVAL_CHANGED',
    });
  }

  if (ctx.preparationPeriod === 'AVAILABLE') {
    rules.push({
      ...BASE,
      id: 'nl2026.bijstand.preparation_available',
      severity: 'INFO',
      shortTitle: 'Je gemeente kent een voorbereidingsperiode',
      shortText:
        'Je kunt je dan mogelijk met behoud van bijstand voorbereiden. Maximaal één jaar, soms korter. Geen sollicitatieplicht in die periode, wel meewerken aan ondersteuning.',
      expandedExplanation:
        'De gemeente bepaalt of de regeling beschikbaar is, hoe lang, en of er voorbereidingskrediet is. HomeCheff voorspelt dat niet.',
      cta: {
        label: 'Bekijk de voorbereidingsperiode',
        href: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_RIJK_BIJSTAND_START.officialSource,
      officialSourceUrl: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
      recheckTrigger: 'MUNICIPAL_APPROVAL_CHANGED',
    });
  } else if (ctx.preparationPeriod === 'NOT_AVAILABLE') {
    rules.push({
      ...BASE,
      id: 'nl2026.bijstand.preparation_not_available',
      severity: 'INFO',
      shortTitle: 'Niet iedere gemeente heeft een voorbereidingsperiode',
      shortText:
        'Jouw gemeente heeft volgens jouw antwoord geen voorbereidingsperiode. Bbz-ondersteuning bij starten kan nog steeds mogelijk zijn.',
      expandedExplanation:
        'De gemeente beoordeelt je ondernemersplan. HomeCheff zegt niet of je bedrijf levensvatbaar is.',
      cta: {
        label: 'Bekijk Bbz',
        href: SRC_RIJK_BBZ_REGELS.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_RIJK_BBZ_REGELS.officialSource,
      officialSourceUrl: SRC_RIJK_BBZ_REGELS.officialSourceUrl,
      recheckTrigger: 'MUNICIPAL_APPROVAL_CHANGED',
    });
  } else {
    rules.push({
      ...BASE,
      id: 'nl2026.bijstand.preparation_unknown',
      severity: 'INFO',
      shortTitle: 'Vraag of je gemeente een voorbereidingsperiode heeft',
      shortText:
        'Je gemeente kan een voorbereidingsperiode of Bbz-ondersteuning hebben. Dat raden we niet af van je postcode.',
      expandedExplanation:
        'Beschikbaarheid, duur en voorwaarden stelt de gemeente. HomeCheff vult UNKNOWN in tot jij of een latere gemeente-ruleset het weet.',
      cta: {
        label: 'Bekijk de landelijke uitleg',
        href: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
        kind: 'official',
      },
      officialSource: SRC_RIJK_BIJSTAND_START.officialSource,
      officialSourceUrl: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
      recheckTrigger: 'MUNICIPALITY_CHANGED',
    });
  }

  rules.push({
    ...BASE,
    id: 'nl2026.bijstand.bbz_review',
    severity: 'CHECK',
    shortTitle: 'Bbz beoordeelt de gemeente',
    shortText:
      'Wil je vanuit de bijstand echt starten? De gemeente beoordeelt je ondernemersplan. HomeCheff bepaalt niet of je bedrijf levensvatbaar is.',
    expandedExplanation: `Status: ${MUNICIPAL_BBZ_REVIEW_REQUIRED}. Een uitkering levensonderhoud kan een renteloze lening tot het sociaal minimum zijn (eerst 6 maanden, mogelijk nog 6, daarna verlenging, totaal maximaal 36 maanden). Starterskrediet kan in 2026 tot maximaal €${(
      BBZ_STARTER_CREDIT_MAX_CENTS_2026 / 100
    ).toLocaleString('nl-NL')} als rentedragende lening. Je hebt daar geen automatisch recht op. De gemeente beoordeelt dit.`,
    cta: {
      label: 'Bekijk starterskrediet',
      href: SRC_RIJK_BBZ_KAPITAAL.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_RIJK_BBZ_KAPITAAL.officialSource,
    officialSourceUrl: SRC_RIJK_BBZ_KAPITAAL.officialSourceUrl,
    recheckTrigger: 'MUNICIPAL_APPROVAL_CHANGED',
  });

  rules.push({
    ...BASE,
    id: 'nl2026.bijstand.business_plan_future',
    severity: 'INFO',
    shortTitle: 'Later kan HomeCheff een planoverzicht maken',
    shortText:
      'Later kan HomeCheff een eenvoudig overzicht maken van wat je verkoopt, hoe vaak en wat je verwacht. Geen automatische levensvatbaarheidsbeoordeling.',
    expandedExplanation:
      'BUSINESS_PLAN_HELP_AVAILABLE_FUTURE: bedoeld om mee te nemen naar gemeente of UWV. Nog geen generator in deze fase.',
    cta: {
      label: 'Bekijk wat ik kan meenemen naar mijn gemeente',
      href: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_RIJK_BIJSTAND_START.officialSource,
    officialSourceUrl: SRC_RIJK_BIJSTAND_START.officialSourceUrl,
    recheckTrigger: 'CONTEXT_CHANGE',
  });

  return rules;
}
