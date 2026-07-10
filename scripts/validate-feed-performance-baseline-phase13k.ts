#!/usr/bin/env npx tsx
/**
 * Phase 13K — Feed performance baseline instrumentation guard + live API probe.
 *
 * Run: npx tsx scripts/validate-feed-performance-baseline-phase13k.ts
 *
 * Optional env:
 *   FEED_BASE_URL=https://homecheff.eu  (default: http://127.0.0.1:3000)
 *   FEED_PERF_PROBE=1                   force live HTTP probe even in CI
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

type FeedProbeResult = {
  baseUrl: string;
  endpoint: string;
  status: number;
  ttfbMs: number;
  downloadMs: number;
  totalMs: number;
  responseBytes: number;
  itemCount: number;
  serverTiming: string | null;
  firstImageUrls: string[];
  measuredAt: string;
};

async function probeFeedApi(baseUrl: string): Promise<FeedProbeResult | null> {
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/feed?scope=national&radius=0`;
  const started = performance.now();
  try {
    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const ttfbMs = Math.round(performance.now() - started);
    const buf = Buffer.from(await res.arrayBuffer());
    const downloadMs = Math.round(performance.now() - started - ttfbMs);
    const totalMs = Math.round(performance.now() - started);
    let itemCount = 0;
    let firstImageUrls: string[] = [];
    try {
      const json = JSON.parse(buf.toString('utf8')) as {
        items?: Array<Record<string, unknown>>;
        count?: number;
      };
      const items = json.items ?? [];
      itemCount = json.count ?? items.length;
      firstImageUrls = items.slice(0, 5).map((row) => {
        const images = row.images as unknown;
        let url = '';
        if (Array.isArray(images) && typeof images[0] === 'string') url = images[0];
        else if (typeof row.photo === 'string') url = row.photo;
        else if (typeof row.image === 'string') url = row.image;
        if (url.startsWith('data:')) return `${url.slice(0, 32)}…[base64,${url.length}chars]`;
        return url.slice(0, 200);
      }).filter(Boolean);
    } catch {
      /* keep counts at 0 */
    }
    return {
      baseUrl,
      endpoint,
      status: res.status,
      ttfbMs,
      downloadMs,
      totalMs,
      responseBytes: buf.length,
      itemCount,
      serverTiming: res.headers.get('server-timing'),
      firstImageUrls,
      measuredAt: new Date().toISOString(),
    };
  } catch (e) {
    console.log(`  ⚠️  Feed probe skipped: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

async function main() {
  console.log('=== Phase 13K — Feed Performance Baseline ===\n');

  console.log('13K.1 Deliverables');
  assert(exists('docs/audits/FEED_PERFORMANCE_BASELINE_PHASE13K_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13K_FEED_PERFORMANCE_BASELINE.md'), 'progress doc');
  assert(exists('scripts/validate-feed-performance-baseline-phase13k.ts'), 'validator');
  assert(exists('lib/feed/feed-api-timing.ts'), 'server timing module');
  assert(exists('lib/feed/feed-performance-baseline.ts'), 'client baseline module');

  const apiTiming = read('lib/feed/feed-api-timing.ts');
  const clientBaseline = read('lib/feed/feed-performance-baseline.ts');
  const feedRoute = read('app/api/feed/route.ts');
  const geoFeed = read('components/feed/GeoFeed.tsx');
  const homeClient = read('components/home/HomePageClient.tsx');
  const feedMedia = read('components/feed/feedMedia.tsx');
  const audit = read('docs/audits/FEED_PERFORMANCE_BASELINE_PHASE13K_AUDIT.md');

  console.log('\n13K.2 Server instrumentation');
  assert(apiTiming.includes('createFeedApiTiming'), 'timing factory');
  assert(apiTiming.includes('FEED_PERF_TIMING'), 'env gate');
  assert(feedRoute.includes('createFeedApiTiming'), 'feed route wired');
  assert(feedRoute.includes('Server-Timing'), 'Server-Timing header');
  assert(feedRoute.includes('trust_business_dna_done'), 'trust phase mark');
  assert(!feedRoute.includes('console.log(session'), 'no session PII logging');

  console.log('\n13K.3 Client instrumentation');
  assert(clientBaseline.includes('performance.mark'), 'performance.mark usage');
  assert(clientBaseline.includes('NEXT_PUBLIC_FEED_PERF_BASELINE'), 'client env gate');
  assert(geoFeed.includes('feedPerfIncrementFeedFetch'), 'fetch counter in GeoFeed');
  assert(geoFeed.includes('feed:cache-hit'), 'cache hit milestone');
  assert(geoFeed.includes('feedStartupBlocked'), 'session gate preserved');
  assert(homeClient.includes('home:shell-mounted'), 'homepage shell mark');
  assert(feedMedia.includes('feedPerfMarkFirstImageOnce'), 'first image mark');

  console.log('\n13K.4 No optimization / behavior change');
  assert(!geoFeed.includes('virtualiz'), 'no virtualization added');
  assert(!feedRoute.includes('unstable_cache'), 'no route caching added');
  assert(audit.includes('Do not optimize'), 'audit states measurement-only scope');

  console.log('\n13K.5 Prior validators still present');
  for (const prior of [
    'scripts/validate-mobile-detail-navigation-phase13i.ts',
    'scripts/validate-mobile-filter-scroll-phase13h.ts',
  ]) {
    assert(exists(prior), prior);
  }

  console.log('\n13K.6 Live feed API probe (optional)');
  const baseUrl =
    process.env.FEED_BASE_URL?.trim() ||
    (process.env.FEED_PERF_PROBE === '1' ? 'https://homecheff.eu' : 'http://127.0.0.1:3000');

  await runProbeSection(baseUrl);

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

async function runProbeSection(baseUrl: string) {
  const probe = await probeFeedApi(baseUrl);
  if (probe) {
    assert(probe.status === 200, `GET /api/feed status ${probe.status}`);
    assert(probe.responseBytes > 500, `response size ${probe.responseBytes} bytes`);
    assert(probe.itemCount >= 0, `item count ${probe.itemCount}`);
    const outPath = path.join(
      process.cwd(),
      'docs/audits/feed-performance-baseline-probe-latest.json',
    );
    fs.writeFileSync(outPath, `${JSON.stringify(probe, null, 2)}\n`);
    console.log(`  📄 probe written: docs/audits/feed-performance-baseline-probe-latest.json`);
    console.log(
      `     TTFB=${probe.ttfbMs}ms total=${probe.totalMs}ms size=${Math.round(probe.responseBytes / 1024)}KB items=${probe.itemCount}`,
    );
  } else {
    console.log('  ℹ️  Start dev server or set FEED_BASE_URL / FEED_PERF_PROBE=1 for live probe');
  }
}

void main();
