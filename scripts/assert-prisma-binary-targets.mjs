#!/usr/bin/env node
/**
 * Guardrail: production must never ship a darwin-only Prisma Query Engine.
 * Trigger: 2026-11-01 Mac `vercel --prebuilt` from gate-h-delivery-release
 * emptied /api/feed and broke /user/* on homecheff.eu.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaPath = resolve(process.cwd(), 'prisma/schema.prisma');
const schema = readFileSync(schemaPath, 'utf8');
const required = [
  'linux-arm64-openssl-3.0.x',
  'debian-openssl-3.0.x',
  'rhel-openssl-3.0.x',
];
const missing = required.filter((target) => !schema.includes(`"${target}"`));
if (missing.length > 0) {
  console.error(
    `[assert-prisma-binary-targets] Missing binaryTargets in prisma/schema.prisma: ${missing.join(', ')}`,
  );
  process.exit(1);
}
if (!/binaryTargets\s*=/.test(schema)) {
  console.error('[assert-prisma-binary-targets] binaryTargets block missing');
  process.exit(1);
}
console.log('[assert-prisma-binary-targets] OK');
