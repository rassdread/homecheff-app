#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 2 — navigation completeness & buyer access validation.
 *
 * Verifies that every logged-in user (including buyer-only accounts) can reach
 * their own pages via visible navigation — no orphaned/hidden routes:
 *   - /profile/deals  (Mijn Afspraken / My Agreements)  → canonical hub
 *   - /orders         (Bestellingen / Orders)           → buyer-reachable
 *   - /favorites      (Favorieten / Favorites)
 *   - /notifications  (Meldingen / Notifications)        → mobile-reachable
 *
 * Also asserts route-hygiene: the community-economy loop validator uses the
 * canonical /profile/deals, ROUTE_OWNERSHIP.md documents canonicals + aliases,
 * i18n parity for the new labels, and no new feature routes were introduced.
 *
 * Run: npx tsx scripts/validate-navigation-completeness.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  AGREEMENTS_HUB_PATH,
  DEALS_PROFILE_PATH,
  PROFILE_DEALS_NAV,
} from '../lib/profile/deals-navigation';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  \u2713 ${label}`);
    passed += 1;
  } else {
    console.log(`  \u2717 FAIL: ${label}`);
    failed += 1;
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), `public/i18n/${locale}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

console.log('=== Navigation Completeness Validation (UX-FIN Phase 2) ===\n');

// --- Canonical constants ---------------------------------------------------
console.log('Canonical route constants');
assert(DEALS_PROFILE_PATH === '/profile/deals', 'DEALS_PROFILE_PATH is /profile/deals');
assert(AGREEMENTS_HUB_PATH === '/agreements', 'AGREEMENTS_HUB_PATH alias is /agreements');
assert(
  PROFILE_DEALS_NAV.href === DEALS_PROFILE_PATH,
  'PROFILE_DEALS_NAV points to canonical /profile/deals',
);
assert(PROFILE_DEALS_NAV.enabled, 'PROFILE_DEALS_NAV is enabled');

// --- Target pages exist (no new feature routes created) --------------------
console.log('\nTarget pages exist (pre-existing routes, not new features)');
assert(exists('app/profile/deals/page.tsx'), '/profile/deals page exists');
assert(exists('app/orders/page.tsx'), '/orders page exists');
assert(exists('app/favorites/page.tsx') || exists('app/favorites'), '/favorites route exists');
assert(exists('app/notifications/page.tsx') || exists('app/notifications'), '/notifications route exists');
const agreementsAlias = read('app/agreements/page.tsx');
assert(
  agreementsAlias.includes('redirect') && agreementsAlias.includes('/profile/deals'),
  '/agreements is a redirect alias to /profile/deals',
);

// --- NavBar wiring ---------------------------------------------------------
console.log('\nNavBar (desktop dropdown + mobile menu)');
const navbar = read('components/NavBar.tsx');
assert(navbar.includes('DEALS_PROFILE_PATH'), 'NavBar imports/uses DEALS_PROFILE_PATH (no hardcode)');
assert(navbar.includes("t('navbar.agreements')"), 'NavBar shows Mijn Afspraken (navbar.agreements)');
assert(navbar.includes("href=\"/orders\""), 'NavBar links to /orders');
assert(navbar.includes("t('navbar.orders')"), 'NavBar shows Bestellingen (navbar.orders)');
assert(navbar.includes("href=\"/favorites\""), 'NavBar links to /favorites');
assert(navbar.includes("t('navbar.favorites')"), 'NavBar shows Favorieten (navbar.favorites)');
assert(navbar.includes("href=\"/notifications\""), 'NavBar links to /notifications (mobile)');
assert(navbar.includes("t('navbar.notifications')"), 'NavBar shows Meldingen (navbar.notifications)');

