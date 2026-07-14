#!/usr/bin/env npx tsx
/**
 * Phase 3F Wave 1 — Homepage HTML size probe (local or prod).
 *
 * Run: npx tsx scripts/probe-homepage-html-phase3fw1.ts
 *
 * Env:
 *   HOME_BASE_URL=https://homecheff.eu  (default http://127.0.0.1:3000)
 */

const baseUrl = (process.env.HOME_BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

async function main() {
  const url = `${baseUrl}/`;
  const started = performance.now();
  const res = await fetch(url, {
    headers: { Accept: 'text/html' },
    cache: 'no-store',
  });
  const ttfbMs = Math.round(performance.now() - started);
  const html = await res.text();
  const totalMs = Math.round(performance.now() - started);
  const bytes = Buffer.byteLength(html, 'utf8');
  const rscChunks = (html.match(/self\.__next_f\.push/g) ?? []).length;
  const blobUrls = (html.match(/blob:/g) ?? []).length;
  const dataUrls = (html.match(/data:image/g) ?? []).length;
  const scriptTags = (html.match(/<script/g) ?? []).length;

  const report = {
    measuredAt: new Date().toISOString(),
    baseUrl,
    url,
    status: res.status,
    htmlBytes: bytes,
    htmlKb: Math.round(bytes / 1024),
    ttfbMs,
    totalDownloadMs: totalMs,
    rscPushChunks: rscChunks,
    blobUrlCount: blobUrls,
    dataImageUrlCount: dataUrls,
    scriptTagCount: scriptTags,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
