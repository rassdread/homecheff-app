/**
 * PHASE 8C §24 — enforce the Refund write boundary.
 *
 * Phase 8B.2 gave Refund one meaning (SELLER_CONSIDERATION_REFUND) but left the
 * invariant resting on a single write path and a schema comment. A database
 * constraint cannot help here: 127 and 100 are both valid integers, and no
 * CHECK can tell a buyer refund from a seller consideration refund. The amount
 * is only wrong relative to a plan the database cannot see.
 *
 * So the enforceable boundary is the set of files allowed to write Refund at
 * all. This test fails when a new writer appears, which turns "someone might
 * reintroduce the bug" into "CI says who, and where".
 *
 *   npx tsx scripts/test-refund-write-boundary.ts
 */
import fs from 'node:fs';
import path from 'node:path';

let failures = 0;
const results: string[] = [];

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    results.push(`  PASS  ${name}`);
    return;
  }
  failures += 1;
  results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

/**
 * The only files permitted to write Refund rows, and why.
 *
 * Adding an entry here is a deliberate act that should be reviewed against the
 * canonical semantic: a row means the gross consideration reversed on ONE leg.
 * Buyer refunds belong in RefundSettlement; transfer reversals belong in
 * Payout, Stripe and settlement resultJson.
 */
const ALLOWED_WRITERS: Record<string, string> = {
  'lib/payments/refund-settlement.ts':
    'canonical writer — seller consideration reversed per leg',
  'lib/hc/marketplace-hc-delivery-refund.ts':
    'courier consideration reversed on a delivery leg',
  'app/api/admin/users/bulk-delete/route.ts':
    'GDPR erasure cascade — deletes only, never creates',
};

/** Writers that were removed in 8B.2 and must not come back. */
const FORBIDDEN_PATTERNS: Array<{ file: string; pattern: RegExp; why: string }> = [
  {
    file: 'lib/payments/recipient-reversal.ts',
    pattern: /refund\s*\.?\s*create/,
    why: 'a transfer reversal is not a seller consideration refund',
  },
  {
    file: 'app/api/stripe/webhook/route.ts',
    pattern: /refund_reversal_/,
    why: 'the transfer.reversed webhook must not mirror reversals into Refund',
  },
];

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'docs', 'scripts', 'prisma']);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** `prisma.refund.create`, `tx.refund.updateMany`, … including across newlines. */
const WRITE_CALL =
  /\b(?:prisma|tx)\s*\.\s*refund\s*\.\s*(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\b/s;

// --- Who writes Refund? ----------------------------------------------------
{
  const found = sourceFiles('.')
    .filter((file) => WRITE_CALL.test(fs.readFileSync(file, 'utf8')))
    .map((f) => f.replace(/^\.\//, ''))
    .sort();

  const unexpected = found.filter((f) => !(f in ALLOWED_WRITERS));
  const missing = Object.keys(ALLOWED_WRITERS).filter((f) => !found.includes(f));

  check(
    'REFUND_WRITERS_ARE_THE_ALLOWED_SET',
    unexpected.length === 0,
    unexpected.length
      ? `new Refund writer(s): ${unexpected.join(', ')}. A Refund row means ` +
        `SELLER_CONSIDERATION_REFUND on one leg. If that is genuinely what this ` +
        `writes, add it to ALLOWED_WRITERS with a reason.`
      : undefined,
  );
  check(
    'ALLOWED_WRITERS_ALL_STILL_EXIST',
    missing.length === 0,
    missing.length ? `stale allowlist entries: ${missing.join(', ')}` : undefined,
  );
  check('AT_LEAST_ONE_WRITER_FOUND', found.length > 0, 'the search itself must work');
}

// --- Did a removed writer come back? ---------------------------------------
for (const { file, pattern, why } of FORBIDDEN_PATTERNS) {
  const src = fs.readFileSync(file, 'utf8');
  const withoutComments = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  check(
    `NO_REFUND_WRITE_IN_${file}`,
    !pattern.test(withoutComments),
    why,
  );
}

// --- Is the invariant still documented where a writer would look? ----------
{
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  check(
    'SCHEMA_DOCUMENTS_CANONICAL_SEMANTIC',
    schema.includes('SELLER_CONSIDERATION_REFUND'),
    'the model comment is the first thing a new writer reads',
  );
  check(
    'SCHEMA_NAMES_WHERE_BUYER_REFUNDS_LIVE',
    schema.includes('RefundSettlement.buyerRefundCents'),
    'a writer needs to be told where the buyer amount belongs instead',
  );
  const engine = fs.readFileSync('lib/payments/refund-settlement.ts', 'utf8');
  check(
    'CANONICAL_WRITER_IS_A_SINGLE_FUNCTION',
    engine.includes('export function sellerConsiderationRefundRows'),
    'row amounts must come from one reviewable place',
  );
}

console.log(`\nPHASE 8C refund write boundary — ${results.length} checks, ${failures} failed\n`);
console.log(results.join('\n'));
if (failures > 0) process.exitCode = 1;
