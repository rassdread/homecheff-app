/**
 * VerdienCheck foundation tests (no fiscal amounts invented).
 *
 *   npx tsx scripts/test-verdiencheck-foundation.ts
 */
import assert from 'node:assert/strict';
import {
  hundredProductsAtFifty,
  paintingOnceFiveThousand,
  sameTurnoverDifferentActivity,
} from '../lib/verdiencheck/domain/activity';
import { commercialResultCents, parseEuroInputToCents } from '../lib/verdiencheck/domain/money';
import {
  BENEFIT_ROUTE_FAMILIES,
  FORBIDDEN_OTHER_BENEFIT_ALIAS,
  benefitRouteFamily,
  derivePersonSituation,
} from '../lib/verdiencheck/domain/person';
import {
  isNlTaxEligible,
  resolveTaxJurisdiction,
  userCountryMustNotBecomeTaxJurisdiction,
} from '../lib/verdiencheck/domain/jurisdiction';
import { isV1IncomeSourceEnabled } from '../lib/verdiencheck/domain/income-source';
import { UNKNOWN, isUnknown } from '../lib/verdiencheck/domain/unknown';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput } from '../lib/verdiencheck/calculator/types';
import { evaluateGuidance } from '../lib/verdiencheck/guidance/engine';
import { defaultBlocking } from '../lib/verdiencheck/guidance/types';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import {
  createRulePackRegistry,
  getRulePack,
  packKey,
  resolvePackForUserComputation,
} from '../lib/verdiencheck/rulesets/registry';
import { freezeRulePack } from '../lib/verdiencheck/rulesets/types';
import { persistenceUsesDatabase } from '../lib/verdiencheck/privacy/session-client';
import { visibleSteps, EMPTY_WIZARD_STATE } from '../lib/verdiencheck/wizard/schema';
import {
  isVerdienCheckEnabled,
  isVerdienCheckPublicEnabled,
  isVerdienWijzerEnabled,
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
} from '../lib/verdiencheck/flags';
import { V1_COST_SOURCE } from '../lib/verdiencheck/domain/costs';
import { foodContextFromListing } from '../lib/verdiencheck/adapters/taxonomy-activity';

function baseInput(
  over: Partial<CalculatorInput> = {},
): CalculatorInput {
  return {
    jurisdiction: 'NL',
    calendarYear: 2026,
    personContext: { situation: 'EMPLOYEE' },
    currentAnnualIncomeCents: null,
    allowances: ['UNKNOWN'],
    activity: paintingOnceFiveThousand(),
    incomeSource: 'MARKETPLACE_SELLER',
    estimatedTurnoverCents: 300_000,
    estimatedCosts: { amountCents: 100_000, source: V1_COST_SOURCE },
    commercialResultCents: 200_000,
    scenarioAdditionalResultCents: 200_000,
    ...over,
  };
}

// --- flags default false
assert.equal(isVerdienCheckEnabled(), false);
assert.equal(isVerdienCheckPublicEnabled(), false);
assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);

// --- jurisdiction
assert.equal(
  resolveTaxJurisdiction({ confirmedResidence: 'NL' }).status,
  'ELIGIBLE',
);
assert.equal(isNlTaxEligible({ confirmedResidence: 'NL' }), true);

for (const other of ['BE', 'SR', 'OTHER'] as const) {
  const r = resolveTaxJurisdiction({ confirmedResidence: other, uiLanguage: 'nl' });
  assert.equal(r.status, 'NOT_SUPPORTED');
  const pack = getRulePack(other, 2026);
  assert.equal(pack.ok, false);
  if (!pack.ok) {
    assert.equal(pack.error, 'PACK_NOT_AVAILABLE_FOR_JURISDICTION');
  }
}

assert.equal(
  resolveTaxJurisdiction({ confirmedResidence: 'UNKNOWN' }).status,
  'ASK_JURISDICTION',
);
assert.equal(
  resolveTaxJurisdiction({ confirmedResidence: null }).status,
  'ASK_JURISDICTION',
);

