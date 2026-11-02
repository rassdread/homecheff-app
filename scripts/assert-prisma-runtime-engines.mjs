#!/usr/bin/env node
/**
 * After `prisma generate`, verify Linux Query Engine binaries are present.
 * Prevents shipping a darwin-only client (2026-11-01 production outage).
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const roots = [
  join(process.cwd(), 'node_modules', '.prisma', 'client'),
  join(process.cwd(), 'node_modules', '@prisma', 'client'),
];

const requiredSubstrings = [
  'linux-arm64-openssl-3.0.x',
  'debian-openssl-3.0.x',
  'rhel-openssl-3.0.x',
];

function listFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) listFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = roots.flatMap((r) => listFiles(r));
const blob = files.map((f) => f.toLowerCase()).join('\n');
const missing = requiredSubstrings.filter((s) => !blob.includes(s.toLowerCase()));

if (missing.length) {
  console.error(
    '[assert-prisma-runtime-engines] Missing generated Query Engine targets:',
    missing.join(', '),
  );
  console.error(
    'Run `npx prisma generate` with binaryTargets including Linux openssl 3 engines.',
  );
  process.exit(1);
}

console.log('[assert-prisma-runtime-engines] OK — Linux engines present');
