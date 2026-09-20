/**
 * VerdienCheck Fase 4B — NL-2026 uitkeringen / starten met verdienen.
 *
 *   npx tsx scripts/test-verdiencheck-nl-2026-benefit-guidance.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { paintingOnceFiveThousand } from '../lib/verdiencheck/domain/activity';
import {
  benefitAmountDeltaCents,
  emptyBijstandContext,
  emptyUwvDisabilityContext,
  emptyWwContext,
  MUNICIPAL_BBZ_REVIEW_REQUIRED,
  needsWaitForUwvPermission,
  resolveWwStartRoute,
  selfEmploymentHoursMayIncludeNonOrderActivities,
  uwvBenefitProfitBasisCents,
  WW_NOT_RETAINING_BENEFIT_REVIEW,
  WW_START_ROUTES,
  type WwContext,
} from '../lib/verdiencheck/domain/benefits';
import { BENEFIT_ROUTE_FAMILIES, FORBIDDEN_OTHER_BENEFIT_ALIAS } from '../lib/verdiencheck/domain/person';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { commercialResultCents } from '../lib/verdiencheck/domain/money';
import { wwGuidanceRules, wwReductionPercentForRoute } from '../lib/verdiencheck/guidance/nl2026/ww';
import { bijstandGuidanceRules } from '../lib/verdiencheck/guidance/nl2026/bijstand';
import { uwvDisabilityGuidanceForScheme } from '../lib/verdiencheck/guidance/nl2026/uwv-disability';
import { evaluateGuidance } from '../lib/verdiencheck/guidance/engine';
import { defaultBlocking } from '../lib/verdiencheck/guidance/types';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import {
  BBZ_STARTER_CREDIT_MAX_CENTS_2026,
  INITIAL_INCOME_REPORT_DEADLINE,
  INCOME_CHANGE_REPORT_DEADLINE,
  WW_START_PERIOD_REDUCTION_PERCENT,
} from '../lib/verdiencheck/rulesets/nl/2026/benefit-guidance-parameters';
import { visibleSteps, EMPTY_WIZARD_STATE } from '../lib/verdiencheck/wizard/schema';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';

function textOf(rules: { shortText: string; expandedExplanation: string; shortTitle: string }[]): string {
  return rules.map((r) => `${r.shortTitle}\n${r.shortText}\n${r.expandedExplanation}`).join('\n');
}

function ww(partial: Partial<WwContext>): WwContext {
  const base = emptyWwContext();
  return {
    ...base,
    ...partial,
    startPeriod: {
      ...base.startPeriod!,
      ...(partial.startPeriod ?? {}),
    },
  };
}

const results: Record<string, 'PASS' | 'FAIL'> = {
  WW_THREE_ROUTES: 'FAIL',
  WW_START_PERIOD: 'FAIL',
  WW_WITHOUT_START_PERIOD: 'FAIL',
  WW_WITHOUT_RETAINING: 'FAIL',
  WW_NO_GENERIC_REDUCTION: 'FAIL',
  BIJSTAND_MUNICIPAL: 'FAIL',
  BIJSTAND_NO_SAFE_EARNINGS: 'FAIL',
  UWV_DISABILITY_ROUTES: 'FAIL',
  WAJONG_NO_GENERIC_70: 'FAIL',
  UWV_REPORTING: 'FAIL',
  CONCEPT_ISOLATION: 'FAIL',
  GUIDANCE_PRIORITY: 'FAIL',
  NO_PLATFORM_BLOCKERS: 'FAIL',
};

{
  assert.deepEqual([...WW_START_ROUTES], [
    'WW_START_PERIOD',
    'WW_START_WITHOUT_START_PERIOD',
    'WW_START_WITHOUT_RETAINING_WW',
  ]);
  assert.equal(resolveWwStartRoute(emptyWwContext()), 'UNKNOWN');
  assert.equal(
    resolveWwStartRoute(ww({ wantsStartPeriod: 'YES' })),
    'WW_START_PERIOD',
  );
  assert.equal(
    resolveWwStartRoute(ww({ wantsStartPeriod: 'NO' })),
    'WW_START_WITHOUT_START_PERIOD',
  );
  assert.equal(
    resolveWwStartRoute(ww({ wantsToRetainWw: 'NO' })),
    'WW_START_WITHOUT_RETAINING_WW',
  );
  results.WW_THREE_ROUTES = 'PASS';
}

{
  const ctx = ww({
    wantsStartPeriod: 'YES',
    startPeriod: {
      uwvPermission: 'NO',
      startDate: null,
      receivesUwvSupplement: 'YES',
      formerEmployerWorkPlanned: 'YES',
    },
  });
  const rules = wwGuidanceRules(ctx);
  const blob = textOf(rules);
  assert.match(blob, /Tijdens de UWV-startperiode is je WW 29% lager/);
  assert.match(blob, /niet met je WW verrekend/);
  assert.match(blob, /toeslag van UWV/);
  assert.match(blob, /laatste werkgever/);
  assert.equal(wwReductionPercentForRoute('WW_START_PERIOD'), WW_START_PERIOD_REDUCTION_PERCENT);
  assert.equal(
    needsWaitForUwvPermission({ routeFamily: 'WW', ww: ctx }),
    true,
  );
  assert.ok(rules.some((r) => r.id === 'nl2026.ww.wait_permission'));
  assert.ok(rules.some((r) => r.id === 'nl2026.ww.start_period.former_employer'));
  assert.ok(rules.some((r) => r.severity === 'ACTION' && r.blocking === false));
  results.WW_START_PERIOD = 'PASS';
}

{
  const rules = wwGuidanceRules(ww({ wantsStartPeriod: 'NO' }));
  const blob = textOf(rules);
  assert.match(blob, /Geef je start en je uren door aan UWV/);
  assert.doesNotMatch(blob, /29%/);
  assert.match(blob, /Inkomstenopgave/);
  assert.equal(selfEmploymentHoursMayIncludeNonOrderActivities, true);
  results.WW_WITHOUT_START_PERIOD = 'PASS';
}

{
  const rules = wwGuidanceRules(ww({ wantsToRetainWw: 'NO' }));
  const blob = textOf(rules);
  assert.match(blob, /fictief inkomen/);
  assert.match(blob, /87,5%/);
  assert.match(blob, /HomeCheff rekent dat fictieve inkomen niet uit/);
  assert.equal(WW_NOT_RETAINING_BENEFIT_REVIEW, 'WW_NOT_RETAINING_BENEFIT_REVIEW');
  assert.equal(wwReductionPercentForRoute('WW_START_WITHOUT_RETAINING_WW'), null);
  results.WW_WITHOUT_RETAINING = 'PASS';
}

{
  const start = textOf(wwGuidanceRules(ww({ wantsStartPeriod: 'YES' })));
  const other = textOf(wwGuidanceRules(ww({ wantsStartPeriod: 'NO' })));
  const unknown = textOf(wwGuidanceRules(emptyWwContext()));
  assert.match(start, /Tijdens de UWV-startperiode is je WW 29% lager/);
  assert.doesNotMatch(start, /Als je vanuit WW verkoopt krijg je 29% minder/);
  assert.doesNotMatch(other, /29%/);
  assert.doesNotMatch(unknown, /29%/);
  assert.equal(wwReductionPercentForRoute('UNKNOWN'), null);
  assert.equal(wwReductionPercentForRoute('WW_START_WITHOUT_START_PERIOD'), null);
  results.WW_NO_GENERIC_REDUCTION = 'PASS';
}

{
  const unknown = bijstandGuidanceRules(emptyBijstandContext());
  const known = bijstandGuidanceRules({
    municipality: {
      municipalityKnown: true,
      municipalityName: 'Vlaardingen',
      localPolicyStatus: 'UNKNOWN',
    },
    preparationPeriod: 'UNKNOWN',
    wantsBbz: 'UNKNOWN',
  });
  const available = bijstandGuidanceRules({
    ...emptyBijstandContext(),
    preparationPeriod: 'AVAILABLE',
  });
  const unavailable = bijstandGuidanceRules({
    ...emptyBijstandContext(),
    preparationPeriod: 'NOT_AVAILABLE',
  });
  assert.match(textOf(unknown), /Bespreek je plan eerst met je gemeente/);
  assert.match(textOf(known), /Vlaardingen/);
  assert.match(textOf(known), /Lokaal beleid/i);
  assert.match(textOf(available), /voorbereidingsperiode/);
  assert.match(textOf(unavailable), /geen voorbereidingsperiode/);
  assert.ok(textOf(unknown).includes(MUNICIPAL_BBZ_REVIEW_REQUIRED));
  assert.match(textOf(unknown), /geen automatisch recht op/);
  results.BIJSTAND_MUNICIPAL = 'PASS';
}

{
  const blob = textOf(bijstandGuidanceRules(emptyBijstandContext()));
  assert.doesNotMatch(blob, /Je kunt gewoon starten/);
  assert.doesNotMatch(blob, /je mag €/);
  assert.doesNotMatch(blob, /X% wordt gekort/);
  assert.doesNotMatch(blob, /Je hebt recht op €48.060/);
  assert.equal(BBZ_STARTER_CREDIT_MAX_CENTS_2026, 4_806_000);
  results.BIJSTAND_NO_SAFE_EARNINGS = 'PASS';
}

{
  for (const scheme of ['WIA', 'WAJONG', 'ZW', 'WAO', 'WAZ'] as const) {
    const rules = uwvDisabilityGuidanceForScheme(scheme);
    assert.ok(rules.every((r) => r.conditions.personSituation === scheme));
    assert.ok(rules.every((r) => r.conditions.benefitRoute === scheme));
    assert.ok(rules.some((r) => r.id.includes(scheme.toLowerCase()) || r.id.includes('zw.')));
    const hits = evaluateGuidance({
      jurisdiction: 'NL',
      year: 2026,
      personSituation: scheme,
      allowances: ['NONE'],
      activity: paintingOnceFiveThousand(),
      benefits: { uwvDisability: emptyUwvDisabilityContext(scheme) },
    });
    assert.ok(hits.some((h) => h.routeFamily === scheme));
    assert.ok(hits.filter((h) => !h.rule.developmentFixture).length <= 3);
  }
  results.UWV_DISABILITY_ROUTES = 'PASS';
}

{
  const blob = textOf(uwvDisabilityGuidanceForScheme('WAJONG'));
  assert.doesNotMatch(blob, /70%/);
  assert.doesNotMatch(blob, /70 procent/);
  assert.match(blob, /geen generieke kortingsregel/);
  results.WAJONG_NO_GENERIC_70 = 'PASS';
}

{
  const wia = textOf(uwvDisabilityGuidanceForScheme('WIA'));
  assert.match(wia, /binnen 1 week/);
  assert.match(wia, /binnen 2 dagen/);
  assert.equal(INITIAL_INCOME_REPORT_DEADLINE, '1_WEEK');
  assert.equal(INCOME_CHANGE_REPORT_DEADLINE, '2_DAYS');
  const wwBlob = textOf(wwGuidanceRules(ww({ wantsStartPeriod: 'NO' })));
  assert.doesNotMatch(wwBlob, /binnen 1 week/);
  assert.doesNotMatch(wwBlob, /binnen 2 dagen/);
  const commercial = textOf(uwvDisabilityGuidanceForScheme('WIA'));
  assert.match(commercial, /commerciële internetverkopen/);
  assert.match(commercial, /Ook zonder KVK/);
  assert.doesNotMatch(commercial, /tweedehands-vrijstelling/);
  const zwUnknown = textOf(
    uwvDisabilityGuidanceForScheme('ZW', { zwOrigin: 'UNKNOWN' }),
  );
  assert.match(zwUnknown, /geen generieke meldroute/);
  const zwWw = textOf(
    uwvDisabilityGuidanceForScheme('ZW', { zwOrigin: 'FROM_OR_AFTER_WW' }),
  );
  assert.match(zwWw, /Inkomstenopgave/);
  results.UWV_REPORTING = 'PASS';
}

{
  assert.notEqual('WW', 'WIA');
  assert.notEqual('WW', 'BIJSTAND');
  assert.deepEqual([...BENEFIT_ROUTE_FAMILIES], [
    'WW',
    'BIJSTAND',
    'WIA',
    'WAJONG',
    'ZW',
    'WAO',
    'WAZ',
  ]);
  assert.equal(
    (BENEFIT_ROUTE_FAMILIES as readonly string[]).includes(FORBIDDEN_OTHER_BENEFIT_ALIAS),
    false,
  );
  const result = commercialResultCents(300_000, 200_000);
  assert.equal(result, 100_000);
  assert.ok(isUnknown(uwvBenefitProfitBasisCents()));
  assert.notEqual(uwvBenefitProfitBasisCents(), result);
  assert.ok(isUnknown(benefitAmountDeltaCents()));
  const noKvkStillReports = textOf(uwvDisabilityGuidanceForScheme('WIA'));
  assert.match(noKvkStillReports, /Ook zonder KVK/);
  const wwStart = textOf(wwGuidanceRules(ww({ wantsStartPeriod: 'YES' })));
  assert.match(wwStart, /iets anders dan zorg- of huurtoeslag/);
  const stepsWw = visibleSteps({
    ...EMPTY_WIZARD_STATE,
    taxResidence: 'NL',
    situationGroup: 'WW',
    detailsDepthRequested: true,
  });
  assert.equal(stepsWw.includes('wwStartPeriod'), true);
  assert.equal(stepsWw.includes('wwFormerEmployer'), false);
  assert.equal(
    visibleSteps({
      ...EMPTY_WIZARD_STATE,
      taxResidence: 'NL',
      situationGroup: 'WW',
      detailsDepthRequested: true,
      wantsStartPeriod: true,
    }).includes('wwFormerEmployer'),
    true,
  );
  assert.equal(
    visibleSteps({
      ...EMPTY_WIZARD_STATE,
      taxResidence: 'NL',
      situationGroup: 'BIJSTAND',
      detailsDepthRequested: true,
    }).includes('bijstandMunicipality'),
    true,
  );
  assert.equal(
    visibleSteps({
      ...EMPTY_WIZARD_STATE,
      taxResidence: 'NL',
      situationGroup: 'WW',
    }).includes('wwStartPeriod'),
    false,
  );
  results.CONCEPT_ISOLATION = 'PASS';
}

{
  const hits = evaluateGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: derivePersonSituation({ group: 'WW', uwvBenefit: null }) ?? 'WW',
    allowances: ['NONE'],
    activity: paintingOnceFiveThousand(),
    benefits: { ww: emptyWwContext() },
  });
  const live = hits.filter((h) => !h.rule.developmentFixture);
  assert.ok(live.length <= 3);
  assert.equal(live[0]?.rule.severity, 'ACTION');
  assert.match(live[0]?.rule.shortText ?? '', /UWV/);
  assert.ok(live.some((h) => h.rule.id === 'nl2026.benefit.then_kvk_vat'));
  assert.ok(live.some((h) => h.rule.id === 'nl2026.tracking.keep_sales'));
  assert.ok(hits.some((h) => h.rule.developmentFixture && h.routeFamily === 'WW'));
  results.GUIDANCE_PRIORITY = 'PASS';
}

{
  for (const family of BENEFIT_ROUTE_FAMILIES) {
    const hits = evaluateGuidance({
      jurisdiction: 'NL',
      year: 2026,
      personSituation: family,
      allowances: ['UNKNOWN'],
      activity: paintingOnceFiveThousand(),
    });
    assert.ok(hits.every((h) => h.rule.blocking === false));
    assert.ok(hits.every((h) => h.rule.severity !== 'REQUIRED_BY_PLATFORM'));
    assert.equal(defaultBlocking({}), false);
  }
  assert.equal(NL_2026_MODULE_STATUS.wwGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.bijstandBbzGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.wiaGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.wajongGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.zwGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.waoGuidance, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.wazGuidance, 'CERTIFIED');
  assert.equal(NL_2026_PACK.version, '2026.5a-personal-route');
  assert.equal(NL_2026_PACK.status, 'DRAFT');
  results.NO_PLATFORM_BLOCKERS = 'PASS';
}

const faq = fs.readFileSync(
  path.join(process.cwd(), 'docs/verdiencheck/FAQ-COMPLIANCE-REPLACEMENTS-NL.md'),
  'utf8',
);
assert.match(faq, /CERTIFIED_REPLACEMENT_READY/);
assert.doesNotMatch(faq, /WAITING_FOR_PHASE_4B/);

const failed = Object.entries(results).filter(([, v]) => v !== 'PASS');
if (failed.length > 0) {
  console.error(results);
  throw new Error(`FAIL: ${failed.map(([k]) => k).join(', ')}`);
}
console.log('verdiencheck NL-2026 benefit guidance tests: PASS');
console.log(results);
