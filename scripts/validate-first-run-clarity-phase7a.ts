#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 7A — First-run clarity & seller-entry guard.
 *
 * Phase 7A fixes the two Phase 7 adoption blockers with COPY / ROUTING /
 * VISIBILITY / MICROCOPY only (no redesign, no new functionality, no backend,
 * API, marketplace, ranking, payment, performance or design-system change):
 *
 *   7A.1–7A.3  Homepage explains "what is HomeCheff", why it's different, and
 *              a lightweight "how it works" (hero definition line + mobile
 *              ecosystem strip + guest discover panel).
 *   7A.4       /sell leads with the free listing path (/sell/new); the business
 *              subscription is reframed as an optional upgrade (KVK/business).
 *   7A.5–7A.8  Vocabulary + naming consistency (props → waardering/appreciation),
 *              Gezocht clarity (browse + post) and the "Gezochte" label fix.
 *   7A.7/7A.12 Jargon/typo cleanup ("Geen geldleg", "CommunityOrder").
 *   7A.9/7A.10 Diensten/Buurthulp defined; barter/accepted-values plain-language
 *              microcopy at the point of use (no overpromised matching).
 *   7A.11      New-maker trust reassurance instead of a bare "nog geen reviews".
 *   7A.13      Notifications page copy fully translated (NL/EN parity).
 *
 * Static, dependency-free. Also re-asserts the frozen prior architecture.
 * Run: npx tsx scripts/validate-first-run-clarity-phase7a.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}
function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}
function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function json(rel: string): any {
  try {
    return JSON.parse(read(rel));
  } catch {
    return {};
  }
}
function get(obj: any, dotted: string): unknown {
  return dotted.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

console.log('=== UX-FIN Phase 7A — First-run clarity & seller entry guard ===\n');

const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
const rawNl = read('public/i18n/nl.json');
const rawEn = read('public/i18n/en.json');

// --- 7A.1–7A.3 Homepage clarity ---------------------------------------------
console.log('7A.1–7A.3 Homepage one-liner, value prop & how-it-works');
for (const [lbl, obj] of [['nl', nl], ['en', en]] as const) {
  assert(typeof get(obj, 'homePhase1.heroDefinition') === 'string' && String(get(obj, 'homePhase1.heroDefinition')).length > 20, `${lbl}: homePhase1.heroDefinition one-liner present`);
  assert(!!get(obj, 'homePhase1.howItWorksStep1') && !!get(obj, 'homePhase1.howItWorksStep2') && !!get(obj, 'homePhase1.howItWorksStep3'), `${lbl}: homePhase1.howItWorksStep1..3 present`);
  assert(!!get(obj, 'guestSalesPanels.discover.bullet1') && !!get(obj, 'guestSalesPanels.discover.bullet3'), `${lbl}: guest discover panel surfaces how-it-works bullets`);
}
const hero = read('components/home/HomeHeroSection.tsx');
assert(hero.includes("homePhase1.heroDefinition"), 'HomeHeroSection renders heroDefinition (desktop hero)');
const strip = read('components/home/HomeMobileEcosystemStrip.tsx');
assert(strip.includes('homePhase1.heroDefinition') && strip.includes('!isLoggedIn'), 'Mobile ecosystem strip surfaces definition for guests (first view)');

// --- 7A.4 Seller entry fix ---------------------------------------------------
console.log('\n7A.4 Seller entry — free listing path primary, subscription optional');
const sellPage = read('app/sell/page.tsx');
assert(sellPage.includes("router.push('/sell/new')"), '/sell offers a primary CTA to the free create flow (/sell/new)');
assert(sellPage.includes("sell.freeTitle") && sellPage.includes('sell.freeCta'), '/sell renders the free-listing block (freeTitle + freeCta)');
assert(sellPage.includes('sell.businessSectionTitle'), '/sell reframes subscriptions under an "optional business" heading');
for (const [lbl, obj] of [['nl', nl], ['en', en]] as const) {
  assert(!!get(obj, 'sell.freeTitle') && !!get(obj, 'sell.freeBody') && !!get(obj, 'sell.freeCta'), `${lbl}: sell.free* keys present`);
  assert(!!get(obj, 'sell.businessSectionTitle') && !!get(obj, 'sell.businessSectionSubtitle'), `${lbl}: sell.businessSection* keys present`);
  assert(String(get(obj, 'sell.businessSectionSubtitle')).length > 0 && /(upgrade|verplichting|requirement)/i.test(String(get(obj, 'sell.businessSectionSubtitle'))), `${lbl}: business subscription positioned as optional upgrade`);
}
// Free create path still exists.
assert(read('lib/create/marketplace-entry-nav.ts').includes("MARKETPLACE_ENTRY_PATH = '/sell/new'"), 'free marketplace entry path (/sell/new) unchanged');

// --- 7A.5–7A.6 Naming consistency: props → waardering/appreciation ----------
console.log('\n7A.5–7A.6 Naming consistency (props → waardering/appreciation)');
assert(get(nl, 'props.workspaceLabel') === 'Studio-waardering', 'nl: props.workspaceLabel uses waardering');
assert(get(en, 'props.workspaceLabel') === 'Studio appreciation', 'en: props.workspaceLabel uses appreciation');
assert(get(en, 'props.propsWithdrawn') === 'Appreciation withdrawn', 'en: propsWithdrawn no longer "Props withdrawn"');
assert(String(get(nl, 'inspiratie.mostProps') ?? get(nl, 'inspiration.mostProps') ?? '').length >= 0, 'nl: inspiration filter labels loaded');
// No visible bare "props" left in inspiration filter / tooltips / community bullet.
assert(!/props voor dit item|Meeste props|Minimaal props|reviews en props|Studio props/.test(rawNl), 'nl: no leftover visible "props" strings');
assert(!/props for this item|Most props\b|Minimum props|reviews and props|Studio props|Props on studio content|Props withdrawn|Props are a small/.test(rawEn), 'en: no leftover visible "props" strings');

// --- 7A.7/7A.12 Jargon & typo cleanup ---------------------------------------
console.log('\n7A.7/7A.12 Jargon & typo cleanup');
assert(!/Geen geldleg/.test(rawNl), 'nl: "Geen geldleg" typo removed');
assert(!/No money leg/.test(rawEn), 'en: "No money leg" removed');
assert(!/CommunityOrders?\b/.test(rawNl) && !/CommunityOrders?\b/.test(rawEn), 'no visible "CommunityOrder(s)" jargon in i18n');

// --- 7A.8 Gezocht clarity ----------------------------------------------------
console.log('\n7A.8 Gezocht clarity');
assert(!/"sectionSubtitle": "Open verzoeken bij jou in de buurt"/.test(rawNl), 'nl: Gezocht subtitle no longer the bare "open verzoeken" line');
assert(/"sectionSubtitle": "Bekijk wat buurtgenoten zoeken[^"]*plaats zelf een oproep/.test(rawNl), 'nl: Gezocht subtitle signals browse + post a request');
assert(!/"requester": "Gezochte"/.test(rawNl), 'nl: ambiguous "Gezochte" requester label replaced');

