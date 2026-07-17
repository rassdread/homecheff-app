#!/usr/bin/env npx tsx
/**
 * Static guard: adaptive navbar — compact before clip, CTA outside overflow nav.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const nav = readFileSync('components/NavBar.tsx', 'utf8');
const shell = readFileSync('components/navigation/NavBarShell.tsx', 'utf8');

console.log('=== Navbar adaptive responsive UI validator ===\n');

assert(nav.includes('ml-auto flex items-center'), 'primary action cluster preserved');
assert(nav.includes('createCtaClass'), 'dedicated create CTA class');
assert(nav.includes('hidden xl:flex'), 'secondary text nav starts at xl');
assert(nav.includes('xl:hidden'), 'compact menu below xl');
assert(nav.includes('2xl:hidden'), 'logo icon below 2xl');
assert(nav.includes('hidden 2xl:block') || nav.includes('hidden 2xl:inline'), 'full logo / name at 2xl');
assert(nav.includes('user ? \'hidden lg:inline-flex\' : \'hidden xl:inline-flex\''), 'CTA compact rules');
assert(!nav.includes('overflow-hidden xl:gap'), 'center nav must not clip via overflow-hidden');
assert(!/nav className="[^"]*overflow-hidden/.test(nav), 'desktop nav has no overflow-hidden clip');

assert(shell.includes('pointer-events-none'), 'NavBarShell non-interactive');
assert(shell.includes('xl:flex'), 'shell matches xl desktop nav breakpoint');
assert(shell.includes('xl:hidden'), 'shell hamburger below xl');

console.log('  ✅ CTA outside clipping nav + xl compact menu');
console.log('  ✅ progressive 2xl secondary links + full logo');
console.log('  ✅ NavBarShell non-interactive parity');

console.log('\n=== Result: navbar adaptive UI checks passed ===\n');
