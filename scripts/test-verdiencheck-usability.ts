/**
 * VerdienCheck universal simplicity — copy/layout guards.
 *
 *   npx tsx scripts/test-verdiencheck-usability.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { PERSONAL_ROUTE_COPY, headlineFor } from '../lib/verdiencheck/personal-route/copy';
import {
  EMPTY_WIZARD_STATE,
  WIZARD_STEP_IDS,
  applyActivityChoice,
  applyGrowthStartChoice,
  applySituationGroup,
  visibleSteps,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS } from '../lib/verdiencheck/privacy/analytics-guard';
import { isVerdienWijzerEnabled, isVerdienCheckPersistenceEnabled, isVerdienCheckReceiptVaultEnabled } from '../lib/verdiencheck/flags';

const ROOT = process.cwd();
const nl = getVerdienCheckCopy('nl');
const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
const ctaSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckResultCta.tsx'), 'utf8');
const financialSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const funnelSrc = fs.readFileSync(path.join(ROOT, 'lib/analytics/verdiencheck-funnel.ts'), 'utf8');
const guardSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/privacy/analytics-guard.ts'), 'utf8');

assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);

const ENUM_LEAK =
  /^(UNKNOWN|INCIDENTAL|CLEAR_REGISTRATION_INDICATION|REVIEW_REQUIRED|REGISTERED|NOT_REGISTERED|ELIGIBLE|NOT_ELIGIBLE|AVAILABLE|NOT_AVAILABLE|READY_TO_PROCEED|CHECK_FIRST|PROCEED_AFTER_ACTION|VAT_ENTREPRENEURSHIP_REVIEW_REQUIRED)$/;

const VISIBLE_TECHNICAL_UNKNOWN = /\bUNKNOWN\b/;

type Class = 'CLEAR' | 'MINOR_FRICTION' | 'CONFUSING' | 'TOO_DIFFICULT';

const QUESTION_AUDIT: Record<string, Class> = {
  jurisdiction: 'CLEAR',
  activity: 'CLEAR',
  growthStart: 'CLEAR',
  foodSellingFrequency: 'CLEAR',
  foodPackaging: 'MINOR_FRICTION',
  foodNvwa: 'MINOR_FRICTION',
  foodSafetyPlan: 'MINOR_FRICTION',
  foodAnimalOrigin: 'CLEAR',
  situation: 'CLEAR',
  uwvBenefit: 'CONFUSING',
  uwvDiscussedPlan: 'CLEAR',
  wwStartPeriod: 'MINOR_FRICTION',
  wwRetainBenefit: 'CLEAR',
  wwFormerEmployer: 'CLEAR',
  wwUwvSupplement: 'CLEAR',
  uwvResearchPeriod: 'MINOR_FRICTION',
  uwvPermission: 'CLEAR',
  zwOrigin: 'MINOR_FRICTION',
  bijstandMunicipality: 'CLEAR',
  bijstandPreparation: 'MINOR_FRICTION',
  aow: 'CLEAR',
  aowBirthCohort: 'CLEAR',
  aowMonth: 'CLEAR',
  singleOlderAow: 'MINOR_FRICTION',
  dutchHealthInsurance: 'CLEAR',
  allowances: 'CLEAR',
  partner: 'MINOR_FRICTION',
  partnerInsurance: 'CLEAR',
  partnerIncome: 'MINOR_FRICTION',
  rentsHome: 'CLEAR',
  housingRent: 'CLEAR',
  housingHousehold: 'CLEAR',
  housingAssets: 'CLEAR',
  housingWoz: 'CLEAR',
  housingInterest: 'CLEAR',
  housingOwnerShare: 'CLEAR',
  hasChildren: 'CLEAR',
  children: 'CLEAR',
  youngChild: 'CLEAR',
  iackHousehold: 'CLEAR',
  iackCoParent: 'CLEAR',
  fiscalPartner: 'MINOR_FRICTION',
  iackPartnerIncome: 'MINOR_FRICTION',
  iackRelativeAge: 'MINOR_FRICTION',
  childBudgetAssets: 'CLEAR',
  usesChildcare: 'CLEAR',
  childcare: 'MINOR_FRICTION',
  workStudy: 'MINOR_FRICTION',
  midYear: 'CLEAR',
  frequency: 'CLEAR',
  customers: 'CLEAR',
  independentlyDeterminesWork: 'CLEAR',
  customerAcquisition: 'CLEAR',
  intent: 'CLEAR',
  amounts: 'MINOR_FRICTION',
  otherVatTurnover: 'MINOR_FRICTION',
  existingRegistrations: 'MINOR_FRICTION',
  costAssumption: 'MINOR_FRICTION',
  rowAssumption: 'MINOR_FRICTION',
  currentIncome: 'CLEAR',
  payslipDeductions: 'CLEAR',
  employmentExtras: 'CLEAR',
  incomeBases: 'CONFUSING',
  assets: 'CLEAR',
  scenario: 'CLEAR',
  result: 'CLEAR',
};

const counts = { CLEAR: 0, MINOR_FRICTION: 0, CONFUSING: 0, TOO_DIFFICULT: 0 };
for (const [id, cls] of Object.entries(QUESTION_AUDIT)) {
  const step = nl.steps[id];
  assert.ok(step?.title, `missing title for ${id}`);
  assert.equal(VISIBLE_TECHNICAL_UNKNOWN.test(step.title), false, `UNKNOWN in title ${id}`);
  if (step.options) {
    for (const [key, label] of Object.entries(step.options)) {
      assert.equal(ENUM_LEAK.test(label), false, `${id}.${key} leaks ${label}`);
      assert.notEqual(label, key, `${id} option ${key} is raw enum`);
      assert.equal(label.includes('UNKNOWN'), false, `${id}.${key} shows UNKNOWN`);
    }
  }
  counts[cls] += 1;
}

assert.equal(counts.TOO_DIFFICULT, 0);
assert.ok(counts.CONFUSING <= 2, `too many CONFUSING: ${counts.CONFUSING}`);
for (const id of WIZARD_STEP_IDS) {
  assert.ok(QUESTION_AUDIT[id], `missing audit for ${id}`);
}

for (const lang of ['nl', 'en'] as const) {
  const copy = getVerdienCheckCopy(lang);
  const userFacing = [
    copy.intro,
    copy.estimateOk,
    copy.yearlyHint,
    copy.moneyExplain,
    copy.startSellingNeedsAccount,
    copy.uwvBenefitUnknownHint,
    ...Object.values(copy.steps).flatMap((step) => [
      step.title,
      step.help ?? '',
      ...Object.values(step.options ?? {}),
    ]),
  ].join('\n');
  assert.doesNotMatch(userFacing, /\bUNKNOWN\b/);
  assert.doesNotMatch(userFacing, /REVIEW_REQUIRED|CLEAR_REGISTRATION_INDICATION/);
  assert.match(copy.estimateOk, /schatting|estimate/i);
  assert.match(copy.yearlyHint, /jaar|year/i);
  assert.match(copy.moneyExplain, /omzet|turnover/i);
  assert.match(copy.startSelling, /Maak je eerste aanbod|Create your first listing/);
  assert.match(copy.moneyPrompt, /geld|money/);
  assert.match(copy.progressOngoing, /vragen|questions/i);
  assert.match(copy.registrationKvkLabel, /Kamer van Koophandel|Chamber of Commerce/);
  assert.match(copy.registrationKorLabel, /Kleineondernemersregeling|Small-business/);
  assert.match(copy.quickCheckDone, /snelle VerdienCheck|quick VerdienCheck/i);
  assert.match(copy.moneyYes, /bereken|calculate/i);
  assert.match(copy.moneyPrompt, /geld|money/);
  assert.match(copy.periodMonth, /maand|month/i);
  assert.match(copy.restartConfirmTitle, /Opnieuw beginnen|Start again/);
  assert.match(copy.currentIncomeUnknown, /Weet ik niet|don’t know/i);
  assert.doesNotMatch(userFacing, /\bde de\b/);
  assert.doesNotMatch(userFacing, /\bhet het\b/);
  assert.doesNotMatch(userFacing, /Kamer van Koophandel \(Kamer van Koophandel\)/);
}

assert.match(wizardSrc, /progressPhrase/);
assert.match(wizardSrc, /StepHelp/);
assert.match(wizardSrc, /min-h-12/);
assert.match(wizardSrc, /copy\.estimateOk/);
assert.match(wizardSrc, /copy\.yearlyHint/);
assert.match(wizardSrc, /copy\.moneyExplain/);
assert.match(wizardSrc, /copy\.quickCheckDone/);
assert.match(wizardSrc, /copy\.moneyPrompt/);
assert.match(wizardSrc, /copy\.moneyYes/);
assert.doesNotMatch(wizardSrc, /copy\.moneyNo/);
assert.match(wizardSrc, /registrationKvkLabel/);
assert.match(wizardSrc, /aria-pressed/);
assert.doesNotMatch(wizardSrc, /\{stepIndex \+ 1\} \/ \{steps\.length\}/);
assert.match(ctaSrc, /startSellingNeedsAccount/);
assert.match(financialSrc, /taxAndAllowancesIncluded|viewCalculation/);
assert.match(PERSONAL_ROUTE_COPY.dac7Title, /verkoopgegevens/);
assert.doesNotMatch(PERSONAL_ROUTE_COPY.dac7Title, /^Platformrapportage$/);
assert.match(PERSONAL_ROUTE_COPY.vatReviewTitle, /btw/);
assert.match(PERSONAL_ROUTE_COPY.korTitle, /Kleineondernemersregeling/);
assert.match(PERSONAL_ROUTE_COPY.nvwaRequiredTitle, /voedselautoriteit/);
assert.doesNotMatch(PERSONAL_ROUTE_COPY.unknownFinancial, /UNKNOWN/);

const fiveSecond = [
  headlineFor({ semantics: 'READY_TO_PROCEED', benefitFamily: null, growth: 'TRYING_OUT', foodMultiple: false }),
  headlineFor({ semantics: 'CHECK_FIRST', benefitFamily: 'WW', growth: 'TRYING_OUT', foodMultiple: false }),
  headlineFor({ semantics: 'CHECK_FIRST', benefitFamily: 'BIJSTAND', growth: 'TRYING_OUT', foodMultiple: false }),
  headlineFor({
    semantics: 'PROCEED_AFTER_ACTION',
    benefitFamily: null,
    growth: 'REGULAR_EARNING',
    foodMultiple: true,
  }),
];
assert.equal(fiveSecond[0]?.headline, 'Je kunt het eerst proberen.');
assert.equal(fiveSecond[1]?.headline, 'Controleer dit eerst met UWV.');
for (const row of fiveSecond) {
  assert.match(row.canStartMessage, /beginnen|Controleer eerst|bijna klaar/);
  assert.doesNotMatch(row.headline, /UNKNOWN|VAT entrepreneurship|REVIEW_REQUIRED/);
}

function state(partial: Partial<WizardState>): WizardState {
  let next: WizardState = { ...EMPTY_WIZARD_STATE, taxResidence: 'NL', ...partial };
  if (partial.activityChoice) {
    next = { ...next, activityChoice: partial.activityChoice, activityKinds: applyActivityChoice(partial.activityChoice) };
  }
  if (partial.growthStart) next = applyGrowthStartChoice(next, partial.growthStart);
  if (partial.situationGroup) next = applySituationGroup(next, partial.situationGroup);
  return { ...next, ...partial, taxResidence: 'NL', activityKinds: next.activityKinds };
}

function questionCount(partial: Partial<WizardState>): number {
  return visibleSteps(state(partial)).filter((id) => id !== 'result').length;
}

const starterQs = questionCount({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'NONE',
});
assert.ok(starterQs >= 3 && starterQs <= 6, `starter ${starterQs}`);

const foodQs = questionCount({
  activityChoice: 'FOOD',
  growthStart: 'TRYING_OUT',
  foodUxFrequency: 'ONE_OFF',
  situationGroup: 'NONE',
});
assert.equal(nl.steps.foodSellingFrequency.options.OCCASIONAL_RECURRING, 'Een paar keer per jaar');
assert.doesNotMatch(nl.steps.foodSellingFrequency.options.OCCASIONAL_RECURRING, /\d/);
assert.match(nl.steps.foodSellingFrequency.options.REGULAR, /Meerdere keren per jaar/);

const wwQs = questionCount({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'WW',
});
assert.ok(wwQs >= 4 && wwQs <= 8, `ww ${wwQs}`);

const bijstandQs = questionCount({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'BIJSTAND',
});
assert.ok(bijstandQs >= 4 && bijstandQs <= 8, `bijstand ${bijstandQs}`);

assert.ok(FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS.includes('benefittype'));
assert.doesNotMatch(funnelSrc, /persona|leeftijd|age_band|benefit_type/);
assert.doesNotMatch(guardSrc, /persona_id|user_age|benefit_name/);
assert.doesNotMatch(wizardSrc, /trackVerdienCheckFunnelEvent\([^\)]*(ww|wia|bijstand|income)/i);

console.log(
  JSON.stringify(
    {
      QUESTION_AUDIT_TOTAL: Object.keys(QUESTION_AUDIT).length,
      ...counts,
      starterQs,
      foodQs,
      wwQs,
      bijstandQs,
    },
    null,
    2,
  ),
);
console.log('verdiencheck usability tests: PASS');