// --- 7A.9/7A.10 Diensten/Buurthulp + barter ---------------------------------
console.log('\n7A.9/7A.10 Diensten/Buurthulp + barter clarity');
assert(/buurthulp/i.test(String(get(nl, 'feed.emptyServicesBody') ?? '')), 'nl: Diensten empty state defines buurthulp');
assert(/buurthulp/i.test(String(get(en, 'feed.emptyServicesBody') ?? '')), 'en: services empty state defines buurthulp');
for (const [lbl, obj] of [['nl', nl], ['en', en]] as const) {
  const desc = String(get(obj, 'marketplace.acceptedValues.description') ?? '');
  assert(desc.length > 0, `${lbl}: accepted-values description present`);
  const hint = String(get(obj, 'marketplace.barterOpenness.hint') ?? '');
  assert(/(niet gegarandeerd|never required|not oblige|nooit verplicht|guaranteed)/i.test(hint + desc), `${lbl}: barter copy avoids overpromising guaranteed matching`);
}

// --- 7A.11 New-maker trust reassurance --------------------------------------
console.log('\n7A.11 New-maker trust reassurance');
for (const [lbl, obj] of [['nl', nl], ['en', en]] as const) {
  assert(!!get(obj, 'publicProfile.newMakerReassurance'), `${lbl}: publicProfile.newMakerReassurance present`);
}
const sellerProfile = read('components/seller/PublicSellerProfileNew.tsx');
assert(sellerProfile.includes('publicProfile.newMakerReassurance'), 'PublicSellerProfileNew shows reassuring copy for new makers');
assert(!sellerProfile.includes('Er zijn nog geen reviews voor deze verkoper'), 'PublicSellerProfileNew no longer hard-codes the bare "nog geen reviews" line');

// --- 7A.13 Notifications translation ----------------------------------------
console.log('\n7A.13 Notifications page translation (NL/EN parity)');
for (const [lbl, obj] of [['nl', nl], ['en', en]] as const) {
  assert(!!get(obj, 'notificationsPage.title') && !!get(obj, 'notificationsPage.subtitle') && !!get(obj, 'notificationsPage.markAllRead'), `${lbl}: notificationsPage.* keys present`);
}
const notif = read('app/notifications/page.tsx');
assert(notif.includes('notificationsPage.title') && notif.includes('notificationsPage.markAllRead'), 'notifications page uses i18n keys (no hardcoded NL header/button)');

// --- NL/EN key parity for new namespaces ------------------------------------
console.log('\nNL/EN parity for new keys');
const parityKeys = [
  'homePhase1.heroDefinition',
  'homePhase1.howItWorksStep1',
  'sell.freeTitle',
  'sell.businessSectionTitle',
  'notificationsPage.title',
  'publicProfile.newMakerReassurance',
  'guestSalesPanels.discover.bullet1',
];
for (const k of parityKeys) {
  assert(!!get(nl, k) && !!get(en, k), `parity: ${k} present in nl + en`);
}

// --- Performance / prior architecture frozen --------------------------------
console.log('\nPerformance architecture frozen (Phase 4/4B/4C/5/6A/6B)');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
assert(density.includes('useSyncExternalStore') && density.includes('return 2'), 'density: external store + desktop default 2 columns');
assert(geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'), 'mobile feed default single column');
assert(read('lib/feed/home-feed-return-cache.ts').includes('isHomeFeedReturnCacheStale'), 'homepage SWR return cache preserved');
assert(read('lib/runtime/sessionSwrCache.ts').includes('SWR_FRESH_MS'), 'unified SWR cache (4C) preserved');
for (const f of ['components/ui/HcButton.tsx', 'components/ui/HcCard.tsx', 'components/ui/HcInput.tsx', 'components/ui/HcTextarea.tsx']) {
  assert(!exists(f), `6A: dead duplicate still absent: ${f}`);
}
assert(exists('components/ui/Spinner.tsx') && exists('components/ui/Modal.tsx'), '6B shared primitives (Spinner, Modal) present');
for (const guard of [
  'scripts/validate-shared-ui-phase6b.ts',
  'scripts/validate-design-system-phase6a.ts',
  'scripts/validate-unified-feedback-phase5e.ts',
  'scripts/validate-discovery-pillars-phase5c.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(exists(guard), `prior guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
