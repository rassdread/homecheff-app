/**
 * Validators for mobile place-input soft-keyboard / focus retention repair.
 * Asserts focus retention across re-renders — NOT soft-keyboard PASS.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { simulateMobileSheetFocusLifecycle } from '../lib/feed/mobile-sheet-focus-lifecycle';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Location mobile keyboard / focus retention validators ===\n');

// --- Behavioral simulation (focus retention, not keyboard) ---
const buggy = simulateMobileSheetFocusLifecycle({
  effectDepsIncludeUnstableOnClose: true,
  parentRendersWhileOpen: 3,
  userTapsPlaceInputAfterOpen: true,
});
check(
  'pre-fix model: unstable onClose steals place focus on re-render',
  buggy.focusStolenByCleanupCount >= 3 && !buggy.retainedPlaceFocus,
);

const fixed = simulateMobileSheetFocusLifecycle({
  effectDepsIncludeUnstableOnClose: false,
  parentRendersWhileOpen: 5,
  userTapsPlaceInputAfterOpen: true,
});
check(
  'fixed model: place focus retained across parent re-renders',
  fixed.focusStolenByCleanupCount === 0 &&
    fixed.retainedPlaceFocus &&
    fixed.activeAfterRenders === 'place-input',
);

// --- Source: FeedMobileFilterSheet ---
const sheet = read('components/feed/FeedMobileFilterSheet.tsx');
check(
  'sheet focus effect depends only on [open]',
  /useEffect\(\(\) => \{[\s\S]*?\}, \[open\]\);/.test(sheet) &&
    sheet.includes('Focus lifecycle depends ONLY on `open`'),
);
check(
  'sheet does not put onClose in effect dependency array',
  !sheet.includes('}, [open, onClose, focusPlaceOnOpen])') &&
    !sheet.includes('}, [open, onClose])'),
);
check(
  'sheet uses onCloseRef for Escape (stable effect)',
  sheet.includes('onCloseRef.current') && sheet.includes('focusPlaceOnOpenRef'),
);
check(
  'sheet open focus does not call select()',
  !/\.select\??\(/.test(sheet) && sheet.includes('No select()'),
);
check(
  'place input has type=text and inputMode=search',
  sheet.includes('type="text"') &&
    sheet.includes('inputMode="search"') &&
    sheet.includes('enterKeyHint="search"') &&
    sheet.includes('autoComplete="postal-code"'),
);
check(
  'place input uses text-base (16px) for mobile zoom/keyboard stability',
  sheet.includes('placeInputClass') && sheet.includes('text-base'),
);
check(
  'place input not readOnly/disabled',
  !/\breadOnly\b/.test(sheet) &&
    !/id="feed-mobile-place-input"[\s\S]{0,200}\bdisabled\b/.test(sheet),
);
check(
  'label htmlFor matches place input id',
  sheet.includes('htmlFor="feed-mobile-place-input"') &&
    sheet.includes('id="feed-mobile-place-input"'),
);
check(
  'pointerdown focuses input without preventDefault',
  sheet.includes('onPointerDown') &&
    sheet.includes('el.focus()') &&
    !/\.preventDefault\(/.test(
      sheet.slice(
        sheet.indexOf('onPointerDown'),
        sheet.indexOf('onPointerDown') + 350,
      ),
    ),
);
check(
  'Search icon uses pointer-events-none',
  sheet.includes('pointer-events-none absolute left-3'),
);
check(
  'sheet panel stops backdrop click propagation',
  sheet.includes('onClick={(e) => e.stopPropagation()}'),
);

// --- Source: GeoFeed ---
const geo = read('components/feed/GeoFeed.tsx');
check(
  'mobile sheet onClose is stable useCallback',
  geo.includes('closeMobileFilterSheet') &&
    geo.includes('onClose={closeMobileFilterSheet}') &&
    /const closeMobileFilterSheet = useCallback\(/.test(geo),
);
check(
  'mobile choose-place does not run select()/async focus fight on sheet path',
  geo.includes('if (!(feedCompactChrome && !isDesktopSplit))') &&
    !/feedCompactChrome && !isDesktopSplit[\s\S]{0,400}el\.select/.test(geo),
);
check(
  'handlePlaceInput is useCallback (stable prop identity)',
  /const handlePlaceInput = useCallback\(/.test(geo),
);
check(
  'no Keyboard.hide / Capacitor Keyboard blur helpers in GeoFeed',
  !geo.includes('Keyboard.hide') && !geo.includes('@capacitor/keyboard'),
);

// --- Android ---
const manifest = read('android/app/src/main/AndroidManifest.xml');
check(
  'Android MainActivity windowSoftInputMode=adjustResize',
  manifest.includes('android:windowSoftInputMode="adjustResize"'),
);

const mainActivity = read(
  'android/app/src/main/java/eu/homecheff/mobile/MainActivity.java',
);
check(
  'MainActivity does not call blur/Keyboard.hide',
  !mainActivity.includes('Keyboard.hide') &&
    !mainActivity.includes('.blur(') &&
    !mainActivity.includes('clearFocus'),
);

const capConfig = read('capacitor.config.ts');
check(
  'no Capacitor Keyboard.hide plugin wiring required for this fix',
  !capConfig.includes('Keyboard'),
);

// --- Sidebar attributes ---
const filters = read('components/feed/FeedSidebarFilters.tsx');
check(
  'sidebar place inputMode=search type=text text-base',
  filters.includes('id="feed-sidebar-place-input"') &&
    filters.includes('type="text"') &&
    filters.includes('inputMode="search"') &&
    filters.includes('text-base'),
);

console.log(`\n${passed} checks passed`);
