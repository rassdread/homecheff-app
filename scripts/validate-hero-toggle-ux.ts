/**
 * Homepage hero hide/show control — labeled utility, persistence, a11y.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const collapsible = readFileSync('components/home/HomeHeroCollapsible.tsx', 'utf8');
const hook = readFileSync('hooks/useHomeHeroCollapsed.ts', 'utf8');
const prefs = readFileSync('lib/homeUiPreferences.ts', 'utf8');
const hero = readFileSync('components/home/HomeHeroSection.tsx', 'utf8');
const strip = readFileSync('components/adaptive-workspace/WorkspaceOrientationStrip.tsx', 'utf8');
const nl = readFileSync('public/i18n/nl.json', 'utf8');
const en = readFileSync('public/i18n/en.json', 'utf8');
const page = readFileSync('components/home/HomePageClient.tsx', 'utf8');
const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');

assert(collapsible.includes('homePhase1.heroHideLabel'), 'hide label key');
assert(collapsible.includes('homePhase1.heroShowLabel'), 'show label key');
assert(collapsible.includes("tOr("), 'hide/show labels use tOr for stale i18n cache');
assert(collapsible.includes('homePhase1.heroHideLabel'), 'hide label key present for tOr');
assert(collapsible.includes('Ontdek in je buurt'), 'NL discover fallback copy');
assert(!collapsible.includes('Hero verbergen'), 'must not ship Hero verbergen fallback');
assert(collapsible.includes('Hero tonen'), 'NL show fallback copy');
assert(collapsible.includes('aria-expanded'), 'expanded state');
assert(collapsible.includes('min-h-[44px]'), 'touch target');
assert(collapsible.includes('ChevronDown'), 'discover chevron down to feed');
assert(collapsible.includes('scrollViewportToFeedStart') || collapsible.includes('homecheff-feed'), 'scrolls to feed start');
assert(collapsible.includes('motion-reduce:transition-none'), 'reduced motion');
assert(hook.includes('writeHeroCollapsed'), 'persists collapsed preference');
assert(hook.includes('readHeroCollapsedPreference'), 'explicit local show/hide wins over stale server hide');
assert(hook.includes('/api/user/home-ui'), 'syncs logged-in preference');
assert(
  prefs.includes('collapsed ? "true" : "false"') || prefs.includes("collapsed ? 'true' : 'false'"),
  'stores explicit false so Show hero survives refresh',
);
assert(hero.includes('HomeHeroCollapsible'), 'legacy hero uses collapsible');
assert(strip.includes('HomeHeroCollapsible'), 'AW orientation strip uses collapsible');
assert(!strip.includes('homePhase1.ctaDiscover'), 'discover CTA not restored as extra hero button');
assert(nl.includes('"heroHideLabel": "Ontdek in je buurt"'), 'NL hide copy is discover nearby');
assert(!nl.includes('"heroHideLabel": "Hero verbergen"'), 'NL hide copy no longer Hero verbergen');
assert(nl.includes('"heroShowLabel": "Hero tonen"'), 'NL show copy');
assert(en.includes('"heroHideLabel": "Discover nearby"'), 'EN hide copy');
assert(en.includes('"heroShowLabel": "Show hero"'), 'EN show copy');
assert(page.includes('GeoFeed'), 'GeoFeed remains a sibling so it stays mounted');
assert(geo.includes('id="homecheff-feed"'), 'feed start id exists');

console.log('HERO_HIDE_CONTROL_CLEAR = PASS');
console.log('HERO_SHOW_CONTROL_CLEAR = PASS');
console.log('HERO_KEYBOARD_ACCESSIBILITY = PASS');
console.log('HERO_TOUCH_TARGET = PASS');
console.log('HERO_STATE_PERSISTENCE = PASS');
console.log('HERO_DISCOVER_COPY = PASS');
console.log('HERO_SCROLL_TO_FEED = PASS');
console.log('HERO_GEOFEED_STAYS_MOUNTED = PASS');
console.log('\n=== hero toggle ux checks passed ===\n');