// nl UI + BE/SR → no NL pack
assert.equal(
  getRulePack('BE', 2026).ok,
  false,
);
assert.equal(getRulePack('SR', 2026).ok, false);

// en UI + NL → NL eligible (language ignored)
assert.equal(
  resolveTaxJurisdiction({ confirmedResidence: 'NL', uiLanguage: 'en' }).status,
  'ELIGIBLE',
);

assert.equal(userCountryMustNotBecomeTaxJurisdiction('NL'), false);
assert.equal(userCountryMustNotBecomeTaxJurisdiction(null), false);

// --- packs
assert.equal(NL_2026_PACK.status, 'DRAFT');
assert.ok(Object.keys(NL_2026_PACK.parameters).length > 0);
assert.equal(NL_2026_PACK.modules?.incomeTax, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.rentAllowance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.childBudget, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.childcareAllowance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.iackBelowAow, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.olderPersonsTaxCredit, 'CERTIFIED');

const draftResolve = resolvePackForUserComputation({
  jurisdiction: 'NL',
  year: 2026,
});
assert.equal(draftResolve.ok, false);
if (!draftResolve.ok) assert.equal(draftResolve.error, 'PACK_NOT_CERTIFIED');

const published = freezeRulePack({
  ...NL_2026_PACK,
  status: 'PUBLISHED',
  verifiedAt: '2026-01-01',
});
const publishedRegistry = createRulePackRegistry([published]);
const publishedResolve = resolvePackForUserComputation({
  jurisdiction: 'NL',
  year: 2026,
  registry: publishedRegistry,
});
assert.equal(publishedResolve.ok, true);

const pack2027 = freezeRulePack({
  ...NL_2026_PACK,
  id: 'NL-2027',
  year: 2027,
  version: '2027.1-test',
  effectiveFrom: '2027-01-01',
  effectiveUntil: '2027-12-31',
});
const bothYears = createRulePackRegistry([NL_2026_PACK, pack2027]);
assert.notEqual(
  bothYears.get(packKey('NL', 2026)),
  bothYears.get(packKey('NL', 2027)),
);
assert.equal(bothYears.get(packKey('NL', 2026))?.year, 2026);
assert.equal(bothYears.get(packKey('NL', 2027))?.year, 2027);
assert.equal(NL_2026_PACK.year, 2026);
assert.equal(NL_2026_PACK.status, 'DRAFT');

// --- overall pack DRAFT: incomplete input must not invent taxable euros
const draftCalc = runCalculator(baseInput());
assert.equal(isUnknown(draftCalc.taxableAdditionalIncomeCents), true);
assert.equal(isUnknown(draftCalc.netExtraCents), true);
assert.equal(isUnknown(draftCalc.netExtraPerMonthCents), true);
assert.notEqual(draftCalc.taxableAdditionalIncomeCents, draftCalc.commercialAdditionalResultCents);
assert.equal(draftCalc.commercialAdditionalResultCents, 200_000);

const beCalc = runCalculator(baseInput({ jurisdiction: 'BE' }));
assert.equal(beCalc.status, 'JURISDICTION_NOT_SUPPORTED');
assert.equal(isUnknown(beCalc.netExtraCents), true);

// --- money
assert.equal(commercialResultCents(300_000, 100_000), 200_000);
assert.notEqual(300_000, 200_000);
assert.equal(parseEuroInputToCents('19,99'), 1999);
assert.equal(parseEuroInputToCents('19.99'), 1999);
assert.equal(Number.isInteger(commercialResultCents(300_000, 100_000)), true);

assert.throws(() => commercialResultCents(1.5, 0));