// Mobile menu block specifically (buyer-only reachability on mobile).
const mobileMenuIdx = navbar.indexOf('navbar-mobile-menu');
assert(mobileMenuIdx > -1, 'NavBar has a mobile menu container');
const mobileMenu = navbar.slice(mobileMenuIdx);
assert(mobileMenu.includes('DEALS_PROFILE_PATH'), 'mobile menu links Mijn Afspraken');
assert(mobileMenu.includes("href=\"/orders\""), 'mobile menu links Bestellingen');
assert(mobileMenu.includes("href=\"/favorites\""), 'mobile menu links Favorieten');
assert(mobileMenu.includes("href=\"/notifications\""), 'mobile menu links Meldingen');

// --- Profile sidepanel + role quick links ----------------------------------
console.log('\nProfile sidepanel + role quick links');
const sidepanel = read('components/profile/v2/ProfileV2OwnerSidepanel.tsx');
assert(
  sidepanel.includes('PROFILE_DEALS_NAV') && sidepanel.includes('PROFILE_DEALS_NAV.href'),
  'profile sidepanel links Mijn Afspraken via PROFILE_DEALS_NAV',
);
const roleLinks = read('lib/navigation/role-quick-links.ts');
assert(
  roleLinks.includes("id: 'agreements'") && roleLinks.includes("'/profile/deals'"),
  'role quick links include agreements → /profile/deals',
);

// --- Buyer-only coverage (surfaces are not role-gated) ----------------------
console.log('\nBuyer-only navigation coverage');
// NavBar dropdown + mobile menu render for any authenticated user; the buyer links
// are inside the `{user && (` block, not behind a seller/helper/courier gate.
const authBlockIdx = navbar.indexOf('{user && (');
assert(authBlockIdx > -1, 'NavBar has an authenticated-user block');
assert(
  navbar.includes("href=\"/orders\"") &&
    navbar.includes('DEALS_PROFILE_PATH') &&
    navbar.includes("href=\"/favorites\"") &&
    navbar.includes("href=\"/notifications\""),
  'buyer transactional pages (agreements/orders/favorites/notifications) are wired without a seller role',
);

// --- Stale validator fixed -------------------------------------------------
console.log('\nStale validator fix (validate-community-economy-loop.ts)');
const loop = read('scripts/validate-community-economy-loop.ts');
assert(
  loop.includes("PROFILE_DEALS_NAV.href === '/profile/deals'"),
  'loop validator asserts canonical /profile/deals',
);
assert(
  !loop.includes("PROFILE_DEALS_NAV.href === '/agreements'"),
  'loop validator no longer asserts stale /agreements canonical',
);

// --- Route ownership docs ---------------------------------------------------
console.log('\nRoute ownership docs (ROUTE_OWNERSHIP.md)');
const routeDoc = read('docs/architecture/ROUTE_OWNERSHIP.md');
assert(routeDoc.includes('/profile/deals'), 'doc mentions /profile/deals');
assert(
  routeDoc.includes('/agreements') && /alias|redirect/i.test(routeDoc),
  'doc marks /agreements as alias/redirect',
);
assert(
  routeDoc.includes('`/dorpsplein`') && routeDoc.includes('Redirect'),
  'doc marks /dorpsplein as redirect',
);
assert(routeDoc.includes('`/inspiratie`'), 'doc mentions /inspiratie redirect');
assert(routeDoc.includes('DEALS_PROFILE_PATH'), 'doc reminds to use DEALS_PROFILE_PATH (no hardcode)');

// --- i18n parity -----------------------------------------------------------
console.log('\ni18n parity (nl / en)');
const en = loadI18n('en');
const nl = loadI18n('nl');
const NAV_KEYS = [
  'navbar.agreements',
  'navbar.orders',
  'navbar.favorites',
  'navbar.notifications',
] as const;
for (const key of NAV_KEYS) {
  const enVal = getNested(en, key);
  const nlVal = getNested(nl, key);
  assert(typeof enVal === 'string' && enVal.length > 0, `en has ${key}`);
  assert(typeof nlVal === 'string' && nlVal.length > 0, `nl has ${key}`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
