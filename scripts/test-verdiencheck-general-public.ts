/**
 * VerdienCheck general public earning tool.
 *
 *   npx tsx scripts/test-verdiencheck-general-public.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';
import { isV1IncomeSourceEnabled } from '../lib/verdiencheck/domain/income-source';
import {
  isVerdienCheckPersistenceEnabled,
  isVerdienWijzerEnabled,
} from '../lib/verdiencheck/flags';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { persistenceUsesDatabase } from '../lib/verdiencheck/privacy/session-client';
import { FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS } from '../lib/verdiencheck/privacy/analytics-guard';
import {
  earningIntentFromEntry,
  resolveResultCtaMode,
} from '../lib/verdiencheck/presentation/earning-context';
import { buildPersonalVerdienRoute } from '../lib/verdiencheck/personal-route';
import type { GuidanceContext } from '../lib/verdiencheck/guidance/types';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applySituationGroup,
  questionsBeforeFirstResult,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import {
  wizardStateToBenefitFacts,
  wizardStateToBusinessFacts,
  wizardStateToCalculatorInput,
  wizardStateToFoodFacts,
} from '../lib/verdiencheck/wizard/to-calculator-input';
import { verdiencheckPageMetadata } from '../lib/verdiencheck/public-seo';

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
  });
}

assert.equal(earningIntentFromEntry('direct'), 'GENERAL');
assert.equal(earningIntentFromEntry('faq'), 'GENERAL');
assert.equal(earningIntentFromEntry('careers'), 'GENERAL');
assert.equal(earningIntentFromEntry('werken-bij'), 'GENERAL');
assert.equal(earningIntentFromEntry('seller'), 'HOMECHEFF_SELLER');

const handmade = state({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'NONE',
});
assert.equal(questionsBeforeFirstResult(handmade).length, 4);
const handmadeRoute = routeFrom(handmade);
assert.equal(handmadeRoute.proceedSemantics, 'READY_TO_PROCEED');
assert.match(handmadeRoute.headline, /beginnen|proberen/);
assert.equal(
  resolveResultCtaMode({
    intent: 'GENERAL',
    activity: 'MAKE',
    semantics: handmadeRoute.proceedSemantics,
  }),
  'DISCOVER',
);
assert.equal(
  resolveResultCtaMode({
    intent: 'HOMECHEFF_SELLER',
    activity: 'MAKE',
    semantics: 'READY_TO_PROCEED',
  }),
  'SELL_PRIMARY',
);

const employeeService = state({
  activityChoice: 'SERVICE',
  growthStart: 'OCCASIONAL_EARNING',
  situationGroup: 'EMPLOYEE',
});
assert.equal(questionsBeforeFirstResult(employeeService).length, 4);

const parentOnline = state({
  activityChoice: 'MAKE',
  growthStart: 'OCCASIONAL_EARNING',
  situationGroup: 'EMPLOYEE',
  allowances: ['HEALTHCARE'],
});
assert.equal(questionsBeforeFirstResult(parentOnline).length, 4);

const occasionalAffiliate = state({
  activityChoice: 'AFFILIATE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'NONE',
});
assert.equal(questionsBeforeFirstResult(occasionalAffiliate).length, 4);
assert.deepEqual(applyActivityChoice('AFFILIATE'), ['COMMISSION']);
const affRoute = routeFrom(occasionalAffiliate);
assert.equal(affRoute.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(
  resolveResultCtaMode({
    intent: 'GENERAL',
    activity: 'AFFILIATE',
    semantics: affRoute.proceedSemantics,
  }),
  'AFFILIATE',
);
assert.notEqual(
  resolveResultCtaMode({
    intent: 'GENERAL',
    activity: 'AFFILIATE',
    semantics: 'READY_TO_PROCEED',
  }),
  'SELL_PRIMARY',
);
assert.equal(isV1IncomeSourceEnabled('AFFILIATE'), true);
assert.equal(wizardStateToCalculatorInput(occasionalAffiliate)?.incomeSource, 'AFFILIATE');

const regularAffiliate = state({
  activityChoice: 'AFFILIATE',
  growthStart: 'REGULAR_EARNING',
  situationGroup: 'NONE',
});
assert.equal(questionsBeforeFirstResult(regularAffiliate).length, 4);

const otherPlatformCrafts = state({
  activityChoice: 'MAKE',
  growthStart: 'OCCASIONAL_EARNING',
  situationGroup: 'NONE',
});
assert.equal(questionsBeforeFirstResult(otherPlatformCrafts).length, 4);

const fewFood = state({
  activityChoice: 'FOOD',
  growthStart: 'TRYING_OUT',
  foodUxFrequency: 'OCCASIONAL_RECURRING',
  situationGroup: 'NONE',
});
assert.equal(questionsBeforeFirstResult(fewFood).length, 5);
const fewFoodRoute = routeFrom(fewFood);
assert.equal(
  fewFoodRoute.now.some((c) => c.family === 'food_registration' && c.severity === 'ACTION'),
  false,
);

const regularFood = state({
  activityChoice: 'FOOD',
  growthStart: 'REGULAR_EARNING',
  foodUxFrequency: 'REGULAR',
  situationGroup: 'NONE',
  packagingMode: 'UNPACKAGED',
  nvwaRegistered: false,
  foodSafetyPlanStatus: 'NOT_ARRANGED',
});
assert.equal(questionsBeforeFirstResult(regularFood).length, 5);
const regularFoodRoute = routeFrom(regularFood);
assert.equal(regularFoodRoute.proceedSemantics, 'PROCEED_AFTER_ACTION');
assert.equal(
  regularFoodRoute.now.some((c) => c.family === 'food_registration' && c.severity === 'ACTION'),
  true,
);

const wwService = state({
  activityChoice: 'SERVICE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'WW',
});
assert.equal(questionsBeforeFirstResult(wwService).length, 4);
assert.equal(routeFrom(wwService).proceedSemantics, 'CHECK_FIRST');

const bijstandSales = state({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'BIJSTAND',
});
assert.equal(questionsBeforeFirstResult(bijstandSales).length, 4);
assert.equal(routeFrom(bijstandSales).proceedSemantics, 'CHECK_FIRST');

const existing = state({
  activityChoice: 'MAKE',
  growthStart: 'BUILDING_BUSINESS',
  situationGroup: 'EXISTING_ENTREPRENEUR',
  alreadyKvkRegistered: true,
});
assert.equal(questionsBeforeFirstResult(existing).length, 4);

const other = state({
  activityChoice: 'OTHER',
  growthStart: 'TRYING_OUT',
  situationGroup: 'NONE',
});
assert.equal(questionsBeforeFirstResult(other).length, 4);
assert.deepEqual(applyActivityChoice('OTHER'), ['PRODUCT']);

const nl = getVerdienCheckCopy('nl');
assert.match(nl.intro, /bijverdienen/);
assert.match(nl.introReassurance, /niet vooraf alles/);
assert.match(nl.introGrowth, /aangifte of inschrijvingen niet/);
assert.doesNotMatch(nl.intro + nl.introGrowth, /belastingvrij|garant|voldoen we automatisch/);
assert.equal(nl.steps.activity.title, 'Waarmee wil je iets bijverdienen?');
assert.ok(nl.steps.activity.options?.AFFILIATE);
assert.doesNotMatch(nl.steps.activity.title, /via HomeCheff/);

const seo = verdiencheckPageMetadata();
assert.match(String(seo.description), /bijverdienen/);
assert.doesNotMatch(String(seo.description), /belastingvrij €|tax.free €/i);

assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(persistenceUsesDatabase(), false);
assert.ok(FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS.includes('benefittype'));

const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
assert.match(wizardSrc, /copy\.introReassurance/);
assert.match(wizardSrc, /copy\.introGrowth/);
assert.match(wizardSrc, /AFFILIATE/);
assert.doesNotMatch(wizardSrc, /prisma/);

const ctaSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckResultCta.tsx'), 'utf8');
assert.match(ctaSrc, /discoverHomecheff/);
assert.match(ctaSrc, /affiliatePartnerCta/);
assert.match(ctaSrc, /SELL_PRIMARY/);

console.log(
  JSON.stringify(
    {
      GENERAL_SIMPLE: questionsBeforeFirstResult(handmade).length,
      GENERAL_FOOD: questionsBeforeFirstResult(fewFood).length,
      GENERAL_AFFILIATE: questionsBeforeFirstResult(occasionalAffiliate).length,
      GENERAL_CTA: resolveResultCtaMode({
        intent: 'GENERAL',
        activity: 'MAKE',
        semantics: 'READY_TO_PROCEED',
      }),
      SELLER_CTA: resolveResultCtaMode({
        intent: 'HOMECHEFF_SELLER',
        activity: 'MAKE',
        semantics: 'READY_TO_PROCEED',
      }),
      AFFILIATE_CTA: resolveResultCtaMode({
        intent: 'GENERAL',
        activity: 'AFFILIATE',
        semantics: 'READY_TO_PROCEED',
      }),
    },
    null,
    2,
  ),
);
console.log('verdiencheck general public tests: PASS');