// --- benefits distinct
assert.notEqual(benefitRouteFamily('WW'), benefitRouteFamily('WIA'));
assert.notEqual(benefitRouteFamily('WIA'), benefitRouteFamily('WAJONG'));
assert.notEqual(benefitRouteFamily('WAJONG'), benefitRouteFamily('ZW'));
assert.notEqual(benefitRouteFamily('ZW'), benefitRouteFamily('WAO'));
assert.notEqual(benefitRouteFamily('WAO'), benefitRouteFamily('WAZ'));
assert.notEqual(benefitRouteFamily('BIJSTAND'), benefitRouteFamily('WW'));
assert.equal(BENEFIT_ROUTE_FAMILIES.includes('WW'), true);
assert.equal(
  (BENEFIT_ROUTE_FAMILIES as readonly string[]).includes(FORBIDDEN_OTHER_BENEFIT_ALIAS),
  false,
);
assert.equal(derivePersonSituation({ group: 'OTHER_UWV', uwvBenefit: 'WAJONG' }), 'WAJONG');
assert.equal(derivePersonSituation({ group: 'WW', uwvBenefit: null }), 'WW');

for (const family of BENEFIT_ROUTE_FAMILIES) {
  const hits = evaluateGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: family,
    allowances: ['UNKNOWN'],
    activity: paintingOnceFiveThousand(),
  });
  assert.ok(
    hits.some((h) => h.routeFamily === family),
    `missing route ${family}`,
  );
  assert.ok(hits.every((h) => h.rule.blocking === false));
}

assert.equal(defaultBlocking({}), false);
assert.equal(defaultBlocking({ blocking: false }), false);
assert.equal(
  defaultBlocking({
    platformObligation: { id: 'COMMERCE_DECLARATION', enforced: false },
  }),
  false,
);

// --- activity: same turnover, different context
const paint = paintingOnceFiveThousand();
const hundred = hundredProductsAtFifty();
assert.equal(paint.typicalTicketCents! * paint.unitCount!, 500_000);
assert.equal(hundred.typicalTicketCents! * hundred.unitCount!, 500_000);
assert.equal(sameTurnoverDifferentActivity(paint, hundred), true);
assert.notEqual(paint.frequency, hundred.frequency);
assert.notEqual(paint.unitCount, hundred.unitCount);

// --- income source v1
assert.equal(isV1IncomeSourceEnabled('MARKETPLACE_SELLER'), true);
assert.equal(isV1IncomeSourceEnabled('AFFILIATE'), false);
assert.equal(isV1IncomeSourceEnabled('DELIVERY'), false);

const affCalc = runCalculator(baseInput({ incomeSource: 'AFFILIATE' }));
assert.equal(affCalc.status, 'INCOME_SOURCE_DISABLED');

// --- privacy: no DB
assert.equal(persistenceUsesDatabase(), false);

// --- wizard schema conditionals
const nlState = { ...EMPTY_WIZARD_STATE, taxResidence: 'NL' as const };
assert.equal(visibleSteps(nlState).includes('situation'), true);
assert.equal(visibleSteps(nlState).includes('uwvBenefit'), false);
assert.equal(
  visibleSteps({ ...nlState, situationGroup: 'OTHER_UWV' }).includes('uwvBenefit'),
  true,
);
assert.equal(visibleSteps({ ...nlState, allowances: ['RENT'] }).includes('partner'), true);
assert.equal(visibleSteps({ ...nlState, allowances: ['NONE'] }).includes('partner'), false);
assert.equal(
  visibleSteps({ ...EMPTY_WIZARD_STATE, taxResidence: 'OTHER' }).includes('situation'),
  false,
);

// --- food adapter reuses LEGAL-2
const food = foodContextFromListing({
  listing: { marketplaceCategory: 'CREATE', specializations: ['create.meal'] },
  frequency: 'OCCASIONAL',
  commercialIntent: 'SIDE_INCOME',
});
assert.equal(food.kind, 'PREPARED_FOOD');
assert.equal(food.allergenApplicability, 'REQUIRED');

// --- unknown sentinel is not 0
assert.notEqual(UNKNOWN, 0);
assert.equal(isUnknown(UNKNOWN), true);
assert.equal(isUnknown(0), false);

console.log('verdiencheck foundation tests: PASS');
