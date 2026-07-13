#!/usr/bin/env npx tsx
/**
 * Phase 3F — Feed cache probe (origin MISS / origin HIT+CDN MISS / CDN HIT).
 *
 * Usage:
 *   FEED_PROBE_BASE=https://your-preview.vercel.app npx tsx scripts/probe-feed-cache-phase3f.ts
 */
import * as fs from 'node:fs';

const BASE = (process.env.FEED_PROBE_BASE || 'http://localhost:3000').replace(/\/$/, '');
const RUNS = Number(process.env.FEED_PROBE_RUNS || '5');
const FEED_PATH =
  '/api/feed?scope=national&radius=0&take=10&skip=0&vertical=all';

type ProbeRow = {
  scenario: string;
  run: number;
  status: number;
  ttfbMs: number;
  clientMs: number;
  xVercelCache: string | null;
  originCache: string | null;
  cacheTier: string | null;
};

async function fetchProbe(url: string): Promise<ProbeRow & { bodyLen: number }> {
  const start = performance.now();
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const ttfbMs = performance.now() - start;
  const body = await res.text();
  const clientMs = performance.now() - start;
  let cacheTier: string | null = null;
  let originCache: string | null = res.headers.get('x-feed-origin-cache');
  try {
    const json = JSON.parse(body) as { debug?: { cacheTier?: string; originCacheStatus?: string } };
    cacheTier = json.debug?.cacheTier ?? null;
    originCache = originCache ?? json.debug?.originCacheStatus ?? null;
  } catch {
    /* non-json */
  }
  return {
    scenario: '',
    run: 0,
    status: res.status,
    ttfbMs: Math.round(ttfbMs),
    clientMs: Math.round(clientMs),
    xVercelCache: res.headers.get('x-vercel-cache'),
    originCache,
    cacheTier,
    bodyLen: body.length,
  };
}

function p50(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

async function runScenario(
  scenario: string,
  url: string,
  repeatSameUrl: boolean,
): Promise<ProbeRow[]> {
  const rows: ProbeRow[] = [];
  for (let i = 0; i < RUNS; i++) {
    const target = repeatSameUrl ? url : `${url}${url.includes('?') ? '&' : '?'}_run=${i}`;
    const row = await fetchProbe(target);
    rows.push({ ...row, scenario, run: i + 1 });
    console.log(
      `  ${scenario} #${i + 1}: ${row.status} ttfb=${row.ttfbMs}ms x-vercel-cache=${row.xVercelCache ?? '-'} origin=${row.originCache ?? '-'}`,
    );
  }
  return rows;
}

async function main() {
  console.log(`Phase 3F probe → ${BASE}${FEED_PATH}\n`);

  const bust = `_bust=${Date.now()}`;
  const missUrl = `${BASE}${FEED_PATH}&${bust}`;
  const cdnUrl = `${BASE}${FEED_PATH}`;

  const results: ProbeRow[] = [];
  console.log('A. Origin MISS (unique URL, no perfBust on CDN path)');
  results.push(...(await runScenario('origin_miss', missUrl, false)));

  console.log('\nB. CDN MISS / warm origin (stable URL, first hit)');
  results.push(...(await runScenario('cdn_miss', cdnUrl, false)));

  console.log('\nC. CDN HIT (repeat identical URL)');
  results.push(...(await runScenario('cdn_hit', cdnUrl, true)));

  const summary = {
    probedAt: new Date().toISOString(),
    base: BASE,
    runsPerScenario: RUNS,
    scenarios: ['origin_miss', 'cdn_miss', 'cdn_hit'].map((name) => {
      const subset = results.filter((r) => r.scenario === name);
      return {
        name,
        p50TtfbMs: p50(subset.map((r) => r.ttfbMs)),
        p50ClientMs: p50(subset.map((r) => r.clientMs)),
        samples: subset,
      };
    }),
    baseline: {
      prodWarmOriginServerP50Ms: 2290,
      prodColdOriginMs: [4680, 5376],
      prodCdnHitTtfbMs: [55, 121],
      prodClientWarmMs: 2545,
      prodClientColdMs: 5000,
    },
  };

  const outPath = 'docs/audits/homecheff-performance-phase3f-probe-latest.json';
  fs.mkdirSync('docs/audits', { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n📄 ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
