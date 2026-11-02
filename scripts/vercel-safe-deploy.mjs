#!/usr/bin/env node
/**
 * Fail-closed wrapper for Vercel CLI deploys.
 * Blocks `vercel --prebuilt` on darwin (root cause of 2026-11-01 outage).
 *
 * Usage:
 *   node scripts/vercel-safe-deploy.mjs --prod --yes
 *   node scripts/vercel-safe-deploy.mjs   # preview
 */
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';

const args = process.argv.slice(2);
const isPrebuilt = args.includes('--prebuilt');
const isDarwin = platform() === 'darwin';

if (isPrebuilt && isDarwin) {
  console.error(
    '[vercel-safe-deploy] REFUSED: --prebuilt on darwin ships a Mac Prisma Query Engine to Linux Vercel.',
  );
  console.error(
    'Use a Vercel Git/Linux source build instead (git push preview/production), or omit --prebuilt so Vercel builds remotely.',
  );
  process.exit(1);
}

if (isPrebuilt) {
  console.warn(
    '[vercel-safe-deploy] WARNING: --prebuilt requires the local prisma generate to include Linux binaryTargets.',
  );
  const check = spawnSync('node', ['scripts/assert-prisma-runtime-engines.mjs'], {
    stdio: 'inherit',
  });
  if (check.status !== 0) process.exit(check.status || 1);
}

const schemaCheck = spawnSync('node', ['scripts/assert-prisma-binary-targets.mjs'], {
  stdio: 'inherit',
});
if (schemaCheck.status !== 0) process.exit(schemaCheck.status || 1);

const result = spawnSync('npx', ['vercel', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
process.exit(result.status ?? 1);
