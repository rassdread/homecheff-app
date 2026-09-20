/**
 * Development-only routing fixtures.
 * Marked [DEV]. No legal thresholds, no “je mag €X verdienen”.
 */

import type { GuidanceRule } from '../types';

function routeFixture(
  benefit: 'WW' | 'BIJSTAND' | 'WIA' | 'WAJONG' | 'ZW' | 'WAO' | 'WAZ',
): GuidanceRule {
  return {
    id: `dev.route.${benefit.toLowerCase()}`,
    jurisdiction: 'NL',
    year: 2026,
    conditions: {
      personSituation: benefit,
      benefitRoute: benefit,
    },
    severity: 'INFO',
    blocking: false,
    shortTitle: `[DEV] Route: ${benefit}`,
    shortText: `[DEV] Alleen architectuur: ${benefit} heeft een eigen route. Geen verdiengrens.`,
    expandedExplanation:
      '[DEV] Fixture. Officiële uitleg volgt uit een gecertificeerde guidance-spec. Geen juridische claim.',
    cta: { label: '[DEV] Later', kind: 'later' },
    officialSource: null,
    officialSourceUrl: null,
    verifiedAt: null,
    dismissible: true,
    recheckTrigger: 'CONTEXT_CHANGE',
    developmentFixture: true,
  };
}

export const DEV_GUIDANCE_FIXTURES: readonly GuidanceRule[] = [
  routeFixture('WW'),
  routeFixture('BIJSTAND'),
  routeFixture('WIA'),
  routeFixture('WAJONG'),
  routeFixture('ZW'),
  routeFixture('WAO'),
  routeFixture('WAZ'),
  {
    id: 'dev.route.employee',
    jurisdiction: 'NL',
    year: 2026,
    conditions: { personSituation: 'EMPLOYEE' },
    severity: 'INFO',
    blocking: false,
    shortTitle: '[DEV] Route: werknemer',
    shortText: '[DEV] Architectuurfixture. Geen belastingclaim.',
    expandedExplanation: '[DEV] Fixture.',
    cta: { label: '[DEV] Later', kind: 'later' },
    officialSource: null,
    officialSourceUrl: null,
    verifiedAt: null,
    dismissible: true,
    recheckTrigger: 'CONTEXT_CHANGE',
    developmentFixture: true,
  },
];
