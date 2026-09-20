/**
 * VerdienCheck architecture invariants (no fiscal invention).
 *
 *   npx tsx scripts/validate-verdiencheck-architecture.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  isVerdienCheckEnabled,
  isVerdienCheckPublicCtaEnabled,
  isVerdienCheckPublicEnabled,
  isVerdienWijzerEnabled,
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
  VERDIENCHECK_FLAG_NAMES,
} from '../lib/verdiencheck/flags';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { commercialResultCents } from '../lib/verdiencheck/domain/money';
import {
  getRulePack,
  resolvePackForUserComputation,
} from '../lib/verdiencheck/rulesets/registry';
import {
  resolveTaxJurisdiction,
  userCountryMustNotBecomeTaxJurisdiction,
} from '../lib/verdiencheck/domain/jurisdiction';
import { BENEFIT_ROUTE_FAMILIES } from '../lib/verdiencheck/domain/person';
import { defaultBlocking } from '../lib/verdiencheck/guidance/types';
import { persistenceUsesDatabase } from '../lib/verdiencheck/privacy/session-client';
import { V1_COST_SOURCE } from '../lib/verdiencheck/domain/costs';
import { paintingOnceFiveThousand } from '../lib/verdiencheck/domain/activity';
import { APP_FIRST_SEGMENTS } from '../lib/seo/known-root-path-segments';
import {
  ASSESSMENT_ORDER,
  HOMECHEFF_GUIDANCE_PRINCIPLE,
  LEGAL_GUIDANCE_PRINCIPLE,
} from '../lib/verdiencheck/guidance/principles';

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(path.join(ROOT, dir))) return acc;
  for (const name of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    const stat = fs.statSync(path.join(ROOT, rel));
    if (stat.isDirectory()) walk(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

function gitUnchanged(rel: string): void {
  const out = execSync(`git diff -- ${JSON.stringify(rel)}`, {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.equal(out, '', `DO_NOT_TOUCH modified: ${rel}`);
}

// PASS: public route exists behind flag
const page = read('app/verdiencheck/page.tsx');
assert.match(page, /isVerdienCheckPublicRouteVisible/);
assert.match(page, /notFound/);
assert.ok(
  (APP_FIRST_SEGMENTS as readonly string[]).includes('verdiencheck'),
  'verdiencheck in APP_FIRST_SEGMENTS',
);

// PASS: flags default false
for (const name of VERDIENCHECK_FLAG_NAMES) {
  assert.equal(process.env[name] == null || process.env[name] === '', true, `${name} should be unset in this validation, or test is contaminated`);
}
assert.equal(isVerdienCheckEnabled(), false);
assert.equal(isVerdienCheckPublicEnabled(), false);
assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
assert.equal(isVerdienCheckPublicCtaEnabled(), false);
const flagsSrc = read('lib/verdiencheck/flags.ts');
assert.match(flagsSrc, /envBool\('VERDIENCHECK_ENABLED', false\)/);
assert.match(flagsSrc, /NODE_ENV === 'production'/);

// PASS: UI language is not jurisdiction
const jurSrc = read('lib/verdiencheck/domain/jurisdiction.ts');
assert.match(jurSrc, /void input\.uiLanguage/);
assert.match(jurSrc, /LANGUAGE ≠ JURISDICTION/);
assert.equal(
  resolveTaxJurisdiction({ confirmedResidence: 'BE', uiLanguage: 'nl' }).status,
  'NOT_SUPPORTED',
);
assert.equal(
  resolveTaxJurisdiction({ confirmedResidence: 'NL', uiLanguage: 'en' }).status,
  'ELIGIBLE',
);

// PASS: BE/SR/OTHER cannot get NL-2026
for (const j of ['BE', 'SR', 'OTHER'] as const) {
  const pack = getRulePack(j, 2026);
  assert.equal(pack.ok, false);
}

// PASS: User.country default is not tax jurisdiction
assert.equal(userCountryMustNotBecomeTaxJurisdiction('NL'), false);
assert.match(jurSrc, /userCountryMustNotBecomeTaxJurisdiction/);
assert.match(jurSrc, /void input\.userCountry/);

// PASS: overall pack remains DRAFT; incomplete input invents no tax euros
assert.equal(NL_2026_PACK.status, 'DRAFT');
assert.equal(NL_2026_PACK.modules?.rentAllowance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.childBudget, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.childcareAllowance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.iackBelowAow, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.box1FullYearAow, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.aowTransitionYearCredits, 'DRAFT');
assert.equal(NL_2026_PACK.modules?.kvkGuidance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.dac7SellerGuidance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.wwGuidance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.bijstandBbzGuidance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.wiaGuidance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.foodHomeSellingGuidance, 'CERTIFIED');
assert.equal(NL_2026_PACK.modules?.nvwaRegistrationGuidance, 'CERTIFIED');
const calc = runCalculator({
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
});
assert.equal(isUnknown(calc.netExtraCents), true);
assert.equal(isUnknown(calc.taxableAdditionalIncomeCents), true);
assert.notEqual(calc.netExtraCents, 0);

const draftUser = resolvePackForUserComputation({ jurisdiction: 'NL', year: 2026 });
assert.equal(draftUser.ok, false);

// PASS: no fiscal constants in React components
const FISCAL_RE =
  /20\.000|20000|€20,000|0\.21\b|21\s*%|70\s*%|Wajong: 70|BTW-plichtig|VAT-liable from/i;
for (const file of [
  ...walk('components/verdiencheck'),
  'app/verdiencheck/page.tsx',
]) {
  const src = read(file);
  assert.equal(FISCAL_RE.test(src), false, `fiscal constant in ${file}`);
}

const FORBIDDEN_DAC7_TAX =
  /DAC7-belastinggrens|belastingvrij tot €2\.000|vanaf 30 verkopen betaal je belasting/;
const FORBIDDEN_BENEFIT_COPY =
  /genericBenefitReductionPercentage|genericAllowedEarningsThreshold|Als je vanuit WW verkoopt krijg je 29% minder|Wajong: 70|70% van inkomsten wordt verrekend/;
for (const file of [...walk('lib/verdiencheck'), ...walk('components/verdiencheck')]) {
  const src = read(file);
  assert.equal(FORBIDDEN_DAC7_TAX.test(src), false, `forbidden DAC7-tax copy in ${file}`);
  assert.equal(FORBIDDEN_BENEFIT_COPY.test(src), false, `forbidden benefit copy in ${file}`);
}

assert.ok(fs.existsSync(path.join(ROOT, 'docs/verdiencheck/FAQ-COMPLIANCE-REPLACEMENTS-NL.md')));

// PASS: guidance blocking default false
assert.equal(defaultBlocking({}), false);

// PASS: benefit routes separate
assert.deepEqual(
  [...BENEFIT_ROUTE_FAMILIES],
  ['WW', 'BIJSTAND', 'WIA', 'WAJONG', 'ZW', 'WAO', 'WAZ'],
);
for (const file of walk('lib/verdiencheck')) {
  const src = read(file);
  if (file.endsWith('person.ts')) {
    assert.match(src, /FORBIDDEN_OTHER_BENEFIT_ALIAS/);
    continue;
  }
  assert.equal(
    src.includes('OTHER_BENEFIT') && !src.includes('FORBIDDEN_OTHER_BENEFIT'),
    false,
    `OTHER_BENEFIT used in ${file}`,
  );
}

// PASS: turnoverCents != resultCents when costs > 0
assert.equal(commercialResultCents(300_000, 100_000), 200_000);
assert.notEqual(300_000, 200_000);

// PASS: commercialResult is not automatically taxableAdditionalIncome
assert.notEqual(calc.commercialAdditionalResultCents, calc.taxableAdditionalIncomeCents);

// PASS: public session uses no database
assert.equal(persistenceUsesDatabase(), false);
const sessionSrc = read('lib/verdiencheck/privacy/session-client.ts');
assert.match(sessionSrc, /sessionStorage/);
assert.doesNotMatch(sessionSrc, /window\.localStorage/);
assert.match(sessionSrc, /hc_verdiencheck_v1/);
assert.doesNotMatch(sessionSrc, /prisma/);

// PASS: no sensitive answers in AnalyticsEvent
for (const file of [...walk('components/verdiencheck'), ...walk('app/verdiencheck'), ...walk('lib/verdiencheck')]) {
  const src = read(file);
  assert.doesNotMatch(src, /AnalyticsEvent/);
  assert.doesNotMatch(src, /gtag\(/);
  assert.doesNotMatch(src, /opportunity-analytics/);
  assert.doesNotMatch(src, /trackUserType/);
}

assert.ok(fs.existsSync(path.join(ROOT, 'docs/verdiencheck/FAQ-COMPLIANCE-INVENTORY.md')));

// PASS: no schema / do-not-touch changes
gitUnchanged('lib/compliance/dac7-threshold.ts');
gitUnchanged('lib/compliance/dac7-activity.ts');
gitUnchanged('lib/compliance/dac7-readiness.ts');
gitUnchanged('prisma/schema.prisma');
gitUnchanged('lib/account-requirements.ts');
gitUnchanged('lib/delivery/delivery-age.ts');
gitUnchanged('lib/stripe/connect-tracks.ts');
gitUnchanged('lib/ecosystem-locale.ts');
gitUnchanged('middleware.ts');
gitUnchanged('lib/legal/commerce-declaration-gate.ts');
gitUnchanged('lib/legal/eu-food-allergens.ts');
gitUnchanged('lib/legal/food-allergen-applicability.ts');
gitUnchanged('lib/legal/food-allergen-context.ts');
gitUnchanged('lib/legal/assert-food-allergens-for-transaction.ts');

assert.equal(HOMECHEFF_GUIDANCE_PRINCIPLE, 'BEGINNEN MOGELIJK MAKEN, GROEI BEGELEIDEN');
assert.equal(LEGAL_GUIDANCE_PRINCIPLE, 'BEGELEIDEN, NIET BEWAKEN');
assert.equal(ASSESSMENT_ORDER, 'INTENT → ACTIVITY → CONTEXT → APPLICABLE RULES → NEXT ACTION');

const FORBIDDEN_FOOD_COPY =
  /HACCP-certificaat verplicht|allFoodMaxTemperature|allFoodCookingTemperature|1–5 porties|Je moet ondernemer worden|HomeCheff bepaalt dat je ondernemer bent/;
for (const file of [...walk('lib/verdiencheck'), ...walk('components/verdiencheck')]) {
  if (file.includes('public-copy-patterns')) continue;
  const src = read(file);
  assert.equal(FORBIDDEN_FOOD_COPY.test(src), false, `forbidden food copy in ${file}`);
}

const PRESENTATION_THRESHOLDS =
  /\b2200\b|\b2\.200\b|\b20000\b|\b20\.000\b|\b20_000\b|\b40857\b|\b40\.857\b/;
for (const file of walk('lib/verdiencheck/personal-route')) {
  const src = read(file);
  assert.equal(PRESENTATION_THRESHOLDS.test(src), false, `presentation threshold in ${file}`);
  assert.doesNotMatch(src, /1–5 porties/);
  assert.doesNotMatch(src, /canLegallyStart/);
}

const schema = read('prisma/schema.prisma');
assert.doesNotMatch(schema, /model VerdienProfile/);
assert.doesNotMatch(schema, /model VerdienCost/);
assert.doesNotMatch(schema, /model VerdienReceipt/);

console.log('verdiencheck architecture validation: PASS');
