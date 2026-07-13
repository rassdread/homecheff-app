#!/usr/bin/env node
/**
 * Phase 3E — Production feed probe (safe).
 *
 * Usage:
 *   node scripts/performance/probe-feed-production-phase3e.mjs \
 *     --base-url=https://homecheff.eu --runs=3 --mode=miss
 *
 * For server timing payload also set FEED_PERF_TIMING=1 on target and pass perfProbe=1.
 */
import https from 'node:https';
import http from 'node:http';
import { performance } from 'node:perf_hooks';

function parseArgs(argv) {
  const out = { baseUrl: 'https://homecheff.eu', runs: 3, mode: 'miss', perfProbe: false };
  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) out.baseUrl = arg.split('=')[1];
    if (arg.startsWith('--runs=')) out.runs = Number(arg.split('=')[1]);
    if (arg.startsWith('--mode=')) out.mode = arg.split('=')[1];
    if (arg === '--perf-probe') out.perfProbe = true;
  }
  return out;
}

function fetchFeed(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const start = performance.now();
    const req = lib.get(
      url,
      {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Accept: 'application/json',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            ttfbMs: Math.round(performance.now() - start),
            totalMs: Math.round(performance.now() - start),
            bytes: body.length,
            cache: res.headers['x-vercel-cache'] ?? res.headers['x-cache'] ?? null,
            serverTiming: res.headers['server-timing'] ?? null,
            body: body.toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log('Phase 3E production probe', args);
  const results = [];

  for (let i = 0; i < args.runs; i++) {
    const bust = args.mode === 'miss' ? `&perfBust=${Date.now()}${i}` : '';
    const probe = args.perfProbe ? '&perfProbe=1' : '';
    const url = `${args.baseUrl.replace(/\/$/, '')}/api/feed?scope=national&radius=0&take=10${bust}${probe}`;
    const res = await fetchFeed(url);
    let perf = null;
    let itemCount = 0;
    try {
      const json = JSON.parse(res.body);
      itemCount = json.items?.length ?? 0;
      perf = json.debug?.perf ?? null;
    } catch {
      /* non-json */
    }
    const row = {
      run: i + 1,
      status: res.status,
      clientMs: res.totalMs,
      bytes: res.bytes,
      cache: res.cache,
      itemCount,
      serverTiming: res.serverTiming,
      perfTotalMs: perf?.totalMs ?? null,
      outsideRouteMs:
        perf?.totalMs != null ? Math.max(0, res.totalMs - perf.totalMs) : null,
      dbProductMs: perf?.counts?.dbProductMs ?? perf?.buckets?.['db-product'] ?? null,
      dbProductIdsMs: perf?.counts?.dbProductIdsMs ?? null,
      dbProductHydrateMs: perf?.counts?.dbProductHydrateMs ?? null,
      sellerHydrateMs: perf?.counts?.sellerHydrateMs ?? null,
      dbDishMs: perf?.counts?.dbDishMs ?? perf?.buckets?.['db-dish'] ?? null,
      dbDishUserHydrateMs: perf?.counts?.dbDishUserHydrateMs ?? null,
      dbLinkedMediaMs: perf?.counts?.dbLinkedMediaMs ?? perf?.buckets?.['db-linked-media'] ?? null,
      productMetadataMs: perf?.counts?.productMetadataMs ?? null,
      dishMetadataMs: perf?.counts?.dishMetadataMs ?? null,
      trustMs: perf?.buckets?.trust ?? null,
      trustCacheHits: perf?.trustTiming?.cacheStats?.hits ?? null,
      trustCacheMisses: perf?.trustTiming?.cacheStats?.misses ?? null,
      prismaQueryCount: perf?.counts?.prismaQueryCount ?? perf?.prisma?.queryCount ?? null,
      prismaTotalMs: perf?.counts?.prismaTotalMs ?? perf?.buckets?.prisma ?? null,
      slowestQuery: perf?.prisma?.slowestKey ?? null,
      slowestQueryMs: perf?.prisma?.slowestMs ?? null,
    };
    results.push(row);
    console.log(JSON.stringify(row));
  }

  const warm = results.slice(1);
  const warmAvg =
    warm.length > 0
      ? Math.round(warm.reduce((s, r) => s + r.clientMs, 0) / warm.length)
      : null;
  const nums = (key) => results.map((r) => r[key]).filter((v) => v != null);
  const p50 = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const p95 = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.ceil(s.length * 0.95) - 1];
  };
  console.log('\nsummary', {
    runs: results.length,
    coldClientMs: results[0]?.clientMs,
    warmAvgClientMs: warmAvg,
    clientP50: p50(nums('clientMs')),
    clientP95: p95(nums('clientMs')),
    serverP50: p50(nums('perfTotalMs')),
    serverP95: p95(nums('perfTotalMs')),
    productP50: p50(nums('dbProductMs')),
    dishP50: p50(nums('dbDishMs')),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
