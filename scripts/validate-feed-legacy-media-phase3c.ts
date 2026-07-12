#!/usr/bin/env npx tsx
/**
 * Phase 3C — legacy media critical path guards.
 */
import * as fs from 'node:fs';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

const read = (p: string) => fs.readFileSync(p, 'utf8');

console.log('=== Phase 3C — Legacy media ===\n');

ok('metadata server module exists', fs.existsSync('lib/feed/feed-media-metadata.server.ts'));
ok('legacy sentinel in metadata query', read('lib/feed/feed-media-metadata.server.ts').includes("'legacy'"));
ok('proxy builder in resolve module', read('lib/feed/resolve-feed-media-url.ts').includes('buildFeedMediaProxyUrl'));
ok('feed uses proxy for legacy product', read('app/api/feed/route.ts').includes("buildFeedMediaProxyUrl('product'"));
ok('linked media from metadata helper', read('lib/feed/feed-candidate-window.ts').includes('linkedDishMediaFromPhotoMetadata'));
ok('media route visibility gate retained', read('app/api/feed/media/route.ts').includes('loadVisibleFeedMediaUrl'));
ok('media access server exists', fs.existsSync('lib/feed/feed-media-access.server.ts'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
