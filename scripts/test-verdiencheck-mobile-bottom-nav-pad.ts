/**
 * VerdienCheck reuses the shared bottom-nav offset token — no local magic spacing.
 *
 *   npx tsx scripts/test-verdiencheck-mobile-bottom-nav-pad.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HC_PAGE_BOTTOM_NAV_PAD } from '../lib/layout/bottomNavInset';

const ROOT = process.cwd();
const wizardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
const impactSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const engineSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/calculator/engine.ts'),
  'utf8',
);
const holidaySrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/wizard/holiday-pay.ts'),
  'utf8',
);
const scenarioSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/wizard/scenario-comparison.ts'),
  'utf8',
);
const chromeSrc = fs.readFileSync(path.join(ROOT, 'components/AppPageChrome.tsx'), 'utf8');
const globalsSrc = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8');
const insetSrc = fs.readFileSync(path.join(ROOT, 'lib/layout/bottomNavInset.ts'), 'utf8');

assert.equal(HC_PAGE_BOTTOM_NAV_PAD, 'max-xl:pb-[var(--hc-bottom-nav-offset)]');
assert.match(wizardSrc, /from '@\/lib\/layout\/bottomNavInset'/);
assert.match(wizardSrc, /HC_PAGE_BOTTOM_NAV_PAD/);
assert.match(wizardSrc, /\$\{HC_PAGE_BOTTOM_NAV_PAD\} xl:pb-10/);
assert.doesNotMatch(wizardSrc, /\bpb-10 pt-2\b/);
assert.doesNotMatch(wizardSrc, /5\.75rem|6\.75rem/);
assert.doesNotMatch(impactSrc, /5\.75rem|6\.75rem|hc-bottom-nav-offset/);
assert.doesNotMatch(engineSrc, /hc-bottom-nav|safe-area-inset-bottom|pb-10/);
assert.doesNotMatch(holidaySrc, /hc-bottom-nav|safe-area-inset-bottom/);
assert.doesNotMatch(scenarioSrc, /hc-bottom-nav|safe-area-inset-bottom/);
assert.match(chromeSrc, /max-lg:pb-\[var\(--hc-bottom-nav-offset\)\]/);
assert.match(
  globalsSrc,
  /--hc-bottom-nav-offset:\s*calc\(\s*var\(--hc-bottom-nav-height\)\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)/,
);
assert.match(
  globalsSrc,
  /html:has\(\[data-verdiencheck-shell\]\):has\(\s*\[data-homecheff-app-chrome\]\[data-bottom-nav-visible='true'\]\s*\)\s*\{[^}]*scroll-padding-bottom:\s*var\(--hc-bottom-nav-offset\)/s,
);
assert.match(globalsSrc, /html\.hc-pwa-standalone/);
assert.match(globalsSrc, /html\.hc-native-capacitor/);
assert.match(insetSrc, /HC_PAGE_BOTTOM_NAV_PAD/);

console.log('verdiencheck-mobile-bottom-nav-pad: PASS');
