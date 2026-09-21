/**
 * VerdienCheck acquisition + viral loop — presentation/handoff only.
 * Engines stay frozen.
 *
 *   npx tsx scripts/test-verdiencheck-acquisition-loop.ts
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  inspectVerdienCheckAnalyticsPayload,
  FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS,
} from '../lib/verdiencheck/privacy/analytics-guard';
import {
  resetVerdienCheckFunnelForTests,
  setVerdienCheckFunnelSinkForTests,
  trackVerdienCheckFunnelEvent,
  VERDIENCHECK_FUNNEL_EVENTS,
} from '../lib/analytics/verdiencheck-funnel';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import {
  listingCtaPromptKey,
  resolveResultCtaMode,
} from '../lib/verdiencheck/presentation/earning-context';
import {
  buildVerdienCheckShareUrl,
  canonicalVerdienCheckUrl,
  countRefAttribution,
  shareUrlContainsFinancialState,
} from '../lib/verdiencheck/share-url';
import { sanitizePostAuthRelativeUrl } from '../lib/auth/post-auth-redirect';
import { OPPORTUNITY_DESTINATIONS } from '../lib/share/ecosystem-opportunities';

const ROOT = process.cwd();
const nl = getVerdienCheckCopy('nl');

function sha(rel: string): string {
  return createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

assert.equal(nl.intro, 'Wat zou jij écht overhouden als je iets gaat verkopen?');
assert.equal(
  nl.introReassurance,
  'Bereken wat kosten, belasting en toeslagen betekenen voor jouw situatie.',
);
assert.equal(nl.introNoAccount, 'Geen account nodig.');
assert.equal(nl.startForMySituation, 'Bereken wat ik overhoud');
assert.doesNotMatch(nl.intro + nl.introReassurance + nl.startForMySituation, /minuten|seconden|2 min/);
assert.equal(nl.placeFirstOffer, 'Plaats mijn eerste aanbod');
assert.equal(nl.placeNewOffer, 'Plaats een nieuw aanbod');
assert.equal(nl.shareAction, 'Deel VerdienCheck');
assert.equal(nl.shareAfterResult, 'Ken je iemand die wil weten wat die écht zou overhouden?');
assert.equal(nl.ctaPromptFood, 'Klaar om te ontdekken of mensen jouw eten willen bestellen?');
assert.equal(nl.ctaPromptGarden, 'Maak van wat je kweekt je eerste verkoop.');
assert.equal(nl.ctaPromptMake, 'Ontdek of mensen willen kopen wat jij maakt.');
assert.equal(nl.ctaPromptService, 'Zet je talent om in extra inkomen.');
assert.match(nl.growthBeginSmall, /Begin klein/);
assert.match(nl.affiliateDiscoverLink, /affiliate/i);
assert.equal(nl.exampleRevenueAmount, '€10.000');
assert.equal(nl.exampleCostsAmount, '− €4.000');
assert.equal(nl.exampleResultAmount, '€6.000');

assert.equal(listingCtaPromptKey('FOOD'), 'ctaPromptFood');
assert.equal(listingCtaPromptKey('GARDEN'), 'ctaPromptGarden');
assert.equal(listingCtaPromptKey('MAKE'), 'ctaPromptMake');
assert.equal(listingCtaPromptKey('SERVICE'), 'ctaPromptService');

assert.equal(
  resolveResultCtaMode({
    intent: 'GENERAL',
    activity: 'MAKE',
    semantics: 'READY_TO_PROCEED',
  }),
  'SELL_PRIMARY',
);
assert.equal(
  resolveResultCtaMode({
    intent: 'GENERAL',
    activity: 'FOOD',
    semantics: 'READY_TO_PROCEED',
  }),
  'SELL_PRIMARY',
);
assert.equal(
  resolveResultCtaMode({
    intent: 'GENERAL',
    activity: 'AFFILIATE',
    semantics: 'READY_TO_PROCEED',
  }),
  'AFFILIATE',
);
assert.equal(
  resolveResultCtaMode({
    intent: 'GENERAL',
    activity: 'MAKE',
    semantics: 'CHECK_FIRST',
  }),
  'NONE',
);
assert.equal(
  resolveResultCtaMode({
    intent: 'HOMECHEFF_SELLER',
    activity: 'MAKE',
    semantics: 'PROCEED_AFTER_ACTION',
  }),
  'SELL_SECONDARY',
);

const ctaSrc = read('components/verdiencheck/VerdienCheckResultCta.tsx');
assert.match(ctaSrc, /savePendingIntent/);
assert.match(ctaSrc, /\/sell\/new/);
assert.match(ctaSrc, /useGuestAuthGate/);
assert.match(ctaSrc, /placeFirstOffer/);
assert.match(ctaSrc, /placeNewOffer/);
assert.match(ctaSrc, /affiliateDiscoverLink/);
assert.match(ctaSrc, /VerdienCheckGrowthPath/);
assert.match(ctaSrc, /OPPORTUNITY_DESTINATIONS\.affiliate/);
assert.doesNotMatch(ctaSrc, /income=|omzet=|result=/);
assert.doesNotMatch(ctaSrc, /proceedSemantics/);
assert.doesNotMatch(ctaSrc, /CHECK_FIRST/);

const wizardSrc = read('components/verdiencheck/VerdienCheckWizard.tsx');
assert.match(wizardSrc, /introNoAccount/);
assert.doesNotMatch(wizardSrc, /copy\.introGrowth/);
assert.match(wizardSrc, /scenarioCompleted/);
assert.match(wizardSrc, /includeShare/);
const sellIdx = wizardSrc.indexOf('variant="sell"');
const moneyIdx = wizardSrc.indexOf('copy.moneyPrompt');
assert.ok(moneyIdx > 0 && sellIdx > moneyIdx, 'money prompt still before HomeCheff CTA');

const growthSrc = read('components/verdiencheck/VerdienCheckGrowthPath.tsx');
assert.match(growthSrc, /growthBeginSmall/);
assert.match(growthSrc, /introGrowth/);
assert.doesNotMatch(growthSrc, /automatisch inschrijven|wij schrijven je in/i);

const activationSrc = read('lib/verdiencheck/activation-handoff.ts');
assert.match(activationSrc, /hc_verdiencheck_activation/);
assert.doesNotMatch(activationSrc, /income|omzet|kosten|toeslag|partner/);
assert.match(activationSrc, /sessionStorage/);

const registerSrc = read('app/register/page.tsx');
assert.match(registerSrc, /returnUrl/);
assert.match(registerSrc, /trackVerdienCheckSignupCompletedIfPending/);
assert.match(read('hooks/useGuestAuthGate.tsx'), /register\?returnUrl=/);
assert.match(read('hooks/useGuestAuthGate.tsx'), /login\?callbackUrl=/);

const sellSrc = read('app/sell/new/page.tsx');
assert.match(sellSrc, /trackVerdienCheckListingStartedIfPending/);
assert.match(sellSrc, /savePendingIntent/);
assert.match(read('components/products/marketplace/MarketplaceOfferForm.tsx'), /trackVerdienCheckListingPublishedIfPending/);
assert.match(read('components/profile/v2/ProfileV2Client.tsx'), /Deel je aanbod/);
assert.match(read('components/profile/v2/ProfileV2Client.tsx'), /ShareButton/);

assert.equal(sanitizePostAuthRelativeUrl('/sell/new'), '/sell/new');
assert.equal(sanitizePostAuthRelativeUrl('https://evil.example/sell/new'), null);

const shared = buildVerdienCheckShareUrl({ referralCode: 'REFCODE1' });
assert.equal(countRefAttribution(shared), 1);
assert.equal(shareUrlContainsFinancialState(shared), false);
assert.equal(canonicalVerdienCheckUrl().endsWith('/verdiencheck'), true);
assert.equal(OPPORTUNITY_DESTINATIONS.verdiencheck.href, '/verdiencheck');
assert.equal(OPPORTUNITY_DESTINATIONS.affiliate.href, '/affiliate');

for (const key of [
  'income',
  'omzet',
  'kosten',
  'result',
  'toeslag',
  'allowance',
  'partner',
  'rent',
  'children',
  'childcare',
  'tax',
] as const) {
  assert.ok(
    (FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS as readonly string[]).includes(key),
    `missing forbidden ${key}`,
  );
}

assert.equal(inspectVerdienCheckAnalyticsPayload({ income: 3200 }).ok, false);
assert.equal(inspectVerdienCheckAnalyticsPayload({ omzet: 10000 }).ok, false);
assert.equal(inspectVerdienCheckAnalyticsPayload({ result: 6000 }).ok, false);
assert.equal(
  inspectVerdienCheckAnalyticsPayload({
    authenticated: 'yes',
    cta_id: 'sell_primary',
    funnel_stage: 'result',
  }).ok,
  true,
);
assert.equal(inspectVerdienCheckAnalyticsPayload({ funnel_stage: 'result', activity: 'FOOD' }).ok, false);

resetVerdienCheckFunnelForTests();
const captured: string[] = [];
setVerdienCheckFunnelSinkForTests((event) => {
  captured.push(event);
});
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.viewed, { funnel_stage: 'landing' }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.started, { funnel_stage: 'started' }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.moneyCompleted, {
    funnel_stage: 'baseline',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.scenarioCompleted, {
    funnel_stage: 'scenario',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.homecheffCtaClicked, {
    action: 'SIGN_UP',
    authenticated: 'no',
    cta_id: 'sell_primary',
    funnel_stage: 'result',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.share, {
    action: 'SHARE',
    cta_id: 'share',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.signupCompleted, {
    authenticated: 'yes',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.firstListingStarted, {
    authenticated: 'yes',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.firstListingPublished, {
    authenticated: 'yes',
  }),
  true,
);
assert.equal(
  trackVerdienCheckFunnelEvent(VERDIENCHECK_FUNNEL_EVENTS.homecheffCtaClicked, {
    action: 'SIGN_UP',
    authenticated: 'no',
    cta_id: 'sell_primary',
  }),
  false,
);
assert.deepEqual(
  [
    VERDIENCHECK_FUNNEL_EVENTS.viewed,
    VERDIENCHECK_FUNNEL_EVENTS.started,
    VERDIENCHECK_FUNNEL_EVENTS.moneyCompleted,
    VERDIENCHECK_FUNNEL_EVENTS.scenarioCompleted,
    VERDIENCHECK_FUNNEL_EVENTS.homecheffCtaClicked,
    VERDIENCHECK_FUNNEL_EVENTS.share,
    VERDIENCHECK_FUNNEL_EVENTS.signupCompleted,
    VERDIENCHECK_FUNNEL_EVENTS.firstListingStarted,
    VERDIENCHECK_FUNNEL_EVENTS.firstListingPublished,
  ].every((name) => captured.includes(name)),
  true,
);

const engineFiles = [
  'lib/verdiencheck/calculator/engine.ts',
  'lib/verdiencheck/nl2026/healthcare-allowance.ts',
  'lib/verdiencheck/nl2026/housing-allowance.ts',
  'lib/verdiencheck/nl2026/child-budget.ts',
  'lib/verdiencheck/nl2026/childcare-allowance.ts',
  'lib/verdiencheck/nl2026/zvw.ts',
  'lib/verdiencheck/nl2026/net-to-gross.ts',
  'lib/verdiencheck/personal-route/orchestrator.ts',
];
for (const rel of engineFiles) {
  assert.doesNotMatch(ctaSrc, new RegExp(path.basename(rel).replace('.', '\\.')));
  assert.doesNotMatch(activationSrc, /runCalculator|buildPersonalVerdienRoute/);
}

const hashes = Object.fromEntries(engineFiles.map((rel) => [rel, sha(rel)]));

console.log(
  JSON.stringify(
    {
      LANDING_VALUE_PROP: nl.intro,
      PRIMARY_CTA: nl.startForMySituation,
      RESULT_PRIMARY_CTA: nl.placeFirstOffer,
      AUTHENTICATED_CTA: nl.placeNewOffer,
      GENERAL_LISTING_CTA: 'SELL_PRIMARY',
      AFFILIATE_CTA: 'AFFILIATE',
      SHARE_LOOP: canonicalVerdienCheckUrl(),
      AFFILIATE_DESTINATION: OPPORTUNITY_DESTINATIONS.affiliate.href,
      VIEW_EVENT: VERDIENCHECK_FUNNEL_EVENTS.viewed,
      START_EVENT: VERDIENCHECK_FUNNEL_EVENTS.started,
      BASELINE_COMPLETE_EVENT: VERDIENCHECK_FUNNEL_EVENTS.moneyCompleted,
      SCENARIO_COMPLETE_EVENT: VERDIENCHECK_FUNNEL_EVENTS.scenarioCompleted,
      CTA_CLICK_EVENT: VERDIENCHECK_FUNNEL_EVENTS.homecheffCtaClicked,
      SHARE_EVENT: VERDIENCHECK_FUNNEL_EVENTS.share,
      SIGNUP_START_EVENT: VERDIENCHECK_FUNNEL_EVENTS.signupClicked,
      SIGNUP_COMPLETE_EVENT: VERDIENCHECK_FUNNEL_EVENTS.signupCompleted,
      LISTING_START_EVENT: VERDIENCHECK_FUNNEL_EVENTS.firstListingStarted,
      LISTING_PUBLISHED_EVENT: VERDIENCHECK_FUNNEL_EVENTS.firstListingPublished,
      ENGINE_HASHES: hashes,
    },
    null,
    2,
  ),
);
console.log('verdiencheck acquisition loop tests: PASS');
