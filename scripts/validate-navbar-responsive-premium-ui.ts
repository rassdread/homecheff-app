#!/usr/bin/env npx tsx
/**
 * Static guard: responsive navbar structure + premium xl recovery without losing auth cluster.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const nav = readFileSync('components/NavBar.tsx', 'utf8');
const shell = readFileSync('components/navigation/NavBarShell.tsx', 'utf8');

console.log('=== Navbar responsive premium UI validator ===\n');

assert(nav.includes('ml-auto flex items-center'), 'auth CTA cluster preserved');
assert(nav.includes('shrink-0'), 'shrink-0 on auth CTAs');
assert(nav.includes('hidden lg:flex'), 'desktop nav lg+ only');
assert(nav.includes('lg:hidden'), 'hamburger below lg');
assert(nav.includes('xl:px-6 xl:py-3 xl:text-base'), 'premium nav sizing from xl');
assert(nav.includes('xl:shadow-lg xl:hover:shadow-xl'), 'register premium shadow from xl');
assert(nav.includes('xl:hover:-translate-y-0.5'), 'register lift hover from xl');
assert(nav.includes('hidden xl:block'), 'logo text breakpoint strategy');
assert(!nav.includes('overflow-visible border-b'), 'header uses overflow-x-clip');

assert(shell.includes('pointer-events-none'), 'NavBarShell non-interactive');
assert(shell.includes('lg:flex'), 'shell matches lg desktop nav breakpoint');

console.log('  ✅ auth cluster + lg/xl breakpoint strategy');
console.log('  ✅ premium xl sizing + register shadow/lift');
console.log('  ✅ NavBarShell pointer-events-none');

console.log('\n=== Result: navbar premium UI checks passed ===\n');
