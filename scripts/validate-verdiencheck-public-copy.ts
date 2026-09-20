/**
 * User-facing production copy must not repeat known threshold myths.
 *
 *   npx tsx scripts/validate-verdiencheck-public-copy.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  findForbiddenPublicCopy,
  type PublicCopyHit,
} from '../lib/verdiencheck/public-copy-patterns';

const ROOT = process.cwd();

const SKIP_DIR = new Set([
  'node_modules',
  '.git',
  '.next',
  'docs',
  'scripts',
  'prisma',
  'coverage',
]);

const SKIP_FILE =
  /(?:from-vercel|FAQ-COMPLIANCE|public-copy-patterns|\.test\.|\.spec\.)/i;

const SCAN_EXT = new Set(['.json', '.ts', '.tsx']);

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full);
    if (SKIP_FILE.test(rel)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (SCAN_EXT.has(path.extname(name))) acc.push(rel);
  }
  return acc;
}

const roots = [
  'public/i18n/nl.json',
  'public/i18n/en.json',
  'app',
  'components',
  'lib/seo',
  'lib/i18n',
];
const files: string[] = [];
for (const rel of roots) {
  const abs = path.join(ROOT, rel);
  if (rel.endsWith('.json')) files.push(rel);
  else files.push(...walk(abs));
}

const hits: PublicCopyHit[] = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  hits.push(...findForbiddenPublicCopy(file, text));
}

if (hits.length > 0) {
  console.error('Forbidden public compliance copy:');
  for (const hit of hits) {
    console.error(`  [${hit.patternId}] ${hit.file}: ${hit.excerpt}`);
  }
}
assert.equal(hits.length, 0, `expected 0 public myth hits, got ${hits.length}`);
console.log(`verdiencheck public-copy validator: PASS (${files.length} files)`);
