/**
 * VerdienCheck post-launch privacy-safe observability.
 *
 *   npx tsx scripts/test-verdiencheck-observability.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import {
  inspectVerdienCheckAnalyticsPayload,
  assertSafeVerdienCheckAnalyticsPayload,
  sanitizeVerdienCheckEntryPoint,
  verdienCheckProgressBucket,
  FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS,
} from '../lib/verdiencheck/privacy/analytics-guard';
import {
  resetVerdienCheckFunnelForTests,
  resetVerdienCheckFunnelOccurrence,
  setVerdienCheckFunnelSinkForTests,
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
  type VerdienCheckFunnelEventName,
} from '../lib/analytics/verdiencheck-funnel';
import { forbiddenAnalyticsKeys, persistenceUsesDatabase } from '../lib/verdiencheck/privacy/session-client';
import { isVerdienWijzerEnabled, isVerdienCheckPersistenceEnabled, isVerdienCheckReceiptVaultEnabled } from '../lib/verdiencheck/flags';

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

type Captured = { event: VerdienCheckFunnelEventName; payload: Record<string, string | number> };

function capture(): Captured[] {
  const events: Captured[] = [];
  resetVerdienCheckFunnelForTests();
  setVerdienCheckFunnelSinkForTests((event, payload) => {
    events.push({ event, payload });
  });
  return events;
}

assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
assert.equal(persistenceUsesDatabase(), false);

// --- privacy guard ---
const forbidden = forbiddenAnalyticsKeys();
for (const key of ['income', 'benefit', 'allowance', 'ww', 'wia', 'wajong', 'bijstand', 'nvwa', 'kvk']) {
  assert.ok(forbidden.includes(key as never) || forbidden.some((k) => k.includes(key)), `missing forbidden ${key}`);
}
assert.ok(FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS.includes('benefittype'));

assert.equal(inspectVerdienCheckAnalyticsPayload({ entry_point: 'faq' }).ok, true);
assert.equal(
  inspectVerdienCheckAnalyticsPayload({
    entry_point: 'seller',
    progress_bucket: 'MIDDLE',
    step_number: 4,
    total_visible_steps: 12,
  }).ok,
  true,
);

const rejected = [
  { income: 24000 },
  { benefitType: 'WW' },
  { question_id: 'benefits', answer: 'yes' },
  { estimated_tax: 100 },
  { net_extra: 50 },
  { result: 'WW' },
  { entry_point: 'faq', ww: true },
  { action: 'WW' },
  { partnerIncome: 1 },
];
for (const payload of rejected) {
  assert.equal(inspectVerdienCheckAnalyticsPayload(payload).ok, false, JSON.stringify(payload));
}

assert.throws(() => assertSafeVerdienCheckAnalyticsPayload({ tax: 1 }));
assert.doesNotThrow(() =>
  assertSafeVerdienCheckAnalyticsPayload({
    entry_point: 'direct',
    action: 'START_SELLING',
  }),
);

assert.equal(sanitizeVerdienCheckEntryPoint('faq'), 'faq');
assert.equal(sanitizeVerdienCheckEntryPoint('careers'), 'careers');
assert.equal(sanitizeVerdienCheckEntryPoint('WW'), 'direct');
assert.equal(sanitizeVerdienCheckEntryPoint('income=1'), 'direct');
assert.equal(sanitizeVerdienCheckEntryPoint(null), 'direct');

assert.equal(
  verdienCheckProgressBucket({ stepIndex: 0, totalVisibleSteps: 10, isResult: false }),
  'START',
);
assert.equal(
  verdienCheckProgressBucket({ stepIndex: 2, totalVisibleSteps: 10, isResult: false }),
  'EARLY',
);
assert.equal(
  verdienCheckProgressBucket({ stepIndex: 5, totalVisibleSteps: 10, isResult: false }),
  'MIDDLE',
);
assert.equal(
  verdienCheckProgressBucket({ stepIndex: 8, totalVisibleSteps: 10, isResult: false }),
  'LATE',
);
assert.equal(
  verdienCheckProgressBucket({ stepIndex: 9, totalVisibleSteps: 10, isResult: true }),
  'RESULT',
);

// --- funnel events + dedup ---
const events = capture();
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.viewed, { entry_point: 'faq' }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.viewed, { entry_point: 'faq' }),
  false,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.started, { entry_point: 'faq' }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.started, { entry_point: 'faq' }),
  false,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.stepProgress, {
    entry_point: 'faq',
    progress_bucket: 'EARLY',
    step_number: 3,
    total_visible_steps: 10,
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.stepProgress, {
    entry_point: 'faq',
    progress_bucket: 'EARLY',
    step_number: 4,
    total_visible_steps: 10,
  }),
  false,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.stepProgress, {
    entry_point: 'faq',
    progress_bucket: 'MIDDLE',
    step_number: 6,
    total_visible_steps: 10,
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.completed, { entry_point: 'faq' }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.completed, { entry_point: 'faq' }),
  false,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.resultViewed, { entry_point: 'faq' }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.officialLinkClicked, {
    entry_point: 'faq',
    action: 'LEARN_MORE',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.signupClicked, {
    entry_point: 'faq',
    action: 'SIGN_UP',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.startSellingClicked, {
    entry_point: 'faq',
    action: 'START_SELLING',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.exitToHomecheff, {
    entry_point: 'faq',
    action: 'RETURN_TO_HOMECHEFF',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.restartClicked, { entry_point: 'faq' }),
  true,
);

assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.viewed, {
    entry_point: 'faq',
    // @ts-expect-error intentional leak attempt
    income: 100,
  }),
  false,
);

const names = events.map((e) => e.event);
assert.equal(names.filter((n) => n === VERDIENCHECK_FUNNEL_EVENTS.viewed).length, 1);
assert.equal(names.filter((n) => n === VERDIENCHECK_FUNNEL_EVENTS.started).length, 1);
assert.equal(names.filter((n) => n === VERDIENCHECK_FUNNEL_EVENTS.completed).length, 1);
assert.ok(names.includes(VERDIENCHECK_FUNNEL_EVENTS.stepProgress));
assert.ok(names.includes(VERDIENCHECK_FUNNEL_EVENTS.resultViewed));
assert.ok(names.includes(VERDIENCHECK_FUNNEL_EVENTS.officialLinkClicked));
assert.ok(names.includes(VERDIENCHECK_FUNNEL_EVENTS.signupClicked));
assert.ok(names.includes(VERDIENCHECK_FUNNEL_EVENTS.startSellingClicked));
assert.ok(names.includes(VERDIENCHECK_FUNNEL_EVENTS.restartClicked));

for (const captured of events) {
  assert.equal(inspectVerdienCheckAnalyticsPayload(captured.payload).ok, true, JSON.stringify(captured));
  const blob = JSON.stringify(captured.payload).toLowerCase();
  assert.equal(/\bincome\b/.test(blob), false);
  assert.equal(/\ballowance\b/.test(blob), false);
  assert.equal(/\bbenefit\b/.test(blob), false);
}

resetVerdienCheckFunnelOccurrence();
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.completed, { entry_point: 'faq' }),
  true,
);

// consent: without gtag and without test sink, no throw
resetVerdienCheckFunnelForTests();
assert.doesNotThrow(() =>
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.viewed, { entry_point: 'direct' }),
);

// --- source invariants ---
const wizard = read('components/verdiencheck/VerdienCheckWizard.tsx');
assert.match(wizard, /trackVerdienCheckFunnelEvent/);
assert.match(wizard, /sessionStorage|writeVerdienCheckSession/);
assert.match(wizard, /VerdienCheckResultCta/);
assert.match(wizard, /clearVerdienCheckSession/);
assert.doesNotMatch(wizard, /gtag\(/);
assert.doesNotMatch(wizard, /\/api\/analytics/);
assert.doesNotMatch(wizard, /prisma/);
assert.doesNotMatch(wizard, /localStorage/);
assert.doesNotMatch(wizard, /proceedSemantics:/);
assert.doesNotMatch(wizard, /question_id/);
assert.doesNotMatch(wizard, /benefitType/);
assert.doesNotMatch(wizard, /console\.log/);

const cta = read('components/verdiencheck/VerdienCheckResultCta.tsx');
assert.match(cta, /Begin met verkopen|copy\.startSelling/);
assert.match(cta, /\/sell\/new/);
assert.match(cta, /useGuestAuthGate/);
assert.match(cta, /SIGN_UP/);
assert.match(cta, /START_SELLING/);
assert.doesNotMatch(cta, /proceedSemantics/);
assert.doesNotMatch(cta, /CHECK_FIRST/);
assert.doesNotMatch(cta, /WW/);

const entry = read('components/verdiencheck/VerdienCheckPublicEntry.tsx');
assert.match(entry, /verdiencheck\?from=\$\{from\}/);
assert.match(entry, /sanitizeVerdienCheckEntryPoint/);

const careers = read('app/careers/page.tsx');
assert.match(careers, /entryPoint="careers"/);
const werken = read('app/werken-bij/page.tsx');
assert.match(werken, /entryPoint="werken-bij"/);
const seller = read('app/onboarding/seller/layout.tsx');
assert.match(seller, /variant="seller"/);
const faq = read('app/faq/layout.tsx');
assert.match(faq, /variant="faq"/);

const page = read('app/verdiencheck/page.tsx');
assert.match(page, /VerdienCheckErrorBoundary/);
assert.doesNotMatch(page, /searchParams/);

const session = read('lib/verdiencheck/privacy/session-client.ts');
assert.match(session, /sessionStorage/);
assert.doesNotMatch(session, /window\.localStorage/);
assert.doesNotMatch(session, /prisma/);

const funnel = read('lib/analytics/verdiencheck-funnel.ts');
assert.match(funnel, /gtag !== 'function'/);
assert.doesNotMatch(funnel, /fingerprint/);
assert.doesNotMatch(funnel, /randomUUID/);

console.log('verdiencheck observability tests: PASS');
console.log(
  JSON.stringify(
    {
      EVENTS: Object.values(VERDIENCHECK_FUNNEL_EVENTS),
      PRIVACY_GUARD: true,
      EVENT_DEDUPLICATION: true,
      SESSION_STORAGE_ONLY: true,
      DATABASE_PERSISTENCE: false,
    },
    null,
    2,
  ),
);
