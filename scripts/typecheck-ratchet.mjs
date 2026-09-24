#!/usr/bin/env node
/**
 * Deployment gate for TypeScript.
 *
 * `next build` has typescript.ignoreBuildErrors enabled, so a missing import
 * still ships. This script runs tsc and fails when:
 * - a new error appears that is not in scripts/typecheck-baseline.txt, or
 * - any TS2304 ("Cannot find name") remains. That code is the runtime
 *   ReferenceError class and has zero tolerance.
 *
 * Errors already listed in the baseline stay allowed until they are removed.
 * Fewer errors than the baseline is success; shrink the baseline when you fix one.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'scripts', 'typecheck-baseline.txt');
const ZERO_TOLERANCE = new Set(['TS2304']);

function toSignatures(output) {
  const signatures = [];
  for (const line of output.split('\n')) {
    const match = line.match(/^(.*)\(\d+,\d+\): error (TS\d+): (.*)$/);
    if (!match) continue;
    let file = match[1].replaceAll('\\', '/');
    if (file.startsWith(root.replaceAll('\\', '/'))) {
      file = file.slice(root.length).replace(/^\//, '');
    }
    signatures.push(`${file}\t${match[2]}\t${match[3]}`);
  }
  return [...new Set(signatures)].sort();
}

function runTsc() {
  try {
    return execSync('npx tsc --noEmit --pretty false --incremental false', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.TYPECHECK_NODE_OPTIONS || '--max-old-space-size=6144',
      },
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const stdout = error.stdout?.toString?.() || '';
    const stderr = error.stderr?.toString?.() || '';
    if (error.status == null || /heap out of memory|FATAL ERROR/i.test(stderr)) {
      console.error(stderr || stdout || error.message);
      console.error('Typecheck did not finish. Refusing to treat that as a pass.');
      process.exit(1);
    }
    return `${stdout}\n${stderr}`;
  }
}

if (!fs.existsSync(baselinePath)) {
  console.error(`Missing baseline: ${baselinePath}`);
  process.exit(1);
}

const baseline = fs
  .readFileSync(baselinePath, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));
const baselineSet = new Set(baseline);
const current = toSignatures(runTsc());
const added = current.filter((line) => !baselineSet.has(line));
const zeroTolerance = current.filter((line) => ZERO_TOLERANCE.has(line.split('\t')[1]));
const removed = baseline.filter((line) => !current.includes(line));

console.log(
  `Typecheck ratchet: ${current.length} current, ${baseline.length} baseline, ${added.length} new, ${removed.length} resolved.`,
);

if (zeroTolerance.length) {
  console.error('\nTS2304 is not allowed (unbound name, runtime ReferenceError):\n');
  for (const line of zeroTolerance) console.error(`  ${line}`);
}
if (added.length) {
  console.error('\nNew TypeScript errors (not in the baseline):\n');
  for (const line of added.slice(0, 80)) console.error(`  ${line}`);
  if (added.length > 80) console.error(`  … ${added.length - 80} more`);
}

if (zeroTolerance.length || added.length) process.exit(1);
if (removed.length) {
  console.log(`Baseline can shrink by ${removed.length} resolved error(s).`);
}
console.log('Typecheck ratchet passed.');
