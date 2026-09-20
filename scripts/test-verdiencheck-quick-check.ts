/**
 * VerdienCheck quick-check restructure: first useful result before money/details.
 *
 *   npx tsx scripts/test-verdiencheck-quick-check.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';
import {
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
  isVerdienWijzerEnabled,
} from '../lib/verdiencheck/flags';
import { buildPersonalVerdienRoute } from '../lib/verdiencheck/personal-route';
import type { GuidanceContext } from '../lib/verdiencheck/guidance/types';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  applyUwvBenefitUnknown,
  firstMoneyStep,
  questionsBeforeFirstResult,
  visibleSteps,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import {
  wizardStateToBenefitFacts,
  wizardStateToBusinessFacts,
  wizardStateToCalculatorInput,
  wizardStateToFoodFacts,
} from '../lib/verdiencheck/wizard/to-calculator-input';
import { persistenceUsesDatabase } from '../lib/verdiencheck/privacy/session-client';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS } from '../lib/verdiencheck/privacy/analytics-guard';

const ROOT = process.cwd();

function state(partial: Partial<WizardState>): WizardState {
  let next: WizardState = { ...EMPTY_WIZARD_STATE, taxResidence: 'NL', ...partial };
  if (partial.activityChoice) {
    next = {
      ...next,
      activityChoice: partial.activityChoice,
      activityKinds: applyActivityChoice(partial.activityChoice),
    };
  }
  if (partial.growthStart) next = applyGrowthStartChoice(next, partial.growthStart);
  if (partial.situationGroup) next = applySituationGroup(next, partial.situationGroup);
  return { ...next, ...partial, taxResidence: 'NL', activityKinds: next.activityKinds };
}

function countBefore(partial: Partial<WizardState>): number {
  return questionsBeforeFirstResult(state(partial)).length;
}

function ctxFrom(s: WizardState): GuidanceContext | null {
  const personSituation =
    derivePersonSituation({
      group: s.situationGroup,
      uwvBenefit: s.uwvBenefit,
    }) ?? (s.uwvBenefitUnknown ? 'OTHER' : null);
  const input = wizardStateToCalculatorInput(s);
  if (!personSituation) return null;
  return {
    jurisdiction: 'NL',
    year: 2026,
    personSituation,
    allowances: s.allowances.length > 0 ? s.allowances : ['NONE'],
    activity: input
      ? input.activity
      : {
          kinds: s.activityKinds,
          frequency: s.frequency ?? 'UNKNOWN',
          customers: s.customers ?? 'UNKNOWN',
          commercialIntent: s.intent ?? 'UNKNOWN',
          independence: 'UNKNOWN',
          continuity: 'UNKNOWN',
          timeOrMoneyInvested: 'UNKNOWN',
          listingCount: null,
          transactionCount: null,
          typicalTicketCents: null,
          unitCount: null,
        },
    business: wizardStateToBusinessFacts(s),
    benefits: wizardStateToBenefitFacts(s),
    food: wizardStateToFoodFacts(s),
  };
}

function routeFrom(s: WizardState) {
  const input = wizardStateToCalculatorInput(s);
  return buildPersonalVerdienRoute({
    ctx: ctxFrom(s),
    calculator: input ? runCalculator(input) : null,
    declaredGrowth: s.growthStart,
    forceCheckFirstReason: s.uwvBenefitUnknown ? 'UWV_SCHEME_UNKNOWN' : null,
  });
}

assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
assert.equal(persistenceUsesDatabase(), false);

const BASELINE_BEFORE = {
  simpleStarter: { questions: 5, clicks: 5, screens: 5, firstResult: 'Je kunt beginnen.' },
  employee: { questions: 12, clicks: 12, screens: 12, firstResult: 'Je kunt beginnen.' },
  employeeAllowances: { questions: 14, clicks: 14, screens: 14, firstResult: 'Je kunt beginnen.' },
  oneOffFood: { questions: 7, clicks: 7, screens: 7, firstResult: 'Je kunt beginnen.' },
  regularFood: { questions: 18, clicks: 18, screens: 18, firstResult: 'Je kunt verkopen, maar regel een paar praktische zaken.' },
  ww: { questions: 7, clicks: 7, screens: 7, firstResult: 'Je kunt vanuit WW starten. Controleer eerst welke UWV-route bij je past.' },
  bijstand: { questions: 7, clicks: 7, screens: 7, firstResult: 'Je gemeente kan je helpen om vanuit de bijstand te starten. Bespreek je plan eerst met de gemeente.' },
  existingEntrepreneur: { questions: 16, clicks: 16, screens: 16, firstResult: 'Je kunt beginnen.' },
} as const;

const starter = state({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'NONE',
});
const employee = state({
  activityChoice: 'MAKE',
  growthStart: 'OCCASIONAL_EARNING',
  situationGroup: 'EMPLOYEE',
});
const employeeAllowances = state({
  activityChoice: 'MAKE',
  growthStart: 'OCCASIONAL_EARNING',
  situationGroup: 'EMPLOYEE',
  allowances: ['HEALTHCARE'],
});
const oneOffFood = state({
  activityChoice: 'FOOD',
  growthStart: 'TRYING_OUT',
  foodUxFrequency: 'ONE_OFF',
  situationGroup: 'NONE',
});
const regularFood = state({
  activityChoice: 'FOOD',
  growthStart: 'REGULAR_EARNING',
  foodUxFrequency: 'REGULAR',
  situationGroup: 'NONE',
});
const fewTimesFood = state({
  activityChoice: 'FOOD',
  growthStart: 'TRYING_OUT',
  foodUxFrequency: 'OCCASIONAL_RECURRING',
  situationGroup: 'NONE',
});
const ww = state({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'WW',
});
const bijstand = state({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'BIJSTAND',
});
const existing = state({
  activityChoice: 'MAKE',
  growthStart: 'BUILDING_BUSINESS',
  situationGroup: 'EXISTING_ENTREPRENEUR',
});

const AFTER = {
  simpleStarter: countBefore(starter),
  employee: countBefore(employee),
  employeeAllowances: countBefore(employeeAllowances),
  oneOffFood: countBefore(oneOffFood),
  fewTimesFood: countBefore(fewTimesFood),
  regularFood: countBefore(regularFood),
  ww: countBefore(ww),
  bijstand: countBefore(bijstand),
  existingEntrepreneur: countBefore(existing),
};

assert.ok(AFTER.simpleStarter >= 3 && AFTER.simpleStarter <= 6, `starter ${AFTER.simpleStarter}`);
assert.ok(AFTER.employee >= 3 && AFTER.employee <= 6, `employee ${AFTER.employee}`);
assert.ok(AFTER.employeeAllowances >= 3 && AFTER.employeeAllowances <= 6, `employee+allowances ${AFTER.employeeAllowances}`);
assert.ok(AFTER.oneOffFood >= 4 && AFTER.oneOffFood <= 7, `one-off food ${AFTER.oneOffFood}`);
assert.equal(AFTER.fewTimesFood, AFTER.oneOffFood, 'few-times food must stay the same quick-check length');
assert.ok(AFTER.regularFood <= 8, `regular food ${AFTER.regularFood}`);
assert.ok(AFTER.ww <= 8, `ww ${AFTER.ww}`);
assert.ok(AFTER.bijstand <= 8, `bijstand ${AFTER.bijstand}`);
assert.ok(AFTER.existingEntrepreneur <= 6, `existing ${AFTER.existingEntrepreneur}`);

assert.equal(visibleSteps(starter).includes('incomeBases'), false);
assert.equal(visibleSteps(starter).includes('customers'), false);
assert.equal(visibleSteps(starter).includes('amounts'), false);
assert.equal(visibleSteps(starter).includes('allowances'), false);
assert.equal(visibleSteps(oneOffFood).includes('foodPackaging'), false);
assert.equal(visibleSteps(regularFood).includes('foodAnimalOrigin'), false);
assert.equal(visibleSteps(ww).includes('wwStartPeriod'), false);
assert.equal(visibleSteps(bijstand).includes('bijstandMunicipality'), false);

const starterMoney = applyMoneyDepthChoice(starter, 'YES');
assert.equal(visibleSteps(starterMoney).includes('amounts'), true);
assert.equal(visibleSteps(starterMoney).includes('incomeBases'), false);
const firstMoney = firstMoneyStep(starterMoney);
assert.ok(firstMoney);
assert.notEqual(firstMoney, 'incomeBases');

const employeeMoney = applyMoneyDepthChoice(employee, 'YES');
assert.equal(visibleSteps(employeeMoney).includes('incomeBases'), true);
assert.equal(visibleSteps(employeeMoney).includes('allowances'), true);
assert.ok(questionsBeforeFirstResult(employeeMoney).length <= 6);

const employeeAllowancesMoney = applyMoneyDepthChoice(
  { ...employeeAllowances, moneyDepthRequested: true },
  'YES',
);
assert.equal(visibleSteps(employeeAllowancesMoney).includes('partner'), true);

const starterRoute = routeFrom(starter);
assert.match(starterRoute.headline, /Je kunt (beginnen|het eerst proberen)/);
assert.equal(starterRoute.proceedSemantics, 'READY_TO_PROCEED');
assert.doesNotMatch(starterRoute.now.map((c) => c.title).join('\n'), /KOR|DAC7|btw/i);

const bakerRoute = routeFrom({
  ...oneOffFood,
  packagingMode: 'UNPACKAGED',
});
assert.match(bakerRoute.headline, /^Je kunt beginnen\.$/);
assert.match(
  bakerRoute.now.map((c) => `${c.title} ${c.body}`).join('\n'),
  /allergenen|hygiënisch|veilig/i,
);
assert.doesNotMatch(
  bakerRoute.now.map((c) => `${c.title} ${c.body}`).join('\n'),
  /NVWA-registratie te controleren|MijnNVWA/,
);

const cookRoute = routeFrom({
  ...regularFood,
  customers: 'PUBLIC',
  independentlyDeterminesWork: true,
  nvwaRegistered: false,
  foodSafetyPlanStatus: 'NOT_ARRANGED',
  packagingMode: 'UNPACKAGED',
});
assert.notEqual(cookRoute.proceedSemantics, 'READY_TO_PROCEED');
assert.match(cookRoute.headline, /regel een paar praktische zaken|Controleer eerst|Je kunt verkopen/);
assert.match(
  cookRoute.now.map((c) => `${c.title} ${c.body}`).join('\n'),
  /NVWA|allergenen|hygiënisch|voedsel/i,
);

const wwRoute = routeFrom(ww);
assert.equal(wwRoute.proceedSemantics, 'CHECK_FIRST');
assert.doesNotMatch(wwRoute.headline, /^Je kunt beginnen\.$/);

const bijstandRoute = routeFrom(bijstand);
assert.equal(bijstandRoute.proceedSemantics, 'CHECK_FIRST');
assert.doesNotMatch(bijstandRoute.headline, /^Je kunt beginnen\.$/);

const existingRoute = routeFrom({
  ...existing,
  alreadyKvkRegistered: true,
});
assert.doesNotMatch(
  existingRoute.now.map((c) => `${c.title} ${c.body}`).join('\n'),
  /Schrijf je in bij|inschrijven bij de Kamer/,
);

const unknownUwv = applyUwvBenefitUnknown(
  state({
    activityChoice: 'MAKE',
    growthStart: 'TRYING_OUT',
    situationGroup: 'OTHER_UWV',
  }),
);
assert.equal(unknownUwv.uwvBenefit, null);
assert.equal(derivePersonSituation({ group: 'OTHER_UWV', uwvBenefit: null }), null);
const unknownRoute = routeFrom(unknownUwv);
assert.equal(unknownRoute.proceedSemantics, 'CHECK_FIRST');
assert.match(unknownRoute.headline, /welke uitkering je hebt/);
assert.doesNotMatch(unknownRoute.headline, /^Je kunt beginnen\.$/);
assert.equal(
  unknownRoute.now.some((c) => c.id === 'ux.uwv.scheme_unknown'),
  true,
);

const artwork = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'TRYING_OUT',
    situationGroup: 'NONE',
    estimatedTurnoverEuro: '5000',
  }),
);
assert.match(artwork.headline, /Je kunt (beginnen|het eerst proberen)/);

const hundredSales = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'REGULAR_EARNING',
    situationGroup: 'NONE',
    estimatedAnnualTransactions: '100',
    estimatedTurnoverEuro: '5000',
  }),
);
assert.notEqual(hundredSales.proceedSemantics, 'INSUFFICIENT_CONTEXT');

const nl = getVerdienCheckCopy('nl');
assert.match(nl.intro, /bijverdienen/);
assert.match(nl.quickCheckDone, /Dat was de snelle check/);
assert.match(nl.moneyNo, /Nee, dit is genoeg/);
assert.equal(nl.steps.uwvBenefit?.options?.UNKNOWN, 'Ik weet het niet');
assert.doesNotMatch(`${nl.intro}\n${nl.registrationKvkLabel}`, /\bde de\b/);

const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
assert.match(wizardSrc, /copy\.quickCheckDone/);
assert.match(wizardSrc, /copy\.moneyNo/);
assert.match(wizardSrc, /sessionStorage|persist/);
assert.doesNotMatch(wizardSrc, /prisma/);

const funnelSrc = fs.readFileSync(path.join(ROOT, 'lib/analytics/verdiencheck-funnel.ts'), 'utf8');
assert.match(funnelSrc, /verdiencheck_quick_started/);
assert.match(funnelSrc, /verdiencheck_quick_completed/);
assert.match(funnelSrc, /verdiencheck_money_started/);
assert.match(funnelSrc, /verdiencheck_money_completed/);
assert.ok(FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS.includes('benefittype'));

const entrySrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckPublicEntry.tsx'),
  'utf8',
);
assert.match(entrySrc, /Doe de VerdienCheck|Start de snelle check/);

const dedupe = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/personal-route/deduplicate.ts'), 'utf8');
assert.match(dedupe, /Kamer van Koophandel \(KVK\)/);
assert.doesNotMatch(dedupe, /de Kamer van Koophandel \(KVK\)/);

console.log(
  JSON.stringify(
    {
      BASELINE_BEFORE,
      AFTER,
      REDUCTION: {
        simpleStarter: BASELINE_BEFORE.simpleStarter.questions - AFTER.simpleStarter,
        employee: BASELINE_BEFORE.employee.questions - AFTER.employee,
        employeeAllowances: BASELINE_BEFORE.employeeAllowances.questions - AFTER.employeeAllowances,
        oneOffFood: BASELINE_BEFORE.oneOffFood.questions - AFTER.oneOffFood,
        regularFood: BASELINE_BEFORE.regularFood.questions - AFTER.regularFood,
        ww: BASELINE_BEFORE.ww.questions - AFTER.ww,
        bijstand: BASELINE_BEFORE.bijstand.questions - AFTER.bijstand,
        existingEntrepreneur: BASELINE_BEFORE.existingEntrepreneur.questions - AFTER.existingEntrepreneur,
      },
      FIRST_RESULT: {
        starter: starterRoute.headline,
        baker: bakerRoute.headline,
        ww: wwRoute.headline,
        bijstand: bijstandRoute.headline,
        uwvUnknown: unknownRoute.headline,
      },
      UWV_UNKNOWN_ROUTE: 'RESOLVED_WITH_EXISTING_ENGINE',
      INCOMEBASES_BLOCK_QUICK_CHECK: false,
    },
    null,
    2,
  ),
);
console.log('verdiencheck quick-check tests: PASS');
