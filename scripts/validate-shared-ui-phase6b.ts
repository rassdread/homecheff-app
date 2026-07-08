#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 6B — Shared UI infrastructure consolidation guard.
 *
 * Phase 6B consolidates shared UI infrastructure WITHOUT redesign. Safe,
 * verifiable consolidations executed this phase:
 *   1. `ui/Spinner` — one shared spinner wrapping the ubiquitous
 *      `Loader2 + animate-spin`, with Button-style sizing (xs/sm/md/lg). Simple
 *      identical inline spinners migrated onto it (ShareButton x2, PaymentButton,
 *      StartChatButton) — rendered classes are equivalent (Tailwind is order-
 *      independent), so there is no visual change.
 *   2. `ui/Modal` — one shared overlay primitive (role="dialog", aria-modal,
 *      Escape-close, scroll-lock, focus move/restore). One safe self-contained
 *      dialog migrated onto it (CreateRolesGateModal) preserving its exact
 *      overlay classes and panel markup.
 *
 * Risky migrations (bottom-sheets, portals, toast pipeline unification, avatar
 * unification, marketplace legacy cards, centered non-card empties) are
 * DOCUMENTED, not executed.
 *
 * Re-asserts the frozen Phase 4/4B/4C/5/6A architecture. Static, dependency-free.
 * Run: npx tsx scripts/validate-shared-ui-phase6b.ts
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

console.log('=== UX-FIN Phase 6B — Shared UI infrastructure guard ===\n');

// --- 6B.2 Shared Spinner primitive ------------------------------------------
console.log('6B.2 Shared Spinner primitive');
const spinner = read('components/ui/Spinner.tsx');
assert(exists('components/ui/Spinner.tsx'), 'components/ui/Spinner.tsx present');
assert(spinner.includes('Loader2') && spinner.includes('animate-spin'), 'Spinner wraps Loader2 + animate-spin');
assert(
  ['xs', 'sm', 'md', 'lg'].every((s) => spinner.includes(`${s}:`)) &&
    spinner.includes("'h-4 w-4'") &&
    spinner.includes("'h-5 w-5'"),
  'Spinner exposes Button-style sizing (xs/sm/md/lg) with matching dimensions',
);
assert(spinner.includes('role="status"') && spinner.includes('srLabel'), 'Spinner supports accessible srLabel (role=status)');

console.log('\n6B.2 Spinner migrations (identical rendered output)');
const spinnerMigrations: [string, string][] = [
  ['components/ui/ShareButton.tsx', 'Spinner size="sm"'],
  ['components/PaymentButton.tsx', 'Spinner size="md"'],
  ['components/chat/StartChatButton.tsx', 'Spinner size="md"'],
];
for (const [file, marker] of spinnerMigrations) {
  const src = read(file);
  assert(src.includes("@/components/ui/Spinner"), `${file} imports shared Spinner`);
  assert(src.includes(marker), `${file} renders <${marker.replace('"', '')}...>`);
  assert(!/\bLoader2\b/.test(src), `${file} no longer references Loader2 directly`);
}
// ShareButton migrated two spinners (sm + xs).
assert(read('components/ui/ShareButton.tsx').includes('Spinner size="xs"'), 'ShareButton also migrated the xs spinner');

// --- 6B.1 Shared Modal primitive --------------------------------------------
console.log('\n6B.1 Shared Modal primitive');
const modal = read('components/ui/Modal.tsx');
assert(exists('components/ui/Modal.tsx'), 'components/ui/Modal.tsx present');
assert(modal.includes('role="dialog"') && modal.includes('aria-modal="true"'), 'Modal sets role=dialog + aria-modal');
assert(modal.includes("e.key === 'Escape'") && modal.includes('closeOnEscape'), 'Modal supports Escape-to-close');
assert(modal.includes("document.body.style.overflow = 'hidden'") && modal.includes('lockScroll'), 'Modal supports body scroll-lock');
assert(modal.includes('previouslyFocused') && modal.includes('.focus?.()'), 'Modal moves + restores focus (a11y)');
assert(modal.includes('closeOnOverlayClick') && modal.includes('e.target === e.currentTarget'), 'Modal supports overlay-click close');

console.log('\n6B.1 Modal migration (CreateRolesGateModal)');
const gate = read('components/create/CreateRolesGateModal.tsx');
assert(gate.includes('@/components/ui/Modal'), 'CreateRolesGateModal imports shared Modal');
assert(gate.includes('<Modal') && gate.includes('labelledById="create-roles-gate-title"'), 'CreateRolesGateModal renders <Modal> preserving aria-labelledby');
assert(
  gate.includes('fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4'),
  'CreateRolesGateModal preserves its exact overlay classes (no visual change)',
);
assert(!/role="dialog"/.test(gate), 'CreateRolesGateModal no longer hand-rolls role=dialog (delegated to Modal)');

// --- 6B.9 Accessibility (shared components) ---------------------------------
console.log('\n6B.9 Accessibility on shared components');
assert(read('components/ui/EmptyState.tsx').includes('role="status"'), 'EmptyState keeps role=status/aria-live');

// --- Performance / prior architecture frozen --------------------------------
console.log('\nPerformance architecture frozen (Phase 4/4B/4C/5/6A)');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
assert(density.includes('useSyncExternalStore') && density.includes('return 2'), 'density: external store + desktop default 2 columns');
assert(geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'), 'mobile feed default single column');
assert(read('lib/feed/home-feed-return-cache.ts').includes('isHomeFeedReturnCacheStale'), 'homepage SWR return cache preserved');
assert(read('lib/runtime/sessionSwrCache.ts').includes('SWR_FRESH_MS'), 'unified SWR cache (4C) preserved');
// 6A invariants still hold
for (const f of ['components/ui/HcButton.tsx', 'components/ui/HcCard.tsx', 'components/ui/HcInput.tsx', 'components/ui/HcTextarea.tsx']) {
  assert(!exists(f), `6A: dead duplicate still absent: ${f}`);
}
for (const guard of [
  'scripts/validate-design-system-phase6a.ts',
  'scripts/validate-unified-feedback-phase5e.ts',
  'scripts/validate-marketplace-polish-phase5d.ts',
  'scripts/validate-discovery-pillars-phase5c.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
  'scripts/validate-discovery2-information-architecture.ts',
]) {
  assert(exists(guard), `prior guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
