#!/usr/bin/env npx tsx
/**
 * Phase 13L — Feed payload reduction guard.
 *
 * Run: npx tsx scripts/validate-feed-payload-phase13l.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  countInlineDataMediaUrls,
  isInlineDataMediaUrl,
  sanitizeFeedItemForResponse,
  sanitizeFeedMediaUrl,
} from '../lib/feed/sanitize-feed-response-media';
import {
  FEED_FIRST_PAGE_TAKE,
  buildFeedPaginationMeta,
  parseFeedPaginationParams,
} from '../lib/feed/feed-pagination';

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

async function probeFeedPayload(baseUrl: string) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/feed?scope=national&radius=0&take=${FEED_FIRST_PAGE_TAKE}&skip=0&_=${Date.now()}`;
  const started = performance.now();
  const res = await fetch(url, { cache: 'no-store' });
  const ttfbMs = Math.round(performance.now() - started);
  const buf = Buffer.from(await res.arrayBuffer());
  const totalMs = Math.round(performance.now() - started);
  const json = JSON.parse(buf.toString('utf8')) as {
    items?: unknown[];
    pagination?: { take?: number; hasMore?: boolean; total?: number };
  };
  const inlineCount = countInlineDataMediaUrls(json);
  return {
    status: res.status,
    ttfbMs,
    totalMs,
    responseBytes: buf.length,
    itemCount: json.items?.length ?? 0,
    pagination: json.pagination,
    inlineDataUrls: inlineCount,
    cache: res.headers.get('x-vercel-cache'),
  };
}

async function main() {
  console.log('=== Phase 13L — Feed Payload Reduction ===\n');

  console.log('13L.1 Deliverables');
  assert(exists('docs/audits/FEED_PAYLOAD_REDUCTION_PHASE13L_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13L_FEED_PAYLOAD.md'), 'progress doc');
  assert(exists('scripts/validate-feed-payload-phase13l.ts'), 'validator');
  assert(exists('lib/feed/sanitize-feed-response-media.ts'), 'sanitize module');
  assert(exists('lib/feed/feed-pagination.ts'), 'pagination module');

  console.log('\n13L.2 Media sanitizer unit checks');
  assert(isInlineDataMediaUrl('data:image/jpeg;base64,abc'), 'detects data URL');
  assert(
    sanitizeFeedMediaUrl('data:image/png;base64,xyz') === null,
    'strips data URL to null',
  );
  assert(
    sanitizeFeedMediaUrl('https://cdn.example.com/a.jpg') ===
      'https://cdn.example.com/a.jpg',
    'keeps https URL',
  );

  const sampleBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(5000);
  const sanitized = sanitizeFeedItemForResponse({
    id: 'test-1',
    title: 'Test',
    image: sampleBase64,
    images: [sampleBase64, 'https://cdn.example.com/b.jpg'],
    ListingMedia: [{ url: sampleBase64, order: 0 }],
    seller: { avatar: sampleBase64 },
    discovery: { coverImage: sampleBase64 },
  });
  assert(sanitized.image === null, 'cover null when only base64');
  assert(!('images' in sanitized), 'removes images array');
  assert(!('ListingMedia' in sanitized), 'removes ListingMedia array');
  assert(countInlineDataMediaUrls(sanitized) === 0, 'no inline data after sanitize');

  console.log('\n13L.3 Pagination defaults');
  const parsed = parseFeedPaginationParams(null, null);
  assert(parsed.take === FEED_FIRST_PAGE_TAKE, `default take ${FEED_FIRST_PAGE_TAKE}`);
  assert(parsed.skip === 0, 'default skip 0');
  const meta = buildFeedPaginationMeta(10, 0, 29);
  assert(meta.hasMore === true, 'hasMore when total > take');
  assert(meta.hasMore === false || buildFeedPaginationMeta(10, 20, 25).hasMore === false, 'hasMore false at end');

  const feedRoute = read('app/api/feed/route.ts');
  const geoFeed = read('components/feed/GeoFeed.tsx');
  const feedParams = read('lib/feed/feed-query-params.ts');
  const feedMedia = read('components/feed/feedMedia.tsx');
  const audit = read('docs/audits/FEED_PAYLOAD_REDUCTION_PHASE13L_AUDIT.md');

  console.log('\n13L.4 Server wiring');
  assert(feedRoute.includes('sanitizeFeedItemsForResponse'), 'route sanitizes items');
  assert(feedRoute.includes('countInlineDataMediaUrls'), 'route counts inline data guard');
  assert(feedRoute.includes('parseFeedPaginationParams'), 'route parses pagination');
  assert(feedRoute.includes('pagination'), 'route returns pagination');

  console.log('\n13L.5 Client wiring');
  assert(feedParams.includes('FEED_FIRST_PAGE_TAKE'), 'query params set take');
  assert(geoFeed.includes('loadMoreFeed'), 'GeoFeed load-more');
  assert(geoFeed.includes('feedLoadMoreRef'), 'load-more sentinel');
  assert(geoFeed.includes('nearbyScopeAwaitingProfileCoords'), 'scoped session gate');
  assert(!geoFeed.includes('Promise.all([feedP, inspP])'), 'no parallel inspiratie on feed fetch');
  assert(geoFeed.includes('/api/inspiratie?'), 'deferred inspiratie fetch');
  assert(geoFeed.includes('priorityMedia'), 'first tile priority');
  assert(feedMedia.includes('imageLoading'), 'imageLoading prop');

  console.log('\n13L.6 Phase 13K baseline updated');
  const baseline13k = read('docs/audits/FEED_PERFORMANCE_BASELINE_PHASE13K_AUDIT.md');
  assert(baseline13k.includes('Phase 13L') || baseline13k.includes('13L'), '13K doc references 13L after');

  console.log('\n13L.7 Live payload probe (optional)');
  const baseUrl =
    process.env.FEED_BASE_URL?.trim() ||
    (process.env.FEED_PERF_PROBE === '1' ? 'https://homecheff.eu' : 'http://127.0.0.1:3000');
  try {
    const probe = await probeFeedPayload(baseUrl);
    assert(probe.status === 200, `GET /api/feed status ${probe.status}`);
    assert(probe.inlineDataUrls === 0, `inline data URLs in JSON: ${probe.inlineDataUrls}`);
    assert(
      probe.itemCount >= 1 && probe.itemCount <= FEED_FIRST_PAGE_TAKE,
      `first page items ${probe.itemCount} (max ${FEED_FIRST_PAGE_TAKE})`,
    );
    const outPath = path.join(
      process.cwd(),
      'docs/audits/feed-payload-phase13l-probe-latest.json',
    );
    fs.writeFileSync(outPath, `${JSON.stringify({ ...probe, baseUrl, measuredAt: new Date().toISOString() }, null, 2)}\n`);
    console.log(`  📄 probe: docs/audits/feed-payload-phase13l-probe-latest.json`);
    console.log(
      `     ${Math.round(probe.responseBytes / 1024)}KB, ${probe.itemCount} items, inline=${probe.inlineDataUrls}, total=${probe.totalMs}ms`,
    );
    if (probe.responseBytes > 500 * 1024) {
      console.log(`  ⚠️  payload still above 500KB target — see audit for remaining fields`);
    }
  } catch (e) {
    console.log(
      `  ℹ️  Probe skipped (${e instanceof Error ? e.message : String(e)}). Run dev server or deploy, then FEED_BASE_URL=... npx tsx scripts/validate-feed-payload-phase13l.ts`,
    );
  }

  console.log('\n13L.8 Prior phase validators');
  for (const script of [
    'scripts/validate-feed-performance-baseline-phase13k.ts',
    'scripts/validate-mobile-detail-navigation-phase13i.ts',
  ]) {
    assert(exists(script), script);
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

void main();
