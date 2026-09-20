/**
 * VerdienCheck Fase 5D — launch polish + fail-closed public flags.
 *
 *   npx tsx scripts/test-verdiencheck-phase-5d.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';
import {
  formatCentsAsEuro,
  formatCentsAsEuroDisplay,
} from '../lib/verdiencheck/domain/money';
import {
  isVerdienCheckEnabled,
  isVerdienCheckPublicCtaEnabled,
  isVerdienCheckPublicEnabled,
  isVerdienCheckPublicRouteVisible,
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
  isVerdienWijzerEnabled,
} from '../lib/verdiencheck/flags';
import { verdiencheckPageMetadata } from '../lib/verdiencheck/public-seo';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { buildPersonalVerdienRoute } from '../lib/verdiencheck/personal-route';
import { EMPTY_WIZARD_STATE, type WizardState } from '../lib/verdiencheck/wizard/schema';
import {
  wizardStateToBenefitFacts,
  wizardStateToBusinessFacts,
  wizardStateToCalculatorInput,
  wizardStateToFoodFacts,
} from '../lib/verdiencheck/wizard/to-calculator-input';
import type { GuidanceContext } from '../lib/verdiencheck/guidance/types';

function state(over: Partial<WizardState>): WizardState {
  return { ...EMPTY_WIZARD_STATE, taxResidence: 'NL', ...over };
}

function ctxFrom(s: WizardState): GuidanceContext | null {
  const personSituation = derivePersonSituation({
    group: s.situationGroup,
    uwvBenefit: s.uwvBenefit,
  });
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

assert.equal(isVerdienCheckEnabled(), false);
assert.equal(isVerdienCheckPublicEnabled(), false);
assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
assert.equal(isVerdienCheckPublicCtaEnabled(), false);
assert.equal(isVerdienCheckPublicRouteVisible(), true, 'local scaffolding visible');

const meta = verdiencheckPageMetadata();
const robots = meta.robots;
assert.equal(typeof robots === 'object' && robots && 'index' in robots && robots.index, false);
assert.equal(typeof robots === 'object' && robots && 'follow' in robots && robots.follow, false);
assert.equal(meta.alternates?.canonical, 'https://homecheff.eu/verdiencheck');
const title = meta.title;
assert.ok(
  title === 'VerdienCheck | HomeCheff' ||
    (typeof title === 'object' && title !== null && 'absolute' in title && title.absolute === 'VerdienCheck | HomeCheff'),
);

assert.equal(formatCentsAsEuro(160000), '1600,00');
assert.equal(formatCentsAsEuroDisplay(160000), '1600');
assert.equal(formatCentsAsEuroDisplay(2556), '25,56');
assert.equal(formatCentsAsEuroDisplay(-50000), '-500');

const baker = routeFrom(
  state({
    activityChoice: 'FOOD',
    activityKinds: ['FOOD'],
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'ONE_OFF',
    frequency: 'ONE_OFF',
    intent: 'HOBBY_COST_RECOVERY',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  }),
);
assert.match(baker.headline, /^Je kunt beginnen\.$/);
assert.ok(baker.now.length <= 3);
assert.match(baker.now.map((c) => `${c.title} ${c.body}`).join('\n'), /allergenen/i);
assert.equal(
  baker.now.filter((c) => /^Vertel klanten welke allergenen/i.test(c.title)).length,
  0,
);

const cook = routeFrom(
  state({
    activityChoice: 'FOOD',
    activityKinds: ['FOOD'],
    growthStart: 'REGULAR_EARNING',
    foodUxFrequency: 'REGULAR',
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    nvwaRegistered: false,
    foodSafetyPlanStatus: 'NOT_ARRANGED',
  }),
);
assert.ok(cook.now.length <= 3);
assert.match(cook.now.map((c) => `${c.title} ${c.body}`).join('\n'), /allergenen/i);
assert.equal(
  cook.now.filter((c) => /^Vertel klanten welke allergenen/i.test(c.title)).length,
  0,
  'dedicated allergen card must merge into food safety NOW',
);

const employee = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'OCCASIONAL_EARNING',
    frequency: 'OCCASIONAL',
    intent: 'SIDE_INCOME',
    situationGroup: 'EMPLOYEE',
    allowances: ['HEALTHCARE'],
    hasPartner: false,
    customers: 'PUBLIC',
    estimatedTurnoverEuro: '2000',
    estimatedCostsEuro: '400',
    estimatedAnnualTransactions: '12',
  }),
);
assert.match(employee.headline, /^Je kunt beginnen\.$/);

const existing = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'BUILDING_BUSINESS',
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    customerAcquisition: true,
    situationGroup: 'EXISTING_ENTREPRENEUR',
    alreadyKvkRegistered: true,
    vatRegistrationStatus: 'REGISTERED',
    korParticipating: true,
    estimatedTurnoverEuro: '18000',
    allowances: ['NONE'],
  }),
);
assert.doesNotMatch(
  existing.now.map((c) => `${c.title} ${c.body}`).join('\n'),
  /Controleer je KVK-inschrijving/,
);

const wwWait = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'WW',
    discussedWithUwv: false,
    wantsStartPeriod: true,
    uwvPermission: false,
    formerEmployerWorkPlanned: false,
    receivesUwvSupplement: false,
  }),
);
assert.doesNotMatch(wwWait.headline, /^Je kunt beginnen/);

const copy = getVerdienCheckCopy('nl');
assert.equal(copy.chromeTitle, 'VerdienCheck');
assert.equal(copy.leaveProduct, 'VerdienCheck afsluiten');

const wizardSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
assert.doesNotMatch(wizardSrc, /AppBackBar/);
assert.doesNotMatch(wizardSrc, /backAriaLabel=\{copy\.leaveProduct\}/);
assert.match(wizardSrc, /min-h-1[12] w-full/);
assert.match(wizardSrc, /focus-visible:outline-emerald-700/);
assert.match(
  fs.readFileSync(path.join(process.cwd(), 'components/verdiencheck/VerdienCheckResultCta.tsx'), 'utf8'),
  /leaveProduct/,
);
assert.match(
  fs.readFileSync(path.join(process.cwd(), 'components/navigation/AppBackBar.tsx'), 'utf8'),
  /basis-full/,
);

const privacySrc = fs.readFileSync(
  path.join(process.cwd(), 'components/PrivacyNotice.tsx'),
  'utf8',
);
assert.doesNotMatch(privacySrc, /verdiencheckRoute/);
assert.match(privacySrc, /5\.25rem/);
assert.doesNotMatch(privacySrc, /top-16/);

const publicEntrySrc = fs.readFileSync(
  path.join(process.cwd(), 'components/verdiencheck/VerdienCheckPublicEntry.tsx'),
  'utf8',
);
assert.match(publicEntrySrc, /isVerdienCheckPublicCtaEnabled/);
assert.match(publicEntrySrc, /if \(!isVerdienCheckPublicCtaEnabled\(\)\) return null/);

console.log('verdiencheck phase 5D tests: PASS');
console.log(
  JSON.stringify(
    {
      FLAGS_DEFAULT_OFF: true,
      PUBLIC_CTA_FAIL_CLOSED: true,
      ALLERGEN_NOW_ONCE: true,
      EURO_DISPLAY_OMITS_ZERO_CENTS: true,
    },
    null,
    2,
  ),
);
