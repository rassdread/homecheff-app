#!/usr/bin/env npx tsx
/**
 * Phase 3E — Vercel ↔ Neon latency facts (read-only).
 */
import { prisma } from '../lib/prisma';

function parseHost(url: string): string {
  try {
    return new URL(url.replace('postgresql://', 'http://')).hostname;
  } catch {
    return 'unknown';
  }
}

function parseRegion(host: string): string {
  const m = host.match(/\.([a-z0-9-]+)\.aws\.neon\.tech/);
  return m?.[1] ?? 'unknown';
}

async function pingQuery(label: string) {
  const start = performance.now();
  await prisma.$queryRaw`SELECT 1 as ok`;
  return { label, ms: Math.round(performance.now() - start) };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const directUrl = process.env.DIRECT_URL ?? '';
  const poolerHost = parseHost(dbUrl);
  const directHost = parseHost(directUrl);

  console.log(JSON.stringify({
    poolerHost,
    directHost,
    neonRegion: parseRegion(poolerHost),
    vercelRegionNote: 'Set in Vercel project settings — typically fra1 (Frankfurt) for EU',
    prismaAccelerate: process.env.PRISMA_ACCELERATE_URL ? 'configured' : 'absent',
    usesPgbouncer: dbUrl.includes('pgbouncer=true') || poolerHost.includes('pooler'),
  }, null, 2));

  const cold: { label: string; ms: number }[] = [];
  for (let i = 0; i < 5; i++) {
    cold.push(await pingQuery(`ping_${i + 1}`));
  }
  console.log('\nsequential_ping_ms', cold.map((c) => c.ms));
  const p50 = [...cold.map((c) => c.ms)].sort((a, b) => a - b)[2];
  console.log('ping_p50_ms', p50);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
