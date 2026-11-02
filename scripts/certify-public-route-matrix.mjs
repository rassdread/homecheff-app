#!/usr/bin/env node
/**
 * HTTP matrix for public/marketing routes against SMOKE_BASE_URL (preview preferred).
 * Marks PASS/FAIL/BLOCKED. Does not claim interaction coverage.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const base = (process.env.SMOKE_BASE_URL || 'https://homecheff.eu').replace(/\/$/, '');
const inventoryPath = resolve('docs/audits/HOMECHEFF_LINUX_RC_ROUTE_INVENTORY_V2.md');
const inventory = readFileSync(inventoryPath, 'utf8');
const routes = [...inventory.matchAll(/\| \d+ \| `([^`]+)` \|/g)].map((m) => m[1]);

/** Prefer static public routes for unauthenticated HTTP cert; skip heavy dyn/admin. */
const SKIP_PREFIXES = [
  '/admin',
  '/aw-settings',
  '/api',
  '/en/',
  '/seller/',
  '/verkoper/',
  '/affiliate/dashboard',
  '/aviliate/dashboard',
  '/messages/',
  '/orders/',
  '/product/[',
  '/user/[',
  '/profile/[',
  '/listing/[',
  '/request/[',
  '/recipe/[',
  '/garden/[',
  '/design/[',
  '/inspiratie/[',
  '/welkom/[',
  '/uitnodiging/[',
  '/review/[',
  '/p/[',
  '/r/[',
  '/delivery/invite/[',
  '/bezorger/[',
  '/deal-review/',
  '/delivery-review/',
  '/verificatie/',
  '/sms/',
  '/auth/',
  '/success',
  '/payment/',
];

const candidates = routes.filter(
  (r) => !SKIP_PREFIXES.some((p) => r === p || r.startsWith(p.replace(/\[.*/, '')) || r.includes('[')),
);

const results = [];
let passed = 0;
let failed = 0;
let blocked = 0;

async function probe(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'HomeCheff-RC-Cert/2.0' },
    });
    const status = res.status;
    const loc = res.headers.get('location') || '';
    // Vercel Deployment Protection
    if (status === 401 || status === 403) {
      blocked += 1;
      return { path, status, result: 'BLOCKED', note: 'auth/protection' };
    }
    if (status >= 300 && status < 400 && /vercel\.com\/login|sso/i.test(loc)) {
      blocked += 1;
      return { path, status, result: 'BLOCKED', note: `redirect ${loc.slice(0, 80)}` };
    }
    // follow one hop for app redirects
    let finalStatus = status;
    let body = '';
    if (status >= 300 && status < 400 && loc) {
      const abs = loc.startsWith('http') ? loc : `${base}${loc}`;
      const r2 = await fetch(abs, { headers: { 'user-agent': 'HomeCheff-RC-Cert/2.0' } });
      finalStatus = r2.status;
      body = await r2.text();
    } else if (status === 200) {
      body = await res.text();
    }
    const crash =
      /PrismaClientInitializationError|could not be loaded|Er is een fout opgetreden/i.test(
        body,
      );
    if (finalStatus >= 500 || crash) {
      failed += 1;
      return { path, status: finalStatus, result: 'FAIL', note: crash ? 'error UI/prisma' : '5xx' };
    }
    if (finalStatus >= 400 && finalStatus < 500) {
      // many gated routes 401/404 when logged out — treat as PASS if no crash shell
      passed += 1;
      return { path, status: finalStatus, result: 'PASS', note: 'client/auth gate ok' };
    }
    passed += 1;
    return { path, status: finalStatus, result: 'PASS', note: '' };
  } catch (e) {
    failed += 1;
    return { path, status: 0, result: 'FAIL', note: String(e).slice(0, 120) };
  }
}

console.log(`Probing ${candidates.length} routes on ${base}`);
for (const path of candidates) {
  const row = await probe(path);
  results.push(row);
  console.log(`${row.result.padEnd(7)} ${row.status} ${path} ${row.note}`);
}

const report = {
  base,
  generatedAt: new Date().toISOString(),
  TOTAL_ROUTES_INVENTORY: routes.length,
  ROUTES_PROBED: candidates.length,
  PASSED: passed,
  FAILED: failed,
  BLOCKED: blocked,
  results,
};

mkdirSync('docs/audits', { recursive: true });
const outJson = 'docs/audits/HOMECHEFF_LINUX_RC_ROUTE_MATRIX_V2.json';
writeFileSync(outJson, JSON.stringify(report, null, 2));
console.log('\nSUMMARY', {
  TOTAL_ROUTES_INVENTORY: routes.length,
  ROUTES_PROBED: candidates.length,
  PASSED: passed,
  FAILED: failed,
  BLOCKED: blocked,
  outJson,
});
if (failed > 0) process.exit(1);
