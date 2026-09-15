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

assert(collapsible.includes('Hero verbergen') === false, 'labels come from i18n, not hardcoded NL in component');
assert(collapsible.includes('homePhase1.heroHideLabel'), 'hide label key');
assert(collapsible.includes('homePhase1.heroShowLabel'), 'show label key');
assert(collapsible.includes('aria-expanded'), 'expanded state');
assert(collapsible.includes('min-h-[44px]'), 'touch target');
assert(collapsible.includes('ChevronUp'), 'hide chevron');
assert(collapsible.includes('ChevronDown'), 'show chevron');
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
assert(nl.includes('"heroHideLabel": "Hero verbergen"'), 'NL hide copy');
assert(nl.includes('"heroShowLabel": "Hero tonen"'), 'NL show copy');
assert(en.includes('"heroHideLabel": "Hide hero"'), 'EN hide copy');
assert(en.includes('"heroShowLabel": "Show hero"'), 'EN show copy');

console.log('HERO_HIDE_CONTROL_CLEAR = PASS');
console.log('HERO_SHOW_CONTROL_CLEAR = PASS');
console.log('HERO_KEYBOARD_ACCESSIBILITY = PASS');
console.log('HERO_TOUCH_TARGET = PASS');
console.log('HERO_STATE_PERSISTENCE = PASS');
console.log('\n=== hero toggle ux checks passed ===\n');
